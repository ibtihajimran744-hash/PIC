import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Clock, CreditCard, FileText,
  Calendar, LogOut, CheckCircle, XCircle, AlertCircle,
  ChevronRight, BookOpen, Bell, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';
import { FeeStatusPage } from './FeeStatusPage';

interface ParentPortalProps {
  onLogout: () => void;
  parentData: {
    roll_no:         number;
    full_name:       string;
    class_section:   string;
    total_package:   number;
    paid_amount:     number;
    program?:        string;
    part?:           number;
    parent_username: string;
  };
}

const PKR = (n: number | null | undefined) => `Rs ${(n ?? 0).toLocaleString('en-PK')}`;

export const ParentPortal: React.FC<ParentPortalProps> = ({ onLogout, parentData }) => {
  const [tab,           setTab]           = useState('dashboard');
  const [attendance,    setAttendance]    = useState<any[]>([]);
  const [grades,        setGrades]        = useState<any[]>([]);
  const [timetable,     setTimetable]     = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [exams,         setExams]         = useState<any[]>([]);
  const [feeData,       setFeeData]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);

  const studentRoll = parentData.roll_no;
  const studentName = parentData.full_name;

  useEffect(() => { loadAll(); }, [studentRoll]);

  const loadAll = async () => {
    setLoading(true);
    const [attRes, gradeRes, ttRes, notifRes, examRes, feeRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('student_roll', studentRoll).order('date', { ascending: false }).limit(30),
      supabase.from('grades').select('*, exams(title, subject, exam_type, chapter_name, date)').eq('student_roll', studentRoll).order('created_at', { ascending: false }),
      supabase.from('timetable').select('subject, day_of_week, start_time, end_time, room, campus, teachers(full_name)').eq('class_section', parentData.class_section).order('day_of_week').order('start_time'),
      // CRITICAL FIX: only notifications for THIS student
      supabase.from('notifications').select('*').or(`target_user_id.eq.${studentRoll},and(target_role.ilike.parent,target_user_id.is.null)`).order('created_at', { ascending: false }).limit(20),
      supabase.from('exams').select('*').eq('class_section', parentData.class_section).gte('date', new Date().toISOString().split('T')[0]).order('date').limit(5),
      // Fee data from students table (source of truth)
      supabase.from('students').select('total_package, paid_amount, status').eq('roll_no', studentRoll).single(),
    ]);

    setAttendance(attRes.data   || []);
    setGrades(gradeRes.data     || []);
    setTimetable(ttRes.data     || []);
    setNotifications(notifRes.data || []);
    setExams(examRes.data       || []);

    const s = feeRes.data;
    if (s) {
      setFeeData({
        total:   s.total_package  || 0,
        paid:    s.paid_amount    || 0,
        balance: (s.total_package || 0) - (s.paid_amount || 0),
        status:  s.status,
      });
    }
    setLoading(false);
  };

  const totalDays   = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const lateDays    = attendance.filter(a => a.status === 'Late').length;
  const absentDays  = attendance.filter(a => a.status === 'Absent').length;
  const attendancePct = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  const gradedItems = grades.filter(g => g.score !== null && g.total_marks > 0);
  const avgPct = gradedItems.length > 0
    ? Math.round(gradedItems.reduce((s, g) => s + (g.score / g.total_marks) * 100, 0) / gradedItems.length)
    : null;
  const overallGrade = avgPct === null ? '—'
    : avgPct >= 90 ? 'A+' : avgPct >= 80 ? 'A' : avgPct >= 70 ? 'B+'
    : avgPct >= 60 ? 'B' : avgPct >= 50 ? 'C' : 'F';

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const NAV = [
    { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'fees',       label: 'Fee Status', icon: CreditCard },
    { id: 'grades',     label: 'Report Card',icon: FileText },
    { id: 'schedule',   label: 'Schedule',   icon: Calendar },
  ];

  const statusIcon = (s: string) =>
    s === 'Present' ? <CheckCircle size={14} className="text-emerald-500" /> :
    s === 'Late'    ? <AlertCircle  size={14} className="text-amber-500"   /> :
    <XCircle size={14} className="text-rose-500" />;

  return (
    <div className="min-h-screen flex bg-[#f0f2f8]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col fixed h-full"
        style={{ boxShadow: '2px 0 16px rgba(0,0,0,0.05)' }}>
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm tracking-tight leading-none">PIC CAMPUS</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">Parent Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                tab === id ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
              style={tab === id ? { background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' } : {}}>
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'dashboard' && unreadCount > 0 && (
                <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full', tab === id ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600')}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' }}>
              {studentName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{studentName}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Parent</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="ml-64 flex-1 p-6 min-h-screen">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-[#1a2fa8] rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── DASHBOARD ── */}
            {tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Student card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-5"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' }}>
                    {studentName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{studentName}</h2>
                    <p className="text-sm text-slate-400 font-medium">
                      ID: {studentRoll} &nbsp;·&nbsp; {parentData.class_section}
                      {parentData.program && ` · ${parentData.program}`}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl border border-slate-100 p-5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Grade</p>
                    <p className="text-3xl font-black text-slate-900">{overallGrade}</p>
                    {avgPct !== null && <p className="text-xs text-slate-400 font-medium mt-1">{avgPct}% average</p>}
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 p-5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black" style={{ color: attendancePct >= 75 ? '#059669' : '#e11d48' }}>{attendancePct}%</p>
                      <p className="text-xs text-slate-400 font-semibold">{attendancePct >= 75 ? 'STABLE' : 'LOW'}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">{presentDays + lateDays} present · {absentDays} absent</p>
                  </div>
                </div>

                {/* Upcoming Exams */}
                {exams.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Upcoming Exams</h3></div>
                    <div className="divide-y divide-slate-50">
                      {exams.map(exam => {
                        const d = new Date(exam.date);
                        return (
                          <div key={exam.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                            <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border border-slate-100" style={{ background: '#f8f9ff' }}>
                              <p className="text-[10px] font-black text-slate-400 uppercase">{d.toLocaleDateString('en-PK', { month: 'short' })}</p>
                              <p className="text-lg font-black text-slate-800 leading-none">{d.getDate()}</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-slate-800 text-sm">{exam.subject || exam.title}</p>
                              <p className="text-xs text-slate-400 font-medium">{exam.exam_type || 'Examination'} · {exam.total_marks} marks</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notifications — scoped to THIS student */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Recent Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                        style={{ background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' }}>{unreadCount} NEW</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center text-slate-400 text-sm font-medium">No notifications yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map(n => (
                        <div key={n.id} className={cn('px-6 py-4 flex items-start gap-3 transition-colors hover:bg-slate-50/50', !n.is_read ? 'bg-blue-50/30' : '')}>
                          {!n.is_read && <div className="w-1 h-full rounded-full bg-blue-500 self-stretch flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{n.message}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium flex-shrink-0">{new Date(n.created_at).toLocaleDateString('en-PK')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── ATTENDANCE ── */}
            {tab === 'attendance' && (
              <motion.div key="att" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Days',  value: totalDays,              color: '#1a2fa8' },
                    { label: 'Present',     value: presentDays + lateDays, color: '#059669' },
                    { label: 'Percentage',  value: `${attendancePct}%`,    color: attendancePct >= 75 ? '#059669' : '#e11d48' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                      <p className="text-3xl font-black" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Recent History</h3>
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  {attendance.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No attendance records found.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {attendance.map((a, i) => (
                        <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            {statusIcon(a.status)}
                            <p className={cn('text-sm font-black', a.status === 'Present' ? 'text-emerald-600' : a.status === 'Late' ? 'text-amber-600' : 'text-rose-600')}>{a.status}</p>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{new Date(a.date).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── FEE STATUS — uses FeeStatusPage ── */}
            {tab === 'fees' && (
              <motion.div key="fees" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Fee Status</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{parentData.class_section} · Roll {studentRoll}</p>
                </div>
                <FeeStatusPage rollNo={studentRoll} studentName={studentName} />
              </motion.div>
            )}

            {/* ── REPORT CARD / GRADES ── */}
            {tab === 'grades' && (
              <motion.div key="grades" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900">Academic Performance</h3>
                      <p className="text-xs text-slate-400 font-medium">Current Term: Fall 2025</p>
                    </div>
                    {avgPct !== null && (
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm"
                        style={{ background: 'linear-gradient(135deg,#1a2fa8,#2952e3)' }}>{overallGrade}</div>
                    )}
                  </div>
                  {grades.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No grades recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {grades.map((g, i) => {
                        const pct = g.total_marks > 0 ? Math.round((g.score / g.total_marks) * 100) : 0;
                        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F';
                        const gradeColor = pct >= 70 ? '#059669' : pct >= 50 ? '#d97706' : '#e11d48';
                        return (
                          <motion.div key={g.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                              style={{ background: `${gradeColor}20`, color: gradeColor }}>{grade}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-800 truncate">{(g.exams as any)?.subject || g.subject || 'Subject'}</p>
                              <p className="text-xs text-slate-400 font-medium">{(g.exams as any)?.title || 'Test'} · {g.chapter_name || ''}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-black" style={{ color: gradeColor }}>{g.score}/{g.total_marks}</p>
                              <p className="text-xs text-slate-400 font-medium">{pct}%</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SCHEDULE ── */}
            {tab === 'schedule' && (
              <motion.div key="sched" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Weekly Timetable</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{parentData.class_section}</p>
                  </div>
                  {timetable.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No schedule data available for this class.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: '#f8f9fd' }}>
                            {['Day', 'Subject', 'Time', 'Teacher', 'Room'].map(h => (
                              <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timetable.map((t, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-5 py-3.5 font-bold text-slate-700">{t.day_of_week}</td>
                              <td className="px-5 py-3.5 font-bold text-slate-800">{t.subject}</td>
                              <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">{t.start_time?.slice(0, 5)} – {t.end_time?.slice(0, 5)}</td>
                              <td className="px-5 py-3.5 text-slate-500 font-medium">{(t.teachers as any)?.full_name || '—'}</td>
                              <td className="px-5 py-3.5 text-slate-400">{t.room || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>
    </div>
  );
};