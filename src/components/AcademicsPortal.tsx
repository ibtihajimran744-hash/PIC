import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, TrendingUp,
  Calendar, Megaphone, Mail, LogOut, RefreshCw, X, Plus,
  Search, Trash2, ChevronRight, CheckCircle, AlertCircle,
  Clock, BookMarked, BarChart2, FileText, Send, Eye,
  Menu, Bell, Save, Upload, FileUp, Sparkles, Database, Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../services/supabase';
import { AcademicSession, AcademicProgram, AcademicSubject, AcademicResource, SchemeEntry, AcademicQuiz, QuizResult } from '../services/academicManagement';
import toast, { Toaster } from 'react-hot-toast';

const FileImage = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

interface Props {
  onLogout?: () => void;
  onBack?: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const ACCENT  = '#059669';
const GRADIENT = 'linear-gradient(135deg,#059669,#10b981)';

const PROGRAMS = ['FSC Pre-Medical','FSC Pre-Engineering','ICS Physics','ICS Statistics','I.Com','FA General','FA IT'];

type Tab = 'dashboard'|'scheme'|'timetable'|'reports'|'announcements'|'messages'|'teachers'|'classes'|'students'|'exams'|'programs'|'tracking';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'scheme',    label: 'Scheme of Study',icon: BookMarked },
  { id: 'timetable', label: 'Timetable',      icon: Calendar },
  { id: 'reports',   label: 'SOS Reports',    icon: BarChart2 },
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
  const [classes,        setClasses]        = useState<any[]>([]);
  const [teacherProfs,   setTeacherProfs]   = useState<any[]>([]);
  const [students,       setStudents]       = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [timetable,      setTimetable]      = useState<any[]>([]);
  const [topicSubject, setTopicSubject] = useState('');
  const [topicProgram, setTopicProgram] = useState('ICS');
  const [topicExcelRows, setTopicExcelRows] = useState<any[]>([
    { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
    { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
    { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
    { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
    { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' }
  ]);
  const [ttProgramId, setTtProgramId] = useState('');
  const [ttGenderGroup, setTtGenderGroup] = useState('Girls-I');
  const [ttExcelRows, setTtExcelRows] = useState<any[]>([
    { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '08:00', to_time: '08:45' },
    { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '08:45', to_time: '09:30' },
    { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '09:30', to_time: '10:15' },
    { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '10:15', to_time: '11:00' },
    { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '11:00', to_time: '11:45' }
  ]);
  const [editTtForm, setEditTtForm] = useState<any>(null);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [messages,       setMessages]       = useState<any[]>([]);
  const [grades,         setGrades]         = useState<any[]>([]);
  const [attendance,     setAttendance]     = useState<any[]>([]);
  const [examSchedules,  setExamSchedules]  = useState<any[]>([]);
  const [sosFeedbacks,   setSosFeedbacks]   = useState<any[]>([]);
  const [dailyQuizzes,   setDailyQuizzes]   = useState<any[]>([]);
  const [quizAttempts,   setQuizAttempts]   = useState<any[]>([]);

  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessions,       setSessions]       = useState<any[]>([]);
  const [notices,        setNotices]        = useState<any[]>([]);
  const [activePrograms, setActivePrograms] = useState<any[]>([]);
  const [allSubjects,    setAllSubjects]    = useState<any[]>([]);
  const [quizAnalytics,  setQuizAnalytics]  = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Import Scheme of Study state variables
  const [importSubject, setImportSubject] = useState('');
  const [importProgram, setImportProgram] = useState(PROGRAMS[0] || 'FSC Pre-Medical');
  const [importRows, setImportRows] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  const SUBJECTS_17 = [
    'Physics','Chemistry','Biology','Mathematics','Computer Science',
    'Statistics','English','Urdu','Islamiyat','Pakistan Studies',
    'Education','Civics','Economics','Commerce','Accounting',
    'Principles of Commerce','Sociology'
  ];

  const [schemeForm, setSchemeForm] = useState<any>({
    subject: '', book_name: '', author: '', teacher_name: '', department: '',
    program: 'ICS Physics', part: 1, class_section: '',
    date: '', day: '', lecture_no: '', topic: '', description: '',
    uploaded_by: '', is_leave: false, leave_reason: '', month: '',
  });
  const [announceForm, setAnnounceForm] = useState<any>({
    title: '', body: '', target_type: 'all', target_value: '', priority: 'Normal', expires_at: '',
  });
  const [msgForm, setMsgForm] = useState<any>({
    to_teacher_username: '', subject: '', body: '',
  });
  const [teacherForm, setTeacherForm] = useState<any>({
    full_name: '', subject_dept: '', phone_no: '', email: '', employee_id: '', monthly_salary: 0, status: 'Active', assigned_classes: ''
  });
  const [classForm, setClassForm] = useState<any>({
    class_name: '', department: '', academic_year: '2026-27'
  });
  const [scheduleForm, setScheduleForm] = useState<any>({
    title: '', program: 'ICS Physics', session: '2026-27', part: 1, class_section: '', exam_type: 'Mid-Term',
    exams: [{ subject: '', date: '', time: '' }]
  });
  const [schemeFilter, setSchemeFilter] = useState({ program: '', part: '', subject: '' });

  const showToast = (msg: string, ok = true) => {
    if (ok) toast.success(msg);
    else toast.error(msg);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: sc }, { data: tc }, { data: tp }, { data: st }, { data: cp }, 
      { data: tt }, { data: an }, { data: ms }, { data: gr }, { data: at }, 
      { data: exS }, { data: cls }, { data: sess }, { data: progs }, { data: subjs },
      { data: qrzReg }, { data: sosF }, { data: dq }, { data: qa }, { data: nRes }
    ] = await Promise.all([
      supabase.from('scheme_of_study').select('*').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('full_name'),
      supabase.from('teacher_profiles').select('*').order('full_name'),
      supabase.from('students').select('roll_no,full_name,class_section,program,part,status,total_xp,current_badge,profile_xp').neq('status', 'Deleted').order('roll_no'),
      supabase.from('student_course_progress').select('*').order('last_updated', { ascending: false }),
      supabase.from('timetable').select('*').order('start_time').limit(200),
      supabase.from('academic_announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('teacher_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('grades').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('attendance').select('student_roll,status,date').order('date', { ascending: false }).limit(500),
      supabase.from('exam_schedule').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('classes').select('*').order('class_name'),
      supabase.from('academic_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('academic_programs').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('quiz_results').select('*'),
      supabase.from('sos_feedback').select('*').order('feedback_date', { ascending: false }),
      supabase.from('daily_quizzes').select('*').order('quiz_date', { ascending: false }),
      supabase.from('quiz_attempts').select('*').order('completed_at', { ascending: false }),
      supabase.from('uploaded_documents').select('*').or(`visible_to.cs.{Academics},visible_to.cs.{All}`).eq('is_active', true).order('created_at', { ascending: false }).limit(6)
    ]);
    setSchemes(sc || []); setTeachers(tc || []); setTeacherProfs(tp || []);
    setStudents(st || []); setCourseProgress(cp || []); setTimetable(tt || []);
    setAnnouncements(an || []); setMessages(ms || []); setGrades(gr || []); setAttendance(at || []);
    setExamSchedules(exS || []); setClasses(cls || []);
    setSessions(sess || []); setActivePrograms(progs || []); setAllSubjects(subjs || []);
    setSosFeedbacks(sosF || []); setDailyQuizzes(dq || []); setQuizAttempts(qa || []);
    setNotices(nRes || []);
    
    const active = sess?.find(s => s.is_active);
    setActiveSession(active);

    // Calculate quiz analytics
    if (qrzReg && qrzReg.length > 0) {
      const avg = qrzReg.reduce((acc: any, curr: any) => acc + (curr.score / (curr.total || 5)), 0) / qrzReg.length;
      setQuizAnalytics({ avg_score: (avg * 100).toFixed(1), total_attempts: qrzReg.length });
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const [ttForm, setTtForm] = useState({
    session_id: '', program_id: '', subject_id: '', teacher_id: '',
    day_of_week: 'Monday', start_time: '08:00', end_time: '08:40',
    class_section: '', room: '', campus: 'Main',
    gender_group: 'Girls-I',  // matches Summer Camp format (Girls-I / Boys-I)
  });

  const saveScheduleEntry = async () => {
    if (!ttForm.subject_id || !ttForm.teacher_id || !ttForm.class_section) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const subj = allSubjects.find(s => String(s.id) === String(ttForm.subject_id));
      const teacherObj = teachers.find(t => String(t.id) === String(ttForm.teacher_id));

      const { error } = await supabase.from('timetable').insert([{
        teacher_id: ttForm.teacher_id,
        day_of_week: ttForm.day_of_week,
        start_time: ttForm.start_time,
        end_time: ttForm.end_time,
        class_section: ttForm.class_section,
        room: ttForm.room,
        campus: ttForm.campus,
        gender_group: ttForm.gender_group,
        program: activePrograms.find(p => String(p.id) === String(ttForm.program_id))?.name || '',
        subject: subj?.name || '',
        teacher_name: teacherObj?.full_name || null,
        period_number: 1,
      }]);
      if (error) throw error;

      // Notify the assigned teacher
      if (teacherObj?.username) {
        await supabase.from('teacher_messages').insert([{
          from_user: adminData.username,
          from_role: adminData.role,
          to_teacher_username: teacherObj.username,
          subject: `🗓️ Timetable Updated: ${subj?.name}`,
          body: `You have been assigned "${subj?.name}" for ${ttForm.class_section} (${ttForm.gender_group}) on ${ttForm.day_of_week}s from ${ttForm.start_time} to ${ttForm.end_time}. Please check your schedule in the Teacher Portal.`,
          is_read: false,
        }]);
      }

      toast.success('Schedule entry added' + (teacherObj ? ' & teacher notified' : ''));
      setModal(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  const [programForm, setProgramForm] = useState({ name: '', session_id: '' });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjForm,    setSubjForm]    = useState({ name: '', program_id: '', teacher_id: '' });

  const saveProgram = async () => {
    if (!programForm.name || !programForm.session_id) { showToast('Name and Session required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('academic_programs').insert([programForm]);
      if (error) throw error;
      showToast('New program defined');
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveSubject = async (progId?: string) => {
    const targetProgId = progId || subjForm.program_id;
    const targetName = progId ? prompt('Subject Name:') : subjForm.name;
    if (!targetName || !targetProgId) { showToast('Name and Program required', false); return; }
    
    setSaving(true);
    try {
      const teacherId = progId ? prompt('Assign Teacher ID (optional):') : subjForm.teacher_id;
      const { error } = await supabase.from('subjects').insert([{ 
        name: targetName, 
        program_id: targetProgId, 
        teacher_id: teacherId || null 
      }]);
      if (error) throw error;
      showToast('Subject added');
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const saveScheme = async () => {
    if (!schemeForm.subject || !schemeForm.topic) {
      showToast('Subject and topic are required', false); return;
    }
    setSaving(true);
    try {
      // Build the teacher lookup to get their id
      const matchedTeacher = teachers.find(t =>
        t.full_name?.toLowerCase() === schemeForm.teacher_name?.toLowerCase()
      );

      const payload: any = {
        title: schemeForm.subject + ' SOS',
        subject: schemeForm.subject,
        program: schemeForm.program,
        part: Number(schemeForm.part),
        class_section: schemeForm.class_section,
        week_no: schemeForm.lecture_no ? Number(schemeForm.lecture_no) : null,
        lecture_number: schemeForm.lecture_no ? Number(schemeForm.lecture_no) : null,
        month: schemeForm.month || null,
        topic: schemeForm.is_leave ? `LEAVE DAY${schemeForm.leave_reason ? ': ' + schemeForm.leave_reason : ''}` : schemeForm.topic,
        description: schemeForm.date
          ? `${schemeForm.date} (${schemeForm.day || ''}) | Lecture ${schemeForm.lecture_no || '—'}`
          : schemeForm.description || null,
        uploaded_by: schemeForm.teacher_name || adminData.full_name,
        teacher_id: matchedTeacher?.id || null,
        scheduled_date: schemeForm.date || null,
        is_delivered: false,
        is_skipped: false,
        is_leave: schemeForm.is_leave || false,
        leave_reason: schemeForm.leave_reason || null,
      };

      const { error } = await supabase.from('scheme_of_study').insert([payload]);
      if (error) throw error;

      // Notify the matched teacher if found
      if (matchedTeacher?.username) {
        await supabase.from('teacher_messages').insert([{
          from_user: adminData.username,
          from_role: adminData.role,
          to_teacher_username: matchedTeacher.username,
          subject: `📅 SOS Update: ${schemeForm.subject}`,
          body: schemeForm.is_leave
            ? `A leave day has been recorded on ${schemeForm.date} (${schemeForm.day}). Reason: ${schemeForm.leave_reason || 'Not specified'}.`
            : `New topic added to your scheme: "${schemeForm.topic}" scheduled for ${schemeForm.date} (${schemeForm.day}), Lecture #${schemeForm.lecture_no}.`,
          is_read: false,
        }]);
      }

      showToast('SOS entry saved' + (matchedTeacher ? ' & teacher notified' : ''));
      setSchemeForm({
        subject: '', book_name: '', author: '', teacher_name: '', department: '',
        program: 'ICS Physics', part: 1, class_section: '',
        date: '', day: '', lecture_no: '', topic: '', description: '',
        uploaded_by: '', is_leave: false, leave_reason: '', month: '',
      });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const handleSchemeFileSelected = (file: File) => {
    if (!file) return;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      showToast('Unsupported file format. Please upload .xlsx, .xls, or .csv', false);
      return;
    }

    setImportFileName(file.name);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setUploadProgress(30);
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        setUploadProgress(50);

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setUploadProgress(70);

        const isDecorative = (rowStr: string) => {
          const l = rowStr.toLowerCase();
          return (
            l.includes('signature') ||
            l.includes('approved by') ||
            l.includes('campus') ||
            l.includes('department of') ||
            l.includes('prepared by') ||
            l.includes('director') ||
            l.includes('office use') ||
            l.includes('academic head') ||
            l.includes('verification') ||
            l.includes('teacher name') ||
            l.includes('department information')
          );
        };

        const getFormattedDate = (val: any) => {
          if (!val) return '';
          if (typeof val === 'number') {
            try {
              const dateObj = new Date((val - 25569) * 86400 * 1000);
              if (!isNaN(dateObj.getTime())) {
                return dateObj.toISOString().split('T')[0];
              }
            } catch (err) {}
          }
          const str = String(val).trim();
          try {
            const dateObj = new Date(str);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.toISOString().split('T')[0];
            }
          } catch (err) {}
          return str;
        };

        const parseLectureNumber = (val: any) => {
          if (val === undefined || val === null) return null;
          const num = parseInt(String(val).replace(/[^\d]/g, ''), 10);
          return isNaN(num) ? null : num;
        };

        let headerRowIndex = -1;
        let colMap = { date: -1, day: -1, lecture: -1, topic: -1 };

        for (let r = 0; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;
          let matches = 0;
          let tempMap = { date: -1, day: -1, lecture: -1, topic: -1 };
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').toLowerCase().trim();
            if (val.includes('date')) { tempMap.date = c; matches++; }
            else if (val.includes('day')) { tempMap.day = c; matches++; }
            else if (val.includes('lecture') || val.includes('lec') || val.includes('lect')) { tempMap.lecture = c; matches++; }
            else if (val.includes('topic') || val.includes('chapter') || val.includes('syllabus') || val.includes('scheme')) { tempMap.topic = c; matches++; }
          }
          if (matches >= 2) {
            headerRowIndex = r;
            colMap = tempMap;
            break;
          }
        }

        if (headerRowIndex === -1) {
          colMap = { date: 0, day: 1, lecture: 2, topic: 3 };
          headerRowIndex = 0;
        }

        const parsedEntries: any[] = [];
        const startRow = headerRowIndex + 1;

        for (let r = startRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          const rowTextJoin = row.map(cell => String(cell || '')).join(' ');
          if (rowTextJoin.trim() === '') continue;
          if (isDecorative(rowTextJoin)) continue;

          const dateVal = colMap.date !== -1 && colMap.date < row.length ? getFormattedDate(row[colMap.date]) : '';
          const dayVal = colMap.day !== -1 && colMap.day < row.length ? String(row[colMap.day] || '').trim() : '';
          const lectureVal = colMap.lecture !== -1 && colMap.lecture < row.length ? parseLectureNumber(row[colMap.lecture]) : null;
          const topicVal = colMap.topic !== -1 && colMap.topic < row.length ? String(row[colMap.topic] || '').trim() : '';

          if (!dateVal && !dayVal && !lectureVal && !topicVal) continue;

          parsedEntries.push({
            id: `import-${r}`,
            date: dateVal,
            day: dayVal,
            lectureNo: lectureVal,
            topic: topicVal
          });
        }

        const lectureNumbers = parsedEntries.map(e => e.lectureNo).filter(l => l !== null);
        const validated = parsedEntries.map(entry => {
          const isMissingDate = !entry.date;
          const isMissingTopic = !entry.topic;
          const isDuplicateLecture = entry.lectureNo !== null && 
            lectureNumbers.filter(l => l === entry.lectureNo).length > 1;
          const hasError = isMissingDate || isMissingTopic;
          
          return {
            ...entry,
            isMissingDate,
            isMissingTopic,
            isDuplicateLecture,
            hasError
          };
        });

        setImportRows(validated);
        setUploadProgress(100);
        showToast(`Parsed ${validated.length} rows successfully!`);
      } catch (err: any) {
        setUploadProgress(0);
        setImportFileName('');
        showToast('Error parsing file: ' + err.message, false);
      }
    };

    reader.onerror = () => {
      setUploadProgress(0);
      setImportFileName('');
      showToast('Error reading file contents', false);
    };

    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSchemeFileSelected(file);
    }
  };

  const executeSchemeImport = async () => {
    if (!importSubject) {
      showToast('Please select a Target Subject first', false);
      return;
    }
    if (importRows.length === 0) {
      showToast('Please upload an Excel or CSV file first', false);
      return;
    }

    const validRows = importRows.filter(r => !r.hasError);
    if (validRows.length === 0) {
      showToast('No valid rows available to import. Highlighted rows contain errors.', false);
      return;
    }

    setSaving(true);
    setLoading(true);

    const payload = {
      subject: importSubject,
      scheme: validRows.map(r => ({
        date: r.date || '',
        day: r.day || '',
        lectureNumber: r.lectureNo !== null ? Number(r.lectureNo) : 0,
        topic: r.topic || ''
      }))
    };

    try {
      // 1. POST JSON payload to backend API as required
      try {
        await fetch('/api/import-scheme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (apiErr) {
        console.warn('API route not listening/available, continuing with database import.', apiErr);
      }

      // 2. Perform direct insert into Supabase for real persistence and reactivity
      const sosRows = validRows.map((r, idx) => {
        let finalDescription = `Imported from ${importFileName || 'Excel file'}`;
        if (r.date) {
          finalDescription = `${r.date}${r.day ? ' (' + r.day + ')' : ''} | Lecture #${r.lectureNo || idx + 1}`;
        }
        return {
          title: `${importSubject} SOS`,
          subject: importSubject,
          topic: r.topic,
          uploaded_by: adminData.full_name,
          lecture_number: r.lectureNo ? Number(r.lectureNo) : idx + 1,
          part: 1, 
          class_section: null,
          program: importProgram,
          description: finalDescription,
          week_no: r.lectureNo ? Number(r.lectureNo) : idx + 1,
          status: 'Pending',
          scheduled_date: r.date || null,
          day: r.day || null,
        };
      });

      const { error: insertErr } = await supabase.from('scheme_of_study').insert(sosRows);
      if (insertErr) throw insertErr;

      showToast(`Successfully imported ${validRows.length} scheme topics!`);
      
      // Cleanup states and reload
      setModal(null);
      setImportRows([]);
      setImportFileName('');
      setUploadProgress(0);
      loadAll();
    } catch (err: any) {
      showToast('Error importing scheme: ' + err.message, false);
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const saveTopicExcelSheet = async () => {
    if (!topicSubject) {
      showToast('Please choose a subject first', false);
      return;
    }
    const filledRows = topicExcelRows.filter((r: any) => r.topicName.trim() && r.teacherName.trim());
    if (filledRows.length === 0) {
      showToast('Please fill at least one row with Topic Name and Teacher Name', false);
      return;
    }

    setSaving(true);
    try {
      const sosRows = filledRows.map((r: any, idx: number) => {
        const matchedTeacherObj = teachers.find(t => 
          t.full_name?.toLowerCase().trim() === r.teacherName.toLowerCase().trim()
        );
        let finalDescription = r.syllabus || `Imported via Academic Spreadsheet Editor`;
        if (r.date) {
          finalDescription = `${r.date}${r.day ? ' (' + r.day + ')' : ''} | Syllabus: ${r.syllabus || r.topicName}`;
        }
        return {
          title: `${topicSubject} SOS`,
          subject: topicSubject,
          topic: r.topicName,
          teacher_name: r.teacherName,
          part: Number(r.part) || 1,
          class_section: r.section || null,
          program: topicProgram,
          description: finalDescription,
          lecture_no: r.lectureNo ? Number(r.lectureNo) : idx + 1,
          week_no: r.lectureNo ? Number(r.lectureNo) : idx + 1,
          status: 'Pending',
          teacher_id: matchedTeacherObj?.id || null,
          scheduled_date: r.date || null,
          day: r.day || null,
        };
      });

      const { error } = await supabase.from('scheme_of_study').insert(sosRows);
      if (error) throw error;

      // Send roadmaps to teacher portals via notifications for each unique teacher
      const uniqueTeachers = [...new Set(filledRows.map((r: any) => r.teacherName.trim()))];
      for (const teacher of uniqueTeachers) {
        await supabase.from('notifications').insert([{
          target_role: 'TEACHER',
          title: `📅 New Roadmap: ${topicSubject}`,
          message: `Academics has assigned a new Roadmap / Scheme of Study for ${topicSubject} with ${filledRows.filter((r: any) => r.teacherName === teacher).length} topics.`,
          type: 'sos_update'
        }]);
      }

      showToast(`Successfully uploaded ${sosRows.length} topics!`);
      setModal(null);
      // Reset sheet with expanded schema fields
      setTopicExcelRows([
        { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
        { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
        { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
        { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' },
        { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' }
      ]);
      loadAll();
    } catch (e: any) {
      showToast('Failed to save topics: ' + e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const saveTimetableExcelSheet = async () => {
    if (!ttProgramId) {
      showToast('Please select a program first', false);
      return;
    }
    const filledRows = ttExcelRows.filter((r: any) => r.subject.trim() && r.teacher.trim() && r.section.trim());
    if (filledRows.length === 0) {
      showToast('Please fill at least one row with Subject, Teacher, and Section', false);
      return;
    }

    setSaving(true);
    try {
      const selectedProgName = activePrograms.find(p => String(p.id) === String(ttProgramId))?.name || 'ICS';

      const ttRows = filledRows.map((r: any) => {
        const matchedTeacherObj = teachers.find(t => 
          t.full_name?.toLowerCase().trim() === r.teacher.toLowerCase().trim()
        );
        return {
          teacher_id: matchedTeacherObj?.id || teachers[0]?.id || 1,
          day_of_week: r.day || 'Monday',
          start_time: r.from_time || '08:00',
          end_time: r.to_time || '08:45',
          class_section: r.section,
          room: r.room || '101',
          gender_group: ttGenderGroup,
          program: selectedProgName,
          subject: r.subject,
          teacher_name: matchedTeacherObj?.full_name || r.teacher,
          period_number: 1,
        };
      });

      const { error } = await supabase.from('timetable').insert(ttRows);
      if (error) throw error;

      for (const row of ttRows) {
        const tObj = teachers.find(t => String(t.id) === String(row.teacher_id));
        if (tObj?.username) {
          await supabase.from('teacher_messages').insert([{
            from_user: adminData.username,
            from_role: adminData.role,
            to_teacher_username: tObj.username,
            subject: `🗓️ Timetable Updated: ${row.subject}`,
            body: `You have been assigned "${row.subject}" for ${row.class_section} (${row.gender_group}) on ${row.day_of_week}s from ${row.start_time} to ${row.end_time}. Please check your schedule in the Teacher Portal.`,
            is_read: false,
          }]);
        }
      }

      showToast(`Successfully uploaded ${ttRows.length} timetable entries!`);
      setModal(null);
      // Reset sheet
      setTtExcelRows([
        { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '08:00', to_time: '08:45' },
        { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '08:45', to_time: '09:30' },
        { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '09:30', to_time: '10:15' },
        { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '10:15', to_time: '11:00' },
        { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '11:00', to_time: '11:45' }
      ]);
      loadAll();
    } catch (e: any) {
      showToast('Failed to save timetable entries: ' + e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const saveSingleTimetableEntry = async () => {
    if (!editTtForm.subject || !editTtForm.class_section) {
      showToast('Subject and Class Section are required', false);
      return;
    }
    setSaving(true);
    try {
      const matchedTeacherObj = teachers.find(t => 
        String(t.id) === String(editTtForm.teacher_id) || t.full_name?.toLowerCase().trim() === editTtForm.teacher_name?.toLowerCase().trim()
      );
      const updatePayload = {
        subject: editTtForm.subject,
        class_section: editTtForm.class_section,
        day_of_week: editTtForm.day_of_week,
        start_time: editTtForm.start_time,
        end_time: editTtForm.end_time,
        room: editTtForm.room || '101',
        gender_group: editTtForm.gender_group || 'Girls-I',
        program: editTtForm.program || 'ICS',
        teacher_id: matchedTeacherObj?.id || editTtForm.teacher_id,
        teacher_name: matchedTeacherObj?.full_name || editTtForm.teacher_name,
      };

      const { error } = await supabase.from('timetable').update(updatePayload).eq('id', editTtForm.id);
      if (error) throw error;

      showToast('Timetable entry updated successfully');
      setEditTtForm(null);
      loadAll();
    } catch (e: any) {
      showToast('Failed to update timetable: ' + e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const deleteTimetableEntry = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) return;
    try {
      const { error } = await supabase.from('timetable').delete().eq('id', id);
      if (error) throw error;
      showToast('Timetable entry deleted successfully');
      loadAll();
    } catch (e: any) {
      showToast('Failed to delete timetable entry: ' + e.message, false);
    }
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

  const saveExamSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.exams.length) {
      showToast('Title and at least one exam required', false); return;
    }
    const invalid = scheduleForm.exams.some((e: any) => !e.subject || !e.date || !e.time);
    if (invalid) { showToast('Complete all exam details (Subject, Date, Time)', false); return; }

    setSaving(true);
    try {
      // 1. Save Schedule Header
      const { data: sched, error: sErr } = await supabase.from('exam_schedule').insert([{
        title: scheduleForm.title,
        program: scheduleForm.program,
        session: scheduleForm.session,
        part: Number(scheduleForm.part),
        class_section: scheduleForm.class_section,
        exam_type: scheduleForm.exam_type,
        start_date: scheduleForm.exams[0].date,
        end_date: scheduleForm.exams[scheduleForm.exams.length - 1].date,
        status: 'Upcoming',
        created_by: adminData.full_name
      }]).select().single();

      if (sErr) throw sErr;

      // 2. Automatically create individual Exam entries for Examiner Portal
      const examRows = scheduleForm.exams.map((e: any) => ({
        exam_schedule_id: sched.id,
        title: `${scheduleForm.exam_type}: ${e.subject}`,
        class_section: scheduleForm.class_section,
        subject: e.subject,
        date: e.date,
        time: e.time,
        exam_type: scheduleForm.exam_type,
        total_marks: 100,
        grading_status: 'Pending',
        created_by: adminData.full_name
      }));

      const { error: eErr } = await supabase.from('exams').insert(examRows);
      if (eErr) throw eErr;

      showToast('Exam schedule and unit exams published');
      setScheduleForm({ title: '', program: 'ICS Physics', session: '2026-27', part: 1, class_section: '', exam_type: 'Mid-Term', exams: [{ subject: '', date: '', time: '' }] });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteSchedule = async (id: number) => {
    if (!window.confirm('Delete this entire schedule and linked exams?')) return;
    await supabase.from('exams').delete().eq('exam_schedule_id', id);
    await supabase.from('exam_schedule').delete().eq('id', id);
    showToast('Schedule deleted'); loadAll();
  };

  const saveTeacher = async () => {
    if (!teacherForm.full_name || !teacherForm.employee_id) {
      showToast('Name and Employee ID are required', false); return;
    }
    setSaving(true);
    try {
      const payload = { ...teacherForm, monthly_salary: Number(teacherForm.monthly_salary) };
      const { error } = selectedTeacher ? 
        await supabase.from('teachers').update(payload).eq('id', selectedTeacher.id) :
        await supabase.from('teachers').insert([payload]);
      
      if (error) throw error;
      showToast(selectedTeacher ? 'Teacher updated' : 'Teacher added');
      setTeacherForm({ full_name: '', subject_dept: '', phone_no: '', email: '', employee_id: '', monthly_salary: 0, status: 'Active', assigned_classes: '' });
      setModal(null); setSelectedTeacher(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteTeacher = async (id: number) => {
    if (!window.confirm('Delete this teacher? This will affect salary and assignments.')) return;
    await supabase.from('teachers').delete().eq('id', id);
    showToast('Teacher deleted'); loadAll();
  };

  const saveClass = async () => {
    if (!classForm.class_name) { showToast('Class name required', false); return; }
    setSaving(true);
    try {
      const { error } = selectedTeacher ? // reuse select state for edit? No let's use a temp one or null
        await supabase.from('classes').update(classForm).eq('id', classForm.id) :
        await supabase.from('classes').insert([classForm]);
      
      if (error) throw error;
      showToast('Class saved');
      setClassForm({ class_name: '', department: '', academic_year: '2026-27' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteClass = async (id: number) => {
    if (!window.confirm('Remove this class?')) return;
    await supabase.from('classes').delete().eq('id', id);
    showToast('Class deleted'); loadAll();
  };

  const handleMasterExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Helper to extract a value from a row using fuzzy case-insensitive match on keys
        const getFuzzyVal = (row: any, keywords: string[], defaultValue: any = '') => {
          const keys = Object.keys(row);
          // Try exact normalized match first
          for (const kw of keywords) {
            const normKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const key of keys) {
              const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normKey === normKw) {
                return row[key];
              }
            }
          }
          // Try sub-string or starts-with match next
          for (const kw of keywords) {
            const normKw = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const key of keys) {
              const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normKey.includes(normKw) || normKw.includes(normKey)) {
                return row[key];
              }
            }
          }
          return defaultValue;
        };

        const getRowsFromSheet = (sheet: any): any[] => {
          if (!sheet) return [];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          if (rawRows.length === 0) return [];
          
          let headerIndex = 0;
          let maxMatches = 0;
          const headerKeywords = ['topic', 'subject', 'class', 'section', 'lesson', 'chapter', 'day', 'time', 'start', 'end'];
          
          for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
            const row = rawRows[i];
            if (!row || !Array.isArray(row)) continue;
            let matches = 0;
            row.forEach(cell => {
              const s = String(cell || '').toLowerCase();
              if (headerKeywords.some(kw => s.includes(kw))) {
                matches++;
              }
            });
            if (matches > maxMatches) {
              maxMatches = matches;
              headerIndex = i;
            }
          }
          
          if (maxMatches > 0) {
            const headers = rawRows[headerIndex].map(h => String(h || '').trim());
            const objects: any[] = [];
            for (let j = headerIndex + 1; j < rawRows.length; j++) {
              const rowValues = rawRows[j];
              if (!rowValues || rowValues.length === 0) continue;
              if (rowValues.every(val => val === null || val === undefined || String(val).trim() === '')) continue;
              
              const obj: any = {};
              headers.forEach((header, index) => {
                if (header) {
                  obj[header] = rowValues[index];
                }
              });
              objects.push(obj);
            }
            return objects;
          }
          
          return XLSX.utils.sheet_to_json(sheet);
        };

        // Determine fallback subject from file name or sheet names
        let fileSubject = '';
        const nameToCheck = (file.name + ' ' + wb.SheetNames.join(' ')).toLowerCase();
        for (const s of allSubjects) {
          if (s.name && nameToCheck.includes(s.name.toLowerCase())) {
            fileSubject = s.name;
            break;
          }
        }
        if (!fileSubject && (nameToCheck.includes('civic') || nameToCheck.includes('sos'))) {
          fileSubject = 'Civics';
        }

        // 1. Parse SOS Sheet
        const sosSheet = wb.Sheets['SOS'] || wb.Sheets[wb.SheetNames[0]];
        const sosData = sosSheet ? getRowsFromSheet(sosSheet) : [] as any[];
        
        // 2. Parse Timetable Sheet
        const ttSheet = wb.Sheets['Timetable'] || wb.Sheets[wb.SheetNames[1]];
        const ttData = ttSheet ? getRowsFromSheet(ttSheet) : [] as any[];

        if (sosData.length === 0 && ttData.length === 0) {
          throw new Error('No data found in SOS or Timetable sheets. Please ensure sheet names are "SOS" and "Timetable".');
        }

        // --- Process SOS ---
        if (sosData.length > 0) {
          const sosRows = sosData.map((row: any) => {
            let subj = String(getFuzzyVal(row, ['subject', 'course', 'subjectname', 'subject_name'], fileSubject || 'Civics')).trim();
            if (!subj || subj.toLowerCase() === 'unknown' || subj.toLowerCase() === 'undefined') {
              subj = fileSubject || 'Civics';
            }
            const teacherStr = String(getFuzzyVal(row, ['teacher', 'instructor', 'lecturer', 'faculty', 'teachername', 'teacher_name'], '')).trim();
            const matchedTeacher = teachers.find(t => 
              t.full_name?.toLowerCase().includes(teacherStr.toLowerCase()) ||
              teacherStr.toLowerCase().includes(t.full_name?.toLowerCase())
            );
            
            // Comprehensive topic extractor
            let topic = '';
            const topicKeys = [
              'topic', 'lesson', 'chapter', 'content', 'title', 'heading', 'syllabus', 
              'breakup', 'particular', 'topics', 'lessons', 'chapters', 'contents', 
              'syllabus covered', 'topic name', 'topic_name', 'lessons covered', 'task', 
              'activity', 'course content', 'course contents', 'lecture topic', 'lecture topics',
              'syllabus outline', 'outline', 'detail', 'details', 'description', 'particulars'
            ];
            const rawTopic = getFuzzyVal(row, topicKeys, '');
            if (rawTopic && String(rawTopic).trim() !== '' && String(rawTopic).toLowerCase() !== 'unknown' && String(rawTopic).toLowerCase() !== 'undefined' && String(rawTopic) !== 'Untitled Topic') {
              topic = String(rawTopic).trim();
            }

            // Fallback: search key-values for the longest non-meta string
            if (!topic) {
              let candidate = '';
              for (const key of Object.keys(row)) {
                const val = String(row[key] || '').trim();
                if (val && isNaN(Number(val)) && val.length > 3) {
                  const lowerK = key.toLowerCase();
                  const lowerV = val.toLowerCase();
                  const skip = ['date', 'week', 'month', 'part', 'class', 'section', 'grade', 'teacher', 'instructor', 'subject', 'program', 'campus', 'leave', 'holiday', 'period'];
                  const isSkipKey = skip.some(sk => lowerK.includes(sk));
                  const isSkipVal = skip.some(sk => lowerV === sk) || lowerV.includes('monday') || lowerV.includes('tuesday') || lowerV.includes('wednesday') || lowerV.includes('thursday') || lowerV.includes('friday') || lowerV.includes('saturday') || lowerV.includes('sunday');
                  
                  if (!isSkipKey && !isSkipVal && val.length > candidate.length) {
                    candidate = val;
                  }
                }
              }
              if (candidate) {
                topic = candidate;
              }
            }

            if (!topic) {
              topic = 'Untitled Topic';
            }

            const prog = getFuzzyVal(row, ['program', 'discipline', 'course', 'dept'], 'General');
            const prt = Number(getFuzzyVal(row, ['part', 'year', 'classpart'], 1)) || 1;
            const cls = String(getFuzzyVal(row, ['class', 'section', 'classsection', 'class_section', 'grade'], '')).trim();
            const wk = Number(getFuzzyVal(row, ['week', 'weekno', 'week_no'], null)) || null;
            const mn = getFuzzyVal(row, ['month', 'monthly'], null);
            const dt = getFuzzyVal(row, ['date', 'scheduleddate', 'scheduled_date'], null);
            const lect = getFuzzyVal(row, ['lecture', 'period', 'lectureno', 'periodno'], '');
            const desc = getFuzzyVal(row, ['description', 'details', 'detail', 'info', 'remarks'], null);
            const isLv = !!getFuzzyVal(row, ['leave', 'isleave', 'holiday', 'offday'], false);

            return {
              title: `${subj} SOS`,
              subject: subj,
              program: prog,
              part: prt,
              class_section: cls,
              week_no: wk,
              lecture_number: lect ? Number(lect) : null,
              month: mn,
              topic: topic,
              description: dt ? `${dt} | Lecture ${lect || '—'}` : (desc || null),
              uploaded_by: adminData.full_name,
              teacher_id: matchedTeacher?.id || null,
              scheduled_date: dt || null,
              is_delivered: false,
              is_skipped: false,
              is_leave: isLv
            };
          });
          const { error: sosErr } = await supabase.from('scheme_of_study').insert(sosRows);
          if (sosErr) throw sosErr;
        }

        // --- Process Timetable ---
        if (ttData.length > 0) {
          const ttRows = ttData.map((row: any) => {
            const day = getFuzzyVal(row, ['day', 'dayofweek', 'weekday'], 'Monday');
            const start = getFuzzyVal(row, ['start', 'starttime', 'start_time', 'time'], '08:00');
            const end = getFuzzyVal(row, ['end', 'endtime', 'end_time', 'to_time'], '08:40');
            const cls = getFuzzyVal(row, ['class', 'section', 'classsection', 'class_section'], '');
            const rm = String(getFuzzyVal(row, ['room', 'roomno', 'room_no', 'class_room'], ''));
            const camp = getFuzzyVal(row, ['campus', 'college', 'wing'], 'Main');
            const ggStr = getFuzzyVal(row, ['gender', 'group', 'gendergroup', 'boysgirls'], 'Girls-I');
            const progInput = getFuzzyVal(row, ['program', 'stream', 'discipline'], '');
            const subjInput = getFuzzyVal(row, ['subject', 'course', 'subjectname'], '');
            const teacherInput = getFuzzyVal(row, ['teacher', 'instructor', 'teachername', 'lecturer'], '');

            const subj = allSubjects.find(s => s.name?.toLowerCase().includes(String(subjInput || '').toLowerCase()));
            const teacherObj = teachers.find(t => t.full_name?.toLowerCase().includes(String(teacherInput || '').toLowerCase()));
            const prog = activePrograms.find(p => p.name?.toLowerCase().includes(String(progInput || '').toLowerCase()));

            return {
              day_of_week: day,
              start_time: start,
              end_time: end,
              class_section: cls,
              room: rm,
              campus: camp,
              gender_group: ggStr,
              program: prog?.name || progInput || '',
              subject: subj?.name || subjInput || '',
              teacher_name: teacherObj?.full_name || teacherInput || null,
              teacher_id: teacherObj?.id || null,
              period_number: Number(getFuzzyVal(row, ['period', 'periodno', 'period_number', 'lecture'], 1)) || 1
            };
          });
          const { error: ttErr } = await supabase.from('timetable').insert(ttRows);
          if (ttErr) throw ttErr;
        }

        showToast(`✅ Blueprint imported successfully!`);
        loadAll();
      } catch (err: any) {
        showToast(err.message || 'Error parsing Excel file', false);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(r => r.split(',').map(c => c.trim()));
      const header = rows[0];
      const data = rows.slice(1).filter(r => r.some(c => c !== ''));

      // Validate header
      const required = ['Exam Name', 'Class', 'Date', 'Time', 'Subject'];
      const missing = required.filter(h => !header.includes(h));
      if (missing.length) { showToast(`Missing header columns: ${missing.join(', ')}`, false); return; }

      // Map data
      const exams = data.map(r => {
        const obj: any = {};
        header.forEach((h, i) => { obj[h] = r[i]; });
        return obj;
      });

      // Simple validation
      const invalid = exams.some(ex => !ex['Exam Name'] || !ex['Class'] || !ex['Date'] || !ex['Time'] || !ex['Subject']);
      if (invalid) { showToast('Missing fields in some rows. Please check CSV.', false); return; }

      // Create schedules
      setSaving(true);
      try {
        const groupsByTitleClass = exams.reduce((acc: any, curr: any) => {
          const key = `${curr['Exam Name']}-${curr['Class']}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(curr);
          return acc;
        }, {});

        for (const key in groupsByTitleClass) {
          const group = groupsByTitleClass[key];
          const { data: sched, error: sErr } = await supabase.from('exam_schedule').insert([{
            title: group[0]['Exam Name'],
            class_section: group[0]['Class'],
            start_date: group[0]['Date'],
            end_date: group[group.length - 1]['Date'],
            status: 'Upcoming',
            created_by: adminData.full_name
          }]).select().single();
          if (sErr) throw sErr;

          const examRows = group.map((e: any) => ({
            exam_schedule_id: sched.id,
            title: `${e['Exam Name']}: ${e['Subject']}`,
            class_section: e['Class'],
            subject: e['Subject'],
            date: e['Date'],
            time: e['Time'],
            exam_type: 'Board/Internal',
            total_marks: 100,
            created_by: adminData.full_name
          }));
          await supabase.from('exams').insert(examRows);
        }
        showToast('Schedule uploaded successfully');
        loadAll();
      } catch (err: any) { showToast(err.message, false); }
      finally { setSaving(false); }
    };
    reader.readAsText(file);
  };

  const totalSchemes   = schemes.length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const totalStudents  = students.length;
  const unreadMessages = messages.filter(m => !m.is_read && m.from_role !== adminData.role).length;

  const getStudentStats = (roll: number) => {
    const student = students.find(s => s.roll_no === roll);
    const studentClass = student?.class_section;
    
    // Calculate CP dynamically based on student's class and SOS
    const studentSchemes = schemes.filter(s => s.class_section === studentClass);
    const uniqueSubjects = [...new Set(studentSchemes.map(s => s.subject))];
    
    const cp = uniqueSubjects.map((sub, idx) => {
      const subSchemes = studentSchemes.filter(s => s.subject === sub);
      const done = subSchemes.filter(s => s.status === 'Completed').length;
      const total = subSchemes.length;
      return {
        id: `cp-${idx}`,
        subject: sub,
        topics_done: done,
        topics_total: total,
        progress_pct: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });

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
    dashboard: 'Dashboard',
    scheme: 'Scheme of Study',
    timetable: 'Timetable',
    reports: 'SOS Reports',
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
            <input type="file" id="master-excel-up" className="hidden" accept=".xlsx,.xls" onChange={handleMasterExcelUpload} />
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
                      { l: 'Programs',         v: activePrograms.length },
                      { l: 'Total Students',   v: totalStudents },
                      { l: 'Teachers',         v: activeTeachers },
                      { l: 'Avg Quiz Score',   v: quizAnalytics ? `${quizAnalytics.avg_score}%` : '—' },
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
                  <StatCard label="Total Programs"    value={activePrograms.length} sub={`${allSubjects.length} subjects total`} color={ACCENT}   icon={BookOpen} />
                  <StatCard label="Quiz Attempts"    value={quizAnalytics?.total_attempts || 0} sub="Participated students"   color="#0891B2" icon={CheckCircle} />
                  <StatCard label="Scheme Entries"    value={totalSchemes}   sub={`${[...new Set(schemes.map(s => s.subject))].length} subjects`} color="#7C3AED" icon={BookMarked} />
                  <StatCard 
                    label="Overall Progress"  
                    value={`${totalSchemes > 0 ? Math.round((schemes.filter(s => s.status === 'Completed').length / totalSchemes) * 100) : 0}%`} 
                    sub="Syllabus coverage (Student Verified)" 
                    color="#D97706" 
                    icon={TrendingUp} 
                  />
                </div>

                {/* Notices & Documents */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={16} className="text-emerald-600" /> Recent Notices & Documents
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notices.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" 
                        className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm hover:border-emerald-200 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-all">
                          {doc.file_type === 'pdf' ? <FileText size={22} /> : <FileImage size={22} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-sm truncate">{doc.title}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  {notices.length === 0 && <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-[2rem] border border-dashed border-slate-200">No recent notices found</div>}
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
                        { label: 'Session Setup',   icon: GraduationCap, action: () => setModal('session') },
                        { label: 'Bulk Blueprint',  icon: Database, action: () => document.getElementById('master-excel-up')?.click() },
                        { label: 'Upload Scheme',   icon: BookMarked, action: () => { setTab('scheme'); setModal('scheme'); } },
                        { label: 'Announcement',    icon: Megaphone,  action: () => { setTab('announcements'); setModal('announce'); } },
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
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                    setModal('import_scheme');
                    setImportRows([]);
                    setImportFileName('');
                    setUploadProgress(0);
                    setImportSubject('');
                  }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 whitespace-nowrap transition-all shadow-sm">
                    <FileUp size={15} className="text-emerald-600" /> Import Scheme
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

            {/* ══════════ CLASS MANAGEMENT ══════════ */}
            {tab === 'classes' && (
              <motion.div key="classes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black text-slate-800">Class Management</h2>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setClassForm({ class_name: '', department: '', academic_year: '2026-27' }); setModal('class'); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Plus size={15} /> Add New Class
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {classes.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-emerald-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                          <Users size={20} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setClassForm(c); setModal('class'); }} className="text-slate-300 hover:text-emerald-500"><Plus size={14} /></button>
                          <button onClick={() => deleteClass(c.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 className="font-black text-slate-900">{c.class_name}</h3>
                      <p className="text-xs text-slate-400">{c.department} · {c.academic_year}</p>
                    </div>
                  ))}
                </div>
                {!classes.length && <p className="text-center py-12 text-slate-400 text-sm">No classes created yet</p>}
              </motion.div>
            )}

            {/* ══════════ TEACHER MANAGEMENT ══════════ */}
            {tab === 'teachers' && (
              <motion.div key="teachers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black text-slate-800">Teacher Management</h2>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setTeacherForm({ full_name: '', subject_dept: '', phone_no: '', email: '', employee_id: '', monthly_salary: 0, status: 'Active' }); setSelectedTeacher(null); setModal('teacher'); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                    <Plus size={15} /> Add New Teacher
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teachers.map((t) => (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                          style={{ background: `hsl(${(t.full_name?.charCodeAt(0) || 50) * 37 % 360},60%,55%)` }}>
                          {t.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-slate-900 leading-tight">{t.full_name}</h3>
                          <p className="text-xs text-slate-400">{t.employee_id} · {t.subject_dept}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setTeacherForm(t); setSelectedTeacher(t); setModal('teacher'); }} className="text-slate-300 hover:text-emerald-500">
                             <Plus size={14} />
                           </button>
                           <button onClick={() => deleteTeacher(t.id)} className="text-slate-300 hover:text-rose-500">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg"><p className="text-slate-400">Salary</p><p className="font-black text-slate-700">Rs {t.monthly_salary}</p></div>
                        <div className="bg-slate-50 p-2 rounded-lg"><p className="text-slate-400">Status</p><p className="font-black text-emerald-600">{t.status}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* ══════════ TIMETABLE ══════════ */}
            {tab === 'timetable' && (
              <motion.div key="timetable" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by class, subject or teacher…"
                      className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 bg-white" />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('schedule_entry')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-emerald-500/20"
                    style={{ background: GRADIENT }}>
                    <Plus size={16} /> Add Schedule Entry
                  </motion.button>
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
                              {['Time','Class','Subject','Teacher','Room','Campus','Actions'].map(h => (
                                <th key={h} className={`px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
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
                                  <td className="px-4 py-1 text-center whitespace-nowrap">
                                    <button 
                                      onClick={() => setEditTtForm({ ...tt })}
                                      className="px-2 py-1 text-xs font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider transition-all mr-2"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => deleteTimetableEntry(tt.id)}
                                      className="px-2 py-1 text-xs font-black text-rose-600 hover:text-rose-800 uppercase tracking-wider transition-all"
                                    >
                                      Delete
                                    </button>
                                  </td>
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

            {/* ══════════ SOS & QUIZ REPORTS ══════════ */}
            {tab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SOS Feedback Summary */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><BarChart2 size={20} /></div>
                      <h3 className="font-black text-slate-800">SOS Execution Feedback</h3>
                    </div>
                    <div className="space-y-4">
                      {(() => {
                        const summary: Record<string, { taught: number, notTaught: number }> = {};
                        sosFeedbacks.forEach(f => {
                          if (!summary[f.subject]) summary[f.subject] = { taught: 0, notTaught: 0 };
                          if (f.was_taught) summary[f.subject].taught++;
                          else summary[f.subject].notTaught++;
                        });
                        return Object.entries(summary).map(([subj, stats]) => {
                          const total = stats.taught + stats.notTaught;
                          const pct = total > 0 ? Math.round((stats.taught / total) * 100) : 0;
                          return (
                            <div key={subj} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">{subj}</span>
                                <span className={cn("font-black", pct < 70 ? "text-rose-500" : "text-emerald-600")}>{pct}% Taught</span>
                              </div>
                              <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct < 70 ? '#f43f5e' : ACCENT }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                      {!sosFeedbacks.length && <p className="text-center py-8 text-slate-400 text-xs italic">No SOS feedback reports yet.</p>}
                    </div>
                  </div>

                  {/* Daily Quiz Analytics */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={20} /></div>
                      <h3 className="font-black text-slate-800">Daily Quiz Performance</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-2xl font-black text-slate-800">{quizAttempts.length}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Attempts</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-2xl font-black text-emerald-600">
                            {quizAttempts.length > 0 ? Math.round(quizAttempts.filter(a => a.score / a.total_questions >= 0.8).length / quizAttempts.length * 100) : 0}%
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass Rate (80%+)</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                        {quizAttempts.slice(0, 5).map(a => {
                          const student = students.find(s => s.roll_no === a.student_roll);
                          return (
                            <div key={a.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 pb-2">
                              <div>
                                <p className="font-bold text-slate-700">{student?.full_name || a.student_roll}</p>
                                <p className="text-[10px] text-slate-400">{new Date(a.completed_at).toLocaleTimeString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-900">{a.score}/{a.total_questions}</p>
                                <Badge c={a.score / a.total_questions >= 0.8 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"} label={a.score / a.total_questions >= 0.8 ? "Pass" : "Fail"} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* detailed SOS Feedback Log */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-800">SOS Subject Feedback Log</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-3 text-left">Date</th>
                          <th className="px-6 py-3 text-left">Student</th>
                          <th className="px-6 py-3 text-left">Teacher</th>
                          <th className="px-6 py-3 text-left">Topic</th>
                          <th className="px-6 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sosFeedbacks.slice(0, 50).map(f => {
                          const student = students.find(s => s.roll_no === f.student_roll);
                          return (
                            <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 text-xs text-slate-500">{new Date(f.feedback_date).toLocaleDateString()}</td>
                              <td className="px-6 py-3 font-bold text-slate-700">{student?.full_name || f.student_roll}</td>
                              <td className="px-6 py-3 text-slate-600">{f.teacher_name}</td>
                              <td className="px-6 py-3 text-xs text-slate-500 font-medium">{f.topic}</td>
                              <td className="px-6 py-3">
                                {f.was_taught ? 
                                  <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase"><CheckCircle size={12} /> Taught</span> : 
                                  <span className="flex items-center gap-1 text-rose-500 font-black text-[10px] uppercase"><AlertCircle size={12} /> Not Taught</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ EXAM SCHEDULES ══════════ */}
            {tab === 'exams' && (
              <motion.div key="exams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 mb-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Exam Coordination</h2>
                    <p className="text-xs text-slate-400">Manage institutional exam dates and automatic extraction</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('schedule')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black text-white shadow-lg shadow-emerald-500/20"
                    style={{ background: GRADIENT }}>
                    <Plus size={16} /> New Schedule
                  </motion.button>
                  <label className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-all">
                    <Upload size={16} /> Import CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {examSchedules.map((s) => (
                    <div key={s.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Calendar size={22} />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-base">{s.title}</h3>
                              <p className="text-xs text-slate-400">{s.program} · {s.class_section || 'All Sections'} · {s.session}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <Badge c={s.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} label={s.status} />
                             <button onClick={() => deleteSchedule(s.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Extracted Exams</p>
                          <div className="space-y-2">
                             {grades.filter(g => false).length === 0 && ( // Placeholder for exams link
                               <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                 <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {s.start_date} → {s.end_date}</span>
                                 <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-slate-400" /> {s.exam_type}</span>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {examSchedules.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                      <Calendar size={48} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold">No exam schedules published.</p>
                      <button onClick={() => setModal('schedule')} className="text-sm font-black mt-2 hover:underline" style={{ color: ACCENT }}>Start by uploading a schedule →</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════ ACADEMIC SETUP ══════════ */}
            {tab === 'programs' && (
              <motion.div key="programs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Programs & Sessions</h3>
                    <p className="text-xs text-slate-400">Define administrative sessions, academic programs and their subjects.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModal('session')} className="px-5 py-2.5 rounded-xl text-xs font-black text-white" style={{ background: GRADIENT }}>Academic Setup</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sessions List */}
                  <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Active Sessions</h4>
                    {sessions.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.is_active ? 'Currently Active' : 'Previous Session'}</p>
                        </div>
                        {s.is_active && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                    ))}
                  </div>

                  {/* Programs & Subjects Grid */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Program Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePrograms.map(p => {
                        const pSubjs = allSubjects.filter(s => s.program_id === p.id);
                        return (
                          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                              <p className="font-black text-slate-800 text-sm">{p.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label={`${pSubjs.length} Subj`} />
                                <button onClick={() => saveSubject(p.id)} className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 transition-colors">
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="p-4 space-y-2">
                              {pSubjs.map(s => {
                                const teacher = teachers.find(t => t.id === Number(s.teacher_id));
                                return (
                                  <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0 pb-1">
                                    <span className="font-medium text-slate-600">{s.name}</span>
                                    <span className="text-[10px] text-slate-400 italic">
                                      {teacher ? teacher.full_name : 'No teacher assigned'}
                                    </span>
                                  </div>
                                );
                              })}
                              {pSubjs.length === 0 && <p className="text-[10px] text-slate-400 text-center py-2 italic">No subjects added yet</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'tracking' && (
              <motion.div key="tracking" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {teacherProfs.map(t => {
                    const tSubjs = allSubjects.filter(s => s.teacher_id === t.id);
                    const tSchemes = schemes.filter(s => tSubjs.some(subj => subj.name === s.subject));
                    const completed = tSchemes.filter(s => s.status === 'Completed').length;
                    const total = tSchemes.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <div key={t.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white" style={{ background: GRADIENT }}>{t.full_name?.charAt(0)}</div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-tight">{t.full_name}</h3>
                            <p className="text-xs text-slate-400">{t.subject_dept || 'Senior Faculty'}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                              <span>Syllabus Progress</span>
                              <span style={{ color: ACCENT }}>{pct}%</span>
                            </div>
                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: GRADIENT }} />
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            {tSubjs.map(s => {
                              const sTotal = tSchemes.filter(ts => ts.subject === s.name).length;
                              const sDone = tSchemes.filter(ts => ts.subject === s.name && ts.status === 'Completed').length;
                              const sPct = sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0;
                              return (
                                <div key={s.id} className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-600">{s.name}</span>
                                  <span className="text-slate-400">{sDone}/{sTotal} topics</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
        {modal === 'schedule_entry' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-4xl z-20 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#e0e7ff' }}><Calendar size={16} className="text-indigo-600" /></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Timetable Excel Import</h3>
                    <p className="text-[10px] text-slate-400">Fill standard headings to create class timetable schedules</p>
                  </div>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm uppercase">Close</button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Program</p>
                      <select value={ttProgramId} onChange={e => setTtProgramId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 font-semibold">
                        <option value="">Select Program</option>
                        {activePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Gender Group</p>
                      <select value={ttGenderGroup} onChange={e => setTtGenderGroup(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 font-semibold">
                        <option value="Girls-I">Girls-I</option>
                        <option value="Boys-I">Boys-I</option>
                        <option value="Girls-II">Girls-II</option>
                        <option value="Boys-II">Boys-II</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Timetable spreadsheet style editor */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50">
                  <table className="w-full text-left border-collapse border border-slate-200 min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Subject</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Teacher</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Class Section</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Day</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Room No</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">From (Start)</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">To (End)</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ttExcelRows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 bg-white">
                          <td className="border border-slate-200 p-1">
                            <input 
                              type="text" 
                              value={row.subject} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].subject = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              placeholder="e.g. Physics"
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-bold"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <select 
                              value={row.teacher} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].teacher = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-semibold"
                            >
                              <option value="">Select Teacher</option>
                              {teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                            </select>
                          </td>
                          <td className="border border-slate-200 p-1">
                            <input 
                              type="text" 
                              value={row.section} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].section = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              placeholder="e.g. ICS-A"
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-semibold"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <select 
                              value={row.day} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].day = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                            >
                              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </td>
                          <td className="border border-slate-200 p-1">
                            <input 
                              type="text" 
                              value={row.room} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].room = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              placeholder="e.g. 101"
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <input 
                              type="time" 
                              value={row.from_time} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].from_time = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-bold"
                            />
                          </td>
                          <td className="border border-slate-200 p-1">
                            <input 
                              type="time" 
                              value={row.to_time} 
                              onChange={e => {
                                const updated = [...ttExcelRows];
                                updated[idx].to_time = e.target.value;
                                setTtExcelRows(updated);
                              }} 
                              className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-bold"
                            />
                          </td>
                          <td className="border border-slate-200 p-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = ttExcelRows.filter((_, i) => i !== idx);
                                setTtExcelRows(updated);
                              }}
                              className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center">
                  <button 
                    type="button" 
                    onClick={() => setTtExcelRows([...ttExcelRows, { subject: '', teacher: '', section: '', day: 'Monday', room: '', from_time: '', to_time: '' }])}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-black uppercase text-slate-700 transition-all flex items-center gap-1"
                  >
                    + Add Row
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold">Total entries: {ttExcelRows.filter((r: any) => r.subject.trim() && r.teacher.trim() && r.section.trim()).length}</p>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={saveTimetableExcelSheet} disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-black text-white hover:opacity-90 transition-all disabled:opacity-50" style={{ background: GRADIENT }}>
                  {saving ? 'Saving...' : 'Save Timetable Sheet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editTtForm && (
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditTtForm(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-xl z-20 shadow-2xl overflow-hidden flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: ACCENT }}><Calendar size={16} /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Edit Timetable Entry</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modify Saved Class Period Details</p>
                  </div>
                </div>
                <button onClick={() => setEditTtForm(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm uppercase">Close</button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4">
                  <FM label="Subject" req>
                    <TI 
                      placeholder="e.g. Physics" 
                      value={editTtForm.subject} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, subject: e.target.value })} 
                    />
                  </FM>
                  <FM label="Teacher" req>
                    <TS 
                      value={editTtForm.teacher_id} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, teacher_id: e.target.value })}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </TS>
                  </FM>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FM label="Class Section" req>
                    <TI 
                      placeholder="e.g. ICS-A" 
                      value={editTtForm.class_section} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, class_section: e.target.value })} 
                    />
                  </FM>
                  <FM label="Day of Week" req>
                    <TS 
                      value={editTtForm.day_of_week} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, day_of_week: e.target.value })}
                    >
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </TS>
                  </FM>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FM label="Start Time (From)" req>
                    <TI 
                      type="time" 
                      value={editTtForm.start_time ? editTtForm.start_time.slice(0, 5) : '08:00'} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, start_time: e.target.value })} 
                    />
                  </FM>
                  <FM label="End Time (To)" req>
                    <TI 
                      type="time" 
                      value={editTtForm.end_time ? editTtForm.end_time.slice(0, 5) : '08:45'} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, end_time: e.target.value })} 
                    />
                  </FM>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FM label="Room Number">
                    <TI 
                      placeholder="e.g. 101" 
                      value={editTtForm.room || ''} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, room: e.target.value })} 
                    />
                  </FM>
                  <FM label="Gender Group">
                    <TS 
                      value={editTtForm.gender_group || 'Girls-I'} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, gender_group: e.target.value })}
                    >
                      <option value="Girls-I">Girls-I</option>
                      <option value="Boys-I">Boys-I</option>
                      <option value="Girls-II">Girls-II</option>
                      <option value="Boys-II">Boys-II</option>
                    </TS>
                  </FM>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FM label="Program">
                    <TS 
                      value={editTtForm.program || ''} 
                      onChange={(e: any) => setEditTtForm({ ...editTtForm, program: e.target.value })}
                    >
                      <option value="">Select Program</option>
                      {activePrograms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </TS>
                  </FM>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
                <button onClick={() => setEditTtForm(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all font-semibold">Cancel</button>
                <button onClick={saveSingleTimetableEntry} disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-black text-white hover:opacity-90 transition-all disabled:opacity-50 font-semibold" style={{ background: GRADIENT }}>
                  {saving ? 'Saving...' : 'Update Entry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {modal === 'session' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-4xl z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><GraduationCap size={16} style={{ color: ACCENT }} /></div>
                  <h3 className="font-black text-slate-900">Academic Session Setup</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-8">
                {/* Session Creation */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Academic Sessions</h4>
                    {activeSession && <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label={`Active: ${activeSession.name}`} />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sessions.map(s => (
                      <div key={s.id} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${s.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {s.name} {s.is_active ? ' (Active)' : ''}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Program Management */}
                <section>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">2. Programs for Session</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TS value={programForm.session_id} onChange={e => setProgramForm({ ...programForm, session_id: e.target.value })}>
                      <option value="">Select Session</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </TS>
                    <div className="flex gap-2">
                      <TI placeholder="e.g. ICS Physics" value={programForm.name} onChange={e => setProgramForm({ ...programForm, name: e.target.value })} />
                      <button onClick={saveProgram} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200"><Plus size={18} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {activePrograms.filter(p => !programForm.session_id || p.session_id === programForm.session_id).map(p => (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 relative group">
                        <p className="text-sm font-black text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{sessions.find(s => s.id === p.session_id)?.name}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Subject Assignment */}
                <section>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">3. Subjects & Teachers</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <TS value={subjForm.program_id} onChange={e => setSubjForm({ ...subjForm, program_id: e.target.value })}>
                      <option value="">Select Program</option>
                      {activePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </TS>
                    <TI placeholder="Subject Name" value={subjForm.name} onChange={e => setSubjForm({ ...subjForm, name: e.target.value })} />
                    <div className="flex gap-2">
                      <TS value={subjForm.teacher_id} onChange={e => setSubjForm({ ...subjForm, teacher_id: e.target.value })}>
                        <option value="">Assign Teacher (Optional)</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </TS>
                      <button onClick={() => saveSubject()} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200"><Plus size={18} /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {allSubjects.filter(s => !subjForm.program_id || s.program_id === subjForm.program_id).map(s => {
                      const prog = activePrograms.find(p => p.id === s.program_id);
                      const tea = teachers.find(t => t.id === Number(s.teacher_id));
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{prog?.name}</p>
                            <p className="text-sm font-black text-slate-900">{s.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher</p>
                            <Badge c="bg-slate-50 text-slate-700 border-slate-200" label={tea?.full_name || 'Not assigned'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Resource Management */}
                <section>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">4. Subject Resources (PDFs, Notes)</h4>
                  <p className="text-[11px] text-slate-400 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100">Uploaded resources will automatically appear in the Student Portal for the relevant subject.</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <TS onChange={async (e) => {
                      const subjectId = e.target.value;
                      if (!subjectId) return;
                      // Mock resource upload UI
                      const title = prompt('Resource Title (e.g., Chapter 1 Notes)');
                      const url = prompt('Resource URL (or path)');
                      if (title && url) {
                        setSaving(true);
                        const { error } = await supabase.from('academic_resources').insert([{ subject_id: subjectId, title, file_url: url, file_type: 'pdf' }]);
                        setSaving(false);
                        if (error) showToast(error.message, false);
                        else showToast('Resource uploaded successfully');
                      }
                    }}>
                      <option value="">Upload Resource for Subject...</option>
                      {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({activePrograms.find(p => p.id === s.program_id)?.name})</option>)}
                    </TS>
                  </div>
                </section>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end flex-shrink-0">
                <button onClick={() => setModal(null)} className="px-8 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>Done Settings</button>
              </div>
            </motion.div>
          </div>
        )}

        {modal === 'schedule' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><Calendar size={16} style={{ color: ACCENT }} /></div>
                  <h3 className="font-black text-slate-900">Upload Exam Schedule</h3>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => {
                    const csv = "Subject,Date,Time\nMath,2026-05-10,09:00\nPhysics,2026-05-12,09:00";
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'schedule_template.csv'; a.click();
                  }} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5">
                    <Save size={10} /> Download Template
                  </button>
                  <label className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-colors">
                    <Plus size={10} /> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      const lines = text.split('\n').filter(l => l.trim());
                      const headers = lines[0].split(',');
                      const data = lines.slice(1).map(l => {
                        const vals = l.split(',');
                        return { subject: vals[0], date: vals[1], time: vals[2] };
                      });
                      setScheduleForm((p: any) => ({ ...p, exams: data }));
                      showToast(`Imported ${data.length} exams`);
                    }} />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FM label="Schedule Name" req><TI placeholder="e.g. Mid-Term 2026" value={scheduleForm.title} onChange={e => setScheduleForm((p: any) => ({ ...p, title: e.target.value }))} /></FM>
                  <FM label="Exam Type"><TS value={scheduleForm.exam_type} onChange={e => setScheduleForm((p: any) => ({ ...p, exam_type: e.target.value }))}>{['Mid-Term','Final','Mock','Test Series'].map(t => <option key={t}>{t}</option>)}</TS></FM>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FM label="Program" req><TS value={scheduleForm.program} onChange={e => setScheduleForm((p: any) => ({ ...p, program: e.target.value }))}>{PROGRAMS.map(p => <option key={p}>{p}</option>)}</TS></FM>
                  <FM label="Part"><TS value={scheduleForm.part} onChange={e => setScheduleForm((p: any) => ({ ...p, part: Number(e.target.value) }))}><option value={1}>Pt 1</option><option value={2}>Pt 2</option></TS></FM>
                  <FM label="Section"><TI placeholder="e.g. A" value={scheduleForm.class_section} onChange={e => setScheduleForm((p: any) => ({ ...p, class_section: e.target.value }))} /></FM>
                  <FM label="Session"><TI placeholder="2026-27" value={scheduleForm.session} onChange={e => setScheduleForm((p: any) => ({ ...p, session: e.target.value }))} /></FM>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Extracted Exams List</h4>
                    <button onClick={() => setScheduleForm((p: any) => ({ ...p, exams: [...p.exams, { subject: '', date: '', time: '' }] }))}
                      className="text-[10px] font-black text-emerald-600 hover:underline flex items-center gap-1">
                      <Plus size={10} /> Add Row
                    </button>
                  </div>
                  <div className="space-y-3">
                    {scheduleForm.exams.map((ex: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 min-w-0"><FM label="Subject"><TI placeholder="Math" value={ex.subject} onChange={e => {
                          const newExams = [...scheduleForm.exams]; newExams[idx].subject = e.target.value;
                          setScheduleForm((p: any) => ({ ...p, exams: newExams }));
                        }} /></FM></div>
                        <div className="w-32"><FM label="Date"><TI type="date" value={ex.date} onChange={e => {
                          const newExams = [...scheduleForm.exams]; newExams[idx].date = e.target.value;
                          setScheduleForm((p: any) => ({ ...p, exams: newExams }));
                        }} /></FM></div>
                        <div className="w-24"><FM label="Time"><TI type="time" value={ex.time} onChange={e => {
                          const newExams = [...scheduleForm.exams]; newExams[idx].time = e.target.value;
                          setScheduleForm((p: any) => ({ ...p, exams: newExams }));
                        }} /></FM></div>
                        <button onClick={() => setScheduleForm((p: any) => ({ ...p, exams: p.exams.filter((_: any, i: number) => i !== idx) }))}
                          className="p-2.5 text-slate-300 hover:text-rose-500 mb-0.5"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={saveExamSchedule} disabled={saving} className="px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50" style={{ background: GRADIENT }}>
                  {saving ? 'Publishing...' : 'Publish Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {modal === 'scheme' && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
    <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
      className="relative bg-white rounded-3xl w-full max-w-4xl z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <div className="h-1" style={{ background: GRADIENT }} />
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}><BookMarked size={16} style={{ color: ACCENT }} /></div>
          <div>
            <h3 className="font-black text-slate-900">Scheme of Study Excel Import</h3>
            <p className="text-[10px] text-slate-400">Fill standard headings to upload subject syllabus roadmap</p>
          </div>
        </div>
        <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
      </div>
      <div className="p-6 space-y-5 overflow-y-auto">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FM label="Target Subject" req>
              <TS value={topicSubject} onChange={e => setTopicSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {SUBJECTS_17.map(s => <option key={s} value={s}>{s}</option>)}
              </TS>
            </FM>
            <FM label="Target Program" req>
              <TS value={topicProgram} onChange={e => setTopicProgram(e.target.value)}>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </TS>
            </FM>
          </div>
        </div>

        {/* Excel Spreadsheet style table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50">
          <table className="w-full text-left border-collapse border border-slate-200 min-w-[1240px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Topic Name</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Book</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Teacher Name</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Part 1 or 2</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Section</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Date</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Day</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Lecture no</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase">Syllabus</th>
                <th className="border border-slate-200 px-3 py-2 text-xs font-black uppercase text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody>
              {topicExcelRows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 bg-white">
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="text" 
                      value={row.topicName} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].topicName = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      placeholder="e.g. Chapter 1: Newton's Laws"
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-bold"
                    />
                  </td>
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="text" 
                      value={row.book} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].book = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      placeholder="e.g. Physics XI"
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                    />
                  </td>
                  <td className="border border-slate-200 p-1">
                    <select 
                      value={row.teacherName} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].teacherName = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 font-semibold"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}
                    </select>
                  </td>
                  <td className="border border-slate-200 p-1">
                    <select 
                      value={row.part} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].part = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                    >
                      <option value="1">Part 1</option>
                      <option value="2">Part 2</option>
                    </select>
                  </td>
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="text" 
                      value={row.section} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].section = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      placeholder="e.g. ICS-A"
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                    />
                  </td>
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="date" 
                      value={row.date} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].date = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 text-slate-700"
                    />
                  </td>
                  <td className="border border-slate-200 p-1">
                    <select 
                      value={row.day} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].day = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50 text-slate-700 font-semibold"
                    >
                      <option value="">Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </td>
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="number" 
                      value={row.lectureNo} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].lectureNo = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      placeholder="e.g. 1"
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                    />
                  </td>
                  <td className="border border-slate-200 p-1">
                    <input 
                      type="text" 
                      value={row.syllabus} 
                      onChange={e => {
                        const updated = [...topicExcelRows];
                        updated[idx].syllabus = e.target.value;
                        setTopicExcelRows(updated);
                      }} 
                      placeholder="e.g. Ch 1 Intro"
                      className="w-full px-2 py-1 text-sm bg-transparent outline-none focus:bg-slate-50"
                    />
                  </td>
                  <td className="border border-slate-200 p-1 text-center">
                    <button 
                      type="button" 
                      onClick={() => {
                        const updated = topicExcelRows.filter((_, i) => i !== idx);
                        setTopicExcelRows(updated);
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => setTopicExcelRows([...topicExcelRows, { topicName: '', book: '', teacherName: '', part: '1', section: '', date: '', day: '', lectureNo: '', syllabus: '' }])}
            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-black uppercase text-slate-700 transition-all flex items-center gap-1"
          >
            + Add Row
          </button>
          <p className="text-[10px] text-slate-400 font-bold">Total filled lectures: {topicExcelRows.filter((r: any) => r.topicName.trim() && r.teacherName.trim()).length}</p>
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
        <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
        <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={saveTopicExcelSheet}
          className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: GRADIENT }}>
          {saving ? 'Saving…' : <><CheckCircle size={14} /> Save Roadmap Sheet</>}
        </motion.button>
      </div>
    </motion.div>
  </div>
)}

        {modal === 'import_scheme' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-5xl z-10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              <div className="h-1" style={{ background: GRADIENT }} />
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-emerald-100" style={{ background: '#f0fdf4' }}>
                    <FileUp size={16} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Import Scheme of Study</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Automated syllabus roadmap Excel / CSV Ingestion</p>
                  </div>
                </div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Target Configuration Dashboard */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Import Destination Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FM label="Target Subject" req>
                      <TS value={importSubject} onChange={(e: any) => {
                        setImportSubject(e.target.value);
                      }}>
                        <option value="">Select Target Subject</option>
                        {SUBJECTS_17.map(s => <option key={s} value={s}>{s}</option>)}
                      </TS>
                    </FM>
                    <FM label="Target Prep Program" req>
                      <TS value={importProgram} onChange={(e: any) => {
                        setImportProgram(e.target.value);
                      }}>
                        {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </TS>
                    </FM>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  id="drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-inner'
                      : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60'
                  }`}
                  onClick={() => document.getElementById('sheet-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="sheet-file-picker"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSchemeFileSelected(file);
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">Drag & Drop scheme of study file here</h4>
                  <p className="text-xs text-slate-400 mt-1">or click to browse your desktop</p>
                  <div className="flex gap-2.5 mt-4 justify-center">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg shadow-sm">.XLSX</span>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg shadow-sm">.XLS</span>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg shadow-sm">.CSV</span>
                  </div>
                </div>

                {/* File Upload Progress and Status */}
                {importFileName && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-xl font-black text-xs">XLS</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-sm font-bold text-slate-800 truncate">{importFileName}</p>
                        <p className="text-xs font-black text-emerald-600">{uploadProgress}%</p>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Parsing Summary Cards */}
                {importRows.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Lectures Card */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/50 text-blue-700 flex items-center justify-center shadow-sm">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-blue-700 font-mono">
                          {importRows.filter(e => e.lectureNo !== null).length}
                        </p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Lectures Found</p>
                      </div>
                    </div>

                    {/* Total Topics Card */}
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/50 text-emerald-700 flex items-center justify-center shadow-sm">
                        <BookMarked size={18} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-emerald-700 font-mono">
                          {importRows.filter(e => e.topic).length}
                        </p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Topics Extracted</p>
                      </div>
                    </div>

                    {/* Total Errors Card */}
                    <div className={`${
                      importRows.filter(e => e.hasError).length > 0 
                        ? 'bg-rose-50 border-rose-200' 
                        : 'bg-slate-50/60 border-slate-100'
                    } border rounded-2xl p-4 flex items-center gap-4 transition-all`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        importRows.filter(e => e.hasError).length > 0 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <p className={`text-2xl font-black font-mono ${
                          importRows.filter(e => e.hasError).length > 0 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {importRows.filter(e => e.hasError).length}
                        </p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Incomplete Fields Errors</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {importRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Syllabus Roadmaps Ingestion List</h4>
                      {importRows.some(e => e.isDuplicateLecture) && (
                        <span className="text-[10px] text-amber-600 font-black flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                          <AlertCircle size={10} /> Duplicate Lecture Numbers Detected
                        </span>
                      )}
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <th className="px-4 py-3 text-xs font-black uppercase w-32">Date</th>
                            <th className="px-4 py-3 text-xs font-black uppercase w-28">Day</th>
                            <th className="px-4 py-3 text-xs font-black uppercase w-28 text-center">Lecture No</th>
                            <th className="px-4 py-3 text-xs font-black uppercase">Topic</th>
                            <th className="px-4 py-3 text-xs font-black uppercase text-center w-28">Validation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row: any) => (
                            <tr
                              key={row.id}
                              className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${
                                row.hasError ? 'bg-rose-50/40 hover:bg-rose-50/60' : ''
                              }`}
                            >
                              <td className={`px-4 py-3 text-xs font-mono font-bold ${row.isMissingDate ? 'text-rose-600 uppercase font-black' : 'text-slate-600'}`}>
                                {row.date || '— Missing —'}
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                {row.day || '—'}
                              </td>
                              <td className={`px-4 py-3 text-xs text-center font-mono font-black ${
                                row.isDuplicateLecture ? 'text-amber-600 font-black' : 'text-slate-800'
                              }`}>
                                <div className="inline-flex items-center gap-1 font-mono font-semibold">
                                  {row.lectureNo !== null ? row.lectureNo : '—'}
                                  {row.isDuplicateLecture && (
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" title="Duplicate selection warning" />
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-3 text-sm font-bold ${row.isMissingTopic ? 'text-rose-600 font-extrabold italic' : 'text-slate-800'}`}>
                                {row.topic || '— Topic Missing —'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {row.hasError ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                    ERROR
                                  </span>
                                ) : row.isDuplicateLecture ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-mono">
                                    WARN
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono">
                                    VALID
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={executeSchemeImport}
                  disabled={saving || loading || importRows.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm"
                  style={{ background: GRADIENT }}
                >
                  {saving || loading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Ingesting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} /> Import Scheme
                    </>
                  )}
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
                  <FM label="Target Class" req>
                    <TS value={announceForm.target_type} onChange={e => setAnnounceForm((p: any) => ({ ...p, target_type: e.target.value }))}>
                      <option value="all">Broadcast to All</option>
                      {classes.map(c => <option key={c.id} value={c.class_name}>{c.class_name}</option>)}
                    </TS>
                  </FM>
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

        {modal === 'teacher' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden mt-10">
               <div className="h-1" style={{ background: GRADIENT }} />
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="font-black text-slate-900">{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                 <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
               </div>
               <div className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <FM label="Full Name" req><TI value={teacherForm.full_name} onChange={e => setTeacherForm({...teacherForm, full_name: e.target.value.toUpperCase()})} /></FM>
                   <FM label="Employee ID" req><TI value={teacherForm.employee_id} onChange={e => setTeacherForm({...teacherForm, employee_id: e.target.value})} /></FM>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <FM label="Subject"><TI value={teacherForm.subject_dept} onChange={e => setTeacherForm({...teacherForm, subject_dept: e.target.value})} /></FM>
                   <FM label="Monthly Salary"><TI type="number" value={teacherForm.monthly_salary} onChange={e => setTeacherForm({...teacherForm, monthly_salary: e.target.value})} /></FM>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <FM label="Phone No"><TI value={teacherForm.phone_no} onChange={e => setTeacherForm({...teacherForm, phone_no: e.target.value})} /></FM>
                   <FM label="Email"><TI value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} /></FM>
                 </div>
                 <FM label="Status">
                   <TS value={teacherForm.status} onChange={e => setTeacherForm({...teacherForm, status: e.target.value})}>
                     <option value="Active">Active</option>
                     <option value="Inactive">Inactive</option>
                   </TS>
                 </FM>
               </div>
               <div className="p-6 border-t border-slate-100 flex gap-3">
                 <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-50">Cancel</button>
                 <button onClick={saveTeacher} className="flex-1 py-2.5 rounded-xl font-black text-white" style={{ background: GRADIENT }}>{saving ? 'Saving...' : 'Save Teacher'}</button>
               </div>
            </motion.div>
          </div>
        )}

        {modal === 'class' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative bg-white rounded-3xl w-full max-w-sm z-10 shadow-2xl overflow-hidden mt-10">
               <div className="h-1" style={{ background: GRADIENT }} />
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="font-black text-slate-900">Manage Class</h3>
                 <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
               </div>
               <div className="p-6 space-y-4">
                 <FM label="Class Name" req><TI value={classForm.class_name} onChange={e => setClassForm({...classForm, class_name: e.target.value.toUpperCase()})} placeholder="e.g. 1st Year Section A" /></FM>
                 <FM label="Department"><TI value={classForm.department} onChange={e => setClassForm({...classForm, department: e.target.value.toUpperCase()})} placeholder="e.g. Science" /></FM>
                 <FM label="Academic Year"><TI value={classForm.academic_year} onChange={e => setClassForm({...classForm, academic_year: e.target.value})} placeholder="e.g. 2026-28" /></FM>
               </div>
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                 <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 bg-white border">Cancel</button>
                 <button onClick={saveClass} className="flex-1 py-2.5 rounded-xl font-black text-white shadow-md shadow-emerald-500/20" style={{ background: GRADIENT }}>{saving ? '...' : 'Save Class'}</button>
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

      <Toaster position="bottom-center" />
    </div>
  );
};