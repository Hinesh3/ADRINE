import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  UserPlus,
  ArrowRightLeft,
  ChevronDown,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User } from '../types';

interface NavbarProps {
  onOpenBookModal?: () => void;
  onOpenPatientModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBookModal, onOpenPatientModal }) => {
  const { user, switchRoleDemo, isReceptionist } = useAuth();
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);

    async function loadDemoUsers() {
      try {
        const res = await api.getDemoUsers();
        setDemoUsers(res.users);
      } catch (err) {
        console.error('Failed to load demo users', err);
      }
    }
    loadDemoUsers();

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Clinic Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Building2 className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-slate-800 font-semibold">Central Outpatient Clinic</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            {currentTime}
          </span>
        </div>
      </div>

      {/* Right Controls: Role Switcher & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Fast Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
            <span>Switch Role (Demo)</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSwitcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Select Demo Account</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">RBAC Test</span>
                </div>
                <div className="space-y-1 mt-1">
                  {demoUsers.map((u) => {
                    const isCurrent = user?.email === u.email;
                    return (
                      <button
                        key={u.id}
                        onClick={async () => {
                          await switchRoleDemo(u.email);
                          setIsSwitcherOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                          isCurrent
                            ? 'bg-teal-50/80 border border-teal-200 text-teal-950 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {u.role === 'DOCTOR' ? u.doctorSpecialization || 'Specialist' : 'Front Desk / Admissions'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            u.role === 'DOCTOR' ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {isReceptionist && (
          <>
            {onOpenPatientModal && (
              <button
                onClick={onOpenPatientModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>New Patient</span>
              </button>
            )}

            {onOpenBookModal && (
              <button
                onClick={onOpenBookModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
