import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── TYPES ──────────────────────────────────────────────────────────────────

interface AdminData {
  id: string;
  full_name: string;
  role: string;
  username: string;
}

interface PortalProps {
  onLogout: () => void;
  adminData: AdminData;
}

interface NavItem {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
  subTabs?: string[];
}

// ── CONSTANTS ──────────────────────────────────────────────────────────────

const ACCENT = "#7C3AED"; // Purple
const BG_DARK = "#0f172a";
const SIDEBAR_BG = "#1e293b";
const GRADIENT = "from-purple-600 to-indigo-600";

// ── ICONS (INLINE SVG) ──────────────────────────────────────────────────────

const Icons = {
  Dashboard: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>),
  Students: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>),
  Finance: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>),
  HR: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  Academics: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>),
  Study: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>),
  Lesson: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>),
  Exam: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Reports: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>),
  Comm: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Transport: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"/><line x1="7" y1="21" x2="7" y2="16"/><line x1="17" y1="21" x2="17" y2="16"/></svg>),
  Hostel: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21v-4a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4"/><circle cx="12" cy="7" r="4"/></svg>),
  Alumni: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>),
  Inventory: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>),
  Income: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  Expense: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>),
  Library: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>),
  FrontOffice: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  Settings: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Shield: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Menu: (c: string) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  Bell: (c: string) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  Search: (c: string) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  LogOut: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Cpu: (c: string) => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="1" y1="9" x2="4" y2="9"/></svg>),
  Calendar: (c: string) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)
};

const NAVIGATION: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'students', label: 'Students', icon: Icons.Students, subTabs: ['Details', 'Admission', 'Bulk Delete', 'House', 'Categories'] },
  { id: 'finance', label: 'Fee Collection', icon: Icons.Finance, subTabs: ['Collect', 'Search', 'Master', 'Group', 'Type', 'Discount'] },
  { id: 'hr', label: 'Human Resource', icon: Icons.HR, subTabs: ['Directory', 'Attendance', 'Payroll', 'Leaves', 'Designation'] },
  { id: 'academics', label: 'Academics', icon: Icons.Academics, subTabs: ['Timetable', 'Teachers', 'Subjects', 'Class', 'Sections'] },
  { id: 'study_material', label: 'Study Material', icon: Icons.Study, subTabs: ['Upload', 'Syllabus', 'Assignments'] },
  { id: 'lesson_plan', label: 'Lesson Plan', icon: Icons.Lesson, subTabs: ['Plan', 'Status', 'Topics'] },
  { id: 'exams', label: 'Exams', icon: Icons.Exam, subTabs: ['Group', 'Schedule', 'Results', 'Markssheet'] },
  { id: 'reports', label: 'Reports', icon: Icons.Reports, subTabs: ['Student', 'Finance', 'Attendance', 'Staff', 'Inventory'] },
  { id: 'communication', label: 'Communication', icon: Icons.Comm, subTabs: ['Notice Board', 'Email', 'SMS'] },
  { id: 'transport', label: 'Transport', icon: Icons.Transport, subTabs: ['Routes', 'Vehicles'] },
  { id: 'hostel', label: 'Hostel', icon: Icons.Hostel, subTabs: ['Rooms', 'Types'] },
  { id: 'alumni', label: 'Alumni', icon: Icons.Alumni, subTabs: ['Manage', 'Events'] },
  { id: 'inventory', label: 'Inventory', icon: Icons.Inventory, subTabs: ['Stock', 'Items', 'Category'] },
  { id: 'income', label: 'Income', icon: Icons.Income, subTabs: ['Add', 'Head'] },
  { id: 'expense', label: 'Expense', icon: Icons.Expense, subTabs: ['Add', 'Head'] },
  { id: 'library', label: 'Library', icon: Icons.Library, subTabs: ['Books', 'Issue'] },
  { id: 'front_office', label: 'Front Office', icon: Icons.FrontOffice, subTabs: ['Enquiry', 'Calls', 'Visitors'] },
  { id: 'settings', label: 'System Settings', icon: Icons.Settings, subTabs: ['General', 'Session', 'Notification', 'Email'] },
  { id: 'permissions', label: 'Permissions', icon: Icons.Shield }
];

export function DirectorPortal({ onLogout, adminData }: PortalProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const tab = NAVIGATION.find(n => n.id === activeTab);
    if (tab?.subTabs) setActiveSubTab(tab.subTabs[0]);
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      <motion.aside animate={{ width: isOpen ? 260 : 80 }} className="bg-[#1e293b] border-r border-slate-700 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill={ACCENT}/><path d="M12 12V28M12 12H20C22.2091 12 24 13.7909 24 16C24 18.2091 22.2091 20 20 20H12M28 28L22 20M22 20H28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {isOpen && <span className="font-bold text-xl tracking-tight">CAMPUS<span style={{ color: ACCENT }}>CORE</span></span>}
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {NAVIGATION.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? `bg-gradient-to-r ${GRADIENT} text-white` : 'hover:bg-slate-800 text-slate-400'}`}>
              {item.icon(activeTab === item.id ? '#fff' : '#94a3b8')}
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400">
            {Icons.LogOut('#ef4444')}
            {isOpen && <span className="text-sm font-medium">Exit Portal</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)}>{Icons.Menu('#94a3b8')}</button>
            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700 focus-within:border-purple-500 transition-colors">
              {Icons.Search('#475569')}
              <input type="text" placeholder="Global Search..." className="bg-transparent border-none focus:ring-0 text-sm w-64"/>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">{Icons.Bell('#94a3b8')}<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></div>
            <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{adminData.full_name}</p>
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{adminData.role}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${GRADIENT} flex items-center justify-center font-bold text-lg shadow-lg`}>{adminData.full_name.charAt(0)}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a] bg-[radial-gradient(circle_at_top_right,_#1e1b4b,_transparent_40%)]">
          {NAVIGATION.find(n => n.id === activeTab)?.subTabs && (
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
              {NAVIGATION.find(n => n.id === activeTab)?.subTabs?.map(tab => (
                <button key={tab} onClick={() => setActiveSubTab(tab)} className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeSubTab === tab ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={activeTab + activeSubTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' ? (
                <DashboardView stats={{ students: '1.25k', staff: '84', revenue: '₨45.2k', attendance: '94.2%' }} />
              ) : (
                <div className="bg-slate-800/40 border border-slate-700 rounded-[2.5rem] p-20 text-center shadow-3xl backdrop-blur-sm relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${GRADIENT} opacity-5 blur-[100px]`}></div>
                  {Icons.Cpu(ACCENT)}
                  <h2 className="text-4xl font-black mt-8 mb-3 uppercase tracking-tighter text-white">{activeTab.replace('_', ' ')}</h2>
                  <p className="text-slate-400 text-lg font-medium mb-10 max-w-lg mx-auto leading-relaxed">{activeSubTab ? `Authorized access to ${activeSubTab} management systems.` : 'Administrative console loading...'}</p>
                  <div className="flex justify-center items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function DashboardView({ stats }: { stats: any }) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Academic Reach', value: stats.students, icon: Icons.Students, color: 'from-blue-500 to-cyan-400' },
          { label: 'Workforce', value: stats.staff, icon: Icons.HR, color: 'from-purple-500 to-pink-400' },
          { label: 'Daily Liquidity', value: stats.revenue, icon: Icons.Finance, color: 'from-emerald-500 to-teal-400' },
          { label: 'Presence Rate', value: stats.attendance, icon: Icons.Calendar, color: 'from-orange-500 to-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-[#1e293b]/40 border border-slate-700 rounded-[2rem] p-8 hover:border-purple-500/50 transition-all shadow-2xl">
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`}></div>
            <div className="p-4 rounded-2xl bg-slate-900 w-fit mb-6 shadow-inner">{stat.icon('#fff')}</div>
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-4xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-[#1e293b]/40 border border-slate-700 rounded-[2.5rem] p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">Institutional Analytics</h2>
            <div className="p-2 bg-slate-900 rounded-lg">{Icons.Reports(ACCENT)}</div>
          </div>
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 bg-black/20 rounded-3xl border border-dashed border-slate-700">
            <div className="flex gap-1 mb-4 h-32 items-end">
              {[40, 70, 45, 90, 60, 80, 50].map((h, i) => <div key={i} className="w-4 bg-purple-500/40 rounded-t" style={{height: `${h}%`}}></div>)}
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-slate-600">Metric Projection Engine Active</p>
          </div>
        </div>

        <div className="bg-[#1e293b]/40 border border-slate-700 rounded-[2.5rem] p-10">
          <h2 className="text-2xl font-black mb-8 text-white tracking-tight">Directives</h2>
          <div className="space-y-4">
            {['Staff Recruitment', 'Financial Audit', 'Academic Review', 'System Security'].map((action, idx) => (
              <button key={idx} className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/20 hover:bg-slate-700 transition-all border border-slate-800">
                <span className="text-sm font-bold text-slate-300">{action}</span>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-purple-400">→</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
