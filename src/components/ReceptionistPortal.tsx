import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, LogOut, RefreshCw, Search, X, Bell, Phone,
  UserPlus, Users, FileText, Calendar, CheckCircle,
  AlertTriangle, Loader2, Eye, Clock, ChevronRight,
  MessageSquare, ClipboardList, BookOpen, Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface ReceptionistPortalProps {
  onLogout: () => void;
  receptionistData: { id: string; full_name: string; role: string; username: string };
}

const ACCENT   = '#0369a1';
const GRADIENT = 'linear-gradient(135deg,#0369a1,#0ea5e9)';

const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

const StatCard = ({ icon: Icon, label, value, sub, color, alert }: any) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    className={cn('bg-white rounded-2xl p-4 border transition-all', alert ? 'border-rose-200' : 'border-slate-100')}
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={17} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

export const ReceptionistPortal: React.FC<ReceptionistPortalProps> = ({ onLogout, receptionistData }) => {
  const [tab, setTab]             = useState('dashboard');
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg]   = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [moreOpen, setMoreOpen]   = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────
  const [students,      setStudents]      = useState<any[]>([]);
  const [admForms,      setAdmForms]      = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visitors,      setVisitors]      = useState<any[]>([]);
  const [complaints,    setComplaints]    = useState<any[]>([]);

  // ── Search / filter ───────────────────────────────────────────────────
  const [searchQ,       setSearchQ]       = useState('');
  const [admFilter,     setAdmFilter]     = useState('');

  // ── Visitor form ──────────────────────────────────────────────────────
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [vName,    setVName]    = useState('');
  const [vPhone,   setVPhone]   = useState('');
  const [vPurpose, setVPurpose] = useState('');
  const [vMeet,    setVMeet]    = useState('');
  const [vSaving,  setVSaving]  = useState(false);

  // ── Complaint form ────────────────────────────────────────────────────
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [cRoll,    setCRoll]    = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cDesc,    setCDesc]    = useState('');
  const [cSaving,  setCSaving]  = useState(false);

  // ── Selected student ──────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [stuFees,         setStuFees]         = useState<any[]>([]);
  const [stuLoading,      setStuLoading]      = useState(false);

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh   = () => setRefreshKey(k => k + 1);

  // ── Load ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s1, s2, s3, s4, s5] = await Promise.all([
        supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,gender,status,cell_no,current_badge,total_xp').order('full_name'),
        supabase.from('admission_forms').select('*').order('created_at', { ascending: false }).limit(60),
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('visitor_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setStudents(s1.data || []);
      setAdmForms(s2.data || []);
      setNotifications(s3.data || []);
      setVisitors(s4.data || []);
      setComplaints(s5.data || []);
    } catch (e: any) {
      showErr('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [refreshKey]);

  // ── Open student profile ───────────────────────────────────────────────
  const openStudent = async (s: any) => {
    if (selectedStudent?.roll_no === s.roll_no) { setSelectedStudent(null); setStuFees([]); return; }
    setSelectedStudent(s); setStuLoading(true);
    const { data } = await supabase.from('fee_groups').select('*').eq('student_roll', s.roll_no).order('due_date');
    setStuFees(data || []); setStuLoading(false);
  };

  // ── Log visitor ────────────────────────────────────────────────────────
  const logVisitor = async () => {
    if (!vName.trim()) { showErr('Visitor name is required'); return; }
    if (!vPurpose.trim()) { showErr('Purpose is required'); return; }
    setVSaving(true);
    try {
      const { error } = await supabase.from('visitor_log').insert([{
        visitor_name:  vName.trim(),
        phone:         vPhone.trim() || null,
        purpose:       vPurpose.trim(),
        meeting_with:  vMeet.trim() || null,
        logged_by:     receptionistData.full_name,
        visit_date:    new Date().toISOString().slice(0, 10),
        visit_time:    new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
        status:        'Waiting',
      }]);
      if (error) throw error;
      showToast('✅ Visitor logged');
      setShowVisitorModal(false);
      setVName(''); setVPhone(''); setVPurpose(''); setVMeet('');
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setVSaving(false); }
  };

  // ── Log complaint ──────────────────────────────────────────────────────
  const logComplaint = async () => {
    if (!cSubject.trim()) { showErr('Subject is required'); return; }
    if (!cDesc.trim()) { showErr('Description is required'); return; }
    setCSaving(true);
    try {
      const stu = students.find(s => String(s.roll_no) === cRoll.trim());
      const { error } = await supabase.from('complaints').insert([{
        student_roll:  cRoll.trim() || null,
        student_name:  stu?.full_name || null,
        subject:       cSubject.trim(),
        description:   cDesc.trim(),
        logged_by:     receptionistData.full_name,
        status:        'Open',
      }]);
      if (error) throw error;
      showToast('✅ Complaint logged');
      setShowComplaintModal(false);
      setCRoll(''); setCSubject(''); setCDesc('');
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setCSaving(false); }
  };

  // ── Mark visitor done ─────────────────────────────────────────────────
  const markVisitorDone = async (id: string) => {
    await supabase.from('visitor_log').update({ status: 'Done' }).eq('id', id);
    showToast('Marked as done'); refresh();
  };

  // ── Computed ───────────────────────────────────────────────────────────
  const pendingAdm      = admForms.filter(f => f.status === 'Pending').length;
  const todayVisitors   = visitors.filter(v => v.visit_date === new Date().toISOString().slice(0, 10)).length;
  const openComplaints  = complaints.filter(c => c.status === 'Open').length;
  const unreadNotifs    = notifications.filter(n => !n.is_read).length;

  const filteredStudents = students.filter(s => {
    if (!searchQ) return false;
    const q = searchQ.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || String(s.roll_no).includes(q) || s.father_name?.toLowerCase().includes(q) || s.cell_no?.includes(q);
  });

  const filteredAdmForms = admForms.filter(f => !admFilter || f.status === admFilter);

  const NAV = [
    { id: 'dashboard',   label: 'Dashboard',  icon: Home },
    { id: 'students',    label: 'Students',   icon: Users },
    { id: 'admissions',  label: 'Admissions', icon: FileText },
    { id: 'visitors',    label: 'Visitors',   icon: ClipboardList },
    { id: 'complaints',  label: 'Complaints', icon: MessageSquare },
    { id: 'notices',     label: 'Notices',    icon: Bell },
  ];

  const MOBILE_PRIMARY = NAV.slice(0, 4);
  const MOBILE_MORE    = NAV.slice(4);

  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Reception Overview', students: 'Student Lookup',
    admissions: 'Admission Forms', visitors: 'Visitor Log',
    complaints: 'Complaints', notices: 'Notice Board',
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10" style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}><Phone size={18} className="text-white" /></div>
            <div><p className="font-black text-slate-900 text-sm">PIC Campus</p><p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Reception Portal</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const badge = id === 'admissions' ? pendingAdm : id === 'complaints' ? openComplaints : id === 'notices' ? unreadNotifs : 0;
            return (
              <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: 2 }}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left', active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active ? { background: GRADIENT } : {}}>
                <Icon size={16} /><span className="flex-1">{label}</span>
                {badge > 0 && <span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center bg-rose-500">{badge > 9 ? '9+' : badge}</span>}
              </motion.button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: GRADIENT }}>{receptionistData.full_name?.charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-800 truncate">{receptionistData.full_name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Receptionist</p></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"><LogOut size={13} /> Sign Out</button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}><Phone size={14} className="text-white" /></div>
          <div><p className="font-black text-slate-900 text-sm leading-none">Reception</p><p className="text-[9px] font-bold" style={{ color: ACCENT }}>{receptionistData.full_name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">{savedMsg}</span>}
          <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-0">
        {/* Desktop topbar */}
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{TAB_TITLE[tab]}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {savedMsg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={13} />{savedMsg}</motion.div>}
            {errorMsg  && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"><AlertTriangle size={13} />{errorMsg}</motion.div>}
            <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">

            {/* ════ DASHBOARD ════ */}
            {tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Hero */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0c4a6e 0%,#0369a1 60%,#0ea5e9 100%)', boxShadow: '0 12px 40px rgba(3,105,161,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-sky-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <p className="text-sky-300 text-[10px] font-black uppercase tracking-widest mb-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <h2 className="text-xl font-black text-white mb-4">Good day, {receptionistData.full_name.split(' ')[0]}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[{ l: 'Total Students', v: students.length }, { l: "Today's Visitors", v: todayVisitors }, { l: 'Pending Forms', v: pendingAdm }, { l: 'Open Complaints', v: openComplaints }].map(({ l, v }) => (
                      <div key={l}><p className="text-sky-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users}        label="Students"         value={students.length}  sub="Enrolled"          color="bg-sky-50 text-sky-600" />
                  <StatCard icon={ClipboardList} label="Today's Visitors" value={todayVisitors}    sub="Logged today"      color="bg-violet-50 text-violet-600" />
                  <StatCard icon={FileText}     label="Pending Forms"    value={pendingAdm}       sub="Awaiting confirm"  color="bg-amber-50 text-amber-600"  alert={pendingAdm > 0} />
                  <StatCard icon={MessageSquare} label="Open Complaints"  value={openComplaints}   sub="Needs attention"   color="bg-rose-50 text-rose-600"    alert={openComplaints > 0} />
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowVisitorModal(true)}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: GRADIENT }}><UserPlus size={20} className="text-white" /></div>
                    <div><p className="font-black text-slate-900 text-sm">Log Visitor</p><p className="text-[11px] text-slate-400 mt-0.5">Record a new walk-in</p></div>
                    <ChevronRight size={16} className="text-slate-300 ml-auto" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowComplaintModal(true)}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-rose-100 text-rose-600"><MessageSquare size={20} /></div>
                    <div><p className="font-black text-slate-900 text-sm">Log Complaint</p><p className="text-[11px] text-slate-400 mt-0.5">Record an issue</p></div>
                    <ChevronRight size={16} className="text-slate-300 ml-auto" />
                  </motion.button>
                </div>

                {/* Recent visitors today */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">🚪 Today's Visitors</h3>
                    <button onClick={() => setTab('visitors')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                  </div>
                  {visitors.filter(v => v.visit_date === new Date().toISOString().slice(0, 10)).length === 0
                    ? <p className="p-6 text-center text-slate-400 text-sm">No visitors logged today</p>
                    : visitors.filter(v => v.visit_date === new Date().toISOString().slice(0, 10)).slice(0, 5).map((v: any, i: number) => (
                      <motion.div key={v.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: `hsl(${(v.visitor_name?.charCodeAt(0) || 50) * 37 % 360},55%,48%)` }}>{v.visitor_name?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{v.visitor_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{v.purpose} {v.meeting_with ? `· Meets: ${v.meeting_with}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', v.status === 'Done' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{v.status}</span>
                          {v.status !== 'Done' && <button onClick={() => markVisitorDone(v.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"><CheckCircle size={13} /></button>}
                        </div>
                      </motion.div>
                    ))}
                </div>

                {/* Recent notices */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">📢 Recent Notices</h3>
                    <button onClick={() => setTab('notices')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                  </div>
                  {notifications.slice(0, 4).map((n: any, i: number) => (
                    <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className={cn('px-5 py-3.5 border-b border-slate-50 last:border-0 flex items-start gap-3', !n.is_read ? 'bg-sky-50/30' : '')}>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />}
                      <div><p className="text-sm font-black text-slate-800">{n.title}</p><p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p></div>
                    </motion.div>
                  ))}
                  {!notifications.length && <p className="p-6 text-center text-slate-400 text-sm">No notices</p>}
                </div>
              </motion.div>
            )}

            {/* ════ STUDENT LOOKUP ════ */}
            {tab === 'students' && (
              <motion.div key="stu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <BookOpen size={16} className="text-sky-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-sky-900">Search students by name, roll number, father's name, or phone number.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Type name, roll no, father name, or phone…"
                    className="w-full border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-sky-400 bg-white transition-all" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
                  {searchQ && <button onClick={() => { setSearchQ(''); setSelectedStudent(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"><X size={15} /></button>}
                </div>

                {/* Student profile panel */}
                <AnimatePresence>
                  {selectedStudent && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="bg-white rounded-3xl border border-sky-200 overflow-hidden shadow-md">
                      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0" style={{ background: `hsl(${(selectedStudent.roll_no * 37) % 360},55%,48%)` }}>{selectedStudent.full_name?.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900">{selectedStudent.full_name}</p>
                            <p className="text-xs text-slate-500">Roll #{selectedStudent.roll_no} · {selectedStudent.class_section} · {selectedStudent.program} Part {selectedStudent.part}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Father: {selectedStudent.father_name || '—'} · {selectedStudent.gender}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedStudent(null); setStuFees([]); }} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { l: 'Status', v: selectedStudent.status, c: selectedStudent.status === 'Active' ? 'text-emerald-600' : 'text-rose-600' },
                            { l: 'Cell No', v: selectedStudent.cell_no || '—', c: 'text-slate-800' },
                            { l: 'Badge', v: selectedStudent.current_badge || 'Newcomer', c: 'text-slate-800' },
                            { l: 'Total XP', v: (selectedStudent.total_xp || 0).toLocaleString(), c: 'text-sky-600' },
                          ].map(({ l, v, c }) => (
                            <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{l}</p>
                              <p className={cn('text-sm font-black', c)}>{v}</p>
                            </div>
                          ))}
                        </div>
                        {/* Fee summary — read only */}
                        <div>
                          <p className="font-black text-slate-900 text-sm mb-2">💰 Fee Summary</p>
                          {stuLoading ? <div className="flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" /><span className="text-sm">Loading…</span></div>
                            : stuFees.length === 0 ? <p className="text-sm text-slate-400 italic">No fee records</p>
                            : (
                              <div className="space-y-2">
                                {stuFees.map(g => (
                                  <div key={g.id} className={cn('flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm', g.status === 'Paid' ? 'bg-emerald-50/50 border-emerald-100' : g.status === 'Partial' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/30 border-rose-100')}>
                                    <div>
                                      <p className="font-black text-slate-900">{g.fees_group}</p>
                                      <p className="text-[10px] text-slate-400">Due: {g.due_date || '—'} · Paid: {PKR(g.paid)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-black" style={{ color: g.balance > 0 ? '#C0392B' : '#059669' }}>{PKR(g.balance)}</p>
                                      <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', g.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : g.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>{g.status}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between pt-1 text-xs font-bold text-slate-500 px-1">
                                  <span>Total Due</span>
                                  <span className="font-black text-rose-600">{PKR(stuFees.reduce((t, g) => t + (g.balance || 0), 0))}</span>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Results table */}
                {searchQ.length > 1 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500">{filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
                      <table className="w-full text-xs min-w-[520px]">
                        <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                          <tr>{['Roll', 'Name', 'Father', 'Class', 'Phone', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s, i) => (
                            <motion.tr key={s.roll_no} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              onClick={() => openStudent(s)}
                              className={cn('border-b border-slate-50 hover:bg-sky-50/40 cursor-pointer transition-colors', selectedStudent?.roll_no === s.roll_no ? 'bg-sky-50/60' : '')}>
                              <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">{s.roll_no}</td>
                              <td className="px-4 py-3 font-black text-slate-900 max-w-[130px] truncate">{s.full_name}</td>
                              <td className="px-4 py-3 text-slate-500 max-w-[110px] truncate">{s.father_name || '—'}</td>
                              <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-sky-50 text-sky-700 border border-sky-100">{s.class_section}</span></td>
                              <td className="px-4 py-3 text-slate-500">{s.cell_no || '—'}</td>
                              <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{s.status}</span></td>
                              <td className="px-4 py-3"><Eye size={14} className="text-sky-400" /></td>
                            </motion.tr>
                          ))}
                          {filteredStudents.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No students match your search</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {searchQ.length <= 1 && !selectedStudent && (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <Search size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 font-bold text-sm">Start typing to search students</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════ ADMISSIONS ════ */}
            {tab === 'admissions' && (
              <motion.div key="adm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <FileText size={16} className="text-sky-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-sky-900">Read-only view. Forms are processed by the Accountant.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{ v: '', l: 'All' }, { v: 'Pending', l: 'Pending' }, { v: 'Approved', l: 'Approved' }, { v: 'Rejected', l: 'Rejected' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setAdmFilter(v)}
                      className={cn('px-4 py-1.5 rounded-xl text-xs font-black border transition-all', admFilter === v ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')}
                      style={admFilter === v ? { background: GRADIENT } : {}}>{l} ({admForms.filter(f => !v || f.status === v).length})</button>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[580px]">
                      <thead style={{ background: '#f8f9fd' }}>
                        <tr>{['Student', 'Father', 'Program', 'Section', 'Matric %', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filteredAdmForms.map((f: any, i: number) => (
                          <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-black text-slate-900">{f.student_name}</td>
                            <td className="px-4 py-3 text-slate-500">{f.father_name}</td>
                            <td className="px-4 py-3 text-slate-600"><p>{f.program}</p><p className="text-[10px] text-slate-400">Part {f.part}</p></td>
                            <td className="px-4 py-3">{f.suggested_section ? <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">{f.suggested_section}</span> : '—'}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{f.matric_percentage ? `${f.matric_percentage}%` : '—'}</td>
                            <td className="px-4 py-3"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', f.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : f.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{f.status}</span></td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                          </motion.tr>
                        ))}
                        {filteredAdmForms.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No forms found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ VISITOR LOG ════ */}
            {tab === 'visitors' && (
              <motion.div key="vis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
                    {[{ l: 'Total Today', v: todayVisitors, c: 'text-sky-600' }, { l: 'Waiting', v: visitors.filter(v => v.status === 'Waiting' && v.visit_date === new Date().toISOString().slice(0,10)).length, c: 'text-amber-600' }, { l: 'Done', v: visitors.filter(v => v.status === 'Done' && v.visit_date === new Date().toISOString().slice(0,10)).length, c: 'text-emerald-600' }].map(({ l, v, c }) => (
                      <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                    ))}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowVisitorModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white flex-shrink-0"
                    style={{ background: GRADIENT }}><UserPlus size={15} /> Log Visitor</motion.button>
                </div>
                <div className="space-y-3">
                  {visitors.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center"><ClipboardList size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No visitors logged yet</p></div>
                  ) : visitors.map((v: any, i: number) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: `hsl(${(v.visitor_name?.charCodeAt(0) || 50) * 37 % 360},55%,48%)` }}>{v.visitor_name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-slate-900">{v.visitor_name}</p>
                          <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', v.status === 'Done' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{v.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{v.purpose}{v.meeting_with ? ` · Meets: ${v.meeting_with}` : ''}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {v.phone && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Phone size={9} />{v.phone}</span>}
                          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={9} />{v.visit_time} · {v.visit_date}</span>
                          <span className="text-[11px] text-slate-400">By: {v.logged_by}</span>
                        </div>
                      </div>
                      {v.status !== 'Done' && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => markVisitorDone(v.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}><CheckCircle size={11} /> Done</motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════ COMPLAINTS ════ */}
            {tab === 'complaints' && (
              <motion.div key="comp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
                    {[{ l: 'Total', v: complaints.length, c: 'text-slate-900' }, { l: 'Open', v: openComplaints, c: 'text-rose-600' }, { l: 'Resolved', v: complaints.filter(c => c.status === 'Resolved').length, c: 'text-emerald-600' }].map(({ l, v, c }) => (
                      <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                    ))}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowComplaintModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white flex-shrink-0"
                    style={{ background: GRADIENT }}><MessageSquare size={15} /> Log Complaint</motion.button>
                </div>
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center"><MessageSquare size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No complaints logged</p></div>
                  ) : complaints.map((c: any, i: number) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={cn('bg-white rounded-2xl overflow-hidden shadow-sm', c.status === 'Open' ? 'border-l-4 border border-rose-200' : 'border border-slate-100')}
                      style={c.status === 'Open' ? { borderLeftColor: '#e11d48' } : {}}>
                      <div className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}><MessageSquare size={16} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-slate-900">{c.subject}</p>
                              <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{c.status}</span>
                            </div>
                            {c.student_name && <p className="text-xs text-slate-500 mt-0.5">Student: {c.student_name} {c.student_roll ? `(${c.student_roll})` : ''}</p>}
                            <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                            <p className="text-[11px] text-slate-400 mt-1">Logged by {c.logged_by} · {c.created_at ? new Date(c.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : ''}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════ NOTICES ════ */}
            {tab === 'notices' && (
              <motion.div key="notif" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[{ l: 'Total Notices', v: notifications.length, c: 'text-slate-900' }, { l: 'Unread', v: unreadNotifs, c: 'text-sky-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                  ))}
                </div>
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center"><Bell size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No notices</p></div>
                ) : notifications.map((n: any, i: number) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={cn('bg-white rounded-2xl border px-5 py-4 shadow-sm', !n.is_read ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100')}>
                    <div className="flex items-start gap-3">
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-black text-slate-900 text-sm">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5">{n.created_at ? new Date(n.created_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_PRIMARY.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const badge = id === 'admissions' ? pendingAdm : 0;
            return (
              <button key={id} onClick={() => setTab(id)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: active ? ACCENT : '#94a3b8' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={active ? { background: `${ACCENT}18` } : {}}>
                  <Icon size={19} />
                  {badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{badge}</span>}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{label}</span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />}
              </button>
            );
          })}
          <div className="relative flex-1 min-w-0">
            <button onClick={() => setMoreOpen(p => !p)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl w-full" style={{ color: MOBILE_MORE.some(n => n.id === tab) ? ACCENT : '#94a3b8' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"><Hash size={19} /></div>
              <span className="text-[9px] font-black uppercase tracking-tight">More</span>
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden" style={{ minWidth: 175 }}>
                  {MOBILE_MORE.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setTab(id); setMoreOpen(false); }}
                      className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-bold border-b border-slate-50 last:border-0', tab === id ? 'text-white' : 'text-slate-700 hover:bg-slate-50')}
                      style={tab === id ? { background: GRADIENT } : {}}><Icon size={16} />{label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onLogout} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: '#ef4444' }}>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center"><LogOut size={19} className="text-rose-500" /></div>
            <span className="text-[9px] font-black uppercase tracking-tight">Exit</span>
          </button>
        </div>
      </nav>

      {/* ── LOG VISITOR MODAL ── */}
      <AnimatePresence>
        {showVisitorModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVisitorModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="font-black text-slate-900 text-lg">Log Visitor</h3><p className="text-xs text-slate-400 mt-0.5">Record a walk-in visitor</p></div>
                  <button onClick={() => setShowVisitorModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Visitor Name <span className="text-rose-500">*</span></label>
                    <input value={vName} onChange={e => setVName(e.target.value)} placeholder="Full name" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input value={vPhone} onChange={e => setVPhone(e.target.value)} placeholder="0300-XXXXXXX" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Purpose <span className="text-rose-500">*</span></label>
                    <input value={vPurpose} onChange={e => setVPurpose(e.target.value)} placeholder="e.g. Fee payment, Enquiry, Meeting" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meeting With</label>
                    <input value={vMeet} onChange={e => setVMeet(e.target.value)} placeholder="e.g. Principal, Accountant" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-400" /></div>
                  {errorMsg && <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">⚠️ {errorMsg}</p>}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowVisitorModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={logVisitor} disabled={vSaving}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{ background: GRADIENT }}>
                      {vSaving ? <Loader2 size={15} className="animate-spin" /> : <><UserPlus size={15} /> Log Visitor</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LOG COMPLAINT MODAL ── */}
      <AnimatePresence>
        {showComplaintModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowComplaintModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1 bg-rose-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="font-black text-slate-900 text-lg">Log Complaint</h3><p className="text-xs text-slate-400 mt-0.5">Record a complaint or issue</p></div>
                  <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Student Roll No (optional)</label>
                    <input value={cRoll} onChange={e => setCRoll(e.target.value)} placeholder="Leave blank if not student-related" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject <span className="text-rose-500">*</span></label>
                    <input value={cSubject} onChange={e => setCSubject(e.target.value)} placeholder="Brief subject of complaint" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description <span className="text-rose-500">*</span></label>
                    <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={3} placeholder="Detailed description of the issue…" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400 resize-none" /></div>
                  {errorMsg && <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">⚠️ {errorMsg}</p>}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowComplaintModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={logComplaint} disabled={cSaving}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 bg-rose-500 hover:bg-rose-600 transition-all">
                      {cSaving ? <Loader2 size={15} className="animate-spin" /> : <><MessageSquare size={15} /> Submit</>}
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
};