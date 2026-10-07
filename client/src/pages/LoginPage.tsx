import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Lock, Mail, ShieldCheck, ArrowRight, Stethoscope, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Please provide email and password');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      success('Authenticated successfully');
      navigate('/dashboard');
    } catch (err: any) {
      error('Authentication failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setSubmitting(true);
    try {
      await login(demoEmail, 'password123');
      success('Logged in with demo credentials');
      navigate('/dashboard');
    } catch (err: any) {
      error('Demo login failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/30 mb-4">
          <HeartPulse className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          AuraHealth <span className="text-teal-400 font-mono text-base px-2 py-0.5 rounded bg-teal-950 border border-teal-800">OS</span>
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Modern Outpatient Clinic Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-850 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800/80 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                placeholder="receptionist@adrineclinic.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition shadow-md disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In to Clinic Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Role Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Logins
              </span>
              <span className="text-[10px] text-teal-400 font-semibold bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                Assessment Ready
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('receptionist@adrineclinic.com')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 group-hover:bg-indigo-900 transition">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Emma Watson</p>
                    <p className="text-[10px] text-slate-400">Receptionist / Front Desk</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded font-mono font-medium">
                  RECEPTIONIST
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.sarah@adrineclinic.com')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800 group-hover:bg-teal-900 transition">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Dr. Sarah Jenkins</p>
                    <p className="text-[10px] text-slate-400">Cardiology & Internal Medicine</p>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded font-mono font-medium">
                  DOCTOR
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.marcus@adrineclinic.com')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800 group-hover:bg-teal-900 transition">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Dr. Marcus Vance</p>
                    <p className="text-[10px] text-slate-400">General Practice & Family Medicine</p>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded font-mono font-medium">
                  DOCTOR
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
