import React, { useState } from 'react';
import { X, Activity, Stethoscope, Pill, Calendar, Heart } from 'lucide-react';
import { api } from '../services/api';
import { Patient, Appointment } from '../types';
import { useToast } from '../context/ToastContext';

interface ClinicalNoteModalProps {
  isOpen: boolean;
  patient: Patient;
  appointment?: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClinicalNoteModal: React.FC<ClinicalNoteModalProps> = ({
  isOpen,
  patient,
  appointment,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [prescription, setPrescription] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [markCompleted, setMarkCompleted] = useState(true);

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80 mmHg',
    heartRate: '72 bpm',
    temperature: '98.6 °F',
    respiratoryRate: '16 bpm',
    oxygenSaturation: '99%',
    weightKg: '70',
    heightCm: '175',
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      error('Diagnosis is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.createClinicalNote({
        patientId: patient.id,
        appointmentId: appointment?.id,
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim() || undefined,
        prescription: prescription.trim() || undefined,
        vitalSigns: vitals,
        clinicalSummary: clinicalSummary.trim() || undefined,
        followUpDate: followUpDate || undefined,
        markAppointmentCompleted: markCompleted,
      });

      success('Clinical consultation note recorded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save clinical note', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Clinical Consultation Note</h2>
              <p className="text-xs text-slate-600">
                Patient: <strong>{patient.firstName} {patient.lastName}</strong> ({patient.patientCode})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Patient Safety Alert */}
          {patient.allergies && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <strong>Allergy Alert:</strong> {patient.allergies}
            </div>
          )}

          {/* Vital Signs Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Patient Vital Signs (Recorded Today)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="120/80 mmHg"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Heart Rate</label>
                <input
                  type="text"
                  placeholder="72 bpm"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Temperature</label>
                <input
                  type="text"
                  placeholder="98.6 °F"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">O₂ Saturation</label>
                <input
                  type="text"
                  placeholder="99%"
                  value={vitals.oxygenSaturation}
                  onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Primary Diagnosis & ICD-10 Coding *
              </label>
              <input
                type="text"
                placeholder="e.g. Essential Hypertension (ICD-10 I10), Acute Sinusitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subjective Symptoms & Presentation</label>
              <textarea
                rows={2}
                placeholder="e.g. Patient presents with 3-day history of throbbing unilateral headache and photophobia."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-indigo-500" />
                Prescription & Medication Plan
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Sumatriptan 50mg tab at onset of migraine; Amlodipine 5mg OD morning."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Summary & Advice</label>
              <textarea
                rows={2}
                placeholder="e.g. Urged patient to maintain headache diary, keep hydrated, and report red flag symptoms."
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Recommended Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {appointment && (
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={markCompleted}
                      onChange={(e) => setMarkCompleted(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span>Mark appointment as COMPLETED</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving Note...' : 'Save Clinical Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
