import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().min(5, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContactName: z.string().optional().or(z.literal('')),
  emergencyContactPhone: z.string().optional().or(z.literal('')),
  bloodGroup: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  medicalHistory: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

// GET /api/patients - List patients with search, filter, sort, pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      status,
      gender,
      bloodGroup,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
      doctorOnly, // optional param or enforced if DOCTOR
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Base query conditions
    const where: any = {};

    // Doctor specific filter: If the user is a DOCTOR and has a doctorId,
    // they can only view patients who have an appointment with them
    if (req.user?.role === 'DOCTOR' && req.user.doctorId) {
      where.appointments = {
        some: {
          doctorId: req.user.doctorId,
        },
      };
    } else if (doctorOnly && req.user?.role === 'ADMIN') {
      where.appointments = {
        some: {
          doctorId: doctorOnly,
        },
      };
    }

    // Status filter (Active, Inactive, Archived)
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Gender filter
    if (gender && gender !== 'ALL') {
      where.gender = gender;
    }

    // Blood Group filter
    if (bloodGroup && bloodGroup !== 'ALL') {
      where.bloodGroup = bloodGroup;
    }

    // Search filter across multiple fields
    if (search.trim()) {
      const searchTerms = search.trim().split(/\s+/);
      where.AND = searchTerms.map(term => ({
        OR: [
          { firstName: { contains: term } },
          { lastName: { contains: term } },
          { patientCode: { contains: term } },
          { phone: { contains: term } },
          { email: { contains: term } },
        ],
      }));
    }

    // Valid sort columns
    const allowedSortColumns = ['firstName', 'lastName', 'createdAt', 'updatedAt', 'dateOfBirth'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [safeSortBy]: safeSortOrder },
        include: {
          appointments: {
            take: 1,
            orderBy: { appointmentDate: 'desc' },
            select: {
              id: true,
              appointmentDate: true,
              startTime: true,
              status: true,
              doctor: {
                select: {
                  user: { select: { name: true } },
                  specialization: true,
                },
              },
            },
          },
          _count: {
            select: { appointments: true, clinicalNotes: true },
          },
        },
      }),
    ]);

    res.json({
      patients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Get single patient with full history
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
          include: {
            doctor: {
              include: {
                user: { select: { name: true, email: true, avatar: true } },
              },
            },
            clinicalNote: true,
          },
        },
        clinicalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // If logged in as Doctor, verify access: doctor must have at least one appointment with this patient
    if (req.user?.role === 'DOCTOR' && req.user.doctorId) {
      const hasAppointment = patient.appointments.some(
        (apt) => apt.doctorId === req.user?.doctorId
      );
      if (!hasAppointment) {
        res.status(403).json({
          error: 'Access restricted: You may only view patient records for patients assigned to you.',
        });
        return;
      }
    }

    res.json({ patient });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

// POST /api/patients - Create patient (Receptionist or Admin)
router.post(
  '/',
  authenticateToken,
  requireRoles(['RECEPTIONIST', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = patientSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
        return;
      }

      // Generate unique patient code (e.g. PT-10482)
      const count = await prisma.patient.count();
      const patientCode = `PT-${(10000 + count + 1).toString()}`;

      const patient = await prisma.patient.create({
        data: {
          ...parseResult.data,
          patientCode,
          email: parseResult.data.email || null,
          address: parseResult.data.address || null,
          emergencyContactName: parseResult.data.emergencyContactName || null,
          emergencyContactPhone: parseResult.data.emergencyContactPhone || null,
          bloodGroup: parseResult.data.bloodGroup || null,
          allergies: parseResult.data.allergies || null,
          medicalHistory: parseResult.data.medicalHistory || null,
        },
      });

      res.status(201).json({ patient, message: 'Patient registered successfully' });
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  }
);

// PUT /api/patients/:id - Update patient (Receptionist or Admin)
router.put(
  '/:id',
  authenticateToken,
  requireRoles(['RECEPTIONIST', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parseResult = patientSchema.partial().safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
        return;
      }

      const existingPatient = await prisma.patient.findUnique({ where: { id } });
      if (!existingPatient) {
        res.status(404).json({ error: 'Patient not found' });
        return;
      }

      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          ...parseResult.data,
          email: parseResult.data.email !== undefined ? parseResult.data.email || null : undefined,
          address: parseResult.data.address !== undefined ? parseResult.data.address || null : undefined,
          emergencyContactName:
            parseResult.data.emergencyContactName !== undefined
              ? parseResult.data.emergencyContactName || null
              : undefined,
          emergencyContactPhone:
            parseResult.data.emergencyContactPhone !== undefined
              ? parseResult.data.emergencyContactPhone || null
              : undefined,
          bloodGroup: parseResult.data.bloodGroup !== undefined ? parseResult.data.bloodGroup || null : undefined,
          allergies: parseResult.data.allergies !== undefined ? parseResult.data.allergies || null : undefined,
          medicalHistory:
            parseResult.data.medicalHistory !== undefined ? parseResult.data.medicalHistory || null : undefined,
        },
      });

      res.json({ patient: updatedPatient, message: 'Patient updated successfully' });
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ error: 'Failed to update patient' });
    }
  }
);

export default router;
