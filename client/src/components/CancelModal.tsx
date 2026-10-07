import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { useToast } from '../context/ToastContext';

interface CancelModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [reasonCategory, setReasonCategory] = useState('Patient Requested');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fullReason = customReason.trim()
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    try {
      await api.updateAppointmentStatus(appointment.id, 'CANCELLED', fullReason);
      success('Appointment cancelled');
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to cancel appointment', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-base font-bold">Cancel Appointment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancel} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel the appointment for{' '}
            <strong className="text-slate-900">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </strong>{' '}
            on <strong>{appointment.appointmentDate}</strong> at <strong>{appointment.startTime}</strong>?
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Category</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="Patient Requested">Patient Requested</option>
              <option value="Doctor Emergency / Unavailable">Doctor Emergency / Unavailable</option>
              <option value="Patient Feeling Better">Patient Feeling Better</option>
              <option value="Transportation / Weather Issue">Transportation / Weather Issue</option>
              <option value="Duplicate Booking">Duplicate Booking</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Patient called at 08:30 AM to cancel due to fever"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
