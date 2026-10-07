import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, AlertCircle, Heart, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { Patient, PatientStatus } from '../types';
import { useToast } from '../context/ToastContext';

interface PatientModalProps {
  isOpen: boolean;
  patientToEdit?: Patient | null;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  patientToEdit,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    status: 'ACTIVE' as PatientStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        firstName: patientToEdit.firstName,
        lastName: patientToEdit.lastName,
        dateOfBirth: patientToEdit.dateOfBirth,
        gender: patientToEdit.gender,
        phone: patientToEdit.phone,
        email: patientToEdit.email || '',
        address: patientToEdit.address || '',
        emergencyContactName: patientToEdit.emergencyContactName || '',
        emergencyContactPhone: patientToEdit.emergencyContactPhone || '',
        bloodGroup: patientToEdit.bloodGroup || '',
        allergies: patientToEdit.allergies || '',
        medicalHistory: patientToEdit.medicalHistory || '',
        status: patientToEdit.status || 'ACTIVE',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodGroup: '',
        allergies: '',
        medicalHistory: '',
        status: 'ACTIVE',
      });
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      error('First name and last name are required');
      return;
    }
    if (!formData.dateOfBirth) {
      error('Date of birth is required');
      return;
    }
    if (!formData.phone.trim()) {
      error('Phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      if (patientToEdit) {
        const res = await api.updatePatient(patientToEdit.id, formData);
        success('Patient profile updated successfully');
        onSuccess(res.patient);
      } else {
        const res = await api.createPatient(formData);
        success('New patient registered successfully');
        onSuccess(res.patient);
      }
      onClose();
    } catch (err: any) {
      error(patientToEdit ? 'Failed to update patient' : 'Failed to register patient', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {patientToEdit ? `Edit Patient: ${patientToEdit.firstName} ${patientToEdit.lastName}` : 'Register New Patient'}
            </h2>
            <p className="text-xs text-slate-500">
              {patientToEdit ? `Record Code: ${patientToEdit.patientCode}` : 'Fill in patient demographics & clinical details'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status and Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Demographics & Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Eleanor"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vance"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PatientStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Biological Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Contact & Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                placeholder="123 Health Ave, Suite 400"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (Spouse)"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 999-9999"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Clinical Profile & Allergies */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              Clinical Attributes & Safety
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">Unknown / Not Tested</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin, Shellfish"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/30 text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pre-existing Medical History</label>
              <textarea
                rows={2}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, previous surgeries"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
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
              {submitting ? 'Saving...' : patientToEdit ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
