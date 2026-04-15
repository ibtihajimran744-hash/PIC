import React from 'react';
import { motion } from 'motion/react';
import { Shield, LogOut, Home, Users, GraduationCap, FileText, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface PrincipalPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

export const PrincipalPortal: React.FC<PrincipalPortalProps> = ({ onLogout, adminData }) => {
  const GRADIENT = 'linear-gradient(135deg,#1E40AF,#1E3A8A)'; // Blue for Principal

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f4f6fb]">
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col fixed h-full z-10 shadow-sm">
        <div className="px-6 py-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: GRADIENT }}>
              <Shield size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">PIC Campus</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Principal Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { label: 'Dashboard', icon: Home, active: true },
            { label: 'Staff', icon: Users },
            { label: 'Academics', icon: GraduationCap },
            { label: 'Reports', icon: FileText },
            { label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                item.active ? "text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
              style={item.active ? { background: GRADIENT } : {}}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Welcome, Principal {adminData.full_name}</h1>
          <p className="text-slate-500 mt-1">Here is what's happening at the campus today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Students', value: '1,240', color: 'bg-blue-50 text-blue-600' },
            { label: 'Staff Members', value: '84', color: 'bg-purple-50 text-purple-600' },
            { label: 'Daily Attendance', value: '94%', color: 'bg-emerald-50 text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={cn("text-3xl font-black", stat.color.split(' ')[1])}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Academic report for Class 10A submitted</p>
                  <p className="text-xs text-slate-400">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
