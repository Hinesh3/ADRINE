import {
  User,
  Doctor,
  Patient,
  Appointment,
  ClinicalNote,
  DashboardData,
  TimeSlot,
  AppointmentStatus,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('adrine_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getDemoUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return handleResponse(res);
  },

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Doctors
  async getDoctors(): Promise<{ doctors: Doctor[] }> {
    const res = await fetch(`${API_BASE}/doctors`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getDoctorAvailability(doctorId: string, date: string): Promise<{
    doctor: Partial<Doctor>;
    date: string;
    slots: TimeSlot[];
  }> {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability?date=${date}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Patients
  async getPatients(params?: {
    search?: string;
    status?: string;
    gender?: string;
    bloodGroup?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    doctorOnly?: string;
  }): Promise<{
    patients: Patient[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          query.append(key, val.toString());
        }
      });
    }
    const res = await fetch(`${API_BASE}/patients?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getPatientById(id: string): Promise<{ patient: Patient }> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createPatient(patientData: Partial<Patient>): Promise<{ patient: Patient; message: string }> {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(res);
  },

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<{ patient: Patient; message: string }> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(res);
  },

  // Appointments
  async getAppointments(params?: {
    doctorId?: string;
    patientId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    appointments: Appointment[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          query.append(key, val.toString());
        }
      });
    }
    const res = await fetch(`${API_BASE}/appointments?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAppointmentById(id: string): Promise<{ appointment: Appointment }> {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createAppointment(appointmentData: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: string;
    reason: string;
    notes?: string;
  }): Promise<{ appointment: Appointment; message: string }> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(res);
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string
  ): Promise<{ appointment: Appointment; message: string }> {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, cancellationReason }),
    });
    return handleResponse(res);
  },

  async rescheduleAppointment(
    id: string,
    data: {
      appointmentDate: string;
      startTime: string;
      endTime: string;
      reason?: string;
    }
  ): Promise<{ appointment: Appointment; message: string }> {
    const res = await fetch(`${API_BASE}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Clinical Notes
  async createClinicalNote(data: {
    patientId: string;
    appointmentId?: string;
    diagnosis: string;
    symptoms?: string;
    prescription?: string;
    vitalSigns?: any;
    clinicalSummary?: string;
    followUpDate?: string;
    markAppointmentCompleted?: boolean;
  }): Promise<{ note: ClinicalNote; message: string }> {
    const res = await fetch(`${API_BASE}/clinical-notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getPatientClinicalNotes(patientId: string): Promise<{ notes: ClinicalNote[] }> {
    const res = await fetch(`${API_BASE}/clinical-notes/patient/${patientId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
