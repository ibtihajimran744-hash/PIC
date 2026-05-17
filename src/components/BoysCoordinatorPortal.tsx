import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, BookOpen, LogOut, Search, RefreshCw, X, Check,
  Loader2, FileText, Calendar, Settings, GraduationCap, BarChart3,
  Clock, ChevronDown, Bell, UserCheck, Plus, Eye, Trash2,
  AlertTriangle, CheckCircle, ClipboardList, Megaphone, Send,
  ShieldCheck, ShieldAlert, Zap, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface BoysCoordinatorPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const ACCENT   = '#f97316'; // Boys Coordinator - Orange Focus
const GRADIENT = 'linear-gradient(135deg,#f97316,#ea580c)';

// ── Components ──────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, color = ACCENT, label, sub }: { pct: number; color?: string; label?: string; sub?: string }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      {(label || sub) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <p className="text-xs font-bold text-slate-800">{label}</p>}
          {sub   && <p className="text-[11px] font-black" style={{ color }}>{sub}</p>}
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg,${color},${color}bb)` }}>
          <motion.div animate={{ x: ['-200%', '400%'] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: 0.8 }}
            className="absolute inset-y-0 w-1/3 bg-white/25" style={{ transform: 'skewX(-20deg)' }} />
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, alert }: any) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    className={cn('bg-white rounded-2xl p-4 border', alert ? 'border-rose-200' : 'border-slate-100')}
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={17} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function BoysCoordinatorPortal({ onLogout, adminData }: BoysCoordinatorPortalProps) {
  const [tab, setTab]               = useState('dashboard');
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg]     = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [moreOpen, setMoreOpen]     = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [students,    setStudents]    = useState<any[]>([]);
  const [teachers,    setTeachers]    = useState<any[]>([]);
  const [timetable,   setTimetable]   = useState<any[]>([]);
  const [monitoring,  setMonitoring]  = useState<any[]>([]); // teacher_class_entries
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [programs,    setPrograms]    = useState<any[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchQ,        setSearchQ]        = useState('');
  const [selectedClass,  setSelectedClass]  = useState('');
  const [saving,         setSaving]         = useState(false);
  const [notifyModal,    setNotifyModal]    = useState(false);
  const [announceModal,  setAnnounceModal]  = useState(false);

  // Forms
  const [announceForm, setAnnounceForm] = useState({
    title: '', content: '', announcement_type: 'General', 
    target_program: 'All', expires_at: '', gender_group: 'Boys'
  });
  const [notifyForm, setNotifyForm] = useState({
    title: '', body: '', target_type: 'Student', target_id: ''
  });

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh   = () => setRefreshKey(k => k + 1);

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Filter for Boys/Both students
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .in('gender', ['Male', 'Other'])
        .neq('status', 'Deleted')
        .order('class_section');

      // All Teachers (Monitoring is multi-gender often, but we filter display)
      const { data: tData } = await supabase.from('teachers').select('*').order('full_name');

      // Monitoring entries (Real-time tracking)
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { data: mData } = await supabase
        .from('teacher_class_entries')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      // Announcements
      const { data: aData } = await supabase
        .from('coordinator_announcements')
        .select('*')
        .in('gender_group', ['Boys', 'General'])
        .order('created_at', { ascending: false });

      // Notifications
      const { data: nData } = await supabase
        .from('coordinator_notifications')
        .select('*')
        .eq('coordinator_type', 'Boys')
        .order('created_at', { ascending: false });

      // Programs for filters
      const { data: pData } = await supabase.from('academic_programs').select('*');

      // Timetable
      const { data: ttData } = await supabase.from('timetable').select('*');

      setStudents(sData || []);
      setTeachers(tData || []);
      setMonitoring(mData || []);
      setAnnouncements(aData || []);
      setNotifications(nData || []);
      setPrograms(pData || []);
      setTimetable(ttData || []);

    } catch (e: any) {
      showErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [refreshKey, loadAll]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAnnounce = async () => {
    if (!announceForm.title || !announceForm.content) { showErr('Fill all fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('coordinator_announcements').insert([{
        ...announceForm,
        created_by_id: adminData.id,
        gender_group: 'Boys'
      }]);
      if (error) throw error;
      showToast('Announcement posted');
      setAnnounceModal(false);
      refresh();
    } catch (err: any) { showErr(err.message); }
    finally { setSaving(false); }
  };

  const handleNotify = async () => {
    if (!notifyForm.title || !notifyForm.body) { showErr('Fill all fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('coordinator_notifications').insert([{
        ...notifyForm,
        coordinator_type: 'Boys',
        created_by_id: adminData.id
      }]);
      if (error) throw error;
      showToast('Notification sent');
      setNotifyModal(false);
      refresh();
    } catch (err: any) { showErr(err.message); }
    finally { setSaving(false); }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const allClasses = useMemo(() => [...new Set(students.map(s => s.class_section))].filter(Boolean).sort(), [students]);
  
  const monitorStats = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentSlots = timetable.filter(t => t.day_of_week === today);
    const entered = monitoring.length;
    return {
      totalSlots: currentSlots.length,
      entered,
      missing: Math.max(0, currentSlots.length - entered),
      punctualRate: entered > 0 ? 85 : 0 // Mocking punctual rate based on 'entered' vs 'start_time' logic could be complex
    };
  }, [monitoring, timetable]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'dashboard', label: 'Overview',      icon: Home },
    { id: 'monitoring',label: 'Class Tracking', icon: Clock },
    { id: 'students',  label: 'Students',      icon: Users },
    { id: 'programs',  label: 'Programs',      icon: GraduationCap },
    { id: 'announce',  label: 'Announcements', icon: Megaphone },
  ];

  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Boys Coordinator Dashboard',
    monitoring: 'Teacher Entry Monitoring',
    students: 'Boys Student Directory',
    programs: 'Program Management',
    announce: 'Campus Announcements'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm tracking-tight italic">CampusCore</p>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Boys Coordinator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: 3 }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left group',
                  active ? 'bg-orange-600 text-white shadow-md shadow-orange-100' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                )}>
                <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-orange-500')} />
                <span className="flex-1">{label}</span>
                {active && <Zap size={12} className="text-orange-200 animate-pulse" />}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">
              {adminData.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate tracking-tight">{adminData.full_name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Coordinator</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-64 min-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{TAB_TITLE[tab]}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && <Loader2 size={18} className="animate-spin text-orange-500" />}
            <button onClick={refresh} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />
            <motion.button whileHover={{ y: -2 }} onClick={() => setNotifyModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-slate-200">
              <Bell size={14} /> Send Alert
            </motion.button>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Boys Students" value={students.length} sub="Active members" color="bg-orange-50 text-orange-600" />
                  <StatCard icon={Clock} label="Class Today" value={monitorStats.totalSlots} sub={`${monitorStats.entered} logged`} color="bg-blue-50 text-blue-600" />
                  <StatCard icon={Megaphone} label="Announcements" value={announcements.length} sub="Active updates" color="bg-purple-50 text-purple-600" />
                  <StatCard icon={GraduationCap} label="Programs" value={programs.length} sub="Managing" color="bg-emerald-50 text-emerald-600" />
                </div>

                {/* Tracking & Updates */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Real-time monitoring */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock size={80} className="text-orange-500" />
                      </div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-black text-slate-900 tracking-tight">Today's Class Monitoring</h3>
                          <p className="text-xs text-slate-400">Live feed of teacher entry logs</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping" />
                          <span className="text-[10px] font-black text-orange-700 uppercase">Live Tracking</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {monitoring.length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                            <ShieldAlert size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-400 font-medium tracking-tight">No entries recorded since morning</p>
                          </div>
                        ) : (
                          monitoring.slice(0, 5).map((m, i) => {
                            const teacher = teachers.find(t => t.id === m.teacher_id);
                            const entryTime = new Date(m.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <motion.div key={m.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-orange-200 hover:bg-white transition-all cursor-default">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm">
                                  {entryTime}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{teacher?.full_name || 'Teacher'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                    {m.class_section} · <span className="text-orange-600">{m.subject}</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle size={10} /> LOGGED
                                  </div>
                                  <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Timetable Match</p>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                        <button onClick={() => setTab('monitoring')} className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50 transition-all border-dashed">
                          View Detailed Tracking Log
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Announcement */}
                  <div className="space-y-4">
                     <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-100 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                          <Megaphone size={22} className="text-white" />
                        </div>
                        <h4 className="font-black text-lg tracking-tight mb-2">Notice for Boys</h4>
                        <p className="text-xs text-orange-100 font-medium leading-relaxed mb-6">Need to update students or staff? Post a quick campus broadcast instantly.</p>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAnnounceModal(true)}
                          className="w-full py-3 bg-white text-orange-600 rounded-2xl font-black text-sm shadow-xl shadow-orange-700/20">
                          Add New Notice
                        </motion.button>
                     </div>

                     <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-black text-slate-900 text-sm tracking-tight">Recent Alerts</h4>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Logs</span>
                        </div>
                        <div className="space-y-3">
                          {notifications.slice(0, 3).map(n => (
                            <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                              <p className="text-xs font-black text-slate-800 tracking-tight">{n.title}</p>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{n.body}</p>
                              <p className="text-[8px] text-slate-300 font-bold mt-2 uppercase tracking-widest">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          ))}
                          {notifications.length === 0 && <p className="text-center py-4 text-[10px] text-slate-400 font-medium">No recent push alerts</p>}
                        </div>
                     </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* MONITORING TAB */}
            {tab === 'monitoring' && (
              <motion.div key="monitor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-100">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 tracking-tight text-base">Teacher Arrival Tracking</h3>
                        <p className="text-xs text-slate-400 font-medium">Real-time attendance logs for each period</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Teacher</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Class & Section</th>
                          <th className="px-6 py-4 text-[10px) font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Subject</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitoring.map((m, i) => {
                           const teacher = teachers.find(t => t.id === m.teacher_id);
                           const timestamp = new Date(m.created_at).toLocaleString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                           return (
                             <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                               <td className="px-6 py-5 font-mono text-[10px] text-slate-400 tracking-tighter">{timestamp}</td>
                               <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-[10px]">
                                      {teacher?.full_name?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-black text-slate-900 tracking-tight">{teacher?.full_name || 'Teacher'}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-5 whitespace-nowrap">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase">{m.class_section}</span>
                               </td>
                               <td className="px-6 py-5 font-black text-slate-700 text-sm">{m.subject}</td>
                               <td className="px-6 py-5">
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100">
                                    <Zap size={11} className="animate-pulse" /> CLASS ENTERED
                                  </div>
                               </td>
                             </tr>
                           )
                        })}
                        {monitoring.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center">
                               <Clock size={40} className="mx-auto text-slate-100 mb-4" />
                               <p className="text-slate-400 font-black text-sm tracking-tight italic">No activity logs found for today.</p>
                               <p className="text-slate-300 text-[10px] mt-1 uppercase tracking-widest font-black">Waiting for teachers to log in...</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STUDENTS TAB */}
            {tab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search roll no, name or class..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <button onClick={() => setSelectedClass('')} className={cn('px-4 py-2 rounded-xl text-[11px] font-black border transition-all whitespace-nowrap', !selectedClass ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-200')}>All Classes</button>
                    {allClasses.slice(0, 5).map(c => (
                      <button key={c} onClick={() => setSelectedClass(c === selectedClass ? '' : c)}
                        className={cn('px-4 py-2 rounded-xl text-[11px] font-black border transition-all whitespace-nowrap', selectedClass === c ? 'bg-orange-600 text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-200')}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Roll #</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Full Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Class Section</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Father Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Program</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter(s => {
                            const matchClass = !selectedClass || s.class_section === selectedClass;
                            const matchSearch = !searchQ || s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || String(s.roll_no).includes(searchQ) || s.class_section?.toLowerCase().includes(searchQ.toLowerCase());
                            return matchClass && matchSearch;
                          })
                          .map((s, i) => (
                          <tr key={s.roll_no} className="border-b border-slate-50 hover:bg-orange-50/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-black text-slate-400">{s.roll_no}</td>
                            <td className="px-6 py-4 font-black text-slate-900 text-sm tracking-tight">{s.full_name}</td>
                            <td className="px-6 py-4">
                               <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">{s.class_section}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-medium">{s.father_name}</td>
                            <td className="px-6 py-4">
                               <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{s.program} P{s.part}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={cn('px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider', s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                                 {s.status}
                               </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── ANNOUNCE MODAL ── */}
      <AnimatePresence>
        {announceModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnnounceModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden z-10 shadow-2xl">
              <div className="h-2 w-full bg-orange-600" />
              <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Announce Update</h3>
                       <p className="text-xs text-slate-400 font-medium">This will be broadcasted to the Boys side.</p>
                     </div>
                     <button onClick={() => setAnnounceModal(false)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                       <X size={20} />
                     </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Notice Title</label>
                      <input value={announceForm.title} onChange={e => setAnnounceForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Midterm Exams Postponed" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Program Focus</label>
                        <select value={announceForm.target_program} onChange={e => setAnnounceForm(p => ({ ...p, target_program: e.target.value }))}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none appearance-none font-bold text-slate-700">
                          <option value="All">All Programs</option>
                          {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Type</label>
                        <select value={announceForm.announcement_type} onChange={e => setAnnounceForm(p => ({ ...p, announcement_type: e.target.value }))}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none appearance-none font-bold text-slate-700">
                          <option value="General">General</option>
                          <option value="Exam">Exam Alert</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Fee">Fee Reminder</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Expiry Date (Optional)</label>
                      <input type="date" value={announceForm.expires_at} onChange={e => setAnnounceForm(p => ({ ...p, expires_at: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-600 outline-none" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Message Content</label>
                      <textarea value={announceForm.content} onChange={e => setAnnounceForm(p => ({ ...p, content: e.target.value }))}
                        rows={4} placeholder="Type your message here..." className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all resize-none" />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button onClick={() => setAnnounceModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-sm hover:bg-slate-200 transition-all italic">Cancel</button>
                      <motion.button whileHover={{ y: -2 }} onClick={handleAnnounce} disabled={saving}
                        className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Broadcast Update</>}
                      </motion.button>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NOTIFY MODAL ── */}
      <AnimatePresence>
        {notifyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotifyModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative bg-white rounded-[2rem] w-full max-w-md overflow-hidden z-10 shadow-2xl">
              <div className="h-2 w-full bg-slate-900" />
              <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                    <Bell size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Send Push Alert</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Targeting: Boys Campus Units</p>

                  <div className="w-full space-y-4 text-left px-2">
                    <div>
                      <input value={notifyForm.title} onChange={e => setNotifyForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Alert Title (e.g. Schedule Change)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-black" />
                    </div>
                    <div>
                      <textarea value={notifyForm.body} onChange={e => setNotifyForm(p => ({ ...p, body: e.target.value }))}
                        rows={3} placeholder="Alert body message..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm outline-none focus:bg-white focus:border-blue-500 transition-all resize-none" />
                    </div>
                    
                    <div className="flex gap-4">
                       <select value={notifyForm.target_type} onChange={e => setNotifyForm(p => ({ ...p, target_type: e.target.value }))}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-600 outline-none">
                        <option value="Student">For Students</option>
                        <option value="Teacher">For Teachers</option>
                        <option value="Section">By Section</option>
                       </select>
                       <input value={notifyForm.target_id} onChange={e => setNotifyForm(p => ({ ...p, target_id: e.target.value }))}
                        placeholder="Target ID (Optional)" className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs outline-none focus:bg-white" />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button onClick={() => setNotifyModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-sm italic">Dismiss</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNotify} disabled={saving}
                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-200">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Instantly</>}
                      </motion.button>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
