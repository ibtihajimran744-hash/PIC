import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, BookOpen, LogOut, Search, RefreshCw, X, Check,
  Loader2, FileText, Calendar, Settings, GraduationCap, BarChart3,
  Clock, ChevronDown, Bell, UserCheck, Plus, Eye, Trash2,
  AlertTriangle, CheckCircle, ClipboardList, Megaphone, Send,
  ShieldCheck, ShieldAlert, Zap, Layers, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface UniCoordinatorPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const ACCENT   = '#0d9488'; // Uni Coordinator - Teal Focus
const GRADIENT = 'linear-gradient(135deg,#0d9488,#0f766e)';

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

export default function UniCoordinatorPortal({ onLogout, adminData }: UniCoordinatorPortalProps) {
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
  const [monitoring,  setMonitoring]  = useState<any[]>([]); 
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
    target_program: 'All', expires_at: '', gender_group: 'University'
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
      // Filter for University students (often mixed or specific program)
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .in('applied_for', ['University', 'Bachelor', 'ADP'])
        .neq('status', 'Deleted')
        .order('class_section');

      const { data: tData } = await supabase.from('teachers').select('*').order('full_name');

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { data: mData } = await supabase
        .from('teacher_class_entries')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false });

      const { data: aData } = await supabase
        .from('coordinator_announcements')
        .select('*')
        .in('gender_group', ['University', 'General'])
        .order('created_at', { ascending: false });

      const { data: nData } = await supabase
        .from('coordinator_notifications')
        .select('*')
        .eq('coordinator_type', 'University')
        .order('created_at', { ascending: false });

      const { data: pData } = await supabase.from('academic_programs').select('*');
      const { data: ttData } = await supabase.from('timetable').select('*');

      setStudents(sData || []);
      setTeachers(tData || []);
      setMonitoring(mData || []);
      setAnnouncements(aData || []);
      setNotifications(nData || []);
      setPrograms(pData || []);
      setTimetable(ttData || []);

    } catch (e: any) { showErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [refreshKey, loadAll]);

  const handleAnnounce = async () => {
    if (!announceForm.title || !announceForm.content) { showErr('Fill all fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('coordinator_announcements').insert([{
        ...announceForm,
        created_by_id: adminData.id,
        gender_group: 'University'
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
        coordinator_type: 'University',
        created_by_id: adminData.id
      }]);
      if (error) throw error;
      showToast('Notification sent');
      setNotifyModal(false);
      refresh();
    } catch (err: any) { showErr(err.message); }
    finally { setSaving(false); }
  };

  const allClasses = useMemo(() => [...new Set(students.map(s => s.class_section))].filter(Boolean).sort(), [students]);
  
  const monitorStats = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentSlots = timetable.filter(t => t.day_of_week === today);
    const entered = monitoring.length;
    return { totalSlots: currentSlots.length, entered, missing: Math.max(0, currentSlots.length - entered) };
  }, [monitoring, timetable]);

  const NAV = [
    { id: 'dashboard', label: 'Overview',      icon: Home },
    { id: 'monitoring',label: 'Tracking',      icon: Clock },
    { id: 'students',  label: 'Students List', icon: Users },
    { id: 'announce',  label: 'Bulletins',     icon: Megaphone },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-teal-200 flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-teal-50 bg-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-100">
              <Layers size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm tracking-tight italic">CampusCore</p>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Uni Coordinator</p>
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
                  active ? 'bg-teal-600 text-white shadow-md shadow-teal-100' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-600'
                )}>
                <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-teal-500')} />
                <span className="flex-1">{label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-50 bg-teal-50/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-teal-100 shadow-sm mb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
              {adminData.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate tracking-tight">{adminData.full_name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-tighter">Academic Coord</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-teal-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-black text-teal-900 tracking-tight">University Academic Coordination</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Ref ID: {adminData.id?.slice(0, 8)} · {new Date().toLocaleDateString('en-PK')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setNotifyModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-100">
              <Bell size={14} /> Send Announcement
            </motion.button>
          </div>
        </header>

        <div className="p-6">
          {tab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Users} label="Total Students" value={students.length} sub="University wing" color="bg-teal-50 text-teal-600" />
                <StatCard icon={Clock} label="Class Today" value={monitorStats.totalSlots} sub={`${monitorStats.entered} logged`} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Megaphone} label="Notices" value={announcements.length} sub="In session" color="bg-purple-50 text-purple-600" />
                <StatCard icon={GraduationCap} label="Uni Programs" value={[...new Set(students.map(s => s.program))].length} color="bg-amber-50 text-amber-600" />
            </motion.div>
          )}

          {tab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white rounded-3xl border border-teal-100 p-6 shadow-sm overflow-hidden relative">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                    <h3 className="font-black text-slate-900 tracking-tight">Active Class Monitoring</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-600 text-[9px] font-black uppercase">
                       <Zap size={10} className="animate-pulse" /> Live Feed
                    </div>
                  </div>
                  <div className="space-y-4">
                    {monitoring.slice(0, 10).map((m, i) => {
                      const teacher = teachers.find(t => t.id === m.teacher_id);
                      return (
                        <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-white border border-teal-100 flex flex-col items-center justify-center font-black text-teal-600 text-[10px] shadow-sm">
                            {new Date(m.created_at).getHours()}:{String(new Date(m.created_at).getMinutes()).padStart(2, '0')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 tracking-tight">{teacher?.full_name || 'Admin'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{m.class_section} · <span className="text-teal-600">{m.subject}</span></p>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
                        </div>
                      );
                    })}
                    {monitoring.length === 0 && <p className="text-center py-20 text-slate-400 text-xs italic font-medium">No system entries found for today.</p>}
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-teal-700/20">
                     <h4 className="text-2xl font-black mb-2 tracking-tight italic">Coordinate Better.</h4>
                     <p className="text-teal-100 text-sm font-medium mb-8 leading-relaxed opacity-80 italic">Manage your university programs, monitor teaching staff, and broadcast essential academic updates instantly.</p>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setAnnounceModal(true)} className="py-4 bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-800/40">New Bulletin</button>
                        <button onClick={() => setTab('monitoring')} className="py-4 bg-white text-teal-800 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-800/20">View History</button>
                     </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-teal-100 p-6 shadow-sm overflow-hidden">
                     <h4 className="font-black text-slate-900 text-sm tracking-tight mb-4">University Level Programs</h4>
                     <div className="space-y-2">
                        {[...new Set(students.map(s => s.program))].filter(Boolean).map(p => (
                          <div key={p} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                             <span className="text-xs font-black text-slate-700">{p}</span>
                             <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-xl shadow-inner">{students.filter(s => s.program === p).length} Enrolled</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {tab === 'monitoring' && (
             <div className="bg-white rounded-3xl border border-teal-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="font-black text-slate-900 text-sm">Detailed Monitoring Log (Uni Wing)</h3>
                   <span className="text-[10px] font-black text-teal-600">{monitoring.length} entries recorded today</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 select-none">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teaching Personnel</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Code</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitoring.map(m => {
                          const t = teachers.find(te => te.id === m.teacher_id);
                          return (
                            <tr key={m.id} className="border-b border-slate-50 hover:bg-teal-50/10 cursor-alias">
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-500 italic">{new Date(m.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs uppercase italic">{t?.full_name?.charAt(0)}</div>
                                   <span className="text-sm font-black text-slate-800 tracking-tight">{t?.full_name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4"><span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-xl text-[10px] font-black tracking-tight">{m.class_section}</span></td>
                              <td className="px-6 py-4 font-bold text-slate-500 text-sm">{m.subject}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {tab === 'students' && (
             <div className="bg-white rounded-3xl border border-teal-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                   <div className="relative flex-1">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by roll number or name..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 outline-none text-sm focus:bg-white focus:border-teal-500 transition-all" />
                   </div>
                   <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-teal-50 hover:text-teal-600 transition-all"><Filter size={18} /></button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll #</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Program</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => !searchQ || s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || String(s.roll_no).includes(searchQ)).map(s => (
                          <tr key={s.roll_no} className="border-b border-slate-50 hover:bg-teal-50/20">
                             <td className="px-6 py-5 font-mono text-[11px] text-slate-400 font-bold">{s.roll_no}</td>
                             <td className="px-6 py-5">
                                <p className="text-sm font-black text-slate-900 tracking-tight">{s.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{s.father_name}</p>
                             </td>
                             <td className="px-6 py-5 whitespace-nowrap">
                                <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-xl text-[10px] font-black">{s.program}</span>
                                <span className="ml-2 text-[10px] text-slate-400 font-bold italic">{s.class_section}</span>
                             </td>
                             <td className="px-6 py-5">
                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest">Active Member</span>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* ANNOUNCE MODAL */}
      <AnimatePresence>
        {announceModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnnounceModal(false)} className="absolute inset-0 bg-teal-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center"><Megaphone size={20} /></div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight italic underline decoration-teal-500">Post University Bulletin</h3>
                </div>
                <div className="space-y-4">
                  <input value={announceForm.title} onChange={e => setAnnounceForm(p => ({ ...p, title: e.target.value }))} placeholder="Bulletin Title (e.g. ADP Midterms)" className="w-full border border-teal-100 rounded-2xl px-5 py-4 text-sm font-black focus:border-teal-500 outline-none shadow-inner bg-slate-50/50" />
                  <textarea value={announceForm.content} onChange={e => setAnnounceForm(p => ({ ...p, content: e.target.value }))} rows={5} placeholder="Write your detailed announcement content here..." className="w-full border border-teal-100 rounded-2xl px-5 py-4 text-sm focus:border-teal-500 outline-none resize-none font-medium text-slate-700 shadow-inner" />
                  <div className="flex gap-4">
                     <button onClick={() => setAnnounceModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-sm rounded-2xl">Cancel</button>
                     <button onClick={handleAnnounce} disabled={saving} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-700/30 flex items-center justify-center gap-2">
                       {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Broadcast bulletin</>}
                     </button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotifyModal(false)} className="absolute inset-0 bg-teal-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white rounded-[2.5rem] w-full max-w-md p-10 text-center z-10 shadow-2xl border-b-8 border-teal-600">
               <div className="w-20 h-20 rounded-[2rem] bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-6 shadow-inner border border-teal-100"><Bell size={32} /></div>
               <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Academic Push Alert</h3>
               <p className="text-[10px] text-slate-400 font-black mb-8 uppercase tracking-[0.2em] italic">Instant Campus Transmission</p>
               <div className="space-y-4">
                 <input value={notifyForm.title} onChange={e => setNotifyForm(p => ({ ...p, title: e.target.value }))} placeholder="Alert Headline" className="w-full border-2 border-teal-50 rounded-2xl px-6 py-4 text-sm font-black focus:border-teal-500 outline-none bg-slate-50/50 italic tracking-tight" />
                 <textarea value={notifyForm.body} onChange={e => setNotifyForm(p => ({ ...p, body: e.target.value }))} placeholder="Message Body..." className="w-full border-2 border-teal-50 rounded-2xl px-6 py-4 text-sm outline-none focus:border-teal-500 resize-none font-bold" />
                 <button onClick={handleNotify} disabled={saving} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-teal-900/30">
                   {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={18} className="rotate-12" /> Transmit Push Notification</>}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
