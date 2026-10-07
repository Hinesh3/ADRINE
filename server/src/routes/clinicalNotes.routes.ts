import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

const clinicalNoteSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  symptoms: z.string().optional(),
  prescription: z.string().optional(),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.string().optional(),
    temperature: z.string().optional(),
    respiratoryRate: z.string().optional(),
    oxygenSaturation: z.string().optional(),
    weightKg: z.string().optional(),
    heightCm: z.string().optional(),
  }).optional(),
  clinicalSummary: z.string().optional(),
  followUpDate: z.string().optional(),
  markAppointmentCompleted: z.boolean().default(true),
});

// POST /api/clinical-notes - Add clinical note (Doctor only)
router.post(
  '/',
  authenticateToken,
  requireRoles(['DOCTOR', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = clinicalNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
        return;
      }

      const {
        patientId,
        appointmentId,
        diagnosis,
        symptoms,
        prescription,
        vitalSigns,
        clinicalSummary,
        followUpDate,
        markAppointmentCompleted,
      } = parseResult.data;

      // Find the doctorId for current user
      let doctorId = req.user?.doctorId;
      if (!doctorId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: req.user?.id } });
        if (!doc) {
          res.status(400).json({ error: 'Doctor profile not found for current user' });
          return;
        }
        doctorId = doc.id;
      }

      // Check if note already exists for this appointment
      if (appointmentId) {
        const existingNote = await prisma.clinicalNote.findUnique({
          where: { appointmentId },
        });
        if (existingNote) {
          // Update existing note
          const updated = await prisma.clinicalNote.update({
            where: { id: existingNote.id },
            data: {
              diagnosis,
              symptoms: symptoms || null,
              prescription: prescription || null,
              vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
              clinicalSummary: clinicalSummary || null,
              followUpDate: followUpDate || null,
            },
          });
          res.json({ note: updated, message: 'Clinical note updated successfully' });
          return;
        }
      }

      const note = await prisma.clinicalNote.create({
        data: {
          patientId,
          doctorId,
          appointmentId: appointmentId || null,
          diagnosis,
          symptoms: symptoms || null,
          prescription: prescription || null,
          vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null,
          clinicalSummary: clinicalSummary || null,
          followUpDate: followUpDate || null,
        },
        include: {
          doctor: {
            include: { user: { select: { name: true } } },
          },
        },
      });

      // Optionally mark appointment as completed
      if (appointmentId && markAppointmentCompleted) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      res.status(201).json({ note, message: 'Clinical note recorded successfully' });
    } catch (error) {
      console.error('Error creating clinical note:', error);
      res.status(500).json({ error: 'Failed to create clinical note' });
    }
  }
);

// GET /api/clinical-notes/patient/:patientId
router.get(
  '/patient/:patientId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;

      const notes = await prisma.clinicalNote.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, avatar: true } },
            },
          },
          appointment: {
            select: { appointmentDate: true, startTime: true, type: true },
          },
        },
      });

      res.json({ notes });
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
      res.status(500).json({ error: 'Failed to fetch clinical notes' });
    }
  }
);

export default router;
