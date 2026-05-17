import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Users, BookOpen, LogOut, Search, RefreshCw, X, Check,
  Loader2, FileText, Calendar, Settings, GraduationCap, BarChart3,
  Clock, ChevronDown, Bell, UserCheck, Plus, Eye, Trash2,
  AlertTriangle, CheckCircle, ClipboardList
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface CoordinatorPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const ACCENT   = '#059669';
const GRADIENT = 'linear-gradient(135deg,#059669,#047857)';

// ── Shared UI ──────────────────────────────────────────────────────────────
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

export const CoordinatorPortal: React.FC<CoordinatorPortalProps> = ({ onLogout, adminData }) => {
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
  const [homework,    setHomework]    = useState<any[]>([]);
  const [grades,      setGrades]      = useState<any[]>([]);
  const [scheme,      setScheme]      = useState<any[]>([]);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [exams,       setExams]       = useState<any[]>([]);
  const [leaves,      setLeaves]      = useState<any[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchQ,        setSearchQ]        = useState('');
  const [selectedClass,  setSelectedClass]  = useState('');
  const [classDetail,    setClassDetail]    = useState<any>(null);
  const [examModal,      setExamModal]      = useState(false);
  const [hwModal,        setHwModal]        = useState(false);
  const [saving,         setSaving]         = useState(false);

  // Exam form
  const [examForm, setExamForm] = useState({ title: '', class_section: '', subject: '', date: '', total_marks: '100', exam_type: 'Unit Test' });
  // Homework form
  const [hwForm, setHwForm]   = useState({ class_section: '', subject: '', title: '', description: '', due_date: '', teacher_id: '' });

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh   = () => setRefreshKey(k => k + 1);

  // ── Load all ───────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11] = await Promise.all([
      supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,gender,status').neq('status', 'Deleted').order('class_section').order('full_name'),
      supabase.from('teachers').select('id,full_name,designation,subject_dept,attendance_rate,status,assigned_classes').order('full_name'),
      supabase.from('timetable').select('*').order('day_of_week').order('start_time'),
      supabase.from('homework').select('id,class_section,subject,title,description,due_date,created_at,teacher_id').order('due_date', { ascending: false }).limit(60),
      supabase.from('grades').select('id,student_roll,subject,score,total_marks,grade_letter,percentage,created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('scheme_of_study').select('*').order('week_no'),
      supabase.from('attendance').select('student_roll,status,date').order('date', { ascending: false }).limit(2000),
      supabase.from('exams').select('id,title,class_section,subject,date,total_marks,exam_type,grading_status,created_at').order('date', { ascending: false }).limit(60),
      supabase.from('leave_requests').select('id,student_roll_no,student_name,class_section,reason,from_date,to_date,status,leave_type').order('created_at', { ascending: false }).limit(50),
      supabase.from('academic_sessions').select('*'),
      supabase.from('academic_programs').select('*'),
    ]);
    setStudents(s1.data || []);
    setTeachers(s2.data || []);
    setTimetable(s3.data || []);
    setHomework(s4.data || []);
    setGrades(s5.data || []);
    setScheme(s6.data || []);
    setAttendance(s7.data || []);
    setExams(s8.data || []);
    setLeaves(s9.data || []);
    // Log any query errors for debugging
    [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11].forEach((r, i) => { if (r.error) console.warn(`Query ${i + 1} error:`, r.error.message); });
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [refreshKey, loadAll]);

  // ── Save exam ──────────────────────────────────────────────────────────────
  const saveExam = async () => {
    if (!examForm.title || !examForm.class_section || !examForm.subject || !examForm.date) { showErr('Fill all required fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exams').insert([{
        title: examForm.title, class_section: examForm.class_section, subject: examForm.subject,
        date: examForm.date, total_marks: Number(examForm.total_marks), exam_type: examForm.exam_type,
        grading_status: 'Pending', created_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Exam scheduled'); setExamModal(false);
      setExamForm({ title: '', class_section: '', subject: '', date: '', total_marks: '100', exam_type: 'Unit Test' });
      refresh();
    } catch (e: any) { showErr(e.message); }
    finally { setSaving(false); }
  };

  // ── Save homework ──────────────────────────────────────────────────────────
  const saveHomework = async () => {
    if (!hwForm.class_section || !hwForm.subject || !hwForm.title || !hwForm.due_date) { showErr('Fill all required fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('homework').insert([{
        class_section: hwForm.class_section, subject: hwForm.subject, title: hwForm.title,
        description: hwForm.description, due_date: hwForm.due_date,
        teacher_id: hwForm.teacher_id ? Number(hwForm.teacher_id) : null,
      }]);
      if (error) throw error;
      showToast('✅ Homework assigned'); setHwModal(false);
      setHwForm({ class_section: '', subject: '', title: '', description: '', due_date: '', teacher_id: '' });
      refresh();
    } catch (e: any) { showErr(e.message); }
    finally { setSaving(false); }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const allClasses = [...new Set(students.map(s => s.class_section))].filter(Boolean).sort();
  const activeStudents = students.filter(s => s.status === 'Active').length;

  // Attendance map: roll_no → {present, absent, late, total}
  const attMap = useMemo(() => {
    const m: Record<number, { present: number; absent: number; late: number; total: number }> = {};
    attendance.forEach(a => {
      const r = Number(a.student_roll);
      if (!m[r]) m[r] = { present: 0, absent: 0, late: 0, total: 0 };
      m[r].total++;
      if (a.status === 'Present') m[r].present++;
      else if (a.status === 'Absent') m[r].absent++;
      else if (a.status === 'Late') m[r].late++;
    });
    return m;
  }, [attendance]);

  // Class summary: memoised to avoid recomputing on every render
  const classSummary = useMemo(() => allClasses.map(cs => {
    const studs = students.filter(s => s.class_section === cs);
    const prog = studs[0]?.program || '';
    const part = studs[0]?.part || '';
    let present = 0, absent = 0, late = 0;
    studs.forEach(s => {
      const a = attMap[s.roll_no];
      if (a) { present += a.present; absent += a.absent; late += a.late; }
    });
    const total = present + absent + late;
    const attPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const slots = timetable.filter(t => t.class_section === cs).length;
    const pendingLeaves = leaves.filter(l => l.class_section === cs && (!l.status || l.status === 'Pending')).length;
    // Grade avg — use a roll set for O(1) lookup instead of nested .some()
    const rollSet = new Set(studs.map(s => s.roll_no));
    const classGrades = grades.filter(g => rollSet.has(g.student_roll));
    const avgGrade = classGrades.length > 0 ? Math.round(classGrades.reduce((s, g) => s + Number(g.percentage || 0), 0) / classGrades.length) : 0;
    return { cs, prog, part, count: studs.length, attPct, present, absent, late, total, slots, pendingLeaves, avgGrade };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [students, attendance, timetable, leaves, grades]);

  // Filtered students for class drill-down
  const classStudents = classDetail
    ? students.filter(s => s.class_section === classDetail.cs)
    : students.filter(s =>
        (!selectedClass || s.class_section === selectedClass) &&
        (!searchQ || s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || String(s.roll_no).includes(searchQ))
      );

  // Upcoming exams (future dates)
  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = exams.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pastExams     = exams.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  // Timetable grouped by day
  const ttByDay: Record<string, any[]> = {};
  DAY_ORDER.forEach(d => { ttByDay[d] = []; });
  timetable.forEach(t => {
    const day = t.day_of_week;
    if (!ttByDay[day]) ttByDay[day] = [];
    ttByDay[day].push(t);
  });

  // NAV
  const NAV = [
    { id: 'dashboard', label: 'Dashboard',  icon: Home },
    { id: 'classes',   label: 'Classes',    icon: Users },
    { id: 'schedule',  label: 'Schedule',   icon: Calendar },
    { id: 'exams',     label: 'Exams',      icon: ClipboardList },
    { id: 'reports',   label: 'Reports',    icon: BarChart3 },
    { id: 'settings',  label: 'Scheme',     icon: BookOpen },
  ];
  const MOBILE_PRIMARY = NAV.slice(0, 4);
  const MOBILE_MORE    = NAV.slice(4);

  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Coordinator Overview', classes: 'Classes', schedule: 'Timetable & Homework',
    exams: 'Exams', reports: 'Academic Reports', settings: 'Scheme of Study',
  };

  // ── Color helper ───────────────────────────────────────────────────────────
  const gradePillColor = (letter: string) => {
    if (letter === 'A+' || letter === 'A') return 'bg-emerald-50 text-emerald-700';
    if (letter === 'B') return 'bg-blue-50 text-blue-700';
    if (letter === 'C') return 'bg-amber-50 text-amber-700';
    if (letter === 'D' || letter === 'E') return 'bg-orange-50 text-orange-700';
    return 'bg-rose-50 text-rose-700';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10" style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}><GraduationCap size={18} className="text-white" /></div>
            <div><p className="font-black text-slate-900 text-sm">PIC Campus</p><p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Coordinator Portal</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <motion.button key={id} onClick={() => { setTab(id); setClassDetail(null); }} whileHover={{ x: 2 }}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left', active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active ? { background: GRADIENT } : {}}>
                <Icon size={16} /><span className="flex-1">{label}</span>
              </motion.button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: GRADIENT }}>{adminData.full_name?.charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-800 truncate">{adminData.full_name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Coordinator</p></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"><LogOut size={13} /> Sign Out</button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}><GraduationCap size={14} className="text-white" /></div>
          <div><p className="font-black text-slate-900 text-sm leading-none">Coordinator</p><p className="text-[9px] font-bold" style={{ color: ACCENT }}>{adminData.full_name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">{savedMsg}</span>}
          <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-0">
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{classDetail ? `${classDetail.cs} — Details` : TAB_TITLE[tab]}</h1>
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
            {tab === 'dashboard' && !classDetail && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Hero */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#022c22 0%,#059669 60%,#10b981 100%)', boxShadow: '0 12px 40px rgba(5,150,105,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-emerald-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <h2 className="text-xl font-black mb-4">Academic coordination and scheduling overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    {[
                      { l: 'Active Classes', v: allClasses.length },
                      { l: 'Total Students', v: activeStudents },
                      { l: 'Teachers',       v: teachers.filter(t => t.status === 'Active').length },
                      { l: 'Upcoming Exams', v: upcomingExams.length },
                    ].map(({ l, v }) => (
                      <div key={l}><p className="text-emerald-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users}        label="Active Classes"  value={allClasses.length}    sub={`${activeStudents} students total`}   color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={ClipboardList} label="Upcoming Exams" value={upcomingExams.length}  sub="Scheduled ahead"                      color="bg-blue-50 text-blue-600" />
                  <StatCard icon={BookOpen}      label="Scheme Entries" value={scheme.length}         sub={`${[...new Set(scheme.map(s => s.subject))].length} subjects`} color="bg-purple-50 text-purple-600" />
                  <StatCard icon={FileText}      label="Homework"       value={homework.length}       sub="Assigned this session"                color="bg-amber-50 text-amber-600" />
                </div>

                {/* Attendance overview bars */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">📊 Attendance Overview by Class</h3>
                    <button onClick={() => setTab('classes')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>All Classes →</button>
                  </div>
                  <div className="p-5 space-y-3.5">
                    {classSummary.filter(c => c.total > 0).slice(0, 8).map(c => {
                      const color = c.attPct >= 75 ? '#059669' : c.attPct >= 50 ? '#D97706' : '#C0392B';
                      return <ProgressBar key={c.cs} pct={c.attPct} color={color} label={c.cs} sub={`${c.attPct}% · ${c.present}P ${c.absent}A ${c.late}L`} />;
                    })}
                    {classSummary.filter(c => c.total > 0).length === 0 && <p className="text-center text-slate-400 text-sm py-4">No attendance data yet</p>}
                  </div>
                </div>

                {/* Upcoming exams + recent homework side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Upcoming exams */}
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <h3 className="font-black text-slate-900">📝 Upcoming Exams</h3>
                      <button onClick={() => setTab('exams')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                    </div>
                    {upcomingExams.slice(0, 5).map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 font-black text-xs">
                          {new Date(e.date + 'T00:00:00').toLocaleDateString('en-PK', { day: '2-digit' })}
                          <span className="ml-0.5 text-[8px]">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-PK', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{e.title}</p>
                          <p className="text-[11px] text-slate-400">{e.class_section} · {e.subject} · {e.exam_type}</p>
                        </div>
                        <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', e.grading_status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{e.grading_status || 'Pending'}</span>
                      </motion.div>
                    ))}
                    {upcomingExams.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No upcoming exams</p>}
                  </div>

                  {/* Recent homework */}
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <h3 className="font-black text-slate-900">📋 Recent Homework</h3>
                      <button onClick={() => setTab('schedule')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                    </div>
                    {homework.slice(0, 5).map((h, i) => (
                      <motion.div key={h.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0"><FileText size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{h.title}</p>
                          <p className="text-[11px] text-slate-400">{h.class_section} · {h.subject}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 whitespace-nowrap">{h.due_date ? new Date(h.due_date + 'T00:00:00').toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}</p>
                      </motion.div>
                    ))}
                    {homework.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">No homework assigned yet</p>}
                  </div>
                </div>

                {/* Class summary mini cards */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">🏫 All Classes at a Glance</h3>
                    <span className="text-[10px] font-black text-slate-400">{allClasses.length} sections</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {classSummary.map(c => (
                      <motion.button key={c.cs} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setClassDetail(c); setTab('classes'); }}
                        className="text-left p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                        <p className="font-black text-slate-900 text-sm truncate">{c.cs}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.prog} · P{c.part}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-slate-600">{c.count} students</span>
                          <span className="text-[10px] font-black" style={{ color: c.attPct >= 75 ? '#059669' : c.attPct >= 50 ? '#D97706' : '#C0392B' }}>{c.attPct}%</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ CLASSES ════ */}
            {tab === 'classes' && !classDetail && (
              <motion.div key="classes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Total Classes', v: allClasses.length, c: ACCENT },
                    { l: 'Active Students', v: activeStudents, c: '#2563EB' },
                    { l: 'Teachers', v: teachers.filter(t => t.status === 'Active').length, c: '#9333EA' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setSelectedClass('')} className={cn('px-3 py-1.5 rounded-xl text-xs font-black border transition-all', !selectedClass ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')} style={!selectedClass ? { background: GRADIENT } : {}}>All</button>
                  {['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'].map(p => (
                    <button key={p} onClick={() => setSelectedClass(p === selectedClass ? '' : p)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-black border transition-all')}
                      style={selectedClass === p ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                      {p}
                    </button>
                  ))}
                </div>

                {/* Class cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classSummary.filter(c => !selectedClass || c.prog === selectedClass).map((c, i) => (
                    <motion.div key={c.cs} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setClassDetail(c)}>
                      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                        <div>
                          <p className="font-black text-slate-900 text-base">{c.cs}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.prog} · Part {c.part} · {c.count} students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black" style={{ color: c.attPct >= 75 ? '#059669' : c.attPct >= 50 ? '#D97706' : '#C0392B' }}>{c.attPct}%</p>
                          <p className="text-[10px] text-slate-400">attendance</p>
                        </div>
                      </div>
                      <div className="px-5 py-3">
                        <ProgressBar pct={c.attPct} color={c.attPct >= 75 ? '#059669' : c.attPct >= 50 ? '#D97706' : '#C0392B'} />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-3 text-[10px] font-bold">
                            <span className="text-emerald-600">✓ {c.present} Present</span>
                            <span className="text-rose-600">✗ {c.absent} Absent</span>
                            {c.late > 0 && <span className="text-amber-600">⏰ {c.late} Late</span>}
                          </div>
                          <div className="flex gap-2 text-[10px] text-slate-400">
                            <span>{c.slots} slots/wk</span>
                            {c.avgGrade > 0 && <span>· Avg {c.avgGrade}%</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════ CLASS DETAIL DRILL-DOWN ════ */}
            {tab === 'classes' && classDetail && (
              <motion.div key="class-detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Back button */}
                <button onClick={() => setClassDetail(null)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  ← Back to Classes
                </button>

                {/* Class hero */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#022c22,#059669)', boxShadow: '0 12px 40px rgba(5,150,105,0.25)' }}>
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10 bg-emerald-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <h2 className="text-2xl font-black mb-1">{classDetail.cs}</h2>
                  <p className="text-emerald-300 text-sm">{classDetail.prog} · Part {classDetail.part}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                    {[
                      { l: 'Students', v: classDetail.count },
                      { l: 'Attendance', v: `${classDetail.attPct}%` },
                      { l: 'Timetable Slots', v: classDetail.slots },
                      { l: 'Avg Grade', v: classDetail.avgGrade > 0 ? `${classDetail.avgGrade}%` : '—' },
                    ].map(({ l, v }) => (
                      <div key={l}><p className="text-emerald-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student name or roll no…"
                    className="w-full border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-white transition-all" />
                </div>

                {/* Students table */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">{classStudents.length} students in {classDetail.cs}</p>
                    <div className="flex gap-3 text-[10px] font-bold">
                      <span className="text-emerald-600">{classStudents.filter(s => s.gender === 'Male').length} Boys</span>
                      <span className="text-pink-600">{classStudents.filter(s => s.gender === 'Female').length} Girls</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto" style={{ maxHeight: 480 }}>
                    <table className="w-full text-xs min-w-[500px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Roll', 'Name', 'Father', 'Gender', 'Attendance', 'Status'].map(h =>
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {classStudents
                          .filter(s => !searchQ || s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) || String(s.roll_no).includes(searchQ))
                          .map((s, i) => {
                            const a = attMap[s.roll_no];
                            const attPct = a && a.total > 0 ? Math.round((a.present / a.total) * 100) : null;
                            return (
                              <motion.tr key={s.roll_no} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.01, 0.25) }}
                                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">{s.roll_no}</td>
                                <td className="px-4 py-3 font-black text-slate-900 max-w-[130px] truncate">{s.full_name}</td>
                                <td className="px-4 py-3 text-slate-500 max-w-[100px] truncate">{s.father_name}</td>
                                <td className="px-4 py-3">
                                  <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700')}>{s.gender}</span>
                                </td>
                                <td className="px-4 py-3">
                                  {attPct !== null
                                    ? <span className="font-black text-[11px]" style={{ color: attPct >= 75 ? '#059669' : attPct >= 50 ? '#D97706' : '#C0392B' }}>{attPct}%</span>
                                    : <span className="text-slate-300 text-[10px]">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{s.status}</span>
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Timetable for this class */}
                {(() => {
                  const classSlots = timetable.filter(t => t.class_section === classDetail.cs);
                  const byDay: Record<string, any[]> = {};
                  classSlots.forEach(t => { if (!byDay[t.day_of_week]) byDay[t.day_of_week] = []; byDay[t.day_of_week].push(t); });
                  return classSlots.length > 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">📅 Weekly Timetable</h3></div>
                      <div className="p-4 space-y-3">
                        {DAY_ORDER.filter(d => byDay[d]?.length > 0).map(day => (
                          <div key={day}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{day}</p>
                            <div className="flex flex-wrap gap-2">
                              {(byDay[day] || []).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(slot => (
                                <div key={slot.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                                  <div><p className="text-xs font-black text-slate-800">{slot.subject}</p><p className="text-[9px] text-slate-400">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)} · {slot.room || '—'}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Grades for this class */}
                {(() => {
                  const classStudentRolls = new Set(students.filter(s => s.class_section === classDetail.cs).map(s => s.roll_no));
                  const classGrades = grades.filter(g => classStudentRolls.has(g.student_roll));
                  if (!classGrades.length) return null;
                  const bySubject: Record<string, any[]> = {};
                  classGrades.forEach(g => { if (!bySubject[g.subject]) bySubject[g.subject] = []; bySubject[g.subject].push(g); });
                  return (
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">📊 Grade Summary by Subject</h3></div>
                      <div className="p-5 space-y-4">
                        {Object.entries(bySubject).map(([subj, gs]) => {
                          const avg = Math.round(gs.reduce((s, g) => s + Number(g.percentage || 0), 0) / gs.length);
                          return <ProgressBar key={subj} pct={avg} color={avg >= 75 ? '#059669' : avg >= 50 ? '#D97706' : '#C0392B'} label={subj} sub={`Avg ${avg}% · ${gs.length} entries`} />;
                        })}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ════ SCHEDULE (Timetable + Homework) ════ */}
            {tab === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                {/* Timetable grouped by day */}
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-slate-900 text-lg">Weekly Timetable</h2>
                  <div className="relative">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white outline-none focus:border-emerald-500">
                      <option value="">All Classes</option>
                      {allClasses.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  {DAY_ORDER.map(day => {
                    const slots = (ttByDay[day] || []).filter(t => !selectedClass || t.class_section === selectedClass)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));
                    if (!slots.length) return null;
                    return (
                      <div key={day} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                          <h3 className="font-black text-slate-900">{day}</h3>
                          <span className="text-[10px] font-bold text-slate-400">{slots.length} periods</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[500px]">
                            <thead style={{ background: '#f8f9fd' }}>
                              <tr>{['Time', 'Subject', 'Class', 'Room', 'Campus'].map(h =>
                                <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                              )}</tr>
                            </thead>
                            <tbody>
                              {slots.map((slot, i) => (
                                <motion.tr key={slot.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}</td>
                                  <td className="px-4 py-2.5 font-black text-slate-900">{slot.subject}</td>
                                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">{slot.class_section}</span></td>
                                  <td className="px-4 py-2.5 text-slate-500">{slot.room || '—'}</td>
                                  <td className="px-4 py-2.5 text-slate-400 text-[10px]">{slot.campus || '—'}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Homework section */}
                <div className="flex items-center justify-between pt-2">
                  <h2 className="font-black text-slate-900 text-lg">Homework</h2>
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setHwModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Plus size={15} /> Assign Homework
                  </motion.button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto" style={{ maxHeight: 400 }}>
                    <table className="w-full text-xs min-w-[560px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Due Date', 'Title', 'Class', 'Subject', 'Assigned By'].map(h =>
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {homework.filter(h => !selectedClass || h.class_section === selectedClass).map((h, i) => {
                          const teacher = teachers.find(t => t.id === h.teacher_id);
                          const overdue = h.due_date && h.due_date < today;
                          return (
                            <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
                              className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={cn('text-[11px] font-black', overdue ? 'text-rose-600' : 'text-slate-600')}>
                                  {h.due_date ? new Date(h.due_date + 'T00:00:00').toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-black text-slate-900 max-w-[180px] truncate">{h.title}</td>
                              <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">{h.class_section}</span></td>
                              <td className="px-4 py-2.5 text-slate-600">{h.subject}</td>
                              <td className="px-4 py-2.5 text-slate-400 text-[10px]">{teacher?.full_name || '—'}</td>
                            </motion.tr>
                          );
                        })}
                        {homework.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No homework assigned yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ EXAMS ════ */}
            {tab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
                    {[
                      { l: 'Upcoming', v: upcomingExams.length, c: '#2563EB' },
                      { l: 'Completed', v: pastExams.length, c: ACCENT },
                      { l: 'Graded', v: exams.filter(e => e.grading_status === 'Graded').length, c: '#9333EA' },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                        <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setExamModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white flex-shrink-0" style={{ background: GRADIENT }}>
                    <Plus size={15} /> Schedule Exam
                  </motion.button>
                </div>

                {/* Class filter */}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setSelectedClass('')} className={cn('px-3 py-1.5 rounded-xl text-xs font-black border transition-all', !selectedClass ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')} style={!selectedClass ? { background: GRADIENT } : {}}>All Classes</button>
                  {allClasses.map(c => (
                    <button key={c} onClick={() => setSelectedClass(selectedClass === c ? '' : c)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all"
                      style={selectedClass === c ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Upcoming exams */}
                {upcomingExams.filter(e => !selectedClass || e.class_section === selectedClass).length > 0 && (
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Upcoming</p>
                    <div className="space-y-3">
                      {upcomingExams.filter(e => !selectedClass || e.class_section === selectedClass).map((e, i) => {
                        const daysLeft = Math.ceil((new Date(e.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-2xl border-l-4 border border-blue-200 overflow-hidden shadow-sm" style={{ borderLeftColor: '#2563EB' }}>
                            <div className="px-5 py-4 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 border border-blue-100">
                                <p className="font-black text-blue-700 text-base leading-none">{new Date(e.date + 'T00:00:00').getDate()}</p>
                                <p className="text-[9px] font-black text-blue-400">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-PK', { month: 'short' })}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900">{e.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{e.class_section} · {e.subject} · {e.total_marks} marks</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700">{e.exam_type}</span>
                                  <span className="text-[10px] text-slate-400">{daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}</span>
                                </div>
                              </div>
                              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0', e.grading_status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{e.grading_status || 'Pending'}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past exams */}
                {pastExams.filter(e => !selectedClass || e.class_section === selectedClass).length > 0 && (
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Completed</p>
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto" style={{ maxHeight: 400 }}>
                        <table className="w-full text-xs min-w-[560px]">
                          <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                            <tr>{['Date', 'Title', 'Class', 'Subject', 'Marks', 'Type', 'Status'].map(h =>
                              <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>
                            )}</tr>
                          </thead>
                          <tbody>
                            {pastExams.filter(e => !selectedClass || e.class_section === selectedClass).map((e, i) => (
                              <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
                                className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                                <td className="px-4 py-2.5 font-black text-slate-900 max-w-[160px] truncate">{e.title}</td>
                                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700">{e.class_section}</span></td>
                                <td className="px-4 py-2.5 text-slate-600">{e.subject}</td>
                                <td className="px-4 py-2.5 font-bold text-slate-700">{e.total_marks}</td>
                                <td className="px-4 py-2.5 text-slate-500">{e.exam_type}</td>
                                <td className="px-4 py-2.5"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', e.grading_status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{e.grading_status || 'Pending'}</span></td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {exams.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                    <ClipboardList size={28} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 font-bold">No exams scheduled yet</p>
                    <p className="text-slate-300 text-sm mt-1">Click "Schedule Exam" to add one</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════ REPORTS ════ */}
            {tab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users}        label="Active Students" value={activeStudents} sub={`${allClasses.length} sections`} color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={UserCheck}    label="Teachers Active" value={teachers.filter(t => t.status === 'Active').length} color="bg-blue-50 text-blue-600" />
                  <StatCard icon={ClipboardList} label="Grades Entered" value={grades.length} sub={`${[...new Set(grades.map(g => g.subject))].length} subjects`} color="bg-purple-50 text-purple-600" />
                  <StatCard icon={FileText}     label="Homework Set"   value={homework.length} color="bg-amber-50 text-amber-600" />
                </div>

                {/* Class attendance report */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Attendance Report — All Classes</h3></div>
                  <div className="p-5 space-y-3.5">
                    {classSummary.map(c => {
                      const color = c.attPct >= 75 ? '#059669' : c.attPct >= 50 ? '#D97706' : '#C0392B';
                      return (
                        <div key={c.cs}>
                          <ProgressBar pct={c.attPct} color={color} label={`${c.cs} · ${c.prog} P${c.part}`} sub={`${c.attPct}% · ${c.count} students`} />
                        </div>
                      );
                    })}
                    {classSummary.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No data yet</p>}
                  </div>
                </div>

                {/* Teachers */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Teaching Staff</h3></div>
                  <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
                    <table className="w-full text-xs min-w-[520px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Name', 'Designation', 'Department', 'Experience', 'Attendance', 'Status'].map(h =>
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {teachers.map((t, i) => (
                          <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                                  style={{ background: `hsl(${(t.id * 47) % 360},55%,45%)` }}>{t.full_name?.charAt(0)}</div>
                                <span className="font-black text-slate-900">{t.full_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{t.designation || '—'}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700">{t.subject_dept || '—'}</span></td>
                            <td className="px-4 py-3 text-slate-500">{t.experience || '—'}</td>
                            <td className="px-4 py-3 font-black text-emerald-600">{t.attendance_rate || '—'}</td>
                            <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{t.status || 'Active'}</span></td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grades breakdown */}
                {grades.length > 0 && (() => {
                  const bySubject: Record<string, any[]> = {};
                  grades.forEach(g => { if (!bySubject[g.subject]) bySubject[g.subject] = []; bySubject[g.subject].push(g); });
                  const maxCount = Math.max(...Object.values(bySubject).map(gs => gs.length));
                  return (
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Grade Distribution by Subject</h3></div>
                      <div className="p-5 space-y-4">
                        {Object.entries(bySubject).map(([subj, gs]) => {
                          const avg = Math.round(gs.reduce((s, g) => s + Number(g.percentage || 0), 0) / gs.length);
                          const aGrades = gs.filter(g => g.grade_letter === 'A+' || g.grade_letter === 'A').length;
                          const fGrades = gs.filter(g => g.grade_letter === 'F').length;
                          return (
                            <div key={subj}>
                              <ProgressBar pct={avg} color={avg >= 75 ? '#059669' : avg >= 50 ? '#D97706' : '#C0392B'}
                                label={subj} sub={`Avg ${avg}% · ${gs.length} entries · A: ${aGrades} F: ${fGrades}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Leave requests */}
                {leaves.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">Leave Requests</h3>
                      <span className="text-[10px] font-black text-amber-600">{leaves.filter(l => !l.status || l.status === 'Pending').length} pending</span>
                    </div>
                    <div className="divide-y divide-slate-50" style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {leaves.map((l, i) => (
                        <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          className="flex items-center gap-3 px-5 py-3.5">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0',
                            l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                            {(l.student_name || 'S')?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{l.student_name || `Roll #${l.student_roll_no}`}</p>
                            <p className="text-[11px] text-slate-400">{l.reason} · {l.from_date}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {l.class_section && <span className="text-[10px] text-slate-400">{l.class_section}</span>}
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black',
                              l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>
                              {l.status || 'Pending'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════ SCHEME OF STUDY ════ */}
            {tab === 'settings' && (
              <motion.div key="scheme" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Total Entries', v: scheme.length, c: ACCENT },
                    { l: 'Subjects', v: [...new Set(scheme.map(s => s.subject))].length, c: '#2563EB' },
                    { l: 'Max Week', v: Math.max(0, ...scheme.map(s => s.week_no || 0)), c: '#9333EA' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-2xl font-black" style={{ color: c }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Progress per subject */}
                {(() => {
                  const bySubject: Record<string, number> = {};
                  scheme.forEach(s => { bySubject[s.subject] = (bySubject[s.subject] || 0) + 1; });
                  const maxCnt = Math.max(...Object.values(bySubject));
                  return (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <p className="font-black text-slate-900 mb-4 text-sm">Topics Uploaded by Subject</p>
                      <div className="space-y-2.5">
                        {Object.entries(bySubject).sort((a, b) => b[1] - a[1]).map(([subject, count]) => (
                          <ProgressBar key={subject} pct={Math.round((count / maxCnt) * 100)} color={ACCENT}
                            label={subject} sub={`${count} ${count === 1 ? 'entry' : 'entries'}`} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Full scheme table */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Scheme of Study ({scheme.length} entries)</h3>
                    <button onClick={refresh} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100"><RefreshCw size={12} className="text-slate-500" /></button>
                  </div>
                  {scheme.length === 0 ? (
                    <div className="p-12 text-center text-slate-400"><BookOpen size={28} className="mx-auto mb-3" /><p>No entries yet</p></div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
                      <table className="w-full text-xs min-w-[640px]">
                        <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                          <tr>{['Week', 'Month', 'Subject', 'Program', 'Part', 'Topic', 'Description', 'Uploaded By'].map(h =>
                            <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>
                          )}</tr>
                        </thead>
                        <tbody>
                          {scheme.map((s, i) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
                              className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-black" style={{ color: ACCENT }}>W{s.week_no}</td>
                              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.month || '—'}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{s.subject}</td>
                              <td className="px-4 py-3 text-slate-500">{s.program}</td>
                              <td className="px-4 py-3 text-slate-500">P{s.part}</td>
                              <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">{s.topic}</td>
                              <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{s.description || '—'}</td>
                              <td className="px-4 py-3 text-slate-400 text-[10px]">{s.uploaded_by || '—'}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_PRIMARY.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => { setTab(id); setClassDetail(null); }} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: active ? ACCENT : '#94a3b8' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={active ? { background: `${ACCENT}18` } : {}}><Icon size={19} /></div>
                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{label}</span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />}
              </button>
            );
          })}
          <div className="relative flex-1 min-w-0">
            <button onClick={() => setMoreOpen(p => !p)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl w-full" style={{ color: MOBILE_MORE.some(n => n.id === tab) ? ACCENT : '#94a3b8' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={MOBILE_MORE.some(n => n.id === tab) ? { background: `${ACCENT}18` } : {}}><Settings size={19} /></div>
              <span className="text-[9px] font-black uppercase tracking-tight">More</span>
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden" style={{ minWidth: 185 }}>
                  {MOBILE_MORE.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setTab(id); setClassDetail(null); setMoreOpen(false); }}
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

      {/* ── SCHEDULE EXAM MODAL ── */}
      <AnimatePresence>
        {examModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExamModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="font-black text-slate-900 text-lg">Schedule Exam</h3><p className="text-xs text-slate-400 mt-0.5">Add a new exam to the calendar</p></div>
                  <button onClick={() => setExamModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Exam Title', key: 'title', placeholder: 'e.g. Unit Test 1 — Physics', type: 'text' },
                    { label: 'Subject', key: 'subject', placeholder: 'e.g. Physics', type: 'text' },
                    { label: 'Date', key: 'date', placeholder: '', type: 'date' },
                    { label: 'Total Marks', key: 'total_marks', placeholder: '100', type: 'number' },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                      <input type={type} value={(examForm as any)[key]} onChange={e => setExamForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Section</label>
                    <select value={examForm.class_section} onChange={e => setExamForm(p => ({ ...p, class_section: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-white font-medium">
                      <option value="">Select class…</option>
                      {allClasses.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Unit Test', 'Mid Term', 'Final', 'Quiz', 'Practical'].map(t => (
                        <button key={t} onClick={() => setExamForm(p => ({ ...p, exam_type: t }))}
                          className={cn('px-3 py-1.5 rounded-xl text-xs font-black border transition-all', examForm.exam_type === t ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200')}
                          style={examForm.exam_type === t ? { background: GRADIENT } : {}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setExamModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={saveExam} disabled={saving}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: GRADIENT }}>
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Schedule</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ASSIGN HOMEWORK MODAL ── */}
      <AnimatePresence>
        {hwModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHwModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="font-black text-slate-900 text-lg">Assign Homework</h3><p className="text-xs text-slate-400 mt-0.5">Set homework for a class</p></div>
                  <button onClick={() => setHwModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Section</label>
                    <select value={hwForm.class_section} onChange={e => setHwForm(p => ({ ...p, class_section: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-white font-medium">
                      <option value="">Select class…</option>
                      {allClasses.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {[
                    { label: 'Subject', key: 'subject', placeholder: 'e.g. Mathematics' },
                    { label: 'Homework Title', key: 'title', placeholder: 'e.g. Exercise 5 — Q1 to Q10' },
                    { label: 'Description', key: 'description', placeholder: 'Optional details…' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                      <input value={(hwForm as any)[key]} onChange={e => setHwForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                      <input type="date" value={hwForm.due_date} onChange={e => setHwForm(p => ({ ...p, due_date: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teacher</label>
                      <select value={hwForm.teacher_id} onChange={e => setHwForm(p => ({ ...p, teacher_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-white font-medium">
                        <option value="">Optional</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setHwModal(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={saveHomework} disabled={saving}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: GRADIENT }}>
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Assign</>}
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