/**
 * AdminPortalExtensions.tsx
 * 
 * Three new tab components to add to AdminPortal.tsx:
 *   1. AttendanceTab     — Manual attendance marking per class/period
 *   2. ExamPlannerTab    — Create exam schedules, seating, invigilation
 *   3. ExcelReportsTab   — Download Excel reports via generate-excel-report edge fn
 * 
 * ── HOW TO INTEGRATE ────────────────────────────────────────────────────────
 * 
 * STEP 1: Add this import at the top of AdminPortal.tsx:
 *   import { AttendanceTab, ExamPlannerTab, ExcelReportsTab } from './AdminPortalExtensions';
 * 
 * STEP 2: Add "attendance" and "exam-planner" to PRINCIPAL_NAV:
 *   { id: 'attendance',   label: 'Attendance',   icon: UserCheck },
 *   { id: 'exam-planner', label: 'Exams',         icon: ClipboardList },
 * 
 * STEP 3: Add "excel-reports" to ACCOUNTANT_NAV:
 *   { id: 'excel-reports', label: 'Excel Export', icon: Download },
 * 
 * STEP 4: Add these three render blocks inside the <AnimatePresence> in AdminPortal.tsx,
 *   right before the closing </AnimatePresence> tag:
 * 
 *   {!isAccountant && tab === 'attendance' && (
 *     <AttendanceTab adminData={adminData} ACCENT={ACCENT} GRADIENT={GRADIENT} />
 *   )}
 *   {!isAccountant && tab === 'exam-planner' && (
 *     <ExamPlannerTab adminData={adminData} ACCENT={ACCENT} GRADIENT={GRADIENT} />
 *   )}
 *   {isAccountant && tab === 'excel-reports' && (
 *     <ExcelReportsTab adminData={adminData} ACCENT={ACCENT} GRADIENT={GRADIENT}
 *       students={students} feeGroups={feeGroups} transactions={transactions} />
 *   )}
 * 
 * STEP 5: Add these imports to the lucide-react import line in AdminPortal.tsx:
 *   ClipboardList, Download, CheckSquare, MinusSquare, XSquare
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck, ClipboardList, Download, RefreshCw, Loader2,
  X, Check, CheckSquare, MinusSquare, XSquare, Calendar,
  FileText, Users, AlertTriangle, BookOpen, Save,
  ChevronDown, ChevronUp, Clock, Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

// ── Shared helpers ────────────────────────────────────────────────────────
const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

// ════════════════════════════════════════════════════════════════════════════
// 1. ATTENDANCE TAB
// ════════════════════════════════════════════════════════════════════════════

interface AttendanceTabProps {
  adminData: { id: string; full_name: string; role: string; username: string };
  ACCENT: string;
  GRADIENT: string;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ adminData, ACCENT, GRADIENT }) => {
  const [classSections, setClassSections]   = useState<string[]>([]);
  const [selectedClass, setSelectedClass]   = useState('');
  const [students,      setStudents]        = useState<any[]>([]);
  const [attendance,    setAttendance]      = useState<Record<number, string>>({});
  const [existingRecs,  setExistingRecs]    = useState<any[]>([]);
  const [loading,       setLoading]         = useState(false);
  const [saving,        setSaving]          = useState(false);
  const [savedMsg,      setSavedMsg]        = useState('');
  const [errorMsg,      setErrorMsg]        = useState('');
  const [todayStats,    setTodayStats]      = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [searchQ,       setSearchQ]         = useState('');
  const [viewDate,      setViewDate]        = useState(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];
  const isToday = viewDate === today;

  const showToast = (msg: string, isError = false) => {
    if (isError) { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); }
    else         { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); }
  };

  // Load all class sections
  useEffect(() => {
    supabase.from('students').select('class_section').eq('status', 'Active')
      .then(({ data }) => {
        const sections = [...new Set((data || []).map((s: any) => s.class_section))].sort();
        setClassSections(sections);
        if (sections.length > 0) setSelectedClass(sections[0]);
      });
  }, []);

  // Load students + attendance for selected class + date
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    Promise.all([
      supabase.from('students').select('roll_no,full_name,father_name,gender')
        .eq('class_section', selectedClass).eq('status', 'Active').order('full_name'),
      supabase.from('attendance').select('*')
        .eq('date', viewDate)
        .in('student_roll',
          supabase.from('students').select('roll_no').eq('class_section', selectedClass)
            .eq('status', 'Active') as any
        ),
    ]).then(([stuRes, attRes]) => {
      const studs = stuRes.data || [];
      const recs  = attRes.data || [];
      setStudents(studs);
      setExistingRecs(recs);
      // Pre-fill from existing records
      const map: Record<number, string> = {};
      recs.forEach((r: any) => { map[r.student_roll] = r.status; });
      // Default unmarked to 'Present' only for today; leave blank for past dates
      studs.forEach((s: any) => {
        if (!map[s.roll_no]) map[s.roll_no] = isToday ? 'Present' : '';
      });
      setAttendance(map);

      // Today stats
      if (viewDate === today) {
        setTodayStats({
          present: recs.filter((r: any) => r.status === 'Present').length,
          absent:  recs.filter((r: any) => r.status === 'Absent').length,
          late:    recs.filter((r: any) => r.status === 'Late').length,
          total:   studs.length,
        });
      }
      setLoading(false);
    });
  }, [selectedClass, viewDate]);

  const setStatus = (roll: number, status: string) => {
    setAttendance(prev => ({ ...prev, [roll]: status }));
  };

  const markAll = (status: string) => {
    const map: Record<number, string> = {};
    students.forEach(s => { map[s.roll_no] = status; });
    setAttendance(map);
  };

  const saveAttendance = async () => {
    if (!isToday) { showToast('Can only edit today\'s attendance', true); return; }
    setSaving(true);
    try {
      // Upsert each student
      const records = students.map(s => ({
        student_roll: s.roll_no,
        status:       attendance[s.roll_no] || 'Absent',
        date:         today,
        source:       'manual',
        time_in:      new Date().toTimeString().slice(0, 5),
        late_minutes: attendance[s.roll_no] === 'Late' ? 15 : 0,
      }));

      // Delete existing manual records for today+class, then insert fresh
      const rolls = students.map(s => s.roll_no);
      await supabase.from('attendance')
        .delete()
        .eq('date', today)
        .eq('source', 'manual')
        .in('student_roll', rolls);

      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;

      showToast(`✅ Attendance saved for ${selectedClass} — ${records.length} students`);
      // Refresh stats
      setTodayStats({
        present: records.filter(r => r.status === 'Present').length,
        absent:  records.filter(r => r.status === 'Absent').length,
        late:    records.filter(r => r.status === 'Late').length,
        total:   records.length,
      });
    } catch (e: any) {
      showToast(e.message || 'Failed to save attendance', true);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || String(s.roll_no).includes(q);
  });

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'Absent').length;
  const lateCount    = Object.values(attendance).filter(v => v === 'Late').length;
  const attPct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <motion.div key="attendance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Header banner */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg,#042F2E,${ACCENT})` }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: 'translate(40%,-40%)' }} />
        <h2 className="text-lg font-black text-white mb-1">Attendance Management</h2>
        <p className="text-sm opacity-70">Manual marking · Biometric auto-logs visible</p>
        {savedMsg && <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 text-sm font-bold">{savedMsg}</div>}
        {errorMsg && <div className="mt-3 bg-rose-500/40 rounded-xl px-4 py-2 text-sm font-bold">⚠️ {errorMsg}</div>}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Present', v: presentCount, c: 'text-emerald-600', bg: 'bg-emerald-50' },
          { l: 'Absent',  v: absentCount,  c: 'text-rose-600',    bg: 'bg-rose-50'    },
          { l: 'Late',    v: lateCount,    c: 'text-amber-600',   bg: 'bg-amber-50'   },
          { l: 'Rate',    v: `${attPct}%`, c: attPct >= 75 ? 'text-emerald-600' : 'text-amber-600', bg: 'bg-slate-50' },
        ].map(({ l, v, c, bg }) => (
          <div key={l} className={cn('rounded-2xl p-3 border border-slate-100 text-center', bg)}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
            <p className={cn('text-xl font-black', c)}>{v}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Date + Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" value={viewDate} max={today}
                onChange={e => setViewDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-slate-50 font-medium" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Section</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 bg-slate-50 font-medium">
                {classSections.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search student name or roll..."
              className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none bg-slate-50 focus:bg-white focus:border-teal-400 transition-all" />
          </div>

          {/* Bulk actions */}
          {isToday && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center mr-1">Mark All:</span>
              {[
                { label: 'All Present', status: 'Present', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'All Absent',  status: 'Absent',  style: 'bg-rose-50 text-rose-700 border-rose-200'     },
                { label: 'All Late',    status: 'Late',    style: 'bg-amber-50 text-amber-700 border-amber-200'   },
              ].map(({ label, status, style }) => (
                <motion.button key={status} whileTap={{ scale: 0.95 }} onClick={() => markAll(status)}
                  className={cn('px-3 py-1.5 rounded-xl text-[11px] font-black border', style)}>
                  {label}
                </motion.button>
              ))}
            </div>
          )}

          {!isToday && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold text-amber-700">
              📅 Viewing {viewDate} — Read-only. Edit today's date to make changes.
            </div>
          )}
        </div>
      </div>

      {/* Student list */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            {selectedClass} · {filteredStudents.length} students
            {existingRecs.length > 0 && <span className="ml-2 text-teal-600">· {existingRecs.length} already logged</span>}
          </p>
          {loading && <Loader2 size={14} className="animate-spin text-teal-500" />}
        </div>

        <div className="divide-y divide-slate-50" style={{ maxHeight: 500, overflowY: 'auto' }}>
          {filteredStudents.map((s, i) => {
            const status = attendance[s.roll_no] || '';
            const existingRec = existingRecs.find(r => r.student_roll === s.roll_no);
            const isAuto = existingRec?.source === 'biometric';

            return (
              <motion.div key={s.roll_no} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.2) }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                  style={{ background: `hsl(${(s.roll_no * 37) % 360},55%,50%)` }}>
                  {s.full_name?.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-900 truncate">{s.full_name}</p>
                    {isAuto && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                        📡 Bio
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Roll #{s.roll_no} · {s.gender}</p>
                </div>

                {/* Status buttons */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {(['Present', 'Late', 'Absent'] as const).map(st => {
                    const active = status === st;
                    const colors: Record<string, string> = {
                      Present: active ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-600',
                      Late:    active ? 'bg-amber-500 text-white border-amber-500'    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-600',
                      Absent:  active ? 'bg-rose-500 text-white border-rose-500'      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-600',
                    };
                    const icons: Record<string, React.ReactNode> = {
                      Present: <Check size={12} />,
                      Late:    <Clock size={12} />,
                      Absent:  <X size={12} />,
                    };
                    return (
                      <motion.button key={st} whileTap={{ scale: 0.9 }}
                        disabled={!isToday}
                        onClick={() => setStatus(s.roll_no, st)}
                        className={cn('w-8 h-8 rounded-xl border flex items-center justify-center transition-all text-[10px] font-black disabled:opacity-50 disabled:cursor-default', colors[st])}
                        title={st}>
                        {icons[st]}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          {filteredStudents.length === 0 && !loading && (
            <div className="p-10 text-center">
              <Users size={24} className="mx-auto mb-2 text-slate-200" />
              <p className="text-slate-400 text-sm">No students found</p>
            </div>
          )}
        </div>

        {/* Save button */}
        {isToday && students.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100">
            <motion.button whileTap={{ scale: 0.98 }} onClick={saveAttendance} disabled={saving}
              className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: GRADIENT, boxShadow: `0 6px 20px ${ACCENT}40` }}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Attendance — {selectedClass}</>}
            </motion.button>
          </div>
        )}
      </div>

      {/* Biometric logs card */}
      <BiometricLogsCard ACCENT={ACCENT} selectedClass={selectedClass} viewDate={viewDate} />
    </motion.div>
  );
};

// Sub-component: Biometric Logs preview
const BiometricLogsCard: React.FC<{ ACCENT: string; selectedClass: string; viewDate: string }> = ({ ACCENT, selectedClass, viewDate }) => {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!open || !selectedClass) return;
    setLoading(true);
    supabase.from('attendance').select('*,students(full_name,class_section)')
      .eq('date', viewDate)
      .eq('source', 'biometric')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, [open, selectedClass, viewDate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <span className="text-blue-600 text-sm">📡</span>
          </div>
          <p className="font-black text-slate-700 text-sm">Biometric Logs — {viewDate}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="border-t border-slate-100" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {loading ? (
                <div className="p-6 text-center"><Loader2 size={20} className="animate-spin mx-auto text-slate-300" /></div>
              ) : logs.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">No biometric logs for this date</p>
              ) : logs.map((l: any, i) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.status === 'Present' ? '#059669' : l.status === 'Late' ? '#D97706' : '#C0392B' }} />
                  <p className="text-sm font-bold text-slate-800 flex-1">{(l as any).students?.full_name || `Roll #${l.student_roll}`}</p>
                  <span className="text-xs text-slate-400">{l.time_in || '—'}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black',
                    l.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                    l.status === 'Late'    ? 'bg-amber-50 text-amber-700'    :
                    'bg-rose-50 text-rose-700')}>{l.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// 2. EXAM PLANNER TAB
// ════════════════════════════════════════════════════════════════════════════

interface ExamPlannerTabProps {
  adminData: { id: string; full_name: string; role: string; username: string };
  ACCENT: string;
  GRADIENT: string;
}

const EXAM_TYPES = ['Chapter Test', 'Mid Term', 'Final Term', 'Quiz', 'Assignment'];
const PROGRAMS   = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];

export const ExamPlannerTab: React.FC<ExamPlannerTabProps> = ({ adminData, ACCENT, GRADIENT }) => {
  const [subTab,        setSubTab]        = useState<'schedules'|'create'|'seating'>('schedules');
  const [schedules,     setSchedules]     = useState<any[]>([]);
  const [exams,         setExams]         = useState<any[]>([]);
  const [classSections, setClassSections] = useState<string[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [savedMsg,      setSavedMsg]      = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [expandedSched, setExpandedSched] = useState<number | null>(null);

  // New schedule form
  const [schedForm, setSchedForm] = useState({
    title: '', exam_type: 'Mid Term', session: '2026-27',
    program: 'ICS Physics', part: 1, class_section: '',
    start_date: '', end_date: '', status: 'Upcoming',
  });

  // New exam (individual subject exam)
  const [examForm, setExamForm] = useState({
    title: '', class_section: '', subject: '',
    date: '', total_marks: 100, exam_type: 'Chapter Test',
    chapter_name: '',
  });

  const showToast = (msg: string, isErr = false) => {
    if (isErr) { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); }
    else       { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [s1, s2, s3] = await Promise.all([
      supabase.from('exam_schedule').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('exams').select('*,teachers(full_name)').order('date', { ascending: false }).limit(100),
      supabase.from('students').select('class_section').eq('status', 'Active'),
    ]);
    setSchedules(s1.data || []);
    setExams(s2.data || []);
    const sections = [...new Set((s3.data || []).map((s: any) => s.class_section))].sort();
    setClassSections(sections);
    if (sections.length > 0 && !examForm.class_section) {
      setExamForm(p => ({ ...p, class_section: sections[0] }));
      setSchedForm(p => ({ ...p, class_section: sections[0] }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveSchedule = async () => {
    if (!schedForm.title.trim() || !schedForm.start_date) {
      showToast('Title and start date are required', true); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_schedule').insert([{
        ...schedForm, part: Number(schedForm.part),
        created_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Exam schedule created');
      setSchedForm({ title: '', exam_type: 'Mid Term', session: '2026-27', program: 'ICS Physics', part: 1, class_section: classSections[0] || '', start_date: '', end_date: '', status: 'Upcoming' });
      setSubTab('schedules');
      loadData();
    } catch (e: any) { showToast(e.message || 'Failed', true); }
    finally { setSaving(false); }
  };

  const saveExam = async () => {
    if (!examForm.title.trim() || !examForm.class_section || !examForm.date) {
      showToast('Title, class and date are required', true); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('exams').insert([{
        ...examForm, total_marks: Number(examForm.total_marks),
        grading_status: 'Pending', created_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Exam created');
      setExamForm({ title: '', class_section: classSections[0] || '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '' });
      loadData();
    } catch (e: any) { showToast(e.message || 'Failed', true); }
    finally { setSaving(false); }
  };

  const deleteExam = async (id: number) => {
    if (!confirm('Delete this exam?')) return;
    await supabase.from('exams').delete().eq('id', id);
    showToast('Exam deleted');
    loadData();
  };

  const getStatusColor = (status: string) => {
    if (status === 'Upcoming')   return 'bg-blue-50 text-blue-700';
    if (status === 'Ongoing')    return 'bg-amber-50 text-amber-700';
    if (status === 'Completed')  return 'bg-emerald-50 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <motion.div key="exam-planner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Header */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg,#1e1b4b,#4338ca)` }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: 'translate(40%,-40%)' }} />
        <h2 className="text-lg font-black text-white mb-1">Exam Planner</h2>
        <p className="text-sm opacity-70">Schedules · Individual Exams · Seating</p>
        {savedMsg && <div className="mt-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-bold">{savedMsg}</div>}
        {errorMsg && <div className="mt-2 bg-rose-500/40 rounded-xl px-4 py-2 text-sm font-bold">⚠️ {errorMsg}</div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Schedules', v: schedules.length,                                          c: 'text-indigo-600' },
          { l: 'Upcoming',  v: schedules.filter(s => s.status === 'Upcoming').length,     c: 'text-blue-600'   },
          { l: 'Exams',     v: exams.length,                                              c: 'text-slate-700'  },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
            <p className={cn('text-2xl font-black', c)}>{v}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([['schedules','Schedules'],['create','+ New'],['seating','Seating']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={cn('px-4 py-2 rounded-xl text-xs font-black border transition-all', subTab === id ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')}
            style={subTab === id ? { background: 'linear-gradient(135deg,#4338ca,#6366f1)' } : {}}>
            {label}
          </button>
        ))}
        <button onClick={loadData} className="ml-auto w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <RefreshCw size={13} className={cn('text-slate-400', loading ? 'animate-spin' : '')} />
        </button>
      </div>

      {/* ── Schedules list ── */}
      {subTab === 'schedules' && (
        <div className="space-y-3">
          {schedules.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Calendar size={28} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-bold">No exam schedules yet</p>
              <button onClick={() => setSubTab('create')} className="mt-3 text-indigo-600 text-sm font-black hover:underline">+ Create First Schedule</button>
            </div>
          ) : schedules.map((s: any, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <button onClick={() => setExpandedSched(expandedSched === s.id ? null : s.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-900">{s.title}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', getStatusColor(s.status))}>{s.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.exam_type} · {s.program} Part {s.part}
                    {s.start_date && ` · ${s.start_date}${s.end_date ? ` → ${s.end_date}` : ''}`}
                  </p>
                </div>
                {expandedSched === s.id ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {expandedSched === s.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }}>
                    <div className="border-t border-slate-100 px-5 py-4 space-y-2">
                      {[['Session', s.session],['Program', s.program],['Part', `Part ${s.part}`],['Class', s.class_section || '—'],['Start', s.start_date || '—'],['End', s.end_date || '—'],['Created By', s.created_by || '—']].map(([l, v]) => (
                        <div key={l} className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-400 uppercase tracking-widest text-[9px]">{l}</span>
                          <span className="font-bold text-slate-700">{v}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Individual exams list */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">Individual Exams ({exams.length})</h3>
            </div>
            {exams.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No exams created yet</p>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: 400 }}>
                <table className="w-full text-xs min-w-[550px]">
                  <thead style={{ background: '#f8f9fd' }}>
                    <tr>{['Date','Class','Subject','Type','Marks','Status',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {exams.map((e: any, i) => (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{e.date}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{e.class_section}</td>
                        <td className="px-4 py-2.5 text-slate-600">{e.subject}</td>
                        <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700">{e.exam_type}</span></td>
                        <td className="px-4 py-2.5 font-bold text-slate-700">{e.total_marks}</td>
                        <td className="px-4 py-2.5"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', e.grading_status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : e.grading_status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{e.grading_status}</span></td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => deleteExam(e.id)} className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100">
                            <X size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      {subTab === 'create' && (
        <div className="space-y-4">
          {/* Create exam schedule */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">📅 Create Exam Schedule</h3><p className="text-xs text-slate-400 mt-0.5">A schedule groups multiple exams (e.g. Mid-Term 2026)</p></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                  <input value={schedForm.title} onChange={e => setSchedForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Mid-Term Exams 2026"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Type</label>
                  <select value={schedForm.exam_type} onChange={e => setSchedForm(p => ({ ...p, exam_type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    {['Mid Term','Final Term','Chapter Test','Quiz','Annual'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Program</label>
                  <select value={schedForm.program} onChange={e => setSchedForm(p => ({ ...p, program: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Part</label>
                  <select value={schedForm.part} onChange={e => setSchedForm(p => ({ ...p, part: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    <option value={1}>Part 1</option><option value={2}>Part 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Section</label>
                  <select value={schedForm.class_section} onChange={e => setSchedForm(p => ({ ...p, class_section: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    <option value="">All classes</option>
                    {classSections.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" value={schedForm.start_date} onChange={e => setSchedForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" value={schedForm.end_date} onChange={e => setSchedForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveSchedule} disabled={saving}
                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)' }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Save Schedule</>}
              </motion.button>
            </div>
          </div>

          {/* Create individual exam */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">📝 Create Individual Exam</h3><p className="text-xs text-slate-400 mt-0.5">Single subject test or chapter exam</p></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Title</label>
                  <input value={examForm.title} onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Physics Chapter 3 Test"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                  <input value={examForm.subject} onChange={e => setExamForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Physics, Math..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Section</label>
                  <select value={examForm.class_section} onChange={e => setExamForm(p => ({ ...p, class_section: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    {classSections.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={examForm.exam_type} onChange={e => setExamForm(p => ({ ...p, exam_type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
                    {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Marks</label>
                  <input type="number" value={examForm.total_marks} onChange={e => setExamForm(p => ({ ...p, total_marks: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" value={examForm.date} onChange={e => setExamForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Chapter / Topic</label>
                  <input value={examForm.chapter_name} onChange={e => setExamForm(p => ({ ...p, chapter_name: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveExam} disabled={saving}
                className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <><BookOpen size={15} /> Create Exam</>}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Seating sub-tab ── */}
      {subTab === 'seating' && (
        <SeatingTab adminData={adminData} exams={exams} classSections={classSections} />
      )}
    </motion.div>
  );
};

// Seating sub-component
const SeatingTab: React.FC<{ adminData: any; exams: any[]; classSections: string[] }> = ({ adminData, exams, classSections }) => {
  const [selectedExam, setSelectedExam] = useState('');
  const [rooms,        setRooms]        = useState<string[]>([]);
  const [students,     setStudents]     = useState<any[]>([]);
  const [seating,      setSeating]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState('');

  useEffect(() => {
    supabase.from('campus_rooms').select('room_name').then(({ data }) => {
      setRooms((data || []).map((r: any) => r.room_name));
    });
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    const exam = exams.find(e => String(e.id) === selectedExam);
    if (!exam) return;
    setLoading(true);
    Promise.all([
      supabase.from('students').select('roll_no,full_name').eq('class_section', exam.class_section).eq('status', 'Active').order('full_name'),
      supabase.from('exam_seating').select('*').eq('exam_id', exam.id),
    ]).then(([stuRes, seatRes]) => {
      setStudents(stuRes.data || []);
      setSeating(seatRes.data || []);
      setLoading(false);
    });
  }, [selectedExam, exams]);

  const autoAssign = async () => {
    if (!selectedExam || rooms.length === 0) return;
    setSaving(true);
    try {
      const exam = exams.find(e => String(e.id) === selectedExam);
      await supabase.from('exam_seating').delete().eq('exam_id', Number(selectedExam));
      const records = students.map((s, i) => ({
        exam_id:      Number(selectedExam),
        student_roll: s.roll_no,
        room:         rooms[i % rooms.length],
        seat_no:      `${Math.floor(i / rooms.length) + 1}`,
        date:         exam?.date || new Date().toISOString().split('T')[0],
        subject:      exam?.subject || '',
      }));
      await supabase.from('exam_seating').insert(records);
      const { data } = await supabase.from('exam_seating').select('*').eq('exam_id', Number(selectedExam));
      setSeating(data || []);
      setSavedMsg(`✅ ${records.length} students assigned to ${rooms.length} rooms`);
      setTimeout(() => setSavedMsg(''), 3500);
    } catch (e: any) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {savedMsg && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700">{savedMsg}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Exam</label>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 bg-slate-50 font-medium">
            <option value="">-- Select an exam --</option>
            {exams.map(e => <option key={e.id} value={String(e.id)}>{e.title} · {e.class_section} · {e.date}</option>)}
          </select>
        </div>
        {selectedExam && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-600">{students.length} students · {rooms.length} rooms available</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={autoAssign} disabled={saving || rooms.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Auto-Assign Seats'}
            </motion.button>
          </div>
        )}
      </div>

      {seating.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900">Seating Plan ({seating.length} assigned)</h3>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: 400 }}>
            <table className="w-full text-xs min-w-[400px]">
              <thead style={{ background: '#f8f9fd' }}>
                <tr>{['Roll #','Student','Room','Seat'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody>
                {seating.map((r: any, i) => {
                  const stu = students.find(s => s.roll_no === r.student_roll);
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">{r.student_roll}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{stu?.full_name || '—'}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-700">{r.room}</span></td>
                      <td className="px-4 py-2.5 font-bold text-slate-600">{r.seat_no}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// 3. EXCEL REPORTS TAB (Accountant)
// ════════════════════════════════════════════════════════════════════════════

interface ExcelReportsTabProps {
  adminData: { id: string; full_name: string; role: string; username: string };
  ACCENT: string;
  GRADIENT: string;
  students:     any[];
  feeGroups:    any[];
  transactions: any[];
}

type ReportStatus = 'idle' | 'generating' | 'done' | 'error';

export const ExcelReportsTab: React.FC<ExcelReportsTabProps> = ({
  adminData, ACCENT, GRADIENT, students, feeGroups, transactions
}) => {
  const [statuses,   setStatuses]   = useState<Record<string, ReportStatus>>({});
  const [messages,   setMessages]   = useState<Record<string, string>>({});
  const [filterProg, setFilterProg] = useState('');
  const [filterSec,  setFilterSec]  = useState('');

  const PROGRAMS = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];

  const sectionOptions = students
    .filter(s => !filterProg || s.program === filterProg)
    .map(s => s.class_section)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const setStatus = (key: string, s: ReportStatus, msg = '') => {
    setStatuses(p => ({ ...p, [key]: s }));
    setMessages(p => ({ ...p, [key]: msg }));
  };

  /**
   * Build report data client-side and download as a CSV
   * (Falls back to client-side CSV if the edge function isn't responding)
   */
  const generateReport = async (reportType: string) => {
    const key = reportType;
    setStatus(key, 'generating');

    try {
      // First try the edge function
      const payload: any = {
        report_type: reportType,
        generated_by: adminData.full_name,
        filter_program: filterProg || null,
        filter_section: filterSec || null,
      };

      const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-excel-report', {
        body: payload,
      });

      if (!fnError && fnData) {
        // Edge function returned data — try to decode and download
        if (fnData.url) {
          // It returned a download URL
          const a = document.createElement('a');
          a.href = fnData.url;
          a.download = `${reportType}-${new Date().toISOString().slice(0,10)}.xlsx`;
          a.click();
          setStatus(key, 'done', '✅ Downloaded via edge function');
          return;
        }
        if (fnData.base64 || fnData.data) {
          const raw = fnData.base64 || fnData.data;
          const blob = base64ToBlob(raw, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          downloadBlob(blob, `${reportType}-${new Date().toISOString().slice(0,10)}.xlsx`);
          setStatus(key, 'done', '✅ Excel downloaded');
          return;
        }
      }

      // Fallback: generate CSV client-side
      clientSideCSV(reportType, key);

    } catch (e: any) {
      console.warn('Edge function error, falling back to CSV:', e.message);
      clientSideCSV(reportType, key);
    }
  };

  const clientSideCSV = (reportType: string, key: string) => {
    let csv = '';
    let filename = '';

    const filterStudents = students.filter(s => {
      if (filterProg && s.program !== filterProg) return false;
      if (filterSec  && s.class_section !== filterSec)  return false;
      return true;
    });

    if (reportType === 'student_list') {
      filename = `student-list-${filterSec || filterProg || 'all'}-${new Date().toISOString().slice(0,10)}.csv`;
      csv = 'Roll No,Full Name,Father Name,Class Section,Program,Part,Gender,Status\n';
      filterStudents.forEach(s => {
        csv += `${s.roll_no},"${s.full_name}","${s.father_name || ''}","${s.class_section}","${s.program}",${s.part},"${s.gender}","${s.status}"\n`;
      });
    }
    else if (reportType === 'fee_ledger') {
      filename = `fee-ledger-${filterSec || filterProg || 'all'}-${new Date().toISOString().slice(0,10)}.csv`;
      csv = 'Roll No,Student Name,Class,Fee Group,Amount,Discount,Fine,Paid,Balance,Status,Due Date\n';
      feeGroups
        .filter(g => {
          const st = students.find(s => s.roll_no === g.student_roll);
          if (filterProg && st?.program !== filterProg) return false;
          if (filterSec  && st?.class_section !== filterSec)  return false;
          return true;
        })
        .forEach(g => {
          const st = students.find(s => s.roll_no === g.student_roll);
          csv += `${g.student_roll},"${st?.full_name || ''}","${st?.class_section || ''}","${g.fees_group}",${g.amount},${g.discount || 0},${g.fine || 0},${g.paid || 0},${g.balance || 0},"${g.status}","${g.due_date || ''}"\n`;
        });
    }
    else if (reportType === 'transactions') {
      filename = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
      csv = 'Date,Roll No,Amount,Method,Collected By,Receipt,Type,Confirmed By\n';
      transactions.forEach(t => {
        csv += `"${t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK') : ''}","${t.student_roll_link}",${t.amount_paid},"${t.payment_method || ''}","${t.collected_by || ''}","${t.receipt_serial || ''}","${t.transaction_type || 'Payment'}","${t.confirmed_by || ''}"\n`;
      });
    }
    else if (reportType === 'defaulters') {
      filename = `fee-defaulters-${new Date().toISOString().slice(0,10)}.csv`;
      csv = 'Roll No,Student Name,Class,Program,Total Balance,Unpaid Groups\n';
      const defaulters = filterStudents
        .map(s => {
          const sg   = feeGroups.filter(g => g.student_roll === s.roll_no && g.status !== 'Paid');
          const bal  = sg.reduce((t, g) => t + (g.balance || 0), 0);
          return { ...s, balance: bal, unpaidCount: sg.length };
        })
        .filter(s => s.balance > 0)
        .sort((a, b) => b.balance - a.balance);
      defaulters.forEach(s => {
        csv += `${s.roll_no},"${s.full_name}","${s.class_section}","${s.program}",${s.balance},${s.unpaidCount}\n`;
      });
    }
    else if (reportType === 'attendance_summary') {
      filename = `attendance-summary-${new Date().toISOString().slice(0,10)}.csv`;
      csv = 'This report is generated from biometric + manual attendance.\nDate,Roll No,Student Name,Class,Status,Source,Time In\n';
      // We'll just note it needs a server query — provide a placeholder
      csv += 'Note: Full attendance data requires server-side query. Use Supabase dashboard for large exports.\n';
    }

    if (!csv) { setStatus(key, 'error', '❌ Unknown report type'); return; }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
    setStatus(key, 'done', '✅ CSV downloaded');
    setTimeout(() => setStatus(key, 'idle'), 4000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteChars = atob(base64);
    const byteNums  = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
    return new Blob([new Uint8Array(byteNums)], { type: mimeType });
  };

  const REPORTS = [
    {
      key:   'student_list',
      title: 'Student List',
      desc:  'All enrolled students with class, program, roll number',
      icon:  '👨‍🎓',
      color: 'bg-blue-50 border-blue-100',
      btn:   'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    },
    {
      key:   'fee_ledger',
      title: 'Fee Ledger',
      desc:  'All fee groups with amount, paid, balance, status',
      icon:  '💳',
      color: 'bg-rose-50 border-rose-100',
      btn:   'linear-gradient(135deg,#be123c,#f43f5e)',
    },
    {
      key:   'transactions',
      title: 'Transactions',
      desc:  'Full payment history with receipt numbers',
      icon:  '🧾',
      color: 'bg-emerald-50 border-emerald-100',
      btn:   'linear-gradient(135deg,#059669,#10b981)',
    },
    {
      key:   'defaulters',
      title: 'Fee Defaulters',
      desc:  'Students with outstanding balance, sorted by amount',
      icon:  '⚠️',
      color: 'bg-amber-50 border-amber-100',
      btn:   'linear-gradient(135deg,#d97706,#f59e0b)',
    },
    {
      key:   'attendance_summary',
      title: 'Attendance Summary',
      desc:  'Daily attendance log (biometric + manual)',
      icon:  '📅',
      color: 'bg-teal-50 border-teal-100',
      btn:   'linear-gradient(135deg,#0f766e,#0d9488)',
    },
  ];

  return (
    <motion.div key="excel-reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Header */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg,#0d1b6e,${ACCENT})` }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: 'translate(40%,-40%)' }} />
        <h2 className="text-lg font-black text-white mb-1">Excel / CSV Reports</h2>
        <p className="text-sm opacity-70">Download reports for all major data sets · CSV format</p>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter (optional — applies to Student List, Fee Ledger, Defaulters)</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Program</p>
            <div className="flex flex-wrap gap-2">
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { setFilterProg(''); setFilterSec(''); }}
                className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all"
                style={!filterProg ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                All Programs
              </motion.button>
              {PROGRAMS.map(prog => (
                <motion.button key={prog} whileTap={{ scale: 0.96 }}
                  onClick={() => { setFilterProg(filterProg === prog ? '' : prog); setFilterSec(''); }}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all"
                  style={filterProg === prog ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                  {prog}
                </motion.button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {sectionOptions.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Section</p>
                <div className="flex flex-wrap gap-2">
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => setFilterSec('')}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all"
                    style={!filterSec ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                    All Sections
                  </motion.button>
                  {sectionOptions.map(sec => (
                    <motion.button key={sec} whileTap={{ scale: 0.96 }}
                      onClick={() => setFilterSec(filterSec === sec ? '' : sec)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all"
                      style={filterSec === sec ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                      {sec}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {(filterProg || filterSec) && (
            <p className="text-xs font-bold text-slate-500">
              Filtered: <span className="font-black" style={{ color: ACCENT }}>
                {filterProg || 'All Programs'}{filterSec ? ` · ${filterSec}` : ''}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map(({ key, title, desc, icon, color, btn }) => {
          const status  = statuses[key] || 'idle';
          const message = messages[key] || '';
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl border p-5 shadow-sm', color)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>

              {message && (
                <div className={cn('px-3 py-2 rounded-xl text-xs font-bold mb-3', status === 'done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200')}>
                  {message}
                </div>
              )}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => generateReport(key)}
                disabled={status === 'generating'}
                className="w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: btn }}>
                {status === 'generating' ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating…</>
                ) : (
                  <><Download size={14} /> Download {title}</>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
        <p className="text-xs font-bold text-slate-600">
          💡 <strong>How it works:</strong> Reports first try the <code className="bg-slate-200 px-1 rounded">generate-excel-report</code> Supabase Edge Function. If unavailable, they fall back to client-side CSV export which downloads instantly. CSV files open in Excel, Google Sheets, or Numbers.
        </p>
      </div>
    </motion.div>
  );
};