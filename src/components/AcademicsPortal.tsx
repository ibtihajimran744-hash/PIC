import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface Props { onLogout: () => void; adminData: { id: string; full_name: string; role: string; username: string }; }

const ACCENT = '#0891B2'; // Cyan
const PROGRAMS = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];
type Tab = 'dashboard'|'scheme'|'teachers'|'students'|'announcements'|'messages'|'timetable'|'progress';

const TABS = [
  { id: 'dashboard',     label: 'Dashboard',       icon: '📊' },
  { id: 'scheme',        label: 'Scheme of Study',  icon: '📚' },
  { id: 'teachers',      label: 'Teacher Profiles', icon: '👩‍🏫' },
  { id: 'students',      label: 'Student Academics', icon: '🎓' },
  { id: 'progress',      label: 'Course Progress',  icon: '📈' },
  { id: 'timetable',     label: 'Timetable',        icon: '🗓' },
  { id: 'announcements', label: 'Announcements',    icon: '📢' },
  { id: 'messages',      label: 'Messages',         icon: '✉️' },
];

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

export const AcademicsPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  // Data
  const [schemes,       setSchemes]       = useState<any[]>([]);
  const [teachers,      setTeachers]      = useState<any[]>([]);
  const [teacherProfs,  setTeacherProfs]  = useState<any[]>([]);
  const [students,      setStudents]      = useState<any[]>([]);
  const [courseProgress,setCourseProgress]= useState<any[]>([]);
  const [timetable,     setTimetable]     = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages,      setMessages]      = useState<any[]>([]);
  const [grades,        setGrades]        = useState<any[]>([]);
  const [attendance,    setAttendance]    = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal,   setModal]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Forms
  const [schemeForm, setSchemeForm] = useState<any>({
    title: '', subject: '', program: 'ICS Physics', part: 1, class_section: '',
    week_no: '', month: '', topic: '', description: '', uploaded_by: '',
  });
  const [announceForm, setAnnounceForm] = useState<any>({
    title: '', body: '', target_type: 'all', target_value: '', priority: 'Normal', expires_at: '',
  });
  const [msgForm, setMsgForm] = useState<any>({
    to_teacher_username: '', subject: '', body: '',
  });
  const [schemeFilter, setSchemeFilter] = useState({ program: '', part: '', subject: '' });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sc }, { data: tc }, { data: tp }, { data: st }, { data: cp }, { data: tt }, { data: an }, { data: ms }, { data: gr }, { data: at }] = await Promise.all([
      supabase.from('scheme_of_study').select('*').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('full_name'),
      supabase.from('teacher_profiles').select('*').order('full_name'),
      supabase.from('students').select('roll_no,full_name,class_section,program,part,status,total_xp,current_badge,profile_xp').order('roll_no'),
      supabase.from('student_course_progress').select('*').order('last_updated', { ascending: false }),
      supabase.from('timetable').select('*').order('start_time').limit(200),
      supabase.from('academic_announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('teacher_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('grades').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('attendance').select('student_roll,status,date').order('date', { ascending: false }).limit(500),
    ]);
    setSchemes(sc || []); setTeachers(tc || []); setTeacherProfs(tp || []);
    setStudents(st || []); setCourseProgress(cp || []); setTimetable(tt || []);
    setAnnouncements(an || []); setMessages(ms || []); setGrades(gr || []); setAttendance(at || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Scheme upload ────────────────────────────────────────────
  const saveScheme = async () => {
    if (!schemeForm.title || !schemeForm.subject || !schemeForm.topic) {
      showToast('Title, subject and topic are required', false); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('scheme_of_study').insert([{
        ...schemeForm, part: Number(schemeForm.part), week_no: schemeForm.week_no ? Number(schemeForm.week_no) : null,
        uploaded_by: schemeForm.uploaded_by || adminData.full_name,
      }]);
      if (error) throw error;
      showToast('✅ Scheme of study entry uploaded');
      setSchemeForm({ title: '', subject: '', program: 'ICS Physics', part: 1, class_section: '', week_no: '', month: '', topic: '', description: '', uploaded_by: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  // ── Delete scheme entry ──────────────────────────────────────
  const deleteScheme = async (id: number) => {
    if (!window.confirm('Delete this scheme entry?')) return;
    await supabase.from('scheme_of_study').delete().eq('id', id);
    showToast('Entry deleted');
    loadAll();
  };

  // ── Send announcement ────────────────────────────────────────
  const sendAnnouncement = async () => {
    if (!announceForm.title || !announceForm.body) { showToast('Title and body required', false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('academic_announcements').insert([{
        ...announceForm, created_by: adminData.full_name,
        expires_at: announceForm.expires_at || null,
      }]);
      if (error) throw error;
      showToast('✅ Announcement published');
      setAnnounceForm({ title: '', body: '', target_type: 'all', target_value: '', priority: 'Normal', expires_at: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const deleteAnnouncement = async (id: number) => {
    await supabase.from('academic_announcements').delete().eq('id', id);
    showToast('Announcement deleted'); loadAll();
  };

  // ── Send message to teacher ──────────────────────────────────
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
      showToast('✅ Message sent to teacher');
      setMsgForm({ to_teacher_username: '', subject: '', body: '' });
      setModal(null); loadAll();
    } catch (e: any) { showToast(e.message, false); }
    finally { setSaving(false); }
  };

  const markMessageRead = async (id: number) => {
    await supabase.from('teacher_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    loadAll();
  };

  // ── Computed stats ───────────────────────────────────────────
  const totalSchemes     = schemes.length;
  const activeTeachers   = teachers.filter(t => t.status === 'Active').length;
  const totalStudents    = students.length;
  const unreadMessages   = messages.filter(m => !m.is_read && m.from_role !== adminData.role).length;

  // ── Student detail panel ─────────────────────────────────────
  const getStudentStats = (roll: number) => {
    const cp = courseProgress.filter(c => c.student_roll === roll);
    const sg = grades.filter(g => g.student_roll === roll);
    const sa = attendance.filter(a => a.student_roll === roll);
    const presentDays = sa.filter(a => a.status === 'Present').length;
    const totalDays = sa.length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    const avgScore = sg.length > 0 ? (sg.reduce((s, g) => s + (g.score || 0), 0) / sg.length).toFixed(1) : '—';
    return { cp, sg, attPct, avgScore, presentDays, totalDays };
  };

  // ── Filtered data ────────────────────────────────────────────
  const filteredSchemes = schemes.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.topic?.toLowerCase().includes(q) || s.subject?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q);
    const matchProg = !schemeFilter.program || s.program === schemeFilter.program;
    const matchSubj = !schemeFilter.subject || s.subject?.toLowerCase().includes(schemeFilter.subject.toLowerCase());
    return matchSearch && matchProg && matchSubj;
  });

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    return !search || String(s.roll_no).includes(q) || s.full_name?.toLowerCase().includes(q) || s.class_section?.toLowerCase().includes(q);
  });

  const filteredTeachers = teachers.filter(t => !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) || t.subject_dept?.toLowerCase().includes(search.toLowerCase()));

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const FM = ({ label, req, children }: any) => (
    <div>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
  const TI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 bg-white"/>
  );
  const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-cyan-400 bg-white">{children}</select>
  );
  const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...p} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-cyan-400 bg-white resize-none"/>
  );

  return (
    <div className="min-h-screen flex bg-slate-50" style={{ fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform shadow-lg
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 py-4 border-b border-slate-100" style={{ background: ACCENT }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📚</div>
            <div>
              <p className="font-black text-white text-sm">PIC CAMPUS</p>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Academics Portal</p>
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
            <button key={id} onClick={() => { setTab(id as Tab); setSideOpen(false); setSearch(''); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left
                ${tab === id ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              style={tab === id ? { background: ACCENT } : {}}>
              <span>{icon}</span><span>{label}</span>
              {id === 'messages' && unreadMessages > 0 && <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-cyan-50 rounded-xl p-2.5 text-center border border-cyan-100">
              <p className="text-lg font-black text-cyan-700">{totalSchemes}</p>
              <p className="text-[9px] font-black text-cyan-400 uppercase">Topics</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-lg font-black text-emerald-700">{activeTeachers}</p>
              <p className="text-[9px] font-black text-emerald-400 uppercase">Teachers</p>
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
              <p className="text-[10px] text-slate-400 font-medium">Academics Portal · PIC Gujranwala</p>
            </div>
          </div>
          <button onClick={loadAll} className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs">{loading ? '⏳' : '🔄'}</button>
        </header>

        <main className="flex-1 p-5 pb-10">

          {/* ════ DASHBOARD ════ */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Scheme Topics" value={totalSchemes} icon="📚" color={ACCENT} sub="Total uploaded topics"/>
                <StatCard label="Active Teachers" value={activeTeachers} icon="👩‍🏫" color="#059669" sub={`of ${teachers.length} total`}/>
                <StatCard label="Enrolled Students" value={totalStudents} icon="🎓" color="#7C3AED" sub="Across all programs"/>
                <StatCard label="Unread Messages" value={unreadMessages} icon="✉️" color="#e67e22" sub="From teachers"/>
              </div>

              {/* Programs breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="font-black text-slate-800 mb-4">Student Distribution by Program</h2>
                <div className="space-y-3">
                  {PROGRAMS.map(prog => {
                    const count = students.filter(s => s.program === prog).length;
                    const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                    return (
                      <div key={prog}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-600">{prog}</span>
                          <span className="text-xs font-black text-cyan-600">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT, transition: 'width 0.8s ease' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions + recent scheme uploads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="font-black text-slate-800 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label:'Upload Scheme', icon:'📚', action:()=>{ setTab('scheme'); setModal('scheme'); } },
                      { label:'Announcement', icon:'📢', action:()=>{ setTab('announcements'); setModal('announce'); } },
                      { label:'Message Teacher', icon:'✉️', action:()=>{ setTab('messages'); setModal('msg'); } },
                      { label:'View Progress', icon:'📈', action:()=>setTab('progress') },
                    ].map(({ label, icon, action }) => (
                      <button key={label} onClick={action}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-slate-600 hover:text-cyan-700">
                        <span className="text-2xl">{icon}</span>
                        <span className="text-xs font-black">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-black text-slate-800">Recent Scheme Uploads</h2>
                    <button onClick={() => setTab('scheme')} className="text-xs font-bold text-cyan-600">View All →</button>
                  </div>
                  {schemes.slice(0, 6).map((s, i) => (
                    <div key={s.id} className="px-5 py-3 flex items-start justify-between border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.topic}</p>
                        <p className="text-xs text-slate-400">{s.subject} · {s.program} Pt {s.part}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{s.week_no ? `Wk ${s.week_no}` : s.month || '—'}</span>
                    </div>
                  ))}
                  {!schemes.length && <p className="p-5 text-center text-slate-400 text-sm">No scheme uploads yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ════ SCHEME OF STUDY ════ */}
          {tab === 'scheme' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic or subject…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400 bg-white"/>
                <TS value={schemeFilter.program} onChange={e => setSchemeFilter(p => ({ ...p, program: e.target.value }))}>
                  <option value="">All Programs</option>{PROGRAMS.map(p => <option key={p}>{p}</option>)}
                </TS>
                <button onClick={() => setModal('scheme')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white whitespace-nowrap"
                  style={{ background: ACCENT }}>
                  ➕ Upload Topic
                </button>
              </div>

              {/* Group by program → subject */}
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
                  <div key={prog} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between" style={{ background: `${ACCENT}11` }}>
                      <h3 className="font-black text-slate-800">{prog}</h3>
                      <span className="text-xs text-slate-400">{Object.values(subjects).flat().length} topics</span>
                    </div>
                    {Object.entries(subjects).map(([subj, items]) => (
                      <div key={subj} className="border-b border-slate-50 last:border-0">
                        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">📖 {subj}</p>
                        </div>
                        {items.map((s) => (
                          <div key={s.id} className="px-5 py-3 flex items-start justify-between hover:bg-slate-50/50 border-b border-slate-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800">{s.topic}</p>
                              {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {s.week_no && <Badge c="bg-cyan-50 text-cyan-700 border-cyan-200" label={`Week ${s.week_no}`}/>}
                                {s.month && <Badge c="bg-blue-50 text-blue-700 border-blue-200" label={s.month}/>}
                                {s.class_section && <Badge c="bg-slate-100 text-slate-600 border-slate-200" label={s.class_section}/>}
                                <span className="text-[10px] text-slate-400">by {s.uploaded_by}</span>
                              </div>
                            </div>
                            <button onClick={() => deleteScheme(s.id)} className="ml-4 text-rose-400 hover:text-rose-600 text-xs flex-shrink-0 mt-1">🗑</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ));
              })()}
              {!filteredSchemes.length && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No scheme entries. <button className="text-cyan-600 font-bold" onClick={() => setModal('scheme')}>Upload the first topic →</button>
                </div>
              )}
            </div>
          )}

          {/* ════ TEACHER PROFILES ════ */}
          {tab === 'teachers' && (
            <div className="space-y-4">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subject…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400 bg-white"/>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((t) => {
                  const tp = teacherProfs.find(p => p.username === t.username);
                  const timetableEntries = timetable.filter(tt => tt.teacher_id === t.id);
                  const uniqueClasses = [...new Set(timetableEntries.map(tt => tt.class_section))];
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:border-cyan-200 transition-all"
                      onClick={() => setSelectedTeacher(selectedTeacher?.id === t.id ? null : t)}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                          style={{ background: `hsl(${(t.full_name?.charCodeAt(0)||50)*37%360},60%,50%)` }}>
                          {t.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{t.full_name}</p>
                          <p className="text-xs text-slate-400">{t.designation || 'Teacher'}</p>
                          <Badge c={t.status==='Active'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-slate-100 text-slate-500 border-slate-200'} label={t.status || 'Active'}/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>📚</span><span>{t.subject_dept || '—'}</span>
                        </div>
                        {t.phone_no && <div className="flex items-center gap-2 text-xs text-slate-600"><span>📞</span><span>{t.phone_no}</span></div>}
                        {t.experience && <div className="flex items-center gap-2 text-xs text-slate-600"><span>⏱</span><span>{t.experience}</span></div>}
                        {uniqueClasses.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Classes Teaching</p>
                            <div className="flex flex-wrap gap-1">
                              {uniqueClasses.slice(0, 4).map(c => <Badge key={c} c="bg-cyan-50 text-cyan-700 border-cyan-200" label={c}/>)}
                              {uniqueClasses.length > 4 && <span className="text-[10px] text-slate-400">+{uniqueClasses.length - 4} more</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Expanded detail */}
                      {selectedTeacher?.id === t.id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Timetable (today's subjects)</p>
                          {timetableEntries.length === 0 ? (
                            <p className="text-xs text-slate-400">No timetable entries</p>
                          ) : (
                            timetableEntries.slice(0, 6).map((tt, i) => (
                              <div key={i} className="text-xs flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5">
                                <span className="font-bold text-slate-700">{tt.subject}</span>
                                <span className="text-slate-400">{tt.class_section} · {tt.day_of_week}</span>
                              </div>
                            ))
                          )}
                          <button onClick={e => { e.stopPropagation(); setMsgForm(p => ({ ...p, to_teacher_username: t.username || '' })); setModal('msg'); }}
                            className="w-full mt-2 py-2 rounded-xl text-xs font-black text-white" style={{ background: ACCENT }}>
                            ✉️ Send Message
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!filteredTeachers.length && <p className="text-center py-12 text-slate-400 text-sm">No teachers found</p>}
            </div>
          )}

          {/* ════ STUDENT ACADEMICS ════ */}
          {tab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by roll no, name or class…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400 bg-white"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.slice(0, 40).map((s) => {
                  const stats = getStudentStats(s.roll_no);
                  const isSelected = selectedStudent?.roll_no === s.roll_no;
                  return (
                    <div key={s.roll_no}
                      className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all ${isSelected ? 'border-cyan-300 shadow-md' : 'border-slate-100 hover:border-cyan-200'}`}
                      onClick={() => setSelectedStudent(isSelected ? null : s)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
                          style={{ background: `hsl(${(s.roll_no%36)*10},65%,55%)` }}>
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

                      {/* Quick stats row */}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { label: 'Attendance', v: `${stats.attPct}%`, c: stats.attPct >= 75 ? '#27ae60' : '#c0392b' },
                          { label: 'Avg Score', v: `${stats.avgScore}`, c: '#0891b2' },
                          { label: 'Courses', v: stats.cp.length, c: '#7C3AED' },
                        ].map(({ label, v, c }) => (
                          <div key={label} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-black">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-slate-400">Program:</span> <strong className="text-slate-700">{s.program} Pt {s.part}</strong></div>
                            <div><span className="text-slate-400">Status:</span> <strong className="text-slate-700">{s.status}</strong></div>
                            <div><span className="text-slate-400">Present Days:</span> <strong className="text-slate-700">{stats.presentDays}/{stats.totalDays}</strong></div>
                            <div><span className="text-slate-400">Exams Taken:</span> <strong className="text-slate-700">{stats.sg.length}</strong></div>
                          </div>

                          {/* Course progress bars */}
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
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Recent grades */}
                          {stats.sg.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Recent Grades</p>
                              <div className="space-y-1">
                                {stats.sg.slice(0, 4).map((g) => (
                                  <div key={g.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5 text-xs">
                                    <span className="text-slate-700 truncate">{g.subject}</span>
                                    <div className="flex items-center gap-2 ml-2">
                                      <span className="text-slate-500">{g.score}/{g.total_marks}</span>
                                      <span className={`font-black ${g.grade_letter==='A+'||g.grade_letter==='A'?'text-emerald-600':g.grade_letter==='F'?'text-rose-600':'text-blue-600'}`}>{g.grade_letter}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!filteredStudents.length && <p className="text-center py-12 text-slate-400 text-sm">No students found</p>}
            </div>
          )}

          {/* ════ COURSE PROGRESS ════ */}
          {tab === 'progress' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or class…"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400 bg-white"/>
                <TS value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="">All Programs</option>{PROGRAMS.map(p => <option key={p}>{p}</option>)}
                </TS>
              </div>

              {/* Summary by subject */}
              {(() => {
                const bySubject: Record<string, any[]> = {};
                courseProgress.filter(cp => !filter || cp.program === filter).forEach(cp => {
                  if (!bySubject[cp.subject]) bySubject[cp.subject] = [];
                  bySubject[cp.subject].push(cp);
                });
                return Object.entries(bySubject).filter(([subj]) => !search || subj.toLowerCase().includes(search.toLowerCase())).map(([subj, items]) => {
                  const avgPct = items.length > 0 ? Math.round(items.reduce((s, c) => s + (c.topics_total > 0 ? (c.topics_done / c.topics_total) * 100 : 0), 0) / items.length) : 0;
                  const totalTopics = items[0]?.topics_total || 0;
                  const avgDone = items.length > 0 ? Math.round(items.reduce((s, c) => s + c.topics_done, 0) / items.length) : 0;
                  return (
                    <div key={subj} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-black text-slate-900">{subj}</h3>
                          <p className="text-xs text-slate-400">{items.length} students · Avg {avgDone}/{totalTopics} topics</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black" style={{ color: ACCENT }}>{avgPct}%</p>
                          <p className="text-[10px] text-slate-400">Class Average</p>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: ACCENT, transition: 'width 0.8s ease' }}/>
                      </div>
                      {/* Per-student mini breakdown */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {items.slice(0, 10).map((cp) => {
                          const st = students.find(s => s.roll_no === cp.student_roll);
                          const pct = cp.topics_total > 0 ? Math.round((cp.topics_done / cp.topics_total) * 100) : 0;
                          return (
                            <div key={cp.id} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                              <p className="text-xs font-black" style={{ color: pct >= 70 ? '#27ae60' : pct >= 40 ? ACCENT : '#c0392b' }}>{pct}%</p>
                              <p className="text-[9px] text-slate-500 truncate">{st?.full_name?.split(' ')[0] || `#${cp.student_roll}`}</p>
                            </div>
                          );
                        })}
                        {items.length > 10 && <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center text-[10px] text-slate-400 border border-slate-100">+{items.length - 10}</div>}
                      </div>
                    </div>
                  );
                });
              })()}
              {courseProgress.length === 0 && <p className="text-center py-12 text-slate-400 text-sm">No course progress data yet</p>}
            </div>
          )}

          {/* ════ TIMETABLE ════ */}
          {tab === 'timetable' && (
            <div className="space-y-4">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by class, subject or teacher…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400 bg-white"/>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => {
                const dayEntries = timetable.filter(tt => tt.day_of_week === day && (!search || tt.class_section?.toLowerCase().includes(search.toLowerCase()) || tt.subject?.toLowerCase().includes(search.toLowerCase())));
                if (!dayEntries.length) return null;
                return (
                  <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3" style={{ background: `${ACCENT}11` }}>
                      <h3 className="font-black text-slate-800">{day}</h3>
                      <span className="text-xs text-slate-400">{dayEntries.length} periods</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {['Time','Class','Subject','Teacher','Room','Campus'].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dayEntries.sort((a, b) => (a.start_time > b.start_time ? 1 : -1)).map((tt) => {
                            const teacher = teachers.find(t => t.id === tt.teacher_id);
                            return (
                              <tr key={tt.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-bold text-slate-700 whitespace-nowrap">{tt.start_time?.slice(0,5)} – {tt.end_time?.slice(0,5)}</td>
                                <td className="px-4 py-2 font-black text-cyan-700">{tt.class_section}</td>
                                <td className="px-4 py-2 font-medium text-slate-800">{tt.subject}</td>
                                <td className="px-4 py-2 text-xs text-slate-500">{teacher?.full_name || '—'}</td>
                                <td className="px-4 py-2 text-xs text-slate-500">{tt.room || '—'}</td>
                                <td className="px-4 py-2 text-xs text-slate-400">{tt.campus || '—'}</td>
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
            </div>
          )}

          {/* ════ ANNOUNCEMENTS ════ */}
          {tab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('announce')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  📢 New Announcement
                </button>
              </div>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900">{a.title}</h3>
                          <Badge c={a.priority==='High'?'bg-rose-50 text-rose-700 border-rose-200':a.priority==='Low'?'bg-slate-100 text-slate-500 border-slate-200':'bg-blue-50 text-blue-700 border-blue-200'} label={a.priority}/>
                          <Badge c="bg-cyan-50 text-cyan-700 border-cyan-200" label={a.target_type === 'all' ? 'Everyone' : a.target_type}/>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{a.body}</p>
                        <p className="text-[10px] text-slate-400 mt-2">by {a.created_by} · {new Date(a.created_at).toLocaleDateString('en-PK')}</p>
                        {a.expires_at && <p className="text-[10px] text-amber-500 mt-0.5">Expires: {new Date(a.expires_at).toLocaleDateString('en-PK')}</p>}
                      </div>
                      <button onClick={() => deleteAnnouncement(a.id)} className="text-rose-400 hover:text-rose-600 text-xs flex-shrink-0">🗑</button>
                    </div>
                  </div>
                ))}
                {!announcements.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No announcements yet. <button className="text-cyan-600 font-bold" onClick={() => setModal('announce')}>Create one →</button></div>
                )}
              </div>
            </div>
          )}

          {/* ════ MESSAGES ════ */}
          {tab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('msg')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: ACCENT }}>
                  ✉️ New Message
                </button>
              </div>
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!m.is_read ? 'border-cyan-200 bg-cyan-50/30' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {!m.is_read && <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0"/>}
                          <p className="font-black text-slate-900">{m.subject}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">From: <strong className="text-slate-600">{m.from_user}</strong> ({m.from_role})</span>
                          <span className="text-xs text-slate-300">→</span>
                          <span className="text-xs text-slate-400">To: <strong className="text-slate-600">{m.to_teacher_username}</strong></span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{m.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString('en-PK')}</p>
                      </div>
                      {!m.is_read && m.from_role !== adminData.role && (
                        <button onClick={() => markMessageRead(m.id)} className="text-xs font-black text-cyan-600 hover:underline flex-shrink-0">Mark read</button>
                      )}
                    </div>
                  </div>
                ))}
                {!messages.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No messages yet. <button className="text-cyan-600 font-bold" onClick={() => setModal('msg')}>Send one →</button></div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Scheme Upload Modal */}
      {modal === 'scheme' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-black text-slate-900">📚 Upload Scheme Entry</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <FM label="Scheme Title" req><TI placeholder="e.g. Annual Scheme of Study 2026" value={schemeForm.title} onChange={e => setSchemeForm((p: any) => ({ ...p, title: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Subject" req><TI placeholder="e.g. Physics" value={schemeForm.subject} onChange={e => setSchemeForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
                <FM label="Class Section"><TI placeholder="e.g. ICS-Phy-A-B" value={schemeForm.class_section} onChange={e => setSchemeForm((p: any) => ({ ...p, class_section: e.target.value }))}/></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Program" req><TS value={schemeForm.program} onChange={e => setSchemeForm((p: any) => ({ ...p, program: e.target.value }))}>{PROGRAMS.map(p => <option key={p}>{p}</option>)}</TS></FM>
                <FM label="Part"><TS value={schemeForm.part} onChange={e => setSchemeForm((p: any) => ({ ...p, part: e.target.value }))}><option value={1}>Part 1</option><option value={2}>Part 2</option></TS></FM>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Week No."><TI type="number" placeholder="e.g. 3" value={schemeForm.week_no} onChange={e => setSchemeForm((p: any) => ({ ...p, week_no: e.target.value }))}/></FM>
                <FM label="Month"><TS value={schemeForm.month} onChange={e => setSchemeForm((p: any) => ({ ...p, month: e.target.value }))}><option value="">Select Month</option>{MONTHS.map(m => <option key={m}>{m}</option>)}</TS></FM>
              </div>
              <FM label="Topic / Unit" req><TI placeholder="e.g. Chapter 3: Forces and Motion" value={schemeForm.topic} onChange={e => setSchemeForm((p: any) => ({ ...p, topic: e.target.value }))}/></FM>
              <FM label="Description"><TA rows={3} placeholder="Detailed description of what will be covered…" value={schemeForm.description} onChange={e => setSchemeForm((p: any) => ({ ...p, description: e.target.value }))}/></FM>
              <FM label="Uploaded By"><TI placeholder="Teacher name (defaults to your name)" value={schemeForm.uploaded_by} onChange={e => setSchemeForm((p: any) => ({ ...p, uploaded_by: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={saveScheme} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Saving…' : '✅ Upload Topic'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {modal === 'announce' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">📢 New Announcement</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="Title" req><TI placeholder="Announcement title…" value={announceForm.title} onChange={e => setAnnounceForm((p: any) => ({ ...p, title: e.target.value }))}/></FM>
              <FM label="Message" req><TA rows={4} placeholder="Announcement content…" value={announceForm.body} onChange={e => setAnnounceForm((p: any) => ({ ...p, body: e.target.value }))}/></FM>
              <div className="grid grid-cols-2 gap-4">
                <FM label="Target"><TS value={announceForm.target_type} onChange={e => setAnnounceForm((p: any) => ({ ...p, target_type: e.target.value }))}>
                  <option value="all">All</option><option value="teachers">Teachers Only</option><option value="class">Specific Class</option><option value="program">Specific Program</option>
                </TS></FM>
                <FM label="Priority"><TS value={announceForm.priority} onChange={e => setAnnounceForm((p: any) => ({ ...p, priority: e.target.value }))}><option>Normal</option><option>High</option><option>Low</option></TS></FM>
              </div>
              {(announceForm.target_type === 'class' || announceForm.target_type === 'program') && (
                <FM label={announceForm.target_type === 'class' ? 'Class Section' : 'Program'}><TI placeholder={announceForm.target_type === 'class' ? 'e.g. ICS-Phy-A-B' : 'e.g. ICS Physics'} value={announceForm.target_value} onChange={e => setAnnounceForm((p: any) => ({ ...p, target_value: e.target.value }))}/></FM>
              )}
              <FM label="Expiry Date (optional)"><TI type="date" value={announceForm.expires_at} onChange={e => setAnnounceForm((p: any) => ({ ...p, expires_at: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={sendAnnouncement} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Publishing…' : '📢 Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {modal === 'msg' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModal(null)}/>
          <div className="relative bg-white rounded-3xl w-full max-w-lg z-10 shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: ACCENT }}/>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">✉️ Message Teacher</h3>
              <button onClick={() => setModal(null)} className="text-2xl text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <FM label="To Teacher" req>
                <TS value={msgForm.to_teacher_username} onChange={e => setMsgForm((p: any) => ({ ...p, to_teacher_username: e.target.value }))}>
                  <option value="">Select Teacher</option>
                  {teachers.filter(t => t.username).map(t => <option key={t.id} value={t.username}>{t.full_name} ({t.subject_dept})</option>)}
                </TS>
              </FM>
              <FM label="Subject" req><TI placeholder="Message subject…" value={msgForm.subject} onChange={e => setMsgForm((p: any) => ({ ...p, subject: e.target.value }))}/></FM>
              <FM label="Message" req><TA rows={5} placeholder="Type your message…" value={msgForm.body} onChange={e => setMsgForm((p: any) => ({ ...p, body: e.target.value }))}/></FM>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-black text-slate-600 bg-slate-100">Cancel</button>
              <button disabled={saving} onClick={sendMessage} className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
                {saving ? 'Sending…' : '✉️ Send Message'}
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