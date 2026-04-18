import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, TrendingUp,
  Calendar, Megaphone, Mail, LogOut, RefreshCw, X, Plus,
  Search, Trash2, ChevronRight, CheckCircle, AlertCircle,
  Clock, BookMarked, BarChart2, FileText, Send, Eye,
  Menu, Bell
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface Props {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

const ACCENT  = '#059669';
const GRADIENT = 'linear-gradient(135deg,#059669,#10b981)';

const PROGRAMS = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];

type Tab = 'dashboard'|'scheme'|'teachers'|'students'|'announcements'|'messages'|'timetable'|'progress';

const TABS = [
  { id: 'dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'scheme',        label: 'Scheme of Study',  icon: BookMarked },
  { id: 'teachers',      label: 'Teacher Profiles', icon: Users },
  { id: 'students',      label: 'Student Academics',icon: GraduationCap },
  { id: 'progress',      label: 'Course Progress',  icon: TrendingUp },
  { id: 'timetable',     label: 'Timetable',        icon: Calendar },
  { id: 'announcements', label: 'Announcements',    icon: Megaphone },
  { id: 'messages',      label: 'Messages',         icon: Mail },
];

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard = ({ label, value, sub, color, icon: Icon }: any) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-5 border border-slate-100"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
  </motion.div>
);

const Badge = ({ c, label }: { c: string; label: string }) => (
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${c}`}>{label}</span>
);

const FM = ({ label, req, children }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const TI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 bg-white transition-all" />
);
const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 bg-white">{children}</select>
);
const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 bg-white resize-none transition-all" />
);

export const AcademicsPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [tab, setTab]       = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  const [schemes,        setSchemes]        = useState<any[]>([]);
  const [teachers,       setTeachers]       = useState<any[]>([]);
  const [teacherProfs,   setTeacherProfs]   = useState<any[]>([]);
  const [students,       setStudents]       = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [timetable,      setTimetable]      = useState<any[]>([]);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [messages,       setMessages]       = useState<any[]>([]);
  const [grades,         setGrades]         = useState<any[]>([]);
  const [attendance,     setAttendance]     = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal,   setModal]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  const [schemeForm, setSchemeForm] = useState<any>({
    title: '', subject: '', program: 'ICS Physics', part: 1, class_section: '',
    week_no: '', month: '', topic: '', description: '', uploaded_by: '',
  });
  const [announceForm, setAnnounceForm] = useState<any>({
    title: '', body: '', target_type: 'all', target_value: '', priority: 'Normal', expires_at: '',
  });
  const [msgForm, setMsgForm] = useState<any>({
    to_teacher_username: '', subject: '', body: '',
  });
  const [schemeFilter, setSchemeFilter] = useState({ program: '', part: '', subject: '' });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sc }, { data: tc }, { data: tp }, { data: st }, { data: cp }, { data: tt }, { data: an }, { data: ms }, { data: gr }, { data: at }] = await Promise.all([
      supabase.from('scheme_of_study').select('*').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('full_name'),
      supabase.from('teacher_profiles').select('*').order('full_name'),
      supabase.from('students').select('roll_no,full_name,class_section,program,part,status,total_xp,current_badge,profile_xp').order('roll_no'),
      supabase.from('student_course_progress').select('*').order('last_updated', { ascending: false }),
      supabase.from('timetable').select('*').order('start_time').limit(200),
      supabase.from('academic_announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('teacher_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('grades').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('attendance').select('student_roll,status,date').order('date', { ascending: false }).limit(500),
    ]);
    setSchemes(sc || []); setTeachers(tc || []); setTeacherProfs(tp || []);
    setStudents(st || []); setCourseProgress(cp || []); setTimetable(tt || []);
    setAnnouncements(an || []); setMessages(ms || []); setGrades(gr || []); setAttendance(at || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveScheme = async () => {
    if (!schemeForm.title || !schemeForm.subject || !schemeForm.topic) {
      showToast('Title, subject and topic are required', false); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('scheme_of_study').insert([{
        ...schemeForm, part: Number(schemeForm.part),
        week_no: schemeForm.week_no ? Number(schemeForm.week_no) : null,
        uploaded_by: schemeForm.uploaded_by || adminData.full_name,
      }]);
      if (error) throw error;
      showToast('Scheme of study entry uploaded');
      setSchemeForm({ title: '', subject: '', program: 'ICS Physics', part: 1, class_section: '', week_no: '', month: '', topic: '', description: '', uploaded_by: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteScheme = async (id: number) => {
    if (!window.confirm('Delete this scheme entry?')) return;
    await supabase.from('scheme_of_study').delete().eq('id', id);
    showToast('Entry deleted'); loadAll();
  };

  const sendAnnouncement = async () => {
    if (!announceForm.title || !announceForm.body) { showToast('Title and body required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('academic_announcements').insert([{
        ...announceForm, created_by: adminData.full_name,
        expires_at: announceForm.expires_at || null,
      }]);
      if (error) throw error;
      showToast('Announcement published');
      setAnnounceForm({ title: '', body: '', target_type: 'all', target_value: '', priority: 'Normal', expires_at: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteAnnouncement = async (id: number) => {
    await supabase.from('academic_announcements').delete().eq('id', id);
    showToast('Announcement deleted'); loadAll();
  };

  const sendMessage = async () => {
    if (!msgForm.to_teacher_username || !msgForm.subject || !msgForm.body) {
      showToast('Teacher, subject and body required', false); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('teacher_messages').insert([{
        from_user: adminData.username, from_role: adminData.role,
        to_teacher_username: msgForm.to_teacher_username,
        subject: msgForm.subject, body: msgForm.body, is_read: false,
      }]);
      if (error) throw error;
      showToast('Message sent to teacher');
      setMsgForm({ to_teacher_username: '', subject: '', body: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const markMessageRead = async (id: number) => {
    await supabase.from('teacher_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    loadAll();
  };

  const totalSchemes   = schemes.length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const totalStudents  = students.length;
  const unreadMessages = messages.filter(m => !m.is_read && m.from_role !== adminData.role).length;

  const getStudentStats = (roll: number) => {
    const cp = courseProgress.filter(c => c.student_roll === roll);
    const sg = grades.filter(g => g.student_roll === roll);
    const sa = attendance.filter(a => a.student_roll === roll);
    const presentDays = sa.filter(a => a.status === 'Present').length;
    const totalDays   = sa.length;
    const attPct  = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    const avgScore = sg.length > 0 ? (sg.reduce((s, g) => s + (g.score || 0), 0) / sg.length).toFixed(1) : '—';
    return { cp, sg, attPct, avgScore, presentDays, totalDays };
  };

  const filteredSchemes = schemes.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.topic?.toLowerCase().includes(q) || s.subject?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q);
    const matchProg   = !schemeFilter.program || s.program === schemeFilter.program;
    return matchSearch && matchProg;
  });

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    return !search || String(s.roll_no).includes(q) || s.full_name?.toLowerCase().includes(q) || s.class_section?.toLowerCase().includes(q);
  });

  const filteredTeachers = teachers.filter(t =>
    !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.subject_dept?.toLowerCase().includes(search.toLowerCase())
  );

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Dashboard', scheme: 'Scheme of Study', teachers: 'Teacher Profiles',
    students: 'Student Academics', progress: 'Course Progress', timetable: 'Timetable',
    announcements: 'Announcements', messages: 'Messages',
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10"
        style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">PIC Campus</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Academics Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <motion.button key={id} onClick={() => { setTab(id as Tab); setSearch(''); }}
                whileHover={{ x: 2 }}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left',
                  active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active ? { background: GRADIENT } : {}}>
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {id === 'messages' && unreadMessages > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: GRADIENT }}>
              {adminData.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{adminData.full_name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{adminData.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between"
        style={{ boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">Academics</p>
            <p className="text-[9px] font-bold" style={{ color: ACCENT }}>{adminData.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSideOpen(true)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Menu size={16} className="text-slate-600" />
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSideOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-100 flex flex-col md:hidden"
              style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.10)' }}>
              <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}>
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <p className="font-black text-slate-900 text-sm">Academics</p>
                </div>
                <button onClick={() => setSideOpen(false)}><X size={18} className="text-slate-400" /></button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => { setTab(id as Tab); setSideOpen(false); setSearch(''); }}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left',
                      tab === id ? 'text-white' : 'text-slate-500 hover:bg-slate-50')}
                    style={tab === id ? { background: GRADIENT } : {}}>
                    <Icon size={16} /><span>{label}</span>
                  </button>
                ))}
              </nav>
              <div className="p-3 border-t border-slate-100">
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50">
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main className="flex-1 md:ml-60 min-h-screen">
        {/* Desktop topbar */}
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between"
          style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{TAB_TITLE[tab]}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">

            {/* ══════════ DASHBOARD ══════════ */}
            {tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                {/* Hero banner */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#022c22 0%,#059669 60%,#10b981 100%)', boxShadow: '0 12px 40px rgba(5,150,105,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-emerald-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
                    {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-black text-white mb-1">Academic coordination and scheduling overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-4">
                    {[
                      { l: 'Active Classes',   v: [...new Set(timetable.map(t => t.class_section))].length },
                      { l: 'Total Students',   v: totalStudents },
                      { l: 'Teachers',         v: activeTeachers },
                      { l: 'Upcoming Exams',   v: 0 },
                    ].map(({ l, v }) => (
                      <div key={l}>
                        <p className="text-emerald-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p>
                        <p className="text-2xl font-black text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Active Classes"    value={[...new Set(timetable.map(t => t.class_section))].length} sub={`${totalStudents} students total`} color={ACCENT}   icon={Users} />
                  <StatCard label="Upcoming Exams"    value={0}              sub="Scheduled ahead"   color="#0891B2" icon={Calendar} />
                  <StatCard label="Scheme Entries"    value={totalSchemes}   sub={`${[...new Set(schemes.map(s => s.subject))].length} subjects`} color="#7C3AED" icon={BookMarked} />
                  <StatCard label="Homework"          value={0}              sub="Assigned this session" color="#D97706" icon={FileText} />
                </div>

                {/* Attendance overview */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Attendance Overview by Class</h3>
                    <button onClick={() => setTab('timetable')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>All Classes →</button>
                  </div>
                  <div className="p-5 space-y-3">
                    {[...new Set(timetable.map(t => t.class_section))].slice(0, 8).map(cls => {
                      const clsStudents = students.filter(s => s.class_section === cls).length;
                      const clsAttend   = attendance.filter(a => {
                        const st = students.find(s => s.roll_no === a.student_roll);
                        return st?.class_section === cls && a.status === 'Present';
                      }).length;
                      const total = attendance.filter(a => students.find(s => s.roll_no === a.student_roll && s.class_section === cls)).length;
                      const pct   = total > 0 ? Math.round((clsAttend / total) * 100) : 0;
                      const color = pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#C0392B';
                      return (
                        <div key={cls}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-700">{cls}</span>
                            <span className="text-xs font-black" style={{ color }}>
                              {pct}% · {clsAttend}P {total - clsAttend}A {total === 0 ? total : total}L
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                              className="h-full rounded-full" style={{ background: color }} />
                          </div>
                        </div>
                      );
                    })}
                    {timetable.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No class data yet</p>}
                  </div>
                </div>

                {/* 2-column: quick actions + recent uploads */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-3xl border border-slate-100 p-5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 className="font-black text-slate-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Upload Scheme',   icon: BookMarked, action: () => { setTab('scheme'); setModal('scheme'); } },
                        { label: 'Announcement',    icon: Megaphone,  action: () => { setTab('announcements'); setModal('announce'); } },
                        { label: 'Message Teacher', icon: Send,       action: () => { setTab('messages'); setModal('msg'); } },
                        { label: 'View Progress',   icon: TrendingUp, action: () => setTab('progress') },
                      ].map(({ label, icon: Icon, action }) => (
                        <motion.button key={label} onClick={action} whileTap={{ scale: 0.97 }}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-slate-600 hover:text-emerald-700">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                            <Icon size={18} style={{ color: ACCENT }} />
                          </div>
                          <span className="text-xs font-black">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">Recent Scheme Uploads</h3>
                      <button onClick={() => setTab('scheme')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                    </div>
                    {schemes.slice(0, 6).map((s) => (
                      <div key={s.id} className="px-5 py-3 flex items-start justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{s.topic}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{s.subject} · {s.program} Pt {s.part}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{s.week_no ? `Wk ${s.week_no}` : s.month || '—'}</span>
                      </div>
                    ))}
                    {!schemes.length && <p className="p-5 text-center text-slate-400 text-sm">No scheme uploads yet</p>}
                  </div>
                </div>

                {/* All classes at a glance */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">All Classes at a Glance</h3>
                    <span className="text-xs font-bold text-slate-400">{[...new Set(timetable.map(t => t.class_section))].length} sections</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead style={{ background: '#f8f9fd' }}>
                        <tr>{['Class','Students','Scheme Topics','Attendance %'].map(h =>
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {[...new Set(timetable.map(t => t.class_section))].slice(0, 12).map((cls, i) => {
                          const clsStudents = students.filter(s => s.class_section === cls).length;
                          const clsSchemes  = schemes.filter(s => s.class_section === cls || !s.class_section).length;
                          return (
                            <motion.tr key={cls} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-black text-slate-900">{cls}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-600">{clsStudents}</td>
                              <td className="px-4 py-2.5 text-slate-500">{clsSchemes}</td>
                              <td className="px-4 py-2.5"><span className="font-black text-emerald-600">—</span></td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ SCHEME OF STUDY ══════════ */}
            {tab === 'scheme' && (
              <motion.div key="scheme" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic or subject…"
                      className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                  </div>
                  <TS value={schemeFilter.program} onChange={e => setSchemeFilter(p => ({ ...p, program: e.target.value }))}>
                    <option value="">All Programs</option>{PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </TS>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('scheme')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white whitespace-nowrap"
                    style={{ background: GRADIENT }}>
                    <Plus size={15} /> Upload Topic
                  </motion.button>
                </div>

                {(() => {
                  const grouped: Record<string, Record<string, any[]>> = {};
                  filteredSchemes.forEach(s => {
                    const prog = s.program || 'Other';
                    const subj = s.subject || 'General';
                    if (!grouped[prog]) grouped[prog] = {};
                    if (!grouped[prog][subj]) grouped[prog][subj] = [];
                    grouped[prog][subj].push(s);
                  });
                  return Object.entries(grouped).map(([prog, subjects]) => (
                    <div key={prog} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between" style={{ background: '#f0fdf4' }}>
                        <h3 className="font-black text-slate-800">{prog}</h3>
                        <span className="text-xs font-bold text-slate-400">{Object.values(subjects).flat().length} topics</span>
                      </div>
                      {Object.entries(subjects).map(([subj, items]) => (
                        <div key={subj} className="border-b border-slate-50 last:border-0">
                          <div className="px-5 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
                            <BookOpen size={12} className="text-slate-400" />
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{subj}</p>
                          </div>
                          {items.map((s) => (
                            <div key={s.id} className="px-5 py-3 flex items-start justify-between hover:bg-slate-50/50 border-b border-slate-50 last:border-0 group">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800">{s.topic}</p>
                                {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                  {s.week_no && <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label={`Week ${s.week_no}`} />}
                                  {s.month && <Badge c="bg-blue-50 text-blue-700 border-blue-200" label={s.month} />}
                                  {s.class_section && <Badge c="bg-slate-100 text-slate-600 border-slate-200" label={s.class_section} />}
                                  <span className="text-[10px] text-slate-400">by {s.uploaded_by}</span>
                                </div>
                              </div>
                              <button onClick={() => deleteScheme(s.id)}
                                className="ml-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
                {!filteredSchemes.length && (
                  <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
                    <BookMarked size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-bold">No scheme entries.</p>
                    <button className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }} onClick={() => setModal('scheme')}>Upload the first topic →</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ TEACHER PROFILES ══════════ */}
            {tab === 'teachers' && (
              <motion.div key="teachers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subject…"
                    className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeachers.map((t) => {
                    const timetableEntries = timetable.filter(tt => tt.teacher_id === t.id);
                    const uniqueClasses    = [...new Set(timetableEntries.map(tt => tt.class_section))];
                    const isSelected       = selectedTeacher?.id === t.id;
                    return (
                      <motion.div key={t.id} layout
                        className={cn('bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all',
                          isSelected ? 'border-emerald-300 shadow-md' : 'border-slate-100 hover:border-emerald-200')}
                        onClick={() => setSelectedTeacher(isSelected ? null : t)}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                            style={{ background: `hsl(${(t.full_name?.charCodeAt(0) || 50) * 37 % 360},60%,50%)` }}>
                            {t.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{t.full_name}</p>
                            <p className="text-xs text-slate-400">{t.designation || 'Teacher'}</p>
                            <Badge c={t.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} label={t.status || 'Active'} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {t.subject_dept && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <BookOpen size={12} className="text-slate-400" /><span>{t.subject_dept}</span>
                            </div>
                          )}
                          {t.phone_no && (
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="text-slate-400 text-[10px]">TEL</span><span>{t.phone_no}</span>
                            </div>
                          )}
                          {uniqueClasses.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-50">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5">Classes Teaching</p>
                              <div className="flex flex-wrap gap-1">
                                {uniqueClasses.slice(0, 4).map(c => <Badge key={c} c="bg-emerald-50 text-emerald-700 border-emerald-200" label={c} />)}
                                {uniqueClasses.length > 4 && <span className="text-[10px] text-slate-400">+{uniqueClasses.length - 4} more</span>}
                              </div>
                            </div>
                          )}
                        </div>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-slate-100 space-y-2 overflow-hidden">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Timetable Entries</p>
                              {timetableEntries.length === 0 ? (
                                <p className="text-xs text-slate-400">No timetable entries</p>
                              ) : timetableEntries.slice(0, 5).map((tt, i) => (
                                <div key={i} className="text-xs flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5">
                                  <span className="font-bold text-slate-700">{tt.subject}</span>
                                  <span className="text-slate-400">{tt.class_section} · {tt.day_of_week}</span>
                                </div>
                              ))}
                              <button onClick={e => { e.stopPropagation(); setMsgForm((p: any) => ({ ...p, to_teacher_username: t.username || '' })); setModal('msg'); }}
                                className="w-full mt-2 py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
                                <Send size={12} /> Send Message
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                {!filteredTeachers.length && <p className="text-center py-12 text-slate-400 text-sm">No teachers found</p>}
              </motion.div>
            )}

            {/* ══════════ STUDENT ACADEMICS ══════════ */}
            {tab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by roll no, name or class…"
                    className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStudents.slice(0, 40).map((s) => {
                    const stats      = getStudentStats(s.roll_no);
                    const isSelected = selectedStudent?.roll_no === s.roll_no;
                    return (
                      <motion.div key={s.roll_no} layout
                        className={cn('bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all',
                          isSelected ? 'border-emerald-300 shadow-md' : 'border-slate-100 hover:border-emerald-200')}
                        onClick={() => setSelectedStudent(isSelected ? null : s)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
                            style={{ background: `hsl(${(s.roll_no % 36) * 10},65%,55%)` }}>
                            {s.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 truncate">{s.full_name}</p>
                            <p className="text-xs text-slate-400">#{s.roll_no} · {s.class_section}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black" style={{ color: ACCENT }}>{s.total_xp} XP</p>
                            <p className="text-[10px] text-slate-400">{s.current_badge}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            { label: 'Attendance', v: `${stats.attPct}%`, c: stats.attPct >= 75 ? '#27ae60' : '#c0392b' },
                            { label: 'Avg Score',  v: `${stats.avgScore}`, c: '#0891b2' },
                            { label: 'Courses',    v: stats.cp.length, c: '#7C3AED' },
                          ].map(({ label, v, c }) => (
                            <div key={label} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                              <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-black">{label}</p>
                            </div>
                          ))}
                        </div>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-slate-100 space-y-3 overflow-hidden">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-slate-400">Program:</span> <strong className="text-slate-700">{s.program} Pt {s.part}</strong></div>
                                <div><span className="text-slate-400">Status:</span> <strong className="text-slate-700">{s.status}</strong></div>
                                <div><span className="text-slate-400">Present:</span> <strong className="text-slate-700">{stats.presentDays}/{stats.totalDays}</strong></div>
                                <div><span className="text-slate-400">Exams:</span> <strong className="text-slate-700">{stats.sg.length}</strong></div>
                              </div>
                              {stats.cp.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Course Progress</p>
                                  {stats.cp.map((c) => {
                                    const pct = c.topics_total > 0 ? Math.round((c.topics_done / c.topics_total) * 100) : 0;
                                    return (
                                      <div key={c.id} className="mb-2">
                                        <div className="flex justify-between text-xs mb-0.5">
                                          <span className="font-bold text-slate-700 truncate">{c.subject}</span>
                                          <span className="font-black ml-2" style={{ color: ACCENT }}>{pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                            className="h-full rounded-full" style={{ background: ACCENT }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                {!filteredStudents.length && <p className="text-center py-12 text-slate-400 text-sm">No students found</p>}
              </motion.div>
            )}

            {/* ══════════ COURSE PROGRESS ══════════ */}
            {tab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or class…"
                      className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                  </div>
                  <TS value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="">All Programs</option>{PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </TS>
                </div>
                {(() => {
                  const bySubject: Record<string, any[]> = {};
                  courseProgress.filter(cp => !filter || cp.program === filter).forEach(cp => {
                    if (!bySubject[cp.subject]) bySubject[cp.subject] = [];
                    bySubject[cp.subject].push(cp);
                  });
                  return Object.entries(bySubject)
                    .filter(([subj]) => !search || subj.toLowerCase().includes(search.toLowerCase()))
                    .map(([subj, items]) => {
                      const avgPct    = items.length > 0 ? Math.round(items.reduce((s, c) => s + (c.topics_total > 0 ? (c.topics_done / c.topics_total) * 100 : 0), 0) / items.length) : 0;
                      const totalTopics = items[0]?.topics_total || 0;
                      const avgDone   = items.length > 0 ? Math.round(items.reduce((s, c) => s + c.topics_done, 0) / items.length) : 0;
                      return (
                        <div key={subj} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-black text-slate-900">{subj}</h3>
                              <p className="text-xs text-slate-400">{items.length} students · Avg {avgDone}/{totalTopics} topics</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black" style={{ color: ACCENT }}>{avgPct}%</p>
                              <p className="text-[10px] text-slate-400">Class Average</p>
                            </div>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${avgPct}%` }}
                              transition={{ duration: 0.9 }} className="h-full rounded-full" style={{ background: GRADIENT }} />
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {items.slice(0, 12).map((cp) => {
                              const st  = students.find(s => s.roll_no === cp.student_roll);
                              const pct = cp.topics_total > 0 ? Math.round((cp.topics_done / cp.topics_total) * 100) : 0;
                              return (
                                <div key={cp.id} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                                  <p className="text-xs font-black" style={{ color: pct >= 70 ? '#27ae60' : pct >= 40 ? ACCENT : '#c0392b' }}>{pct}%</p>
                                  <p className="text-[9px] text-slate-500 truncate">{st?.full_name?.split(' ')[0] || `#${cp.student_roll}`}</p>
                                </div>
                              );
                            })}
                            {items.length > 12 && (
                              <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center text-[10px] text-slate-400 border border-slate-100">
                                +{items.length - 12}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                })()}
                {courseProgress.length === 0 && <p className="text-center py-12 text-slate-400 text-sm">No course progress data yet</p>}
              </motion.div>
            )}

            {/* ══════════ TIMETABLE ══════════ */}
            {tab === 'timetable' && (
              <motion.div key="timetable" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by class, subject or teacher…"
                    className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                </div>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => {
                  const dayEntries = timetable.filter(tt => tt.day_of_week === day && (!search ||
                    tt.class_section?.toLowerCase().includes(search.toLowerCase()) ||
                    tt.subject?.toLowerCase().includes(search.toLowerCase())));
                  if (!dayEntries.length) return null;
                  return (
                    <div key={day} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3" style={{ background: '#f0fdf4' }}>
                        <Calendar size={14} className="text-emerald-600" />
                        <h3 className="font-black text-slate-800">{day}</h3>
                        <span className="text-xs text-slate-400">{dayEntries.length} periods</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              {['Time','Class','Subject','Teacher','Room','Campus'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dayEntries.sort((a, b) => a.start_time > b.start_time ? 1 : -1).map((tt) => {
                              const teacher = teachers.find(t => t.id === tt.teacher_id);
                              return (
                                <tr key={tt.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="px-4 py-2.5 font-bold text-slate-700 whitespace-nowrap">{tt.start_time?.slice(0, 5)} – {tt.end_time?.slice(0, 5)}</td>
                                  <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{tt.class_section}</td>
                                  <td className="px-4 py-2.5 font-medium text-slate-800">{tt.subject}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500">{teacher?.full_name || '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-500">{tt.room || '—'}</td>
                                  <td className="px-4 py-2.5 text-xs text-slate-400">{tt.campus || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                {!timetable.length && <p className="text-center py-12 text-slate-400 text-sm">No timetable data available</p>}
              </motion.div>
            )}

            {/* ══════════ ANNOUNCEMENTS ══════════ */}
            {tab === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-end">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('announce')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Plus size={15} /> New Announcement
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                              <Megaphone size={14} style={{ color: ACCENT }} />
                            </div>
                            <h3 className="font-black text-slate-900">{a.title}</h3>
                            <Badge c={a.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : a.priority === 'Low' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'} label={a.priority} />
                            <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label={a.target_type === 'all' ? 'Everyone' : a.target_type} />
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{a.body}</p>
                          <p className="text-[10px] text-slate-400 mt-2">by {a.created_by} · {new Date(a.created_at).toLocaleDateString('en-PK')}</p>
                          {a.expires_at && <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1"><Clock size={10} /> Expires: {new Date(a.expires_at).toLocaleDateString('en-PK')}</p>}
                        </div>
                        <button onClick={() => deleteAnnouncement(a.id)} className="text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {!announcements.length && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <Megaphone size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 font-bold">No announcements yet.</p>
                      <button className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }} onClick={() => setModal('announce')}>Create one →</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════ MESSAGES ══════════ */}
            {tab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-end">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('msg')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Send size={15} /> New Message
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('bg-white rounded-2xl border shadow-sm p-5 transition-all',
                        !m.is_read ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100')}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {!m.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACCENT }} />}
                            <p className="font-black text-slate-900">{m.subject}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>From: <strong className="text-slate-600">{m.from_user}</strong> ({m.from_role})</span>
                            <span>→</span>
                            <span>To: <strong className="text-slate-600">{m.to_teacher_username}</strong></span>
                          </div>
                          <p className="text-sm text-slate-600 mt-2">{m.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString('en-PK')}</p>
                        </div>
                        {!m.is_read && m.from_role !== adminData.role && (
                          <button onClick={() => markMessageRead(m.id)} className="text-xs font-black hover:underline flex-shrink-0" style={{ color: ACCENT }}>Mark read</button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {!messages.length && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <Mail size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 font-bold">No messages yet.</p>
                      <button className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }} onClick={() => setModal('msg')}>Send one →</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ══════════════ MODALS ══════════════ */}
      <AnimatePresence>
        {modal === 'scheme' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><BookMarked size={16} style={{ color: ACCENT }} /></div>
                  <h3 className="font-black text-slate-900">Upload Scheme Entry</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <FM label="Scheme Title" req><TI placeholder="e.g. Annual Scheme of Study 2026" value={schemeForm.title} onChange={e => setSchemeForm((p: any) => ({ ...p, title: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Subject" req><TI placeholder="e.g. Physics" value={schemeForm.subject} onChange={e => setSchemeForm((p: any) => ({ ...p, subject: e.target.value }))} /></FM>
                  <FM label="Class Section"><TI placeholder="e.g. ICS-Phy-A-B" value={schemeForm.class_section} onChange={e => setSchemeForm((p: any) => ({ ...p, class_section: e.target.value }))} /></FM>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Program" req><TS value={schemeForm.program} onChange={e => setSchemeForm((p: any) => ({ ...p, program: e.target.value }))}>{PROGRAMS.map(p => <option key={p}>{p}</option>)}</TS></FM>
                  <FM label="Part"><TS value={schemeForm.part} onChange={e => setSchemeForm((p: any) => ({ ...p, part: e.target.value }))}><option value={1}>Part 1</option><option value={2}>Part 2</option></TS></FM>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Week No."><TI type="number" placeholder="e.g. 3" value={schemeForm.week_no} onChange={e => setSchemeForm((p: any) => ({ ...p, week_no: e.target.value }))} /></FM>
                  <FM label="Month"><TS value={schemeForm.month} onChange={e => setSchemeForm((p: any) => ({ ...p, month: e.target.value }))}><option value="">Select Month</option>{MONTHS.map(m => <option key={m}>{m}</option>)}</TS></FM>
                </div>
                <FM label="Topic / Unit" req><TI placeholder="e.g. Chapter 3: Forces and Motion" value={schemeForm.topic} onChange={e => setSchemeForm((p: any) => ({ ...p, topic: e.target.value }))} /></FM>
                <FM label="Description"><TA rows={3} placeholder="Detailed description…" value={schemeForm.description} onChange={e => setSchemeForm((p: any) => ({ ...p, description: e.target.value }))} /></FM>
                <FM label="Uploaded By"><TI placeholder="Teacher name (defaults to your name)" value={schemeForm.uploaded_by} onChange={e => setSchemeForm((p: any) => ({ ...p, uploaded_by: e.target.value }))} /></FM>
              </div>
              <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={saveScheme}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
                  {saving ? 'Saving…' : <><CheckCircle size={14} /> Upload Topic</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'announce' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><Megaphone size={16} style={{ color: ACCENT }} /></div>
                  <h3 className="font-black text-slate-900">New Announcement</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <FM label="Title" req><TI placeholder="Announcement title…" value={announceForm.title} onChange={e => setAnnounceForm((p: any) => ({ ...p, title: e.target.value }))} /></FM>
                <FM label="Message" req><TA rows={4} placeholder="Announcement content…" value={announceForm.body} onChange={e => setAnnounceForm((p: any) => ({ ...p, body: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Target"><TS value={announceForm.target_type} onChange={e => setAnnounceForm((p: any) => ({ ...p, target_type: e.target.value }))}><option value="all">All</option><option value="teachers">Teachers Only</option><option value="class">Specific Class</option><option value="program">Specific Program</option></TS></FM>
                  <FM label="Priority"><TS value={announceForm.priority} onChange={e => setAnnounceForm((p: any) => ({ ...p, priority: e.target.value }))}><option>Normal</option><option>High</option><option>Low</option></TS></FM>
                </div>
                <FM label="Expiry Date (optional)"><TI type="date" value={announceForm.expires_at} onChange={e => setAnnounceForm((p: any) => ({ ...p, expires_at: e.target.value }))} /></FM>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={sendAnnouncement}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
                  {saving ? 'Publishing…' : <><Send size={14} /> Publish</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === 'msg' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><Mail size={16} style={{ color: ACCENT }} /></div>
                  <h3 className="font-black text-slate-900">Message Teacher</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <FM label="To Teacher" req>
                  <TS value={msgForm.to_teacher_username} onChange={e => setMsgForm((p: any) => ({ ...p, to_teacher_username: e.target.value }))}>
                    <option value="">Select Teacher</option>
                    {teachers.filter(t => t.username).map(t => <option key={t.id} value={t.username}>{t.full_name} ({t.subject_dept})</option>)}
                  </TS>
                </FM>
                <FM label="Subject" req><TI placeholder="Message subject…" value={msgForm.subject} onChange={e => setMsgForm((p: any) => ({ ...p, subject: e.target.value }))} /></FM>
                <FM label="Message" req><TA rows={5} placeholder="Type your message…" value={msgForm.body} onChange={e => setMsgForm((p: any) => ({ ...p, body: e.target.value }))} /></FM>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={sendMessage}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
                  {saving ? 'Sending…' : <><Send size={14} /> Send Message</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white flex items-center gap-2 shadow-xl ${toast.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};