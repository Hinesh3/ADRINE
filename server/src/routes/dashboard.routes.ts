import { Router, Response } from 'express';
import { format, addDays, subDays } from 'date-fns';
import prisma from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const isDoctor = req.user?.role === 'DOCTOR' && req.user.doctorId;
    const doctorFilter = isDoctor ? { doctorId: req.user!.doctorId } : {};

    // 1. Today's appointments count & breakdown
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: today,
        ...doctorFilter,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        doctor: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        clinicalNote: {
          select: { id: true, diagnosis: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const todayCount = todayAppointments.length;
    const completedToday = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledToday = todayAppointments.filter((a) => a.status === 'CANCELLED').length;
    const inProgressToday = todayAppointments.filter((a) => a.status === 'IN_PROGRESS').length;
    const scheduledToday = todayAppointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;

    // 2. Upcoming appointments (next 7 days after today)
    const next7Days = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const upcomingCount = await prisma.appointment.count({
      where: {
        appointmentDate: { gt: today, lte: next7Days },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        ...doctorFilter,
      },
    });

    // 3. Total patients count
    let totalPatients = 0;
    if (isDoctor) {
      // Doctor only counts their patients
      totalPatients = await prisma.patient.count({
        where: {
          appointments: {
            some: { doctorId: req.user!.doctorId },
          },
        },
      });
    } else {
      totalPatients = await prisma.patient.count();
    }

    // 4. Overall completed & cancelled all time
    const [allCompletedCount, allCancelledCount] = await Promise.all([
      prisma.appointment.count({
        where: { status: 'COMPLETED', ...doctorFilter },
      }),
      prisma.appointment.count({
        where: { status: 'CANCELLED', ...doctorFilter },
      }),
    ]);

    // 5. Activity Trend (last 6 days + today + next 3 days)
    const trendDates: string[] = [];
    for (let i = 4; i >= 0; i--) {
      trendDates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    for (let i = 1; i <= 2; i++) {
      trendDates.push(format(addDays(new Date(), i), 'yyyy-MM-dd'));
    }

    const weeklyActivity = await Promise.all(
      trendDates.map(async (dateStr) => {
        const [completed, scheduled, cancelled] = await Promise.all([
          prisma.appointment.count({
            where: { appointmentDate: dateStr, status: 'COMPLETED', ...doctorFilter },
          }),
          prisma.appointment.count({
            where: {
              appointmentDate: dateStr,
              status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
              ...doctorFilter,
            },
          }),
          prisma.appointment.count({
            where: { appointmentDate: dateStr, status: 'CANCELLED', ...doctorFilter },
          }),
        ]);

        return {
          date: dateStr,
          displayDate: format(new Date(dateStr + 'T00:00:00'), 'MMM d'),
          isToday: dateStr === today,
          completed,
          scheduled,
          cancelled,
          total: completed + scheduled + cancelled,
        };
      })
    );

    // 6. Next 5 Upcoming Appointments
    const upcomingQueue = await prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: today },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        ...doctorFilter,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 6,
    });

    res.json({
      today,
      metrics: {
        todayTotal: todayCount,
        todayCompleted: completedToday,
        todayCancelled: cancelledToday,
        todayInProgress: inProgressToday,
        todayScheduled: scheduledToday,
        upcomingTotal: upcomingCount,
        totalPatients,
        allCompletedCount,
        allCancelledCount,
      },
      todayQueue: todayAppointments,
      upcomingQueue,
      weeklyActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
