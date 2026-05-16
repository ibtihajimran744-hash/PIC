import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, BookOpen, LogOut, Search, RefreshCw, X, Check,
  Loader2, FileText, Calendar, Settings, GraduationCap, BarChart3,
  Clock, ChevronDown, Bell, UserCheck, Plus, Eye, Trash2,
  AlertTriangle, CheckCircle, ClipboardList, Megaphone, Send,
  ShieldCheck, ShieldAlert, Zap, Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface GirlsCoordinatorPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const ACCENT   = '#db2777'; // Girls Coordinator - Pink Focus
const GRADIENT = 'linear-gradient(135deg,#db2777,#be185d)';

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

export default function GirlsCoordinatorPortal({ onLogout, adminData }: GirlsCoordinatorPortalProps) {
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
    target_program: 'All', expires_at: '', gender_group: 'Girls'
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
      // Filter for Girls/Both students
      const { data: sData } = await supabase
        .from('students')
        .select('*')
        .in('gender', ['Female', 'Other'])
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
        .in('gender_group', ['Girls', 'General'])
        .order('created_at', { ascending: false });

      const { data: nData } = await supabase
        .from('coordinator_notifications')
        .select('*')
        .eq('coordinator_type', 'Girls')
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
        gender_group: 'Girls'
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
        coordinator_type: 'Girls',
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
    { id: 'monitoring',label: 'Class Tracking', icon: Clock },
    { id: 'students',  label: 'Students',      icon: Users },
    { id: 'announce',  label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fffdfd]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-pink-100 flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-pink-50 bg-pink-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-100">
              <Heart size={20} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm tracking-tight italic">CampusCore</p>
              <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">Girls Coordinator</p>
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
                  active ? 'bg-pink-600 text-white shadow-md shadow-pink-50' : 'text-slate-500 hover:bg-pink-50 hover:text-pink-600'
                )}>
                <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-pink-500')} />
                <span className="flex-1">{label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-pink-50 bg-pink-50/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-pink-100 shadow-sm mb-3">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-black text-sm">
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
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-pink-100/60 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Girls Coordination Portal</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-pink-600 hover:border-pink-200 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <motion.button whileHover={{ y: -2 }} onClick={() => setNotifyModal(true)}
              className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-pink-100">
              <Bell size={14} /> Send Alert
            </motion.button>
          </div>
        </header>

        <div className="p-6">
          {tab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Girls Students" value={students.length} sub="Active members" color="bg-pink-50 text-pink-600" />
                <StatCard icon={Clock} label="Class Today" value={monitorStats.totalSlots} sub={`${monitorStats.entered} logged`} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Megaphone} label="Announcements" value={announcements.length} sub="Updates" color="bg-purple-50 text-purple-600" />
                <StatCard icon={GraduationCap} label="Classes" value={allClasses.length} sub="Total units" color="bg-emerald-50 text-emerald-600" />
              </div>

              <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm overflow-hidden relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight">Girls Campus Entry Monitor</h3>
                    <p className="text-xs text-slate-400">Live teacher movement tracking</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {monitoring.slice(0, 5).map((m, i) => {
                    const teacher = teachers.find(t => t.id === m.teacher_id);
                    return (
                      <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-pink-50/20 border border-pink-100">
                        <div className="w-10 h-10 rounded-xl bg-white border border-pink-100 flex items-center justify-center font-black text-pink-400 text-xs shadow-sm">
                          {new Date(m.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 tracking-tight">{teacher?.full_name || 'Teacher'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{m.class_section} · <span className="text-pink-600">{m.subject}</span></p>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <Check size={11} /> IN CLASS
                        </div>
                      </div>
                    );
                  })}
                  {monitoring.length === 0 && <p className="text-center py-10 text-slate-400 text-xs italic font-medium">No activity for today yet.</p>}
                  <button onClick={() => setTab('monitoring')} className="w-full py-3 rounded-2xl border border-pink-100 text-pink-600 font-black text-xs hover:bg-pink-50 transition-all border-dashed">
                    Full Monitoring Log
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'monitoring' && (
            <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-pink-50/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-pink-600 uppercase tracking-widest whitespace-nowrap">Time</th>
                        <th className="px-6 py-4 text-[10px] font-black text-pink-600 uppercase tracking-widest whitespace-nowrap">Teacher</th>
                        <th className="px-6 py-4 text-[10px] font-black text-pink-600 uppercase tracking-widest whitespace-nowrap">Class</th>
                        <th className="px-6 py-4 text-[10px] font-black text-pink-600 uppercase tracking-widest whitespace-nowrap">Subject</th>
                        <th className="px-6 py-4 text-[10px] font-black text-pink-600 uppercase tracking-widest whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoring.map(m => {
                        const t = teachers.find(te => te.id === m.teacher_id);
                        return (
                          <tr key={m.id} className="border-b border-pink-50/50 hover:bg-pink-50/10">
                            <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{new Date(m.created_at).toLocaleTimeString()}</td>
                            <td className="px-6 py-4 font-black text-sm text-slate-800">{t?.full_name}</td>
                            <td className="px-6 py-4"><span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight">{m.class_section}</span></td>
                            <td className="px-6 py-4 font-bold text-slate-600 text-sm">{m.subject}</td>
                            <td className="px-6 py-4 text-emerald-600 font-black text-[10px]">VERIFIED LOG</td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>
            </div>
          )}

          {tab === 'students' && (
             <div className="space-y-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300" size={16} />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Find student..." 
                      className="w-full border border-pink-100 rounded-2xl py-3 pl-11 outline-none focus:border-pink-500 shadow-sm text-sm" />
                </div>
                <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead>
                        <tr className="bg-pink-50/30">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll #</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Program</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => !searchQ || s.full_name?.toLowerCase().includes(searchQ.toLowerCase())).map(s => (
                          <tr key={s.roll_no} className="border-b border-pink-50">
                            <td className="px-6 py-4 text-xs font-mono font-black text-slate-400">{s.roll_no}</td>
                            <td className="px-6 py-4 font-black text-sm text-slate-900">{s.full_name}</td>
                            <td className="px-6 py-4"><span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded text-[10px] font-black">{s.class_section}</span></td>
                            <td className="px-6 py-4 text-xs text-slate-500">{s.program}</td>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnnounceModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl z-10">
                <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Post Girls Notice</h3>
                <div className="space-y-4">
                  <input value={announceForm.title} onChange={e => setAnnounceForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full border border-pink-100 rounded-2xl px-5 py-3 text-sm focus:border-pink-500 outline-none" />
                  <textarea value={announceForm.content} onChange={e => setAnnounceForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Content" className="w-full border border-pink-100 rounded-2xl px-5 py-3 text-sm focus:border-pink-500 outline-none resize-none" />
                  <button onClick={handleAnnounce} disabled={saving} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-100 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Post Announcement</>}
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotifyModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2rem] w-full max-w-md p-8 text-center z-10 shadow-2xl">
               <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-4"><Bell size={24} /></div>
               <h3 className="text-xl font-black text-slate-900 mb-2">Girls Portal Alert</h3>
               <p className="text-xs text-slate-400 font-bold mb-6 uppercase tracking-widest">Push Notification</p>
               <div className="space-y-3">
                 <input value={notifyForm.title} onChange={e => setNotifyForm(p => ({ ...p, title: e.target.value }))} placeholder="Alert Title" className="w-full border border-pink-100 rounded-2xl px-5 py-3 text-sm outline-none focus:border-pink-500 font-black italic" />
                 <textarea value={notifyForm.body} onChange={e => setNotifyForm(p => ({ ...p, body: e.target.value }))} placeholder="Message..." className="w-full border border-pink-100 rounded-2xl px-5 py-3 text-sm outline-none focus:border-pink-500 resize-none" />
                 <button onClick={handleNotify} disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                   {saving ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Push Alert</>}
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
