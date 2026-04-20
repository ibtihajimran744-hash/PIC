import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Calendar, FileText, ClipboardList, Armchair,
  Eye, PenLine, Award, LogOut, RefreshCw, X, Plus,
  Search, CheckCircle, AlertCircle, Clock, Users,
  Menu, ChevronRight, Shield, BookOpen, BarChart2
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface Props {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

const ACCENT   = '#4F46E5';
const GRADIENT = 'linear-gradient(135deg,#4F46E5,#7C3AED)';

const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

type Tab = 'dashboard' | 'schedules' | 'exams' | 'papers' | 'seating' | 'invigilation' | 'grades' | 'results';

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'schedules',    label: 'Exam Schedules', icon: Calendar },
  { id: 'exams',        label: 'Exams',          icon: FileText },
  { id: 'papers',       label: 'Paper Setup',    icon: ClipboardList },
  { id: 'seating',      label: 'Seating Plans',  icon: Armchair },
  { id: 'invigilation', label: 'Invigilation',   icon: Eye },
  { id: 'grades',       label: 'Grade Entry',    icon: PenLine },
  { id: 'results',      label: 'Result Cards',   icon: Award },
];

const EXAM_TYPES = ['Mid-Term','Final','Unit Test','Mock','Board','Chapter Test','Quiz','Assignment'];
const PROGRAMS   = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];
const ROOMS      = ['Room 101','Room 102','Room 103','Room 201','Room 202','Room 203','Hall A','Hall B','Lab 1','Lab 2'];

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
  <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 bg-white transition-all" />
);
const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 bg-white">{children}</select>
);
const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 bg-white resize-none transition-all" />
);

export const ExaminerPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [tab,      setTab]      = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  const [schedules,    setSchedules]    = useState<any[]>([]);
  const [exams,        setExams]        = useState<any[]>([]);
  const [papers,       setPapers]       = useState<any[]>([]);
  const [seating,      setSeating]      = useState<any[]>([]);
  const [invigilation, setInvigilation] = useState<any[]>([]);
  const [results,      setResults]      = useState<any[]>([]);
  const [grades,       setGrades]       = useState<any[]>([]);
  const [students,     setStudents]     = useState<any[]>([]);
  const [teachers,     setTeachers]     = useState<any[]>([]);
  const [adminUsers,   setAdminUsers]   = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal,   setModal]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [studentSearch, setStudentSearch] = useState({ name: '', roll: '', class: '' });

  const [schedForm, setSchedForm] = useState<any>({ title: '', exam_type: 'Mid-Term', session: '2026-27', program: '', part: 1, class_section: '', start_date: '', end_date: '', status: 'Upcoming' });
  const [examForm,  setExamForm]  = useState<any>({ title: '', class_section: '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '', teacher_id: '' });
  const [paperForm, setPaperForm] = useState<any>({ exam_id: '', subject: '', total_marks: 100, pass_marks: 40, duration_mins: 180, paper_type: 'Written', instructions: '', syllabus_refs: '' });
  const [seatForm,  setSeatForm]  = useState<any>({ exam_name: '', student_roll: '', room_no: '', seat_no: '', date: '', class_name: '', full_name: '' });
  const [invigiForm,setInvigiForm]= useState<any>({ exam_name: '', teacher_name: '', class_name: '', room_no: '', exam_date: '' });
  const [gradeForm, setGradeForm] = useState<any>({ exam_id: '', student_roll: '', subject: '', score: '', total_marks: 100, grade_letter: '', remarks: '' });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sc }, { data: ex }, { data: pp }, { data: se }, { data: iv }, { data: rc }, { data: gr }, { data: st }, { data: tc }, { data: au }] = await Promise.all([
      supabase.from('exam_schedule').select('*').order('created_at', { ascending: false }),
      supabase.from('exams').select('*').order('date', { ascending: false }),
      supabase.from('exam_papers').select('*').order('created_at', { ascending: false }),
      supabase.from('exam_seating').select('*').order('created_at', { ascending: false }),
      supabase.from('exam_invigilation').select('*').order('created_at', { ascending: false }),
      supabase.from('result_cards').select('*').order('generated_at', { ascending: false }),
      supabase.from('grades').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('students').select('roll_no,full_name,class_section,program,part').order('roll_no'),
      supabase.from('teachers').select('id,full_name,designation,subject_dept').order('full_name'),
      supabase.from('admin_users').select('id,full_name,role').order('full_name'),
    ]);
    setSchedules(sc || []); setExams(ex || []); setPapers(pp || []);
    setSeating(se || []); setInvigilation(iv || []); setResults(rc || []);
    setGrades(gr || []); setStudents(st || []); setTeachers(tc || []); setAdminUsers(au || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getGradeLetter = (score: number, total: number) => {
    const p = (score / total) * 100;
    if (p >= 85) return 'A+';
    if (p >= 75) return 'A';
    if (p >= 65) return 'B';
    if (p >= 55) return 'C';
    if (p >= 45) return 'D';
    return 'F';
  };

  const getStatus = (score: number, total: number) => {
    return (score / total) * 100 >= 40 ? 'Pass' : 'Fail';
  };

  const saveSchedule = async () => {
    if (!schedForm.title || !schedForm.start_date) { showToast('Title and start date required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_schedule').insert([{ ...schedForm, created_by: adminData.full_name }]);
      if (error) throw error;
      showToast('Exam schedule created');
      setSchedForm({ title: '', exam_type: 'Mid-Term', session: '2026-27', program: '', part: 1, class_section: '', start_date: '', end_date: '', status: 'Upcoming' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const savePaper = async () => {
    if (!paperForm.exam_id || !paperForm.subject) { showToast('Exam and subject required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_papers').insert([{ ...paperForm, exam_id: Number(paperForm.exam_id), total_marks: Number(paperForm.total_marks), pass_marks: Number(paperForm.pass_marks), duration_mins: Number(paperForm.duration_mins), created_by: adminData.full_name }]);
      if (error) throw error;
      showToast('Exam paper configured');
      setPaperForm({ exam_id: '', subject: '', total_marks: 100, pass_marks: 40, duration_mins: 180, paper_type: 'Written', instructions: '', syllabus_refs: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveSeat = async () => {
    if (!seatForm.exam_name || !seatForm.student_roll || !seatForm.seat_no || !seatForm.room_no) {
      showToast('All seating info (Exam Name, Student, Seat, Room) is required', false); return;
    }
    setSaving(true);
    try {
      // 1. Save Seating Detail
      const { error } = await supabase.from('exam_seating').insert([{
        student_roll: Number(seatForm.student_roll),
        exam_name: seatForm.exam_name,
        room: seatForm.room_no,
        seat_no: seatForm.seat_no,
        date: seatForm.date,
        subject: seatForm.exam_name // In seating manual entry, the examiner types the exam name
      }]);
      if (error) throw error;

      // 2. Automatically notify student
      await supabase.from('notifications').insert([{
        target_user_id: String(seatForm.student_roll),
        target_role: 'STUDENT',
        title: `🪑 Seating Assigned: ${seatForm.exam_name}`,
        message: `Your seating for "${seatForm.exam_name}" has been assigned. Room: ${seatForm.room_no}, Seat Number: ${seatForm.seat_no}. Date/Time: ${seatForm.date || 'Check schedule'}.`,
        type: 'exam_seating',
        is_read: false
      }]);

      showToast(`Seating assigned and student notified`);
      setSeatForm({ exam_name: '', student_roll: '', room_no: '', seat_no: '', date: '', class_name: '', full_name: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveInvigi = async () => {
    if (!invigiForm.exam_name || !invigiForm.teacher_name) { showToast('Exam name and teacher required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_invigilation').insert([{
        teacher_name: invigiForm.teacher_name,
        exam_name: invigiForm.exam_name,
        class_name: invigiForm.class_name,
        room: invigiForm.room_no,
        date: invigiForm.exam_date,
        subject: invigiForm.exam_name,
        shift: 'Manual'
      }]);
      if (error) throw error;
      
      // Notify Teacher
      const teacher = teachers.find(t => t.full_name === invigiForm.teacher_name);
      if (teacher) {
        await supabase.from('notifications').insert([{
           target_user_id: teacher.id,
           target_role: 'TEACHER',
           title: '🛡️ Invigilation Duty Assigned',
           message: `You have been assigned as invigilator for "${invigiForm.exam_name}" on ${invigiForm.exam_date || 'scheduled date'}. Room: ${invigiForm.room_no || 'TBD'}.`,
           type: 'invigilation',
           is_read: false
        }]);
      }

      showToast('Invigilation duty assigned and teacher notified');
      setInvigiForm({ exam_name: '', teacher_name: '', class_name: '', room_no: '', exam_date: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveGrade = async () => {
    if (!gradeForm.exam_id || !gradeForm.student_roll || gradeForm.score === '') {
      showToast('Exam, student and score are required', false); return;
    }
    setSaving(true);
    try {
      const score = Number(gradeForm.score), total = Number(gradeForm.total_marks);
      const pct = (score / total) * 100, letter = getGradeLetter(score, total);
      const { error } = await supabase.from('grades').insert([{ exam_id: Number(gradeForm.exam_id), student_roll: Number(gradeForm.student_roll), subject: gradeForm.subject, score, total_marks: total, percentage: pct.toFixed(2), grade_letter: letter, remarks: gradeForm.remarks, is_verified: false, entered_by_coordinator: false, verified_by: adminData.full_name }]);
      if (error) throw error;
      showToast(`Grade saved: ${letter} (${pct.toFixed(0)}%)`);
      setGradeForm({ exam_id: '', student_roll: '', subject: '', score: '', total_marks: 100, grade_letter: '', remarks: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const generateResultCards = async (scheduleId: number) => {
    setSaving(true);
    try {
      const schedGrades   = grades.filter(g => exams.find(e => e.id === g.exam_id));
      const studentRolls  = [...new Set(schedGrades.map(g => g.student_roll))];
      const rows: any[]   = studentRolls.map(roll => {
        const sg       = schedGrades.filter(g => g.student_roll === roll);
        const obtained = sg.reduce((s, g) => s + (g.score || 0), 0);
        const total    = sg.reduce((s, g) => s + (g.total_marks || 0), 0);
        const pct      = total > 0 ? ((obtained / total) * 100) : 0;
        return { student_roll: roll, exam_schedule_id: scheduleId, total_marks: total, obtained_marks: obtained, percentage: pct.toFixed(2), grade: getGradeLetter(obtained, total), is_published: false, generated_by: adminData.full_name };
      });
      if (!rows.length) { showToast('No grades found to generate results from', false); return; }
      rows.sort((a, b) => b.obtained_marks - a.obtained_marks);
      rows.forEach((r, i) => { r.position = i + 1; });
      const { error } = await supabase.from('result_cards').insert(rows);
      if (error) throw error;
      showToast(`Result cards generated for ${rows.length} students`); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const publishResults = async (scheduleId: number) => {
    await supabase.from('result_cards').update({ is_published: true, published_at: new Date().toISOString() }).eq('exam_schedule_id', scheduleId);
    showToast('Results published'); loadAll();
  };

  const verifyGrade = async (gradeId: number) => {
    await supabase.from('grades').update({ is_verified: true, verified_by: adminData.full_name, verified_at: new Date().toISOString() }).eq('id', gradeId);
    showToast('Grade verified'); loadAll();
  };

  const updateScheduleStatus = async (id: number, status: string) => {
    await supabase.from('exam_schedule').update({ status }).eq('id', id);
    showToast(`Schedule marked as ${status}`); loadAll();
  };

  const upcomingExams    = schedules.filter(s => s.status === 'Upcoming').length;
  const ongoingExams     = schedules.filter(s => s.status === 'Ongoing').length;
  const unverifiedGrades = grades.filter(g => !g.is_verified).length;
  const publishedResults = results.filter(r => r.is_published).length;

  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Dashboard', schedules: 'Exam Schedules', exams: 'Exams',
    papers: 'Paper Setup', seating: 'Seating Plans', invigilation: 'Invigilation',
    grades: 'Grade Entry', results: 'Result Cards',
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10"
        style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}>
              <PenLine size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">PIC Campus</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Examiner Portal</p>
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
                {id === 'grades' && unverifiedGrades > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unverifiedGrades > 9 ? '9+' : unverifiedGrades}
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
            <PenLine size={14} className="text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">Examiner</p>
            <p className="text-[9px] font-bold" style={{ color: ACCENT }}>{adminData.full_name}</p>
          </div>
        </div>
        <button onClick={() => setSideOpen(true)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Menu size={16} className="text-slate-600" />
        </button>
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
                    <PenLine size={16} className="text-white" />
                  </div>
                  <p className="font-black text-slate-900 text-sm">Examiner</p>
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

                {/* Hero */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#4F46E5 60%,#7C3AED 100%)', boxShadow: '0 12px 40px rgba(79,70,229,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-indigo-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">
                    {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="text-xl font-black text-white mb-1">Examination management overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-4">
                    {[
                      { l: 'Exam Schedules',    v: schedules.length },
                      { l: 'Upcoming',          v: upcomingExams },
                      { l: 'Unverified Grades', v: unverifiedGrades },
                      { l: 'Published Results', v: publishedResults },
                    ].map(({ l, v }) => (
                      <div key={l}>
                        <p className="text-indigo-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p>
                        <p className="text-2xl font-black text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Exam Schedules"    value={schedules.length} sub={`${upcomingExams} upcoming`}       color={ACCENT}     icon={Calendar} />
                  <StatCard label="Total Exams"        value={exams.length}     sub="Created this session"              color="#0891b2"    icon={FileText} />
                  <StatCard label="Unverified Grades"  value={unverifiedGrades} sub="Needs verification"                color="#D97706"    icon={PenLine} />
                  <StatCard label="Published Results"  value={publishedResults} sub="Result cards published"            color="#059669"    icon={Award} />
                </div>

                {/* Recent exams */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Recent Exams</h3>
                    <button onClick={() => setTab('exams')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                  </div>
                  {exams.slice(0, 6).map((e) => (
                    <div key={e.id} className="px-5 py-3 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{e.title}</p>
                        <p className="text-xs text-slate-400">{e.class_section} · {e.subject} · {e.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={e.exam_type} />
                        <Badge c={e.grading_status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : e.grading_status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'} label={e.grading_status || 'Pending'} />
                      </div>
                    </div>
                  ))}
                  {!exams.length && <p className="p-5 text-center text-slate-400 text-sm">No exams created yet</p>}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'View Exams',       icon: BookOpen,   action: () => setTab('exams') },
                    { label: 'Assign Seats',     icon: Armchair,   action: () => setTab('seating') },
                    { label: 'Assign Duties',    icon: Eye,        action: () => setTab('invigilation') },
                    { label: 'Enter Grades',     icon: PenLine,    action: () => { setTab('grades'); setModal('grade'); } },
                  ].map(({ label, icon: Icon, action }) => (
                    <motion.button key={label} onClick={action} whileTap={{ scale: 0.97 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-slate-600 hover:text-indigo-700">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Icon size={18} style={{ color: ACCENT }} />
                      </div>
                      <span className="text-xs font-black">{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Unverified grades alert */}
                {unverifiedGrades > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-amber-800">{unverifiedGrades} grades awaiting verification</p>
                      <p className="text-xs text-amber-600 mt-0.5">Click Grade Entry to review and verify</p>
                    </div>
                    <button onClick={() => setTab('grades')} className="text-xs font-black text-amber-700 hover:underline">Go →</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ EXAM SCHEDULES ══════════ */}
            {tab === 'schedules' && (
              <motion.div key="schedules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 mb-2">
                   <p className="text-xs text-indigo-700 font-bold flex items-center gap-2"><Shield size={14} /> View only. Schedules are created by the Academics Head.</p>
                </div>
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-slate-900">{s.title}</h3>
                            <Badge c={s.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : s.status === 'Ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' : s.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} label={s.status} />
                            <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={s.exam_type} />
                          </div>
                          <p className="text-xs text-slate-500">{s.program} · Part {s.part} · {s.session}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Calendar size={10} /> {s.start_date} → {s.end_date}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.status === 'Upcoming' && (
                            <button onClick={() => updateScheduleStatus(s.id, 'Ongoing')} className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">▶ Start</button>
                          )}
                          {s.status === 'Ongoing' && (
                            <button onClick={() => updateScheduleStatus(s.id, 'Completed')} className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Complete</button>
                          )}
                          <button disabled={saving} onClick={() => generateResultCards(s.id)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 disabled:opacity-50">Generate Results</button>
                          {results.filter(r => r.exam_schedule_id === s.id && !r.is_published).length > 0 && (
                            <button disabled={saving} onClick={() => publishResults(s.id)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 disabled:opacity-50">Publish</button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          { label: 'Exams',     v: exams.filter(e => e.class_section === s.class_section).length },
                          { label: 'Results',   v: results.filter(r => r.exam_schedule_id === s.id).length },
                          { label: 'Published', v: results.filter(r => r.exam_schedule_id === s.id && r.is_published).length },
                        ].map(({ label, v }) => (
                          <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                            <p className="text-lg font-black text-slate-700">{v}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase">{label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {!schedules.length && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <Calendar size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 font-bold">No exam schedules.</p>
                      <button className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }} onClick={() => setModal('sched')}>Create one →</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════ EXAMS (AUTOMATIC) ══════════ */}
            {tab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 mb-6 shadow-sm">
                   <h2 className="text-lg font-black text-indigo-900">Upcoming Exams</h2>
                   <p className="text-xs text-indigo-600">This list is automatically populated from the Academic Schedule upload.</p>
                </div>
                <div className="relative">
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                   <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams by subject or class…"
                     className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 bg-white shadow-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.filter(e => !search || e.subject?.toLowerCase().includes(search.toLowerCase()) || e.class_section?.toLowerCase().includes(search.toLowerCase())).map((e) => (
                    <div key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                           <FileText size={20} />
                         </div>
                         <div>
                           <h3 className="font-black text-slate-900">{e.subject}</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{e.exam_type}</p>
                         </div>
                       </div>
                       <div className="space-y-2 mt-4 text-xs font-bold text-slate-600">
                         <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><Users size={12} className="text-slate-400" /> Class: {e.class_section}</p>
                         <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><Calendar size={12} className="text-slate-400" /> Date: {e.date}</p>
                         <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><Clock size={12} className="text-slate-400" /> Time: {e.time || '—'}</p>
                       </div>
                    </div>
                  ))}
                  {!exams.length && <div className="col-span-full py-20 text-center text-slate-400 font-bold">No automatic exams populated yet.</div>}
                </div>
              </motion.div>
            )}

            {/* ══════════ PAPER SETUP ══════════ */}
            {tab === 'papers' && (
              <motion.div key="papers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-end">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('paper')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Plus size={15} /> Add Paper Spec
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {papers.map((p) => {
                    const ex = exams.find(e => e.id === p.exam_id);
                    return (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
                                <ClipboardList size={15} style={{ color: ACCENT }} />
                              </div>
                              <div>
                                <h3 className="font-black text-slate-900">{p.subject}</h3>
                                <p className="text-xs text-slate-400">Exam: {ex?.title || `#${p.exam_id}`}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge c="bg-blue-50 text-blue-700 border-blue-200" label={`Total: ${p.total_marks}`} />
                              <Badge c="bg-amber-50 text-amber-700 border-amber-200" label={`Pass: ${p.pass_marks}`} />
                              <Badge c="bg-purple-50 text-purple-700 border-purple-200" label={`${p.duration_mins} mins`} />
                              <Badge c="bg-slate-100 text-slate-600 border-slate-200" label={p.paper_type} />
                            </div>
                            {p.instructions && <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100"><strong>Instructions:</strong> {p.instructions}</p>}
                            {p.syllabus_refs && <p className="text-xs mt-1 font-bold" style={{ color: ACCENT }}>Syllabus: {p.syllabus_refs}</p>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {!papers.length && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <ClipboardList size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 font-bold">No paper specs.</p>
                      <button className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }} onClick={() => setModal('paper')}>Add one →</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════ SEATING PLANS (MANUAL) ══════════ */}
            {tab === 'seating' && (
              <motion.div key="seating" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                   <div className="flex-1">
                      <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Search size={16} /> Filter Students</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         <FM label="Student Name"><TI placeholder="John Doe" value={studentSearch.name} onChange={e => setStudentSearch(p => ({ ...p, name: e.target.value }))} /></FM>
                         <FM label="Roll Number"><TI placeholder="2628001" value={studentSearch.roll} onChange={e => setStudentSearch(p => ({ ...p, roll: e.target.value }))} /></FM>
                         <FM label="Class Name"><TI placeholder="ICS-Phy-A" value={studentSearch.class} onChange={e => setStudentSearch(p => ({ ...p, class: e.target.value }))} /></FM>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">Student List (Assign Seating)</div>
                   <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-sm">
                         <thead className="sticky top-0 bg-white">
                            <tr className="border-b border-slate-100">
                               {['Roll No','Full Name','Class','Action'].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
                            </tr>
                         </thead>
                         <tbody>
                            {students.filter(s => {
                               const matchName = !studentSearch.name || s.full_name?.toLowerCase().includes(studentSearch.name.toLowerCase());
                               const matchRoll = !studentSearch.roll || String(s.roll_no).includes(studentSearch.roll);
                               const matchClass = !studentSearch.class || s.class_section?.toLowerCase().includes(studentSearch.class.toLowerCase());
                               return matchName && matchRoll && matchClass;
                            }).slice(0, 50).map(s => (
                               <tr key={s.roll_no} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-black" style={{ color: ACCENT }}>{s.roll_no}</td>
                                  <td className="px-6 py-4 font-bold text-slate-700">{s.full_name}</td>
                                  <td className="px-6 py-4 text-slate-500 font-medium">{s.class_section}</td>
                                  <td className="px-6 py-4">
                                     <button onClick={() => {
                                       setSeatForm({ exam_name: '', student_roll: String(s.roll_no), full_name: s.full_name, class_name: s.class_section, seat_no: '', room_no: '', date: '' });
                                       setModal('seat-manual');
                                     }} className="px-4 py-2 rounded-xl text-xs font-black text-white hover:opacity-80 transition-opacity" style={{ background: GRADIENT }}>
                                        Assign Seat
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ INVIGILATION (MANUAL) ══════════ */}
            {tab === 'invigilation' && (
              <motion.div key="invigilation" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Column 1: Teacher List */}
                   <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[700px] flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><Users size={16} /> Teacher Roster</h3>
                         <div className="relative w-40">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..." className="w-full text-[10px] pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-400" />
                         </div>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                         {teachers.filter(t => !search || t.full_name?.toLowerCase().includes(search.toLowerCase())).map(t => (
                            <div key={t.id} className="p-4 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50/50">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{t.full_name?.charAt(0)}</div>
                                  <div>
                                     <p className="text-sm font-black text-slate-800">{t.full_name}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase">{t.subject_dept || 'General'}</p>
                                  </div>
                               </div>
                               <button onClick={() => {
                                 setInvigiForm(p => ({ ...p, teacher_name: t.full_name }));
                                 setModal('invigi-manual');
                               }} className="text-xs font-black text-indigo-600 hover:underline">Select & Assign</button>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Column 2: Current Assignments */}
                   <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[700px] flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                         <h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><Eye size={16} /> Current Invigilation Duties</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                         {invigilation.map((iv) => (
                           <div key={iv.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                             <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-black text-slate-900">{iv.teacher_name}</span>
                                <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={`Room ${iv.room || '—'}`} />
                             </div>
                             <div className="space-y-1 text-xs">
                                <p className="text-slate-500 font-bold flex items-center gap-2"><FileText size={12} /> {iv.exam_name || iv.subject}</p>
                                <p className="text-slate-500 font-bold flex items-center gap-2"><Calendar size={12} /> {iv.date}</p>
                                <p className="text-slate-500 font-bold flex items-center gap-2"><Users size={12} /> Class: {iv.class_name || 'All'}</p>
                             </div>
                           </div>
                         ))}
                         {!invigilation.length && <div className="py-20 text-center text-slate-400 text-sm">No invigilation assignments yet.</div>}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ GRADE ENTRY ══════════ */}
            {tab === 'grades' && (
              <motion.div key="grades" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by roll no or subject…"
                      className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 bg-white" />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('grade')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <PenLine size={15} /> Enter Grade
                  </motion.button>
                </div>
                {unverifiedGrades > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                    <p className="text-sm font-black text-amber-800">{unverifiedGrades} grades awaiting verification</p>
                  </div>
                )}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Student','Roll #','Subject','Score','Total','Grade','%','Verified','Date','Action'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grades.filter(g => !search || String(g.student_roll).includes(search) || g.subject?.toLowerCase().includes(search.toLowerCase())).slice(0, 100).map((g) => {
                          const st = students.find(s => s.roll_no === g.student_roll);
                          return (
                            <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-medium text-slate-800">{st?.full_name || '—'}</td>
                              <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{g.student_roll}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-600">{g.subject}</td>
                              <td className="px-4 py-2.5 font-black text-slate-800">{g.score}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{g.total_marks}</td>
                              <td className="px-4 py-2.5">
                                <span className={`font-black text-sm ${g.grade_letter === 'A+' || g.grade_letter === 'A' ? 'text-emerald-600' : g.grade_letter === 'F' ? 'text-rose-600' : 'text-blue-600'}`}>{g.grade_letter}</span>
                              </td>
                              <td className="px-4 py-2.5 text-xs font-bold text-slate-600">{g.percentage ? `${Number(g.percentage).toFixed(1)}%` : '—'}</td>
                              <td className="px-4 py-2.5">{g.is_verified ? <span className="text-emerald-600 font-black text-xs flex items-center gap-1"><CheckCircle size={11} /> Verified</span> : <span className="text-amber-500 text-xs font-bold">Pending</span>}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">{g.created_at ? new Date(g.created_at).toLocaleDateString('en-PK') : '—'}</td>
                              <td className="px-4 py-2.5">
                                {!g.is_verified && (
                                  <button onClick={() => verifyGrade(g.id)} className="text-xs font-black hover:underline" style={{ color: ACCENT }}>Verify →</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {!grades.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">No grades entered yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ RESULT CARDS ══════════ */}
            {tab === 'results' && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Performance Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l: 'Total Results', v: results.length, c: '#4f46e5', i: Award },
                    { l: 'Pass Rate', v: `${results.length > 0 ? (((results.filter(r => Number(r.percentage) >= 40).length) / results.length) * 100).toFixed(1) : 0}%`, c: '#10b981', i: CheckCircle },
                    { l: 'Avg. Score', v: `${results.length > 0 ? (results.reduce((s, r) => s + Number(r.percentage), 0) / results.length).toFixed(1) : 0}%`, c: '#f59e0b', i: BarChart2 },
                    { l: 'Failures', v: results.filter(r => Number(r.percentage) < 40).length, c: '#ef4444', i: AlertCircle }
                  ].map(s => (
                    <div key={s.l} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.c}10` }}><s.i size={18} style={{ color: s.c }} /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.l}</p><p className="text-lg font-black text-slate-900 leading-none">{s.v}</p></div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Result Cards</h3>
                    <span className="text-xs font-bold text-slate-400">{results.length} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Student','Roll #','Schedule','Total','Obtained','%','Grade','Position','Status','Published'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => {
                          const st    = students.find(s => s.roll_no === r.student_roll);
                          const sched = schedules.find(s => s.id === r.exam_schedule_id);
                          return (
                            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-medium text-slate-800">{st?.full_name || '—'}</td>
                              <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{r.student_roll}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{sched?.title || `#${r.exam_schedule_id}`}</td>
                              <td className="px-4 py-2.5 text-slate-600">{r.total_marks}</td>
                              <td className="px-4 py-2.5 font-black text-slate-800">{r.obtained_marks}</td>
                              <td className="px-4 py-2.5 text-xs font-bold text-slate-600">{Number(r.percentage).toFixed(1)}%</td>
                              <td className="px-4 py-2.5"><span className={`font-black ${r.grade === 'A+' || r.grade === 'A' ? 'text-emerald-600' : r.grade === 'F' ? 'text-rose-600' : 'text-blue-600'}`}>{r.grade}</span></td>
                              <td className="px-4 py-2.5 font-black text-amber-600">#{r.position}</td>
                              <td className="px-4 py-2.5">{r.is_published ? <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label="Published" /> : <Badge c="bg-slate-100 text-slate-500 border-slate-200" label="Draft" />}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">{r.published_at ? new Date(r.published_at).toLocaleDateString('en-PK') : '—'}</td>
                            </tr>
                          );
                        })}
                        {!results.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">No result cards generated yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ══════════════ MODALS ══════════════ */}
      <AnimatePresence>
        {/* Manual Seating Modal */}
        {modal === 'seat-manual' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: GRADIENT }} />
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base"><Armchair size={18} style={{ color: ACCENT }} /> Manual Seating Assignment</h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student</p>
                  <p className="font-black text-slate-800">{seatForm.full_name}</p>
                  <p className="text-xs text-slate-500 font-bold">Roll: {seatForm.student_roll} · Class: {seatForm.class_name}</p>
                </div>
                <FM label="Exam Name (Type Manually)" req><TI placeholder="e.g. Physics Midterm" value={seatForm.exam_name} onChange={e => setSeatForm((p: any)=> ({ ...p, exam_name: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Room Number" req><TI placeholder="Ex: Hall A" value={seatForm.room_no} onChange={e => setSeatForm((p: any)=> ({ ...p, room_no: e.target.value }))} /></FM>
                  <FM label="Seat Number" req><TI placeholder="Ex: 42" value={seatForm.seat_no} onChange={e => setSeatForm((p: any)=> ({ ...p, seat_no: e.target.value }))} /></FM>
                </div>
                <FM label="Exam Date/Time"><TI type="datetime-local" value={seatForm.date} onChange={e => setSeatForm((p: any)=> ({ ...p, date: e.target.value }))} /></FM>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                <button onClick={saveSeat} disabled={saving} className="w-full py-3 rounded-2xl text-sm font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95" style={{ background: GRADIENT }}>
                  {saving ? 'Saving...' : 'Assign Seat & Notify Student'}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">A notification will be sent automatically</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Manual Invigilation Modal */}
        {modal === 'invigi-manual' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: GRADIENT }} />
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base"><Eye size={18} style={{ color: ACCENT }} /> Manual Invigilation Duty</h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invigilator</p>
                  <p className="font-black text-slate-800">{invigiForm.teacher_name}</p>
                </div>
                <FM label="Exam Name (Subject)" req><TI placeholder="Physics Midterm" value={invigiForm.exam_name} onChange={e => setInvigiForm((p: any)=> ({ ...p, exam_name: e.target.value }))} /></FM>
                <FM label="Target Class"><TI placeholder="ICS-Phy-A" value={invigiForm.class_name} onChange={e => setInvigiForm((p: any)=> ({ ...p, class_name: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Room Number"><TI placeholder="Room 201" value={invigiForm.room_no} onChange={e => setInvigiForm((p: any)=> ({ ...p, room_no: e.target.value }))} /></FM>
                  <FM label="Date"><TI type="date" value={invigiForm.exam_date} onChange={e => setInvigiForm((p: any)=> ({ ...p, exam_date: e.target.value }))} /></FM>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <button onClick={saveInvigi} disabled={saving} className="w-full py-3 rounded-2xl text-sm font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95" style={{ background: GRADIENT }}>
                  {saving ? 'Assigning...' : 'Assign Duty'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grade Modal */}
        {modal === 'grade' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden shadow-emerald-500/10">
              <div className="h-1.5" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50"><PenLine size={16} className="text-emerald-600" /></div>
                  <h3 className="font-black text-slate-900">Enter Exam Grade</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1"><X size={22} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Select Exam" req><TS value={gradeForm.exam_id} onChange={e => {
                    const ex = exams.find(x => String(x.id) === e.target.value);
                    setGradeForm((p: any) => ({ ...p, exam_id: e.target.value, subject: ex?.subject || '', total_marks: ex?.total_marks || 100 }));
                  }}><option value="">Select...</option>{exams.map(e => <option key={e.id} value={e.id}>{e.subject} – {e.class_section}</option>)}</TS></FM>
                  <FM label="Subject"><TI value={gradeForm.subject} readOnly /></FM>
                </div>
                <FM label="Select Student" req><TS value={gradeForm.student_roll} onChange={e => setGradeForm((p: any) => ({ ...p, student_roll: e.target.value }))}><option value="">Select...</option>{students.map(s => <option key={s.roll_no} value={s.roll_no}>#{s.roll_no} – {s.full_name}</option>)}</TS></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Score" req><TI type="number" value={gradeForm.score} onChange={e => setGradeForm((p: any) => ({ ...p, score: e.target.value }))} /></FM>
                  <FM label="Total Marks"><TI type="number" value={gradeForm.total_marks} onChange={e => setGradeForm((p: any) => ({ ...p, total_marks: e.target.value }))} /></FM>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Grade (Letter)"><TI placeholder="e.g. A" value={gradeForm.grade_letter} onChange={e => setGradeForm((p: any) => ({ ...p, grade_letter: e.target.value }))} /></FM>
                  <FM label="Remarks"><TI placeholder="Good job!" value={gradeForm.remarks} onChange={e => setGradeForm((p: any) => ({ ...p, remarks: e.target.value }))} /></FM>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={saveGrade} disabled={saving} className="px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95" style={{ background: GRADIENT }}>
                  {saving ? 'Saving...' : 'Save Grade'}
                </button>
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