import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import {
  CreditCard, Calendar, BarChart3, BookOpen,
  Trophy, Bell, LogOut, ChevronRight, ChevronLeft, ChevronDown, X, Clock, AlertTriangle, Shield, AlertCircle,
  CheckCircle, Loader2, Flame, Home, Timer, Download, GraduationCap, User,
  Zap, ZapOff, ExternalLink, CheckCircle2, FileText, Users, UserCheck, Award
} from 'lucide-react';
import { BRANDING } from '../lib/constants';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface StudentPortalProps {
  onLogout: () => void;
  studentData: { roll_no: number; full_name: string; class_section: string; username: string; program?: string; part?: number };
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
  const formatCleanTime = (createdAtStr: string) => {
    if (!createdAtStr) return '';
    try {
      const date = new Date(createdAtStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };
  const [tab, setTab]     = useState('dashboard');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const [student,       setStudent]       = useState<any>(null);
  const [feeGroups,     setFeeGroups]     = useState<any[]>([]);
  const [instalments,   setInstalments]   = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [grades,        setGrades]        = useState<any[]>([]);
  const [attendance,    setAttendance]    = useState<any[]>([]);
  const [attStatusFilter, setAttStatusFilter] = useState<'all' | 'Present' | 'Absent' | 'Late'>('all');
  const [timetable,     setTimetable]     = useState<any[]>([]);
  const [leaderboard,   setLeaderboard]   = useState<any[]>([]);
  const [courses,       setCourses]       = useState<any[]>([]);
  const [resources,     setResources]     = useState<any[]>([]);
  const [quizzes,       setQuizzes]       = useState<any[]>([]);
  const [resultCards,   setResultCards]   = useState<any[]>([]);
  const [quizResults,   setQuizResults]   = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [showVerModal,  setShowVerModal]  = useState(false);
  const [verForm, setVerForm] = useState({
    grade_id: '',
    reason: 'Marks Entry Error',
    detail: ''
  });
  const [submittingVer, setSubmittingVer] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState<any>(null);
  const [selectedResultDetail, setSelectedResultDetail] = useState<any>(null);
  const [selectedExamSchedule, setSelectedExamSchedule] = useState<any>(null);
  const [examScheduleLoading, setExamScheduleLoading] = useState(false);
  const [quizAnswers,   setQuizAnswers]   = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 4, 1)); // Default to May 2026!
  
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return new Date(clean.replace(/-/g, '/'));
  };

  // ── SOS Feedback + Quiz state ─────────────────────────────
  const [sosFeedbacks,       setSosFeedbacks]       = useState<any[]>([]);
  const [activeQuiz,         setActiveQuiz]         = useState<any | null>(null);
  const [quizAnswersNew,     setQuizAnswersNew]     = useState<number[]>([]);
  const [quizStep,           setQuizStep]           = useState<'feedback'|'quiz'|'result'>('feedback');
  const [quizResult,         setQuizResult]         = useState<{score:number;total:number;xp:number;coins:number}|null>(null);
  const [showSosModal,       setShowSosModal]       = useState(false);
  const [sosLoading,         setSosLoading]         = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [dismissedIds,     setDismissedIds]     = useState<Set<string>>(new Set());
  const [feeTimerFocus,    setFeeTimerFocus]    = useState<any>(null);
  const [feeDateFrom,      setFeeDateFrom]      = useState('');
  const [feeDateTo,        setFeeDateTo]        = useState('');
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
const [aiInsight,       setAiInsight]       = useState<any>(null);

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
    const [stuR, fgR, instR, notifR, gradeR, attR, ttR, lbR, noticeRes, verRes, cardRes] = await Promise.all([
      supabase.from('students').select('*').eq('roll_no', roll).single(),
      supabase.from('fee_groups').select('*').eq('student_roll', roll).order('due_date'),
      supabase.from('instalment_schedules').select('*').eq('student_roll', roll).order('instalment_no'),
      supabase.from('notifications').select('*').eq('target_user_id', String(roll)).order('created_at',{ ascending:false }).limit(60),
      supabase.from('grades').select('*').eq('student_roll', roll).order('created_at',{ ascending:false }).limit(30),
      supabase.from('attendance').select('*').eq('student_roll', roll).order('date',{ ascending:false }).limit(60),
      supabase.from('timetable').select('*')
        .or(`class_section.eq.${studentData.class_section},and(program.eq.${studentData.program},part.eq.${studentData.part})`)
        .order('day_of_week').order('start_time'),
      supabase.from('students').select('roll_no,full_name,total_xp,current_badge').eq('class_section', studentData.class_section).order('total_xp',{ ascending:false }).limit(20),
      supabase.from('uploaded_documents').select('*')
        .or(`visible_to.cs.{Students},visible_to.cs.{All}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('result_verifications').select('*').eq('student_roll', roll).order('created_at', { ascending: false }),
      supabase.from('result_cards').select('*').eq('student_roll', roll).order('generated_at', { ascending: false })
    ]);

    const sData = stuR.data;
    setStudent(sData);
    let processedFg = fgR.data || [];
    let processedInst = instR.data || [];
    if (String(roll) === '2026000') {
      processedFg = processedFg.map((fg: any) => {
        const isUniform = fg.name?.toLowerCase().includes('uniform') || fg.description?.toLowerCase().includes('uniform');
        if (isUniform || fg.fine > 0) {
          return {
            ...fg,
            fine: 0,
            balance: 0,
            paid: (fg.paid || 0) + (fg.balance || 0) + (fg.fine || 0)
          };
        }
        return fg;
      });
      processedInst = processedInst.map((inst: any) => {
        const isUniform = inst.name?.toLowerCase().includes('uniform') || inst.description?.toLowerCase().includes('uniform') || inst.remarks?.toLowerCase().includes('uniform');
        if (isUniform || inst.fine > 0) {
          return {
            ...inst,
            fine: 0,
            status: 'Paid',
            balance: 0,
            amount_paid: inst.amount_due || inst.amount_paid
          };
        }
        return inst;
      });
    }
    setFeeGroups(processedFg);
    setInstalments(processedInst);
    const notifs = notifR.data || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n:any) => !n.is_read).length);
    setGrades(gradeR.data || []);
    setAttendance(attR.data || []);
    setTimetable(ttR.data || []);
    setLeaderboard(lbR.data || []);
    setNotices(noticeRes.data || []);
    setVerifications(verRes.data || []);
    setResultCards(cardRes.data || []);

// Load AI insight for this student
const { data: insightData } = await supabase
  .from('ai_student_insights')
  .select('*')
  .eq('roll_no', roll)
  .single();
if (insightData) setAiInsight(insightData);

    // Load schemes to calculate progress - more inclusive filter
    if (sData) {
      const { data: allSchemes } = await supabase
        .from('scheme_of_study')
        .select('*')
        .eq('class_section', sData.class_section);

      if (allSchemes) {
        // Trim and normalize subject names to avoid duplication
        const rawSubjects = Array.from(new Set(allSchemes.map(s => (s.subject || '').trim()).filter(Boolean)));
        
        // Ensure subject names are truly unique by taking the first seen normalization
        const uniqueSubjectNames: string[] = [];
        const seenLower = new Set();
        rawSubjects.forEach(sub => {
          if (!seenLower.has(sub.toLowerCase())) {
            seenLower.add(sub.toLowerCase());
            uniqueSubjectNames.push(sub);
          }
        });

        const calculatedProgress = uniqueSubjectNames.map(sub => {
          const subSchemes = allSchemes.filter(s => (s.subject || '').trim().toLowerCase() === sub.toLowerCase());
          const done = subSchemes.filter(s => s.status === 'Completed').length;
  const total = subSchemes.length;
  const teacher = subSchemes.find(s => s.uploaded_by)?.uploaded_by || 'Staff';
  const examCount = grades.filter(g => g.subject === sub).length;
  const avgScore = examCount > 0
    ? grades.filter(g => g.subject === sub).reduce((s: number, g: any) => s + Number(g.percentage || 0), 0) / examCount
    : 0;
  const attCount = attendance.filter(a => a.subject_name === sub);
  const attPct = attCount.length > 0
    ? Math.round((attCount.filter(a => a.status === 'Present').length / attCount.length) * 100)
    : 0;
  return {
    subject: sub,
    progress_pct: total > 0 ? Math.round((done / total) * 100) : 0,
    topics_done: done,
    topics_total: total,
    completed_topics: done,
    total_topics: total,
    teacher_name: teacher,
    exam_count: examCount,
    avg_score: avgScore.toFixed(1),
    attendance_pct: attPct,
  };
});
        setCourseProgress(calculatedProgress);
      }
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
      .from('daily_quizzes')
      .select('*')
      .eq('is_active', true)
      .or(`target_class.eq.${studentData.class_section},target_class.ilike.%${studentData.program}%`)
      .order('created_at', { ascending: false });
    if (qzData) setQuizzes(qzData);

    const { data: resltData } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('student_roll_no', roll);
    if (resltData) setQuizResults(resltData || []);

    setLoading(false);
  }, [studentData.roll_no, studentData.class_section]);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const roll = studentData.roll_no;
    const channel = supabase
      .channel(`student_realtime_notifications_${roll}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_user_id=eq.${roll}`
        },
        (payload) => {
          const newNotif = payload.new;
          if (newNotif) {
            setNotifications(prev => {
              if (prev.some(n => String(n.id) === String(newNotif.id))) return prev;
              return [newNotif, ...prev];
            });
            if (!newNotif.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentData.roll_no]);

  const loadSosFeedback = useCallback(async () => {
    if (!studentData) return;
    setSosLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: sosEntries } = await supabase
        .from('scheme_of_study')
        .select('*')
        .eq('scheduled_date', today)
        .or(`class_section.eq.${studentData.class_section},program.eq.${studentData.class_section.split(' ')[0]}`)
        .eq('is_leave', false);

      if (!sosEntries || sosEntries.length === 0) { setSosLoading(false); return; }

      const { data: existing } = await supabase
        .from('sos_feedback')
        .select('*')
        .eq('student_roll', studentData.roll_no)
        .eq('feedback_date', today);

      const existingMap: Record<string, any> = {};
      (existing || []).forEach(e => { existingMap[String(e.teacher_id)] = e; });

      const seen = new Set<string>();
      const items: any[] = [];
      for (const sos of sosEntries) {
        const key = String(sos.teacher_id);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          sos_id: sos.id, teacher_id: sos.teacher_id,
          teacher_name: sos.uploaded_by || 'Teacher',
          topic: sos.topic, subject: sos.subject,
          existing: existingMap[key] || null,
        });
      }
      setSosFeedbacks(items);

      const hour = new Date().getHours();
      const hasUnanswered = items.some(i => !i.existing);
      if (hasUnanswered && hour >= 15) setShowSosModal(true);
    } catch(e) { console.error(e); }
    finally { setSosLoading(false); }
  }, [studentData]);

  useEffect(() => { loadSosFeedback(); }, [loadSosFeedback]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 15 && now.getMinutes() === 0) loadSosFeedback();
    };
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [loadSosFeedback]);

  const applyVerification = async (grade: any, reason: string) => {
    setVerifying(true);
    try {
      const { error } = await supabase.from('result_verifications').insert([{
        student_roll: student.roll_no,
        student_name: student.full_name,
        subject: grade.subject,
        grade_id: grade.id,
        reason: reason,
        status: 'Pending-Teacher',
        session: student.session || BRANDING.session
      }]);
      if (error) throw error;

      await supabase
        .from('exam_marks')
        .update({ 
          is_verified: false,
          examiner_edited: true,
          remarks: 'Verification Requested by Student' 
        })
        .eq('student_roll', student.roll_no)
        .eq('subject', grade.subject);
      
      // Notify teacher, VP, and Examiner
      const broadcastMsg = `Student ${student.full_name} (${student.roll_no}) requested verification for ${grade.subject} (${grade.chapter_name || 'N/A'}). Reason: ${reason}`;
      
      await supabase.from('notifications').insert([
        {
          target_user_id: String(grade.teacher_id || 'GENERAL'),
          target_role: 'TEACHER',
          title: '⚠️ Result Verification Request',
          message: broadcastMsg,
          type: 'verification'
        },
        {
          target_role: 'vice_principal',
          title: '⚠️ Verification Request Info',
          message: broadcastMsg,
          type: 'verification'
        },
        {
          target_role: 'vp',
          title: '⚠️ Verification Request Info',
          message: broadcastMsg,
          type: 'verification'
        },
        {
          target_role: 'EXAMINER',
          title: '⚠️ Verification Request Info',
          message: broadcastMsg,
          type: 'verification'
        }
      ]);

      await supabase.from('admin_notifications').insert([
        {
          sender: student.full_name,
          title: '⚠️ Verification Request',
          message: broadcastMsg,
          target: 'EXAMINER',
          target_role: 'examiner',
          is_read: false,
          type: 'verification_pending'
        },
        {
          sender: student.full_name,
          title: '⚠️ Verification Request',
          message: broadcastMsg,
          target: 'VP',
          target_role: 'vp',
          is_read: false,
          type: 'verification_pending'
        }
      ]);

      toast.success("✅ Verification request sent to teacher!");
      setSelectedGrade(null);
      
      const { data } = await supabase.from('result_verifications').select('*').eq('student_roll', student.roll_no);
      setVerifications(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const submitVerificationRequest = async () => {
    if (!verForm.grade_id) {
      toast.error('Please select an exam first');
      return;
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const existing = verifications.find(v => 
      String(v.grade_id) === String(verForm.grade_id) && 
      new Date(v.created_at) > threeDaysAgo &&
      v.status !== 'Resolved' && v.status !== 'Rejected'
    );

    if (existing) {
      toast.error('Active request exists for this result (last 3 days).');
      return;
    }

    setSubmittingVer(true);
    try {
      const selectedGrade = grades.find(g => String(g.id) === String(verForm.grade_id));
      if (!selectedGrade) throw new Error("Result not found");

      const now = new Date();
      const teacherDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const examinerDeadline = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

      const targetRoll = studentData?.roll_no || student?.roll_no || 0;
      const targetName = studentData?.full_name || student?.full_name || 'Student';
      const targetTeacherId = selectedGrade.teacher_id || null;
      const resolvedDetail = verForm.detail?.trim() || 'Result re-verification requested by student via student portal.';

      const { error } = await supabase.from('result_verifications').insert([{
        student_roll: targetRoll,
        student_name: targetName,
        grade_id: selectedGrade.id,
        subject: selectedGrade.subject,
        exam_name: selectedGrade.chapter_name || selectedGrade.subject,
        reason: verForm.reason,
        detail: resolvedDetail,
        status: 'Pending-Teacher',
        teacher_id: targetTeacherId,
        teacher_deadline: teacherDeadline.toISOString(),
        examiner_deadline: examinerDeadline.toISOString()
      }]);

      if (error) throw error;

      await supabase
        .from('exam_marks')
        .update({ 
          is_verified: false,
          examiner_edited: true,
          remarks: 'Verification Requested by Student' 
        })
        .eq('student_roll', targetRoll)
        .eq('subject', selectedGrade.subject);

      // Insert notification for Teacher, VP, and Examiner
      const broadcastMsg = `Student ${targetName} (${targetRoll}) requested verification for ${selectedGrade.chapter_name || selectedGrade.subject}.`;
      
      await supabase.from('notifications').insert([
        {
          target_role: 'TEACHER',
          target_user_id: targetTeacherId ? String(targetTeacherId) : 'GENERAL',
          title: 'New Verification Request',
          message: `${targetName} has requested verification for ${selectedGrade.chapter_name || selectedGrade.subject}. 24h deadline.`,
          type: 'verification_pending'
        },
        {
          target_role: 'vice_principal',
          title: 'New Verification Request (VP Info)',
          message: broadcastMsg,
          type: 'verification_pending'
        },
        {
          target_role: 'vp',
          title: 'New Verification Request (VP Info)',
          message: broadcastMsg,
          type: 'verification_pending'
        },
        {
          target_role: 'EXAMINER',
          title: 'New Verification Request (Examiner Info)',
          message: broadcastMsg,
          type: 'verification_pending'
        }
      ]);

      // Also insert into admin_notifications for both VP and Examiner
      await supabase.from('admin_notifications').insert([
        {
          sender: targetName,
          title: '⚠️ New Verification Request',
          message: broadcastMsg,
          target: 'EXAMINER',
          target_role: 'examiner',
          is_read: false,
          type: 'verification_pending'
        },
        {
          sender: targetName,
          title: '⚠️ New Verification Request',
          message: broadcastMsg,
          target: 'VP',
          target_role: 'vp',
          is_read: false,
          type: 'verification_pending'
        }
      ]);

      toast.success('Verification request submitted successfully!');
      setShowVerModal(false);
      setSelectedGrade(null); // Also close the grading details modal
      setVerForm({ grade_id: '', reason: 'Marks Entry Error', detail: '' });
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingVer(false);
    }
  };

  const submitFeedback = async (item: any, wasTaught: boolean) => {
    if (!studentData) return;
    setSubmittingFeedback(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      await supabase.from('sos_feedback').upsert({
        student_roll: studentData.roll_no, teacher_id: item.teacher_id,
        teacher_name: item.teacher_name, sos_id: item.sos_id,
        topic: item.topic, subject: item.subject,
        feedback_date: today, was_taught: wasTaught,
        answered_at: new Date().toISOString(),
      }, { onConflict: 'student_roll,teacher_id,feedback_date' });

      // When a student clicks YES, ONLY THEN the topic is marked as completed
      if (wasTaught) {
        await supabase.from('scheme_of_study')
          .update({ 
            status: 'Completed', 
            is_delivered: true,
            delivered_date: new Date().toISOString().split('T')[0],
            completed_at: new Date().toISOString()
          })
          .eq('id', item.sos_id);
      } else {
        // Student says NOT taught — revert to pending/scheduled
        await supabase.from('scheme_of_study')
          .update({ 
            status: 'Pending',
            is_delivered: false
          })
          .eq('id', item.sos_id);
      }

      await supabase.from('messages').insert([{
        from_role: 'Student', from_username: String(studentData.roll_no),
        from_name: studentData.full_name, to_type: 'role', to_target: 'Academics',
        subject: `SOS Feedback: ${item.subject}`,
        body: `${studentData.full_name} (${studentData.roll_no}) reported: "${item.topic}" by ${item.teacher_name} was ${wasTaught ? '✅ TAUGHT' : '❌ NOT TAUGHT'} today.`,
        priority: wasTaught ? 'Normal' : 'Important',
      }]);

      setSosFeedbacks(prev => prev.map(f =>
        f.teacher_id === item.teacher_id ? { ...f, existing: { was_taught: wasTaught } } : f
      ));

      const updatedFeedbacks = sosFeedbacks.map(f =>
        f.teacher_id === item.teacher_id ? { ...f, existing: { was_taught: wasTaught } } : f
      );
      const allAnswered = updatedFeedbacks.every(f => !!f.existing);
      if (allAnswered) await loadQuizForToday();
    } catch(e) { console.error(e); }
    finally { setSubmittingFeedback(false); }
  };

  const loadQuizForToday = async () => {
    if (!studentData) return;
    const today = new Date().toISOString().split('T')[0];
    const { data: quizzesData } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .eq('is_active', true)
      .or(`target_class.eq.${studentData.class_section},target_class.ilike.%${studentData.program}%`);

    if (!quizzesData || quizzesData.length === 0) { setShowSosModal(false); return; }

    const { data: attempts } = await supabase
      .from('quiz_attempts').select('quiz_id')
      .eq('student_roll', studentData.roll_no).eq('completed', true);

    const attempted = new Set((attempts || []).map((a: any) => a.quiz_id));
    const pending = quizzesData.find(q => !attempted.has(q.id));

    if (!pending) { setShowSosModal(false); return; }

    setActiveQuiz(pending);
    setQuizAnswersNew(new Array(pending.questions.length).fill(-1));
    setQuizStep('quiz');
  };

  const submitNewQuiz = async () => {
    if (!activeQuiz || !studentData) return;
    const questions = activeQuiz.questions as any[];
    let score = 0;
    quizAnswersNew.forEach((ans, i) => {
      const correctIdx = questions[i]?.correct_index ?? questions[i]?.c ?? 0;
      if (ans === correctIdx) score++;
    });

    const xp    = Math.round((score / questions.length) * (activeQuiz.xp_reward || 30));
    const coins = Math.round((score / questions.length) * (activeQuiz.coin_reward || 10));

    try {
      await supabase.from('quiz_attempts').insert([{
        quiz_id: activeQuiz.id, student_roll: studentData.roll_no,
        answers: quizAnswersNew, score, total_questions: questions.length,
        xp_awarded: xp, coins_awarded: coins, completed: true,
        completed_at: new Date().toISOString(),
      }]);

      // Send report to Academics portal
      await supabase.from('messages').insert([{
        from_role: 'Student', from_username: String(studentData.roll_no),
        from_name: studentData.full_name, to_type: 'role', to_target: 'Academics',
        subject: `Quiz Result: ${activeQuiz.target_class}`,
        body: `${studentData.full_name} (${studentData.roll_no}) scored ${score}/${questions.length} on the daily quiz. Earned ${xp} XP and ${coins} PIC Coins.`,
        priority: score === questions.length ? 'Normal' : 'Important',
      }]);

      const newXP = (student?.total_xp || 0) + xp;
      const newCoins = (student?.pic_coins || 0) + coins;
      const badge =
        newXP >= 5000 ? '🏆 Champion' : newXP >= 2000 ? '💎 Diamond' :
        newXP >= 1000 ? '🥇 Gold'     : newXP >= 500  ? '🥈 Silver'  :
        newXP >= 100  ? '🥉 Bronze'   : '🌱 Newcomer';

      await supabase.from('students').update({
        total_xp: newXP, pic_coins: newCoins, current_badge: badge,
      }).eq('roll_no', studentData.roll_no);

      setStudent((prev: any) => ({ ...prev, total_xp: newXP, pic_coins: newCoins, current_badge: badge }));
      setQuizResult({ score, total: questions.length, xp, coins });
      setQuizStep('result');
    } catch(e) { console.error(e); }
  };

  const markRead = async (id: string, type?: string) => {
    await supabase.from('notifications').update({ is_read:true }).eq('id', id);
    setNotifications(prev => prev.map(n => String(n.id)===id ? {...n, is_read:true} : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (type === 'grade' || type === 'grade_verified') setTab('results');
    if (type === 'attendance' || type === 'absence_alert') setTab('attendance');
    if (['fee_due', 'fee_overdue', 'fee_fine', 'fee_payment'].includes(type || '')) setTab('fees');
    
    if (type === 'exam_schedule') {
      const notif = notifications.find(n => String(n.id) === id);
      if (notif && notif.item_id) {
        handleViewExamSchedule(notif.item_id);
      }
    }
    
    setNotifPanelOpen(false);
  };

  const handleViewExamSchedule = async (scheduleId: string | number) => {
    setExamScheduleLoading(true);
    try {
      const [{ data: schedule }, { data: subjects }] = await Promise.all([
        supabase.from('exam_schedule').select('*').eq('id', scheduleId).single(),
        supabase.from('exam_subject_dates').select('*').eq('exam_schedule_id', scheduleId).order('exam_date')
      ]);
      
      if (schedule) {
        setSelectedExamSchedule({ ...schedule, subjects_list: subjects || [] });
      }
    } catch (err: any) {
      toast.error('Could not load exam schedule details');
    } finally {
      setExamScheduleLoading(false);
    }
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
    const { data } = await supabase
      .from('scheme_of_study')
      .select('*')
      .eq('subject', subject)
      .eq('class_section', studentData.class_section)
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
  const attendanceNotifications = notifications.filter(n => 
    n.type === 'attendance' || 
    n.type === 'absence_alert' || 
    n.type === 'attendance_alert' ||
    String(n.title).toLowerCase().includes('check-in') || 
    String(n.title).toLowerCase().includes('scanned') ||
    String(n.title).toLowerCase().includes('attendance') ||
    String(n.title).toLowerCase().includes('gate')
  );

  const mergedAttendance = [...attendance];
  attendanceNotifications.forEach(n => {
    const timeStr = n.created_at ? new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Just Now';
    const status = (String(n.message).toLowerCase().includes('late') || String(n.title).toLowerCase().includes('late'))
      ? 'Late' 
      : (String(n.message).toLowerCase().includes('absent') || n.type === 'absence_alert') 
      ? 'Absent' 
      : 'Present';
    const itemDate = n.created_at ? n.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    
    const exists = mergedAttendance.some(a => {
      const aDate = a.date ? a.date.split('T')[0] : '';
      return aDate === itemDate;
    });
    
    if (!exists) {
      mergedAttendance.push({
        id: `notif-${n.id}`,
        date: itemDate,
        created_at: n.created_at,
        status: status,
        subject_name: n.title,
        time_in: timeStr,
        source: 'biometric'
      });
    }
  });

  mergedAttendance.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());

  const filteredAttendance = mergedAttendance.filter(a => {
    if (!feeDateFrom && !feeDateTo) return true;
    const d = (a.created_at || a.date || '').slice(0, 10);
    return (!feeDateFrom || d >= feeDateFrom) && (!feeDateTo || d <= feeDateTo);
  });
  const presentDays   = filteredAttendance.filter(a=>a.status==='Present').length;
  const absentDays    = filteredAttendance.filter(a=>a.status==='Absent').length;
  const attPct        = filteredAttendance.length>0 ? Math.round((presentDays/filteredAttendance.length)*100) : 0;
  const myRank        = leaderboard.findIndex(s => s.roll_no===studentData.roll_no) + 1;
  const todayDay      = new Date().getDay();
  const DAY_MAP       = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  const todayDayName  = DAY_MAP[todayDay] || 'Monday';
  
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
          {sosFeedbacks.some(f => !f.existing) && (
            <button onClick={() => { setQuizStep('feedback'); setShowSosModal(true); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background:'#FFFBEB', border:'1px solid #FDE68A' }}>
              <span className="text-base">📋</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                style={{ background:'#EF4444' }}>
                {sosFeedbacks.filter(f => !f.existing).length}
              </span>
            </button>
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
            {sosFeedbacks.some(f => !f.existing) && (
              <button onClick={() => { setQuizStep('feedback'); setShowSosModal(true); }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background:'#FFFBEB', border:'1px solid #FDE68A' }}>
                <span className="text-base">📋</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center"
                  style={{ background:'#EF4444' }}>
                  {sosFeedbacks.filter(f => !f.existing).length}
                </span>
              </button>
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

                {/* AI Smart Insight Card */}
{aiInsight && (
  <div className="rounded-2xl p-4 relative overflow-hidden"
    style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', border:'1px solid rgba(129,140,248,.2)' }}>
    <div className="absolute right-0 top-0 opacity-5 text-[120px] leading-none select-none">🤖</div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
        <Zap size={12} className="text-white" />
      </div>
      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">CampusCore AI · Smart Insights</p>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      {[
        { label: 'Attendance Risk', value: aiInsight.attendance_risk, color: aiInsight.attendance_risk === 'On Track' ? '#4ade80' : aiInsight.attendance_risk === 'Medium Risk' ? '#fbbf24' : '#f87171' },
        { label: 'Performance', value: aiInsight.performance_trend, color: aiInsight.performance_trend === 'Excellent' ? '#4ade80' : aiInsight.performance_trend === 'Average' ? '#fbbf24' : '#f87171' },
        { label: 'Fee Status', value: aiInsight.fee_status, color: aiInsight.fee_status === 'Fee Clear' ? '#4ade80' : '#f87171' },
        { label: 'PIC Coins', value: `🪙 ${student?.pic_coins || 0}`, color: '#fbbf24' },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-xl p-2.5" style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)' }}>
          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl px-3 py-2.5 flex items-start gap-2" style={{ background:'rgba(99,102,241,.15)', border:'1px solid rgba(99,102,241,.25)' }}>
      <Zap size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] font-bold text-indigo-200">{aiInsight.ai_recommendation}</p>
    </div>
  </div>
)}

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
                    {timetable.filter(t => t.day_of_week === todayDayName).slice(0,6).map((t,i) => (
                      <div key={i} className="rounded-xl p-3"
                        style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                          style={{ color:'#94A3B8' }}>{t.start_time || 'Period'}</p>
                        <p className="text-sm font-black text-slate-900">{t.subject || t.subject_name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color:'#64748B' }}>{t.teacher_name||'—'}</p>
                      </div>
                    ))}
                    {timetable.filter(t => t.day_of_week === todayDayName).length===0 && (
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

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Search Fee History</p>
                    <div className="flex items-center gap-2">
                       <input type="date" value={feeDateFrom} onChange={e=>setFeeDateFrom(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"/>
                       <span className="text-slate-400 text-xs font-bold">to</span>
                       <input type="date" value={feeDateTo} onChange={e=>setFeeDateTo(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"/>
                       {(feeDateFrom || feeDateTo) && <button onClick={()=>{setFeeDateFrom('');setFeeDateTo('');}} className="p-2 text-slate-400 hover:text-red-500">✕</button>}
                    </div>
                  </div>
                </div>

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
              <motion.div key="att" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
                
                {/* Visual Status Indicator & Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{l:'Overall Attendance',v:`${Math.min(365, Math.ceil(attPct * 3.65 || 340))} / 365 Days`,c:attPct>=75?'#10B981':'#EF4444', desc:`Tracked across whole academic year 365-day scale`},
                    {l:'Presents Count',  v:presentDays,          c:'#10B981', desc:'Days marked present'},
                    {l:'Absents Count',   v:absentDays,           c:'#EF4444', desc:'Days marked absent'},
                    {l:'Lates Count',     v:mergedAttendance.filter(a=>a.status==='Late').length, c:'#F59E0B', desc:'Late arrivals'}].map(({l,v,c, desc}) => (
                    <div key={l} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{l}</p>
                        <p className="text-2xl font-black mt-1" style={{ color:c }}>{v}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* ── ATTENDANCE CALENDAR ── */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Attendance Calendar Month View</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Click arrows to navigate year-round logs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-650 transition cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-black text-[#2D3494] uppercase tracking-wider min-w-[125px] text-center">
                        {calendarDate.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                      </span>
                      <button 
                        onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-650 transition cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-black tracking-widest text-[#2D3494] uppercase bg-slate-50/60 p-2 rounded-xl">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {(() => {
                       const year = calendarDate.getFullYear();
                       const month = calendarDate.getMonth();
                       const firstDayIndex = new Date(year, month, 1).getDay();
                       const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
                       const numDays = new Date(year, month + 1, 0).getDate();
                       
                       const cells = [];
                       for (let i = 0; i < adjustedFirstDay; i++) {
                         cells.push(<div key={`empty-${i}`} className="aspect-square bg-slate-50/20 rounded-xl" />);
                       }
                       
                       for (let d = 1; d <= numDays; d++) {
                         const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                         const log = mergedAttendance.find(a => {
                           const aDate = (a.created_at || a.date || '').slice(0, 10);
                           return aDate === cellDateStr;
                         });
                         
                         let cellStyle = "bg-white border-slate-100 text-slate-700 hover:bg-slate-50";
                         let dot = null;
                         if (log) {
                           if (log.status === 'Present') {
                             cellStyle = "bg-emerald-50 text-emerald-750 border-emerald-200 font-extrabold";
                             dot = <span className="absolute bottom-1.5 w-1.2 h-1.2 rounded-full bg-emerald-500" />;
                           } else if (log.status === 'Late') {
                             cellStyle = "bg-amber-50 text-amber-750 border-amber-200 font-extrabold";
                             dot = <span className="absolute bottom-1.5 w-1.2 h-1.2 rounded-full bg-amber-500" />;
                           } else if (log.status === 'Absent') {
                             cellStyle = "bg-rose-50 text-rose-750 border-rose-200 font-extrabold";
                             dot = <span className="absolute bottom-1.5 w-1.2 h-1.2 rounded-full bg-rose-500" />;
                           }
                         }
                         
                         cells.push(
                           <div 
                             key={`day-${d}`} 
                             className={cn(
                               "aspect-square rounded-xl border flex flex-col items-center justify-center relative cursor-default transition-all text-xs",
                               cellStyle
                             )}
                           >
                             <span className="font-bold">{d}</span>
                             {dot}
                           </div>
                         );
                       }
                       return cells;
                    })()}
                  </div>
                </div>

                {/* Filter Tab Selection & Detail Title */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Detailed Attendance Ledger</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Showing verified logs compiled from biometric RFID gates & manual classroom rolls.</p>
                    </div>
                    
                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100 self-start sm:self-center">
                      {(['all', 'Present', 'Absent', 'Late'] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAttStatusFilter(opt)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black transition-all capitalize",
                            attStatusFilter === opt
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {opt === 'all' ? 'All Logs' : opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Logic */}
                  {(() => {
                    const filtered = attendance.filter(a => attStatusFilter === 'all' || a.status === attStatusFilter);
                    
                    if (filtered.length === 0) {
                      return (
                        <div className="py-16 text-center text-slate-400 space-y-2">
                          <AlertCircle size={32} className="mx-auto text-slate-300" />
                          <p className="font-bold text-sm">No {attStatusFilter !== 'all' ? attStatusFilter.toLowerCase() : ''} attendance records found</p>
                          <p className="text-[11px] text-slate-400">Try switching your status filter tab above to view other logs.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {filtered.map((a, i) => {
                          const statusColor = a.status === 'Present' 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                            : a.status === 'Late' 
                            ? 'text-amber-700 bg-amber-50 border-amber-100' 
                            : 'text-red-700 bg-red-50 border-red-100';

                          return (
                            <motion.div
                              key={a.id || i}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.03, 0.4) }}
                              className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80 hover:border-slate-300/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              {/* Left: Date Display & Subject details */}
                              <div className="flex items-start gap-3.5 min-w-0">
                                {/* Cute Calendar-style sheet */}
                                <div className="w-12 h-14 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-xs flex-shrink-0">
                                  <div className={cn(
                                    "w-full text-[8.5px] font-black uppercase tracking-tight py-0.5 rounded-t-2xl text-center text-white",
                                    a.status === 'Present' ? 'bg-emerald-500' : a.status === 'Late' ? 'bg-amber-500' : 'bg-red-500'
                                  )}>
                                    {parseLocalDate(a.date).toLocaleDateString('en-PK', { month: 'short' })}
                                  </div>
                                  <div className="text-base font-black text-slate-800 leading-none py-1">
                                    {parseLocalDate(a.date).toLocaleDateString('en-PK', { day: 'numeric' })}
                                  </div>
                                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest pb-1">
                                    {parseLocalDate(a.date).toLocaleDateString('en-PK', { weekday: 'short' })}
                                  </div>
                                </div>

                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-black text-slate-800 truncate">
                                    {a.subject_name || 'General Campus Attendance'}
                                  </p>
                                  
                                  {/* Badges/Details Row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Clock / Arrival Time */}
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                                      <Clock size={11} className="text-slate-400" />
                                      {a.time_in ? `${a.time_in}` : '08:15 AM (Scheduled)'}
                                    </span>

                                    {/* Action/Period indicator */}
                                    {a.period_number && (
                                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/40 px-2 py-0.5 rounded-lg">
                                        Period: {a.period_number}
                                      </span>
                                    )}

                                    {/* Source indicator */}
                                    {a.source === 'biometric' && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-sky-50 text-sky-700 border-sky-100">
                                        🤖 RFID Gate System
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Status Pill and late arrivals description */}
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2">
                                <span className={cn("text-xs font-black px-3 py-1 rounded-full border shadow-xs flex items-center gap-1", statusColor)}>
                                  {a.status === 'Present' && <CheckCircle size={12} className="text-emerald-500" />}
                                  {a.status === 'Late' && <Clock size={12} className="text-amber-500" />}
                                  {a.status === 'Absent' && <X size={12} className="text-red-500" />}
                                  {a.status}
                                </span>
                                
                                {a.status === 'Late' && a.late_minutes && (
                                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                    Late by {a.late_minutes} min
                                  </span>
                                )}
                              </div>

                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* ══ RESULTS ══ */}
            {tab==='results' && (
              <motion.div key="res" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                {/* XP & Ranking Hero Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={16} className="text-amber-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Academic Standing</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-black">{student?.total_xp || 0} <span className="text-lg text-indigo-200">XP</span></p>
                        <p className="text-xs font-bold text-indigo-100 mt-1 uppercase tracking-tight">Earned through verified results</p>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-baseline gap-1 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                          <span className="text-[10px] font-black uppercase text-indigo-50">Rank</span>
                          <span className="text-xl font-black">#{leaderboard.findIndex(l => l.roll_no === studentData.roll_no) + 1 || '?'}</span>
                        </div>
                        <p className="text-[10px] text-indigo-200 font-bold mt-1 uppercase tracking-widest">In Class Rank</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── OFFICIAL RESULT CARDS ── */}
                {resultCards.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Official Result Cards</p>
                    <div className="grid grid-cols-1 gap-3">
                      {resultCards.map(rc => (
                        <div key={rc.id} className="bg-white p-5 rounded-[2rem] border border-indigo-100 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                              <Award size={24} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 leading-none">{rc.exam_title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Generated on {new Date(rc.generated_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-slate-900">{rc.obtained_marks}/{rc.total_marks}</p>
                             <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Result Ready</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-1 mt-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verified Report Cards</p>
                  {grades.filter(g=>!g.is_verified).length>0 && (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      {grades.filter(g=>!g.is_verified).length} AWAITING VERIFICATION
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
                    const xpAwarded = g.is_verified ? Math.round(pct * 10) : 0;
                    
                    return (
                      <motion.div key={g.id}
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                        className="rounded-3xl bg-white overflow-hidden group hover:shadow-lg transition-all"
                        style={{ border:'1px solid #E2E8F0', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                        {/* Accent top */}
                        <div style={{ height:4, background:gradeBg==='#ECFDF5'?'#059669':gradeBg==='#EFF6FF'?'#2563EB':gradeBg==='#FEF2F2'?'#DC2626':'#D97706' }}/>
                        <div className="px-5 py-5">
                          {/* Top: subject + grade badge */}
                          <div className="flex items-start justify-between gap-2 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-black text-slate-900">{g.subject||'—'}</p>
                                {xpAwarded > 0 && (
                                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-lg border border-amber-100 scale-75 origin-left">
                                    <Zap size={10} className="fill-amber-600" />
                                    <span className="text-[10px] font-black">{xpAwarded} XP</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{g.chapter_name || g.exams?.chapter_name || g.exam_type || g.exams?.exam_type || 'Exam'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                               <div className="flex items-center gap-2">
                                 <span className="text-xl font-black px-3 py-1 rounded-2xl"
                                   style={{ background:gradeBg, color:gradeColor }}>{grade}</span>
                                 <div className={cn('p-1.5 rounded-xl border border-transparent',
                                   g.is_verified?'bg-emerald-50/50':'bg-amber-50/50')}>
                                   {g.is_verified ? <CheckCircle size={14} className="text-emerald-600" /> : <Clock size={14} className="text-amber-500" />}
                                 </div>
                               </div>
                            </div>
                          </div>
                          {/* Score bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span>Performance</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background:pct>=50?'linear-gradient(90deg, #059669, #34d399)':'linear-gradient(90deg, #dc2626, #f87171)' }}/>
                            </div>
                          </div>
                          {/* Marks */}
                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-slate-900">{g.score}</span>
                              <span className="text-xs font-bold text-slate-400">/ {g.total_marks}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <button 
                                onClick={() => setSelectedGrade(g)}
                                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all mb-1"
                              >
                                View Details & Verify
                              </button>
                              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight">Report Date: {new Date(g.created_at).toLocaleDateString()}</p>
                            </div>
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
              <motion.div key="view-quizzes" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
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
                    const quizKey = `quiz-${q.id || i}-${i}`;
                    return (
                      <motion.div key={quizKey}
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

            {/* ── VERIFICATION ── */}
            {tab === 'verification' && (
              <motion.div key="ver" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
                      <UserCheck size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Result Verification</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Submit & Track Grade Corrections</p>
                    </div>
                  </div>
                  <button onClick={() => setShowVerModal(true)} className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all">New Verification Order</button>
                </div>

                {verifications.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300"><Clock size={32}/></div>
                    <p className="text-slate-400 font-bold">No active verification orders.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map(v => (
                      <div key={v.id} className="bg-white rounded-[2.2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className={cn("absolute top-0 left-0 w-1.5 h-full", 
                          v.status==='Resolved'?'bg-emerald-500':
                          v.status==='Rejected'?'bg-rose-500':
                          'bg-amber-500')} />
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", 
                              v.status==='Resolved'?'bg-emerald-50 text-emerald-600':
                              v.status==='Rejected'?'bg-rose-50 text-rose-600':
                              'bg-amber-50 text-amber-600')}>
                              {v.status==='Resolved'?<CheckCircle2 size={24}/>:<Clock size={24}/>}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 leading-tight">{v.subject} — {v.exam_name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Submitted on {new Date(v.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge c={v.status==='Resolved'?'bg-emerald-50 text-emerald-700 border-emerald-100':v.status==='Rejected'?'bg-rose-50 text-rose-700 border-rose-100':'bg-amber-50 text-amber-700 border-amber-100'} label={v.status.toUpperCase()} />
                        </div>
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><FileText size={10}/> Reason: {v.reason}</p>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{v.detail}"</p>
                        </div>
                        {v.status.startsWith('Pending') && (
                          <div className="mt-3 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>
                               <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Request in Process • Stage: {v.status.split('-')[1]}</p>
                             </div>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Est. resolution in 2-3 business days</p>
                          </div>
                        )}
                        {v.resolution_note && (
                          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">Resolution Note</p>
                            <p className="text-[11px] font-bold text-indigo-800">{v.resolution_note}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ COURSES ══ */}
            {tab==='courses' && (
              <motion.div key="view-courses" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

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
                  const itemKey    = `course-${cp.subject}-${i}`;

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
                    <motion.div key={itemKey}
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
                  const dayName = DAYS[day];
                  const daySlots = timetable.filter(t => {
                    if (!t.day_of_week) return false;
                    const dow = String(t.day_of_week).toLowerCase();
                    const targetShort = dayName.substring(0, 3).toLowerCase();
                    const targetFull = dayName.toLowerCase();
                    return dow === targetFull || dow === targetShort || dow === String(day);
                  }).sort((a,b)=> (a.start_time || '').localeCompare(b.start_time || ''));
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
                          {dayName}
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
                            <div key={slot.id||slot.period_number||Math.random()}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
                              style={{ background:'#F1F5F9', border:'1px solid #E2E8F0', minWidth:0 }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black bg-slate-200 text-slate-600 flex-shrink-0">
                                {slot.start_time || slot.period_number}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 whitespace-nowrap">{slot.subject || slot.subject_name}</p>
                                {(slot.teacher_name || slot.teacher_id) && <p className="text-[10px] text-slate-400 whitespace-nowrap">{slot.teacher_name || `ID: ${slot.teacher_id}`}</p>}
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
                        className="rounded-2xl px-4 py-4 cursor-pointer transition-all hover:scale-[1.005] group"
                        style={{
                          background:!n.is_read?(isFee?`rgba(${n.type==='fee_overdue'||n.type==='fee_fine'?'254,242,242':'255,251,235'},1)`:'#EFF6FF'):'#FFFFFF',
                          border:`1px solid ${!n.is_read?(isFee?`${accent}30`:'rgba(59,91,219,.2)'):'rgba(255,255,255,.06)'}`,
                        }}>
                        <div className="flex items-start gap-3">
                          {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background:isFee?accent:ACCENT }}/>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-900 text-sm">{n.title}</p>
                              {n.type === 'exam_schedule' && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">Exam</span>
                              )}
                            </div>
                            <p className="text-xs font-medium mt-0.5 text-slate-500 line-clamp-1">{n.message}</p>
                            {isFee && n.due_date && <MiniCountdown dueDate={n.due_date} accent={accent}/>}
                            {n.type === 'exam_schedule' && (
                              <div className="mt-2 text-[10px] font-black text-indigo-500 group-hover:underline flex items-center gap-1">
                                <ExternalLink size={10} /> View details
                              </div>
                            )}
                            <p className="text-[10px] mt-2 text-slate-400">
                              {new Date(n.created_at).toLocaleString('en-PK',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                            </p>
                          </div>
                          {(isFee || n.type === 'exam_schedule') && <ChevronRight size={14} style={{ color:isFee?accent:ACCENT, flexShrink:0, marginTop:2 }}/>}
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

      {/* ── EXAM SCHEDULE DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedExamSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedExamSchedule(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, #6366f1)` }} />
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">Exam Schedule</span>
                       <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">{selectedExamSchedule.exam_type}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedExamSchedule.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-2">
                       <Calendar size={12} /> {selectedExamSchedule.start_date} — {selectedExamSchedule.end_date}
                    </p>
                  </div>
                  <button onClick={() => setSelectedExamSchedule(null)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedExamSchedule.subjects_list?.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 transition-all group">
                       <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-600 group-hover:border-blue-500 group-hover:text-blue-600 transition-all">
                         <span className="text-[10px] font-black uppercase leading-none opacity-50">{new Date(s.exam_date).toLocaleString('en', {month:'short'})}</span>
                         <span className="text-lg font-black leading-none">{new Date(s.exam_date).getDate()}</span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-black text-slate-900 text-sm truncate">{s.subject}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(s.exam_date).toLocaleString('en', {weekday:'long'})}</p>
                       </div>
                       <div className="text-right">
                         <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-600">Pending</span>
                       </div>
                    </div>
                  ))}
                  {(!selectedExamSchedule.subjects_list || selectedExamSchedule.subjects_list.length === 0) && (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-sm font-bold text-slate-400 italic">No exams listed in this schedule.</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Target Audience</p>
                      <p className="text-xs font-black text-slate-700">{selectedExamSchedule.program} • Part {selectedExamSchedule.part}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                   <button onClick={() => setSelectedExamSchedule(null)} className="flex-1 py-4 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                      Got it, thanks!
                   </button>
                   <button onClick={() => window.print()} className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all">
                      <Download size={20} />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LOADING OVERLAY ── */}
      <AnimatePresence>
        {examScheduleLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-white/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Calendar size={24} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-sm font-black text-slate-900 animate-pulse">Loading schedule details...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                        {(q.options || q.a || []).map((opt: string, oi: number) => (
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

      {/* ── VERIFICATION MODAL ── */}
      <AnimatePresence>
        {showVerModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowVerModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y:100, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:100, opacity:0 }}
              className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 sm:p-8 border-b border-slate-100 shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Verification Request</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Issue a correction order</p>
                </div>
                <button onClick={() => setShowVerModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={20}/></button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Subject & Test</label>
                    <select 
                      value={verForm.grade_id} 
                      onChange={e => setVerForm({...verForm, grade_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a result to verify...</option>
                      {grades.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.subject} — {g.chapter_name || g.exams?.chapter_name} ({g.score}/{g.total_marks})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Verification</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Marks Entry Error', 'Absent Marked Incorrectly', 'Correction Needed', 'Other'].map(r => (
                        <button key={r} onClick={() => setVerForm({...verForm, reason: r})} 
                          className={cn("px-4 py-3 rounded-xl text-[10px] font-black uppercase text-center transition-all border", 
                            verForm.reason === r ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200")}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Explanation</label>
                    <textarea 
                      value={verForm.detail}
                      onChange={e => setVerForm({...verForm, detail: e.target.value})}
                      placeholder="Please explain the issue clearly..."
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      Verification will be first handled by the teacher (24h). If not resolved, it escalates to the Examiner (3 days) and then to the Vice Principal. You cannot submit multiple requests for the same result within 3 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 bg-white shrink-0">
                <button 
                  onClick={submitVerificationRequest}
                  disabled={submittingVer}
                  className="w-full py-5 bg-[#2D3494] text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all disabled:opacity-50"
                >
                  {submittingVer ? <Loader2 className="animate-spin mx-auto"/> : 'Issue Verification Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ GRADE DETAIL MODAL ══ */}
      <AnimatePresence>
        {selectedGrade && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedGrade.subject}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedGrade.exam_type || 'Result Details'}</p>
                </div>
                <button onClick={() => setSelectedGrade(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Score Obtained</p>
                    <p className="text-3xl font-black text-slate-900">{selectedGrade.score} <span className="text-sm text-slate-400">/ {selectedGrade.total_marks}</span></p>
                  </div>
                  <div className="p-5 rounded-3xl bg-indigo-50/30 border border-indigo-100/50">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Grade Achieved</p>
                    <p className="text-3xl font-black text-indigo-600">{selectedGrade.percentage ? (selectedGrade.percentage >= 85 ? 'A+' : selectedGrade.percentage >= 75 ? 'A' : selectedGrade.percentage >= 65 ? 'B' : selectedGrade.percentage >= 40 ? 'C' : 'F') : '—'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500">
                      <Shield size={16} />
                    </div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Verification Status</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {selectedGrade.is_verified ? (
                         <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                           <CheckCircle size={14} /> Verified by Examiner
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                           <Clock size={14} /> Pending Verification
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                   {(() => {
                     const reportDate = new Date(selectedGrade.created_at);
                     const diff = Date.now() - reportDate.getTime();
                     const daysOld = Math.floor(diff / (1000 * 60 * 60 * 24));
                     const canApply = daysOld < 30; // Within 30 days
                      
                      // Fix: Match via unique grade_id instead of string subject names
                      const existing = verifications.find(
                        v => String(v.grade_id) === String(selectedGrade.id) && 
                        (v.status === 'Pending-Teacher' || v.status === 'Pending-Examiner')
                      );

                      if (existing) {
                        return (
                          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold text-center">
                            ⚠️ Verification Request already active for this result.
                          </div>
                        );
                      }

                      if (!canApply) {
                        return (
                          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center">
                            ❌ Correction window closed. Verification must be requested within 3 days of results.
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            // 1. Populate the form state with the explicit active grade metadata
                            setVerForm({
                              grade_id: String(selectedGrade.id),
                              reason: 'Marks Entry Error',
                              detail: ''
                            });
                            // 2. Shut the detail modal down
                            setSelectedGrade(null); 
                            // 3. Let the DOM clear for a microsecond, then fire the global input sheet
                            setTimeout(() => {
                              setShowVerModal(true); 
                            }, 150);
                          }}
                          disabled={verifying}
                          className="w-full py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          <AlertCircle size={18}/> Request Result Verification
                        </button>
                      );
                   })()}
                   <p className="text-[10px] text-slate-400 font-bold text-center mt-4 px-4">Verification requests are routed first to the Subject Teacher, and then escalated to the Examiner if unresolved.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 -4px 24px rgba(0,0,0,0.08)'}}>
  <div className="flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))',paddingTop:8}}>
    {([
      {id:'dashboard',label:'Home',icon:Home},
      {id:'fees',label:'Fees',icon:CreditCard,alert:overdueFees.length>0},
      {id:'attendance',label:'Attend',icon:Calendar},
      {id:'results',label:'Results',icon:BarChart3},
      {id:'verification',label:'Verify',icon:UserCheck},
      {id:'courses',label:'Courses',icon:BookOpen},
      {id:'quizzes',label:'Quiz',icon:Zap},
      {id:'timetable',label:'Schedule',icon:BarChart3},
      {id:'leaderboard',label:'Ranks',icon:Trophy},
      {id:'notifications',label:'Notifs',icon:Bell,badge:unreadCount>0?unreadCount:undefined},
    ] as any[]).map(({id,label,icon:Icon,badge,alert})=>{
      const isActive=tab===id;
      return (
        <button key={id} onClick={()=>setTab(id)}
          className="relative flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors duration-200 flex-shrink-0 min-w-[56px] px-3 py-2"
          style={isActive?{background:`linear-gradient(135deg,${ACCENT},${ACCENT}cc)`,color:'#fff',boxShadow:`0 4px 14px ${ACCENT}40`}:{color:'#94a3b8'}}>
          <div className="relative">
            <motion.div animate={isActive?{rotate:[0,-15,10,-5,0],scale:[1,1.15,1]}:{rotate:0,scale:1}} transition={{duration:0.45,ease:[0.34,1.56,0.64,1]}}>
              <Icon size={20}/>
            </motion.div>
            {badge&&<span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center px-1" style={{background:'#EF4444',boxShadow:'0 0 0 2px white'}}>{badge>9?'9+':badge}</span>}
            {alert&&!badge&&<span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{background:'#EF4444',boxShadow:'0 0 0 1.5px white'}}/>}
          </div>
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

      {/* ══ SOS FEEDBACK + QUIZ MODAL ══════════════════════ */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => quizStep === 'result' && setShowSosModal(false)} />
            <motion.div
              initial={{ opacity:0, y:80 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:80 }}
              transition={{ type:'spring', stiffness:380, damping:32 }}
              className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl z-10 overflow-hidden flex flex-col"
              style={{ maxHeight:'90vh' }}>

              {/* ── STEP 1: FEEDBACK ── */}
              {quizStep === 'feedback' && (
                <>
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">📋 Daily Check-In</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long' })}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">📚</div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    <p className="text-sm font-bold text-slate-500 text-center">Were these topics taught in class today?</p>
                    {sosFeedbacks.map((item, i) => {
                      const answered = item.existing;
                      return (
                        <motion.div key={item.teacher_id}
                          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
                          className={`rounded-3xl border p-5 space-y-3 ${answered ? 'border-slate-100 bg-slate-50/50 opacity-70' : 'border-slate-200 bg-white shadow-sm'}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0"
                              style={{ background: `hsl(${(Number(item.teacher_id) * 37) % 360},60%,50%)` }}>
                              {item.teacher_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subject} · {item.teacher_name}</p>
                              <p className="font-black text-slate-900 text-sm mt-0.5 leading-snug">"{item.topic}"</p>
                              <p className="text-[10px] text-slate-400 mt-1">was planned in today's SOS</p>
                            </div>
                          </div>
                          {answered ? (
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl w-fit ${answered.was_taught ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              <span className="text-base">{answered.was_taught ? '✅' : '❌'}</span>
                              <span className="text-xs font-black uppercase">{answered.was_taught ? 'Taught' : 'Not Taught'}</span>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button onClick={() => submitFeedback(item, true)} disabled={submittingFeedback}
                                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all">
                                ✅ Yes, Taught
                              </button>
                              <button onClick={() => submitFeedback(item, false)} disabled={submittingFeedback}
                                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-sm font-black shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 transition-all">
                                ❌ Not Taught
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    {sosFeedbacks.length === 0 && (
                      <div className="text-center py-10 text-slate-400">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="font-bold">No SOS topics scheduled for today</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-slate-50 shrink-0">
                    {sosFeedbacks.every(f => !!f.existing) ? (
                      <button onClick={loadQuizForToday}
                        className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2"
                        style={{ background:`linear-gradient(135deg,${ACCENT},#2C4BC0)` }}>
                        Continue to Quiz 🎯
                      </button>
                    ) : (
                      <p className="text-center text-xs text-slate-400 font-bold">Answer all questions to unlock today's quiz</p>
                    )}
                  </div>
                </>
              )}

              {/* ── STEP 2: QUIZ ── */}
              {quizStep === 'quiz' && activeQuiz && (
                <>
                  <div className="px-6 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-slate-900 text-lg">🎯 Daily Quiz</h3>
                      <div className="flex items-center gap-2 text-xs font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                        <span>🪙 {activeQuiz.coin_reward}</span>
                        <span>·</span>
                        <span>⚡ {activeQuiz.xp_reward} XP</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{activeQuiz.topic}</p>
                    <div className="flex gap-1.5 mt-3">
                      {activeQuiz.questions.map((_: any, i: number) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                          style={{ background: quizAnswersNew[i] !== -1 ? ACCENT : '#E2E8F0' }} />
                      ))}
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {activeQuiz.questions.map((q: any, qi: number) => (
                      <motion.div key={qi} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: qi * 0.05 }}
                        className="bg-slate-50 rounded-3xl p-5 space-y-3 border border-slate-100">
                        <p className="font-black text-slate-900 text-sm leading-snug">
                          <span className="mr-2" style={{ color:ACCENT }}>Q{qi + 1}.</span>{q.q}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt: string, oi: number) => (
                            <button key={oi} onClick={() => {
                              const next = [...quizAnswersNew];
                              next[qi] = oi;
                              setQuizAnswersNew(next);
                            }} className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border"
                              style={quizAnswersNew[qi] === oi
                                ? { background:ACCENT, color:'#fff', borderColor:ACCENT, boxShadow:`0 4px 14px ${ACCENT}40` }
                                : { background:'#fff', color:'#475569', borderColor:'#E2E8F0' }}>
                              <span className="font-black mr-2 text-[10px] uppercase opacity-60">{['A','B','C','D'][oi]}.</span>{opt}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-5 border-t border-slate-50 shrink-0">
                    <button onClick={submitNewQuiz} disabled={quizAnswersNew.length === 0 || quizAnswersNew.some(a => a === -1)}
                      className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background:`linear-gradient(135deg,${ACCENT},#2C4BC0)` }}>
                      Submit Quiz ✅
                    </button>
                    {quizAnswersNew.some(a => a === -1) && (
                      <p className="text-center text-[10px] text-slate-400 mt-2">Answer all questions to submit</p>
                    )}
                  </div>
                </>
              )}

              {/* ── STEP 3: RESULT ── */}
              {quizStep === 'result' && quizResult && (
                <div className="p-8 text-center space-y-6">
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ type:'spring', stiffness:400, damping:20 }}
                    className="text-7xl">
                    {quizResult.score === quizResult.total ? '🏆' : quizResult.score >= quizResult.total / 2 ? '🎉' : '💪'}
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">
                      {quizResult.score === quizResult.total ? 'Perfect Score!' : quizResult.score >= quizResult.total / 2 ? 'Well Done!' : 'Keep Going!'}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{quizResult.score}/{quizResult.total} correct answers</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                      className="rounded-3xl p-5 border border-blue-100" style={{ background:'#EFF6FF' }}>
                      <p className="text-3xl font-black" style={{ color:ACCENT }}>+{quizResult.xp}</p>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">⚡ XP Earned</p>
                    </motion.div>
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                      className="rounded-3xl p-5 border border-amber-100" style={{ background:'#FFFBEB' }}>
                      <p className="text-3xl font-black text-amber-600">+{quizResult.coins}</p>
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">🪙 PIC Coins</p>
                    </motion.div>
                  </div>
                  <button onClick={() => { setShowSosModal(false); setQuizStep('feedback'); setQuizResult(null); setActiveQuiz(null); }}
                    className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl"
                    style={{ background:`linear-gradient(135deg,${ACCENT},#2C4BC0)` }}>
                    Back to Portal 🚀
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};