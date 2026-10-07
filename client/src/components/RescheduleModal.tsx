import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Appointment, TimeSlot } from '../types';
import { useToast } from '../context/ToastContext';

interface RescheduleModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [newDate, setNewDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (appointment && isOpen) {
      setNewDate(appointment.appointmentDate);
      setReason('');
      setConflictError(null);
    }
  }, [appointment, isOpen]);

  useEffect(() => {
    if (appointment && newDate) {
      setLoadingSlots(true);
      setConflictError(null);
      setSelectedSlot(null);

      api
        .getDoctorAvailability(appointment.doctorId, newDate)
        .then((res) => {
          setSlots(res.slots);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingSlots(false));
    }
  }, [appointment, newDate]);

  if (!isOpen || !appointment) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      error('Please select a new time slot');
      return;
    }

    setSubmitting(true);
    setConflictError(null);

    try {
      await api.rescheduleAppointment(appointment.id, {
        appointmentDate: newDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim() || undefined,
      });

      success('Appointment rescheduled successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setConflictError(err.message || 'Rescheduling conflict');
      error('Rescheduling Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Reschedule Appointment</h2>
            <p className="text-xs text-slate-500">
              {appointment.patient.firstName} {appointment.patient.lastName} with Dr. {appointment.doctor.user.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-4">
          {conflictError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Conflict Detected</p>
                <p className="mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p className="font-medium text-slate-800">Current Booking:</p>
            <p className="mt-0.5">
              {appointment.appointmentDate} at {appointment.startTime} - {appointment.endTime}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Select New Date *
            </label>
            <input
              type="date"
              value={newDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Select New Time Slot *
            </label>
            {loadingSlots ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Checking availability...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                {slots.map((slot) => {
                  const isCurrent =
                    slot.startTime === appointment.startTime && newDate === appointment.appointmentDate;
                  const isAvailable = slot.isAvailable || isCurrent;
                  const isSelected = selectedSlot?.startTime === slot.startTime;

                  return (
                    <button
                      type="button"
                      key={slot.startTime}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                        !isAvailable
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
            <input
              type="text"
              placeholder="e.g. Patient requested morning slot, doctor rescheduled surgery"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save New Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
