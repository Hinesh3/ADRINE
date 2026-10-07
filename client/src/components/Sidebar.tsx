import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  HeartPulse,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, isReceptionist, isDoctor } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'],
    },
    {
      to: '/patients',
      label: isDoctor ? 'My Patients' : 'Patients Directory',
      icon: Users,
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'],
    },
    {
      to: '/appointments',
      label: isDoctor ? 'My Schedule' : 'Appointments',
      icon: Calendar,
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'],
    },
    ...(isDoctor
      ? [
          {
            to: '/consultations',
            label: 'Clinical Notes',
            icon: Stethoscope,
            roles: ['DOCTOR', 'ADMIN'],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20">
          <HeartPulse className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base tracking-tight flex items-center gap-1.5">
            AuraHealth <span className="text-teal-400 text-xs font-mono px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800">OS</span>
          </h1>
          <p className="text-xs text-slate-400">Outpatient Clinic Suite</p>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Current Session</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
              isDoctor
                ? 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
            }`}
          >
            {user?.role}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-300 font-medium truncate">
          {user?.name}
        </p>
        {isDoctor && user?.doctorSpecialization && (
          <p className="text-[11px] text-teal-400/90 truncate">{user.doctorSpecialization}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Doctor Scope Notice for Doctor view */}
        {isDoctor && (
          <div className="mt-6 p-3 rounded-xl bg-teal-950/30 border border-teal-900/40 text-xs text-teal-300/80">
            <div className="flex items-center gap-1.5 font-semibold text-teal-200 mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Doctor Privacy Guard
            </div>
            Viewing patients and appointments assigned to your care.
          </div>
        )}

        {isReceptionist && (
          <div className="mt-6 p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300/80">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-200 mb-1">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Front Desk Access
            </div>
            Full clinic management: patient admissions & doctor scheduling.
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
