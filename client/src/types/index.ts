export type UserRole = 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'CHECKUP' | 'EMERGENCY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  doctorId?: string;
  doctorSpecialization?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
  phone?: string;
  bio?: string;
  workingDays: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  weightKg?: string;
  heightCm?: string;
}

export interface ClinicalNote {
  id: string;
  appointmentId?: string;
  appointment?: {
    appointmentDate: string;
    startTime: string;
    type: AppointmentType;
  };
  patientId: string;
  doctorId: string;
  doctor: {
    user: {
      name: string;
      avatar?: string;
    };
  };
  diagnosis: string;
  symptoms?: string;
  prescription?: string;
  vitalSigns?: string; // JSON string
  clinicalSummary?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  appointments?: Appointment[];
  clinicalNotes?: ClinicalNote[];
  _count?: {
    appointments: number;
    clinicalNotes: number;
  };
}

export interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  clinicalNote?: {
    id: string;
    diagnosis: string;
    createdAt: string;
  };
}

export interface DashboardMetrics {
  todayTotal: number;
  todayCompleted: number;
  todayCancelled: number;
  todayInProgress: number;
  todayScheduled: number;
  upcomingTotal: number;
  totalPatients: number;
  allCompletedCount: number;
  allCancelledCount: number;
}

export interface WeeklyActivityPoint {
  date: string;
  displayDate: string;
  isToday: boolean;
  completed: number;
  scheduled: number;
  cancelled: number;
  total: number;
}

export interface DashboardData {
  today: string;
  metrics: DashboardMetrics;
  todayQueue: Appointment[];
  upcomingQueue: Appointment[];
  weeklyActivity: WeeklyActivityPoint[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentId?: string;
}
