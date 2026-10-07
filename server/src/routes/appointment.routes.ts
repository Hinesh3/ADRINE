import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time format must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time format must be HH:mm'),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'CHECKUP', 'EMERGENCY']).default('CONSULTATION'),
  reason: z.string().min(1, 'Reason for appointment is required'),
  notes: z.string().optional(),
});

const appointmentUpdateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
});

const rescheduleSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time format must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time format must be HH:mm'),
  reason: z.string().optional(),
});

// Helper to check for appointment conflict
export async function checkSlotConflict(
  doctorId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { select: { name: true } } },
  });

  if (!doctor) {
    return { hasConflict: true, error: 'Doctor does not exist' };
  }

  // Check if requested time falls within doctor's working hours
  if (startTime < doctor.startTime || endTime > doctor.endTime) {
    return {
      hasConflict: true,
      error: `Appointment is outside ${doctor.user.name}'s working hours (${doctor.startTime} - ${doctor.endTime}).`,
    };
  }

  // Check overlapping appointments
  const overlapping = await prisma.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      OR: [
        // Slot starts during existing appointment
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        // Slot ends during existing appointment
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        // Slot completely engulfs existing appointment
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
    },
  });

  if (overlapping) {
    return {
      hasConflict: true,
      error: `Conflict detected: Dr. ${doctor.user.name} already has an active appointment (${overlapping.startTime} - ${overlapping.endTime}) with patient ${overlapping.patient.firstName} ${overlapping.patient.lastName}.`,
      conflictingAppointment: overlapping,
    };
  }

  return { hasConflict: false, doctor };
}

// GET /api/appointments - List appointments with filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      doctorId,
      patientId,
      date,
      startDate,
      endDate,
      status,
      type,
      search,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Role-based Doctor scoping: if logged in as DOCTOR, restrict to their appointments
    if (req.user?.role === 'DOCTOR' && req.user.doctorId) {
      where.doctorId = req.user.doctorId;
    } else if (doctorId && doctorId !== 'ALL') {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (date) {
      where.appointmentDate = date;
    } else if (startDate && endDate) {
      where.appointmentDate = { gte: startDate, lte: endDate };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { appointmentCode: { contains: term } },
        { reason: { contains: term } },
        { patient: { firstName: { contains: term } } },
        { patient: { lastName: { contains: term } } },
        { patient: { phone: { contains: term } } },
      ];
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { appointmentDate: 'asc' },
          { startTime: 'asc' },
        ],
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          clinicalNote: {
            select: { id: true, diagnosis: true, createdAt: true },
          },
        },
      }),
    ]);

    res.json({
      appointments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id - Get single appointment details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        clinicalNote: {
          include: {
            doctor: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Role check for Doctor
    if (req.user?.role === 'DOCTOR' && req.user.doctorId && appointment.doctorId !== req.user.doctorId) {
      res.status(403).json({ error: 'Access restricted: You cannot view appointments assigned to other doctors.' });
      return;
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments - Book appointment
router.post(
  '/',
  authenticateToken,
  requireRoles(['RECEPTIONIST', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = appointmentCreateSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
        return;
      }

      const { patientId, doctorId, appointmentDate, startTime, endTime, type, reason, notes } = parseResult.data;

      // Conflict validation check
      const conflictCheck = await checkSlotConflict(doctorId, appointmentDate, startTime, endTime);
      if (conflictCheck.hasConflict) {
        res.status(409).json({ error: conflictCheck.error });
        return;
      }

      // Generate unique appointment code
      const currentYear = new Date().getFullYear();
      const count = await prisma.appointment.count();
      const appointmentCode = `APT-${currentYear}-${(1000 + count + 1).toString()}`;

      const appointment = await prisma.appointment.create({
        data: {
          appointmentCode,
          patientId,
          doctorId,
          appointmentDate,
          startTime,
          endTime,
          type,
          reason,
          notes: notes || null,
          status: 'SCHEDULED',
        },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });

      res.status(201).json({ appointment, message: 'Appointment booked successfully' });
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
);

// PUT /api/appointments/:id/status - Update appointment status (e.g. Complete, Cancel, In Progress)
router.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = appointmentUpdateStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
      return;
    }

    const { status, cancellationReason } = parseResult.data;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    // Role check: If DOCTOR, they can only update their own appointments
    if (req.user?.role === 'DOCTOR' && req.user.doctorId && appointment.doctorId !== req.user.doctorId) {
      res.status(403).json({ error: 'You are not authorized to modify this appointment' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        cancellationReason: status === 'CANCELLED' ? (cancellationReason || 'Cancelled by staff') : null,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    res.json({ appointment: updated, message: `Appointment status updated to ${status}` });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/appointments/:id/reschedule - Reschedule appointment
router.post(
  '/:id/reschedule',
  authenticateToken,
  requireRoles(['RECEPTIONIST', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parseResult = rescheduleSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
        return;
      }

      const { appointmentDate, startTime, endTime, reason } = parseResult.data;

      const appointment = await prisma.appointment.findUnique({ where: { id } });
      if (!appointment) {
        res.status(404).json({ error: 'Appointment not found' });
        return;
      }

      // Check conflict on the new target slot
      const conflictCheck = await checkSlotConflict(
        appointment.doctorId,
        appointmentDate,
        startTime,
        endTime,
        id // exclude current appointment
      );

      if (conflictCheck.hasConflict) {
        res.status(409).json({ error: conflictCheck.error });
        return;
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          appointmentDate,
          startTime,
          endTime,
          status: 'CONFIRMED',
          notes: reason ? `${appointment.notes || ''}\nRescheduled: ${reason}`.trim() : appointment.notes,
        },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });

      res.json({ appointment: updated, message: 'Appointment rescheduled successfully' });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
  }
);

export default router;
