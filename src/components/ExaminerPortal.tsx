import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Calendar, FileText, ClipboardList, Armchair,
  Eye, PenLine, Award, LogOut, RefreshCw, X, Plus,
  Search, CheckCircle, AlertCircle, Clock, Users,
  Menu, ChevronRight, Shield, BookOpen, BarChart2, History,
  Upload, UserSquare, UserCheck, Inbox, Printer, Trash2, Megaphone, FileImage, Download
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { BRANDING, LOGO_BASE64 } from '../lib/constants';

interface Props {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

const ACCENT   = '#4F46E5';
const GRADIENT = 'linear-gradient(135deg,#4F46E5,#7C3AED)';

const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

type Tab = 'dashboard' | 'schedules' | 'exams' | 'seating' | 'invigilation' | 'grades' | 'results' | 'upload' | 'rollslips' | 'dutychart' | 'paperperforma' | 'reportcards';

const TABS = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'schedules',      label: 'Exam Schedules', icon: Calendar },
  { id: 'seating',        label: 'Seating Plans',  icon: Armchair },
  { id: 'invigilation',   label: 'Invigilation',   icon: Eye },
  { id: 'grades',         label: 'Grade Entry',    icon: PenLine },
  { id: 'results',        label: 'Result Cards',   icon: Award },
  { id: 'upload',         label: 'Upload Docs',    icon: Upload },
  { id: 'rollslips',      label: 'Roll No Slips',  icon: UserSquare },
  { id: 'dutychart',      label: 'Duty Chart',     icon: UserCheck },
  { id: 'paperperforma',  label: 'Paper Performa', icon: Inbox },
  { id: 'reportcards',    label: 'Report Cards',   icon: Printer },
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

const TableWrap = ({ children }: any) => <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">{children}</div>;
const Th = ({ children }: any) => <th className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</th>;
const Td = ({ children, className }: any) => <td className={cn("px-5 py-4 text-xs font-medium", className)}>{children}</td>;

const SubTabs = ({ tabs, active, onChange, accent }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; accent: string }) => (
  <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit mb-4">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={cn('px-4 py-1.5 rounded-xl text-xs font-black transition-all',
          active === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
        )} style={active === t.id ? { color: accent } : {}}>{t.label}</button>
    ))}
  </div>
);

export const ExaminerPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [tab,      setTab]      = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  const [schedules,    setSchedules]    = useState<any[]>([]);
  const [exams,        setExams]        = useState<any[]>([]);
  const [seating,      setSeating]      = useState<any[]>([]);
  const [invigilation, setInvigilation] = useState<any[]>([]);
  const [results,      setResults]      = useState<any[]>([]);
  const [grades,       setGrades]       = useState<any[]>([]);
  const [students,     setStudents]     = useState<any[]>([]);
  const [teachers,     setTeachers]     = useState<any[]>([]);
  const [adminUsers,   setAdminUsers]   = useState<any[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [rollSlips,    setRollSlips]    = useState<any[]>([]);
  const [dutyChart,    setDutyChart]    = useState<any[]>([]);
  const [performaList, setPerformaList] = useState<any[]>([]);
  const [examNotifs,   setExamNotifs]   = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [examTab,      setExamTab]      = useState('list');
  const [examMarks,    setExamMarks]    = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal,   setModal]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [studentSearch, setStudentSearch] = useState({ name: '', roll: '', class: '' });

  const [schedForm, setSchedForm] = useState<any>({ title: '', exam_type: 'Mid-Term', session: '2026-28', program: '', part: 1, class_section: '', start_date: '', end_date: '', status: 'Upcoming' });
  const [examForm,  setExamForm]  = useState<any>({ title: '', class_section: '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '', teacher_id: '' });
  const [seatForm,  setSeatForm]  = useState<any>({ exam_name: '', student_roll: '', room_no: '', seat_no: '', date: '', class_name: '', full_name: '' });
  const [invigiForm,setInvigiForm]= useState<any>({ exam_name: '', teacher_name: '', class_name: '', room_no: '', exam_date: '' });
  const [gradeForm, setGradeForm] = useState<any>({ exam_id: '', student_roll: '', subject: '', score: '', total_marks: 100, grade_letter: '', remarks: '' });
  const [docForm,   setDocForm]   = useState<any>({ title: '', category: 'General', visible_to: ['All'], file: null });
  const [slipForm,  setSlipForm]  = useState<any>({ exam_type: 'Mid-Term', template: null, year: '2026' });
  const [dutyForm,  setDutyForm]  = useState<any>({ teacher_id: '', exam_date: '', exam_type: 'Mid-Term', room_no: '', shift: 'Morning', assigned_class: '' });
  const [perfForm,  setPerfForm]  = useState<any>({ teacher_id: '', subject: '', class_section: '', exam_date: '', bundle_count: 0 });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sc }, { data: ex }, { data: se }, { data: iv }, { data: rc }, { data: gr }, { data: st }, { data: tc }, { data: au }, { data: ud }, { data: rs }, { data: dc }, { data: pl }, { data: en }, { data: an }] = await Promise.all([
      supabase.from('exam_schedule').select('*').order('created_at', { ascending: false }),
      supabase.from('exams').select('*').order('date', { ascending: false }),
      supabase.from('exam_seating').select('*').order('created_at', { ascending: false }),
      supabase.from('exam_invigilation').select('*').order('created_at', { ascending: false }),
      supabase.from('result_cards').select('*').order('generated_at', { ascending: false }),
      supabase.from('grades').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('students').select('roll_no,full_name,class_section,program,part').neq('status', 'Deleted').order('roll_no'),
      supabase.from('teachers').select('id,full_name,designation,subject_dept').order('full_name'),
      supabase.from('admin_users').select('id,full_name,role').order('full_name'),
      supabase.from('uploaded_documents').select('*').or(`visible_to.cs.{Examiner},visible_to.cs.{All}`).eq('is_active', true).order('created_at', { ascending: false }).limit(6),
      supabase.from('roll_number_slips').select('*').order('generated_at', { ascending: false }),
      supabase.from('duty_chart').select('*').order('exam_date', { ascending: false }),
      supabase.from('paper_receiving_performa').select('*').order('created_at', { ascending: false }),
      supabase.from('exam_notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_notifications').select('*').in('target', ['ALL', 'Examiner', 'EXAMINER', adminData.username]).order('created_at', { ascending: false }).limit(30),
    ]);

    setUploadedDocs(ud || []); setRollSlips(rs || []); setDutyChart(dc || []); setPerformaList(pl || []); setExamNotifs(en || []);
    setNotifications(an || []); setUnreadCount((an || []).filter((n: any) => !n.is_read).length);

    let scData = sc || [];
    let grData = gr || [];
    let stData = st || [];
    let exData = ex || [];
    let rcData = rc || [];

    // Add Sample Students if empty
    if (stData.length === 0) {
      stData = [
        { roll_no: 2628001, full_name: 'Ahmed Ali', class_section: '10th-A', program: 'Science', part: 1 },
        { roll_no: 2628002, full_name: 'Fatima Zahra', class_section: '10th-B', program: 'Arts', part: 1 },
        { roll_no: 2628003, full_name: 'Muhammad Umar', class_section: '9th-A', program: 'Science', part: 1 },
        { roll_no: 2628004, full_name: 'Zainab Bibi', class_section: '9th-B', program: 'Arts', part: 1 },
        { roll_no: 2628005, full_name: 'Ali Raza', class_section: '10th-A', program: 'Science', part: 1 },
      ];
    }

    // Add Sample Data if empty
    if (scData.length === 0) {
      scData = [
        { id: 9991, title: 'Final Exams 2026', exam_type: 'Final', program: 'Pre-Medical', part: 1, session: '2025-26', start_date: '2026-05-10', end_date: '2026-05-25', status: 'Upcoming', class_section: 'PRE-MED-I A' },
        { id: 9992, title: 'Send-up Exams Q2', exam_type: 'Mock', program: 'ICS Physics', part: 2, session: '2025-26', start_date: '2026-04-15', end_date: '2026-04-22', status: 'Ongoing', class_section: 'ICS-II B' }
      ];
    }

    if (grData.length === 0 && stData.length > 0) {
      grData = stData.map((s, i) => ({
        id: 8881 + i,
        student_roll: s.roll_no,
        chapter_name: i % 2 === 0 ? 'Chapter 1 Assessment' : 'Monthly Test',
        subject: i % 2 === 0 ? 'Physics' : 'Mathematics',
        score: Math.floor(Math.random() * 40) + 60,
        total_marks: 100,
        percentage: (Math.random() * 30 + 70).toFixed(2),
        grade_letter: i % 3 === 0 ? 'A+' : i % 3 === 1 ? 'A' : 'B',
        is_verified: i < 3,
        entered_by: 'Teacher A',
        created_at: new Date().toISOString()
      }));
    }

    if (rcData.length === 0 && stData.length > 0) {
      rcData = stData.map((s, i) => ({
        id: 7771 + i,
        student_roll: s.roll_no,
        exam_schedule_id: 9992,
        total_marks: 500,
        obtained_marks: Math.floor(Math.random() * 100) + 380,
        percentage: (Math.random() * 20 + 80).toFixed(2),
        grade: i % 3 === 0 ? 'A+' : i % 3 === 1 ? 'A' : 'B',
        is_published: i < 3,
        generated_at: new Date().toISOString(),
        published_at: i < 3 ? new Date().toISOString() : null
      }));
    }

    setSchedules(scData); setExams(exData); 
    setSeating(se || []); setInvigilation(iv || []); setResults(rcData);
    setGrades(grData); setStudents(stData); setTeachers(tc || []); setAdminUsers(au || []);
    setLoading(false);
  }, [adminData.full_name]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!selectedExam) return;
    (async () => {
      const { data } = await supabase.from('exam_marks').select('*').eq('exam_id', selectedExam);
      setExamMarks(data || []);
    })();
  }, [selectedExam]);

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

  const [selectedStudentResults, setSelectedStudentResults] = useState<any>(null);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [editingResultCard, setEditingResultCard] = useState<any>(null);

  const verifyGrade = async (gradeId: number) => {
    setSaving(true);
    try {
      const { data: grade, error: fetchErr } = await supabase.from('grades').select('*').eq('id', gradeId).single();
      if (fetchErr) throw fetchErr;

      const { error: updateErr } = await supabase.from('grades').update({ 
        is_verified: true, 
        verified_by: adminData.full_name, 
        verified_at: new Date().toISOString() 
      }).eq('id', gradeId);
      
      if (updateErr) throw updateErr;

      // ── Notify Student ──
      await supabase.from('notifications').insert([{
        target_user_id: String(grade.student_roll),
        target_role: 'STUDENT',
        title: `🏆 Result Verified: ${grade.chapter_name}`,
        message: `Your result for ${grade.chapter_name} (${grade.subject}) has been verified. Final Score: ${grade.score}/${grade.total_marks}.`,
        type: 'result_verified',
        metadata: { grade_id: gradeId },
        is_read: false
      }]);

      showToast('Grade verified and student notified');
      
      // Update result_card status for this student/exam/subject
      await supabase.from('result_cards').update({ 
        status: 'VERIFIED',
        updated_at: new Date().toISOString()
      }).match({ 
        student_roll: grade.student_roll, 
        exam_name: grade.chapter_name, 
        subject: grade.subject 
      });

      loadAll();
      
      // Update local state if needed
      if (selectedStudentResults) {
        const studentRoll = selectedStudentResults.student.roll_no;
        const { data: updatedGrades } = await supabase.from('grades').select('*').eq('student_roll', studentRoll).order('created_at', { ascending: false });
        setSelectedStudentResults((p: any) => ({ ...p, grades: updatedGrades }));
      }
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditGrade = async () => {
    if (!editingGrade) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('grades').update({
        score: Number(editingGrade.score),
        total_marks: Number(editingGrade.total_marks),
        percentage: ((Number(editingGrade.score) / Number(editingGrade.total_marks)) * 100).toFixed(2),
        grade_letter: getGradeLetter(Number(editingGrade.score), Number(editingGrade.total_marks)),
        is_verified: false // Re-verify if edited
      }).eq('id', editingGrade.id);

      if (error) throw error;
      showToast('Grade updated successfully');
      setEditingGrade(null);
      loadAll();

      if (selectedStudentResults) {
        const studentRoll = selectedStudentResults.student.roll_no;
        const { data: updatedGrades } = await supabase.from('grades').select('*').eq('student_roll', studentRoll).order('created_at', { ascending: false });
        setSelectedStudentResults((p: any) => ({ ...p, grades: updatedGrades }));
      }
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditResultCard = async () => {
    if (!editingResultCard) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('result_cards').update({
        obtained_marks: Number(editingResultCard.obtained_marks),
        total_marks: Number(editingResultCard.total_marks),
        percentage: ((Number(editingResultCard.obtained_marks) / Number(editingResultCard.total_marks)) * 100).toFixed(2),
        grade: getGradeLetter(Number(editingResultCard.obtained_marks), Number(editingResultCard.total_marks)),
        updated_at: new Date().toISOString()
      }).eq('id', editingResultCard.id);

      if (error) throw error;
      showToast('Result card updated successfully');
      setEditingResultCard(null);
      loadAll();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    if (!docForm.file || !docForm.title) { showToast('Title and file required', false); return; }
    setSaving(true);
    try {
      const file = docForm.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `exam-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('exam-docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('exam-docs').getPublicUrl(filePath);

      const { error } = await supabase.from('uploaded_documents').insert([{
        title: docForm.title,
        category: docForm.category,
        file_url: publicUrl,
        file_name: file.name,
        file_type: fileExt,
        visible_to: docForm.visible_to,
        uploaded_by: adminData.full_name,
        uploader_role: 'EXAMINER'
      }]);

      if (error) throw error;
      showToast('Document uploaded and broadcasted');
      setDocForm({ title: '', category: 'General', visible_to: ['All'], file: null });
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteDocument = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await supabase.from('uploaded_documents').delete().eq('id', id);
      showToast('Document deleted');
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
  };

  const generateRollSlips = async () => {
    setSaving(true);
    try {
      const rolls = students.map((s, i) => ({
        student_roll: s.roll_no,
        exam_type: slipForm.exam_type,
        exam_year: slipForm.year,
        exam_center: BRANDING.name,
        hall_no: Math.floor(i / 30) + 1,
        seat_no: (i % 30) + 1,
        generated_by: adminData.full_name,
        is_published: false
      }));

      const { error } = await supabase.from('roll_number_slips').insert(rolls);
      if (error) throw error;
      showToast(`${rolls.length} Roll number slips generated`);
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveDuty = async () => {
    if (!dutyForm.teacher_id || !dutyForm.exam_date) { showToast('Complete duty form', false); return; }
    setSaving(true);
    try {
      const teacher = teachers.find(t => String(t.id) === String(dutyForm.teacher_id));
      const { error } = await supabase.from('duty_chart').insert([{
        teacher_id: Number(dutyForm.teacher_id),
        teacher_name: teacher?.full_name || 'Teacher',
        exam_date: dutyForm.exam_date,
        exam_type: dutyForm.exam_type,
        room_no: dutyForm.room_no,
        duty_shift: dutyForm.shift,
        assigned_class: dutyForm.assigned_class,
        status: 'Assigned'
      }]);
      if (error) throw error;

      await supabase.from('exam_notifications').insert([{
        teacher_id: Number(dutyForm.teacher_id),
        title: 'New Exam Duty Assigned',
        message: `You have exam duty on ${dutyForm.exam_date} in Room ${dutyForm.room_no} (${dutyForm.shift}).`,
        type: 'DUTY',
        is_read: false
      }]);

      showToast('Duty assigned and teacher notified');
      setDutyForm({ teacher_id: '', exam_date: '', exam_type: 'Mid-Term', room_no: '', shift: 'Morning', assigned_class: '' });
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const savePerforma = async () => {
    if (!perfForm.teacher_id || !perfForm.subject) { showToast('Complete performa form', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('paper_receiving_performa').insert([{
        teacher_id: Number(perfForm.teacher_id),
        subject: perfForm.subject,
        class_section: perfForm.class_section,
        exam_date: perfForm.exam_date,
        bundle_count: perfForm.bundle_count,
        status: 'Pending'
      }]);
      if (error) throw error;

      await supabase.from('exam_notifications').insert([{
        teacher_id: Number(perfForm.teacher_id),
        title: 'Paper Performa Required',
        message: `Please submit paper performa for ${perfForm.subject} on ${perfForm.exam_date}.`,
        type: 'PERFORMA',
        is_read: false
      }]);

      showToast('Performa request sent to teacher');
      setPerfForm({ teacher_id: '', subject: '', class_section: '', exam_date: '', bundle_count: 0 });
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveExam = async () => {
    if (!examForm.subject || !examForm.class_section) return showToast('Subject and Class are required', false);
    setSaving(true);
    try {
      const { error } = await supabase.from('exams').insert([{ 
        ...examForm, 
        title: examForm.title || `${examForm.subject} - ${examForm.exam_type}`,
        total_marks: Number(examForm.total_marks),
        created_by: adminData.full_name 
      }]);
      if (error) throw error;
      showToast('Exam created successfully');
      setModal(null);
      setExamForm({ title: '', class_section: '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '', teacher_id: '' });
      loadAll();
    } catch (e: any) { showToast(e.message || 'Failed to save exam', false); }
    finally { setSaving(false); }
  };

  const confirmPaperReceived = async (id: number) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('paper_receiving_performa').update({ 
        status: 'Received', 
        is_received: true, 
        received_at: new Date().toISOString() 
      }).eq('id', id);
      if (error) throw error;
      showToast('Paper receipt confirmed');
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const openStudentResults = async (student: any) => {
    setLoading(true);
    try {
      const { data: studentGrades, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_roll', student.roll_no)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSelectedStudentResults({ student, grades: studentGrades || [] });
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleStatus = async (id: number, status: string) => {
    await supabase.from('exam_schedule').update({ status }).eq('id', id);
    showToast(`Schedule marked as ${status}`); loadAll();
  };

  const printSeatingPlan = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <html>
        <head>
          <title>Seating Plan - ${BRANDING.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .header-info { text-align: center; margin-bottom: 20px; }
            .branding { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .college-name { font-size: 32px; font-weight: 900; margin: 0; color: #1e1b4b; }
            .address { font-size: 12px; color: #64748b; margin-top: 5px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
            h1 { margin: 0; color: #1e1b4b; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
            .meta { display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; font-weight: bold; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #475569; }
            td { font-size: 13px; font-weight: 500; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; font-style: italic; color: #94a3b8; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div class="branding">
              <img src="${LOGO_BASE64}" class="logo" />
              <h1 class="college-name">${BRANDING.name}</h1>
            </div>
            <p class="address">${BRANDING.address} | ${BRANDING.phone}</p>
          </div>
          <div class="header">
            <p style="margin: 5px 0 0; font-weight: bold; color: #4f46e5;">Official Examination Seating Plan</p>
            <div class="meta">
              <span>Date: ${new Date().toLocaleDateString('en-PK')}</span>
              <span>Total Students: ${seating.length}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Seat No</th>
                <th>Room</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Class/Section</th>
                <th>Exam/Subject</th>
              </tr>
            </thead>
            <tbody>
              ${seating.map(s => {
                const st = students.find(x => x.roll_no === s.student_roll);
                return `
                  <tr>
                    <td style="font-weight: 900; color: #4f46e5;">${s.seat_no}</td>
                    <td>${s.room}</td>
                    <td>${s.student_roll}</td>
                    <td style="font-weight: 700;">${st?.full_name || '—'}</td>
                    <td>${st?.class_section || '—'}</td>
                    <td>${s.exam_name || s.subject}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            Generated by ${adminData.full_name} • ${BRANDING.name} Examination Department
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const printResultCard = () => {
    if (!selectedStudentResults) return;
    const { student, grades: stGrades } = selectedStudentResults;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const obtained = stGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0);
    const total = stGrades.reduce((sum: number, g: any) => sum + (g.total_marks || 0), 0);
    const pct = total > 0 ? (obtained / total * 100).toFixed(1) : '0';
    const finalGrade = getGradeLetter(obtained, total);

    const content = `
      <html>
        <head>
          <title>Result Card - ${student.full_name}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .card { border: 4px double #4f46e5; padding: 30px; position: relative; }
            .header-info { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .branding { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 10px; }
            .logo { width: 70px; height: 70px; object-fit: contain; }
            .school-name { font-size: 28px; font-weight: 900; color: #1e1b4b; margin: 0; }
            .address { font-size: 11px; color: #64748b; margin-top: 5px; }
            .title { font-size: 16px; font-weight: 700; color: #4f46e5; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .student-info { display: flex; justify-content: gap; margin-bottom: 30px; font-size: 14px; }
            .info-item { flex: 1; border-bottom: 1px solid #f1f5f9; padding: 10px 0; }
            .label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-weight: 700; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f8fafc; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; }
            .summary { margin-top: 30px; display: flex; justify-content: flex-end; }
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; width: 250px; border-radius: 10px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .final-total { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px; font-weight: 900; font-size: 18px; color: #4f46e5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-info">
              <div class="branding">
                <img src="${LOGO_BASE64}" class="logo" />
                <h1 class="school-name">${BRANDING.name}</h1>
              </div>
              <p class="address">${BRANDING.address} | ${BRANDING.phone}</p>
              <p class="title">OFFICIAL RESULT CARD</p>
            </div>
            <div class="student-info">
              <div class="info-item"><div class="label">Candidate Name</div><div class="value">${student.full_name}</div></div>
              <div class="info-item"><div class="label">Roll Number</div><div class="value">${student.roll_no}</div></div>
              <div class="info-item"><div class="label">Class/Section</div><div class="value">${student.class_section}</div></div>
            </div>
            <table>
              <thead>
                <tr><th>Subject / Topic</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Grade</th></tr>
              </thead>
              <tbody>
                ${stGrades.map((g: any) => `
                  <tr>
                    <td>${g.chapter_name} (${g.subject})</td>
                    <td>${g.score}</td>
                    <td>${g.total_marks}</td>
                    <td>${Number(g.percentage).toFixed(1)}%</td>
                    <td style="font-weight: 900;">${g.grade_letter}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary">
              <div class="summary-card">
                <div class="summary-row"><span>Total Marks:</span><span>${total}</span></div>
                <div class="summary-row"><span>Marks Obtained:</span><span>${obtained}</span></div>
                <div class="summary-row"><span>Overall Percentage:</span><span>${pct}%</span></div>
                <div class="summary-row final-total"><span>GRADE:</span><span>${finalGrade}</span></div>
              </div>
            </div>
            <div class="footer" style="margin-top: 60px; display: flex; justify-content: space-between;">
              <div style="border-top: 1px solid #1e293b; width: 200px; text-align: center; padding-top: 10px;">Examiner Signature</div>
              <div style="border-top: 1px solid #1e293b; width: 200px; text-align: center; padding-top: 10px;">Principal Seal</div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const printRollSlip = (slip: any) => {
    const st = students.find(x => x.roll_no === slip.student_roll);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Roll No Slip - ${slip.student_roll}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; display: flex; justify-content: center; }
            .slip { width: 350px; border: 2px solid #e2e8f0; border-radius: 20px; padding: 25px; position: relative; background: white; }
            .header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
            .logo { width: 50px; height: 50px; object-fit: contain; }
            .college-name { font-size: 16px; font-weight: 900; color: #1e1b4b; margin: 0; }
            .slip-title { font-size: 12px; font-weight: 900; color: #4f46e5; text-transform: uppercase; margin-top: 2px; }
            .info-box { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 15px 0; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
            .label { font-weight: 900; color: #94a3b8; text-transform: uppercase; font-size: 9px; }
            .value { font-weight: 700; color: #1e293b; }
            .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .date { font-size: 9px; color: #94a3b8; font-weight: 700; }
            .signature { border-top: 1px solid #e2e8f0; width: 100px; text-align: center; font-size: 9px; padding-top: 5px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="slip">
            <div class="header">
              <img src="${LOGO_BASE64}" class="logo" />
              <div>
                <h1 class="college-name">${BRANDING.name}</h1>
                <p class="slip-title">Roll No Slip: ${slip.exam_type}</p>
              </div>
            </div>
            <div class="info-box">
              <div class="row"><span class="label">Candidate Name</span><span class="value">${st?.full_name || 'Candidate'}</span></div>
              <div class="row"><span class="label">Roll Number</span><span class="value" style="color: #4f46e5;">${slip.student_roll}</span></div>
              <div class="row"><span class="label">Year / Session</span><span class="value">${slip.exam_year}</span></div>
              <div class="row"><span class="label">Hall / Seat</span><span class="value">${slip.hall_no} / ${slip.seat_no}</span></div>
              <div class="row"><span class="label">Exam Center</span><span class="value">${slip.exam_center}</span></div>
            </div>
            <div class="footer">
              <span class="date">Dated: ${new Date(slip.generated_at).toLocaleDateString()}</span>
              <div class="signature">Controller Exam</div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const printAllRollSlips = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const slipsHtml = rollSlips.map(slip => {
      const st = students.find(x => x.roll_no === slip.student_roll);
      return `
        <div class="slip">
          <div class="header">
            <img src="${LOGO_BASE64}" class="logo" />
            <div>
              <h1 class="college-name">${BRANDING.name}</h1>
              <p class="slip-title">Roll No Slip: ${slip.exam_type}</p>
            </div>
          </div>
          <div class="info-box">
            <div class="row"><span class="label">Candidate Name</span><span class="value">${st?.full_name || 'Candidate'}</span></div>
            <div class="row"><span class="label">Roll Number</span><span class="value" style="color: #4f46e5;">${slip.student_roll}</span></div>
            <div class="row"><span class="label">Year / Session</span><span class="value">${slip.exam_year}</span></div>
            <div class="row"><span class="label">Hall / Seat</span><span class="value">${slip.hall_no} / ${slip.seat_no}</span></div>
            <div class="row"><span class="label">Exam Center</span><span class="value">${slip.exam_center}</span></div>
          </div>
          <div class="footer">
            <span class="date">Dated: ${new Date(slip.generated_at).toLocaleDateString()}</span>
            <div class="signature">Controller Exam</div>
          </div>
        </div>
      `;
    }).join('');

    const content = `
      <html>
        <head>
          <title>All Roll No Slips</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
            .slip { width: 350px; border: 2px solid #e2e8f0; border-radius: 20px; padding: 25px; margin: 10px; display: inline-block; vertical-align: top; page-break-inside: avoid; background: white; }
            .header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
            .logo { width: 50px; height: 50px; object-fit: contain; }
            .college-name { font-size: 16px; font-weight: 900; color: #1e1b4b; margin: 0; }
            .slip-title { font-size: 12px; font-weight: 900; color: #4f46e5; text-transform: uppercase; margin-top: 2px; }
            .info-box { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 15px 0; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
            .label { font-weight: 900; color: #94a3b8; text-transform: uppercase; font-size: 9px; }
            .value { font-weight: 700; color: #1e293b; }
            .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .date { font-size: 9px; color: #94a3b8; font-weight: 700; }
            .signature { border-top: 1px solid #e2e8f0; width: 100px; text-align: center; font-size: 9px; padding-top: 5px; font-weight: 700; }
            @media print { .slip { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-wrap: wrap; justify-content: center;">
            ${slipsHtml}
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const upcomingExams    = schedules.filter(s => s.status === 'Upcoming').length;
  const ongoingExams     = schedules.filter(s => s.status === 'Ongoing').length;
  const unverifiedGrades = grades.filter(g => !g.is_verified).length;
  const publishedResults = results.filter(r => r.is_published).length;

  const TAB_TITLE: Record<string, string> = {
    dashboard: 'Dashboard', schedules: 'Exam Schedules', exams: 'Exams',
    seating: 'Seating Plans', invigilation: 'Invigilation',
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
            <button onClick={() => setShowNotifs(true)} className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <Megaphone size={14} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{unreadCount}</span>}
            </button>
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

                {/* Notices & Documents */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><Megaphone size={16} style={{ color: ACCENT }} /> Notices & Documents</h3>
                    <button onClick={() => setTab('upload')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>Manage Docs →</button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedDocs.slice(0, 4).map(doc => (
                      <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                            {doc.file_type === 'pdf' ? <FileText size={18} /> : <FileImage size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{doc.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.category} • {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                    {!uploadedDocs.length && <p className="col-span-full py-6 text-center text-slate-400 font-bold italic">No documents broadcasted yet.</p>}
                  </div>
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
                <div className="flex justify-between items-center bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 mb-2">
                   <p className="text-xs text-indigo-700 font-bold flex items-center gap-2"><Shield size={14} /> Official Examination Schedule Management</p>
                   <button onClick={() => setModal('sched')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white" style={{ background: GRADIENT }}>
                      <Plus size={14} /> Create Schedule
                   </button>
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

            {/* ══════════ EXAMINATION (PORTED FROM VP) ══════════ */}
            {tab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-between items-center bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 shadow-sm">
                   <div>
                     <h2 className="text-lg font-black text-indigo-900">Examination Management</h2>
                     <p className="text-xs text-indigo-600">Sync with VP's refined examination features & manual result entry.</p>
                   </div>
                   <button onClick={() => setModal('exam')} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white shadow-lg" style={{ background: GRADIENT }}>
                     <Plus size={18} /> New Exam
                   </button>
                </div>

                <SubTabs 
                  tabs={[
                    { id: 'list',   label: 'List Exams' },
                    { id: 'result', label: 'Exam Results' },
                    { id: 'print',  label: 'Print Marks' }
                  ]} 
                  active={examTab} 
                  onChange={setExamTab} 
                  accent={ACCENT} 
                />

                {examTab === 'list' && (
                  <div className="space-y-4">
                    <div className="relative">
                       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams by subject or class…"
                         className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 bg-white shadow-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exams.filter(e => !search || e.subject?.toLowerCase().includes(search.toLowerCase()) || e.class_section?.toLowerCase().includes(search.toLowerCase())).map((e) => (
                        <div key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                           <div className="flex items-center justify-between gap-3 mb-3">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                 <FileText size={20} />
                               </div>
                               <div>
                                 <h3 className="font-black text-slate-900">{e.subject}</h3>
                                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{e.exam_type}</p>
                               </div>
                             </div>
                             <Badge c={e.grading_status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'} label={e.grading_status || 'Pending'} />
                           </div>
                           <div className="space-y-2 mt-4 text-xs font-bold text-slate-600">
                             <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><Users size={12} className="text-slate-400" /> Class: {e.class_section}</p>
                             <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><Calendar size={12} className="text-slate-400" /> Date: {e.date}</p>
                             <p className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg font-black text-slate-800"><Award size={12} className="text-slate-400" /> Marks: {e.total_marks}</p>
                           </div>
                           <div className="mt-4 flex gap-2">
                             <button onClick={() => { setTab('grades'); setSearch(e.subject); }} className="flex-1 py-2 rounded-xl text-[10px] font-black border border-slate-200 text-slate-600 hover:bg-slate-50">Enter Grades</button>
                             <button onClick={() => { setSelectedExam(String(e.id)); setExamTab('result'); }} className="flex-1 py-2 rounded-xl text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors">View Results</button>
                           </div>
                        </div>
                      ))}
                      {!exams.length && <div className="col-span-full py-20 text-center text-slate-400 font-bold">No exams found.</div>}
                    </div>
                  </div>
                )}

                {examTab === 'result' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row items-end gap-4">
                      <div className="flex-1">
                        <FM label="Select Exam">
                          <TS value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                            <option value="">-- Choose an Exam --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.title || e.subject} — {e.class_section} — {e.subject}</option>)}
                          </TS>
                        </FM>
                      </div>
                      {selectedExam && (
                        <div className="flex gap-2">
                          <button onClick={() => window.print()} className="px-6 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs border border-slate-200">Print Table</button>
                        </div>
                      )}
                    </div>
                    {selectedExam ? (
                      <TableWrap>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="font-black text-slate-900">Results: {exams.find(e => String(e.id) === selectedExam)?.subject}</h3>
                          <Badge c="bg-indigo-100 text-indigo-700 border-indigo-200" label={`${examMarks.length} Students`} />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                              <tr>
                                <Th>Roll No</Th>
                                <Th>Student Name</Th>
                                <Th>Obtained</Th>
                                <Th>Total</Th>
                                <Th>% Age</Th>
                                <Th>Grade</Th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {examMarks.map(m => {
                                const stu = students.find(s => s.roll_no === m.student_roll || s.roll_no === m.student_roll_no);
                                const exam = exams.find(e => String(e.id) === selectedExam);
                                const pct = exam?.total_marks ? Math.round((m.marks_obtained / exam.total_marks) * 100) : 0;
                                return (
                                  <tr key={m.id} className="hover:bg-slate-50/50">
                                    <Td className="font-mono text-indigo-600 font-black">#{m.student_roll || m.student_roll_no}</Td>
                                    <Td className="font-bold text-slate-800">{stu?.full_name || '—'}</Td>
                                    <Td className="font-black text-slate-900">{m.marks_obtained}</Td>
                                    <Td className="text-slate-400 font-bold">{exam?.total_marks}</Td>
                                    <Td className={cn('font-black', pct >= 40 ? 'text-emerald-600' : 'text-rose-600')}>{pct}%</Td>
                                    <Td>
                                      <Badge 
                                        c={pct >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pct >= 50 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-rose-50 text-rose-700 border-rose-200'}
                                        label={getGradeLetter(m.marks_obtained, exam?.total_marks || 100)}
                                      />
                                    </Td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {!examMarks.length && <div className="p-12 text-center text-slate-400 font-bold italic">No marks entered for this exam yet.</div>}
                        </div>
                      </TableWrap>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                         <Award className="mx-auto text-slate-300 mb-4" size={40} />
                         <p className="text-slate-400 font-bold">Select an exam to view the full marks table.</p>
                      </div>
                    )}
                  </div>
                )}

                {examTab === 'print' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                       <FM label="Select Exam for Mark Sheet">
                          <TS value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                            <option value="">-- Choose an Exam --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.title || e.subject} — {e.class_section}</option>)}
                          </TS>
                       </FM>
                       <button onClick={() => window.print()} className="w-full py-3 rounded-2xl text-white font-black text-sm shadow-xl" style={{ background: GRADIENT }}>
                         <Printer className="inline-block mr-2" size={18} /> Print Official Mark Sheets
                       </button>
                    </div>
                    {selectedExam && (
                      <div id="printable-marks" className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                        <div className="text-center mb-10">
                          <img src={LOGO_BASE64} className="h-20 mx-auto mb-4" />
                          <h2 className="font-black text-2xl text-slate-900 uppercase tracking-tight">{BRANDING.name}</h2>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Unified Examination Result Sheet</p>
                          <div className="w-20 h-1 rounded-full bg-indigo-600 mx-auto mt-6" />
                        </div>
                        <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Title</p>
                              <p className="text-lg font-black text-slate-900">{exams.find(e => String(e.id) === selectedExam)?.title || exams.find(e => String(e.id) === selectedExam)?.subject}</p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Class</p>
                              <p className="text-sm font-bold text-slate-700">{exams.find(e => String(e.id) === selectedExam)?.date} — {exams.find(e => String(e.id) === selectedExam)?.class_section}</p>
                           </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-slate-200">
                               <th className="py-3 text-left text-[11px] font-black text-slate-900 uppercase">Roll No</th>
                               <th className="py-3 text-left text-[11px] font-black text-slate-900 uppercase">Candidate Name</th>
                               <th className="py-3 text-right text-[11px] font-black text-slate-900 uppercase">Obtained</th>
                               <th className="py-3 text-right text-[11px] font-black text-slate-900 uppercase">% Age</th>
                               <th className="py-3 text-right text-[11px] font-black text-slate-900 uppercase">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {examMarks.map(m => {
                              const stu = students.find(s => s.roll_no === m.student_roll || s.roll_no === m.student_roll_no);
                              const exam = exams.find(e => String(e.id) === selectedExam);
                              const pct = exam?.total_marks ? Math.round((m.marks_obtained / exam.total_marks) * 100) : 0;
                              return (
                                <tr key={m.id}>
                                  <td className="py-3 font-mono font-bold">{m.student_roll || m.student_roll_no}</td>
                                  <td className="py-3 font-bold text-slate-700">{stu?.full_name || '—'}</td>
                                  <td className="py-3 text-right font-black">{m.marks_obtained} / {exam?.total_marks}</td>
                                  <td className="py-3 text-right font-bold">{pct}%</td>
                                  <td className="py-3 text-right font-black text-indigo-700">{getGradeLetter(m.marks_obtained, exam?.total_marks || 100)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="mt-20 flex justify-between">
                           <div className="text-center">
                              <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto" />
                              <p className="text-[10px] font-black uppercase text-slate-500">Controller of Examinations</p>
                           </div>
                           <div className="text-center">
                              <div className="w-48 border-b-2 border-slate-900 mb-2 mx-auto" />
                              <p className="text-[10px] font-black uppercase text-slate-500">Principal Signature / Seal</p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════ SEATING PLANS (MANUAL) ══════════ */}
            {tab === 'seating' && (
              <motion.div key="seating" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-900 flex items-center gap-2"><Search size={16} /> Filter Students</h3>
                        {seating.length > 0 && (
                          <button onClick={printSeatingPlan} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-slate-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-50">
                            <FileText size={14} /> Print Seating Plan
                          </button>
                        )}
                      </div>
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
                          {['Student','Roll #','Class','Program','Test Count','Last Result','Action'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || String(s.roll_no).includes(search)).slice(0, 50).map((s) => {
                          const sGrades = grades.filter(g => g.student_roll === s.roll_no);
                          const lastGrade = sGrades[0];
                          return (
                            <tr key={s.roll_no} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-medium text-slate-800">{s.full_name}</td>
                              <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{s.roll_no}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{s.class_section}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{s.program}</td>
                              <td className="px-4 py-2.5 font-black text-slate-700">{sGrades.length}</td>
                              <td className="px-4 py-2.5">
                                {lastGrade ? <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={`${lastGrade.grade_letter} (${Math.round(lastGrade.percentage)}%)`} /> : <span className="text-[10px] text-slate-300">No data</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openStudentResults(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white" style={{ background: GRADIENT }}>
                                    <Eye size={12} /> View
                                  </button>
                                  {results.find(r => r.student_roll === s.roll_no) && (
                                    <button onClick={() => setEditingResultCard(results.find(r => r.student_roll === s.roll_no))} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                      <PenLine size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!students.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">No students found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedStudentResults && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStudentResults(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="relative bg-[#f8fafc] rounded-[2.5rem] w-full max-w-4xl z-10 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                         {/* Header */}
                        <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: GRADIENT }}>
                              <Award size={28} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900">{selectedStudentResults.student.full_name}</h3>
                              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Roll: {selectedStudentResults.student.roll_no} • {selectedStudentResults.student.class_section}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={printResultCard} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-xs hover:bg-indigo-100 transition-all border border-indigo-100">
                              <Eye size={16} /> Print Full Card
                            </button>
                            <button onClick={() => setSelectedStudentResults(null)} className="p-2 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
                              <X size={24} />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                          {/* Stats Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { l: 'Total Tests', v: selectedStudentResults.grades.length, c: '#4f46e5' },
                              { l: 'Avg. Percentage', v: `${selectedStudentResults.grades.length > 0 ? (selectedStudentResults.grades.reduce((s: any, g: any) => s + Number(g.percentage || 0), 0) / selectedStudentResults.grades.length).toFixed(1) : 0}%`, c: '#10b981' },
                              { l: 'Tests Passed', v: selectedStudentResults.grades.filter((g: any) => Number(g.percentage || 0) >= 40).length, c: '#0ea5e9' },
                              { l: 'Verification Req', v: selectedStudentResults.grades.filter((g: any) => !g.is_verified).length, c: '#f59e0b' }
                            ].map(s => (
                              <div key={s.l} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.l}</p>
                                <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
                              </div>
                            ))}
                          </div>

                          {/* Historical Results List */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <History size={14} /> Result History & Verification
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {selectedStudentResults.grades.map((grade: any) => (
                                <div key={grade.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", grade.is_verified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                        {grade.is_verified ? <CheckCircle size={20} /> : <Clock size={20} />}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{grade.chapter_name}</h5>
                                          <Badge c="bg-slate-100 text-slate-500 border-slate-200" label={grade.subject} />
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                          Entered on {new Date(grade.created_at).toLocaleDateString('en-PK')} • By {grade.entered_by || 'Teacher'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                      <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900 leading-none">{grade.score}/{grade.total_marks}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{grade.grade_letter} ({Math.round(grade.percentage)}%)</p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
                                        <div className="flex items-center gap-2">
                                          {grade.is_verified && (
                                            <div className="flex flex-col items-end mr-2">
                                              <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label="VERIFIED" />
                                              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">by {grade.verified_by?.split(' ')[0]}</p>
                                            </div>
                                          )}
                                          
                                          <button 
                                            onClick={() => setEditingGrade(grade)}
                                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                                            title="Edit Result">
                                            <PenLine size={16} />
                                          </button>

                                          {!grade.is_verified && (
                                            <button 
                                              onClick={() => verifyGrade(grade.id)}
                                              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                                              Verify & Notify
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {selectedStudentResults.grades.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">
                                  No test results found for this student.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Edit Grade Modal */}
                <AnimatePresence>
                  {editingGrade && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingGrade(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white rounded-3xl w-full max-w-sm z-10 shadow-2xl p-6">
                        <h4 className="text-lg font-black text-slate-900 mb-4">Edit Marks</h4>
                        <div className="space-y-4">
                          <FM label="Obtained Marks"><TI type="number" value={editingGrade.score} onChange={(e: any) => setEditingGrade({ ...editingGrade, score: e.target.value })} /></FM>
                          <FM label="Total Marks"><TI type="number" value={editingGrade.total_marks} onChange={(e: any) => setEditingGrade({ ...editingGrade, total_marks: e.target.value })} /></FM>
                        </div>
                        <div className="mt-6 flex gap-3">
                          <button onClick={() => setEditingGrade(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                          <button onClick={handleEditGrade} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-black text-sm shadow-lg shadow-indigo-600/20 hover:opacity-90" style={{ background: GRADIENT }}>
                            {saving ? 'Saving...' : 'Update'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
                {/* Edit Result Card Modal */}
                <AnimatePresence>
                  {editingResultCard && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingResultCard(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white rounded-3xl w-full max-w-sm z-10 shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Award size={20} /></div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-none">Edit Final Result</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Roll #{editingResultCard.student_roll}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <FM label="Obtained Marks (Final)"><TI type="number" value={editingResultCard.obtained_marks} onChange={(e: any) => setEditingResultCard({ ...editingResultCard, obtained_marks: e.target.value })} /></FM>
                          <FM label="Total Marks (Final)"><TI type="number" value={editingResultCard.total_marks} onChange={(e: any) => setEditingResultCard({ ...editingResultCard, total_marks: e.target.value })} /></FM>
                        </div>
                        <div className="mt-6 flex gap-3">
                          <button onClick={() => setEditingResultCard(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                          <button onClick={handleEditResultCard} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-black text-sm shadow-lg shadow-indigo-600/20 hover:opacity-90" style={{ background: GRADIENT }}>
                            {saving ? 'Saving...' : 'Update Card'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ══════════ DOCUMENT UPLOAD ══════════ */}
            {tab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Upload size={18} style={{ color: ACCENT }} /> Upload & Broadcast Document</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <FM label="Document Title" req><TI value={docForm.title} onChange={(e: any) => setDocForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. Annual Exam DateSheet" /></FM>
                    <FM label="Category" req>
                      <TS value={docForm.category} onChange={(e: any) => setDocForm((p: any) => ({ ...p, category: e.target.value }))}>
                        {['Exam', 'Result', 'Notice', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                      </TS>
                    </FM>
                    <FM label="Visible To" req>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {['Students', 'Teachers', 'Principal', 'All'].map(v => (
                          <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={docForm.visible_to.includes(v)} onChange={(e: any) => {
                              const list = e.target.checked ? [...docForm.visible_to, v] : docForm.visible_to.filter((x: any) => x !== v);
                              setDocForm((p: any) => ({ ...p, visible_to: list }));
                            }} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600" />
                            <span className="text-[10px] font-bold text-slate-600">{v}</span>
                          </label>
                        ))}
                      </div>
                    </FM>
                    <FM label="Choose File" req>
                      <input type="file" onChange={(e: any) => setDocForm((p: any) => ({ ...p, file: e.target.files?.[0] || null }))} className="text-xs text-slate-500 file:bg-indigo-50 file:text-indigo-600 file:border-none file:rounded-lg file:px-3 file:py-1.5 file:font-black file:mr-3 cursor-pointer" />
                    </FM>
                    <button onClick={uploadDocument} disabled={saving} className="py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50" style={{ background: GRADIENT }}>
                      {saving ? 'Uploading...' : 'Upload & Broadcast'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {uploadedDocs.map(doc => (
                    <motion.div layout key={doc.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                          {doc.file_type === 'pdf' ? <FileText size={24} /> : <FileImage size={24} />}
                        </div>
                        <button onClick={() => deleteDocument(doc.id)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h4 className="font-black text-slate-800 mb-1 truncate">{doc.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{doc.category} • {doc.file_type?.toUpperCase()}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {doc.visible_to?.map((v: any) => (
                            <div key={v} className="px-2 py-0.5 rounded-full border border-white bg-slate-100 text-[8px] font-black text-slate-500 shadow-sm">{v}</div>
                          ))}
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:underline">
                          <Download size={12} /> View/Download
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════ ROLL NO SLIPS ══════════ */}
            {tab === 'rollslips' && (
              <motion.div key="rollslips" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><UserSquare size={18} style={{ color: ACCENT }} /> Roll Number Slips Generator</h3>
                    <div className="flex gap-2">
                       <button onClick={printAllRollSlips} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-600 flex items-center gap-2 hover:bg-slate-100">
                         <Printer size={14} /> Print All Slips
                       </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FM label="Exam Type" req>
                      <TS value={slipForm.exam_type} onChange={(e: any) => setSlipForm((p: any) => ({ ...p, exam_type: e.target.value }))}>
                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </TS>
                    </FM>
                    <FM label="Year" req><TI value={slipForm.year} onChange={(e: any) => setSlipForm((p: any) => ({ ...p, year: e.target.value }))} /></FM>
                    <FM label="Upload Slip Background (Template)">
                      <input type="file" className="text-[10px]" />
                    </FM>
                    <button onClick={generateRollSlips} disabled={saving} className="py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50" style={{ background: GRADIENT }}>
                      {saving ? 'Generating...' : 'Bulk Generate Slips'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {rollSlips.slice(0, 12).map(slip => {
                     const st = students.find(x => x.roll_no === slip.student_roll);
                     return (
                       <div key={slip.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative overflow-hidden group">
                          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/50 rounded-full -translate-y-12 translate-x-12" />
                          <div className="flex items-center gap-3 mb-4">
                             <img src={LOGO_BASE64} className="w-8 h-8 object-contain" />
                             <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase leading-none">{BRANDING.name}</p>
                               <p className="text-[10px] font-black text-indigo-600 uppercase mt-0.5">Roll No Slip: {slip.exam_type}</p>
                             </div>
                          </div>
                          <div className="space-y-2 border-y border-slate-50 py-4 my-4">
                             <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidate</span><span className="text-xs font-black text-slate-800">{st?.full_name || 'Student'}</span></div>
                             <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Roll Number</span><span className="text-xs font-black text-indigo-600">{slip.student_roll}</span></div>
                             <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hall / Seat</span><span className="text-xs font-black text-slate-800">{slip.hall_no} / {slip.seat_no}</span></div>
                             <div className="flex justify-between"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Exam Center</span><span className="text-xs font-black text-slate-800">{slip.exam_center}</span></div>
                          </div>
                          <div className="flex items-center justify-between">
                             <p className="text-[8px] font-bold text-slate-400">Generated: {new Date(slip.generated_at).toLocaleDateString()}</p>
                             <button onClick={() => printRollSlip(slip)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600"><Printer size={12} /></button>
                          </div>
                       </div>
                     );
                   })}
                </div>
              </motion.div>
            )}

            {/* ══════════ DUTY CHART ══════════ */}
            {tab === 'dutychart' && (
              <motion.div key="dutychart" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><UserCheck size={18} style={{ color: ACCENT }} /> Assign Examination Duty</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <FM label="Teacher" req>
                      <TS value={dutyForm.teacher_id} onChange={(e: any) => setDutyForm((p: any) => ({ ...p, teacher_id: e.target.value }))}>
                        <option value="">Select...</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </TS>
                    </FM>
                    <FM label="Exam Date" req><TI type="date" value={dutyForm.exam_date} onChange={(e: any) => setDutyForm((p: any) => ({ ...p, exam_date: e.target.value }))} /></FM>
                    <FM label="Exam Type" req>
                      <TS value={dutyForm.exam_type} onChange={(e: any) => setDutyForm((p: any) => ({ ...p, exam_type: e.target.value }))}>
                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </TS>
                    </FM>
                    <FM label="Shift" req>
                      <TS value={dutyForm.shift} onChange={(e: any) => setDutyForm((p: any) => ({ ...p, shift: e.target.value }))}>
                        {['Morning', 'Evening', 'Night'].map(s => <option key={s} value={s}>{s}</option>)}
                      </TS>
                    </FM>
                    <FM label="Room No" req><TI value={dutyForm.room_no} onChange={(e: any) => setDutyForm((p: any) => ({ ...p, room_no: e.target.value }))} /></FM>
                    <button onClick={saveDuty} disabled={saving} className="py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50" style={{ background: GRADIENT }}>
                      {saving ? 'Assigning...' : 'Assign Duty'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Teacher','Date','Type','Room','Shift','Status','Reported At'].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {dutyChart.map(duty => (
                          <tr key={duty.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-black text-slate-800">{duty.teacher_name}</td>
                            <td className="px-6 py-4 font-bold text-slate-600">{duty.exam_date}</td>
                            <td className="px-6 py-4"><Badge c="bg-indigo-50 text-indigo-700 border-indigo-100" label={duty.exam_type} /></td>
                            <td className="px-6 py-4 font-black text-slate-500">{duty.room_no}</td>
                            <td className="px-6 py-4 font-bold text-slate-500">{duty.duty_shift}</td>
                            <td className="px-6 py-4">
                               <Badge c={duty.status === 'Reported' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} label={duty.status} />
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-bold">{duty.reported_at ? new Date(duty.reported_at).toLocaleTimeString() : 'Pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {/* ══════════ PAPER PERFORMA ══════════ */}
            {tab === 'paperperforma' && (
              <motion.div key="paperperforma" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                   <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Inbox size={18} style={{ color: ACCENT }} /> Paper Receiving Performa Management</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                      <FM label="Assign to Teacher" req>
                        <TS value={perfForm.teacher_id} onChange={(e: any) => setPerfForm((p: any) => ({ ...p, teacher_id: e.target.value }))}>
                          <option value="">Select...</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </TS>
                      </FM>
                      <FM label="Subject" req><TI value={perfForm.subject} onChange={(e: any) => setPerfForm((p: any) => ({ ...p, subject: e.target.value }))} /></FM>
                      <FM label="Class/Section" req><TI value={perfForm.class_section} onChange={(e: any) => setPerfForm((p: any) => ({ ...p, class_section: e.target.value }))} /></FM>
                      <FM label="Exam Date" req><TI type="date" value={perfForm.exam_date} onChange={(e: any) => setPerfForm((p: any) => ({ ...p, exam_date: e.target.value }))} /></FM>
                      <button onClick={savePerforma} disabled={saving} className="py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50" style={{ background: GRADIENT }}>
                        {saving ? 'Saving...' : 'Request Performa'}
                      </button>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Subject','Class','Teacher','Date','Bundles','Status','Action'].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {performaList.map(perf => {
                          const teacher = teachers.find(t => t.id === perf.teacher_id);
                          return (
                            <tr key={perf.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-black text-slate-800">{perf.subject}</td>
                              <td className="px-6 py-4 font-bold text-slate-500">{perf.class_section}</td>
                              <td className="px-6 py-4 font-bold text-slate-600">{teacher?.full_name || 'Teacher'}</td>
                              <td className="px-6 py-4 text-slate-500">{perf.exam_date}</td>
                              <td className="px-6 py-4 font-black">{perf.bundle_count}</td>
                              <td className="px-6 py-4"><Badge c={perf.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} label={perf.status} /></td>
                              <td className="px-6 py-4">
                                {perf.status !== 'Received' && (
                                  <button onClick={() => confirmPaperReceived(perf.id)} className="text-xs font-black text-indigo-600 hover:underline">Confirm Receipt</button>
                                )}
                                {perf.status === 'Received' && <span className="text-[10px] font-bold text-emerald-500">Confirmed at {new Date(perf.received_at).toLocaleDateString()}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {/* ══════════ REPORT CARDS (ENHANCED) ══════════ */}
            {tab === 'reportcards' && (
              <motion.div key="reportcards" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                   <div>
                     <h3 className="font-black text-slate-900 flex items-center gap-2"><Award size={20} style={{ color: ACCENT }} /> Detailed Student Report Cards</h3>
                     <p className="text-xs text-slate-400 font-medium mt-1">Generate, Verify and Print comprehensive report cards with college branding.</p>
                   </div>
                   <button onClick={() => generateResultCards(schedules[0]?.id)} disabled={saving} className="px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/20" style={{ background: GRADIENT }}>
                     {saving ? 'Processing...' : 'Auto-Generate All Cards'}
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {students.filter(s => !search || s.full_name?.toLowerCase().includes(search.toLowerCase())).slice(0, 50).map(s => {
                     const studentGrades = grades.filter(g => g.student_roll === s.roll_no);
                     const totalTests = studentGrades.length;
                     const avgPct = totalTests > 0 ? Number(studentGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalTests).toFixed(1) : 0;
                     return (
                       <motion.div whileHover={{ y: -5 }} key={s.roll_no} className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg">
                               {s.full_name?.charAt(0)}
                             </div>
                             <div>
                               <h4 className="font-black text-slate-800 leading-none">{s.full_name}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Roll: {s.roll_no} • {s.class_section}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                             <div className="bg-slate-50 p-3 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Avg Score</p>
                                <p className="text-xl font-black text-indigo-600 leading-none">{avgPct}%</p>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Tests</p>
                                <p className="text-xl font-black text-slate-800 leading-none">{totalTests}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => openStudentResults(s)} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-200">View Details</button>
                             <button onClick={() => {
                               setSelectedStudentResults({ student: s, grades: studentGrades });
                               setTimeout(printResultCard, 100);
                             }} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-200 transition-all"><Printer size={16} /></button>
                          </div>
                       </motion.div>
                     );
                   })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ══════════════ MODALS ══════════════ */}
      <AnimatePresence>
        {/* Create Schedule Modal */}
        {modal === 'sched' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: GRADIENT }} />
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base"><Calendar size={18} style={{ color: ACCENT }} /> Create Exam Schedule</h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <FM label="Schedule Title" req><TI placeholder="e.g. Mid-Term Examination 2026" value={schedForm.title} onChange={e => setSchedForm((p: any)=> ({ ...p, title: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Exam Type"><TS value={schedForm.exam_type} onChange={e => setSchedForm((p: any)=> ({ ...p, exam_type: e.target.value }))}>{EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</TS></FM>
                  <FM label="Session"><TI value={schedForm.session} onChange={e => setSchedForm((p: any)=> ({ ...p, session: e.target.value }))} /></FM>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Program"><TS value={schedForm.program} onChange={e => setSchedForm((p: any)=> ({ ...p, program: e.target.value }))}><option value="">Select...</option>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</TS></FM>
                  <FM label="Part"><TS value={schedForm.part} onChange={e => setSchedForm((p: any)=> ({ ...p, part: Number(e.target.value) }))}><option value={1}>Part 1</option><option value={2}>Part 2</option></TS></FM>
                </div>
                <FM label="Target Class (Optional)"><TI placeholder="ICS-I A" value={schedForm.class_section} onChange={e => setSchedForm((p: any)=> ({ ...p, class_section: e.target.value }))} /></FM>
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Start Date" req><TI type="date" value={schedForm.start_date} onChange={e => setSchedForm((p: any)=> ({ ...p, start_date: e.target.value }))} /></FM>
                  <FM label="End Date" req><TI type="date" value={schedForm.end_date} onChange={e => setSchedForm((p: any)=> ({ ...p, end_date: e.target.value }))} /></FM>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={saveSchedule} disabled={saving} className="px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95" style={{ background: GRADIENT }}>
                  {saving ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

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

        {/* Create Exam Modal */}
        {modal === 'exam' && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900">Create New Exam</h3>
                </div>
                <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Basic Information</div>
                <FM label="Exam Title (Optional)"><TI placeholder="e.g. Monthly Quiz 1" value={examForm.title} onChange={(e: any) => setExamForm({ ...examForm, title: e.target.value })} /></FM>
                <FM label="Exam Type">
                  <TS value={examForm.exam_type} onChange={(e: any) => setExamForm({ ...examForm, exam_type: e.target.value })}>
                    <option value="Chapter Test">Chapter Test</option>
                    <option value="Monthly Test">Monthly Test</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Final-Term">Final-Term</option>
                    <option value="Quiz">Quiz</option>
                  </TS>
                </FM>
                <FM label="Subject" req><TI placeholder="e.g. Mathematics" value={examForm.subject} onChange={(e: any) => setExamForm({ ...examForm, subject: e.target.value })} /></FM>
                <FM label="Class / Section" req>
                  <TS value={examForm.class_section} onChange={(e: any) => setExamForm({ ...examForm, class_section: e.target.value })}>
                    <option value="">-- Select Class --</option>
                    {Array.from(new Set(students.map(s => s.class_section))).sort().map(c => <option key={c} value={c}>{c}</option>)}
                  </TS>
                </FM>
                <FM label="Exam Date" req><TI type="date" value={examForm.date} onChange={(e: any) => setExamForm({ ...examForm, date: e.target.value })} /></FM>
                <FM label="Total Marks" req><TI type="number" value={examForm.total_marks} onChange={(e: any) => setExamForm({ ...examForm, total_marks: Number(e.target.value) })} /></FM>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={saveExam} disabled={saving} className="flex-2 py-3.5 rounded-2xl text-white font-black text-sm shadow-xl shadow-indigo-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
                  {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                  {saving ? 'Creating...' : 'Create Exam Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifs && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifs(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="font-black text-slate-900">Notifications</h3>
                 <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
               </div>
               <div className="p-2 max-h-[60vh] overflow-y-auto">
                 {notifications.map((n, i) => (
                   <div key={n.id} className={cn("p-4 rounded-2xl flex gap-3 transition-colors", !n.is_read ? 'bg-indigo-50/50' : 'hover:bg-slate-50')}>
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", !n.is_read ? 'bg-indigo-600' : 'bg-slate-200')} />
                      <div>
                        <p className="text-sm font-black text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-slate-300 mt-1 font-bold uppercase tracking-wider">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                   </div>
                 ))}
                 {notifications.length === 0 && <div className="p-10 text-center text-slate-400 font-bold italic text-sm">No notifications found</div>}
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