import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Users, BarChart3, GraduationCap, Bell, LogOut,
  Search, RefreshCw, AlertTriangle, CheckCircle, Clock, X,
  FileText, Check, Calendar, Eye, Plus, Loader2, Save,
  Target, ChevronDown, ChevronRight, Upload, Download,
  Layers, BookMarked, Brain, Zap, TrendingUp, TrendingDown,
  MessageSquare, Send, Pin, Trash2, Edit3, AlertCircle,
  PlayCircle, CheckSquare, Square, Award, Star, Activity,
  ChevronLeft, Filter, MoreVertical, Megaphone, Link,
  PieChart, Clipboard, Monitor, Hash, Tag, Sun
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

// ─── Theme ────────────────────────────────────────────────────────────────────
const AC = '#0891B2';
const AG = 'linear-gradient(135deg,#0891B2,#0E7490)';
const DARK_HEADER = 'linear-gradient(135deg,#042F2E 0%,#083344 60%,#0E7490 100%)';

// ─── Shared primitives (copied pattern from AdminPortal) ──────────────────────
const ProgressBar = ({ pct, color = AC, label, sub }: { pct: number; color?: string; label?: string; sub?: string }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      {(label || sub) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <p className="text-xs font-bold text-slate-800">{label}</p>}
          {sub && <p className="text-[11px] font-black" style={{ color }}>{sub}</p>}
        </div>
      )}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${w}%` }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg,${color},${color}bb)` }}>
          <motion.div animate={{ x: ['-200%', '400%'] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: 0.8 }}
            className="absolute inset-y-0 w-1/3 bg-white/25" style={{ transform: 'skewX(-20deg)' }} />
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, alert, onClick }: any) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    className={cn('bg-white rounded-2xl p-4 border transition-all', alert ? 'border-rose-200' : 'border-slate-100', onClick && 'cursor-pointer hover:shadow-md')}
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
    onClick={onClick}
    whileHover={onClick ? { y: -2 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    as={motion.div}>
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={17} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

const TI = (props: any) => (
  <input {...props} className={cn("w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 transition-all bg-white", props.className)} />
);
const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 bg-white appearance-none font-medium text-slate-800">{children}</select>
);

// ─── Days / Periods constants ─────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const PROGRAMS_LIST = ['ICS Physics', 'ICS Statistics', 'Pre-Medical', 'Pre-Engineering', 'FA IT', 'FA General', 'I.Com'];
const SUBJECTS_COMMON = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Statistics', 'Economics', 'Accounting'];

// ─── Badge colors for quiz scores ────────────────────────────────────────────
const scoreBadge = (score: number) => {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface AcademicsPortalProps {
  adminData: { id: string; full_name: string; role: string; username: string };
  onBack?: () => void;
}

export const AcademicsPortal: React.FC<AcademicsPortalProps> = ({ adminData, onBack }) => {
  const [tab, setTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh = () => setRefreshKey(k => k + 1);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schemeList, setSchemeList] = useState<any[]>([]);
  const [reschedules, setReschedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [topicPlans, setTopicPlans] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);

  // ── Local UI state ──────────────────────────────────────────────────────────

  // SOS
  const [sosProgram, setSosProgram] = useState(PROGRAMS_LIST[0]);
  const [sosPart, setSosPart] = useState(1);
  const [sosSubject, setSosSubject] = useState('');
  const [sosTeacher, setSosTeacher] = useState('');
  const [sosTopics, setSosTopics] = useState('');
  const [sosWeek, setSosWeek] = useState(1);
  const [sosMonth, setSosMonth] = useState('January');
  const [sosTopic, setSosTopic] = useState('');
  const [sosFilter, setSosFilter] = useState('');

  // Timetable
  const [ttGrid, setTtGrid] = useState<Record<string, Record<string, any>>>({});
  const [ttSection, setTtSection] = useState('');
  const [ttEditCell, setTtEditCell] = useState<{day:string,period:string}|null>(null);
  const [ttForm, setTtForm] = useState({ subject: '', teacher: '', room: '' });

  // Topic Planner
  const [tpProgram, setTpProgram] = useState(PROGRAMS_LIST[0]);
  const [tpSubject, setTpSubject] = useState('');
  const [tpDate, setTpDate] = useState(new Date().toISOString().slice(0, 10));
  const [tpTopic, setTpTopic] = useState('');
  const [tpWeek, setTpWeek] = useState(1);
  const [tpNotes, setTpNotes] = useState('');

  // Resources
  const [resProgram, setResProgram] = useState(PROGRAMS_LIST[0]);
  const [resSubject, setResSubject] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resTag, setResTag] = useState('Notes');
  const [resUploading, setResUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annTarget, setAnnTarget] = useState<'all'|'teachers'|'students'>('all');
  const [annPinned, setAnnPinned] = useState(false);

  // Reschedule filter
  const [rescFilter, setRescFilter] = useState<'Pending'|'Approved'|'Rejected'|''>('Pending');

  // Quiz management
  const [quizSubject, setQuizSubject] = useState('');
  const [quizQ, setQuizQ] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizAnswer, setQuizAnswer] = useState(0);
  const [quizDate, setQuizDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t1, t2, t3, t4, t5, t6, t7, t8, t9] = await Promise.all([
        supabase.from('teachers').select('*').order('full_name'),
        supabase.from('students').select('roll_no,full_name,class_section,program,part,gender,status').eq('status', 'Active').order('full_name'),
        supabase.from('scheme_of_study').select('*').order('week_no'),
        supabase.from('reschedule_requests').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('timetable').select('*').order('day'),
        supabase.from('student_course_progress').select('*').limit(500),
        // These tables may not exist yet — graceful fallback
        supabase.from('academic_resources').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('academic_quizzes').select('*').order('quiz_date', { ascending: false }).limit(50),
        supabase.from('academic_announcements').select('*').order('created_at', { ascending: false }).limit(30),
      ]);

      setTeachers(t1.data || []);
      setStudents(t2.data || []);
      setSchemeList(t3.data || []);
      setReschedules(t4.data || []);
      setTimetable(t5.data || []);
      setCourseProgress(t6.data || []);
      setResources(t7.data || []);
      setQuizzes(t8.data || []);
      setAnnouncements(t9.data || []);

      // Build timetable grid from DB data
      if (t5.data) {
        const grid: Record<string, Record<string, any>> = {};
        t5.data.forEach((row: any) => {
          if (!grid[row.day]) grid[row.day] = {};
          grid[row.day][row.period] = { subject: row.subject, teacher: row.teacher_name, room: row.room, id: row.id };
        });
        setTtGrid(grid);
      }

      // Build topic plans from scheme_of_study
      setTopicPlans(t3.data || []);

    } catch (e: any) {
      console.error(e);
      // Don't block UI — some tables may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [refreshKey]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const sections = [...new Set(students.map(s => s.class_section))].sort();
  const subjectMap: Record<string, number> = {};
  schemeList.forEach(s => { subjectMap[s.subject] = (subjectMap[s.subject] || 0) + 1; });
  const pendingReschedules = reschedules.filter(r => r.status === 'Pending' || !r.status).length;
  const avgProgress = courseProgress.length > 0
    ? Math.round(courseProgress.reduce((s, c) => s + (c.progress_pct || 0), 0) / courseProgress.length)
    : 0;

  // Teacher progress summary
  const teacherProgressMap = teachers.map(t => {
    const prog = courseProgress.filter(cp => cp.teacher_name === t.full_name || cp.uploaded_by === t.full_name);
    const avgP = prog.length > 0 ? Math.round(prog.reduce((s, p) => s + (p.progress_pct || 0), 0) / prog.length) : 0;
    return { ...t, avgProgress: avgP, topicCount: prog.length };
  });

  // ── Actions ─────────────────────────────────────────────────────────────────
  const saveSchemeEntry = async () => {
    if (!sosSubject.trim() || !sosTopic.trim()) { showErr('Subject and topic are required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('scheme_of_study').insert([{
        program: sosProgram,
        part: sosPart,
        subject: sosSubject.trim(),
        topic: sosTopic.trim(),
        week_no: sosWeek,
        month: sosMonth,
        teacher_name: sosTeacher,
        total_topics: Number(sosTopics) || null,
        uploaded_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Scheme entry added');
      setSosTopic(''); setSosTopics('');
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const saveTopicPlan = async () => {
    if (!tpSubject.trim() || !tpTopic.trim()) { showErr('Subject and topic required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('scheme_of_study').insert([{
        program: tpProgram,
        subject: tpSubject.trim(),
        topic: tpTopic.trim(),
        week_no: tpWeek,
        planned_date: tpDate,
        notes: tpNotes,
        uploaded_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Topic plan saved');
      setTpTopic(''); setTpNotes('');
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const saveTimetableCell = async () => {
    if (!ttEditCell) return;
    setSaving(true);
    try {
      const existing = ttGrid[ttEditCell.day]?.[ttEditCell.period];
      if (existing?.id) {
        if (!ttForm.subject) {
          // Delete
          await supabase.from('timetable').delete().eq('id', existing.id);
        } else {
          await supabase.from('timetable').update({ subject: ttForm.subject, teacher_name: ttForm.teacher, room: ttForm.room }).eq('id', existing.id);
        }
      } else if (ttForm.subject) {
        await supabase.from('timetable').insert([{
          class_section: ttSection,
          day: ttEditCell.day,
          period: ttEditCell.period,
          subject: ttForm.subject,
          teacher_name: ttForm.teacher,
          room: ttForm.room,
          created_by: adminData.full_name,
        }]);
      }
      setTtEditCell(null);
      setTtForm({ subject: '', teacher: '', room: '' });
      showToast('✅ Timetable updated');
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const uploadResource = async (file: File) => {
    if (!resSubject.trim() || !resTitle.trim()) { showErr('Subject and title are required'); return; }
    setResUploading(true);
    try {
      let fileUrl = '';
      const ext = file.name.split('.').pop();
      const path = `resources/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('academics').upload(path, file, { contentType: file.type, upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from('academics').getPublicUrl(path);
        fileUrl = data.publicUrl;
      } else {
        // Fallback: store filename only
        fileUrl = file.name;
      }

      const { error } = await supabase.from('academic_resources').insert([{
        program: resProgram,
        subject: resSubject.trim(),
        title: resTitle.trim(),
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        tag: resTag,
        uploaded_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Resource uploaded');
      setResTitle('');
      refresh();
    } catch (e: any) { showErr(e.message || 'Upload failed'); }
    finally { setResUploading(false); }
  };

  const saveQuiz = async () => {
    if (!quizSubject.trim() || !quizQ.trim() || quizOptions.some(o => !o.trim())) {
      showErr('Fill all quiz fields'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('academic_quizzes').insert([{
        subject: quizSubject.trim(),
        question: quizQ.trim(),
        options: quizOptions,
        correct_answer: quizAnswer,
        quiz_date: quizDate,
        created_by: adminData.full_name,
        is_active: true,
      }]);
      if (error) throw error;
      showToast('✅ Quiz question saved');
      setQuizQ(''); setQuizOptions(['', '', '', '']); setQuizAnswer(0);
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const saveAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) { showErr('Title and message required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('academic_announcements').insert([{
        title: annTitle.trim(),
        body: annBody.trim(),
        target: annTarget,
        is_pinned: annPinned,
        posted_by: adminData.full_name,
      }]);
      if (error) throw error;

      // Push to notifications table based on target
      const noteRows = annTarget === 'teachers'
        ? teachers.map(t => ({ target_user_id: t.id, target_role: 'TEACHER', title: annTitle, message: annBody, type: 'announcement', is_read: false }))
        : annTarget === 'students'
        ? students.slice(0, 200).map(s => ({ target_user_id: s.roll_no, target_role: 'STUDENT', title: annTitle, message: annBody, type: 'announcement', is_read: false }))
        : [{ target_role: 'ALL', title: annTitle, message: annBody, type: 'announcement', is_read: false }];

      if (noteRows.length > 0 && noteRows.length <= 200) {
        await supabase.from('notifications').insert(noteRows);
      }

      showToast('✅ Announcement posted');
      setAnnTitle(''); setAnnBody(''); setAnnPinned(false);
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleReschedule = async (id: string, action: 'Approved' | 'Rejected') => {
    setSaving(true);
    try {
      await supabase.from('reschedule_requests').update({
        status: action,
        reviewed_by: adminData.full_name,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      showToast(`✅ Request ${action.toLowerCase()}`);
      refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteResource = async (id: string) => {
    await supabase.from('academic_resources').delete().eq('id', id);
    showToast('Resource removed'); refresh();
  };

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview',       label: 'Overview',         icon: BarChart3 },
    { id: 'scheme',         label: 'Scheme of Study',  icon: BookMarked },
    { id: 'timetable',      label: 'Timetable',        icon: Calendar },
    { id: 'topic-planner',  label: 'Topic Planner',    icon: Target },
    { id: 'resources',      label: 'Resources',        icon: Upload },
    { id: 'progress',       label: 'Teacher Progress', icon: TrendingUp },
    { id: 'quizzes',        label: 'Quizzes',          icon: Brain },
    { id: 'reschedules',    label: 'Reschedules',      icon: RefreshCw, badge: pendingReschedules },
    { id: 'announcements',  label: 'Announcements',    icon: Megaphone },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f0f6fa', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10" style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: AG }}>
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">Academics</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Head Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => {
            const active = tab === id;
            return (
              <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: 2 }}
                className={cn('w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all text-left', active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active ? { background: AG } : {}}>
                <Icon size={14} />
                <span className="flex-1">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{badge}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: AG }}>{adminData.full_name?.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{adminData.full_name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{adminData.role}</p>
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
              <ChevronLeft size={13} /> Back to Main
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: AG }}>
            <GraduationCap size={14} className="text-white" />
          </div>
          <p className="font-black text-slate-900 text-sm">Academics Portal</p>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">{savedMsg}</span>}
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-0">

        {/* Desktop header bar */}
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{TABS.find(t => t.id === tab)?.label || 'Academics'}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {savedMsg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={13} />{savedMsg}</motion.div>}
            {errorMsg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"><AlertTriangle size={13} />{errorMsg}</motion.div>}
            <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════════════════════════
                OVERVIEW TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Hero banner */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: DARK_HEADER, boxShadow: '0 12px 40px rgba(8,145,178,0.25)' }}>
                  <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 bg-cyan-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <div className="absolute right-20 bottom-0 w-28 h-28 rounded-full opacity-5 bg-cyan-400" style={{ transform: 'translateY(50%)' }} />
                  <p className="text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-1">Academic Dashboard</p>
                  <h2 className="text-xl font-black text-white mb-4">Welcome, {adminData.full_name.split(' ')[0]} 👋</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    {[
                      { l: 'Total Teachers', v: teachers.length },
                      { l: 'Active Students', v: students.length },
                      { l: 'Topics Planned', v: schemeList.length },
                      { l: 'Avg Progress', v: `${avgProgress}%` },
                    ].map(({ l, v }) => (
                      <div key={l}><p className="text-cyan-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={BookMarked} label="Scheme Entries" value={schemeList.length} sub="Topics uploaded" color="bg-cyan-50 text-cyan-600" onClick={() => setTab('scheme')} />
                  <StatCard icon={Calendar} label="Timetable Slots" value={timetable.length} sub="Scheduled classes" color="bg-blue-50 text-blue-600" onClick={() => setTab('timetable')} />
                  <StatCard icon={Upload} label="Resources" value={resources.length} sub="Files uploaded" color="bg-purple-50 text-purple-600" onClick={() => setTab('resources')} />
                  <StatCard icon={RefreshCw} label="Pending Reschedules" value={pendingReschedules} sub="Awaiting approval" color="bg-amber-50 text-amber-600" alert={pendingReschedules > 0} onClick={() => setTab('reschedules')} />
                </div>

                {/* Subject coverage bars */}
                {Object.keys(subjectMap).length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">📚 Topics by Subject</h3></div>
                    <div className="p-5 space-y-3.5">
                      {Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).map(([subj, cnt]) => {
                        const max = Math.max(...Object.values(subjectMap));
                        return <ProgressBar key={subj} pct={Math.round((cnt / max) * 100)} color={AC} label={subj} sub={`${cnt} topics`} />;
                      })}
                    </div>
                  </div>
                )}

                {/* Teacher progress overview */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">👩‍🏫 Teacher Progress Snapshot</h3>
                    <button onClick={() => setTab('progress')} className="text-xs font-bold hover:underline" style={{ color: AC }}>Full View →</button>
                  </div>
                  <div className="p-5 space-y-3">
                    {teacherProgressMap.slice(0, 5).map(t => (
                      <ProgressBar key={t.id} pct={t.avgProgress} color={t.avgProgress >= 70 ? '#059669' : t.avgProgress >= 40 ? '#D97706' : '#C0392B'} label={t.full_name} sub={`${t.avgProgress}%`} />
                    ))}
                    {teachers.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No teacher data yet</p>}
                  </div>
                </div>

                {/* Pending reschedules quick panel */}
                {pendingReschedules > 0 && (
                  <div className="bg-white rounded-3xl border border-amber-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
                      <h3 className="font-black text-slate-900">⏳ Pending Reschedule Requests</h3>
                      <button onClick={() => setTab('reschedules')} className="text-xs font-bold text-amber-600 hover:underline">View All →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {reschedules.filter(r => !r.status || r.status === 'Pending').slice(0, 3).map((r: any, i: number) => (
                        <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center">{(r.teacher_name || 'T').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{r.teacher_name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{r.subject} · {r.original_date || '—'} → {r.new_date || '—'}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleReschedule(r.id, 'Approved')} className="px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}><Check size={10} /></button>
                            <button onClick={() => handleReschedule(r.id, 'Rejected')} className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200"><X size={10} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent announcements */}
                {announcements.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">📢 Recent Announcements</h3>
                      <button onClick={() => setTab('announcements')} className="text-xs font-bold hover:underline" style={{ color: AC }}>Manage →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {announcements.slice(0, 3).map((a: any) => (
                        <div key={a.id} className="px-5 py-3.5 flex items-start gap-3">
                          {a.is_pinned && <Pin size={13} className="text-cyan-500 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{a.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{a.body}</p>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 uppercase flex-shrink-0">{a.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SCHEME OF STUDY TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'scheme' && (
              <motion.div key="scheme" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* ADD FORM */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)' }}>
                        <h3 className="font-black text-slate-900 flex items-center gap-2"><Plus size={16} style={{ color: AC }} /> Add SOS Entry</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Scheme of Study builder</p>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Program</label>
                          <TS value={sosProgram} onChange={e => setSosProgram(e.target.value)}>
                            {PROGRAMS_LIST.map(p => <option key={p}>{p}</option>)}
                          </TS>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Part</label>
                            <TS value={sosPart} onChange={e => setSosPart(Number(e.target.value))}>
                              <option value={1}>Part 1</option><option value={2}>Part 2</option>
                            </TS>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Week No.</label>
                            <TI type="number" min={1} max={52} value={sosWeek} onChange={(e: any) => setSosWeek(Number(e.target.value))} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Month</label>
                          <TS value={sosMonth} onChange={e => setSosMonth(e.target.value)}>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                          </TS>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject <span className="text-rose-500">*</span></label>
                          <TI
                            list="subjects-list"
                            value={sosSubject}
                            onChange={(e: any) => setSosSubject(e.target.value)}
                            placeholder="e.g. Mathematics"
                          />
                          <datalist id="subjects-list">
                            {SUBJECTS_COMMON.map(s => <option key={s} value={s} />)}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Topic <span className="text-rose-500">*</span></label>
                          <TI value={sosTopic} onChange={(e: any) => setSosTopic(e.target.value)} placeholder="e.g. Chapter 1: Sets & Functions" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assign Teacher</label>
                          <TS value={sosTeacher} onChange={e => setSosTeacher(e.target.value)}>
                            <option value="">— Select Teacher —</option>
                            {teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                          </TS>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Topics in Subject</label>
                          <TI type="number" value={sosTopics} onChange={(e: any) => setSosTopics(e.target.value)} placeholder="e.g. 12" />
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={saveSchemeEntry} disabled={saving}
                          className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: AG }}>
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Save Entry</>}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="md:col-span-2">
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-slate-900">Current SOS ({schemeList.length})</h3>
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={sosFilter} onChange={e => setSosFilter(e.target.value)} placeholder="Filter..." className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-cyan-400 w-36" />
                        </div>
                      </div>
                      {schemeList.length === 0 ? (
                        <div className="p-12 text-center text-slate-400"><BookOpen size={28} className="mx-auto mb-3" /><p>No scheme entries yet</p></div>
                      ) : (
                        <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
                          <table className="w-full text-xs min-w-[500px]">
                            <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                              <tr>{['Wk', 'Month', 'Program', 'Subject', 'Topic', 'Teacher'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                              ))}</tr>
                            </thead>
                            <tbody>
                              {schemeList
                                .filter(s => !sosFilter || [s.subject, s.program, s.topic, s.teacher_name].some(v => v?.toLowerCase().includes(sosFilter.toLowerCase())))
                                .map((s, i) => (
                                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }} className="border-b border-slate-50 hover:bg-slate-50/60">
                                    <td className="px-4 py-2.5 font-black text-[11px]" style={{ color: AC }}>W{s.week_no}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{s.month || '—'}</td>
                                    <td className="px-4 py-2.5 text-slate-600 text-[10px]">{s.program}</td>
                                    <td className="px-4 py-2.5 font-bold text-slate-800">{s.subject}</td>
                                    <td className="px-4 py-2.5 text-slate-700 max-w-[150px] truncate font-medium">{s.topic}</td>
                                    <td className="px-4 py-2.5 text-slate-400 text-[10px]">{s.teacher_name || '—'}</td>
                                  </motion.tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TIMETABLE TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'timetable' && (
              <motion.div key="timetable" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Weekly Schedule Builder</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Click any cell to assign a subject, teacher and room</p>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section:</label>
                    <TS value={ttSection} onChange={e => setTtSection(e.target.value)} className="w-44 text-xs">
                      <option value="">— All / General —</option>
                      {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </TS>
                  </div>
                </div>

                {/* Timetable grid */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-slate-50 border-b border-r border-slate-100 px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-20">Period</th>
                          {DAYS.map(d => (
                            <th key={d} className="bg-slate-50 border-b border-r border-slate-100 last:border-r-0 px-3 py-3 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: AC }}>{d.slice(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((period, pi) => (
                          <tr key={period} className="border-b border-slate-50">
                            <td className="border-r border-slate-100 px-4 py-2 text-[10px] font-black text-slate-400 bg-slate-50/50">{period}</td>
                            {DAYS.map(day => {
                              const cell = ttGrid[day]?.[period];
                              return (
                                <td key={day} className="border-r border-slate-100 last:border-r-0 p-1.5 align-top" style={{ minHeight: 56 }}>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => {
                                      setTtEditCell({ day, period });
                                      setTtForm({ subject: cell?.subject || '', teacher: cell?.teacher || '', room: cell?.room || '' });
                                    }}
                                    className={cn('w-full h-full min-h-[52px] rounded-xl p-2 text-left transition-all border', cell ? 'border-cyan-200 bg-cyan-50' : 'border-dashed border-slate-200 bg-slate-50/30 hover:border-cyan-300 hover:bg-cyan-50/30')}>
                                    {cell ? (
                                      <div>
                                        <p className="text-[10px] font-black text-cyan-800 truncate">{cell.subject}</p>
                                        <p className="text-[9px] text-cyan-600 truncate mt-0.5">{cell.teacher}</p>
                                        {cell.room && <p className="text-[9px] text-slate-400 mt-0.5">{cell.room}</p>}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center h-full">
                                        <Plus size={12} className="text-slate-300" />
                                      </div>
                                    )}
                                  </motion.button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit cell modal */}
                <AnimatePresence>
                  {ttEditCell && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTtEditCell(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
                        <div className="h-1" style={{ background: AG }} />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-5">
                            <div>
                              <h3 className="font-black text-slate-900">Edit Slot</h3>
                              <p className="text-xs text-slate-400 mt-0.5">{ttEditCell.day} · {ttEditCell.period} Period</p>
                            </div>
                            <button onClick={() => setTtEditCell(null)} className="text-slate-400"><X size={18} /></button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                              <TI list="subjects-list2" value={ttForm.subject} onChange={(e: any) => setTtForm(p => ({ ...p, subject: e.target.value }))} placeholder="Mathematics" />
                              <datalist id="subjects-list2">{SUBJECTS_COMMON.map(s => <option key={s} value={s} />)}</datalist>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Teacher</label>
                              <TS value={ttForm.teacher} onChange={e => setTtForm(p => ({ ...p, teacher: e.target.value }))}>
                                <option value="">— Select Teacher —</option>
                                {teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                              </TS>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Room</label>
                              <TI value={ttForm.room} onChange={(e: any) => setTtForm(p => ({ ...p, room: e.target.value }))} placeholder="Room 101" />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button onClick={() => setTtEditCell(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                              <motion.button whileTap={{ scale: 0.97 }} onClick={saveTimetableCell} disabled={saving}
                                className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: AG }}>
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
                              </motion.button>
                            </div>
                            {ttGrid[ttEditCell.day]?.[ttEditCell.period] && (
                              <button onClick={() => { setTtForm({ subject: '', teacher: '', room: '' }); saveTimetableCell(); }}
                                className="w-full py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all">🗑 Clear this slot</button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TOPIC PLANNER TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'topic-planner' && (
              <motion.div key="tp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* FORM */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)' }}>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><Target size={16} style={{ color: AC }} /> Plan a Topic</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Program</label>
                        <TS value={tpProgram} onChange={e => setTpProgram(e.target.value)}>
                          {PROGRAMS_LIST.map(p => <option key={p}>{p}</option>)}
                        </TS>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject <span className="text-rose-500">*</span></label>
                        <TI list="tp-subjects" value={tpSubject} onChange={(e: any) => setTpSubject(e.target.value)} placeholder="e.g. Physics" />
                        <datalist id="tp-subjects">{SUBJECTS_COMMON.map(s => <option key={s} value={s} />)}</datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Topic / Lecture <span className="text-rose-500">*</span></label>
                        <TI value={tpTopic} onChange={(e: any) => setTpTopic(e.target.value)} placeholder="e.g. Newton's Laws of Motion" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Planned Date</label>
                          <TI type="date" value={tpDate} onChange={(e: any) => setTpDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Week</label>
                          <TI type="number" min={1} value={tpWeek} onChange={(e: any) => setTpWeek(Number(e.target.value))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
                        <textarea value={tpNotes} onChange={e => setTpNotes(e.target.value)} rows={2} placeholder="Objectives, resources needed..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 resize-none" />
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={saveTopicPlan} disabled={saving}
                        className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: AG }}>
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Add to Planner</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* CALENDAR VIEW */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h3 className="font-black text-slate-900">Planned Topics Timeline</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Topics shared with teachers. Teachers mark them complete daily.</p>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
                      {topicPlans.length === 0 ? (
                        <div className="p-12 text-center text-slate-400"><Target size={28} className="mx-auto mb-3" /><p>No topics planned yet</p></div>
                      ) : (
                        <div className="p-5 space-y-3">
                          {topicPlans
                            .filter(p => p.planned_date)
                            .sort((a, b) => a.planned_date?.localeCompare(b.planned_date))
                            .map((plan, i) => (
                              <motion.div key={plan.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}
                                className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0" style={{ background: AG }}>
                                  <p className="text-white text-[9px] font-black uppercase">{plan.planned_date ? new Date(plan.planned_date).toLocaleDateString('en-PK', { month: 'short' }) : '?'}</p>
                                  <p className="text-white text-lg font-black leading-none">{plan.planned_date ? new Date(plan.planned_date).getDate() : '?'}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-900 text-sm">{plan.topic}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">{plan.subject}</span>
                                    <span className="text-[10px] text-slate-400">{plan.program}</span>
                                    {plan.week_no && <span className="text-[10px] text-slate-400">Week {plan.week_no}</span>}
                                  </div>
                                  {plan.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{plan.notes}</p>}
                                </div>
                                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', plan.is_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300')}>
                                  <Check size={13} />
                                </div>
                              </motion.div>
                            ))}
                          {topicPlans.filter(p => !p.planned_date).length > 0 && (
                            <div className="border-t border-slate-100 pt-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unscheduled Entries</p>
                              {topicPlans.filter(p => !p.planned_date).map((plan, i) => (
                                <div key={plan.id} className="flex items-center gap-2 py-2.5 border-b border-slate-50 last:border-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                                  <p className="text-sm font-bold text-slate-700">{plan.topic}</p>
                                  <span className="text-[10px] text-slate-400 ml-auto">{plan.subject}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Syllabus completion forecast */}
                {Object.keys(subjectMap).length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h3 className="font-black text-slate-900">📊 Syllabus Completion Forecast</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Based on planned vs. completed topics</p>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(subjectMap).map(([subj, total]) => {
                        const completed = topicPlans.filter(p => p.subject === subj && p.is_completed).length;
                        const pct = Math.round((completed / (total as number)) * 100);
                        const color = pct >= 70 ? '#059669' : pct >= 40 ? '#D97706' : '#C0392B';
                        const daysLeft = 90; // approximation
                        const pace = completed > 0 ? Math.round(((total as number) - completed) / (completed / 30)) : 0;
                        return (
                          <div key={subj} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-black text-slate-800 text-sm">{subj}</p>
                              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', pct >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pct >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                                {completed}/{total as number} topics
                              </span>
                            </div>
                            <ProgressBar pct={pct} color={color} />
                            <p className="text-[10px] text-slate-400 italic">
                              {pct >= 100 ? '✅ Complete' : pace > 0 ? `At current pace: ~${pace} days to complete` : 'Not started yet'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                RESOURCES TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'resources' && (
              <motion.div key="resources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* UPLOAD FORM */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)' }}>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><Upload size={16} style={{ color: AC }} /> Upload Resource</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Files visible to students immediately</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Program</label>
                        <TS value={resProgram} onChange={e => setResProgram(e.target.value)}>
                          {PROGRAMS_LIST.map(p => <option key={p}>{p}</option>)}
                        </TS>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject <span className="text-rose-500">*</span></label>
                        <TI list="res-subjects" value={resSubject} onChange={(e: any) => setResSubject(e.target.value)} placeholder="e.g. Chemistry" />
                        <datalist id="res-subjects">{SUBJECTS_COMMON.map(s => <option key={s} value={s} />)}</datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Title / Description <span className="text-rose-500">*</span></label>
                        <TI value={resTitle} onChange={(e: any) => setResTitle(e.target.value)} placeholder="e.g. Chapter 3 Notes" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tag / Type</label>
                        <div className="flex flex-wrap gap-2">
                          {['Notes', 'Past Papers', 'Assignments', 'Slides', 'Book Chapter', 'Other'].map(tag => (
                            <button key={tag} onClick={() => setResTag(tag)}
                              className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all', resTag === tag ? 'text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200')}
                              style={resTag === tag ? { background: AG } : {}}>
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Drop zone */}
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.jpg,.png,.zip" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadResource(f); }} />
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()} disabled={resUploading}
                        className="w-full py-8 rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 hover:bg-cyan-50 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50">
                        {resUploading ? (
                          <><Loader2 size={22} className="animate-spin text-cyan-500" /><p className="text-xs font-black text-cyan-600">Uploading...</p></>
                        ) : (
                          <><Upload size={22} className="text-cyan-400" /><p className="text-xs font-black text-cyan-700">Click to choose file</p><p className="text-[10px] text-slate-400">PDF, DOCX, PPTX, Images</p></>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* RESOURCES LIST */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">Uploaded Resources ({resources.length})</h3>
                      <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">Visible to Students</span>
                    </div>
                    {resources.length === 0 ? (
                      <div className="p-12 text-center text-slate-400"><FileText size={28} className="mx-auto mb-3" /><p>No resources uploaded yet</p></div>
                    ) : (
                      <div className="divide-y divide-slate-50" style={{ maxHeight: 540, overflowY: 'auto' }}>
                        {resources.map((r: any, i: number) => (
                          <motion.div key={r.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-50 border border-cyan-100">
                              <FileText size={17} className="text-cyan-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate">{r.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-500">{r.subject}</span>
                                <span className="text-[9px] text-slate-300">·</span>
                                <span className="text-[10px] text-slate-400">{r.program}</span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{r.tag}</span>
                              </div>
                              {r.file_name && <p className="text-[9px] text-slate-300 mt-0.5 truncate">{r.file_name}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {r.file_url && r.file_url.startsWith('http') && (
                                <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all">
                                  <Download size={14} />
                                </a>
                              )}
                              <button onClick={() => deleteResource(r.id)}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TEACHER PROGRESS TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: 'Total Teachers', v: teachers.length, c: 'bg-cyan-50 text-cyan-600', icon: Users },
                    { l: 'Avg Progress', v: `${avgProgress}%`, c: 'bg-emerald-50 text-emerald-600', icon: TrendingUp },
                    { l: 'Topics Covered', v: courseProgress.filter(p => p.is_completed).length, c: 'bg-blue-50 text-blue-600', icon: CheckSquare },
                    { l: 'Behind Schedule', v: teacherProgressMap.filter(t => t.avgProgress < 40).length, c: 'bg-rose-50 text-rose-600', icon: AlertCircle },
                  ].map(({ l, v, c, icon: Icon }) => (
                    <div key={l} className={cn('rounded-2xl p-4 border border-slate-100', c)}>
                      <Icon size={16} className="mb-2 opacity-70" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</p>
                      <p className="text-2xl font-black mt-1">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Teacher-wise Course Coverage</h3>
                  </div>
                  {teachers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400"><Users size={28} className="mx-auto mb-3" /><p>No teachers in system</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[600px]">
                        <thead style={{ background: '#f8f9fd' }}>
                          <tr>{['Teacher', 'Department', 'Topics in System', 'Avg Progress', 'Status'].map(h => (
                            <th key={h} className="px-5 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {teacherProgressMap.map((t, i) => {
                            const color = t.avgProgress >= 70 ? '#059669' : t.avgProgress >= 40 ? '#D97706' : '#C0392B';
                            const statusLabel = t.avgProgress >= 70 ? '✅ On Track' : t.avgProgress >= 40 ? '⚠️ Moderate' : '🔴 Behind';
                            const statusStyle = t.avgProgress >= 70 ? 'bg-emerald-50 text-emerald-700' : t.avgProgress >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';
                            return (
                              <motion.tr key={t.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="border-b border-slate-50 hover:bg-slate-50/40">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0" style={{ background: `hsl(${(t.id?.charCodeAt(0) || 50) * 37 % 360},55%,45%)` }}>{t.full_name?.charAt(0)}</div>
                                    <p className="font-black text-slate-900">{t.full_name}</p>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">{t.subject_dept || '—'}</td>
                                <td className="px-5 py-3.5 font-bold text-slate-700">{t.topicCount}</td>
                                <td className="px-5 py-3.5 w-40">
                                  <ProgressBar pct={t.avgProgress} color={color} />
                                  <p className="text-[9px] font-bold mt-1" style={{ color }}>{t.avgProgress}%</p>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', statusStyle)}>{statusLabel}</span>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Subject-wise progress */}
                {courseProgress.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Subject Coverage Detail</h3></div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(
                        courseProgress.reduce((acc: Record<string, number[]>, cp: any) => {
                          if (!acc[cp.subject]) acc[cp.subject] = [];
                          acc[cp.subject].push(cp.progress_pct || 0);
                          return acc;
                        }, {})
                      ).map(([subj, pcts]) => {
                        const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
                        const color = avg >= 70 ? '#059669' : avg >= 40 ? '#D97706' : '#C0392B';
                        return (
                          <div key={subj} className="space-y-1.5">
                            <ProgressBar pct={avg} color={color} label={subj} sub={`${avg}% avg · ${pcts.length} records`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                QUIZZES TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'quizzes' && (
              <motion.div key="quizzes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* QUIZ BUILDER */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)' }}>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><Brain size={16} style={{ color: AC }} /> Create Quiz</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Auto-appears in Student Portal on selected date</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                        <TI list="quiz-subjects" value={quizSubject} onChange={(e: any) => setQuizSubject(e.target.value)} placeholder="e.g. Physics" />
                        <datalist id="quiz-subjects">{SUBJECTS_COMMON.map(s => <option key={s} value={s} />)}</datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quiz Date</label>
                        <TI type="date" value={quizDate} onChange={(e: any) => setQuizDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Question <span className="text-rose-500">*</span></label>
                        <textarea value={quizQ} onChange={e => setQuizQ(e.target.value)} rows={3} placeholder="Enter the quiz question..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 resize-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Options <span className="text-rose-500">*</span></label>
                        <div className="space-y-2">
                          {quizOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <button onClick={() => setQuizAnswer(idx)}
                                className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', quizAnswer === idx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300')}>
                                {quizAnswer === idx && <Check size={11} className="text-white" />}
                              </button>
                              <TI value={opt} onChange={(e: any) => {
                                const copy = [...quizOptions];
                                copy[idx] = e.target.value;
                                setQuizOptions(copy);
                              }} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className="text-sm" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">☑ Mark the correct answer</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={saveQuiz} disabled={saving}
                        className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: AG }}>
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <><Zap size={15} /> Publish Quiz</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* QUIZ LIST */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-black text-slate-900">Published Quizzes ({quizzes.length})</h3>
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">Auto-shown to students</span>
                    </div>
                    {quizzes.length === 0 ? (
                      <div className="p-12 text-center text-slate-400"><Brain size={28} className="mx-auto mb-3" /><p>No quizzes yet</p><p className="text-[11px] mt-1">Create your first quiz to get started</p></div>
                    ) : (
                      <div className="divide-y divide-slate-50" style={{ maxHeight: 540, overflowY: 'auto' }}>
                        {quizzes.map((q: any, i: number) => (
                          <motion.div key={q.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="px-5 py-4 hover:bg-slate-50/40 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: AG }}>
                                <Brain size={16} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm">{q.question}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] font-bold text-cyan-600">{q.subject}</span>
                                  <span className="text-[10px] text-slate-400">{q.quiz_date}</span>
                                  <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', q.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
                                    {q.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                {Array.isArray(q.options) && (
                                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                                    {q.options.map((opt: string, oi: number) => (
                                      <div key={oi} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border', oi === q.correct_answer ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100')}>
                                        {String.fromCharCode(65 + oi)}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={async () => {
                                await supabase.from('academic_quizzes').update({ is_active: !q.is_active }).eq('id', q.id);
                                refresh();
                              }} className={cn('text-[10px] font-black px-2.5 py-1.5 rounded-xl border flex-shrink-0', q.is_active ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>
                                {q.is_active ? 'Pause' : 'Activate'}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                RESCHEDULES TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'reschedules' && (
              <motion.div key="reschedules" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Pending', v: reschedules.filter(r => !r.status || r.status === 'Pending').length, c: 'text-amber-600' },
                    { l: 'Approved', v: reschedules.filter(r => r.status === 'Approved').length, c: 'text-emerald-600' },
                    { l: 'Rejected', v: reschedules.filter(r => r.status === 'Rejected').length, c: 'text-rose-600' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                      <p className={cn('text-2xl font-black', c)}>{v}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[{ v: '' as const, l: 'All' }, { v: 'Pending' as const, l: 'Pending' }, { v: 'Approved' as const, l: 'Approved' }, { v: 'Rejected' as const, l: 'Rejected' }].map(({ v, l }) => (
                    <button key={l} onClick={() => setRescFilter(v)}
                      className={cn('px-4 py-1.5 rounded-xl text-xs font-black border transition-all', rescFilter === v ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')}
                      style={rescFilter === v ? { background: AG } : {}}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {reschedules
                    .filter(r => !rescFilter || (rescFilter === 'Pending' ? (!r.status || r.status === 'Pending') : r.status === rescFilter))
                    .map((r: any, i: number) => {
                      const isPending = !r.status || r.status === 'Pending';
                      return (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className={cn('bg-white rounded-2xl overflow-hidden shadow-sm', isPending ? 'border-l-4 border border-amber-200' : 'border border-slate-100')}
                          style={isPending ? { borderLeftColor: '#D97706' } : {}}>
                          <div className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0',
                                r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                                {(r.teacher_name || 'T').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900">{r.teacher_name || '—'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{r.subject} · {r.reason || r.notes || 'Reschedule request'}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} /> {r.original_date || '—'} → {r.new_date || '—'}
                                  </span>
                                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black',
                                    r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                                    {r.status || 'Pending'}
                                  </span>
                                </div>
                                {r.message && <p className="text-[11px] text-slate-400 mt-1.5 italic bg-slate-50 px-3 py-2 rounded-lg">"{r.message}"</p>}
                              </div>
                              {isPending && (
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReschedule(r.id, 'Approved')} disabled={saving}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                    {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReschedule(r.id, 'Rejected')} disabled={saving}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-50">
                                    <X size={10} /> Reject
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  {reschedules.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                      <RefreshCw size={28} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-400 font-bold">No reschedule requests</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                ANNOUNCEMENTS TAB
            ══════════════════════════════════════════════════════════════════ */}
            {tab === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* COMPOSE */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)' }}>
                      <h3 className="font-black text-slate-900 flex items-center gap-2"><Megaphone size={16} style={{ color: AC }} /> Post Announcement</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Title <span className="text-rose-500">*</span></label>
                        <TI value={annTitle} onChange={(e: any) => setAnnTitle(e.target.value)} placeholder="e.g. Exam Schedule Released" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message <span className="text-rose-500">*</span></label>
                        <textarea value={annBody} onChange={e => setAnnBody(e.target.value)} rows={4} placeholder="Type your announcement here..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 resize-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Audience</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([['all', 'Everyone', Users], ['teachers', 'Teachers', GraduationCap], ['students', 'Students', BookOpen]] as const).map(([v, l, Icon]) => (
                            <button key={v} onClick={() => setAnnTarget(v)}
                              className={cn('p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-[10px] font-black', annTarget === v ? 'text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200')}
                              style={annTarget === v ? { background: AG } : {}}>
                              <Icon size={14} />{l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <button onClick={() => setAnnPinned(p => !p)}
                          className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0', annPinned ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300')}>
                          {annPinned && <Check size={11} className="text-white" />}
                        </button>
                        <div>
                          <p className="text-xs font-black text-slate-700">Pin this announcement</p>
                          <p className="text-[10px] text-slate-400">Stays at top of feed</p>
                        </div>
                      </label>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={saveAnnouncement} disabled={saving}
                        className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: AG }}>
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /> Post Now</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* FEED */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h3 className="font-black text-slate-900">Posted Announcements ({announcements.length})</h3>
                    </div>
                    {announcements.length === 0 ? (
                      <div className="p-12 text-center text-slate-400"><Megaphone size={28} className="mx-auto mb-3" /><p>No announcements yet</p></div>
                    ) : (
                      <div className="divide-y divide-slate-50" style={{ maxHeight: 560, overflowY: 'auto' }}>
                        {announcements.map((a: any, i: number) => (
                          <motion.div key={a.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
                            className="px-5 py-4 hover:bg-slate-50/40 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: AG }}>
                                <Megaphone size={16} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-black text-slate-900 text-sm">{a.title}</p>
                                  {a.is_pinned && <Pin size={12} className="text-cyan-500" />}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{a.body}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 uppercase">{a.target}</span>
                                  <span className="text-[10px] text-slate-400">by {a.posted_by}</span>
                                  <span className="text-[10px] text-slate-400">{a.created_at ? new Date(a.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}</span>
                                </div>
                              </div>
                              <button onClick={async () => {
                                await supabase.from('academic_announcements').delete().eq('id', a.id);
                                refresh();
                              }} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center flex-shrink-0 transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {TABS.slice(0, 5).map(({ id, label, icon: Icon, badge }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: active ? AC : '#94a3b8' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={active ? { background: `${AC}18` } : {}}>
                  <Icon size={19} />
                  {badge != null && badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{badge}</span>}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{label.split(' ')[0]}</span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background: AC }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AcademicsPortal;