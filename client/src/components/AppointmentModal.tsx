import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, User, Stethoscope, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Doctor, Patient, TimeSlot, AppointmentType } from '../types';
import { useToast } from '../context/ToastContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPatientId?: string;
  preselectedDoctorId?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPatientId,
  preselectedDoctorId,
}) => {
  const { success, error } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || '');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('CONSULTATION');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Load patients and doctors
  useEffect(() => {
    if (isOpen) {
      api.getPatients({ limit: 100 }).then((res) => {
        setPatients(res.patients);
        if (!selectedPatientId && res.patients.length > 0) {
          setSelectedPatientId(preselectedPatientId || res.patients[0].id);
        }
      });

      api.getDoctors().then((res) => {
        setDoctors(res.doctors);
        if (!selectedDoctorId && res.doctors.length > 0) {
          setSelectedDoctorId(preselectedDoctorId || res.doctors[0].id);
        }
      });
    }
  }, [isOpen, preselectedPatientId, preselectedDoctorId]);

  // Load slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && appointmentDate) {
      setLoadingSlots(true);
      setConflictError(null);
      setSelectedSlot(null);

      api
        .getDoctorAvailability(selectedDoctorId, appointmentDate)
        .then((res) => {
          setSlots(res.slots);
          // auto-select first available slot
          const firstAvail = res.slots.find((s) => s.isAvailable);
          if (firstAvail) setSelectedSlot(firstAvail);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDoctorId, appointmentDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      error('Please select a patient');
      return;
    }
    if (!selectedDoctorId) {
      error('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      error('Please select an available time slot');
      return;
    }
    if (!reason.trim()) {
      error('Please enter the reason for visit');
      return;
    }

    setSubmitting(true);
    setConflictError(null);

    try {
      await api.createAppointment({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type: appointmentType,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      success('Appointment scheduled successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setConflictError(err.message || 'Failed to book appointment');
      error('Booking Conflict', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book Outpatient Appointment</h2>
            <p className="text-xs text-slate-500">Schedule patient with conflict-checked doctor availability</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Conflict Error banner if any */}
          {conflictError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Scheduling Conflict</p>
                <p className="mt-0.5 opacity-90">{conflictError}</p>
              </div>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Select Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              required
            >
              <option value="" disabled>
                -- Choose Patient --
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.patientCode}) • {p.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              Attending Doctor *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              required
            >
              <option value="" disabled>
                -- Choose Doctor --
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user.name} — {d.specialization} (${d.consultationFee})
                </option>
              ))}
            </select>
            {selectedDoctorObj && (
              <p className="text-[11px] text-slate-500 mt-1">
                Hours: {selectedDoctorObj.startTime} - {selectedDoctorObj.endTime} • {selectedDoctorObj.workingDays}
              </p>
            )}
          </div>

          {/* Date & Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Appointment Date *
              </label>
              <input
                type="date"
                value={appointmentDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Type</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="CONSULTATION">Consultation (Standard)</option>
                <option value="FOLLOW_UP">Follow-up Visit</option>
                <option value="CHECKUP">Routine Wellness Checkup</option>
                <option value="EMERGENCY">Urgent / Emergency</option>
              </select>
            </div>
          </div>

          {/* Time Slots Availability Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Available Time Slots *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">30-min outpatient slots</span>
            </label>

            {loadingSlots ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                Checking doctor schedule & conflicts...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                No slots configured for this doctor on selected date.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      type="button"
                      key={slot.startTime}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                        !slot.isAvailable
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-600/30'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                      }`}
                    >
                      {slot.startTime}
                      {!slot.isAvailable && <span className="block text-[9px] text-rose-500 font-normal">Booked</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason for Appointment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Chief Complaint / Reason for Visit *
            </label>
            <input
              type="text"
              placeholder="e.g. High blood pressure review, persistent migraine, annual physical"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Optional Internal Staff Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Front Desk Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Patient prefers morning slots, requested wheelchair assistance at entrance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
