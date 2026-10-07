import { Router } from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all doctors
router.get('/', authenticateToken, async (_req, res): Promise<void> => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get doctor availability & booked slots for a specific date
router.get('/:id/availability', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query as { date?: string };

    if (!date) {
      res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    // Find all active appointments for this doctor on that date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        appointmentDate: date,
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        type: true,
      },
    });

    // Generate standard 30-min time slots between startTime and endTime
    const slots: { startTime: string; endTime: string; isAvailable: boolean; appointmentId?: string }[] = [];
    
    const [startH, startM] = doctor.startTime.split(':').map(Number);
    const [endH, endM] = doctor.endTime.split(':').map(Number);
    const duration = doctor.slotDurationMinutes || 30;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');
      const slotStart = `${slotStartH}:${slotStartM}`;

      const slotEndMinutes = currentMinutes + duration;
      const slotEndH = Math.floor(slotEndMinutes / 60).toString().padStart(2, '0');
      const slotEndM = (slotEndMinutes % 60).toString().padStart(2, '0');
      const slotEnd = `${slotEndH}:${slotEndM}`;

      // Check if this slot overlaps with an existing appointment
      const conflict = existingAppointments.find(
        (apt) => apt.startTime === slotStart || (slotStart >= apt.startTime && slotStart < apt.endTime)
      );

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: !conflict,
        appointmentId: conflict?.id,
      });

      currentMinutes += duration;
    }

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        specialization: doctor.specialization,
        workingDays: doctor.workingDays,
        startTime: doctor.startTime,
        endTime: doctor.endTime,
      },
      date,
      slots,
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch doctor availability' });
  }
});

export default router;
