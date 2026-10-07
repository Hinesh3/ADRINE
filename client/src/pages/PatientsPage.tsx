import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, PatientStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { PatientModal } from '../components/PatientModal';
import { AppointmentModal } from '../components/AppointmentModal';
import { useToast } from '../context/ToastContext';

export const PatientsPage: React.FC = () => {
  const { isReceptionist, isDoctor } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [bookingPatientId, setBookingPatientId] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.getPatients({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        gender: genderFilter !== 'ALL' ? genderFilter : undefined,
        bloodGroup: bloodGroupFilter !== 'ALL' ? bloodGroupFilter : undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setPatients(res.patients);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      error('Failed to load patients', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, statusFilter, genderFilter, bloodGroupFilter, sortBy, sortOrder]);

  // Debounced search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            {isDoctor ? 'My Patient Registry' : 'Patients Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isDoctor
              ? 'Patients who have upcoming or historical outpatient consultations under your care'
              : 'Complete clinic directory with demographics, records, and search filtering'}
          </p>
        </div>

        {isReceptionist && (
          <button
            onClick={() => {
              setEditingPatient(null);
              setIsPatientModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, patient code (e.g. PT-10001), phone number, or email..."
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

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Blood Group Filter */}
            <select
              value={bloodGroupFilter}
              onChange={(e) => {
                setBloodGroupFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="AB+">AB+</option>
              <option value="O-">O-</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="AB-">AB-</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
              >
                <option value="createdAt">Date Registered</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="dateOfBirth">Age / DOB</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Users}
              title="No Patients Found"
              description={
                search || statusFilter !== 'ALL'
                  ? 'No patient records matched your filter criteria. Try resetting filters.'
                  : 'There are currently no patients registered in the clinic database.'
              }
              actionLabel={search || statusFilter !== 'ALL' ? 'Reset Filters' : isReceptionist ? 'Register Patient' : undefined}
              onAction={() => {
                if (search || statusFilter !== 'ALL') {
                  setSearch('');
                  setStatusFilter('ALL');
                  setGenderFilter('ALL');
                  setBloodGroupFilter('ALL');
                  setPage(1);
                } else if (isReceptionist) {
                  setIsPatientModalOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Contact Info</th>
                  <th className="px-6 py-3.5">Medical Info</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Activity</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="font-semibold text-slate-900 hover:text-teal-600 transition text-left text-sm"
                          >
                            {p.firstName} {p.lastName}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              {p.patientCode}
                            </span>
                            <span>•</span>
                            <span>{p.gender}</span>
                            <span>•</span>
                            <span>DOB: {p.dateOfBirth}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.phone}
                        </p>
                        {p.email && (
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {p.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {p.bloodGroup ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                              {p.bloodGroup}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No blood group</span>
                          )}

                          {p.allergies && (
                            <span
                              title={`Allergies: ${p.allergies}`}
                              className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium text-[10px] border border-amber-200 flex items-center gap-1 max-w-[140px] truncate"
                            >
                              <ShieldAlert className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span className="truncate">{p.allergies}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={p.status} type="patient" />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500">
                      <p>
                        <strong className="text-slate-800 font-semibold">{p._count?.appointments || 0}</strong> visits
                      </p>
                      <p>
                        <strong className="text-slate-800 font-semibold">{p._count?.clinicalNotes || 0}</strong> notes
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/patients/${p.id}`)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                          title="View Full Patient Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isReceptionist && (
                          <>
                            <button
                              onClick={() => {
                                setEditingPatient(p);
                                setIsPatientModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                              title="Edit Patient Information"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setBookingPatientId(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition"
                            >
                              Book
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

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <p>
            Showing <strong className="text-slate-900">{patients.length}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> registered patients
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
      <PatientModal
        isOpen={isPatientModalOpen}
        patientToEdit={editingPatient}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSuccess={() => fetchPatients()}
      />

      <AppointmentModal
        isOpen={!!bookingPatientId}
        preselectedPatientId={bookingPatientId || undefined}
        onClose={() => setBookingPatientId(null)}
        onSuccess={() => fetchPatients()}
      />
    </div>
  );
};
