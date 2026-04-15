import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface Props { onLogout: () => void; adminData: { id: string; full_name: string; role: string; username: string }; }

const ACCENT = '#4F46E5';
const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

type Tab = 'dashboard' | 'schedules' | 'exams' | 'papers' | 'seating' | 'invigilation' | 'results' | 'grades';

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: '📊' },
  { id: 'schedules',    label: 'Exam Schedules',  icon: '📅' },
  { id: 'exams',        label: 'Exams',           icon: '📝' },
  { id: 'papers',       label: 'Paper Setup',     icon: '📄' },
  { id: 'seating',      label: 'Seating Plans',   icon: '🪑' },
  { id: 'invigilation', label: 'Invigilation',    icon: '👁' },
  { id: 'grades',       label: 'Grade Entry',     icon: '✏️' },
  { id: 'results',      label: 'Result Cards',    icon: '🏅' },
];

const EXAM_TYPES = ['Mid-Term', 'Final', 'Unit Test', 'Mock', 'Board', 'Chapter Test', 'Quiz', 'Assignment'];
const PROGRAMS   = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];
const ROOMS      = ['Room 101','Room 102','Room 103','Room 201','Room 202','Room 203','Hall A','Hall B','Lab 1','Lab 2'];

const Badge = ({ c, label }: { c: string; label: string }) => (
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${c}`}>{label}</span>
);

const StatCard = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

export const ExaminerPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  // Data
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

  // Forms
  const [schedForm, setSchedForm] = useState<any>({
    title: '', exam_type: 'Mid-Term', session: '2026-27', program: '', part: 1, class_section: '', start_date: '', end_date: '', status: 'Upcoming',
  });
  const [examForm, setExamForm] = useState<any>({
    title: '', class_section: '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '', teacher_id: '',
  });
  const [paperForm, setPaperForm] = useState<any>({
    exam_id: '', subject: '', total_marks: 100, pass_marks: 40, duration_mins: 180, paper_type: 'Written', instructions: '', syllabus_refs: '',
  });
  const [seatForm, setSeatForm] = useState<any>({
    exam_id: '', student_roll: '', room: '', seat_no: '', date: '', subject: '',
  });
  const [invigiForm, setInvigiForm] = useState<any>({
    exam_id: '', teacher_name: '', admin_user_id: '', room: '', date: '', subject: '', shift: 'Morning',
  });
  const [gradeForm, setGradeForm] = useState<any>({
    exam_id: '', student_roll: '', subject: '', score: '', total_marks: 100, grade_letter: '', remarks: '',
  });

  const [search, setSearch] = useState('');

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

  // ── Helpers ─────────────────────────────────────────────────
  const getGradeLetter = (score: number, total: number) => {
    const p = (score / total) * 100;
    if (p >= 90) return 'A+'; if (p >= 80) return 'A';
    if (p >= 70) return 'B'; if (p >= 60) return 'C';
    if (p >= 50) return 'D'; if (p >= 40) return 'E';
    return 'F';
  };

  // ── Create Exam Schedule ─────────────────────────────────────
  const saveSchedule = async () => {
    if (!schedForm.title || !schedForm.start_date) { showToast('Title and start date required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_schedule').insert([{ ...schedForm, created_by: adminData.full_name }]);
      if (error) throw error;
      showToast('✅ Exam schedule created');
      setSchedForm({ title: '', exam_type: 'Mid-Term', session: '2026-27', program: '', part: 1, class_section: '', start_date: '', end_date: '', status: 'Upcoming' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Create Exam ──────────────────────────────────────────────
  const saveExam = async () => {
    if (!examForm.title || !examForm.class_section || !examForm.subject || !examForm.date) {
      showToast('Title, class, subject and date are required', false); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('exams').insert([{
        ...examForm, total_marks: Number(examForm.total_marks),
        teacher_id: examForm.teacher_id ? Number(examForm.teacher_id) : null,
        created_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Exam created');
      setExamForm({ title: '', class_section: '', subject: '', date: '', total_marks: 100, exam_type: 'Chapter Test', chapter_name: '', teacher_id: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Create Paper ─────────────────────────────────────────────
  const savePaper = async () => {
    if (!paperForm.exam_id || !paperForm.subject) { showToast('Exam and subject required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_papers').insert([{
        ...paperForm, exam_id: Number(paperForm.exam_id),
        total_marks: Number(paperForm.total_marks), pass_marks: Number(paperForm.pass_marks),
        duration_mins: Number(paperForm.duration_mins), created_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Exam paper configured');
      setPaperForm({ exam_id: '', subject: '', total_marks: 100, pass_marks: 40, duration_mins: 180, paper_type: 'Written', instructions: '', syllabus_refs: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Auto-generate seating for class ─────────────────────────
  const generateSeating = async (examId: number, classSection: string, examDate: string, examSubject: string) => {
    setSaving(true);
    try {
      const classStudents = students.filter(s => s.class_section === classSection);
      if (!classStudents.length) { showToast(`No students in ${classSection}`, false); return; }
      const rows: any[] = classStudents.map((s, i) => ({
        exam_id: examId, student_roll: s.roll_no,
        room: ROOMS[Math.floor(i / 20)], seat_no: `${i + 1}`,
        date: examDate, subject: examSubject,
      }));
      const { error } = await supabase.from('exam_seating').insert(rows);
      if (error) throw error;
      showToast(`✅ Seating generated for ${classStudents.length} students`);
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Save Seating ─────────────────────────────────────────────
  const saveSeat = async () => {
    if (!seatForm.exam_id || !seatForm.student_roll) { showToast('Exam and student required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_seating').insert([{
        ...seatForm, exam_id: Number(seatForm.exam_id), student_roll: Number(seatForm.student_roll),
      }]);
      if (error) throw error;
      showToast('✅ Seat assigned');
      setSeatForm({ exam_id: '', student_roll: '', room: '', seat_no: '', date: '', subject: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Save Invigilation duty ───────────────────────────────────
  const saveInvigi = async () => {
    if (!invigiForm.exam_id || !invigiForm.teacher_name) { showToast('Exam and teacher required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('exam_invigilation').insert([{
        ...invigiForm, exam_id: Number(invigiForm.exam_id),
        admin_user_id: invigiForm.admin_user_id || null,
      }]);
      if (error) throw error;
      showToast('✅ Invigilation duty assigned');
      setInvigiForm({ exam_id: '', teacher_name: '', admin_user_id: '', room: '', date: '', subject: '', shift: 'Morning' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Save Grade ───────────────────────────────────────────────
  const saveGrade = async () => {
    if (!gradeForm.exam_id || !gradeForm.student_roll || gradeForm.score === '') {
      showToast('Exam, student and score are required', false); return;
    }
    setSaving(true);
    try {
      const score = Number(gradeForm.score);
      const total = Number(gradeForm.total_marks);
      const pct   = (score / total) * 100;
      const letter = getGradeLetter(score, total);
      const { error } = await supabase.from('grades').insert([{
        exam_id: Number(gradeForm.exam_id), student_roll: Number(gradeForm.student_roll),
        subject: gradeForm.subject, score, total_marks: total,
        percentage: pct.toFixed(2), grade_letter: letter,
        remarks: gradeForm.remarks, is_verified: false,
        entered_by_coordinator: false, verified_by: adminData.full_name,
      }]);
      if (error) throw error;
      showToast(`✅ Grade saved: ${letter} (${pct.toFixed(0)}%)`);
      setGradeForm({ exam_id: '', student_roll: '', subject: '', score: '', total_marks: 100, grade_letter: '', remarks: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Generate Result Cards ────────────────────────────────────
  const generateResultCards = async (scheduleId: number) => {
    setSaving(true);
    try {
      const schedGrades = grades.filter(g => {
        const ex = exams.find(e => e.id === g.exam_id);
        return ex;
      });
      const studentRolls = [...new Set(schedGrades.map(g => g.student_roll))];
      const rows: any[] = studentRolls.map(roll => {
        const sg = schedGrades.filter(g => g.student_roll === roll);
        const obtained = sg.reduce((s, g) => s + (g.score || 0), 0);
        const total    = sg.reduce((s, g) => s + (g.total_marks || 0), 0);
        const pct = total > 0 ? ((obtained / total) * 100) : 0;
        return {
          student_roll: roll, exam_schedule_id: scheduleId,
          total_marks: total, obtained_marks: obtained,
          percentage: pct.toFixed(2), grade: getGradeLetter(obtained, total),
          is_published: false, generated_by: adminData.full_name,
        };
      });
      if (!rows.length) { showToast('No grades found to generate results from', false); return; }
      // Calculate positions
      rows.sort((a, b) => b.obtained_marks - a.obtained_marks);
      rows.forEach((r, i) => { r.position = i + 1; });
      const { error } = await supabase.from('result_cards').insert(rows);
      if (error) throw error;
      showToast(`✅ Result cards generated for ${rows.length} students`);
      loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const publishResults = async (scheduleId: number) => {
    await supabase.from('result_cards').update({ is_published: true, published_at: new Date().toISOString() }).eq('exam_schedule_id', scheduleId);
    showToast('✅ Results published');
    loadAll();
  };

  const verifyGrade = async (gradeId: number) => {
    await supabase.from('grades').update({ is_verified: true, verified_by: adminData.full_name, verified_at: new Date().toISOString() }).eq('id', gradeId);
    showToast('✅ Grade verified');
    loadAll();
  };

  const updateScheduleStatus = async (id: number, status: string) => {
    await supabase.from('exam_schedule').update({ status }).eq('id', id);
    showToast(`Schedule marked as ${status}`);
    loadAll();
  };

  // ── Dashboard stats ──────────────────────────────────────────
  const upcomingExams     = schedules.filter(s => s.status === 'Upcoming').length;
  const ongoingExams      = schedules.filter(s => s.status === 'Ongoing').length;
  const unverifiedGrades  = grades.filter(g => !g.is_verified).length;
  const publishedResults  = results.filter(r => r.is_published).length;

  const FM = ({ label, req, children }: any) => (
    <div>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
  const TI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 bg-white"/>
  );
  const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 bg-white">{children}</select>
  );
  const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 bg-white resize-none"/>
  );

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform shadow-lg
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 py-4 border-b border-slate-100" style={{ background: ACCENT }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📝</div>
            <div>
              <p className="font-black text-white text-sm">PIC CAMPUS</p>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Examiner Portal</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[9px] font-black uppercase">Logged in as</p>
            <p className="text-white text-xs font-black">{adminData.full_name}</p>
            <p className="text-white/60 text-[9px]">{adminData.role}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => { setTab(id as Tab); setSideOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left
                ${tab === id ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              style={tab === id ? { background: ACCENT } : {}}>
              <span>{icon}</span><span>{label}</span>
              {id === 'grades' && unverifiedGrades > 0 && <span className="ml-auto bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unverifiedGrades}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-indigo-50 rounded-xl p-2.5 text-center border border-indigo-100">
              <p className="text-lg font-black text-indigo-700">{upcomingExams}</p>
              <p className="text-[9px] font-black text-indigo-400 uppercase">Upcoming</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
              <p className="text-lg font-black text-amber-700">{unverifiedGrades}</p>
              <p className="text-[9px] font-black text-amber-400 uppercase">Unverified</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50">🚪 Sign Out</button>
        </div>
      </aside>

      {sideOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSideOpen(false)}/>}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600 text-xl" onClick={() => setSideOpen(true)}>☰</button>
            <div>
              <h1 className="text-lg font-black text-slate-900">{TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}</h1>
              <p className="text-[10px] text-slate-400 font-medium">Examiner Portal · PIC Gujranwala</p>
            </div>
          </div>
          <button onClick={loadAll} className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs">{loading ? '⏳' : '🔄'}</button>
        </header>

        <main className="flex-1 p-5 pb-10">

          {/* ════ DASHBOARD ════ */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Exam Schedules" value={schedules.length} icon="📅" color={ACCENT} sub={`${upcomingExams} upcoming`}/>
                <StatCard label="Total Exams" value={exams.length} icon="📝" color="#0891b2" sub="Created this session"/>
                <StatCard label="Unverified Grades" value={unverifiedGrades} icon="✏️" color="#e67e22" sub="Needs verification"/>
                <StatCard label="Published Results" value={publishedResults} icon="🏅" color="#27ae60" sub="Result cards published"/>
              </div>

              {/* Recent Exams */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-black text-slate-800">Recent Exams</h2>
                  <button onClick={() => setTab('exams')} className="text-xs font-bold text-indigo-600">View All →</button>
                </div>
                {exams.slice(0, 8).map((e, i) => (
                  <div key={e.id} className="px-5 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{e.title}</p>
                      <p className="text-xs text-slate-400">{e.class_section} · {e.subject} · {e.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={e.exam_type}/>
                      <Badge c={e.grading_status==='Completed'?'bg-emerald-50 text-emerald-700 border-emerald-200':e.grading_status==='In Progress'?'bg-amber-50 text-amber-700 border-amber-200':'bg-slate-100 text-slate-500 border-slate-200'} label={e.grading_status}/>
                    </div>
                  </div>
                ))}
                {!exams.length && <p className="p-5 text-center text-slate-400 text-sm">No exams created yet</p>}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label:'Create Schedule', icon:'📅', action:()=>{ setTab('schedules'); setModal('sched'); } },
                  { label:'Add Exam', icon:'📝', action:()=>{ setTab('exams'); setModal('exam'); } },
                  { label:'Assign Seats', icon:'🪑', action:()=>setTab('seating') },
                  { label:'Enter Grades', icon:'✏️', action:()=>{ setTab('grades'); setModal('grade'); } },
                ].map(({ label, icon, action }) => (
                  <button key={label} onClick={action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all text-slate-600 hover:text-indigo-700">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-black">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════ EXAM SCHEDULES ════ */}
          {tab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('sched')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
                  style={{ background: ACCENT }}>
                  ➕ New Schedule
                </button>
              </div>
              <div className="space-y-3">
                {schedules.map((s, i) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900">{s.title}</h3>
                          <Badge c={s.status==='Upcoming'?'bg-blue-50 text-blue-700 border-blue-200':s.status==='Ongoing'?'bg-amber-50 text-amber-700 border-amber-200':s.status==='Completed'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'} label={s.status}/>
                          <Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={s.exam_type}/>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{s.program} · Part {s.part} · {s.session}</p>
                        <p className="text-xs text-slate-400 mt-0.5">📅 {s.start_date} → {s.end_date}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {s.status === 'Upcoming' && <button onClick={() => updateScheduleStatus(s.id, 'Ongoing')} className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">▶ Start</button>}
                        {s.status === 'Ongoing'  && <button onClick={() => updateScheduleStatus(s.id, 'Completed')} className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Complete</button>}
                        <button disabled={saving} onClick={() => generateResultCards(s.id)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">🏅 Generate Results</button>
                        {results.filter(r => r.exam_schedule_id === s.id && !r.is_published).length > 0 &&
                          <button disabled={saving} onClick={() => publishResults(s.id)} className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">📢 Publish</button>
                        }
                      </div>
                    </div>
                    {/* Sub-stats */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { label:'Exams', v: exams.filter(e=>e.class_section===s.class_section).length },
                        { label:'Results', v: results.filter(r=>r.exam_schedule_id===s.id).length },
                        { label:'Published', v: results.filter(r=>r.exam_schedule_id===s.id&&r.is_published).length },
                      ].map(({label,v})=>(
                        <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                          <p className="text-lg font-black text-slate-700">{v}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!schedules.length && <div className="text-center py-12 text-slate-400 text-sm">No exam schedules. <button className="text-indigo-600 font-bold" onClick={() => setModal('sched')}>Create one →</button></div>}
              </div>
            </div>
          )}

          {/* ════ EXAMS ════ */}
          {tab === 'exams' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, class or subject…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"/>
                <button onClick={() => setModal('exam')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
                  style={{ background: ACCENT }}>
                  ➕ Add Exam
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Title','Class','Subject','Date','Type','Total Marks','Teacher','Status','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exams.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.class_section?.includes(search) || e.subject?.toLowerCase().includes(search.toLowerCase())).map((e) => {
                        const teacher = teachers.find(t => t.id === e.teacher_id);
                        return (
                          <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-800">{e.title}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{e.class_section}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{e.subject}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">{e.date}</td>
                            <td className="px-4 py-2.5"><Badge c="bg-indigo-50 text-indigo-700 border-indigo-200" label={e.exam_type}/></td>
                            <td className="px-4 py-2.5 font-bold text-slate-700">{e.total_marks}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">{teacher?.full_name || '—'}</td>
                            <td className="px-4 py-2.5"><Badge c={e.grading_status==='Completed'?'bg-emerald-50 text-emerald-700 border-emerald-200':e.grading_status==='In Progress'?'bg-amber-50 text-amber-700 border-amber-200':'bg-slate-100 text-slate-500 border-slate-200'} label={e.grading_status}/></td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => { setGradeForm((g: any) => ({ ...g, exam_id: String(e.id), subject: e.subject })); setTab('grades'); setModal('grade'); }}
                                className="text-xs font-bold text-indigo-600 hover:underline">Enter Grades →</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ PAPER SETUP ════ */}
          {tab === 'papers' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('paper')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  ➕ Add Paper Spec
                </button>
              </div>
              <div className="space-y-3">
                {papers.map((p) => {
                  const ex = exams.find(e => e.id === p.exam_id);
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-black text-slate-900">{p.subject}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Exam: {ex?.title || `#${p.exam_id}`}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge c="bg-blue-50 text-blue-700 border-blue-200" label={`Total: ${p.total_marks}`}/>
                            <Badge c="bg-amber-50 text-amber-700 border-amber-200" label={`Pass: ${p.pass_marks}`}/>
                            <Badge c="bg-purple-50 text-purple-700 border-purple-200" label={`${p.duration_mins} mins`}/>
                            <Badge c="bg-slate-100 text-slate-600 border-slate-200" label={p.paper_type}/>
                          </div>
                          {p.instructions && <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl"><strong>Instructions:</strong> {p.instructions}</p>}
                          {p.syllabus_refs && <p className="text-xs text-indigo-600 mt-1">📚 {p.syllabus_refs}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!papers.length && <div className="text-center py-12 text-slate-400 text-sm">No paper specs. <button className="text-indigo-600 font-bold" onClick={() => setModal('paper')}>Add one →</button></div>}
              </div>
            </div>
          )}

          {/* ════ SEATING PLANS ════ */}
          {tab === 'seating' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by exam or class…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"/>
                <button onClick={() => setModal('seat')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  ➕ Assign Seat
                </button>
              </div>
              {/* Auto-generate seating buttons */}
              {exams.length > 0 && (
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                  <p className="text-sm font-black text-indigo-800 mb-3">⚡ Auto-generate seating by exam:</p>
                  <div className="flex flex-wrap gap-2">
                    {exams.slice(0, 6).map(e => (
                      <button key={e.id} disabled={saving}
                        onClick={() => generateSeating(e.id, e.class_section, e.date, e.subject)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                        🪑 {e.class_section} - {e.subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Student','Roll #','Exam ID','Subject','Room','Seat No','Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {seating.filter(s => !search || String(s.exam_id).includes(search) || s.subject?.toLowerCase().includes(search.toLowerCase())).slice(0, 100).map((s) => {
                        const st = students.find(stu => stu.roll_no === s.student_roll);
                        return (
                          <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{st?.full_name || '—'}</td>
                            <td className="px-4 py-2.5 font-black text-indigo-700">{s.student_roll}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">#{s.exam_id}</td>
                            <td className="px-4 py-2.5 text-xs">{s.subject}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-700">{s.room}</td>
                            <td className="px-4 py-2.5 font-black text-indigo-600">{s.seat_no}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{s.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ INVIGILATION ════ */}
          {tab === 'invigilation' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('invigi')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  ➕ Assign Duty
                </button>
              </div>
              <div className="space-y-3">
                {invigilation.map((iv) => {
                  const ex = exams.find(e => e.id === iv.exam_id);
                  return (
                    <div key={iv.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{iv.teacher_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Exam: {ex?.title || `#${iv.exam_id}`} · {iv.subject || 'All Subjects'}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge c="bg-slate-100 text-slate-600 border-slate-200" label={`Room: ${iv.room}`}/>
                            <Badge c="bg-blue-50 text-blue-700 border-blue-200" label={iv.shift}/>
                            {iv.date && <span className="text-xs text-slate-400">📅 {iv.date}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!invigilation.length && <div className="text-center py-12 text-slate-400 text-sm">No invigilation duties assigned yet</div>}
              </div>
            </div>
          )}

          {/* ════ GRADE ENTRY ════ */}
          {tab === 'grades' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by roll no or subject…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white"/>
                <button onClick={() => setModal('grade')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  ✏️ Enter Grade
                </button>
              </div>
              {unverifiedGrades > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-sm font-black text-amber-800">⚠️ {unverifiedGrades} grades awaiting verification</p>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Student','Roll #','Subject','Score','Total','Grade','%','Verified','Date','Action'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grades.filter(g => !search || String(g.student_roll).includes(search) || g.subject?.toLowerCase().includes(search.toLowerCase())).slice(0, 100).map((g) => {
                        const st = students.find(s => s.roll_no === g.student_roll);
                        return (
                          <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{st?.full_name || '—'}</td>
                            <td className="px-4 py-2.5 font-black text-indigo-700">{g.student_roll}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{g.subject}</td>
                            <td className="px-4 py-2.5 font-black text-slate-800">{g.score}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">{g.total_marks}</td>
                            <td className="px-4 py-2.5">
                              <span className={`font-black text-sm ${g.grade_letter==='A+'||g.grade_letter==='A'?'text-emerald-600':g.grade_letter==='F'?'text-rose-600':'text-blue-600'}`}>{g.grade_letter}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-600">{g.percentage ? `${Number(g.percentage).toFixed(1)}%` : '—'}</td>
                            <td className="px-4 py-2.5">{g.is_verified ? <span className="text-emerald-600 font-black text-xs">✓ Verified</span> : <span className="text-amber-500 text-xs font-bold">Pending</span>}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{g.created_at ? new Date(g.created_at).toLocaleDateString('en-PK') : '—'}</td>
                            <td className="px-4 py-2.5">
                              {!g.is_verified && <button onClick={() => verifyGrade(g.id)} className="text-xs font-black text-indigo-600 hover:underline">Verify →</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ RESULT CARDS ════ */}
          {tab === 'results' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-black text-slate-800">Result Cards</h2>
                  <span className="text-xs text-slate-400">{results.length} total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Student','Roll #','Schedule','Total','Obtained','%','Grade','Position','Status','Published'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => {
                        const st = students.find(s => s.roll_no === r.student_roll);
                        const sched = schedules.find(s => s.id === r.exam_schedule_id);
                        return (
                          <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{st?.full_name || '—'}</td>
                            <td className="px-4 py-2.5 font-black text-indigo-700">{r.student_roll}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">{sched?.title || `#${r.exam_schedule_id}`}</td>
                            <td className="px-4 py-2.5 text-slate-600">{r.total_marks}</td>
                            <td className="px-4 py-2.5 font-black text-slate-800">{r.obtained_marks}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-600">{Number(r.percentage).toFixed(1)}%</td>
                            <td className="px-4 py-2.5"><span className={`font-black ${r.grade==='A+'||r.grade==='A'?'text-emerald-600':r.grade==='F'?'text-rose-600':'text-blue-600'}`}>{r.grade}</span></td>
                            <td className="px-4 py-2.5 font-black text-amber-600">#{r.position}</td>
                            <td className="px-4 py-2.5">{r.is_published ? <Badge c="bg-emerald-50 text-emerald-700 border-emerald-200" label="Published"/> : <Badge c="bg-slate-100 text-slate-500 border-slate-200" label="Draft"/>}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{r.published_at ? new Date(r.published_at).toLocaleDateString('en-PK') : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Schedule Modal */}
      {modal === 'sched' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">📅 Create Exam Schedule</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Schedule Title" req><TI placeholder="e.g. Mid-Term Exams 2026" value={schedForm.title} onChange={e => setSchedForm((p: any) => ({ ...p, title: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Exam Type" req><TS value={schedForm.exam_type} onChange={e => setSchedForm((p: any) => ({ ...p, exam_type: e.target.value }))}>{EXAM_TYPES.map(t => <option key={t}>{t}</option>)}</TS></FM>
                <FM label="Session"><TS value={schedForm.session} onChange={e => setSchedForm((p: any) => ({ ...p, session: e.target.value }))}><option>2026-27</option><option>2025-26</option></TS></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Program"><TS value={schedForm.program} onChange={e => setSchedForm((p: any) => ({ ...p, program: e.target.value }))}><option value="">All Programs</option>{PROGRAMS.map(p => <option key={p}>{p}</option>)}</TS></FM>
                <FM label="Part"><TS value={schedForm.part} onChange={e => setSchedForm((p: any) => ({ ...p, part: Number(e.target.value) }))}><option value={1}>Part 1</option><option value={2}>Part 2</option></TS></FM>
              </div>
              <FM label="Class Section"><TI placeholder="e.g. ICS-Phy-A-B" value={schedForm.class_section} onChange={e => setSchedForm((p: any) => ({ ...p, class_section: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Start Date" req><TI type="date" value={schedForm.start_date} onChange={e => setSchedForm((p: any) => ({ ...p, start_date: e.target.value }))}/></FM>
                <FM label="End Date"><TI type="date" value={schedForm.end_date} onChange={e => setSchedForm((p: any) => ({ ...p, end_date: e.target.value }))}/></FM>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveSchedule} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {modal === 'exam' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">📝 Add Exam</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Exam Title" req><TI placeholder="e.g. Chapter 3 Test - Physics" value={examForm.title} onChange={e => setExamForm((p: any) => ({ ...p, title: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Class Section" req><TI placeholder="e.g. ICS-Phy-A-B" value={examForm.class_section} onChange={e => setExamForm((p: any) => ({ ...p, class_section: e.target.value }))}/></FM>
                <FM label="Subject" req><TI placeholder="e.g. Physics" value={examForm.subject} onChange={e => setExamForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Exam Date" req><TI type="date" value={examForm.date} onChange={e => setExamForm((p: any) => ({ ...p, date: e.target.value }))}/></FM>
                <FM label="Total Marks"><TI type="number" value={examForm.total_marks} onChange={e => setExamForm((p: any) => ({ ...p, total_marks: e.target.value }))}/></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Exam Type"><TS value={examForm.exam_type} onChange={e => setExamForm((p: any) => ({ ...p, exam_type: e.target.value }))}>{EXAM_TYPES.map(t => <option key={t}>{t}</option>)}</TS></FM>
                <FM label="Teacher"><TS value={examForm.teacher_id} onChange={e => setExamForm((p: any) => ({ ...p, teacher_id: e.target.value }))}><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</TS></FM>
              </div>
              <FM label="Chapter / Unit Name"><TI placeholder="Chapter name or unit reference" value={examForm.chapter_name} onChange={e => setExamForm((p: any) => ({ ...p, chapter_name: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveExam} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Create Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paper Modal */}
      {modal === 'paper' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">📄 Paper Specification</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Exam" req><TS value={paperForm.exam_id} onChange={e => setPaperForm((p: any) => ({ ...p, exam_id: e.target.value }))}><option value="">Select Exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title} – {e.class_section}</option>)}</TS></FM>
              <FM label="Subject" req><TI placeholder="e.g. Physics" value={paperForm.subject} onChange={e => setPaperForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              <div className="grid grid-cols-3 gap-4">
                <FM label="Total Marks"><TI type="number" value={paperForm.total_marks} onChange={e => setPaperForm((p: any) => ({ ...p, total_marks: e.target.value }))}/></FM>
                <FM label="Pass Marks"><TI type="number" value={paperForm.pass_marks} onChange={e => setPaperForm((p: any) => ({ ...p, pass_marks: e.target.value }))}/></FM>
                <FM label="Duration (min)"><TI type="number" value={paperForm.duration_mins} onChange={e => setPaperForm((p: any) => ({ ...p, duration_mins: e.target.value }))}/></FM>
              </div>
              <FM label="Paper Type"><TS value={paperForm.paper_type} onChange={e => setPaperForm((p: any) => ({ ...p, paper_type: e.target.value }))}><option>Written</option><option>MCQ</option><option>Practical</option><option>Oral</option><option>Mixed</option></TS></FM>
              <FM label="Syllabus References"><TI placeholder="Chapters 1-5, Units 1-3…" value={paperForm.syllabus_refs} onChange={e => setPaperForm((p: any) => ({ ...p, syllabus_refs: e.target.value }))}/></FM>
              <FM label="Instructions"><TA rows={3} placeholder="Attempt all questions. Time allowed: 3 hours…" value={paperForm.instructions} onChange={e => setPaperForm((p: any) => ({ ...p, instructions: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={savePaper} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Save Paper Spec'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Modal */}
      {modal === 'seat' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">🪑 Assign Seat</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Exam" req><TS value={seatForm.exam_id} onChange={e => setSeatForm((p: any) => ({ ...p, exam_id: e.target.value }))}><option value="">Select Exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</TS></FM>
              <FM label="Student" req><TS value={seatForm.student_roll} onChange={e => setSeatForm((p: any) => ({ ...p, student_roll: e.target.value }))}><option value="">Select Student</option>{students.map(s => <option key={s.roll_no} value={s.roll_no}>#{s.roll_no} – {s.full_name}</option>)}</TS></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Room"><TS value={seatForm.room} onChange={e => setSeatForm((p: any) => ({ ...p, room: e.target.value }))}><option value="">Select Room</option>{ROOMS.map(r => <option key={r}>{r}</option>)}</TS></FM>
                <FM label="Seat No."><TI placeholder="e.g. 14" value={seatForm.seat_no} onChange={e => setSeatForm((p: any) => ({ ...p, seat_no: e.target.value }))}/></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Date"><TI type="date" value={seatForm.date} onChange={e => setSeatForm((p: any) => ({ ...p, date: e.target.value }))}/></FM>
                <FM label="Subject"><TI placeholder="Subject" value={seatForm.subject} onChange={e => setSeatForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveSeat} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Assign Seat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invigilation Modal */}
      {modal === 'invigi' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">👁 Assign Invigilation Duty</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Exam" req><TS value={invigiForm.exam_id} onChange={e => setInvigiForm((p: any) => ({ ...p, exam_id: e.target.value }))}><option value="">Select Exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title} – {e.date}</option>)}</TS></FM>
              <FM label="Teacher" req><TS value={invigiForm.teacher_name} onChange={e => setInvigiForm((p: any) => ({ ...p, teacher_name: e.target.value }))}><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)}</TS></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Room"><TS value={invigiForm.room} onChange={e => setInvigiForm((p: any) => ({ ...p, room: e.target.value }))}><option value="">Room</option>{ROOMS.map(r => <option key={r}>{r}</option>)}</TS></FM>
                <FM label="Shift"><TS value={invigiForm.shift} onChange={e => setInvigiForm((p: any) => ({ ...p, shift: e.target.value }))}><option>Morning</option><option>Afternoon</option></TS></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Date"><TI type="date" value={invigiForm.date} onChange={e => setInvigiForm((p: any) => ({ ...p, date: e.target.value }))}/></FM>
                <FM label="Subject"><TI placeholder="Subject" value={invigiForm.subject} onChange={e => setInvigiForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveInvigi} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Assign Duty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Entry Modal */}
      {modal === 'grade' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-md z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">✏️ Enter Grade</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Exam" req><TS value={gradeForm.exam_id} onChange={e => { const ex = exams.find(x => String(x.id) === e.target.value); setGradeForm((p: any) => ({ ...p, exam_id: e.target.value, subject: ex?.subject || p.subject, total_marks: ex?.total_marks || 100 })); }}><option value="">Select Exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title} – {e.class_section}</option>)}</TS></FM>
              <FM label="Student" req><TS value={gradeForm.student_roll} onChange={e => setGradeForm((p: any) => ({ ...p, student_roll: e.target.value }))}><option value="">Select Student</option>{students.map(s => <option key={s.roll_no} value={s.roll_no}>#{s.roll_no} – {s.full_name}</option>)}</TS></FM>
              <FM label="Subject"><TI placeholder="Subject" value={gradeForm.subject} onChange={e => setGradeForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Score Obtained" req><TI type="number" placeholder="e.g. 78" value={gradeForm.score} onChange={e => setGradeForm((p: any) => ({ ...p, score: e.target.value }))}/></FM>
                <FM label="Total Marks"><TI type="number" value={gradeForm.total_marks} onChange={e => setGradeForm((p: any) => ({ ...p, total_marks: e.target.value }))}/></FM>
              </div>
              {gradeForm.score && gradeForm.total_marks && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <p className="text-sm font-black text-indigo-800">
                    Grade: <span className="text-lg">{getGradeLetter(Number(gradeForm.score), Number(gradeForm.total_marks))}</span>
                    {' '}· {((Number(gradeForm.score)/Number(gradeForm.total_marks))*100).toFixed(1)}%
                  </p>
                </div>
              )}
              <FM label="Remarks"><TI placeholder="Optional remarks…" value={gradeForm.remarks} onChange={e => setGradeForm((p: any) => ({ ...p, remarks: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveGrade} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white flex items-center gap-2 shadow-xl
          ${toast.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.ok ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}
    </div>
  );
};