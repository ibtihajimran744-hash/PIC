import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import {
  CreditCard, Calendar, BarChart3, BookOpen,
  Trophy, Bell, LogOut, ChevronRight, ChevronDown, X, Clock, AlertTriangle,
  CheckCircle, Loader2, Flame, Home, Timer, Download, GraduationCap, User,
  Zap, ZapOff, ExternalLink, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface StudentPortalProps {
  onLogout: () => void;
  studentData: { roll_no: number; full_name: string; class_section: string; username: string };
}

// ── Helpers ────────────────────────────────────────────────────
const PKR = (n: number | null | undefined) => `Rs ${(n ?? 0).toLocaleString('en-PK')}`;

function timeRemaining(dueDateStr: string) {
  const now  = new Date();
  const due  = new Date(dueDateStr);
  due.setHours(23, 59, 59, 999);
  const diff = due.getTime() - now.getTime();
  const overdue = diff < 0;
  const abs  = Math.abs(diff);
  return {
    days:    Math.floor(abs / 86400000),
    hours:   Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000)  / 60000),
    seconds: Math.floor((abs % 60000)    / 1000),
    overdue,
  };
}

// ══════════════════════════════════════════════════════════════
// FEE NOTIFICATION POPUP (slides in from top-right)
// ══════════════════════════════════════════════════════════════
const FeeNotifPopup = ({ notifs, onDismiss, onViewFee }: {
  notifs:     any[];
  onDismiss:  (id: string) => void;
  onViewFee:  (n: any)    => void;
}) => {
  const [visible, setVisible] = useState<any[]>([]);
  const shown = useRef<Set<string>>(new Set());

  useEffect(() => {
    const feeNotifs = notifs.filter(n =>
      ['fee_due','fee_overdue','fee_fine','fee_payment'].includes(n.type) && !n.is_read
    );
    feeNotifs.forEach((n, i) => {
      if (shown.current.has(String(n.id))) return;
      shown.current.add(String(n.id));
      setTimeout(() => {
        setVisible(prev => {
          if (prev.find(x => x.id === n.id)) return prev;
          return [...prev, n];
        });
        if (n.fee_notif_type !== 'overdue') {
          setTimeout(() => setVisible(prev => prev.filter(x => x.id !== n.id)), 9000);
        }
      }, i * 700);
    });
  }, [notifs]);

  const dismiss = (n: any) => {
    setVisible(prev => prev.filter(x => x.id !== n.id));
    onDismiss(String(n.id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: 380 }}>
      <AnimatePresence>
        {visible.map(n => {
          const overdue  = n.fee_notif_type === 'overdue';
          const isFine   = n.fee_notif_type === 'fine_added';
          const dueSoon  = n.fee_notif_type === 'due_soon';
          const accent   = overdue || isFine ? '#C0392B' : dueSoon ? '#D97706' : '#059669';
          const bgGrad   = overdue || isFine
            ? 'linear-gradient(135deg,#1a0505,#2d0a0a)'
            : dueSoon
            ? 'linear-gradient(135deg,#1a1205,#2d1f05)'
            : 'linear-gradient(135deg,#051a0d,#0a2d1a)';

          return (
            <motion.div key={n.id}
              initial={{ opacity:0, x:80, scale:0.9 }}
              animate={{ opacity:1, x:0,  scale:1   }}
              exit={{ opacity:0, x:80, scale:0.9, transition:{ duration:.2 } }}
              transition={{ type:'spring', stiffness:420, damping:28 }}
              className="pointer-events-auto rounded-2xl overflow-hidden"
              style={{ background:bgGrad, border:`1px solid ${accent}30`,
                       boxShadow:`0 8px 40px rgba(0,0,0,.5), 0 0 0 1px ${accent}20` }}>
              <div style={{ height:3, background:accent }} />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:`${accent}20`, border:`1px solid ${accent}40` }}>
                    {overdue || isFine
                      ? <AlertTriangle size={17} style={{ color:accent }} />
                      : dueSoon
                      ? <Clock size={17} style={{ color:accent }} />
                      : <CheckCircle size={17} style={{ color:accent }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white leading-tight">{n.title}</p>
                    <p className="text-[11px] font-medium mt-1 leading-relaxed"
                      style={{ color:'rgba(255,255,255,.55)' }}>{n.message}</p>
                    {n.due_date && <MiniCountdown dueDate={n.due_date} accent={accent} />}
                    <div className="flex items-center gap-2 mt-3">
                      <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black"
                        style={{ background:accent, color:'#fff' }}
                        onClick={e => { e.stopPropagation(); onViewFee(n); dismiss(n); }}>
                        <Timer size={11}/> View Fee Ledger
                      </motion.button>
                      <button className="text-[10px] font-bold px-2 py-1.5 rounded-lg"
                        style={{ color:'rgba(255,255,255,.35)' }}
                        onClick={e => { e.stopPropagation(); dismiss(n); }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismiss(n); }}
                    className="flex-shrink-0 mt-0.5 transition-colors"
                    style={{ color:'rgba(255,255,255,.3)' }}>
                    <X size={14}/>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ── Mini countdown for popups & notification list ──────────────
const MiniCountdown = ({ dueDate, accent }: { dueDate:string; accent:string }) => {
  const [t, setT] = useState(timeRemaining(dueDate));
  useEffect(() => {
    const id = setInterval(() => setT(timeRemaining(dueDate)), 1000);
    return () => clearInterval(id);
  }, [dueDate]);
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <Clock size={11} style={{ color:accent, flexShrink:0 }}/>
      <span className="text-[11px] font-black" style={{ color:accent }}>
        {t.overdue
          ? `${t.days}d ${t.hours}h overdue — Rs 100/day fine running`
          : `${t.days}d ${t.hours}h ${t.minutes}m ${t.seconds}s remaining`}
      </span>
    </div>
  );
};

// ── Full countdown card (light theme) ─────────────────────────
const CountdownCard = ({ fg, onClick }: { fg:any; onClick?:()=>void }) => {
  const [t, setT] = useState(timeRemaining(fg.due_date));
  useEffect(() => {
    const id = setInterval(() => setT(timeRemaining(fg.due_date)), 1000);
    return () => clearInterval(id);
  }, [fg.due_date]);

  const daysOverdue = t.overdue ? t.days : 0;
  const accruedFine = daysOverdue * (fg.daily_fine_rate || 100);

  const accentBar  = t.overdue ? '#C0392B' : t.days <= 3 ? '#D97706' : '#0891B2';
  const borderCol  = t.overdue ? '#FECACA' : t.days <= 3 ? '#FDE68A' : '#BAE6FD';
  const digitBg    = t.overdue ? '#FEF2F2' : t.days <= 3 ? '#FFFBEB' : '#F0F9FF';
  const digitColor = t.overdue ? '#B91C1C' : t.days <= 3 ? '#92400E' : '#075985';
  const labelColor = t.overdue ? '#EF4444' : t.days <= 3 ? '#B45309' : '#0284C7';

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      onClick={onClick}
      className={cn('rounded-2xl overflow-hidden bg-white', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      style={{ border:`1px solid ${borderCol}`, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
      {/* Accent bar */}
      <div style={{ height:4, background:accentBar }}/>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-black text-slate-900 text-sm">{fg.fees_group}</p>
            <p className="text-[11px] font-medium mt-0.5 text-slate-500">
              Due: {new Date(fg.due_date).toLocaleDateString('en-PK',{day:'2-digit',month:'long',year:'numeric'})}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-black" style={{ color:t.overdue?'#C0392B':'#059669' }}>
              {PKR(fg.balance||0)}
            </p>
            <p className="text-[10px] text-slate-400">balance due</p>
          </div>
        </div>

        {/* Digit tiles */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {([['Days',t.days],['Hours',t.hours],['Min',t.minutes],['Sec',t.seconds]] as [string,number][]).map(([label,val]) => (
            <div key={label} className="text-center rounded-xl py-3"
              style={{ background:digitBg, border:`1px solid ${borderCol}` }}>
              <AnimatePresence mode="popLayout">
                <motion.p key={val}
                  initial={{ y:-5, opacity:0 }} animate={{ y:0, opacity:1 }}
                  exit={{ y:5, opacity:0 }} transition={{ duration:.12 }}
                  className="text-2xl font-black leading-none"
                  style={{ color:digitColor, fontVariantNumeric:'tabular-nums' }}>
                  {String(val).padStart(2,'0')}
                </motion.p>
              </AnimatePresence>
              <p className="text-[9px] font-black mt-1 uppercase tracking-widest"
                style={{ color:labelColor }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Status banner */}
        {t.overdue ? (
          <motion.div animate={{ opacity:[1,.75,1] }} transition={{ repeat:Infinity, duration:1.8 }}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-red-50"
            style={{ border:'1px solid #FECACA' }}>
            <Flame size={14} className="text-red-500 flex-shrink-0"/>
            <span className="text-[11px] font-black text-red-700">
              {daysOverdue}d overdue · Rs {accruedFine.toLocaleString('en-PK')} fine · +Rs {fg.daily_fine_rate||100}/day
            </span>
          </motion.div>
        ) : t.days <= 3 ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-amber-50"
            style={{ border:'1px solid #FDE68A' }}>
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0"/>
            <span className="text-[11px] font-black text-amber-800">
              Due very soon — pay now to avoid Rs {fg.daily_fine_rate||100}/day fine
            </span>
          </div>
        ) : t.days <= 7 ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-amber-50"
            style={{ border:'1px solid #FDE68A' }}>
            <Clock size={14} className="text-amber-600 flex-shrink-0"/>
            <span className="text-[11px] font-bold text-amber-700">Due this week — plan your payment</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-blue-50"
            style={{ border:'1px solid #BAE6FD' }}>
            <CheckCircle size={14} className="text-blue-500 flex-shrink-0"/>
            <span className="text-[11px] font-bold text-blue-700">You're on track — plenty of time remaining</span>
          </div>
        )}
        {!t.overdue && (
          <p className="text-[10px] mt-2 text-center text-slate-400">
            Rs {fg.daily_fine_rate||100}/day fine applies automatically after the due date
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Stat card ──────────────────────────────────────────────────
const StatCard = ({ icon:Icon, label, value, sub, accent }: any) => (
  <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
    className="rounded-2xl p-4 relative overflow-hidden"
    style={{ background:'#FFFFFF', border:'1px solid #E2E8F0',
             boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background:accent }}/>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 ml-2"
      style={{ background:`${accent}15`, border:`1px solid ${accent}25` }}>
      <Icon size={17} style={{ color:accent }}/>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest ml-2 mb-0.5"
      style={{ color:'#94A3B8' }}>{label}</p>
    <p className="text-xl font-black leading-none ml-2 text-slate-900">{value}</p>
    {sub && <p className="text-[10px] font-medium mt-1 ml-2" style={{ color:'#94A3B8' }}>{sub}</p>}
  </motion.div>
);

const FileImage = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PORTAL
// ═══════════════════════════════════════════════════════════════
const Badge = ({ c, label }: { c: string; label: string }) => (
  <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap", c)}>{label}</span>
);

export const StudentPortal: React.FC<StudentPortalProps> = ({ onLogout, studentData }) => {
  const ACCENT = '#3B5BDB';
  const [tab, setTab]     = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [student,       setStudent]       = useState<any>(null);
  const [feeGroups,     setFeeGroups]     = useState<any[]>([]);
  const [instalments,   setInstalments]   = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [grades,        setGrades]        = useState<any[]>([]);
  const [attendance,    setAttendance]    = useState<any[]>([]);
  const [timetable,     setTimetable]     = useState<any[]>([]);
  const [leaderboard,   setLeaderboard]   = useState<any[]>([]);
  const [courses,       setCourses]       = useState<any[]>([]);
  const [resources,     setResources]     = useState<any[]>([]);
  const [quizzes,       setQuizzes]       = useState<any[]>([]);
  const [quizResults,   setQuizResults]   = useState<any[]>([]);
  const [showQuizModal, setShowQuizModal] = useState<any>(null);
  const [selectedResultDetail, setSelectedResultDetail] = useState<any>(null);
  const [quizAnswers,   setQuizAnswers]   = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [dismissedIds,     setDismissedIds]     = useState<Set<string>>(new Set());
  const [feeTimerFocus,    setFeeTimerFocus]    = useState<any>(null);
  const [notifPanelOpen,   setNotifPanelOpen]   = useState(false);
  const [unreadCount,      setUnreadCount]      = useState(0);

  // Kill any injected chat widgets
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #crisp-chatbox, #tidio-chat, .tawk-button, #fc_frame,
      iframe[src*="crisp"], iframe[src*="tawk"], iframe[src*="tidio"],
      iframe[src*="freshchat"], [id*="chat-widget"], [class*="chat-button"],
      [id*="chatbot"], .intercom-lightweight-app { display:none!important; }
    `;
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch{} };
  }, []);

  const [courseProgress,  setCourseProgress]  = useState<any[]>([]);
  const [expandedCourse,  setExpandedCourse]  = useState<string | null>(null);
  const [schemeEntries,   setSchemeEntries]   = useState<Record<string, any[]>>({});
  const [schemeLoading,   setSchemeLoading]   = useState<string | null>(null);
  const [notices,         setNotices]         = useState<any[]>([]);

  // Animated progress bar component
  const ProgressBar = ({ pct, color='#3B5BDB', label, sub, animated=true }: { pct:number; color?:string; label?:string; sub?:string; animated?:boolean }) => {
    const [width, setWidth] = React.useState(0);
    React.useEffect(() => { const t = setTimeout(() => setWidth(pct), 150); return () => clearTimeout(t); }, [pct]);
    return (
      <div>
        {(label||sub) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && <p className="text-xs font-bold text-slate-800">{label}</p>}
            {sub && <p className="text-[11px] font-black" style={{color}}>{sub}</p>}
          </div>
        )}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
            style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}>
            <div className="absolute inset-y-0 w-8 bg-white/25" style={{animation:'shimmer 2s infinite',left:'-2rem'}}/>
          </div>
        </div>
        <style>{`@keyframes shimmer{0%{transform:translateX(0)}100%{transform:translateX(calc(100vw + 2rem))}}`}</style>
      </div>
    );
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const roll = studentData.roll_no;
    const [stuR, fgR, instR, notifR, gradeR, attR, ttR, lbR, noticeRes] = await Promise.all([
      supabase.from('students').select('*').eq('roll_no', roll).single(),
      supabase.from('fee_groups').select('*').eq('student_roll', roll).order('due_date'),
      supabase.from('instalment_schedules').select('*').eq('student_roll', roll).order('instalment_no'),
      supabase.from('notifications').select('*').eq('target_user_id', String(roll)).order('created_at',{ ascending:false }).limit(60),
      supabase.from('grades').select('*,exams(exam_type,chapter_name,date)').eq('student_roll', roll).order('created_at',{ ascending:false }).limit(30),
      supabase.from('attendance').select('*').eq('student_roll', roll).order('date',{ ascending:false }).limit(60),
      supabase.from('timetable').select('*').eq('class_section', studentData.class_section).order('day_of_week').order('start_time'),
      supabase.from('students').select('roll_no,full_name,total_xp,current_badge').eq('class_section', studentData.class_section).order('total_xp',{ ascending:false }).limit(20),
      supabase.from('uploaded_documents').select('*')
        .or(`visible_to.cs.{Students},visible_to.cs.{All}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ]);
    setStudent(stuR.data);
    setFeeGroups(fgR.data || []);
    setInstalments(instR.data || []);
    const notifs = notifR.data || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n:any) => !n.is_read).length);
    setGrades(gradeR.data || []);
    setAttendance(attR.data || []);
    setTimetable(ttR.data || []);
    setLeaderboard(lbR.data || []);
    setNotices(noticeRes.data || []);

    // Guest/Verification Fallback
    if (!fgR.data?.length) {
      setFeeGroups([
        { id: 1, fees_group: 'Monthly Tuition - May', due_date: '2026-05-10', balance: 5000, student_roll: roll, status: 'Pending' },
        { id: 2, fees_group: 'Library Charges', due_date: '2026-04-15', balance: 500, student_roll: roll, status: 'Paid' }
      ]);
    }
    if (!gradeR.data?.length) {
      setGrades([
        { id: 1, chapter_name: 'Introduction to Physics', subject: 'Physics', score: 85, total_marks: 100, percentage: '85', grade_letter: 'A', created_at: new Date().toISOString() },
        { id: 2, chapter_name: 'Calculus I', subject: 'Mathematics', score: 92, total_marks: 100, percentage: '92', grade_letter: 'A+', created_at: new Date().toISOString() }
      ]);
    }
    if (!attR.data?.length) {
      setAttendance([
        { id: 1, date: new Date().toISOString().split('T')[0], status: 'Present' },
        { id: 2, date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'Present' },
        { id: 3, date: new Date(Date.now() - 172800000).toISOString().split('T')[0], status: 'Late' }
      ]);
    }
    if (!ttR.data?.length) {
      setTimetable([
        { id: 1, subject: 'Physics', start_time: '08:30', end_time: '09:30', day_of_week: 1, teacher_name: 'Professor A' },
        { id: 2, subject: 'Math', start_time: '09:30', end_time: '10:30', day_of_week: 1, teacher_name: 'Professor B' }
      ]);
    }

    // Load all schemes for this student's class to calculate progress
    const { data: allSchemes } = await supabase
      .from('scheme_of_study')
      .select('*')
      .eq('class_section', studentData.class_section);

    if (allSchemes) {
      const subjects = Array.from(new Set(allSchemes.map(s => s.subject)));
      const calculatedProgress = subjects.map(sub => {
        const subSchemes = allSchemes.filter(s => s.subject === sub);
        const done = subSchemes.filter(s => s.status === 'Completed').length;
        const total = subSchemes.length;
        return {
          subject: sub,
          progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
          completed_topics: done,
          total_topics: total
        };
      });
      setCourseProgress(calculatedProgress);
    }

    // Load academic resources and quizzes
    if (stuR.data?.program_id) {
      const { data: resData } = await supabase
        .from('academic_resources')
        .select('*')
        .eq('program_id', stuR.data.program_id);
      if (resData) setResources(resData);
    }

    const { data: qzData } = await supabase
      .from('academic_quizzes')
      .select('*, topic:scheme_of_study(*)');
    if (qzData) setQuizzes(qzData);

    const { data: resltData } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('student_roll_no', roll);
    if (resltData) setQuizResults(resltData || []);

    setLoading(false);
  }, [studentData.roll_no, studentData.class_section]);

  useEffect(() => { loadAll(); }, []);

  const markRead = async (id: string, type?: string) => {
    await supabase.from('notifications').update({ is_read:true }).eq('id', id);
    setNotifications(prev => prev.map(n => String(n.id)===id ? {...n, is_read:true} : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (type === 'grade' || type === 'grade_verified') setTab('results');
    if (type === 'attendance' || type === 'absence_alert') setTab('attendance');
    if (['fee_due', 'fee_overdue', 'fee_fine', 'fee_payment'].includes(type || '')) setTab('fees');
    setNotifPanelOpen(false);
  };
  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read:true }).eq('target_user_id', String(studentData.roll_no));
    setNotifications(prev => prev.map(n => ({...n, is_read:true})));
    setUnreadCount(0);
  };
  const dismissPopup = (id: string) => { setDismissedIds(prev => new Set([...prev, id])); markRead(id); };

  // Load scheme entries for a subject on demand (when student expands a course card)
  const loadSchemeForSubject = async (subject: string) => {
    if (schemeEntries[subject]) return; // already loaded
    setSchemeLoading(subject);
    const stu = student;
    const { data } = await supabase
      .from('scheme_of_study')
      .select('*')
      .eq('subject', subject)
      .eq('program', stu?.program || student?.program)
      .eq('part',    stu?.part    || student?.part)
      .order('week_no');
    setSchemeEntries(prev => ({ ...prev, [subject]: data || [] }));
    setSchemeLoading(null);
  };

  const toggleCourse = async (subject: string) => {
    if (expandedCourse === subject) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(subject);
      await loadSchemeForSubject(subject);
    }
  };

  const goToFee = (n: any) => {
    setTab('fees');
    if (n.fee_group_id) {
      const fg = feeGroups.find(g => g.id === n.fee_group_id);
      if (fg) setFeeTimerFocus(fg);
    } else {
      const first = feeGroups.find(g => g.balance > 0 && g.due_date && new Date(g.due_date) < new Date());
      if (first) setFeeTimerFocus(first);
    }
  };

  // Derived
  const totalPackage  = feeGroups.reduce((s,g) => s+(g.amount||0), 0);
  const totalPaid     = feeGroups.reduce((s,g) => s+(g.paid||0),   0);
  const totalBalance  = feeGroups.reduce((s,g) => s+(g.balance||0),0);
  const totalFine     = feeGroups.reduce((s,g) => s+(g.fine||0),   0);
  const overdueFees   = feeGroups.filter(g => g.balance>0 && g.due_date && new Date(g.due_date)<new Date());
  const upcomingFees  = feeGroups.filter(g => g.balance>0 && g.due_date && new Date(g.due_date)>=new Date());
  const dueSoonFees   = upcomingFees.filter(g => timeRemaining(g.due_date).days <= 7);
  const feePopupNotifs = notifications.filter(n =>
    ['fee_due','fee_overdue','fee_fine','fee_payment'].includes(n.type) && !dismissedIds.has(String(n.id))
  );
  const presentDays   = attendance.filter(a=>a.status==='Present').length;
  const absentDays    = attendance.filter(a=>a.status==='Absent').length;
  const attPct        = attendance.length>0 ? Math.round((presentDays/attendance.length)*100) : 0;
  const myRank        = leaderboard.findIndex(s => s.roll_no===studentData.roll_no) + 1;
  const todayDay      = new Date().getDay() || 1;
  const DAYS: Record<number,string> = {1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat'};

  const NAV = [
    { id:'dashboard',     label:'Home',          icon:Home     },
    { id:'fees',          label:'My Fees',        icon:CreditCard},
    { id:'attendance',    label:'Attendance',     icon:Calendar },
    { id:'results',       label:'Results',        icon:BarChart3},
    { id:'courses',       label:'My Courses',      icon:BookOpen },
    { id:'quizzes',       label:'Daily Quizzes',   icon:Zap      },
    { id:'timetable',     label:'Timetable',      icon:BarChart3 },
    { id:'leaderboard',   label:'Leaderboard',    icon:Trophy   },
    { id:'notifications', label:'Notifications',  icon:Bell     },
  ];

  const PAGE_TITLES: Record<string,string> = {
    dashboard:'My Dashboard', fees:'Fee Status & Timers',
    attendance:'Attendance Record', results:'My Results',
    courses:'My Courses', timetable:'Class Timetable', leaderboard:'Class Leaderboard',
    notifications:'All Notifications',
  };

  const handleQuizSubmit = async () => {
    if (!showQuizModal || Object.keys(quizAnswers).length < showQuizModal.questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmittingQuiz(true);
    try {
      let score = 0;
      showQuizModal.questions.forEach((q: any, i: number) => {
        if (quizAnswers[i] === q.c) score++;
      });

      const { error } = await supabase.from('quiz_results').insert([{
        quiz_id: showQuizModal.id,
        student_roll_no: studentData.roll_no,
        score: score,
        total_questions: showQuizModal.questions.length,
        answers: quizAnswers
      }]);

      if (error) throw error;

      toast.success(`Quiz submitted! Scored ${score}/${showQuizModal.questions.length}`);
      setQuizResults(prev => [...prev, { quiz_id: showQuizModal.id, score }]);
      setShowQuizModal(null);
      setQuizAnswers({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#F4F6FB' }}>
      <div className="text-center space-y-4">
        <Loader2 size={36} className="animate-spin mx-auto" style={{ color:ACCENT }}/>
        <p className="text-slate-400 font-bold text-sm">Loading your portal…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background:'#F4F6FB', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* ── Fee popup notifications ── */}
      <FeeNotifPopup notifs={feePopupNotifs} onDismiss={dismissPopup} onViewFee={n => { goToFee(n); setNotifPanelOpen(false); }}/>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-56 flex-col fixed h-full z-10"
        style={{ background:'#FFFFFF', borderRight:'1px solid #E2E8F0' }}>
        <div className="px-5 py-5 border-b" style={{ borderColor:'#E2E8F0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background:`linear-gradient(135deg,${ACCENT},#2C4BC0)` }}>🎓</div>
            <div>
              <p className="font-black text-slate-900 text-sm">PIC Campus</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon:Icon }) => {
            const active = tab===id;
            const hasBadge = id==='notifications' && unreadCount>0;
            const hasAlert = id==='fees' && overdueFees.length>0;
            return (
              <motion.button key={id} whileHover={{ x:2 }} onClick={() => setTab(id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left relative"
                style={active
                  ? { background:`linear-gradient(135deg,${ACCENT},#2C4BC0)`, color:'#fff', boxShadow:`0 4px 14px ${ACCENT}40` }
                  : { color:'#64748B' }}>
                <Icon size={16}/>
                <span className="flex-1">{label}</span>
                {hasBadge && <span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                  style={{ background:'#C0392B' }}>{unreadCount>9?'9+':unreadCount}</span>}
                {hasAlert && !hasBadge && <span className="w-2 h-2 rounded-full" style={{ background:'#C0392B' }}/>}
              </motion.button>
            );
          })}
        </nav>
        {overdueFees.length>0 && (
          <div className="mx-3 mb-3 rounded-xl p-3 cursor-pointer" onClick={() => setTab('fees')}
            style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
            <p className="text-[10px] font-black text-red-700">⚠️ {overdueFees.length} fee{overdueFees.length>1?'s':''} overdue</p>
            <p className="text-[10px] mt-0.5 text-red-400">Rs 100/day fine running</p>
          </div>
        )}
        <div className="p-3 border-t space-y-2" style={{ borderColor:'#E2E8F0' }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
            style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
              style={{ background:`hsl(${(studentData.roll_no*37)%360},60%,45%)` }}>
              {studentData.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{studentData.full_name}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color:'rgba(255,255,255,.35)' }}>
                {studentData.class_section}
              </p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-rose-500/10 transition-all"
            style={{ color:'#EF4444' }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background:'#FFFFFF', borderBottom:'1px solid #E2E8F0', boxShadow:'0 1px 10px rgba(0,0,0,.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
            style={{ background:`linear-gradient(135deg,${ACCENT},#2C4BC0)` }}>🎓</div>
          <p className="font-black text-slate-900 text-sm">PIC Campus</p>
        </div>
        <div className="flex items-center gap-2">
          {overdueFees.length>0 && (
            <motion.button animate={{ opacity:[1,.6,1] }} transition={{ repeat:Infinity, duration:1.8 }}
              onClick={() => setTab('fees')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black"
              style={{ background:'rgba(192,57,43,.2)', color:'#FCA5A5', border:'1px solid rgba(192,57,43,.3)' }}>
              <Flame size={11}/> {overdueFees.length} overdue
            </motion.button>
          )}
          <button onClick={() => setNotifPanelOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
            <Bell size={16} style={{ color:'#64748B' }}/>
            {unreadCount>0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                style={{ background:'#C0392B' }}>{unreadCount>9?'9+':unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0 pt-16 md:pt-0">

        {/* Desktop topbar */}
        <div className="hidden md:flex sticky top-0 z-20 px-7 py-4 items-center justify-between"
          style={{ background:'rgba(255,255,255,.98)', backdropFilter:'blur(20px)', borderBottom:'1px solid #E2E8F0', boxShadow:'0 1px 12px rgba(0,0,0,.05)' }}>
          <div>
            <h1 className="text-lg font-black text-slate-900">{PAGE_TITLES[tab]}</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color:'#64748B' }}>
              {new Date().toLocaleDateString('en-PK',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {overdueFees.length>0 && (
              <motion.div animate={{ opacity:[1,.65,1] }} transition={{ repeat:Infinity, duration:1.8 }}>
                <button onClick={() => setTab('fees')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black"
                  style={{ background:'rgba(192,57,43,.15)', color:'#FCA5A5', border:'1px solid rgba(192,57,43,.3)' }}>
                  <Flame size={13}/> {overdueFees.length} overdue — Rs 100/day fine
                </button>
              </motion.div>
            )}
            <button onClick={() => setNotifPanelOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
              <Bell size={16} style={{ color:'#64748B' }}/>
              {unreadCount>0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                  style={{ background:'#C0392B' }}>{unreadCount>9?'9+':unreadCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-7 pb-28 md:pb-7">
          <AnimatePresence mode="wait">

            {/* ══ DASHBOARD ══ */}
            {tab==='dashboard' && (
              <motion.div key="dash" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">

                {/* XP hero */}
                <div className="rounded-3xl p-5 md:p-7 relative overflow-hidden"
                  style={{ background:'linear-gradient(135deg,#0B1F3A,#1a3050)', border:'1px solid rgba(255,255,255,.06)' }}>
                  <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-5"
                    style={{ background:ACCENT, transform:'translate(30%,-30%)' }}/>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color:'rgba(255,255,255,.5)' }}>
                        Welcome back, {studentData.full_name.split(' ')[0]}
                      </p>
                      <p className="text-2xl font-black text-white">{student?.current_badge||'🥉 Newcomer'}</p>
                      <p className="text-sm font-bold mt-1" style={{ color:'rgba(255,255,255,.4)' }}>
                        {(student?.total_xp||0).toLocaleString()} XP · {myRank>0?`#${myRank} in class`:'Unranked'}
                      </p>
                      <div className="mt-3 w-48 md:w-64">
                        <div className="h-2 rounded-full" style={{ background:'rgba(255,255,255,.15)' }}>
                          <motion.div initial={{ width:0 }}
                            animate={{ width:`${Math.min(((student?.total_xp||0)%500)/500*100,100)}%` }}
                            transition={{ duration:1 }} className="h-2 rounded-full"
                            style={{ background:`linear-gradient(90deg,${ACCENT},#818CF8)` }}/>
                        </div>
                        <p className="text-[10px] mt-1 font-medium" style={{ color:'rgba(255,255,255,.45)' }}>
                          {500-((student?.total_xp||0)%500)} XP to next badge
                        </p>
                      </div>
                    </div>
                    {myRank>0&&myRank<=3 && (
                      <div className="text-right">
                        <p className="text-5xl">{myRank===1?'🥇':myRank===2?'🥈':'🥉'}</p>
                        <p className="text-xs font-black mt-1" style={{ color:'rgba(255,255,255,.4)' }}>Class Rank</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={CreditCard} label="Balance Due" value={PKR(totalBalance)}
                    sub={overdueFees.length>0?`${overdueFees.length} overdue`:'No overdue'} accent={totalBalance>0?'#C0392B':'#059669'}/>
                  <StatCard icon={Calendar} label="Attendance" value={`${attPct}%`}
                    sub={`${presentDays} present · ${absentDays} absent`} accent="#059669"/>
                  <StatCard icon={BarChart3} label="Avg Marks"
                    value={grades.length>0?`${Math.round(grades.reduce((s,g)=>s+(g.percentage||0),0)/grades.length)}%`:'—'}
                    sub={`${grades.filter(g=>g.is_verified).length} verified`} accent={ACCENT}/>
                  <StatCard icon={BookOpen} label="Overdue Fines" value={PKR(totalFine)}
                    sub={totalFine>0?'Pay now to stop':'No fines'} accent={totalFine>0?'#D97706':'#059669'}/>
                </div>

                {/* Notices & Documents */}
                <div className="space-y-3">
                  <p className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <FileText size={15} className="text-purple-600" /> Recent Notices & Documents
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notices.slice(0, 4).map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" 
                        className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-purple-200 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-all">
                          {doc.file_type === 'pdf' ? <FileText size={18} /> : <FileImage size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-sm truncate">{doc.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{doc.category} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  {notices.length === 0 && <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">No recent notices</div>}
                </div>

                {/* Overdue fee alerts */}
                {overdueFees.length>0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <Flame size={15} style={{ color:'#C0392B' }}/> Overdue Fees — Fine Running
                      </p>
                      <button onClick={() => setTab('fees')} className="text-[11px] font-bold" style={{ color:ACCENT }}>View All →</button>
                    </div>
                    {overdueFees.slice(0,2).map(fg => (
                      <CountdownCard key={fg.id} fg={fg} onClick={() => { setTab('fees'); setFeeTimerFocus(fg); }}/>
                    ))}
                  </div>
                )}

                {/* Due soon */}
                {dueSoonFees.length>0 && (
                  <div className="space-y-3">
                    <p className="font-black text-slate-900 text-sm">🔔 Due This Week</p>
                    {dueSoonFees.map(fg => (
                      <CountdownCard key={fg.id} fg={fg} onClick={() => { setTab('fees'); setFeeTimerFocus(fg); }}/>
                    ))}
                  </div>
                )}

                {/* Course Progress Bars */}
                {courseProgress.length>0&&(
                  <div className="rounded-2xl p-4 bg-white" style={{ border:'1px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-black text-slate-900 text-sm">📚 Course Progress</p>
                      <button onClick={()=>setTab('courses')} className="text-[11px] font-bold text-blue-600">View Details →</button>
                    </div>
                    <div className="space-y-3">
                      {courseProgress.map(cp=>{
                        const pct=cp.progress_pct||0;
                        const color=pct>=80?'#059669':pct>=50?'#3B5BDB':pct>=25?'#D97706':'#C0392B';
                        return <ProgressBar key={cp.subject} pct={pct} color={color} label={cp.subject} sub={`${pct}%`}/>;
                      })}
                    </div>
                  </div>
                )}

                {/* Today timetable */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor:'#E2E8F0' }}>
                    <p className="font-black text-slate-900 text-sm">Today's Classes</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color:'#64748B' }}>{studentData.class_section}</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {timetable.filter(t=>t.day_of_week===todayDay).slice(0,6).map((t,i) => (
                      <div key={i} className="rounded-xl p-3"
                        style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                          style={{ color:'#94A3B8' }}>Period {t.period_number}</p>
                        <p className="text-sm font-black text-slate-900">{t.subject_name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color:'#64748B' }}>{t.teacher_name||'—'}</p>
                      </div>
                    ))}
                    {timetable.filter(t=>t.day_of_week===todayDay).length===0 && (
                      <div className="col-span-3 py-6 text-center" style={{ color:'#CBD5E1' }}>
                        <BookOpen size={24} className="mx-auto mb-2"/>
                        <p className="text-sm font-medium text-slate-400">No classes today</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ FEES ══ */}
            {tab==='fees' && (
              <motion.div key="fees" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

                {/* ── Summary hero card ── */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
                  {/* Top row: package vs paid */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Package</p>
                      <p className="text-2xl font-black text-slate-900">{PKR(totalPackage)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Paid</p>
                      <p className="text-2xl font-black" style={{ color:'#059669' }}>{PKR(totalPaid)}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                    <motion.div initial={{ width:0 }}
                      animate={{ width:`${totalPackage>0?(totalPaid/totalPackage)*100:0}%` }}
                      transition={{ duration:1 }}
                      className="h-2.5 rounded-full"
                      style={{ background:'linear-gradient(90deg,#059669,#34D399)' }}/>
                  </div>
                  {/* Bottom row: balance + fine */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {feeGroups.filter(g=>g.status==='Paid').length}/{feeGroups.length} cleared
                      {totalFine>0 && <span className="text-red-500 font-bold"> · {PKR(totalFine)} in fines</span>}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</p>
                      <p className="text-sm font-black" style={{ color:totalBalance>0?'#C0392B':'#059669' }}>{PKR(totalBalance)}</p>
                    </div>
                  </div>
                </div>

                {/* ── Focused countdown (when tapped) ── */}
                {feeTimerFocus && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black text-slate-900 text-sm">⏱ Countdown Timer</p>
                      <button onClick={() => setFeeTimerFocus(null)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600">✕ Close</button>
                    </div>
                    <CountdownCard fg={feeTimerFocus}/>
                  </div>
                )}

                {/* ── Fee group cards — full mobile layout ── */}
                <div>
                  {/* Section label */}
                  {overdueFees.length>0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Flame size={14} className="text-red-500"/>
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest">Overdue — Fine Running</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {feeGroups.map((g, i) => {
                      const isOvd  = (g.balance||0)>0 && g.due_date && new Date(g.due_date)<new Date();
                      const isPaid = g.status==='Paid';
                      const hasFine = (g.fine||0)>0;

                      const cardBorder = isPaid ? '#D1FAE5' : isOvd ? '#FECACA' : '#E2E8F0';
                      const cardBg     = isPaid ? '#F0FDF4' : isOvd ? '#FFF8F8' : '#FFFFFF';
                      const accentBar  = isPaid ? '#059669' : isOvd ? '#C0392B' : '#94A3B8';

                      return (
                        <motion.div key={g.id}
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                          onClick={() => !isPaid && setFeeTimerFocus(g)}
                          className={cn('rounded-2xl overflow-hidden', !isPaid && 'cursor-pointer active:scale-[.99] transition-transform')}
                          style={{ background:cardBg, border:`1px solid ${cardBorder}`, boxShadow:'0 1px 8px rgba(0,0,0,.05)' }}>
                          {/* Top accent */}
                          <div style={{ height:3, background:accentBar }}/>
                          <div className="px-4 py-3.5">
                            {/* Row 1: name + status badge */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm leading-tight">{g.fees_group}</p>
                                {g.due_date && (
                                  <p className={cn('text-[11px] font-medium mt-0.5', isOvd?'text-red-500':'text-slate-400')}>
                                    {isOvd ? '⚠️ Was due' : 'Due'} {new Date(g.due_date).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}
                                  </p>
                                )}
                              </div>
                              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0',
                                isPaid ? 'bg-emerald-100 text-emerald-700' :
                                isOvd  ? 'bg-red-100 text-red-700' :
                                         'bg-amber-100 text-amber-700')}>
                                {isPaid ? '✓ Paid' : isOvd ? 'Overdue' : g.status||'Unpaid'}
                              </span>
                            </div>
                            {/* Row 2: amount breakdown */}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="bg-white rounded-xl px-3 py-2 text-center" style={{ border:'1px solid #F1F5F9' }}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Amount</p>
                                <p className="text-sm font-black text-slate-700">{PKR(g.amount)}</p>
                              </div>
                              <div className="bg-white rounded-xl px-3 py-2 text-center" style={{ border:'1px solid #F1F5F9' }}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Paid</p>
                                <p className="text-sm font-black text-emerald-600">{PKR(g.paid||0)}</p>
                              </div>
                              <div className="rounded-xl px-3 py-2 text-center"
                                style={{ background:isOvd?'#FEF2F2':'#F8FAFC', border:`1px solid ${isOvd?'#FECACA':'#F1F5F9'}` }}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Balance</p>
                                <p className="text-sm font-black" style={{ color:isOvd?'#C0392B':'#059669' }}>{PKR(g.balance||0)}</p>
                              </div>
                            </div>
                            {/* Fine badge */}
                            {hasFine && (
                              <div className="flex items-center gap-1.5 mt-2.5 bg-red-50 rounded-lg px-3 py-1.5"
                                style={{ border:'1px solid #FECACA' }}>
                                <Flame size={12} className="text-red-500 flex-shrink-0"/>
                                <p className="text-[11px] font-black text-red-700">
                                  Rs {(g.fine||0).toLocaleString('en-PK')} fine accrued · Rs 100/day
                                </p>
                              </div>
                            )}
                            {/* Tap hint */}
                            {!isPaid && (
                              <p className="text-[10px] text-slate-400 mt-2 text-right">
                                Tap to see countdown →
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Instalment schedule ── */}
                {instalments.length>0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={14} className="text-blue-500"/>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Instalment Schedule</p>
                      <span className="text-[10px] text-slate-400">· Rs 100/day if overdue</span>
                    </div>
                    <div className="space-y-2">
                      {instalments.map((inst, i) => {
                        const isOvd = inst.status==='Overdue'||(inst.due_date&&new Date(inst.due_date)<new Date()&&inst.status!=='Paid');
                        const isPaid = inst.status==='Paid';
                        const fine = inst.accumulated_fine||0;
                        return (
                          <motion.div key={inst.id}
                            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                            className="rounded-2xl px-4 py-3.5"
                            style={{
                              background: isPaid?'#F0FDF4':isOvd?'#FFF8F8':'#FFFFFF',
                              border:`1px solid ${isPaid?'#D1FAE5':isOvd?'#FECACA':'#E2E8F0'}`,
                              boxShadow:'0 1px 6px rgba(0,0,0,.04)',
                            }}>
                            <div className="flex items-center justify-between">
                              {/* Left: number + date */}
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                                  style={{
                                    background: isPaid?'#D1FAE5':isOvd?'#FEE2E2':'#EFF6FF',
                                    color:      isPaid?'#059669':isOvd?'#C0392B':'#2563EB',
                                  }}>
                                  {inst.instalment_no}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-900">Instalment {inst.instalment_no}</p>
                                  <p className={cn('text-[11px] font-medium', isOvd?'text-red-500':'text-slate-400')}>
                                    {inst.due_date?new Date(inst.due_date).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}):'No date set'}
                                  </p>
                                </div>
                              </div>
                              {/* Right: amount + status */}
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-900">{PKR(inst.amount)}</p>
                                {fine>0 && <p className="text-[11px] font-bold text-red-500">+{PKR(fine)} fine</p>}
                                <span className={cn('text-[10px] font-black',
                                  isPaid?'text-emerald-600':isOvd?'text-red-600':'text-amber-600')}>
                                  {isPaid?'✓ Paid':isOvd?'Overdue':'Pending'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* ══ ATTENDANCE ══ */}
            {tab==='attendance' && (
              <motion.div key="att" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{l:'Overall %',v:`${attPct}%`,c:attPct>=75?'#4ADE80':'#FCA5A5'},
                    {l:'Present',  v:presentDays,          c:'#4ADE80'},
                    {l:'Absent',   v:absentDays,           c:'#FCA5A5'},
                    {l:'Late',     v:attendance.filter(a=>a.status==='Late').length, c:'#FCD34D'}].map(({l,v,c}) => (
                    <div key={l} className="rounded-2xl p-4 text-center"
                      style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(0,0,0,.04)', borderRadius:'16px' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color:'#94A3B8' }}>{l}</p>
                      <p className="text-2xl font-black" style={{ color:c }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
                  <div className="px-4 py-3.5 border-b" style={{ borderColor:'#E2E8F0' }}>
                    <p className="font-black text-slate-900 text-sm">Attendance History</p>
                  </div>
                  {attendance.length===0 ? (
                    <div className="px-4 py-12 text-center text-slate-400 text-sm">No attendance records yet</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {attendance.slice(0,30).map((a,i) => (
                        <motion.div key={a.id||i}
                          initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.02 }}
                          className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0',
                              a.status==='Present'?'bg-emerald-100 text-emerald-700':
                              a.status==='Late'   ?'bg-amber-100  text-amber-700' :
                                                   'bg-red-100    text-red-700')}>
                              {a.status==='Present'?'✓':a.status==='Late'?'L':'✗'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{a.subject_name||'Class'}</p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(a.date).toLocaleDateString('en-PK',{weekday:'short',day:'2-digit',month:'short'})}
                                {a.period_number ? ` · Period ${a.period_number}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-full flex-shrink-0',
                            a.status==='Present'?'bg-emerald-100 text-emerald-700':
                            a.status==='Late'   ?'bg-amber-100  text-amber-700' :
                                                 'bg-red-100    text-red-700')}>
                            {a.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ QUIZZES ══ */}
            {tab === 'quizzes' && (
              <motion.div key="quizzes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Zap size={20} className="text-amber-500 fill-amber-500" /> Daily Academic Quizzes
                    </h3>
                    <p className="text-xs text-slate-400">Complete quizzes based on recently covered topics to earn bonus XP.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">{quizResults.length}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Completed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes.map(qz => {
                    const result = quizResults.find(r => r.quiz_id === qz.id);
                    const isAttempted = !!result;
                    return (
                      <div key={qz.id} className={cn("bg-white rounded-2xl border p-5 shadow-sm transition-all", isAttempted ? "border-slate-100 opacity-80" : "border-amber-200 hover:border-amber-400 shadow-md")}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isAttempted ? "bg-slate-50 text-slate-400" : "bg-amber-50 text-amber-600")}>
                            <Zap size={18} />
                          </div>
                          {isAttempted ? (
                            <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label={`Score: ${result.score}/${qz.questions?.length || 5}`} />
                          ) : (
                            <Badge c="bg-amber-50 text-amber-700 border-amber-200" label={`${qz.points} XP`} />
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 mb-1">{qz.title}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{qz.topic?.subject} · {qz.topic?.topic}</p>
                        
                        {!isAttempted ? (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setShowQuizModal(qz)}
                            className="w-full mt-4 py-2.5 rounded-xl text-xs font-black text-white bg-amber-500 shadow-lg shadow-amber-500/20">
                            Start Quiz
                          </motion.button>
                        ) : (
                          <div className="w-full mt-4 py-2.5 rounded-xl text-xs font-black text-slate-400 bg-slate-50 text-center border border-slate-100 flex items-center justify-center gap-2">
                             <CheckCircle2 size={12} /> Quiz Completed
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {quizzes.length === 0 && (
                     <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <ZapOff size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-slate-400 font-bold">No quizzes available for your subjects yet.</p>
                     </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ COURSES ══ */}
            {tab === 'courses' && (
              <motion.div key="courses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courseProgress.map(cp => {
                     const subjectResources = resources.filter(r => r.subject_id === cp.subject_id);
                     return (
                      <div key={cp.subject} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                               <h3 className="text-lg font-black text-slate-900">{cp.subject}</h3>
                               <p className="text-xs text-slate-400">Section {studentData.class_section} · Syllabus Progress</p>
                            </div>
                            <div className="text-right">
                               <p className="text-2xl font-black text-blue-600">{cp.progress_pct}%</p>
                            </div>
                          </div>
                          
                          <ProgressBar pct={cp.progress_pct} color="#3B5BDB" />
                          
                          <div className="mt-6 space-y-3">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Resources</p>
                             {subjectResources.length > 0 ? (
                               <div className="grid grid-cols-1 gap-2">
                                 {subjectResources.map(res => (
                                   <a key={res.id} href={res.file_url} target="_blank" rel="noreferrer"
                                     className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                     <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 border border-slate-100 group-hover:border-blue-200">
                                         <Download size={14} />
                                       </div>
                                       <div>
                                         <p className="text-xs font-bold text-slate-700">{res.title}</p>
                                         <p className="text-[9px] text-slate-400 uppercase font-black">{res.file_type}</p>
                                       </div>
                                     </div>
                                     <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500" />
                                   </a>
                                 ))}
                               </div>
                             ) : (
                               <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">No PDFs or Notes uploaded yet by the teacher.</p>
                             )}
                          </div>
                        </div>
                      </div>
                     );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══ RESULTS ══ */}
            {tab==='results' && (
              <motion.div key="res" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                  <p className="font-black text-slate-900">Academic Results</p>
                  {grades.filter(g=>!g.is_verified).length>0 && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {grades.filter(g=>!g.is_verified).length} pending
                    </span>
                  )}
                </div>
                {/* Course overview bars first */}
                {courseProgress.length>0&&(
                  <div className="rounded-2xl p-4 bg-white mb-4" style={{border:'1px solid #E2E8F0',boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-black text-slate-900">Overall Course Progress</p>
                      <button onClick={()=>setTab('courses')} className="text-[11px] font-bold text-blue-600">Course Details →</button>
                    </div>
                    <div className="space-y-3">
                      {courseProgress.map(cp=>{
                        const pct   = cp.progress_pct||0;
                        const color = pct>=80?'#059669':pct>=50?'#3B5BDB':pct>=25?'#D97706':'#C0392B';
                        return <ProgressBar key={cp.subject} pct={pct} color={color} label={cp.subject} sub={`${cp.topics_done}/${cp.topics_total} topics · ${pct}%`}/>;
                      })}
                    </div>
                  </div>
                )}
                {grades.length===0 ? (
                  <div className="rounded-2xl p-12 text-center bg-white border border-slate-200 text-slate-400 text-sm">No results yet</div>
                ) : (
                  grades.map((g,i) => {
                    const pct   = g.percentage||0;
                    const grade = pct>=85?'A+':pct>=75?'A':pct>=65?'B':pct>=50?'C':pct>=40?'D':'F';
                    const gradeBg = grade==='A+'||grade==='A'?'#ECFDF5':grade==='B'?'#EFF6FF':grade==='F'?'#FEF2F2':'#FFFBEB';
                    const gradeColor = grade==='A+'||grade==='A'?'#065F46':grade==='B'?'#1E40AF':grade==='F'?'#991B1B':'#92400E';
                    return (
                      <motion.div key={g.id}
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                        className="rounded-2xl bg-white overflow-hidden"
                        style={{ border:'1px solid #E2E8F0', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                        {/* Accent top */}
                        <div style={{ height:3, background:gradeBg==='#ECFDF5'?'#059669':gradeBg==='#EFF6FF'?'#2563EB':gradeBg==='#FEF2F2'?'#DC2626':'#D97706' }}/>
                        <div className="px-4 py-3.5">
                          {/* Top: subject + grade badge */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-black text-slate-900">{g.subject||'—'}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{g.chapter_name || g.exams?.chapter_name || g.exam_type || g.exams?.exam_type || 'Exam'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-lg font-black px-3 py-1 rounded-xl"
                                style={{ background:gradeBg, color:gradeColor }}>{grade}</span>
                              <span className={cn('text-[10px] font-black px-2 py-1 rounded-full',
                                g.is_verified?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>
                                {g.is_verified?'✓':'⏳'}
                              </span>
                            </div>
                          </div>
                          {/* Score bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-2 rounded-full transition-all"
                                  style={{ width:`${pct}%`, background:pct>=50?'#059669':'#DC2626' }}/>
                              </div>
                            </div>
                            <p className="text-sm font-black flex-shrink-0" style={{ color:pct>=50?'#059669':'#DC2626', minWidth:40, textAlign:'right' }}>
                              {pct}%
                            </p>
                          </div>
                          {/* Marks */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[11px] text-slate-400">
                              {g.score} / {g.total_marks} marks
                            </p>
                            <p className="text-[11px]" style={{ color:g.is_verified?'#059669':'#D97706' }}>
                              {g.is_verified?'Verified by Examiner':'Pending verification'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* ══ QUIZZES ══ */}
            {tab==='quizzes' && (
              <motion.div key="quizzes" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="font-black text-slate-900">Daily Quizzes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Test your knowledge to earn XP</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Zap size={20} />
                  </div>
                </div>

                <div className="space-y-3">
                  {quizzes.map((q, i) => {
                    const result = quizResults.find(r => r.quiz_id === q.id);
                    const isTaken = !!result;
                    return (
                      <motion.div key={q.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn("bg-white border rounded-[2rem] p-5 shadow-sm flex items-center justify-between", isTaken ? "border-emerald-100" : "border-slate-100")}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{q.topic?.subject_name || 'General'}</span>
                            {isTaken && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Score: {result.score}/{q.questions.length}</span>}
                          </div>
                          <h4 className="font-black text-slate-900 truncate">{q.topic?.topic || 'Daily Challenge'}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">5 MCQs • {new Date(q.created_at).toLocaleDateString()}</p>
                        </div>
                        {!isTaken ? (
                          <button 
                            onClick={() => {
                              setShowQuizModal(q);
                              setQuizAnswers({});
                            }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex-shrink-0"
                          >
                            Start Quiz
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={24} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {quizzes.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                      <ZapOff size={48} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold">No quizzes available for today.</p>
                      <p className="text-[11px] text-slate-300 mt-1">Quizzes appear when topics are marked completed.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ COURSES ══ */}
            {tab==='courses' && (
              <motion.div key="courses" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

                {/* Header stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l:'Subjects',  v: courseProgress.length,                                                    c:'#3B5BDB' },
                    { l:'Completed', v: courseProgress.filter(c=>c.progress_pct>=100).length,                     c:'#059669' },
                    { l:'Avg Score', v: courseProgress.length>0?`${Math.round(courseProgress.reduce((s,c)=>s+Number(c.avg_score||0),0)/courseProgress.length)}%`:'—', c:'#D97706' },
                  ].map(({l,v,c})=>(
                    <div key={l} className="rounded-2xl p-3 text-center bg-white" style={{ border:'1px solid #E2E8F0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{l}</p>
                      <p className="text-xl font-black" style={{ color:c }}>{v}</p>
                    </div>
                  ))}
                </div>

                {courseProgress.length===0 ? (
                  <div className="rounded-2xl p-14 text-center bg-white border border-slate-200">
                    <BookOpen size={32} className="mx-auto mb-3 text-slate-300"/>
                    <p className="font-black text-slate-400">No course data yet</p>
                    <p className="text-xs text-slate-300 mt-1">Your coordinator uploads the scheme weekly</p>
                  </div>
                ) : courseProgress.map((cp, i) => {
                  const pct        = cp.progress_pct || 0;
                  const avgScore   = Number(cp.avg_score || 0);
                  const isExpanded = expandedCourse === cp.subject;
                  const isLoading  = schemeLoading === cp.subject;

                  // Color logic: green=done, blue=in progress, amber=behind, red=not started
                  const barColor   = pct >= 100 ? '#059669' : pct >= 70 ? '#3B5BDB' : pct >= 40 ? '#D97706' : '#C0392B';
                  const statusText = pct >= 100 ? '✓ Complete' : pct >= 70 ? 'In Progress' : pct >= 40 ? 'Behind' : 'Just Started';
                  const statusBg   = pct >= 100 ? 'bg-emerald-100 text-emerald-700' : pct >= 70 ? 'bg-blue-100 text-blue-700' : pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

                  // Grade letter from avg score
                  const gradeLetter = avgScore >= 90 ? 'A+' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'C' : avgScore >= 50 ? 'D' : cp.exam_count > 0 ? 'F' : '—';
                  const gradeBg = gradeLetter==='A+'||gradeLetter==='A' ? '#ECFDF5' : gradeLetter==='B' ? '#EFF6FF' : gradeLetter==='F' ? '#FEF2F2' : gradeLetter==='—' ? '#F8FAFC' : '#FFFBEB';
                  const gradeColor = gradeLetter==='A+'||gradeLetter==='A' ? '#065F46' : gradeLetter==='B' ? '#1E40AF' : gradeLetter==='F' ? '#991B1B' : gradeLetter==='—' ? '#94A3B8' : '#92400E';

                  // Subject icons
                  const subjectIcon: Record<string,string> = {
                    'Computer Science':'💻', 'Physics':'⚛️', 'Mathematics':'📐',
                    'English':'📖', 'Urdu':'📝', 'Islamiyat':'☪️',
                    'Chemistry':'🧪', 'Biology':'🔬', 'Economics':'📊', 'Accounts':'🧾',
                  };
                  const icon = subjectIcon[cp.subject] || '📚';

                  // Weeks taught so far
                  const entries = schemeEntries[cp.subject] || [];
                  const taughtEntries = entries.filter((e:any) => new Date(e.created_at) <= new Date());

                  return (
                    <motion.div key={cp.subject}
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                      className="rounded-2xl overflow-hidden bg-white"
                      style={{ border:`1px solid ${isExpanded ? `${barColor}40` : '#E2E8F0'}`, boxShadow: isExpanded ? `0 4px 24px ${barColor}18` : '0 2px 12px rgba(0,0,0,0.05)', transition:'border-color .3s, box-shadow .3s' }}>

                      {/* Accent bar */}
                      <div style={{ height:3, background:barColor }}/>

                      {/* Card header — always visible, clickable to expand */}
                      <button className="w-full text-left p-4" onClick={() => toggleCourse(cp.subject)}>
                        <div className="flex items-start gap-3">
                          {/* Subject icon */}
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background:`${barColor}12`, border:`1px solid ${barColor}25` }}>
                            {icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-black text-slate-900 leading-tight">{cp.subject}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <User size={9}/> {cp.teacher_name || 'Staff'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', statusBg)}>
                                  {statusText}
                                </span>
                                <span className="text-lg font-black px-2.5 py-0.5 rounded-xl"
                                  style={{ background:gradeBg, color:gradeColor }}>{gradeLetter}</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] text-slate-500">
                                  {cp.topics_done}/{cp.topics_total} topics taught
                                </p>
                                <p className="text-sm font-black" style={{ color:barColor }}>{pct}%</p>
                              </div>
                              <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'#F1F5F9' }}>
                                <motion.div
                                  initial={{ width:0 }}
                                  animate={{ width:`${pct}%` }}
                                  transition={{ duration:1.2, delay:i*0.07, ease:[0.25,0.46,0.45,0.94] }}
                                  className="h-2.5 rounded-full relative overflow-hidden"
                                  style={{ background:`linear-gradient(90deg,${barColor},${barColor}cc)` }}>
                                  {/* shimmer */}
                                  <motion.div
                                    animate={{ x:['-200%','400%'] }}
                                    transition={{ repeat:Infinity, duration:2.5, ease:'linear', delay:1 }}
                                    className="absolute inset-y-0 w-1/3 bg-white/20"
                                    style={{ transform:'skewX(-20deg)' }}/>
                                </motion.div>
                              </div>
                              {/* Segment dots (one per topic total) */}
                              {cp.topics_total <= 15 && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                  {Array(cp.topics_total).fill(0).map((_,idx) => (
                                    <motion.div key={idx}
                                      initial={{ scale:0 }} animate={{ scale:1 }}
                                      transition={{ delay:i*0.07+idx*0.025, type:'spring', stiffness:500 }}
                                      className="flex-1 h-1 rounded-full"
                                      style={{ background: idx < cp.topics_done ? barColor : '#E2E8F0' }}/>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Bottom stats row */}
                            <div className="flex items-center gap-4 mt-2.5">
                              <div className="flex items-center gap-1">
                                <BarChart3 size={10} className="text-slate-400"/>
                                <span className="text-[11px] text-slate-500">
                                  {cp.exam_count > 0 ? `${cp.exam_count} exam${cp.exam_count>1?'s':''} · avg ${avgScore}%` : 'No exams yet'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={10} className="text-slate-400"/>
                                <span className="text-[11px] text-slate-500">{cp.attendance_pct}% attendance</span>
                              </div>
                            </div>
                          </div>

                          {/* Expand chevron */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration:.25 }}
                            className="flex-shrink-0 mt-1">
                            <ChevronDown size={16} className="text-slate-400"/>
                          </motion.div>
                        </div>
                      </button>

                      {/* ── EXPANDED DETAIL PANEL ── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height:0, opacity:0 }}
                            animate={{ height:'auto', opacity:1 }}
                            exit={{ height:0, opacity:0 }}
                            transition={{ duration:.3, ease:[0.4,0,0.2,1] }}
                            style={{ overflow:'hidden' }}>
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">

                              {/* Exam results in this subject */}
                              {grades.filter(g => g.subject === cp.subject).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📊 Your Scores</p>
                                  <div className="space-y-2">
                                    {grades.filter(g => g.subject === cp.subject).map((g:any, gi:number) => {
                                      const gpct = Number(g.percentage || 0);
                                      const gl = gpct>=90?'A+':gpct>=80?'A':gpct>=70?'B':gpct>=60?'C':gpct>=50?'D':'F';
                                      const gc = gpct>=70?'#059669':gpct>=50?'#D97706':'#C0392B';
                                      return (
                                        <div key={g.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                          style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                                          <span className="text-base font-black w-8 text-center flex-shrink-0"
                                            style={{ color:gc }}>{gl}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">
                                              {g.chapter_name || g.exams?.chapter_name || g.exam_type || g.exams?.exam_type || 'Exam'}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                              {g.score}/{g.total_marks} marks · {gpct}%
                                              {g.is_verified
                                                ? <span className="text-emerald-600 ml-1">✓ Verified</span>
                                                : <span className="text-amber-500 ml-1">⏳ Pending</span>}
                                            </p>
                                          </div>
                                          <div className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                            <div className="h-full rounded-full" style={{ width:`${gpct}%`, background:gc }}/>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Scheme of study — what was taught */}
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                  📅 What Was Taught ({cp.topics_done} topics so far)
                                </p>
                                {isLoading ? (
                                  <div className="flex items-center gap-2 py-3 text-slate-400">
                                    <Loader2 size={14} className="animate-spin"/>
                                    <span className="text-xs">Loading syllabus…</span>
                                  </div>
                                ) : entries.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-2">No topics uploaded yet</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                    {entries.map((e:any, ei:number) => {
                                      const isTaught = new Date(e.created_at) <= new Date();
                                      return (
                                        <motion.div key={e.id}
                                          initial={{ opacity:0, x:-6 }}
                                          animate={{ opacity:1, x:0 }}
                                          transition={{ delay:ei*0.03 }}
                                          className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                                          style={{
                                            background: isTaught ? '#F0FDF4' : '#F8FAFC',
                                            border: `1px solid ${isTaught ? '#D1FAE5' : '#E2E8F0'}`,
                                          }}>
                                          {/* Week badge */}
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                            style={{
                                              background: isTaught ? barColor : '#E2E8F0',
                                              color: isTaught ? '#fff' : '#94A3B8',
                                            }}>
                                            W{e.week_no}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={cn('text-xs font-black leading-snug', isTaught ? 'text-slate-900' : 'text-slate-400')}>
                                              {e.topic}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                              {e.month && <span className="text-[9px] text-slate-400">{e.month}</span>}
                                              <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: isTaught ? '#059669' : '#94A3B8' }}>
                                                <GraduationCap size={8}/> {e.uploaded_by}
                                              </span>
                                              {!isTaught && <span className="text-[9px] text-slate-300">Upcoming</span>}
                                            </div>
                                          </div>
                                          {isTaught && <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color:'#059669' }}/>}
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Resources for this subject */}
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                  📚 Subject Resources
                                </p>
                                <div className="space-y-2">
                                  {resources.filter(r => r.subject_id === cp.subject_id).length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">No resources found for this subject.</p>
                                  ) : (
                                    resources.filter(r => r.subject_id === cp.subject_id).map((res, ri) => (
                                      <a key={res.id} href={res.file_url} target="_blank" rel="noopener noreferrer" 
                                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                                          <Download size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-slate-900 truncate">{res.title}</p>
                                          <p className="text-[10px] text-slate-500">{res.type} • {new Date(res.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <ExternalLink size={12} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                                      </a>
                                    ))
                                  )}
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {tab==='timetable' && (
              <motion.div key="tt" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
                <p className="font-black text-slate-900 px-1">{studentData.class_section} — Weekly Schedule</p>
                {[1,2,3,4,5,6].map(day => {
                  const daySlots = timetable.filter(t=>t.day_of_week===day).sort((a,b)=>a.period_number-b.period_number);
                  const isToday  = day === todayDay;
                  return (
                    <motion.div key={day}
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:day*0.04 }}
                      className="rounded-2xl overflow-hidden bg-white"
                      style={{
                        border: `1px solid ${isToday?'#C7D2FE':'#E2E8F0'}`,
                        boxShadow: isToday?'0 2px 12px rgba(79,70,229,.1)':'0 1px 4px rgba(0,0,0,.04)',
                      }}>
                      {/* Day header */}
                      <div className="px-4 py-2.5 flex items-center gap-2"
                        style={{ background:isToday?'#EEF2FF':'#F8FAFC', borderBottom:`1px solid ${isToday?'#C7D2FE':'#E2E8F0'}` }}>
                        <p className="font-black text-sm" style={{ color:isToday?'#4338CA':'#374151' }}>
                          {DAYS[day]}
                        </p>
                        {isToday && <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Today</span>}
                        <p className="text-[11px] text-slate-400 ml-auto">{daySlots.length} periods</p>
                      </div>
                      {/* Period pills */}
                      {daySlots.length===0 ? (
                        <p className="px-4 py-3 text-sm text-slate-300">No classes</p>
                      ) : (
                        <div className="px-4 py-3 flex flex-wrap gap-2">
                          {daySlots.map(slot => (
                            <div key={slot.id||slot.period_number}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
                              style={{ background:'#F1F5F9', border:'1px solid #E2E8F0', minWidth:0 }}>
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black bg-slate-200 text-slate-600 flex-shrink-0">
                                {slot.period_number}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 whitespace-nowrap">{slot.subject_name}</p>
                                {slot.teacher_name && <p className="text-[10px] text-slate-400 whitespace-nowrap">{slot.teacher_name}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ══ LEADERBOARD ══ */}
            {tab==='leaderboard' && (
              <motion.div key="lb" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="rounded-2xl p-5 text-center"
                  style={{ background:'linear-gradient(135deg,#0B1F3A,#1a3050)', border:'none' }}>
                  <p className="font-black text-white text-lg">🏆 Class Leaderboard</p>
                  <p className="text-xs font-medium mt-1 text-white/50">
                    {studentData.class_section} · Ranked by XP Points
                  </p>
                </div>
                {/* Podium */}
                {leaderboard.length>=3 && (
                  <div className="flex items-end justify-center gap-3">
                    {[leaderboard[1],leaderboard[0],leaderboard[2]].map((s,i) => {
                      const rank = i===1?1:i===0?2:3;
                      const emoji = rank===1?'🥇':rank===2?'🥈':'🥉';
                      const h = rank===1?'h-28':rank===2?'h-20':'h-16';
                      const bg = rank===1?'linear-gradient(135deg,#F59E0B,#D97706)':rank===2?'linear-gradient(135deg,#94A3B8,#64748B)':'linear-gradient(135deg,#F97316,#EA580C)';
                      const isMe = s?.roll_no===studentData.roll_no;
                      return (
                        <div key={i} className="flex flex-col items-center gap-2" style={{ width:100 }}>
                          <p className="text-2xl">{emoji}</p>
                          <div className={cn('w-full rounded-xl flex items-center justify-center font-black text-2xl text-white',h)}
                            style={{ background:bg, boxShadow:isMe?`0 0 20px rgba(59,91,219,.5)`:undefined }}>
                            #{rank}
                          </div>
                          <p className="text-xs font-black text-center text-slate-900 leading-tight">
                            {s?.full_name?.split(' ')[0]||'—'}
                            {isMe && <span className="block text-[10px] font-bold" style={{ color:'#818CF8' }}>← You</span>}
                          </p>
                          <p className="text-[11px] font-bold" style={{ color:'rgba(255,255,255,.4)' }}>
                            {(s?.total_xp||0).toLocaleString()} XP
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-2">
                  {leaderboard.map((s,i) => {
                    const isMe = s.roll_no===studentData.roll_no;
                    return (
                      <motion.div key={s.roll_no}
                        initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                        style={{
                          background:isMe?'#EFF6FF':'#FFFFFF',
                          border:`1px solid ${isMe?'#BFDBFE':'#E2E8F0'}`,
                          boxShadow:'0 1px 6px rgba(0,0,0,.04)',
                        }}>
                        <span className="text-lg font-black w-8 text-center"
                          style={{ color:i<3?['#F59E0B','#94A3B8','#F97316'][i]:'rgba(255,255,255,.3)' }}>
                          #{i+1}
                        </span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                          style={{ background:`hsl(${(s.roll_no*37)%360},55%,40%)` }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-slate-900 text-sm">
                            {s.full_name}
                            {isMe && <span className="text-[10px] font-bold ml-2 text-blue-600">← You</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{s.current_badge||'🥉 Newcomer'}</p>
                        </div>
                        <p className="font-black text-sm" style={{ color:'#F59E0B' }}>
                          {(s.total_xp||0).toLocaleString()} XP
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══ ALL NOTIFICATIONS ══ */}
            {tab==='notifications' && (
              <motion.div key="notifs" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900 text-sm">{notifications.length} notifications</p>
                  {unreadCount>0 && (
                    <button onClick={markAllRead}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background:'#F8FAFC', color:'#64748B', border:'1px solid #E2E8F0' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {notifications.map((n,i) => {
                    const isFee = ['fee_due','fee_overdue','fee_fine','fee_payment'].includes(n.type);
                    const accent = n.type==='fee_overdue'||n.type==='fee_fine'?'#C0392B':n.type==='fee_due'?'#D97706':'#059669';
                    return (
                      <motion.div key={n.id}
                        initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.03 }}
                        onClick={() => markRead(String(n.id), n.type)}
                        className="rounded-2xl px-4 py-4 cursor-pointer transition-all hover:scale-[1.005]"
                        style={{
                          background:!n.is_read?(isFee?`rgba(${n.type==='fee_overdue'||n.type==='fee_fine'?'254,242,242':'255,251,235'},1)`:'#EFF6FF'):'#FFFFFF',
                          border:`1px solid ${!n.is_read?(isFee?`${accent}30`:'rgba(59,91,219,.2)'):'rgba(255,255,255,.06)'}`,
                        }}>
                        <div className="flex items-start gap-3">
                          {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background:isFee?accent:ACCENT }}/>}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm">{n.title}</p>
                            <p className="text-xs font-medium mt-0.5 text-slate-500">{n.message}</p>
                            {isFee && n.due_date && <MiniCountdown dueDate={n.due_date} accent={accent}/>}
                            <p className="text-[10px] mt-2 text-slate-400">
                              {new Date(n.created_at).toLocaleString('en-PK',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                            </p>
                          </div>
                          {isFee && <ChevronRight size={14} style={{ color:accent, flexShrink:0, marginTop:2 }}/>}
                        </div>
                      </motion.div>
                    );
                  })}
                  {notifications.length===0 && (
                    <div className="rounded-3xl p-16 text-center"
                      style={{ background:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                      <Bell size={32} className="mx-auto mb-3" style={{ color:'rgba(255,255,255,.2)' }}/>
                      <p className="font-bold" style={{ color:'rgba(255,255,255,.3)' }}>No notifications yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── QUIZ CHALLENGE MODAL ── */}
      <AnimatePresence>
        {showQuizModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !submittingQuiz && setShowQuizModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-xl bg-white rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{showQuizModal.topic?.topic}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{showQuizModal.topic?.subject_name} • Knowledge Check</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/20">
                    <Zap size={28} />
                  </div>
                </div>

                <div className="space-y-10 mb-10 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {showQuizModal.questions.map((q: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                          {i+1}
                        </span>
                        <p className="text-lg font-black text-slate-800 leading-relaxed">{q.q}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pl-12">
                        {q.a.map((opt: string, oi: number) => (
                          <button 
                            key={oi}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: oi }))}
                            className={cn(
                              "p-4 rounded-2xl text-left text-sm font-bold transition-all border-2",
                              quizAnswers[i] === oi 
                                ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-lg shadow-indigo-600/5 scale-[1.02]" 
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black",
                                quizAnswers[i] === oi ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                              )}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    disabled={submittingQuiz}
                    onClick={() => setShowQuizModal(null)}
                    className="flex-1 py-4 rounded-[1.5rem] font-black text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={submittingQuiz || Object.keys(quizAnswers).length < showQuizModal.questions.length}
                    onClick={handleQuizSubmit}
                    className="flex-[2] py-4 rounded-[1.5rem] font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs disabled:opacity-50 disabled:shadow-none"
                  >
                    {submittingQuiz ? 'Submitting...' : 'Submit Challenge'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background:'#FFFFFF', borderTop:'1px solid #E2E8F0', boxShadow:'0 -4px 20px rgba(0,0,0,.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {([{id:'dashboard',icon:Home},{id:'fees',icon:CreditCard},{id:'courses',icon:BookOpen},{id:'quizzes',icon:Zap},{id:'leaderboard',icon:Trophy},{id:'notifications',icon:Bell}] as const).map(({id,icon:Icon}) => {
            const active = tab===id;
            const hasBadge = id==='notifications' && unreadCount>0;
            const hasAlert = id==='fees' && overdueFees.length>0;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl relative"
                style={{ color:active?ACCENT:'#94A3B8' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                  style={active?{ background:`${ACCENT}20` }:{}}>
                  <Icon size={20}/>
                  {hasAlert && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background:'#C0392B' }}/>}
                  {hasBadge && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ background:'#C0392B' }}>{unreadCount>9?'9+':unreadCount}</span>}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight">
                  {id==='dashboard'?'Home':id==='leaderboard'?'Ranks':id==='courses'?'Courses':id==='quizzes'?'Quiz':id.charAt(0).toUpperCase()+id.slice(1)}
                </span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background:ACCENT }}/>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── FEE NOTIFICATION PANEL (bell icon opens this) ── */}
      <AnimatePresence>
        {notifPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setNotifPanelOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:380, damping:32 }}
              className="relative w-full max-w-2xl rounded-t-3xl overflow-hidden z-10"
              style={{ maxHeight:'85vh', background:'#FFFFFF', border:'1px solid #E2E8F0', borderBottom:'none', boxShadow:'0 -8px 40px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:'#E2E8F0' }}>
                <div>
                  <h3 className="font-black text-white">Fee Alerts</h3>
                  <p className="text-xs mt-0.5" style={{ color:'#64748B' }}>
                    Only fee notifications. Go to Notifications tab for all.
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {unreadCount>0 && (
                    <button onClick={markAllRead} className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background:'#F8FAFC', color:'#64748B', border:'1px solid #E2E8F0' }}>Mark read</button>
                  )}
                  <button onClick={() => setNotifPanelOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
                </div>
              </div>
              <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight:'calc(85vh - 80px)' }}>
                {notifications.filter(n => ['fee_due','fee_overdue','fee_fine','fee_payment'].includes(n.type)).length===0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle size={28} className="mx-auto mb-3 text-emerald-300"/>
                    <p className="font-medium text-sm text-slate-400">No fee notifications</p>
                  </div>
                ) : notifications.filter(n => ['fee_due','fee_overdue','fee_fine','fee_payment'].includes(n.type)).map((n,i) => {
                  const accent = n.type==='fee_overdue'||n.type==='fee_fine'?'#C0392B':n.type==='fee_due'?'#D97706':'#059669';
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                      onClick={() => { setNotifPanelOpen(false); goToFee(n); markRead(String(n.id)); }}
                      className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ background:`rgba(${n.type==='fee_overdue'||n.type==='fee_fine'?'254,242,242':'255,251,235'},1)`, border:`1px solid ${accent}30` }}>
                      <div className="flex items-start gap-3">
                        {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background:accent }}/>}
                        <div className="flex-1">
                          <p className="font-black text-slate-900 text-sm">{n.title}</p>
                          <p className="text-xs font-medium mt-0.5 text-slate-500">{n.message}</p>
                          {n.due_date && <MiniCountdown dueDate={n.due_date} accent={accent}/>}
                          <p className="text-[10px] mt-1.5 text-slate-400">
                            {new Date(n.created_at).toLocaleString('en-PK',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                          </p>
                        </div>
                        <ChevronRight size={14} style={{ color:accent, flexShrink:0, marginTop:2 }}/>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};