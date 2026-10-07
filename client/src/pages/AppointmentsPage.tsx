import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Filter,
  Search,
  CalendarPlus,
  Clock,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Play,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment, Doctor, AppointmentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { AppointmentModal } from '../components/AppointmentModal';
import { RescheduleModal } from '../components/RescheduleModal';
import { CancelModal } from '../components/CancelModal';
import { ClinicalNoteModal } from '../components/ClinicalNoteModal';
import { useToast } from '../context/ToastContext';

export const AppointmentsPage: React.FC = () => {
  const { isReceptionist, isDoctor, user } = useAuth();
  const { success, error } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Quick Date Shortcut buttons
  const [activeDateTab, setActiveDateTab] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'>('ALL');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [noteApt, setNoteApt] = useState<Appointment | null>(null);

  useEffect(() => {
    api.getDoctors().then((res) => setDoctors(res.doctors));
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let targetDate = dateFilter;
      if (activeDateTab === 'TODAY') {
        targetDate = format(new Date(), 'yyyy-MM-dd');
      } else if (activeDateTab === 'TOMORROW') {
        targetDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      }

      const res = await api.getAppointments({
        doctorId: isDoctor ? undefined : doctorFilter !== 'ALL' ? doctorFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        date: targetDate || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      setAppointments(res.appointments);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      error('Failed to load appointments', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [doctorFilter, statusFilter, typeFilter, dateFilter, activeDateTab, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      success(`Status updated to ${status}`);
      fetchAppointments();
    } catch (err: any) {
      error('Failed to update status', err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            {isDoctor ? 'My Outpatient Appointments' : 'Appointment Operations'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isDoctor
              ? 'Manage your patient consultation slots and mark clinical completions'
              : 'Master scheduling center with conflict engine, status transitions, and doctor filtering'}
          </p>
        </div>

        {isReceptionist && (
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        )}
      </div>

      {/* Date Quick Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Date Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setActiveDateTab('ALL');
                setDateFilter('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDateTab === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => {
                setActiveDateTab('TODAY');
                setDateFilter(format(new Date(), 'yyyy-MM-dd'));
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDateTab === 'TODAY'
                  ? 'bg-white text-teal-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setActiveDateTab('TOMORROW');
                setDateFilter(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDateTab === 'TOMORROW'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Custom Date Picker */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Specific Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setActiveDateTab('CUSTOM');
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-teal-500"
            />
            {dateFilter && (
              <button
                onClick={() => {
                  setDateFilter('');
                  setActiveDateTab('ALL');
                  setPage(1);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code (e.g. APT-2025-0101), patient name, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Doctor Filter (only if Receptionist) */}
            {!isDoctor && (
              <select
                value={doctorFilter}
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user.name} ({d.specialization.split(' ')[0]})
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Types</option>
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="CHECKUP">Routine Checkup</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={CalendarIcon}
              title="No Appointments Found"
              description="No outpatient appointments matched your current date or status filter."
              actionLabel={isReceptionist ? 'Book Appointment' : undefined}
              onAction={isReceptionist ? () => setIsBookModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Attending Doctor</th>
                  <th className="px-6 py-3.5">Chief Reason / Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {apt.startTime} - {apt.endTime}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">{apt.appointmentCode}</span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{apt.patient.patientCode}</span>
                        <span>•</span>
                        <span>{apt.patient.phone}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{apt.doctor.user.name}</p>
                      <p className="text-[11px] text-slate-400">{apt.doctor.specialization}</p>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{apt.reason}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StatusBadge status={apt.type} type="appointmentType" size="sm" />
                      </div>
                      {apt.notes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic truncate">
                          Note: {apt.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={apt.status} />
                      {apt.cancellationReason && (
                        <p className="text-[10px] text-rose-600 mt-1 max-w-[160px] truncate">
                          Reason: {apt.cancellationReason}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Progression buttons */}
                        {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition"
                          >
                            Call In
                          </button>
                        ) : apt.status === 'IN_PROGRESS' ? (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition"
                          >
                            Complete
                          </button>
                        ) : null}

                        {/* Doctor: Add Consultation Note */}
                        {isDoctor && (
                          <button
                            onClick={() => setNoteApt(apt)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition shadow-xs"
                          >
                            Clinical Note
                          </button>
                        )}

                        {/* Receptionist: Reschedule / Cancel */}
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

        {/* Pagination */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <p>
            Showing <strong className="text-slate-900">{appointments.length}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> appointments
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={fetchAppointments}
      />

      <RescheduleModal
        isOpen={!!rescheduleApt}
        appointment={rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        onSuccess={fetchAppointments}
      />

      <CancelModal
        isOpen={!!cancelApt}
        appointment={cancelApt}
        onClose={() => setCancelApt(null)}
        onSuccess={fetchAppointments}
      />

      {noteApt && (
        <ClinicalNoteModal
          isOpen={!!noteApt}
          patient={noteApt.patient}
          appointment={noteApt}
          onClose={() => setNoteApt(null)}
          onSuccess={fetchAppointments}
        />
      )}
    </div>
  );
};
