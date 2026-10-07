import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Stethoscope,
  Clock,
  User,
  Heart,
  Activity,
  FileText,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ClinicalNoteModal } from '../components/ClinicalNoteModal';
import { useToast } from '../context/ToastContext';

export const DoctorConsultationsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAptForNote, setSelectedAptForNote] = useState<Appointment | null>(null);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await api.getAppointments({
        date: today,
        limit: 50,
      });
      setTodayAppointments(res.appointments);
    } catch (err: any) {
      error('Failed to load consultations', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [user]);

  const handleStartConsultation = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, 'IN_PROGRESS');
      success('Patient called in — Consultation In Progress');
      fetchConsultations();
    } catch (err: any) {
      error('Failed to start consultation', err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Doctor Consultation Desk</h1>
              <p className="text-xs text-slate-500">
                Attending: <strong>{user?.name}</strong> • Specialization: {user?.doctorSpecialization}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-slate-800">Today:</span>
          <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Consultations Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            Today's Outpatient Consultations Queue
          </h2>
          <span className="text-xs text-slate-500">
            {todayAppointments.length} assigned appointments today
          </span>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Stethoscope}
              title="No Consultations Scheduled Today"
              description="Your consultation queue is clear for today. New patient arrivals will appear here in real-time."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Patient & Slot Info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-teal-50 text-teal-800 font-mono text-center min-w-[80px] shrink-0 border border-teal-200/60">
                    <span className="text-xs font-bold block">{apt.startTime}</span>
                    <span className="text-[10px] text-teal-600">{apt.endTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </h3>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {apt.patient.patientCode}
                      </span>
                      <StatusBadge status={apt.status} size="sm" />
                      <StatusBadge status={apt.type} type="appointmentType" size="sm" />
                    </div>

                    <p className="text-xs text-slate-700 mt-1.5 font-medium">
                      <strong className="text-slate-900">Chief Complaint:</strong> {apt.reason}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>Age: {apt.patient.dateOfBirth}</span>
                      <span>•</span>
                      <span>Gender: {apt.patient.gender}</span>
                      <span>•</span>
                      <span>Blood Group: <strong className="text-rose-600">{apt.patient.bloodGroup || 'N/A'}</strong></span>
                      {apt.patient.allergies && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Allergies: {apt.patient.allergies}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleStartConsultation(apt.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Start Consultation</span>
                    </button>
                  ) : null}

                  {apt.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setSelectedAptForNote(apt)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{apt.status === 'COMPLETED' ? 'Review / Edit Note' : 'Record Clinical Note'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Note Modal */}
      {selectedAptForNote && (
        <ClinicalNoteModal
          isOpen={!!selectedAptForNote}
          patient={selectedAptForNote.patient}
          appointment={selectedAptForNote}
          onClose={() => setSelectedAptForNote(null)}
          onSuccess={fetchConsultations}
        />
      )}
    </div>
  );
};
