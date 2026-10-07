import React from 'react';
import { AppointmentStatus, PatientStatus, AppointmentType } from '../types';

interface StatusBadgeProps {
  status: AppointmentStatus | PatientStatus | AppointmentType | string;
  type?: 'appointment' | 'patient' | 'appointmentType';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'appointment', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  // Appointment Status styling
  if (type === 'appointment') {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Scheduled
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Confirmed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            In Consultation
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelled
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            No Show
          </span>
        );
      default:
        return <span className={`inline-flex rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{status}</span>;
    }
  }

  // Patient Status styling (Active, Inactive, Archived)
  if (type === 'patient') {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactive
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Archived
          </span>
        );
      default:
        return <span className={`inline-flex rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{status}</span>;
    }
  }

  // Appointment Type styling
  if (type === 'appointmentType') {
    switch (status) {
      case 'CONSULTATION':
        return <span className={`inline-flex rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 ${sizeClasses}`}>Consultation</span>;
      case 'FOLLOW_UP':
        return <span className={`inline-flex rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 ${sizeClasses}`}>Follow-up</span>;
      case 'CHECKUP':
        return <span className={`inline-flex rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 ${sizeClasses}`}>Routine Checkup</span>;
      case 'EMERGENCY':
        return <span className={`inline-flex rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-300 ${sizeClasses}`}>Emergency</span>;
      default:
        return <span className={`inline-flex rounded-md bg-slate-100 text-slate-700 ${sizeClasses}`}>{status}</span>;
    }
  }

  return <span className={`inline-flex rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{status}</span>;
};
