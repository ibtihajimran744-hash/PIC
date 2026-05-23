import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Bell, LogOut, Plus, Calendar, LayoutDashboard, Search,
  Clock, MapPin, GraduationCap, FileText, CheckSquare, BookOpen,
  TrendingUp, BarChart3, ChevronLeft, Trophy, X, Phone, CreditCard,
  CheckCircle2, User, RefreshCw, AlertCircle, Loader2,
  BookMarked, BookCheck, UserCheck, Inbox, FileSpreadsheet,
  HelpCircle, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  Student, Teacher, getChapters, addChapter, Chapter, Grade, addGrades,
  Exam, getExamsByTeacher,
  supabase, getFeesByRollNo, 
  getNotifications, getTeachers,
  markAttendanceByTeacher, submitTeacherLeaveRequest,
  getTeacherTodaySchedule, getTeacherAttendanceTrend, TeacherScheduleEntry,
  getTeacherWeeklySchedule, getSchemeOfStudy
} from '../services/supabase';
import { seedAllDemoData } from '../services/demoData';
import { SchemeEntry } from '../services/academicManagement';
import { Leaderboard } from './Leaderboard';
import { toast, Toaster } from 'react-hot-toast';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TeacherPortalProps {
  onLogout: () => void;
  teacherData: Teacher | null;
  assignedStudents: Student[];
}

// ─── Reschedule types ─────────────────────────────────────────────────────────
interface RescheduleRequest {
  id: string;
  scheme_id: string;
  original_date: string;
  original_week: number | null;
  proposed_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  scheme_of_study?: SchemeEntry;
}

// Section display helper
const displaySection = (section: string, program?: string) => {
  if (!section) return '—';
  // Simple section logic as requested.
  // Example: ICS Physics B-Boys, I.Com A-Girls
  return section;
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", color)}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

function formatTime(timeStr: string): { time: string; period: string } {
  if (!timeStr) return { time: '--:--', period: '' };
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return { time: `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period };
}

const Badge = ({ c, label }: { c: string, label: string }) => (
  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase border", c)}>{label}</span>
);

const FileImage = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const TeacherPortal: React.FC<TeacherPortalProps> = ({ onLogout, teacherData, assignedStudents: initialAssignedStudents }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [subPage, setSubPage] = useState<string | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>(initialAssignedStudents || []);
  const [allSections, setAllSections] = useState<string[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [modalSelectedClass, setModalSelectedClass] = useState<string | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verTab, setVerTab] = useState<'claim_orders' | 'exam_marks'>('claim_orders');
  const [pendingExamMarks, setPendingExamMarks] = useState<any[]>([]);
  const [loadingVer, setLoadingVer] = useState(false);
  const [submittingVerAction, setSubmittingVerAction] = useState(false);

  const [todaySchedule, setTodaySchedule] = useState<TeacherScheduleEntry[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [leaveForm, setLeaveForm] = useState({ reason: '', from_date: '', to_date: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [attendanceStats, setAttendanceStats] = useState([
    { name: 'Mon', present: 0 }, { name: 'Tue', present: 0 },
    { name: 'Wed', present: 0 }, { name: 'Thu', present: 0 },
    { name: 'Fri', present: 0 }, { name: 'Sat', present: 0 },
  ]);

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [quizForm, setQuizForm] = useState<{
    targetClass: string;
    questions: { q: string; a: string[]; correct_index: number }[];
  }>({
    targetClass: "",
    questions: [
      { q: "", a: ["", "", "", ""], correct_index: 0 },
      { q: "", a: ["", "", "", ""], correct_index: 0 },
      { q: "", a: ["", "", "", ""], correct_index: 0 },
      { q: "", a: ["", "", "", ""], correct_index: 0 },
      { q: "", a: ["", "", "", ""], correct_index: 0 },
    ]
  });
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [totalMarks, setTotalMarks] = useState(100);
  const [markedToday, setMarkedToday] = useState<Record<number, string>>({});
  const [newGradeChapter, setNewGradeChapter] = useState('');
  const [studentScores, setStudentScores] = useState<Record<number, number>>({});

  // ── Exam Management state ────────────────────────────────────────────────
  const [duties, setDuties] = useState<any[]>([]);
  const [performaRequests, setPerformaRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  // ── Reschedule state ──────────────────────────────────────────────────────
  const [schemeEntries, setSchemeEntries] = useState<SchemeEntry[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [loadingReschedule, setLoadingReschedule] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSchemeEntry, setSelectedSchemeEntry] = useState<SchemeEntry | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  
  // ── Academics & Course Progress state ──────────────────────────────────────
  const [fullWeeklySchedule, setFullWeeklySchedule] = useState<TeacherScheduleEntry[]>([]);
  const [courseProgressData, setCourseProgressData] = useState<any[]>([]);
  const [loadingAcademics, setLoadingAcademics] = useState(false);
  const [weekSos, setWeekSos] = useState<any[]>([]);
const [todayScheduleNew, setTodayScheduleNew]   = useState<any[]>([]);
const [weekScheduleNew,  setWeekScheduleNew]    = useState<any[]>([]);
const [schedLoadingNew,  setSchedLoadingNew]    = useState(false);
const [schedSearch,      setSchedSearch]        = useState('');
const [schedView,        setSchedView]          = useState<'today'|'week'>('today');

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherData) return;
    if (!leaveForm.reason || !leaveForm.from_date || !leaveForm.to_date) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmittingLeave(true);
    try {
      const from = new Date(leaveForm.from_date);
      const to = new Date(leaveForm.to_date);
      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1);
      const { error } = await supabase.from('teacher_leave_requests').insert([{
        teacher_id: teacherData.id,
        teacher_name: teacherData.full_name,
        username: teacherData.username,
        from_date: leaveForm.from_date,
        to_date: leaveForm.to_date,
        days_count: days,
        reason: leaveForm.reason,
        leave_type: 'General',
        status: 'Pending',
      }]);
      if (error) throw error;
      // Notify VP
      await supabase.from('admin_notifications').insert([{
        sender: teacherData.full_name,
        title: `📋 Leave Request: ${teacherData.full_name}`,
        message: `${teacherData.full_name} has requested leave from ${leaveForm.from_date} to ${leaveForm.to_date} (${days} day${days > 1 ? 's' : ''}). Reason: ${leaveForm.reason}`,
        target: 'VP',
        target_role: 'vp',
        is_read: false,
        type: 'leave_request',
      }]);
      toast.success('Leave request submitted to VP');
      setLeaveForm({ reason: '', from_date: '', to_date: '' });
      setActiveTab('Home');
    } catch (err: any) {
      console.error('Leave error:', err);
      toast.error(`Failed to submit: ${err?.message || 'Unknown error'}`);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleResolveVerification = async (ver: any, action: 'Resolved' | 'Rejected', note: string) => {
    if (!teacherData) return;
    setSubmittingVerAction(true);
    try {
      const { error } = await supabase.from('result_verifications').update({
        status: action,
        resolution_note: note,
        resolved_by: teacherData.full_name,
        resolved_at: new Date().toISOString()
      }).eq('id', ver.id);

      if (error) throw error;

      // Notify Student
      await supabase.from('notifications').insert([{
        target_user_id: String(ver.student_roll),
        target_role: 'STUDENT',
        title: `Verification Order ${action}`,
        message: `Your verification request for ${ver.exam_name} was ${action.toLowerCase()}. Details: ${note}`,
        type: 'verification_resolved'
      }]);

      toast.success(`Verification ${action.toLowerCase()}`);
      loadAcademicsData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingVerAction(false);
    }
  };

  const handleResolveExamMark = async (mark: any, revisedMarks: number, notes: string) => {
    if (!teacherData) return;
    setSubmittingVerAction(true);
    try {
      const { error } = await supabase
        .from('exam_marks')
        .update({
          marks_obtained: revisedMarks,
          is_verified: true,
          examiner_edited: false,
          remarks: notes || 'Verified by Teacher'
        })
        .eq('id', mark.id);

      if (error) throw error;

      // Add student notification
      await supabase.from('notifications').insert([{
        target_user_id: String(mark.student_roll),
        target_role: 'STUDENT',
        title: `✅ Exam Mark Verified`,
        message: `Your requested marks verification for subject ${mark.subject} has been resolved. Approved Marks: ${revisedMarks}. Remarks: ${notes}`,
        type: 'verification_resolved'
      }]);

      toast.success("Exam mark successfully verified and resolved!");
      setPendingExamMarks(prev => prev.filter(m => m.id !== mark.id));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingVerAction(false);
    }
  };

  const loadExamManagement = async () => {
    if (!teacherData) return;
    setLoadingExams(true);
    try {
      const [dutyRes, perfRes, noticeRes] = await Promise.all([
        supabase.from('duty_chart').select('*').eq('teacher_id', teacherData.id).order('exam_date', { ascending: false }),
        supabase.from('paper_receiving_performa').select('*').eq('teacher_id', teacherData.id).order('created_at', { ascending: false }),
        supabase.from('uploaded_documents').select('*')
          .or(`visible_to.cs.{Teachers},visible_to.cs.{All}`)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ]);
      setDuties(dutyRes.data || []);
      setPerformaRequests(perfRes.data || []);
      setNotices(noticeRes.data || []);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleReportPresent = async (dutyId: string) => {
    try {
      const { error } = await supabase.from('duty_chart').update({
        status: 'Reported',
        reported_at: new Date().toISOString()
      }).eq('id', dutyId);
      if (error) throw error;
      toast.success('Reported present successfully');
      loadExamManagement();
    } catch (err) {
      toast.error('Failed to report presence');
    }
  };

  const handleConfirmPaper = async (perfId: string) => {
    try {
      const perf = performaRequests.find(p => p.id === perfId);
      const { error } = await supabase.from('paper_receiving_performa').update({
        status: 'Confirmed',
        confirmed_at: new Date().toISOString()
      }).eq('id', perfId);
      if (error) throw error;
      toast.success('Paper receipt confirmed');
      
      // Notify Examiner (Broadcasting to admin_notifications)
      if (teacherData) {
        await supabase.from('admin_notifications').insert([{
          sender: teacherData.full_name,
          title: '📄 Paper Performa Received',
          message: `Teacher ${teacherData.full_name} has confirmed receipt of paper performa for ${perf?.subject || 'subject'} (${perf?.class_section || 'N/A'}).`,
          target: 'EXAMINER',
          target_role: 'examiner',
          is_read: false,
          type: 'performa_received'
        }]);
      }

      loadExamManagement();
    } catch (err) {
      toast.error('Failed to confirm paper receipt');
    }
  };

  useEffect(() => {
    loadExamManagement();
  }, [teacherData]);

  // ── Students ───────────────────────────────────────────────────────────────
  const fetchStudents = async () => {
    if (!teacherData) return;
    setStudentsLoading(true);
    try {
      console.log('Fetching students for teacher:', teacherData.id, teacherData.full_name);
      let sections: string[] = [];
      
      // 1. Get sections from assigned_classes profile field
      const raw = teacherData.assigned_classes || '';
      if (raw) {
        sections = raw.split(/[,|;]/).map((s: string) => s.trim()).filter(Boolean);
      }

      // 2. Get sections from Schedule (View + Timetable)
      try {
        // Try the view first as it's pre-joined
        const { data: viewData } = await supabase
          .from('teacher_schedule_view')
          .select('class_section')
          .eq('teacher_id', teacherData.id);
        
        if (viewData && viewData.length > 0) {
          const ttSections = viewData.map(r => r.class_section).filter(Boolean);
          sections = Array.from(new Set([...sections, ...ttSections]));
        }

        // Fallback to direct timetable if still lean
        const { data: ttData } = await supabase
          .from('timetable')
          .select('class_section')
          .or(`teacher_id.eq.${teacherData.id},teacher_name.ilike.%${teacherData.full_name}%`);
        
        if (ttData && ttData.length > 0) {
          const ttSections = ttData.map(r => r.class_section).filter(Boolean);
          sections = Array.from(new Set([...sections, ...ttSections]));
        }
      } catch (err) {
        console.warn('Schedule lookup failed, continuing with Profile sections', err);
      }

      console.log('Final detected sections for query:', sections);

      let finalStudents: Student[] = [];

      if (sections.length > 0) {
        // Build filters for Supabase .or()
        // We use ilike for everything to handle slight variations like "10th-A" vs "10th A"
        const orFilter = sections.map(s => `class_section.ilike.%${s.replace(/["']/g, '')}%`).join(',');
        
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .or(orFilter)
          .neq('status', 'Deleted')
          .order('class_section', { ascending: true })
          .order('full_name', { ascending: true });
          
        if (!error && data) {
          finalStudents = data;
        }
      }

      // 4. If still empty, try matching by teacher_name in timetable
      if (finalStudents.length === 0) {
        const { data: nameMatch } = await supabase
          .from('timetable')
          .select('class_section')
          .ilike('teacher_name', `%${teacherData.full_name.split(' ').slice(-1)[0]}%`);
        if (nameMatch && nameMatch.length > 0) {
          const nameSections = [...new Set(nameMatch.map((r: any) => r.class_section))];
          const { data: nd } = await supabase
            .from('students')
            .select('*')
            .in('class_section', nameSections)
            .neq('status', 'Deleted')
            .order('full_name');
          if (nd) finalStudents = nd;
        }
      }
      // No global fallback — show empty if truly no match

      // Dedup by Roll No
      const uniqueStudents = Array.from(new Map(finalStudents.map(s => [s.roll_no, s])).values());
      setAssignedStudents(uniqueStudents);
      
      // CRITICAL: Always update allSections from the actual data found
      const sctns = Array.from(new Set(uniqueStudents.map(s => s.class_section))).filter(Boolean).sort();
      setAllSections(sctns);
      
      console.log(`Successfully loaded ${uniqueStudents.length} students across ${sctns.length} sections`);
      if (uniqueStudents.length === 0) {
        toast.error('No students found in the database. Please contact Admin.');
      }
    } catch (error) {
      console.error('CRITICAL: fetchStudents failed:', error);
      toast.error('Could not load student data');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [teacherData]);

  // ── Today's attendance ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const rolls = assignedStudents.map(s => s.roll_no);
      if (!rolls.length) return;
      const { data } = await supabase.from('attendance').select('student_roll, status').eq('date', today).in('student_roll', rolls);
      if (data) {
        const map: Record<number, string> = {};
        data.forEach((r: any) => { map[r.student_roll] = r.status; });
        setMarkedToday(map);
      }
    };
    load();
  }, [assignedStudents]);

  // ── Schedule & trend ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!teacherData) return;
      setScheduleLoading(true);
      try {
        const sections = Array.from(new Set(assignedStudents.map(s => s.class_section)));
        const [schedule, trend] = await Promise.all([
          getTeacherTodaySchedule(teacherData.id, teacherData.full_name, teacherData.subject_dept),
          getTeacherAttendanceTrend(sections),
        ]);
        setTodaySchedule(schedule);
        if (trend.length) setAttendanceStats(trend);
      } finally {
        setScheduleLoading(false);
      }
    };
    load();
  }, [teacherData, assignedStudents]);

  // ── Notifications & exams ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!teacherData) return;
      const notifs = await getNotifications(teacherData.id, 'TEACHER');
      setNotifications(notifs);
      const teacherSubjects = (teacherData.subject_dept || '').split(/[,|/]/).map(s => s.trim()).filter(Boolean);
      
      // Fetch all recent exams and filter locally for maximum reliability
      const { data: exs, error: examError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (examError) {
        console.error('Error fetching exams:', examError);
      }
      
      const filteredExs = (exs || []).filter(e => {
        // Use loose equality for IDs
        const isAssigned = String(e.teacher_id) === String(teacherData.id);
        
        // Subject match
        const subjectMatch = teacherSubjects.some(ts => {
          const s1 = (e.subject || '').toLowerCase().trim();
          const s2 = ts.toLowerCase().trim();
          return s1 === s2 || s1.includes(s2) || s2.includes(s1);
        });

        // Show if assigned TO this teacher OR if it matches their subject (since examiner releases it)
        return isAssigned || subjectMatch;
      });
      setExams(filteredExs);
      
      const { data: grds, error: gradeError } = await supabase.from('grades').select('*');
      if (gradeError) console.error('Error fetching grades:', gradeError);
      
      const filteredGrades = (grds || []).filter(g => 
        teacherSubjects.some(ts => {
          const s1 = (g.subject || '').toLowerCase().trim();
          const s2 = ts.toLowerCase().trim();
          return s1 === s2 || s1.includes(s2) || s2.includes(s1);
        })
      );
      setGrades(filteredGrades);

      // Fetch pending exam marks for verification request
      const { data: emRes, error: emError } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('examiner_edited', true)
        .eq('is_verified', false);
      if (emError) {
        console.error('Error fetching pending exam marks:', emError);
      } else {
        setPendingExamMarks(emRes || []);
      }
    };
    init();
    const ch3 = supabase.channel('notif-teacher').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      if (teacherData) getNotifications(teacherData.id, 'TEACHER').then(setNotifications);
    }).subscribe();

    const ch4 = supabase.channel('rv-teacher').on('postgres_changes', { event: '*', schema: 'public', table: 'result_verifications' }, async () => {
      const { data: verRes } = await supabase.from('result_verifications').select('*').eq('status', 'Pending-Teacher').order('created_at', { ascending: false });
      setVerifications(verRes || []);
    }).subscribe();

    const ch5 = supabase.channel('em-teacher').on('postgres_changes', { event: '*', schema: 'public', table: 'exam_marks' }, async () => {
      const { data: emRes } = await supabase.from('exam_marks').select('*').eq('examiner_edited', true).eq('is_verified', false);
      setPendingExamMarks(emRes || []);
    }).subscribe();

    return () => { 
      supabase.removeChannel(ch3); 
      supabase.removeChannel(ch4);
      supabase.removeChannel(ch5);
    };
  }, [teacherData]);

  // ── Load reschedule data ───────────────────────────────────────────────────
  const loadRescheduleData = async () => {
    if (!teacherData) return;
    setLoadingReschedule(true);
    const today = new Date().toISOString().split('T')[0];
    const { data: schemeData } = await supabase
      .from('scheme_of_study')
      .select('*')
      .or(`teacher_id.eq.${teacherData.id},subject.ilike.%${teacherData.subject_dept}%`)
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: false })
      .limit(30);
    const { data: reqData } = await supabase
      .from('reschedule_requests')
      .select('*, scheme_of_study(*)')
      .eq('teacher_id', teacherData.id)
      .order('created_at', { ascending: false });
    setSchemeEntries((schemeData as SchemeEntry[]) || []);
    setRescheduleRequests((reqData as RescheduleRequest[]) || []);
    setLoadingReschedule(false);
  };

  const loadNewSchedule = async () => {
    if (!teacherData) return;
    setSchedLoadingNew(true);
    try {
      const today     = new Date();
      const dayName   = today.toLocaleDateString('en-US', { weekday: 'long' });
      const monday    = new Date(today);
      const diff      = today.getDay() === 0 ? -6 : 1 - today.getDay();
      monday.setDate(today.getDate() + diff);
      const weekStart = monday.toISOString().split('T')[0];
      const todayStr  = today.toISOString().split('T')[0];

      const [{ data: todaySlots }, { data: weekSlots }] = await Promise.all([
        supabase.from('weekly_schedule').select('*').eq('teacher_id', teacherData.id).eq('week_start', weekStart).eq('day_of_week', dayName).order('period_number'),
        supabase.from('weekly_schedule').select('*').eq('teacher_id', teacherData.id).eq('week_start', weekStart).order('day_of_week').order('period_number'),
      ]);

      const addAttendance = async (slots: any[]) =>
        Promise.all(slots.map(async slot => {
          const { count: total }   = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_section', slot.class_section).eq('status', 'Active');
          const { count: present } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('subject', slot.subject).eq('date', todayStr).eq('status', 'Present');
          return { ...slot, total_students: total || 0, present_count: present || 0, att_pct: total ? Math.round(((present || 0) / total) * 100) : 0 };
        }));

      setTodayScheduleNew(await addAttendance(todaySlots || []));
      setWeekScheduleNew(await addAttendance(weekSlots || []));
    } catch(e) { console.error(e); }
    finally { setSchedLoadingNew(false); }
  };

  const loadAcademicsData = async () => {
    if (!teacherData) return;
    setLoadingAcademics(true);
    loadNewSchedule();
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const [weekly, scheme, sosRes, verRes] = await Promise.all([
        getTeacherWeeklySchedule(teacherData.id, teacherData.full_name, teacherData.subject_dept),
        getSchemeOfStudy(teacherData.id, teacherData.subject_dept),
        supabase.from('sos').select('lecture_date,subject,topic,chapter,lecture_no,status,topic_type,class_section')
          .eq('teacher_username', teacherData.username)
          .gte('lecture_date', weekStart.toISOString().split('T')[0])
          .lte('lecture_date', weekEnd.toISOString().split('T')[0])
          .order('lecture_date'),
        supabase.from('result_verifications').select('*').eq('status', 'Pending-Teacher').order('created_at', { ascending: false })
      ]);
      setFullWeeklySchedule(weekly);
      setCourseProgressData(scheme);
      setWeekSos(sosRes.data || []);
      setVerifications(verRes.data || []);
    } catch (err) {
      console.error('Error loading academics data:', err);
    } finally {
      setLoadingAcademics(false);
    }
  };

  const checkOverdueVerifications = async () => {
    if (!verifications.length) return;
    const overdue = verifications.filter(v => {
      if (v.status !== 'Pending-Teacher') return false;
      const tDeadline = new Date(v.teacher_deadline);
      return tDeadline < new Date();
    });

    for (const v of overdue) {
      // Auto-escalate to Examiner
      await supabase.from('result_verifications').update({ 
        status: 'Pending-Examiner',
        system_note: 'Auto-escalated: Teacher failed to resolve within 24h'
      }).eq('id', v.id);

      // Notify Examiner (Broadcasting to admin_notifications)
      await supabase.from('admin_notifications').insert([{
        sender: 'System Escalation',
        title: '⚠️ Escalated Correction Order',
        message: `Verification for ${v.student_name} (${v.subject}) has been escalated because the teacher didn't respond in time.`,
        target: 'EXAMINER',
        target_role: 'examiner',
        is_read: false,
        type: 'escalation'
      }]);
    }
    if (overdue.length > 0) loadAcademicsData();
  };

  useEffect(() => {
    loadAcademicsData();
  }, [teacherData]);

  useEffect(() => {
    if (activeTab === 'Academics' || activeTab === 'Grading') {
      checkOverdueVerifications();
    }
  }, [activeTab, verifications]);

  // ── Mark attendance ────────────────────────────────────────────────────────
  const handleMarkAttendance = async (student: Student, status: 'Present' | 'Absent' | 'Late') => {
    if (!teacherData) return;
    if (markedToday[student.roll_no]) { toast.error(`${student.full_name} already marked`); return; }
    try {
      await markAttendanceByTeacher(student, status, teacherData.id);
      setMarkedToday(prev => ({ ...prev, [student.roll_no]: status }));
      toast.success(`${student.full_name} marked ${status}${status === 'Present' ? ' (+10 XP)' : ''}`);
      const trend = await getTeacherAttendanceTrend(Array.from(new Set(assignedStudents.map(s => s.class_section))));
      if (trend.length) setAttendanceStats(trend);
    } catch (err: any) {
      if (err?.code === '23505') { setMarkedToday(prev => ({ ...prev, [student.roll_no]: status })); }
      else { toast.error(`Failed to mark attendance: ${err?.message || 'Unknown error'}`); }
    }
  };

  // ── Student profile ────────────────────────────────────────────────────────
  const openStudentProfile = async (student: Student) => {
    setSelectedStudentProfile(student);
    setShowStudentProfile(true);
    setLoadingProfile(true);
    const [fees, { data: att }] = await Promise.all([
      getFeesByRollNo(student.roll_no),
      supabase.from('attendance').select('*').eq('student_roll', student.roll_no).order('date', { ascending: false }).limit(10)
    ]);
    setStudentFees(fees);
    setStudentAttendance(att || []);
    setLoadingProfile(false);
  };

  // ── Submit grades ──────────────────────────────────────────────────────────
  const getGradeLetterFromPct = (p: number) => {
    if (p >= 85) return 'A+';
    if (p >= 75) return 'A';
    if (p >= 65) return 'B';
    if (p >= 55) return 'C';
    if (p >= 45) return 'D';
    return 'F';
  };

  const handleSubmitGrades = async () => {
    if (!teacherData) return;
    if (Object.keys(studentScores).length === 0) { toast.error('No marks entered'); return; }
    if (!selectedExam && !newGradeChapter.trim()) { toast.error('Enter chapter/test name'); return; }
    
    setGradingLoading(true);
    try {
      const chapterName = selectedExam ? (selectedExam.title || (selectedExam as any).chapter_name) : newGradeChapter;
      const finalTotalMarks = selectedExam ? selectedExam.total_marks : totalMarks;
      const examId = selectedExam?.id;
      
      const newGrades = Object.entries(studentScores).map(([roll, score]) => {
        const obtained = Number(score);
        const percentage = (obtained / finalTotalMarks) * 100;
        
        return {
          student_roll: roll, 
          chapter_name: chapterName, 
          subject: teacherData.subject_dept || 'General',
          score: obtained, 
          total_marks: finalTotalMarks, 
          exam_id: examId,
          is_verified: false,
          percentage: percentage.toFixed(2),
          grade_letter: getGradeLetterFromPct(percentage),
          entered_by: teacherData.full_name
        };
      });

      // 1. Add to grades table
      const { error: gradeErr } = await supabase.from('grades').insert(newGrades);
      if (gradeErr) throw gradeErr;
      
      // 2. Update exam status if it was an exam
      if (selectedExam) {
        await supabase.from('exams').update({ 
          grading_status: 'Completed',
          status: 'Completed'
        }).eq('id', selectedExam.id);
      }

      // 3. Notify Examiner System
      await supabase.from('notifications').insert([{
        target_role: 'EXAMINER',
        title: 'Pending Result Verification',
        message: `${teacherData.full_name} has submitted grades for ${chapterName}. Review and verify required.`,
        type: 'exam_results_pending'
      }]);

      // 4. Generate/Update Result Cards for Examiner view
      const resultCardPromises = Object.entries(studentScores).map(([roll, score]) => {
        const obtained = Number(score);
        const pct = (obtained / finalTotalMarks) * 100;
        
        return supabase.from('result_cards').upsert({
          student_roll: Number(roll),
          exam_name: chapterName,
          subject: teacherData.subject_dept || 'General',
          status: 'PENDING',
          obtained_marks: obtained,
          total_marks: finalTotalMarks,
          overall_percentage: pct,
          teacher_id: teacherData.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_roll,exam_name,subject' });
      });
      await Promise.all(resultCardPromises);

      // Refresh local grades
      const teacherSubjects = (teacherData.subject_dept || '').split(/[,|/]/).map(s => s.trim()).filter(Boolean);
      const { data: grds } = await supabase.from('grades').select('*');
      const filteredGrades = (grds || []).filter(g => 
        teacherSubjects.some(ts => {
          const s1 = (g.subject || '').toLowerCase().trim();
          const s2 = ts.toLowerCase().trim();
          return s1 === s2 || s1.includes(s2) || s2.includes(s1);
        })
      );
      setGrades(filteredGrades);
      
      setShowGradeModal(false); 
      setStudentScores({}); 
      setNewGradeChapter(''); 
      setSelectedExam(null);
      
      toast.success('Grades submitted for examiner verification!');
    } catch (error: any) { 
      console.error('Error submitting grades:', error);
      toast.error('Failed to submit grades'); 
    }
    finally { setGradingLoading(false); }
  };

  // ── Submit reschedule request ──────────────────────────────────────────────
  const handleSubmitReschedule = async () => {
    if (!selectedSchemeEntry || !teacherData) return;
    if (!proposedDate) { toast.error('Pick a new date'); return; }
    if (proposedDate <= selectedSchemeEntry.scheduled_date) { toast.error('New date must be after the original date'); return; }
    setSubmittingReschedule(true);
    try {
      const { error: reqErr } = await supabase.from('reschedule_requests').insert([{
        scheme_id: selectedSchemeEntry.id,
        teacher_id: teacherData.id,
        original_date: selectedSchemeEntry.scheduled_date,
        original_week: selectedSchemeEntry.week_no,
        proposed_date: proposedDate,
        reason: rescheduleReason.trim() || null,
        status: 'pending',
      }]);
      if (reqErr) throw reqErr;
      // Notify Director, Academics, Principal
      const { data: notifTargets } = await supabase.from('admins').select('id, role').in('role', ['DIRECTOR', 'ACADEMICS', 'PRINCIPAL']);
      if (notifTargets && notifTargets.length > 0) {
        const formattedOriginal = new Date(selectedSchemeEntry.scheduled_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
        const formattedNew = new Date(proposedDate).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
        const notifRows = notifTargets.map((a: any) => ({
          target_user_id: a.id,
          title: `📅 Reschedule Request: ${selectedSchemeEntry.topic}`,
          message: `${selectedSchemeEntry.subject} (${selectedSchemeEntry.class_section}) — Original: ${formattedOriginal}${selectedSchemeEntry.week_no ? ` (Week ${selectedSchemeEntry.week_no})` : ''}. Requested new date: ${formattedNew}.${rescheduleReason.trim() ? ` Reason: ${rescheduleReason.trim()}` : ''}`,
          type: 'reschedule',
          target_role: a.role,
        }));
        await supabase.from('notifications').insert(notifRows);
      }
      toast.success('Request submitted — Director & Academics notified');
      setShowRescheduleModal(false); setProposedDate(''); setRescheduleReason(''); setSelectedSchemeEntry(null);
      loadRescheduleData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit request');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const submitDailyQuiz = async () => {
    if (!teacherData) return;
    if (!quizForm.targetClass) {
      toast.error('Select a target class');
      return;
    }
    const emptyQ = quizForm.questions.find(q => !q.q || q.a.some(opt => !opt));
    if (emptyQ) {
      toast.error('Please fill all questions and options');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('daily_quizzes').insert([{
        teacher_id: teacherData.id,
        teacher_name: teacherData.full_name,
        target_class: quizForm.targetClass,
        questions: quizForm.questions,
        quiz_date: today,
        is_active: true,
        xp_reward: 30,
        coin_reward: 10
      }]);

      if (error) throw error;

      toast.success(`Quiz successfully sent to ${quizForm.targetClass}`);
      setShowQuizCreator(false);
      setQuizForm({
        targetClass: "",
        questions: Array(5).fill(0).map(() => ({ q: "", a: ["", "", "", ""], correct_index: 0 }))
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const classes = allSections.length > 0 ? allSections : Array.from(new Set(assignedStudents.map(s => s.class_section)));
  const filteredStudents = assignedStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = s.full_name.toLowerCase().includes(q) || String(s.roll_no).includes(q);
    const classFilter = subPage === 'Attendance' ? modalSelectedClass : selectedClass;
    return matchSearch && (classFilter ? s.class_section === classFilter : true);
  });
  const isGirl = (s: Student) => {
    const sec = s.class_section.toUpperCase();
    return (sec.endsWith('G') || sec.includes('-G')) && !['MUHAMMAD', 'AHMAD', 'ALI', 'HAMZA'].some(n => s.full_name.toUpperCase().startsWith(n));
  };
  const girls = filteredStudents.filter(isGirl);
  const boys = filteredStudents.filter(s => !isGirl(s));
  const classAverage = grades.length ? Math.round(grades.reduce((a, g) => a + g.score / g.total_marks * 100, 0) / grades.length) : 0;
  const highestGrade = grades.length ? Math.max(...grades.map(g => Math.round(g.score / g.total_marks * 100))) : 0;
  const gradeDistribution = [
    { label: 'A', count: grades.filter(g => g.score / g.total_marks >= 0.8).length },
    { label: 'B', count: grades.filter(g => g.score / g.total_marks >= 0.7 && g.score / g.total_marks < 0.8).length },
    { label: 'C', count: grades.filter(g => g.score / g.total_marks >= 0.6 && g.score / g.total_marks < 0.7).length },
    { label: 'D', count: grades.filter(g => g.score / g.total_marks >= 0.5 && g.score / g.total_marks < 0.6).length },
    { label: 'F', count: grades.filter(g => g.score / g.total_marks < 0.5).length },
  ];
  const getAttendanceBadge = (roll: number) => {
    const s = markedToday[roll]; if (!s) return null;
    const c: Record<string, string> = { Present: 'bg-emerald-100 text-emerald-700', Late: 'bg-amber-100 text-amber-700', Absent: 'bg-rose-100 text-rose-700' };
    return <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-full', c[s])}>{s}</span>;
  };
  const alreadyRequested = (schemeId: string) => rescheduleRequests.some(r => r.scheme_id === schemeId && r.status === 'pending');
  const rescheduleStatusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  // ── Sub-page renderer ──────────────────────────────────────────────────────
  const renderSubPage = () => {
    switch (subPage) {

      // ── Attendance ──────────────────────────────────────────────────────────
      case 'Attendance':
        return (
          <motion.div key="att" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
                <h3 className="text-xl font-black text-slate-900">Mark Attendance</h3>
              </div>
              <select value={modalSelectedClass || ''} onChange={e => setModalSelectedClass(e.target.value || null)} className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm">
                <option value="">All Sections</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Present', color: 'emerald', count: Object.values(markedToday).filter(s => s === 'Present').length },
                { label: 'Late', color: 'orange', count: Object.values(markedToday).filter(s => s === 'Late').length },
                { label: 'Absent', color: 'rose', count: Object.values(markedToday).filter(s => s === 'Absent').length }
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</p>
                  <p className={`text-2xl font-black text-${stat.color}-500`}>{stat.count}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." className="w-full bg-slate-50 rounded-xl py-3 pl-12 pr-4 text-sm outline-none border-none" /></div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {filteredStudents.length === 0 && <div className="p-8 text-center text-slate-400 font-bold">No students found</div>}
                {filteredStudents.map((student, idx) => (
                  <div key={`att-row-${student.id || student.roll_no || idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{student.full_name[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{student.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">{String(student.roll_no)} • {student.class_section} {getAttendanceBadge(student.roll_no)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(['Present', 'Late', 'Absent'] as const).map(status => {
                        const already = markedToday[student.roll_no]; const isMarked = already === status;
                        const c: Record<string, string> = { Present: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white', Late: 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white', Absent: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' };
                        return <button key={`${student.roll_no || student.id || idx}-${status}`} onClick={() => handleMarkAttendance(student, status)} disabled={!!already} className={cn('px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all', isMarked && 'ring-2 ring-offset-1 ring-current', already && !isMarked && 'opacity-30 cursor-not-allowed', c[status])}>{status}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      // ── Result Verifications ───────────────────────────────────────────────
      case 'ResultVerifications':
        return (
          <motion.div key="rv" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"><ChevronLeft size={20} /></button>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Verification Center</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time Approval & Processing</p>
                </div>
              </div>
              
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 self-start md:self-auto">
                <button 
                  onClick={() => setVerTab('claim_orders')}
                  className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", verTab === 'claim_orders' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                >
                  Correction Claims ({verifications.length})
                </button>
                <button 
                  onClick={() => setVerTab('exam_marks')}
                  className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all", verTab === 'exam_marks' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                >
                  Marks Re-verification ({pendingExamMarks.length})
                </button>
              </div>
            </div>

            {verTab === 'claim_orders' ? (
              verifications.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-300">
                    <CheckSquare size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">No active correction requests.</p>
                  <p className="text-[11px] text-slate-300 mt-2 font-medium tracking-wide">Pending requests from students will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map(v => {
                     const diff = new Date(v.teacher_deadline).getTime() - new Date().getTime();
                     const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
                     const isUrgent = hoursLeft < 4;

                     return (
                      <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className={cn("absolute top-0 left-0 w-1.5 h-full", isUrgent ? "bg-rose-500" : "bg-amber-500")} />
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isUrgent ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>
                              <Clock size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.student_roll} · {v.student_name}</p>
                              <h4 className="font-black text-slate-900 leading-tight">{v.subject} — {v.exam_name}</h4>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-xs font-black uppercase tracking-tighter", isUrgent ? "text-rose-600 animate-pulse" : "text-amber-600")}>
                               {hoursLeft}H REMAINING
                            </p>
                            <p className="text-[9px] font-bold text-slate-300 mt-0.5">Escalates to Examiner soon</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FileText size={10}/> Student's Reason: {v.reason}</p>
                          <p className="text-xs text-slate-600 font-bold leading-relaxed italic">"{v.detail}"</p>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              const note = prompt("Enter resolution notes (e.g. Corrected to 85 marks):");
                              if (note) handleResolveVerification(v, 'Resolved', note);
                            }}
                            disabled={submittingVerAction}
                            className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                          >
                            Mark Resolved
                          </button>
                          <button 
                            onClick={() => {
                              const note = prompt("Enter reason for rejection:");
                              if (note) handleResolveVerification(v, 'Rejected', note);
                            }}
                            disabled={submittingVerAction}
                            className="flex-1 py-4 rounded-2xl bg-white text-rose-600 font-black text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-50 transition-all disabled:opacity-50"
                          >
                            Reject Request
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              pendingExamMarks.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400">
                    <CheckSquare size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">No active exam marks verification requests.</p>
                  <p className="text-[11px] text-slate-300 mt-2 font-medium tracking-wide">Pending verification requests from students will show up here in real time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingExamMarks.map(em => (
                    <motion.div key={em.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckSquare size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Roll: {em.student_roll}</p>
                            <h4 className="font-black text-slate-900 leading-tight">{em.subject} — Marks Verification Request</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                            Pending Verification
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obtained Marks</p>
                          <p className="text-lg font-black text-slate-850">{em.marks_obtained}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Marks</p>
                          <p className="text-lg font-black text-slate-850">{em.total_marks || '100'}</p>
                        </div>
                        <div className="col-span-2 text-left">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Comments</p>
                          <p className="text-xs text-slate-600 font-bold truncate">{em.remarks || 'Verification Requested by Student'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            const newMarks = prompt(`Enter revised marks (Current: ${em.marks_obtained}):`, em.marks_obtained);
                            if (newMarks === null) return;
                            const comment = prompt("Enter verification remarks:", "Marks verified and confirmed by teacher.");
                            if (comment === null) return;
                            handleResolveExamMark(em, Number(newMarks), comment);
                          }}
                          disabled={submittingVerAction}
                          className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          Process & Verify Marks
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        );

      // ── Lecture Info ────────────────────────────────────────────────────────
      case 'LectureInfo':
        return (
          <motion.div key="lecture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <h3 className="text-xl font-black text-slate-900">Lecture Details</h3>
            </div>
            {selectedItem && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4"><BookOpen size={40} /></div>
                  <h4 className="text-2xl font-black text-[#2D3494]">{selectedItem.subject}</h4>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedItem.class_section}</p>
                </div>
                {[
                  { icon: Clock, label: 'Time', value: `${formatTime(selectedItem.start_time).time} ${formatTime(selectedItem.start_time).period} — ${formatTime(selectedItem.end_time).time} ${formatTime(selectedItem.end_time).period}` },
                  { icon: MapPin, label: 'Room', value: selectedItem.room || 'Not assigned' },
                  { icon: GraduationCap, label: 'Campus', value: selectedItem.campus || 'Main Campus' },
                  { icon: Users, label: 'Students Present Today', value: (() => {
                    const total = assignedStudents.filter(s => s.class_section === selectedItem.class_section).length;
                    const present = Object.entries(markedToday).filter(([roll, status]) => 
                      status === 'Present' && assignedStudents.find(s => s.roll_no === Number(roll) && s.class_section === selectedItem.class_section)
                    ).length;
                    return `${present} / ${total}`;
                  })() },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><Icon size={20} /></div>
                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p><p className="text-sm font-bold text-slate-800">{value}</p></div>
                  </div>
                ))}
              {/* Today's SOS Topic */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const sosTopic = weekSos.find(s =>
                    s.subject === selectedItem?.subject &&
                    s.lecture_date === todayStr
                  );
                  return sosTopic ? (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">📖 Today's Topic (SOS)</p>
                      <p className="text-sm font-black text-indigo-900">{sosTopic.topic}</p>
                      <p className="text-[10px] text-indigo-400 mt-1">{sosTopic.chapter} · Lecture #{sosTopic.lecture_no}</p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📖 Today's Topic</p>
                      <p className="text-xs text-slate-400 mt-1 italic">No SOS entry found for today's lecture</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        );

      // ── Planner ─────────────────────────────────────────────────────────────
      case 'Planner':
        return (
          <motion.div key="planner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <h3 className="text-2xl font-black text-slate-900">Academic Roadmap</h3>
            </div>
            <div className="relative space-y-12 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
              {[
                { month: 'September', title: 'Session Kickoff', status: 'Completed', items: ['Orientation', 'Chapter 1', 'Assessment'] },
                { month: 'October', title: 'Mid-Term Prep', status: 'In Progress', items: ['Chapter 2 & 3', 'Lab Work', 'Quiz 1'] },
                { month: 'November', title: 'Advanced Topics', status: 'Upcoming', items: ['Chapter 4', 'Project', 'Guest Lecture'] },
                { month: 'December', title: 'Winter Finals', status: 'Upcoming', items: ['Revision', 'Final Exams', 'Winter Break'] },
              ].map(phase => (
                <div key={phase.month} className="relative pl-20">
                  <div className={cn("absolute left-6 top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10", phase.status === 'Completed' ? "bg-emerald-500" : phase.status === 'In Progress' ? "bg-blue-500 animate-pulse" : "bg-slate-200")} />
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">{phase.month}</span>
                      <span className={cn("px-3 py-1 rounded-full text-[8px] font-bold uppercase", phase.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : phase.status === 'In Progress' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400")}>{phase.status}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-4">{phase.title}</h4>
                    <div className="grid grid-cols-3 gap-4">{phase.items.map(item => <div key={item} className="p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-600 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{item}</div>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      // ── Student Tests ────────────────────────────────────────────────────────
      case 'StudentTests':
        return (
          <motion.div key="tests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <h3 className="text-xl font-black text-slate-900">Tests — {selectedItem?.full_name}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
              {grades.filter(g => String(g.student_roll) === String(selectedItem?.roll_no)).length === 0
                ? <p className="text-center text-slate-400 py-8">No results yet.</p>
                : grades.filter(g => String(g.student_roll) === String(selectedItem?.roll_no)).map(g => {
                    const matchingExam = exams.find(e => String(e.id) === String(g.exam_id));
                    const displayName = matchingExam ? (matchingExam.chapter_name || matchingExam.title) : (g.chapter_name || 'Class Assessment');
                    return (
                      <div key={`g-${g.id}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{displayName}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{g.subject}</p>
                        </div>
                        <span className="text-lg font-black text-[#2D3494]">{g.score}/{g.total_marks} <span className="text-xs text-slate-400">({Math.round(g.score / g.total_marks * 100)}%)</span></span>
                      </div>
                    );
                  })}
            </div>
          </motion.div>
        );

      // ── Notifications ────────────────────────────────────────────────────────
      case 'Notifications':
        return (
          <motion.div key="notifs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <h3 className="text-xl font-black text-slate-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map(n => (
                <motion.div 
                  key={`n-${n.id}`} 
                  whileHover={{ y: -2 }}
                  onClick={() => { setSelectedNotif(n); setShowNotifModal(true); }}
                  className={cn(
                    "bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all relative overflow-hidden",
                    !n.is_read && "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                </motion.div>
              )) : <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center"><p className="text-slate-400">No new notifications</p></div>}
            </div>
          </motion.div>
        );

      // ── Scheme Progress ──────────────────────────────────────────────────
      case 'SchemeProgress':
        return (
          <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900">Course Progress</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mark topics as completed to generate student quizzes</p>
              </div>
            </div>

            <div className="space-y-4">
              {schemeEntries.map(entry => {
                const isCompleted = entry.status === 'Completed';
                return (
                  <div key={entry.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Week {entry.week_no}</span>
                        {isCompleted && <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 size={10} /> Completed</span>}
                      </div>
                      <h4 className="font-black text-slate-900 truncate">{entry.topic}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{entry.class_section} • {new Date(entry.scheduled_date).toLocaleDateString()}</p>
                    </div>
                    {!isCompleted ? (
                      <button 
                        onClick={async () => {
                          if (!confirm(`Mark "${entry.topic}" as completed? This will generate a daily quiz for students.`)) return;
                          setLoadingReschedule(true);
                          try {
                            const { error } = await supabase.from('scheme_of_study').update({ 
                              status: 'Scheduled',
                              is_delivered: false,
                              delivered_date: null,
                              completed_at: null
                            }).eq('id', entry.id);
                            
                            if (error) throw error;
                            
                            // ── AUTOMATED QUIZ GENERATION ──
                            // Note: In a real app, this would call an AI function or use a questions bank.
                            // Here we use a sample 5-MCQ set as a placeholder.
                            const questions = [
                              { q: `Basic concept question 1 about ${entry.topic}?`, a: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], correct_index: 0 },
                              { q: `Key definition in ${entry.topic}?`, a: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], correct_index: 1 },
                              { q: `Application of ${entry.topic}?`, a: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], correct_index: 2 },
                              { q: `What is true about ${entry.topic}?`, a: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], correct_index: 3 },
                              { q: `Example of ${entry.topic}?`, a: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], correct_index: 0 },
                            ];
                            
                            await supabase.from('daily_quizzes').insert([{
                              teacher_id: teacherData?.id,
                              teacher_name: teacherData?.full_name,
                              target_class: entry.class_section,
                              questions: questions,
                              quiz_date: new Date().toISOString().split('T')[0],
                              is_active: true,
                              xp_reward: 30,
                              coin_reward: 10
                            }]);

                            toast.success('Topic completed! Quiz generated for students.');
                            loadRescheduleData();
                          } catch (err: any) {
                            toast.error(err.message);
                          } finally {
                            setLoadingReschedule(false);
                          }
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                      >
                        Mark as Completed
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                  </div>
                );
              })}
              {schemeEntries.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <BookOpen size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-bold">No topics found in your scheme.</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      // ── Reschedule ───────────────────────────────────────────────────────────
      case 'Reschedule':
        return (
          <motion.div key="reschedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900">Reschedule Topics</h3>
                <p className="text-xs text-slate-400 mt-0.5">Request a new date for uncovered topics</p>
              </div>
            </div>

            {loadingReschedule ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
              <>
                {/* Scheme entries */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recent Scheduled Topics</h4>
                  {schemeEntries.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 p-12 rounded-[2rem] text-center">
                      <p className="text-slate-400 font-bold">No scheme entries found</p>
                      <p className="text-xs text-slate-300 mt-1">Make sure scheme_of_study has records for your teacher ID</p>
                    </div>
                  ) : (
                    schemeEntries.map(entry => {
                      const req = rescheduleRequests.find(r => r.scheme_id === entry.id);
                      return (
                        <div key={entry.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-start gap-4 shadow-sm">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2D3494] flex items-center justify-center shrink-0"><BookOpen size={22} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm">{entry.topic}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                              {entry.subject} · {entry.class_section}{entry.week_no ? ` · Week ${entry.week_no}` : ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Calendar size={11} />
                              Originally: {new Date(entry.scheduled_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            {req && (
                              <p className="text-xs mt-1 flex items-center gap-1 text-slate-400">
                                <RefreshCw size={11} />
                                Requested: {new Date(req.proposed_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {req ? (
                              <span className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border', rescheduleStatusColors[req.status])}>
                                {req.status === 'approved' ? <CheckCircle2 size={12} /> : req.status === 'rejected' ? <X size={12} /> : <Clock size={12} />}
                                {req.status}
                              </span>
                            ) : (
                              <button
                                onClick={() => { setSelectedSchemeEntry(entry); setShowRescheduleModal(true); }}
                                className="px-4 py-2 bg-[#2D3494] text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-800 transition-all shadow-md"
                              >
                                Reschedule
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Past requests */}
                {rescheduleRequests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">My Requests</h4>
                    {rescheduleRequests.map(req => (
                      <div key={req.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm">
                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : req.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}>
                          {req.status === 'approved' ? <CheckCircle2 size={18} /> : req.status === 'rejected' ? <X size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-slate-900 truncate">{req.scheme_of_study?.topic || 'Topic'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            {new Date(req.original_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                            {req.original_week ? ` (Week ${req.original_week})` : ''} → {new Date(req.proposed_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border shrink-0', rescheduleStatusColors[req.status])}>
                          {req.status === 'approved' ? <CheckCircle2 size={12} /> : req.status === 'rejected' ? <X size={12} /> : <Clock size={12} />}
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        );

      // ── Exam Management ─────────────────────────────────────────────────────
      case 'ExamManagement':
        return (
          <motion.div key="exam-mgmt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900">Exam Management</h3>
                <p className="text-xs text-slate-400 mt-0.5">Duty charts and paper receiving</p>
              </div>
            </div>

            {loadingExams ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
              <div className="space-y-8">
                {/* Duty Chart */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserCheck size={14} className="text-indigo-500" /> Assigned invigilation Duties
                  </h4>
                  {duties.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 p-8 rounded-[2rem] text-center text-slate-400 font-bold">No duties assigned</div>
                  ) : (
                    duties.map(duty => (
                      <div key={duty.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Clock size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm">{duty.exam_type} - {duty.duty_shift}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Room: {duty.room_no} · Date: {new Date(duty.exam_date).toLocaleDateString()}</p>
                          {duty.reported_at && <p className="text-[9px] text-emerald-500 font-bold mt-1">Reported at {new Date(duty.reported_at).toLocaleTimeString()}</p>}
                        </div>
                        {duty.status === 'Pending' ? (
                          <button
                            onClick={() => handleReportPresent(duty.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md"
                          >
                            Report Present
                          </button>
                        ) : (
                          <Badge c="bg-emerald-50 text-emerald-600 border-emerald-100" label="Reported" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Paper Receiving */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Inbox size={14} className="text-amber-500" /> Paper Receiving Requests
                  </h4>
                  {performaRequests.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 p-8 rounded-[2rem] text-center text-slate-400 font-bold">No paper requests</div>
                  ) : (
                    performaRequests.map(req => (
                      <div key={req.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm">{req.subject} - {req.exam_type}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{req.class_section} · Total: {req.total_papers}</p>
                          {req.confirmed_at && <p className="text-[9px] text-emerald-500 font-bold mt-1">Confirmed at {new Date(req.confirmed_at).toLocaleTimeString()}</p>}
                        </div>
                        {req.status === 'Pending' ? (
                          <button
                            onClick={() => handleConfirmPaper(req.id)}
                            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 transition-all shadow-md"
                          >
                            Confirm Receipt
                          </button>
                        ) : (
                          <Badge c="bg-emerald-50 text-emerald-600 border-emerald-100" label="Confirmed" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Notices & Documents */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <FileText size={14} className="text-purple-500" /> Notices & Documents
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {notices.map(doc => (
                      <a 
                        key={doc.id} 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-purple-200 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-all">
                          {doc.file_type === 'pdf' ? <FileText size={18} /> : <FileImage size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm truncate">{doc.title}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))}
                    {notices.length === 0 && <div className="bg-white border border-dashed border-slate-200 p-8 rounded-2xl text-center text-slate-400">No recent notices</div>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 'WeeklySchedule':
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return (
          <motion.div key="weekly-schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900">Weekly Schedule</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your complete lecture timetable</p>
              </div>
            </div>

            <div className="space-y-8">
              {days.map(day => {
                const daySlots = fullWeeklySchedule.filter(s => s.day_of_week === day);
                return (
                  <div key={day} className="space-y-4">
                    <h4 className="text-sm font-black text-[#2D3494] px-4 flex items-center gap-2">
                       <Calendar size={16} /> {day}
                    </h4>
                    {daySlots.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-2xl text-center text-[10px] text-slate-400">No classes</div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map(slot => {
                          const { time, period } = formatTime(slot.start_time);
                          return (
                            <div key={slot.timetable_id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                              <div className="text-center w-12 shrink-0">
                                <p className="text-xs font-black text-slate-900">{time}</p>
                                <p className="text-[8px] text-slate-400 uppercase font-bold">{period}</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">{slot.subject}</p>
                                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 rounded-md w-fit mt-1">{displaySection(slot.class_section)}</p>
                                {(() => {
                                  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day
                                    ? new Date().toISOString().split('T')[0] : null;
                                  const sosTopic = todayStr ? weekSos.find(s =>
                                    s.subject === slot.subject &&
                                    s.lecture_date === todayStr
                                  ) : null;
                                  return sosTopic ? (
                                    <div className="mt-1.5 flex items-start gap-1.5">
                                      <span className="text-[9px]">📖</span>
                                      <p className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md leading-snug">{sosTopic.topic}</p>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 justify-end"><MapPin size={10} /> {slot.room || 'TBA'}</p>
                                {slot.campus && <p className="text-[9px] text-slate-300 mt-0.5">{slot.campus}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      case 'FullScheme':
        return (
          <motion.div key="full-scheme" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubPage(null)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-black text-slate-900">Academic Roadmap</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track your course progress and upcoming topics</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Progress Summary */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  icon={BookCheck} 
                  label="Topics Completed" 
                  value={courseProgressData.filter(e => e.status === 'Completed').length} 
                  color="bg-emerald-50 text-emerald-600" 
                />
                <StatCard 
                  icon={BookOpen} 
                  label="Completion" 
                  value={courseProgressData.length > 0 ? `${Math.round((courseProgressData.filter(e => e.status === 'Completed').length / courseProgressData.length) * 100)}%` : '0%'} 
                  color="bg-blue-50 text-blue-600" 
                />
              </div>

              {/* Timeline */}
              <div className="space-y-4 relative">
                <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-100" />
                {courseProgressData.map((item, idx) => (
                  <div key={item.id} className="flex gap-4 items-start relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm",
                      item.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border-slate-100"
                    )}>
                      {item.status === 'Completed' ? <CheckCircle2 size={18} /> : <span>{idx + 1}</span>}
                    </div>
                    <div className={cn(
                      "flex-1 p-5 rounded-3xl border transition-all",
                      item.status === 'Completed' ? "bg-white border-emerald-100 opacity-60" : "bg-white border-slate-100 shadow-sm"
                    )}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#2D3494] uppercase tracking-widest">{item.subject}</p>
                          <h4 className="text-sm font-black text-slate-900 mt-1">{item.topic}</h4>
                        </div>
                        {item.status === 'Completed' ? (
                          <Badge c="bg-emerald-50 text-emerald-600 border-emerald-100" label="Completed" />
                        ) : (
                          <p className="text-[10px] font-bold text-slate-400 capitalize">{item.status}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Calendar size={12} /> {new Date(item.scheduled_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </div>
                        {item.week_no && (
                          <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">WEEK {item.week_no}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default: return null;
    }
  };


  const TUTORIAL_STEPS = [
    {
      title: "Welcome, Teacher!",
      content: "This is your secondary home at PIC. Manage your classes, attendance, and academics from here.",
      target: "Home"
    },
    {
      title: "Attendance & Students",
      content: "Quickly mark student attendance and view detailed profiles of your assigned students.",
      target: "Students"
    },
    {
      title: "Academic Progress",
      content: "Track your syllabus coverage, chapters, and upcoming lesson plans seamlessly.",
      target: "Academics"
    },
    {
      title: "Grading & Results",
      content: "Post test results and monitor your students' performance trends throughout the term.",
      target: "Grading"
    },
    {
      title: "Notifications",
      content: "Never miss an update from the administration or coordinator.",
      target: "Home"
    }
  ];

  const TutorialOverlay = () => {
    if (!showTutorial) return null;
    const step = TUTORIAL_STEPS[tutorialStep];

    const nextStep = () => {
      if (tutorialStep < TUTORIAL_STEPS.length - 1) {
        setTutorialStep(s => s + 1);
        if (TUTORIAL_STEPS[tutorialStep + 1].target) {
          setActiveTab(TUTORIAL_STEPS[tutorialStep + 1].target);
        }
      } else {
        setShowTutorial(false);
        setTutorialStep(0);
      }
    };

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => setShowTutorial(false)}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100"
        >
          <div className="h-2 w-full bg-slate-100">
            <motion.div 
              className="h-full bg-[#2D3494]" 
              initial={{ width: 0 }}
              animate={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>
          <div className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#2D3494] mb-6">
              <HelpCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{step.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">{step.content}</p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</p>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="px-6 py-3 rounded-2xl bg-[#2D3494] text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/20"
              >
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Finish Tour" : "Next Step"}
              </motion.button>
            </div>
          </div>
          <button 
            onClick={() => setShowTutorial(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-100 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D3494] flex items-center justify-center text-white shadow-lg shadow-blue-200"><GraduationCap size={24} /></div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black text-[#2D3494] leading-none uppercase tracking-tight">Pak Informatics</h2>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Group of Colleges</p>
          </div>
          <div className="sm:hidden">
            <h2 className="text-sm font-black text-[#2D3494] leading-none uppercase tracking-tight">PIC</h2>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Teacher Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={fetchStudents} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-blue-50 transition-colors" title="Refresh Data">
            <RefreshCw size={18} className={cn("text-slate-600", studentsLoading && "animate-spin")} />
          </button>
          <button onClick={() => { setTutorialStep(0); setShowTutorial(true); }} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-blue-50 transition-colors" title="Help Guide">
            <HelpCircle size={18} className="text-slate-600" />
          </button>
              <button onClick={() => setSubPage('Notifications')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center relative hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-slate-600" />
            {notifications.length > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border-2 border-white shadow-sm">
            {teacherData?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'T'}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <AnimatePresence mode="wait">
          {subPage ? renderSubPage() : (
            <>
              {/* ── HOME ── */}
              {activeTab === 'Home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">Welcome, {teacherData?.full_name?.split(' ')[0] || 'Professor'}</h1>
                    <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Today's Agenda</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard icon={Users} label="Assigned Students" value={studentsLoading ? '...' : assignedStudents.length} color="bg-blue-50 text-blue-600" />
                    <StatCard 
                      icon={BookMarked} 
                      label="Course Progress" 
                      value={courseProgressData.length > 0 ? `${Math.round((courseProgressData.filter(e => e.status === 'Completed').length / courseProgressData.length) * 100)}%` : '0%'} 
                      color="bg-emerald-50 text-emerald-600" 
                    />
                    <StatCard icon={CheckCircle2} label="Marked Today" value={Object.keys(markedToday).length} color="bg-orange-50 text-orange-600" />
                    <StatCard icon={Bell} label="Notifications" value={notifications.length} color="bg-purple-50 text-purple-600" />
                  </div>

                  {/* Next Lecture Widget */}
                  {(() => {
                    const now = new Date();
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const nextSlot = todaySchedule.find(s => s.start_time > currentTimeStr);
                    
                    if (nextSlot) {
                      const { time, period } = formatTime(nextSlot.start_time);
                      return (
                        <div onClick={() => setSubPage('WeeklySchedule')} className="bg-[#2D3494] p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 cursor-pointer group overflow-hidden relative">
                          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Clock size={160} /></div>
                          <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Next Lecture</span>
                            <div className="flex items-end justify-between mt-4">
                              <div>
                                <h4 className="text-2xl font-black">{nextSlot.subject}</h4>
                                <p className="text-sm font-bold text-blue-200 mt-1">{nextSlot.class_section} • Room {nextSlot.room || 'TBA'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-black">{time}</p>
                                <p className="text-xs font-bold text-blue-300 uppercase leading-none">{period}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Weekly Attendance Trend</h3>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={attendanceStats}>
                        <defs><linearGradient id="cpg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#cpg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-lg font-black text-slate-900">Recent Notifications</h3>
                       <button onClick={() => setSubPage('Notifications')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">See All →</button>
                    </div>
                    <div className="space-y-3">
                      {notifications.slice(0, 3).map(n => (
                        <div key={n.id} onClick={() => { setSelectedNotif(n); setShowNotifModal(true); }} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-all group">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", n.is_read ? 'bg-white border-slate-100 text-slate-400' : 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-100')}>
                             {n.type === 'DUTY' ? <CheckCircle2 size={18}/> : <Bell size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className={cn("text-sm font-black truncate", n.is_read ? 'text-slate-500' : 'text-slate-900')}>{n.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{new Date(n.created_at).toLocaleDateString()}</p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                        </div>
                      ))}
                      {!notifications.length && <p className="text-center py-4 text-slate-400 italic text-xs font-bold">No new messages</p>}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-lg font-black text-slate-900">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Attendance', icon: CheckSquare, color: 'bg-blue-500 text-white hover:bg-blue-600', action: () => setSubPage('Attendance') },
                        { label: 'Full Schedule', icon: Calendar, color: 'bg-indigo-500 text-white hover:bg-indigo-600', action: () => setSubPage('WeeklySchedule') },
                        { label: 'Post Grades', icon: GraduationCap, color: 'bg-orange-500 text-white hover:bg-orange-600', action: () => setShowGradeModal(true) },
                        { label: 'Academic Roadmap', icon: BookMarked, color: 'bg-emerald-500 text-white hover:bg-emerald-600', action: () => setSubPage('FullScheme') },
                        { label: 'Daily Quiz', icon: Zap, color: 'bg-amber-500 text-white hover:bg-amber-600', action: () => setShowQuizCreator(true) },
                      ].map(qa => (
                        <button key={qa.label} onClick={qa.action} className={cn('p-4 rounded-3xl flex flex-col items-center gap-2 transition-all shadow-md', qa.color)}>
                          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm"><qa.icon size={20} /></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">{qa.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* ── NEW: Weekly Schedule from Examiner ── */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900">My Schedule</h3>
                      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button onClick={() => setSchedView('today')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${schedView === 'today' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Today</button>
                        <button onClick={() => setSchedView('week')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${schedView === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Week</button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                      <input value={schedSearch} onChange={e => setSchedSearch(e.target.value)} placeholder="Search subject, class, room…"
                        className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none shadow-sm" />
                    </div>

                    {schedLoadingNew ? (
                      [1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />)
                    ) : schedView === 'today' ? (
                      (() => {
                        const nowMins = new Date().getHours()*60 + new Date().getMinutes();
                        const filtered = todayScheduleNew.filter(s => !schedSearch || s.subject?.toLowerCase().includes(schedSearch.toLowerCase()) || s.class_section?.toLowerCase().includes(schedSearch.toLowerCase()) || s.room?.toLowerCase().includes(schedSearch.toLowerCase()));
                        const nextSlot = filtered.find(s => { const [h,m] = (s.start_time||'').split(':').map(Number); return (h*60+m) > nowMins; });
                        if (filtered.length === 0) return (
                          <div className="bg-white border border-dashed border-slate-200 p-12 rounded-[2.5rem] text-center">
                            <p className="text-slate-400 font-bold">No classes scheduled today</p>
                            <p className="text-xs text-slate-300 mt-1">Check with the Examiner if this seems wrong</p>
                          </div>
                        );
                        return (
                          <div className="space-y-3">
                            {filtered.map(slot => {
                              const [sh,sm] = (slot.start_time||'').split(':').map(Number);
                              const [eh,em] = (slot.end_time||'').split(':').map(Number);
                              const isNow  = nowMins >= sh*60+sm && nowMins <= eh*60+em;
                              const isDone = (eh*60+em) < nowMins;
                              const attColor = slot.att_pct >= 80 ? '#059669' : slot.att_pct >= 60 ? '#D97706' : '#C0392B';
                              const { time, period } = formatTime(slot.start_time);
                              return (
                                <div key={slot.id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all ${isNow ? 'border-[#2D3494] shadow-lg shadow-blue-100' : isDone ? 'border-slate-100 opacity-60' : 'border-slate-100'}`}>
                                  {isNow && <div className="h-1 w-full bg-[#2D3494]" />}
                                  <div className="p-5 flex items-center gap-4">
                                    {/* Period + time */}
                                    <div className="text-center w-14 shrink-0">
                                      <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black text-sm mb-1 ${isNow ? 'bg-[#2D3494] text-white' : 'bg-slate-100 text-slate-500'}`}>P{slot.period_number}</div>
                                      <p className="text-[9px] font-bold text-slate-400">{time}</p>
                                      <p className="text-[8px] text-slate-300">{period}</p>
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-slate-900">{slot.subject}</p>
                                        {isNow && <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white bg-[#2D3494]">NOW</span>}
                                        {isDone && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-400">Done</span>}
                                      </div>
                                      <p className="text-xs text-slate-500 mt-0.5">{slot.class_section}</p>
                                      {/* Attendance bar */}
                                      <div className="mt-2">
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${slot.att_pct}%`, background: attColor }} />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <p className="text-[10px] text-slate-400 font-bold">{slot.present_count}/{slot.total_students} present</p>
                                          <p className="text-[10px] font-black" style={{ color: attColor }}>{slot.att_pct}%</p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Room — big and clear */}
                                    <div className="text-right shrink-0">
                                      <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end"><MapPin size={9} />Room</p>
                                      <p className="text-2xl font-black text-slate-900">{slot.room || '?'}</p>
                                      <p className="text-[9px] text-slate-300">{slot.campus}</p>
                                    </div>
                                  </div>
                                  {slot.notes && <div className="px-5 pb-3"><p className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">📝 {slot.notes}</p></div>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    ) : (
                      // Week view
                      <div className="space-y-4">
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => {
                          const daySlots = weekScheduleNew.filter(s => s.day_of_week === day && (!schedSearch || s.subject?.toLowerCase().includes(schedSearch.toLowerCase()) || s.room?.toLowerCase().includes(schedSearch.toLowerCase())));
                          const isToday  = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                          return (
                            <div key={day} className={`bg-white rounded-[2rem] border overflow-hidden ${isToday ? 'border-[#2D3494]/30' : 'border-slate-100'}`}>
                              <div className={`px-5 py-3 flex items-center justify-between ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isToday ? 'bg-[#2D3494] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{day.slice(0,2)}</div>
                                  <p className={`font-black text-sm ${isToday ? 'text-[#2D3494]' : 'text-slate-700'}`}>{day}{isToday && <span className="ml-2 text-[9px] bg-[#2D3494] text-white px-2 py-0.5 rounded-full">Today</span>}</p>
                                </div>
                                <p className="text-xs font-bold text-slate-400">{daySlots.length} classes</p>
                              </div>
                              {daySlots.length === 0 ? (
                                <p className="px-5 py-4 text-sm text-slate-300 font-bold text-center">No classes</p>
                              ) : daySlots.map(slot => (
                                <div key={slot.id} className="flex items-center gap-4 px-5 py-3.5 border-t border-slate-50">
                                  <div className="w-14 shrink-0">
                                    <p className="text-xs font-black text-slate-700">P{slot.period_number}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{slot.start_time?.slice(0,5)}</p>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{slot.subject}</p>
                                    <p className="text-xs text-slate-500 truncate">{slot.class_section}</p>
                                  </div>
                                  {/* Room — always prominent */}
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    <MapPin size={12} className="text-slate-400" />
                                    <p className="text-base font-black text-slate-900">{slot.room || '?'}</p>
                                  </div>
                                  {/* Student count */}
                                  <div className="shrink-0 flex items-center gap-1">
                                    <Users size={12} className="text-emerald-500" />
                                    <p className="text-xs font-bold text-slate-600">{slot.present_count}/{slot.total_students}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── STUDENTS ── */}
              {activeTab === 'Students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-900">Assigned Students</h1>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase">{studentsLoading ? 'Loading...' : `${assignedStudents.length} Students`}</span>
                  </div>
                  {studentsLoading ? (
                    <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />)}</div>
                  ) : (
                    <>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button onClick={() => setSelectedClass(null)} className={cn("px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all", selectedClass === null ? "bg-[#2D3494] text-white" : "bg-white text-slate-500 border border-slate-100")}>All Classes</button>
                        {classes.map(cls => {
  const prog = assignedStudents.find(s => s.class_section === cls)?.program;
  return <button key={cls} onClick={() => setSelectedClass(cls)} className={cn("px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all", selectedClass === cls ? "bg-[#2D3494] text-white" : "bg-white text-slate-500 border border-slate-100")}>{displaySection(cls, prog)}</button>;
})}
                      </div>
                      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or ID..." className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" /></div>
                      {assignedStudents.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                          <p className="text-slate-400 font-bold">No students assigned yet.</p>
                          <p className="text-slate-300 text-xs mt-2">Check assigned_classes in Supabase teachers table.</p>
                        </div>
                      ) : (
                        [{label: 'Girls', list: girls, accent: 'rose'}, {label: 'Boys', list: boys, accent: 'blue'}].map(group => (
                          group.list.length > 0 && (
                            <div key={group.label} className="space-y-4">
                              <h3 className={cn("text-lg font-black flex items-center gap-2 px-2", group.accent === 'rose' ? 'text-rose-500' : 'text-blue-500')}>
                                <div className={cn("w-2 h-2 rounded-full", group.accent === 'rose' ? 'bg-rose-500' : 'bg-blue-500')} />{group.label} ({group.list.length})
                              </h3>
                              {group.list.map((student, idx) => (
                                <div key={`${group.label}-${student.id || student.roll_no || idx}`} className="bg-white border border-slate-100 p-5 rounded-[2.5rem] flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center font-black text-lg", group.accent === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600')}>{student.full_name?.charAt(0)}</div>
                                  <div className="flex-1">
                                    <h4 className="text-slate-900 font-black text-sm">{student.full_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{student.roll_no} • {displaySection(student.class_section, student.program)}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => openStudentProfile(student)} className="w-10 h-10 rounded-xl bg-[#2D3494] text-white flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg" title="View Profile"><User size={18} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ))
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── ACADEMICS ── */}
              {activeTab === 'Academics' && (
                <motion.div key="academics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-900">Academic Hub</h1>
                    <button onClick={loadAcademicsData} className="p-2 bg-white rounded-xl shadow-sm"><RefreshCw size={18} className={loadingAcademics ? "animate-spin" : ""} /></button>
                  </div>

                  {/* Course Progress Highlights */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Syllabus Overview</h3>
                      <button onClick={() => setSubPage('FullScheme')} className="text-[10px] font-bold text-blue-600 uppercase">View Details</button>
                    </div>
                    {weekSos.length === 0 && courseProgressData.length === 0 ? (
                      <div className="bg-white p-8 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">No scheme data found</div>
                    ) : (
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        {(() => {
                           // Use SOS data — group by subject
                           const sourceData = weekSos.length > 0 ? weekSos : courseProgressData;
                           const subjMap: Record<string, { total: number, comp: number }> = {};
                           sourceData.forEach((e: any) => {
                             if (!subjMap[e.subject]) subjMap[e.subject] = { total: 0, comp: 0 };
                             subjMap[e.subject].total++;
                             if (e.status === 'Delivered' || e.status === 'Completed') subjMap[e.subject].comp++;
                           });
                           return Object.entries(subjMap).map(([subj, stats]) => {
                             const pct = Math.round((stats.comp / stats.total) * 100);
                             return (
                               <div key={subj} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                   <p className="text-sm font-black text-slate-900">{subj}</p>
                                   <p className="text-[10px] font-bold text-slate-400">{stats.comp} / {stats.total} Topics</p>
                                 </div>
                                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }} 
                                     animate={{ width: `${pct}%` }} 
                                     className="h-full bg-[#2D3494] rounded-full"
                                   />
                                 </div>
                               </div>
                             );
                           });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Weekly Timetable Summary */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Weekly Timetable</h3>
                      <button onClick={() => setSubPage('WeeklySchedule')} className="text-[10px] font-bold text-blue-600 uppercase">Interactive View</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                        const count = fullWeeklySchedule.filter(s => s.day_of_week === day).length;
                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                        return (
                          <div key={day} className={cn(
                            "p-4 rounded-2xl border text-center transition-all",
                            isToday ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100"
                          )}>
                            <p className={cn("text-[10px] font-black uppercase tracking-tighter", isToday ? "text-blue-600" : "text-slate-400")}>{day.substring(0, 3)}</p>
                            <p className="text-lg font-black text-slate-900 mt-1">{count}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Lectures</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Modules */}
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setSubPage('Reschedule')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-blue-200 transition-all">
                       <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><RefreshCw size={24} /></div>
                       <span className="text-[10px] font-black text-slate-900 uppercase">Rescheduling</span>
                     </button>
                     <button onClick={() => setSubPage('ExamManagement')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-blue-200 transition-all">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><UserCheck size={24} /></div>
                       <span className="text-[10px] font-black text-slate-900 uppercase">Exam Duties</span>
                     </button>
                     <button onClick={() => setSubPage('ResultVerifications')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-blue-200 transition-all relative">
                       <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center"><CheckSquare size={24} /></div>
                       <span className="text-[10px] font-black text-slate-900 uppercase text-center">Verifications</span>
                       {verifications.length > 0 && <span className="absolute top-4 right-4 w-5 h-5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">{verifications.length}</span>}
                     </button>
                  </div>
                </motion.div>
              )}
              {activeTab === 'Leave' && (
                <motion.div key="leave" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Home')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><ChevronLeft size={20} /></button>
                    <h3 className="text-2xl font-black text-slate-900">Request Leave</h3>
                  </div>
                  <form onSubmit={handleLeaveSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Reason for Leave</label>
                      <textarea 
                        value={leaveForm.reason} 
                        onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        placeholder="Explain why you need leave..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">From Date</label>
                        <input 
                          type="date"
                          value={leaveForm.from_date}
                          onChange={e => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">To Date</label>
                        <input 
                          type="date"
                          value={leaveForm.to_date}
                          onChange={e => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submittingLeave}
                      className="w-full py-5 bg-[#2D3494] text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submittingLeave ? <Loader2 className="animate-spin" /> : <Calendar size={20} />}
                      Submit Request
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── LEADERBOARD ── */}
              {activeTab === 'Leaderboard' && (
                <motion.div key="lb" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><Leaderboard /></motion.div>
              )}

              {/* ── GRADING ── */}
              {activeTab === 'Grading' && (
                <motion.div key="grading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-900">Tests & Grading</h1>
                    <button onClick={() => { setShowGradeModal(true); setModalSelectedClass(null); setSelectedExam(null); }} className="bg-[#FF8A00] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold"><Plus size={16} /> New Test</button>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Pending / Unmarked</h3>
                    {exams.filter(exam => !grades.some(g => String(g.exam_id) === String(exam.id))).length === 0 ? (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-dashed border-slate-200 text-center"><p className="text-slate-400 font-bold">No pending tests.</p></div>
                    ) : (
                      exams.filter(exam => !grades.some(g => String(g.exam_id) === String(exam.id))).map(exam => (
                        <div key={`exam-${exam.id}`} onClick={() => { setSelectedExam(exam); setModalSelectedClass(exam.class_section); setTotalMarks(exam.total_marks); setShowGradeModal(true); }} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm cursor-pointer hover:border-orange-200 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all"><FileText size={24} /></div>
                            <div><h4 className="text-slate-900 font-black text-lg">{exam.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{exam.class_section} • {new Date(exam.date).toLocaleDateString()}</p></div>
                          </div>
                          <div className="text-right"><p className="text-lg font-black text-[#2D3494]">{exam.total_marks} Marks</p><span className="text-[9px] font-bold text-orange-500 uppercase bg-orange-50 px-2 py-0.5 rounded-md">Unmarked</span></div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Graded</h3>
                    {exams.filter(exam => grades.some(g => String(g.exam_id) === String(exam.id))).length === 0 ? (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-dashed border-slate-200 text-center"><p className="text-slate-400 font-bold">No graded tests yet.</p></div>
                    ) : (
                      exams.filter(exam => grades.some(g => g.exam_id === exam.id)).map(exam => {
                        const examGrades = grades.filter(g => g.exam_id === exam.id);
                        const avg = examGrades.length ? Math.round(examGrades.reduce((a, g) => a + g.score / g.total_marks * 100, 0) / examGrades.length) : 0;
                        return (
                          <div key={`graded-${exam.id}`} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                              <div><h4 className="text-slate-900 font-black">{exam.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{exam.class_section} • {examGrades.length} students graded</p></div>
                            </div>
                            <div className="text-right"><p className="text-lg font-black text-emerald-600">{avg}%</p><span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">Avg Score</span></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {grades.length > 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={BarChart3} label="Class Average" value={`${classAverage}%`} color="bg-emerald-50 text-emerald-600" />
                        <StatCard icon={TrendingUp} label="Highest" value={`${highestGrade}%`} color="bg-blue-50 text-blue-600" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Student Results</h3>
                    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" /></div>
                    <div className="space-y-3">
                      {filteredStudents.slice(0, 20).map(student => {
                        const studentGrades = grades.filter(g => g.student_roll === String(student.roll_no));
                        const g = studentGrades[0];
                        const pct = g ? Math.round(g.score / g.total_marks * 100) : null;
                        const letter = !pct ? '-' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                        return (
                          <div key={`gr-${student.roll_no}`} className="bg-white border border-slate-100 p-4 rounded-[2rem] flex items-center gap-4 shadow-sm">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold", isGirl(student) ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600")}>{student.full_name?.charAt(0)}</div>
                            <div className="flex-1"><h4 className="text-slate-900 font-bold">{student.full_name}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{student.roll_no} • {student.class_section}</p></div>
                            <div className="text-right">
                              <span className={cn("text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase", letter === 'A' ? "bg-emerald-50 text-emerald-600" : letter === 'F' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600")}>{letter}</span>
                              <p className="text-[10px] text-slate-400 mt-1">{pct ? `${pct}%` : '—'}</p>
                            </div>
                            <button onClick={() => { setSelectedItem(student); setSubPage('StudentTests'); }} className="w-10 h-10 rounded-xl bg-[#2D3494] text-white flex items-center justify-center"><FileText size={18} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── PROFILE ── */}
              {activeTab === 'Profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center space-y-4">
                    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                      <span className="text-5xl font-black text-blue-600">{teacherData?.full_name?.charAt(0) || 'T'}</span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[#2D3494]">{teacherData?.full_name}</h4>
                      <p className="text-sm text-slate-500">{teacherData?.designation} • {teacherData?.subject_dept}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{teacherData?.username}</p>
                    </div>
                    <div className="text-left bg-slate-50 rounded-2xl p-4 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Assigned Classes</p>
                      <div className="flex flex-wrap gap-2">
                        {(teacherData?.assigned_classes || '').split(',').map((c: string) => c.trim()).filter(Boolean).map((cls: string) => (
                          <span key={cls} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{cls}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={onLogout} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"><LogOut size={20} /> Logout</button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* ══ GRADE MODAL ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showGradeModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGradeModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col h-[90vh] sm:h-auto sm:max-h-[80vh]">
              <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black text-slate-900">{selectedExam ? `Marking: ${selectedExam.title}` : 'Post Test Results'}</h3>
                <button onClick={() => setShowGradeModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                {!selectedExam && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Test Name</label><input value={newGradeChapter} onChange={e => setNewGradeChapter(e.target.value)} placeholder="e.g. Chapter 1 Test" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Marks</label><input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  </div>
                )}
                {selectedExam && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div><p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Selected Test</p><p className="text-sm font-black text-blue-900">{selectedExam.title}</p></div>
                    <div className="text-right"><p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Total Marks</p><p className="text-sm font-black text-blue-900">{selectedExam.total_marks}</p></div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Filter by Class</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button onClick={() => setModalSelectedClass(null)} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all", !modalSelectedClass ? "bg-[#2D3494] text-white" : "bg-slate-50 text-slate-500 border border-slate-100")}>All</button>
                    {Array.from(new Set(assignedStudents.map(s => s.program))).filter(Boolean).sort().map(prog => (
                      <button key={prog} onClick={() => setModalSelectedClass(prog)} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all", modalSelectedClass === prog ? "bg-[#2D3494] text-white" : "bg-slate-50 text-slate-500 border border-slate-100")}>{prog}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between px-1"><label className="text-[10px] font-black text-slate-400 uppercase">Students ({assignedStudents.filter(s => modalSelectedClass ? s.program === modalSelectedClass : true).length})</label><span className="text-[10px] font-black text-slate-400 uppercase">/ {selectedExam ? selectedExam.total_marks : totalMarks}</span></div>
                  {assignedStudents.filter(s => modalSelectedClass ? s.program === modalSelectedClass : true).map((s, idx) => (
                    <div key={`gi-${s.id || s.roll_no || idx}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2D3494] font-black text-xs border border-slate-100">{s.full_name?.charAt(0)}</div>
                      <div className="flex-1"><p className="text-sm font-bold text-slate-800 truncate">{s.full_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{s.roll_no} • {s.class_section}</p></div>
                      <input type="number" placeholder="0" value={studentScores[s.roll_no] || ''} onChange={e => setStudentScores({ ...studentScores, [s.roll_no]: Number(e.target.value) })} className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-3 text-center text-sm font-black text-[#2D3494] focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 sm:p-8 border-t border-slate-100 bg-white shrink-0">
                <button onClick={handleSubmitGrades} disabled={gradingLoading} className="w-full py-5 bg-[#2D3494] text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-800 transition-all disabled:opacity-60">{gradingLoading ? 'Submitting...' : 'Submit All Grades'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ DAILY QUIZ CREATOR MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showQuizCreator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuizCreator(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Create Daily Quiz</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">5 MCQs · 30 XP · 10 Coins</p>
                </div>
                <button onClick={() => setShowQuizCreator(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                {/* Target Class Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Target Class / Section</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classes.map(c => (
                      <button 
                        key={c}
                        onClick={() => setQuizForm({...quizForm, targetClass: c})}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border",
                          quizForm.targetClass === c ? "bg-[#2D3494] text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-10">
                  {quizForm.questions.map((question, qIdx) => (
                    <div key={qIdx} className="space-y-4 pt-6 first:pt-0 border-t first:border-t-0 border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">{qIdx + 1}</div>
                        <input 
                          value={question.q} 
                          onChange={e => {
                            const newQs = [...quizForm.questions];
                            newQs[qIdx].q = e.target.value;
                            setQuizForm({...quizForm, questions: newQs});
                          }}
                          placeholder={`Enter question ${qIdx + 1}...`} 
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400" 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                        {question.a.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input 
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={question.correct_index === oIdx}
                              onChange={() => {
                                const newQs = [...quizForm.questions];
                                newQs[qIdx].correct_index = oIdx;
                                setQuizForm({...quizForm, questions: newQs});
                              }}
                              className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500"
                              title="Mark as correct answer"
                            />
                            <input 
                              value={opt}
                              onChange={e => {
                                const newQs = [...quizForm.questions];
                                newQs[qIdx].a[oIdx] = e.target.value;
                                setQuizForm({...quizForm, questions: newQs});
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}${question.correct_index === oIdx ? ' ✓ Correct' : ''}`} 
                              className={cn(
                                "flex-1 bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-400",
                                question.correct_index === oIdx && "border-emerald-400 bg-emerald-50/50 text-emerald-800 font-black"
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                <button 
                  onClick={submitDailyQuiz}
                  disabled={submittingQuiz || !quizForm.targetClass}
                  className="w-full py-5 bg-[#2D3494] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {submittingQuiz ? <Loader2 size={24} className="animate-spin" /> : <><Plus size={24} /> Launch Daily Quiz</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ RESCHEDULE MODAL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showRescheduleModal && selectedSchemeEntry && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRescheduleModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900">Request Reschedule</h3>
                <button onClick={() => setShowRescheduleModal(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                {/* Topic info */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Topic</p>
                  <p className="font-black text-blue-900">{selectedSchemeEntry.topic}</p>
                  <p className="text-xs text-blue-500 font-bold">{selectedSchemeEntry.subject} · {selectedSchemeEntry.class_section}{selectedSchemeEntry.week_no ? ` · Week ${selectedSchemeEntry.week_no}` : ''}</p>
                  <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                    <Calendar size={11} />
                    Original: {new Date(selectedSchemeEntry.scheduled_date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {/* New date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">New Proposed Date</label>
                  <input type="date" min={minDate} value={proposedDate} onChange={e => setProposedDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Reason (optional)</label>
                  <textarea value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} placeholder="e.g. Class was cancelled due to college event" rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
                {/* Warning */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex gap-2 text-xs text-amber-700">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>The Director and Academics staff will be notified immediately. This request requires approval before the schedule is updated.</span>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={handleSubmitReschedule} disabled={submittingReschedule || !proposedDate} className="w-full py-4 bg-[#2D3494] text-white rounded-[2rem] font-black shadow-xl hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {submittingReschedule ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit & Notify Director'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ BOTTOM NAV ══════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 -4px 24px rgba(0,0,0,0.08)'}}>
  <div className="flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))',paddingTop:8}}>
    {[
      {id:'Home',label:'Home',icon:LayoutDashboard},
      {id:'Students',label:'Students',icon:GraduationCap},
      {id:'Academics',label:'Academics',icon:BookOpen},
      {id:'Grading',label:'Grades',icon:CheckSquare},
      {id:'Leave',label:'Leave',icon:Calendar},
      {id:'Leaderboard',label:'Ranks',icon:Trophy},
      {id:'Profile',label:'Profile',icon:User},
    ].map(({id,label,icon:Icon})=>{
      const isActive=activeTab===id;
      return (
        <button key={id} onClick={()=>{setActiveTab(id);setSubPage(null);}}
          className="relative flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors duration-200 flex-shrink-0 min-w-[56px] px-3 py-2"
          style={isActive?{background:'linear-gradient(135deg,#2D3494,#4F46E5)',color:'#fff',boxShadow:'0 4px 14px rgba(45,52,148,0.4)'}:{color:'#94a3b8'}}>
          <motion.div animate={isActive?{rotate:[0,-15,10,-5,0],scale:[1,1.15,1]}:{rotate:0,scale:1}} transition={{duration:0.45,ease:[0.34,1.56,0.64,1]}}>
            <Icon size={20}/>
          </motion.div>
          <AnimatePresence>
            {isActive&&(
              <motion.span key="lbl" initial={{opacity:0,y:4,scale:0.8}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:4,scale:0.8}} transition={{duration:0.2}}
                className="text-[9px] font-black uppercase tracking-tight leading-none" style={{maxWidth:48,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      );
    })}
  </div>
</nav>

      {/* ══ NOTIFICATION MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNotifModal && selectedNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-blue-600" />
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base"><Bell size={18} className="text-blue-500" /> Notification Details</h3>
                <button onClick={() => setShowNotifModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedNotif.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg shrink-0 ml-4">{new Date(selectedNotif.created_at).toLocaleDateString()}</span>
                </div>
                <div className="w-12 h-1 bg-blue-500 rounded-full mb-6" />
                <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{selectedNotif.message}</p>
              </div>
              <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-2">
                <button onClick={() => setShowNotifModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                  Close Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ STUDENT PROFILE MODAL ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStudentProfile && selectedStudentProfile && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStudentProfile(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
              <div className="p-6 sm:p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-[#2D3494] flex items-center justify-center font-black text-xl sm:text-2xl">{selectedStudentProfile.full_name?.charAt(0)}</div>
                  <div className="min-w-0">
                    <h3 className="text-slate-900 font-black text-lg sm:text-xl truncate">{selectedStudentProfile.full_name}</h3>
                    <p className="text-[#2D3494] text-[10px] font-bold uppercase mt-1">{selectedStudentProfile.roll_no} • {selectedStudentProfile.class_section}</p>
                    <div className="mt-1">{getAttendanceBadge(selectedStudentProfile.roll_no)}</div>
                  </div>
                </div>
                <button onClick={() => setShowStudentProfile(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl space-y-2"><div className="flex items-center gap-2 text-slate-400"><Phone size={14} /><span className="text-[10px] font-bold uppercase">Parent Phone</span></div><p className="text-sm font-bold text-slate-900">{selectedStudentProfile.parent_phone || 'Not provided'}</p></div>
                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl space-y-2"><div className="flex items-center gap-2 text-slate-400"><User size={14} /><span className="text-[10px] font-bold uppercase">Father</span></div><p className="text-sm font-bold text-slate-900">{selectedStudentProfile.father_name || 'Not provided'}</p></div>
                </div>
                {loadingProfile ? <div className="animate-pulse space-y-4"><div className="h-32 bg-slate-100 rounded-3xl" /><div className="h-24 bg-slate-100 rounded-3xl" /></div> : (
                  <>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2"><Calendar size={16} className="text-emerald-500" /> Recent Attendance</h4>
                      {studentAttendance.length === 0 ? <p className="text-xs text-slate-400 italic">No records yet.</p> : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {studentAttendance.slice(0, 8).map(att => (
                            <div key={`pa-${att.id}`} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                              <p className={cn("text-xs font-black", att.status === 'Present' ? "text-emerald-600" : att.status === 'Late' ? "text-amber-600" : "text-rose-600")}>{att.status}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2"><CreditCard size={16} className="text-blue-500" /> Fee Status</h4>
                      {studentFees.length === 0 ? <p className="text-xs text-slate-400 italic">No fee records.</p> : (
                        <div className="bg-white border border-slate-100 rounded-3xl overflow-x-auto shadow-sm">
                          <table className="w-full text-left min-w-[300px]">
                            <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[10px] font-bold text-slate-400 uppercase"><th className="px-6 py-4">Total</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4 text-right">Status</th></tr></thead>
                            <tbody>{studentFees.map(fee => (
                              <tr key={`pf-${fee.id}`} className="text-xs border-t border-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{fee.total_amount?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-500">{fee.paid_amount?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right"><span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", fee.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{fee.status}</span></td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <TutorialOverlay />
    </div>
  );
};