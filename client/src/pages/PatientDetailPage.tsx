import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  Heart,
  Activity,
  Pill,
  ShieldAlert,
  Clock,
  Plus,
  Edit2,
  CalendarPlus,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, Appointment, ClinicalNote } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { PatientModal } from '../components/PatientModal';
import { AppointmentModal } from '../components/AppointmentModal';
import { ClinicalNoteModal } from '../components/ClinicalNoteModal';
import { RescheduleModal } from '../components/RescheduleModal';
import { CancelModal } from '../components/CancelModal';
import { useToast } from '../context/ToastContext';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isReceptionist, isDoctor } = useAuth();
  const { error } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'notes' | 'vitals'>('appointments');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);

  const fetchPatientDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPatientById(id);
      setPatient(res.patient);
    } catch (err: any) {
      error('Failed to load patient record', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 max-w-3xl mx-auto text-center">
        <EmptyState
          icon={AlertCircle}
          title="Patient Record Not Found"
          description="The requested patient record could not be found or you do not have permission to view this record."
          actionLabel="Return to Patients Directory"
          onAction={() => navigate('/patients')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Back Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>

        <div className="flex items-center gap-2.5">
          {isReceptionist && (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <Edit2 className="w-4 h-4 text-slate-500" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => setIsBookModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </>
          )}

          {isDoctor && (
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Add Clinical Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Main ID */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-700 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-teal-500/20 shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {patient.patientCode}
                </span>
                <StatusBadge status={patient.status} type="patient" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span>
                  <strong className="text-slate-700">DOB:</strong> {patient.dateOfBirth}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">Gender:</strong> {patient.gender}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">Blood Group:</strong>{' '}
                  <span className="text-rose-600 font-bold">{patient.bloodGroup || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demographics / Contact Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Direct Contact
              </p>
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                {patient.phone}
              </p>
              {patient.email && (
                <p className="flex items-center gap-1.5 text-slate-600 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient.email}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Emergency Contact
              </p>
              <p className="font-medium text-slate-800">
                {patient.emergencyContactName || 'None recorded'}
              </p>
              <p className="text-slate-600 text-[11px]">
                {patient.emergencyContactPhone || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Alerts Banner */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 flex items-start gap-2.5 text-rose-900">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Drug & Food Allergies</p>
              <p className="mt-0.5 font-medium">
                {patient.allergies ? patient.allergies : 'No known drug or environmental allergies reported.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-2.5 text-blue-900">
            <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Pre-existing Medical History</p>
              <p className="mt-0.5 font-medium">
                {patient.medicalHistory ? patient.medicalHistory : 'No significant chronic conditions on file.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointment History ({patient.appointments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'notes'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Clinical Consultation Notes ({patient.clinicalNotes?.length || 0})
        </button>
      </div>

      {/* Tab Content: Appointments */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {!patient.appointments || patient.appointments.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Calendar}
                title="No Appointment History"
                description="This patient has no registered historical or upcoming appointments."
                actionLabel={isReceptionist ? 'Book Appointment Now' : undefined}
                onAction={() => setIsBookModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Appointment Code</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Attending Doctor</th>
                    <th className="px-6 py-3.5">Chief Complaint / Type</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {patient.appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {apt.appointmentCode}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{apt.appointmentDate}</p>
                        <p className="text-[11px] text-slate-500">{apt.startTime} - {apt.endTime}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{apt.doctor.user.name}</p>
                        <p className="text-[11px] text-slate-400">{apt.doctor.specialization}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-900 font-medium truncate">{apt.reason}</p>
                        <StatusBadge status={apt.type} type="appointmentType" size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={apt.status} />
                        {apt.cancellationReason && (
                          <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate">
                            {apt.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReceptionist && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => setRescheduleApt(apt)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setCancelApt(apt)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-medium transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Clinical Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {!patient.clinicalNotes || patient.clinicalNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12">
              <EmptyState
                icon={Stethoscope}
                title="No Clinical Consultation Notes"
                description="There are no medical notes or diagnostic summaries recorded for this patient yet."
                actionLabel={isDoctor ? 'Record First Clinical Note' : undefined}
                onAction={() => setIsNoteModalOpen(true)}
              />
            </div>
          ) : (
            patient.clinicalNotes.map((note) => {
              let parsedVitals: any = null;
              if (note.vitalSigns) {
                try {
                  parsedVitals = JSON.parse(note.vitalSigns);
                } catch (e) {}
              }

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {note.diagnosis}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Attending: {note.doctor?.user?.name} • Recorded on{' '}
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {note.followUpDate && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Follow-up: {note.followUpDate}
                      </span>
                    )}
                  </div>

                  {/* Vitals Grid if available */}
                  {parsedVitals && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {parsedVitals.bloodPressure && (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">BP</span>
                          <span className="font-semibold text-slate-800">{parsedVitals.bloodPressure}</span>
                        </div>
                      )}
                      {parsedVitals.heartRate && (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Heart Rate</span>
                          <span className="font-semibold text-slate-800">{parsedVitals.heartRate}</span>
                        </div>
                      )}
                      {parsedVitals.temperature && (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Temperature</span>
                          <span className="font-semibold text-slate-800">{parsedVitals.temperature}</span>
                        </div>
                      )}
                      {parsedVitals.oxygenSaturation && (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Oxygen Saturation</span>
                          <span className="font-semibold text-slate-800">{parsedVitals.oxygenSaturation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Symptoms */}
                  {note.symptoms && (
                    <div className="text-xs">
                      <strong className="text-slate-800 font-semibold block mb-0.5">Reported Symptoms:</strong>
                      <p className="text-slate-600 leading-relaxed">{note.symptoms}</p>
                    </div>
                  )}

                  {/* Prescription */}
                  {note.prescription && (
                    <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 text-xs">
                      <strong className="text-teal-900 font-bold flex items-center gap-1.5 mb-1">
                        <Pill className="w-3.5 h-3.5 text-teal-700" />
                        Prescribed Medications & Treatment:
                      </strong>
                      <p className="text-teal-950 font-mono leading-relaxed whitespace-pre-line">
                        {note.prescription}
                      </p>
                    </div>
                  )}

                  {/* Clinical Summary */}
                  {note.clinicalSummary && (
                    <div className="text-xs">
                      <strong className="text-slate-800 font-semibold block mb-0.5">Clinical Impression & Lifestyle Advice:</strong>
                      <p className="text-slate-600 leading-relaxed">{note.clinicalSummary}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      <PatientModal
        isOpen={isEditModalOpen}
        patientToEdit={patient}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchPatientDetails()}
      />

      <AppointmentModal
        isOpen={isBookModalOpen}
        preselectedPatientId={patient.id}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => fetchPatientDetails()}
      />

      <ClinicalNoteModal
        isOpen={isNoteModalOpen}
        patient={patient}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={() => fetchPatientDetails()}
      />

      <RescheduleModal
        isOpen={!!rescheduleApt}
        appointment={rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        onSuccess={() => fetchPatientDetails()}
      />

      <CancelModal
        isOpen={!!cancelApt}
        appointment={cancelApt}
        onClose={() => setCancelApt(null)}
        onSuccess={() => fetchPatientDetails()}
      />
    </div>
  );
};
