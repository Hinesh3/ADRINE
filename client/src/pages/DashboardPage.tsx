import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  UserPlus,
  CalendarPlus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Play,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { DashboardData, Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { AppointmentModal } from '../components/AppointmentModal';
import { PatientModal } from '../components/PatientModal';
import { RescheduleModal } from '../components/RescheduleModal';
import { CancelModal } from '../components/CancelModal';
import { ClinicalNoteModal } from '../components/ClinicalNoteModal';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { user, isReceptionist, isDoctor } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [noteApt, setNoteApt] = useState<Appointment | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      error('Failed to load dashboard', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleStatusChange = async (appointmentId: string, status: any) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      success(`Appointment marked as ${status}`);
      loadDashboard();
    } catch (err: any) {
      error('Status update failed', err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isDoctor
              ? `Displaying outpatient appointments and assigned patients for ${user?.doctorSpecialization || 'your care'}.`
              : "Here is your outpatient clinic's live operational pulse for today."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {isReceptionist && (
            <>
              <button
                onClick={() => setIsPatientModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <UserPlus className="w-4 h-4 text-teal-600" />
                <span>Add Patient</span>
              </button>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </>
          )}

          {isDoctor && (
            <button
              onClick={() => navigate('/consultations')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Consultation Station</span>
            </button>
          )}
        </div>
      </div>

      {/* Operational KPI Grid */}
      {loading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Appointments"
            value={data.metrics.todayTotal}
            subtitle={`${data.metrics.todayCompleted} completed • ${data.metrics.todayInProgress} in progress`}
            icon={Calendar}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            highlight={true}
          />

          <StatCard
            title="Upcoming (7 Days)"
            value={data.metrics.upcomingTotal}
            subtitle="Scheduled outpatient visits"
            icon={Clock}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />

          <StatCard
            title={isDoctor ? 'Assigned Patients' : 'Total Patients'}
            value={data.metrics.totalPatients}
            subtitle="Registered clinic records"
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />

          <StatCard
            title="Completed All Time"
            value={data.metrics.allCompletedCount}
            subtitle={`${data.metrics.allCancelledCount} cancelled visits`}
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      )}

      {/* Visual Analytics & Activity Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Visualisation */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Weekly Outpatient Activity
              </h2>
              <p className="text-xs text-slate-500">Volume distribution across recent & upcoming days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Completed
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Scheduled
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            {loading || !data ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading activity metrics...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                  <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorScheduled)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Operational Actions & Clinic Insights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Operational Fast Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Quick workflows for front-desk and doctors</p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/appointments')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Manage Schedule</p>
                    <p className="text-[11px] text-slate-500">Filter, book or reschedule visits</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
              </button>

              <button
                onClick={() => navigate('/patients')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Search Patients</p>
                    <p className="text-[11px] text-slate-500">View records, vitals & history</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
              </button>

              {isDoctor && (
                <button
                  onClick={() => navigate('/consultations')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Consultation Notes</p>
                      <p className="text-[11px] text-slate-500">Record diagnoses & prescriptions</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Clinic Status: </span>
            Outpatient department is running on schedule.
          </div>
        </div>
      </div>

      {/* Today's Live Schedule Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Today's Live Appointment Queue
            </h2>
            <p className="text-xs text-slate-500">Real-time status tracking for patients arriving today</p>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
          >
            View Full Calendar <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : !data || data.todayQueue.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Calendar}
              title="No Appointments Today"
              description="There are no scheduled outpatient appointments on the queue for today."
              actionLabel={isReceptionist ? 'Book First Appointment' : undefined}
              onAction={isReceptionist ? () => setIsBookModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Time Slot</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Attending Doctor</th>
                  <th className="px-6 py-3">Reason / Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.todayQueue.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {apt.startTime} - {apt.endTime}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => navigate(`/patients/${apt.patientId}`)}
                        className="font-medium text-teal-700 hover:text-teal-800 text-left hover:underline"
                      >
                        {apt.patient.firstName} {apt.patient.lastName}
                      </button>
                      <p className="text-[11px] text-slate-400 font-mono">{apt.patient.patientCode}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800">{apt.doctor.user.name}</p>
                      <p className="text-[11px] text-slate-400">{apt.doctor.specialization}</p>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs">
                      <p className="truncate text-slate-800">{apt.reason}</p>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">{apt.type}</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Doctor Quick Actions */}
                        {isDoctor && apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setNoteApt(apt)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-[11px] transition shadow-2xs"
                          >
                            Add Note
                          </button>
                        )}

                        {/* Status updates */}
                        {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-medium transition"
                          >
                            Call In
                          </button>
                        ) : apt.status === 'IN_PROGRESS' ? (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-medium transition"
                          >
                            Complete
                          </button>
                        ) : null}

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

      {/* Modals */}
      <AppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={loadDashboard}
      />

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => {
          loadDashboard();
          navigate('/patients');
        }}
      />

      <RescheduleModal
        isOpen={!!rescheduleApt}
        appointment={rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        onSuccess={loadDashboard}
      />

      <CancelModal
        isOpen={!!cancelApt}
        appointment={cancelApt}
        onClose={() => setCancelApt(null)}
        onSuccess={loadDashboard}
      />

      {noteApt && (
        <ClinicalNoteModal
          isOpen={!!noteApt}
          patient={noteApt.patient}
          appointment={noteApt}
          onClose={() => setNoteApt(null)}
          onSuccess={loadDashboard}
        />
      )}
    </div>
  );
};
