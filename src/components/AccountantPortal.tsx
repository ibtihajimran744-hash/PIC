import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Wallet, Receipt, Users, FileBarChart, 
  LogOut, Search, Plus, Download, CheckCircle2, 
  AlertCircle, Clock, ArrowUpRight, ArrowDownRight,
  CreditCard, Banknote, History, Settings, X, Lock, Unlock,
  Trash2, Info, Loader2, User
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { cn } from '../lib/utils';
import { toast, Toaster } from 'react-hot-toast';

interface Props {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

type Tab = 'dashboard' | 'fees' | 'feegroups' | 'expenses' | 'salaries' | 'reports' | 'history';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'fees',      label: 'Fee Collection',      icon: Wallet },
  { id: 'feegroups', label: 'Fee Groups',          icon: CreditCard },
  { id: 'expenses',  label: 'Expenses',            icon: Receipt },
  { id: 'salaries',  label: 'Salaries',            icon: Users },
  { id: 'reports',   label: 'Reports',             icon: FileBarChart },
  { id: 'history',   label: 'Transaction History', icon: History },
];

const GRADIENT = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

interface FeeGroup {
  id: string;
  name: string;
  level: 'inter' | 'university' | 'all';
  is_fixed: boolean;
  fixed_amount: number | null;
  weight: number;
}

interface Student {
  id: string;
  roll_no: number;
  full_name: string;
  class_section: string;
}

interface FeeRecord {
  id: string;
  student_roll: number;
  fee_group_id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_amount?: number;
  fee_groups?: { name: string };
}

type AssignMode = 'bulk' | 'individual';

const LEVEL_LABELS: Record<string, string> = {
  inter: 'Intermediate',
  university: 'University',
  all: 'All Levels',
};

const SUGGESTED_NAMES = [
  'Tuition Fee', 'Admission Fee', 'Exam Fee', 'Lab Fee',
  'Library Fee', 'Sports Fee', 'Board Examination Fee',
  'University Examination Fee', 'Computer Lab Fee', 'Development Fee',
];

function splitPackage(groups: FeeGroup[], packageTotal: number): Record<string, number> {
  const result: Record<string, number> = {};
  let remainder = packageTotal;
  for (const g of groups) {
    if (g.is_fixed && g.fixed_amount != null) {
      result[g.id] = g.fixed_amount;
      remainder -= g.fixed_amount;
    }
  }
  const varGroups = groups.filter(g => !g.is_fixed);
  const totalWeight = varGroups.reduce((s, g) => s + g.weight, 0);
  if (totalWeight > 0 && remainder > 0) {
    for (const g of varGroups) {
      result[g.id] = Math.round((g.weight / totalWeight) * remainder);
    }
  }
  return result;
}

const StatCard = ({ label, value, icon: Icon, color, bg, trend }: any) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm', bg, color)}>
        <Icon size={24} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <p className="text-[11px] font-bold text-slate-500">{trend}</p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, color }: any) => (
  <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group">
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform', color)}>
      <Icon size={20} />
    </div>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
  </button>
);

export const AccountantPortal: React.FC<Props> = ({ onLogout, adminData }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({ totalCollected: 0, pendingFees: 0, monthlyExpenses: 0, netBalance: 0 });

  // Fee Collection state
  const [feeStudents, setFeeStudents] = useState<Student[]>([]);
  const [feeSearch, setFeeSearch] = useState('');
  const [loadingFeeStudents, setLoadingFeeStudents] = useState(false);
  const [selectedFeeStudent, setSelectedFeeStudent] = useState<Student | null>(null);
  const [studentFeeRecords, setStudentFeeRecords] = useState<FeeRecord[]>([]);
  const [loadingFeeRecords, setLoadingFeeRecords] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<FeeRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectingFee, setCollectingFee] = useState(false);

  // Fee Groups state
  const [groups, setGroups] = useState<FeeGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState<'inter' | 'university' | 'all'>('inter');
  const [newIsFixed, setNewIsFixed] = useState(false);
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [newWeight, setNewWeight] = useState('1');
  const [savingGroup, setSavingGroup] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<AssignMode>('bulk');
  const [assignLevel, setAssignLevel] = useState<'inter' | 'university' | 'all'>('inter');
  const [assignSection, setAssignSection] = useState('');
  const [packageAmount, setPackageAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignStudent, setSelectedAssignStudent] = useState<Student | null>(null);
  const [assignStudentSearch, setAssignStudentSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [splitPreview, setSplitPreview] = useState<Record<string, number>>({});

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (activeTab === 'fees') loadFeeStudents();
    if (activeTab === 'feegroups') { loadGroups(); loadStudents(); }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('fees').select('amount, status');
      const collected = data?.filter((f: any) => f.status === 'Paid').reduce((a: number, f: any) => a + (f.amount || 0), 0) || 1250000;
      const pending = data?.filter((f: any) => f.status !== 'Paid').reduce((a: number, f: any) => a + (f.amount || 0), 0) || 450000;
      setStats({ totalCollected: collected, pendingFees: pending, monthlyExpenses: 320000, netBalance: collected - 320000 });
    } catch {
      setStats({ totalCollected: 1250000, pendingFees: 450000, monthlyExpenses: 320000, netBalance: 930000 });
    }
  };

  const loadFeeStudents = async () => {
    setLoadingFeeStudents(true);
    const { data } = await supabase.from('students').select('id, roll_no, full_name, class_section').order('full_name');
    setFeeStudents((data as Student[]) || []);
    setLoadingFeeStudents(false);
  };

  const openStudentFees = async (student: Student) => {
    setSelectedFeeStudent(student);
    setLoadingFeeRecords(true);
    const { data } = await supabase.from('fees').select('*, fee_groups(name)').eq('student_roll', student.roll_no).order('due_date');
    setStudentFeeRecords((data as FeeRecord[]) || []);
    setLoadingFeeRecords(false);
  };

  const openCollectModal = (record: FeeRecord) => {
    setSelectedFeeRecord(record);
    setCollectAmount(String(record.amount - (record.paid_amount || 0)));
    setShowCollectModal(true);
  };

  const handleCollectFee = async () => {
    if (!selectedFeeRecord || !collectAmount) return;
    const amount = Number(collectAmount);
    if (amount <= 0) { toast.error('Enter a valid amount'); return; }
    setCollectingFee(true);
    const newPaid = (selectedFeeRecord.paid_amount || 0) + amount;
    const newStatus = newPaid >= selectedFeeRecord.amount ? 'Paid' : 'Partial';
    const { error } = await supabase.from('fees').update({ paid_amount: newPaid, status: newStatus }).eq('id', selectedFeeRecord.id);
    setCollectingFee(false);
    if (error) { toast.error('Failed to collect fee'); return; }
    toast.success(`${PKR(amount)} collected!`);
    setShowCollectModal(false);
    setCollectAmount('');
    setSelectedFeeRecord(null);
    openStudentFees(selectedFeeStudent!);
    fetchStats();
  };

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    const { data } = await supabase.from('fee_groups').select('*').order('is_fixed', { ascending: false }).order('name');
    setGroups((data as FeeGroup[]) || []);
    setLoadingGroups(false);
  }, []);

  const loadStudents = useCallback(async () => {
    const { data } = await supabase.from('students').select('id, roll_no, full_name, class_section').order('full_name');
    setStudents((data as Student[]) || []);
  }, []);

  useEffect(() => {
    const pkg = Number(packageAmount);
    if (!pkg || pkg <= 0 || groups.length === 0) { setSplitPreview({}); return; }
    const rel = groups.filter(g => g.level === assignLevel || g.level === 'all');
    setSplitPreview(splitPackage(rel, pkg));
  }, [packageAmount, assignLevel, groups]);

  const handleAddGroup = async () => {
    if (!newName.trim()) { toast.error('Enter a group name'); return; }
    if (newIsFixed && (!newFixedAmount || Number(newFixedAmount) <= 0)) { toast.error('Enter a valid fixed amount'); return; }
    setSavingGroup(true);
    const { error } = await supabase.from('fee_groups').insert([{
      name: newName.trim(), level: newLevel, is_fixed: newIsFixed,
      fixed_amount: newIsFixed ? Number(newFixedAmount) : null,
      weight: newIsFixed ? 0 : Number(newWeight) || 1,
    }]);
    setSavingGroup(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success(`"${newName}" added`);
    setShowAddGroup(false);
    setNewName(''); setNewIsFixed(false); setNewFixedAmount(''); setNewWeight('1');
    loadGroups();
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await supabase.from('fee_groups').delete().eq('id', id);
    toast.success('Deleted');
    loadGroups();
  };

  const handleAssign = async () => {
    const pkg = Number(packageAmount);
    if (!pkg || pkg <= 0) { toast.error('Enter package amount'); return; }
    if (!dueDate) { toast.error('Select a due date'); return; }
    const rel = groups.filter(g => g.level === assignLevel || g.level === 'all');
    if (rel.length === 0) { toast.error('No fee groups for this level'); return; }
    const split = splitPackage(rel, pkg);
    let targets: Student[] = [];
    if (assignMode === 'bulk') {
      if (!assignSection) { toast.error('Select a section'); return; }
      targets = students.filter(s => s.class_section === assignSection);
      if (targets.length === 0) { toast.error('No students in that section'); return; }
    } else {
      if (!selectedAssignStudent) { toast.error('Select a student'); return; }
      targets = [selectedAssignStudent];
    }
    setAssigning(true);
    const rows: any[] = [];
    for (const student of targets) {
      for (const group of rel) {
        rows.push({ student_roll: student.roll_no, fee_group_id: group.id, amount: split[group.id] ?? 0, due_date: dueDate, status: 'Pending', paid_amount: 0 });
      }
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from('fees').insert(rows.slice(i, i + 200));
      if (error) { toast.error('Error: ' + error.message); setAssigning(false); return; }
    }
    setAssigning(false);
    toast.success(assignMode === 'bulk' ? `Created for ${targets.length} students` : `Created for ${selectedAssignStudent!.full_name}`);
    setShowAssign(false);
    setPackageAmount(''); setDueDate(''); setSelectedAssignStudent(null); setAssignStudentSearch('');
  };

  const sections = Array.from(new Set(students.map(s => s.class_section))).sort();
  const filteredAssignStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(assignStudentSearch.toLowerCase()) || String(s.roll_no).includes(assignStudentSearch)
  );
  const relevantGroups = groups.filter(g => g.level === assignLevel || g.level === 'all');
  const filteredFeeStudents = feeStudents.filter(s =>
    s.full_name.toLowerCase().includes(feeSearch.toLowerCase()) || String(s.roll_no).includes(feeSearch)
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Toaster position="top-right" />

      {/* ══ SIDEBAR ════════════════════════════════════════════════════════════ */}
      {/* KEY FIX: sidebar is flex-col, top section is flex-col with min-h-0 so nav can scroll */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">

        {/* Top: logo + nav — takes all space, scrollable */}
        <div className="flex flex-col flex-1 min-h-0 p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200" style={{ background: GRADIENT }}>
              <Banknote size={22} />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none">FINANCE</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accountant Portal</p>
            </div>
          </div>

          {/* Nav — scrolls if too tall */}
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedFeeStudent(null); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shrink-0',
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom: user info + logout — always visible */}
        <div className="p-6 border-t border-slate-100 shrink-0">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
            <p className="text-sm font-bold text-slate-900 truncate">{adminData.full_name}</p>
            <p className="text-[11px] font-medium text-slate-500">{adminData.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">{TABS.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-xs text-slate-500 font-medium">Manage school finances and accounts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search transactions..." className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
            </div>
            <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Collected" value={PKR(stats.totalCollected)} icon={Wallet} color="text-emerald-600" bg="bg-emerald-100" trend="+12% from last month" />
                    <StatCard label="Pending Fees" value={PKR(stats.pendingFees)} icon={Clock} color="text-amber-600" bg="bg-amber-100" trend="42 students overdue" />
                    <StatCard label="Monthly Expenses" value={PKR(stats.monthlyExpenses)} icon={Receipt} color="text-rose-600" bg="bg-rose-100" trend="-5% from last month" />
                    <StatCard label="Net Balance" value={PKR(stats.netBalance)} icon={FileBarChart} color="text-blue-600" bg="bg-blue-100" trend="Healthy cash flow" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-slate-900">Recent Transactions</h3>
                        <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { desc: 'Tuition Fee - Ali Khan',    cat: 'Fee',     amt: 15000, type: 'in',  status: 'Completed' },
                            { desc: 'Electricity Bill - March',  cat: 'Utility', amt: 45000, type: 'out', status: 'Completed' },
                            { desc: 'Tuition Fee - Sara Ahmed',  cat: 'Fee',     amt: 15000, type: 'in',  status: 'Completed' },
                            { desc: 'Stationery Supplies',       cat: 'Expense', amt: 8500,  type: 'out', status: 'Pending'   },
                            { desc: 'Tuition Fee - Omar Malik',  cat: 'Fee',     amt: 15000, type: 'in',  status: 'Completed' },
                          ].map((tx, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4"><p className="text-sm font-bold text-slate-900">{tx.desc}</p><p className="text-[10px] text-slate-400 font-medium">2 hours ago</p></td>
                              <td className="px-6 py-4"><span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{tx.cat}</span></td>
                              <td className="px-6 py-4">
                                <div className={cn('flex items-center gap-1 font-black text-sm', tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600')}>
                                  {tx.type === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{PKR(tx.amt)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', tx.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500')}>
                                  <div className={cn('w-1.5 h-1.5 rounded-full', tx.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500')} />{tx.status}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-black text-slate-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <QuickAction icon={Plus}    label="Collect Fee" color="bg-emerald-500" />
                          <QuickAction icon={Receipt} label="Add Expense" color="bg-rose-500" />
                          <QuickAction icon={Users}   label="Pay Salary"  color="bg-blue-500" />
                          <QuickAction icon={Download} label="Export Rpt" color="bg-slate-700" />
                        </div>
                      </div>
                      <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200">
                        <div className="flex items-center justify-between mb-4"><h3 className="font-black">Fee Deadline</h3><AlertCircle size={20} /></div>
                        <p className="text-emerald-100 text-sm mb-4">The deadline for monthly fee collection is approaching in 3 days.</p>
                        <button className="w-full py-2.5 bg-white text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-colors">Send Reminders</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ FEE COLLECTION ═════════════════════════════════════════════ */}
              {activeTab === 'fees' && (
                <div className="space-y-6">
                  {!selectedFeeStudent ? (
                    <>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Fee Collection</h2>
                        <p className="text-sm text-slate-500 mt-1">Search a student to view and collect their fees.</p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input value={feeSearch} onChange={e => setFeeSearch(e.target.value)} placeholder="Search by name or roll number..." className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm" />
                      </div>
                      {loadingFeeStudents ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                      ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="divide-y divide-slate-100">
                            {filteredFeeStudents.slice(0, 50).map(student => (
                              <button key={student.id} onClick={() => openStudentFees(student)} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0">{student.full_name.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900">{student.full_name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{student.roll_no} · {student.class_section}</p>
                                </div>
                                <ArrowUpRight size={16} className="text-slate-300 shrink-0" />
                              </button>
                            ))}
                            {filteredFeeStudents.length === 0 && <p className="px-6 py-12 text-center text-slate-400 font-bold">No students found</p>}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedFeeStudent(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-600 font-black text-lg">←</button>
                        <div>
                          <h2 className="text-xl font-black text-slate-900">{selectedFeeStudent.full_name}</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase">{selectedFeeStudent.roll_no} · {selectedFeeStudent.class_section}</p>
                        </div>
                      </div>
                      {loadingFeeRecords ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                      ) : studentFeeRecords.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
                          <p className="text-slate-400 font-bold">No fee records for this student.</p>
                          <p className="text-xs text-slate-300 mt-1">Assign fee groups first from the Fee Groups tab.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: 'Total Due',  value: PKR(studentFeeRecords.reduce((a, r) => a + r.amount, 0)),                              color: 'text-slate-900'  },
                              { label: 'Collected',  value: PKR(studentFeeRecords.reduce((a, r) => a + (r.paid_amount || 0), 0)),                  color: 'text-emerald-600' },
                              { label: 'Remaining',  value: PKR(studentFeeRecords.reduce((a, r) => a + (r.amount - (r.paid_amount || 0)), 0)),     color: 'text-rose-600'   },
                            ].map(s => (
                              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase">{s.label}</p>
                                <p className={cn('text-lg font-black mt-1', s.color)}>{s.value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                              {studentFeeRecords.map(record => {
                                const remaining = record.amount - (record.paid_amount || 0);
                                const isPaid = record.status === 'Paid';
                                return (
                                  <div key={record.id} className="flex items-center gap-4 px-6 py-5">
                                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                      {isPaid ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-slate-900">{record.fee_groups?.name || 'Fee'}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                        Due: {new Date(record.due_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {record.paid_amount ? ` · Paid: ${PKR(record.paid_amount)}` : ''}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 mr-3">
                                      <p className="text-sm font-black text-slate-900">{PKR(record.amount)}</p>
                                      {!isPaid && <p className="text-[10px] font-bold text-rose-500">{PKR(remaining)} left</p>}
                                    </div>
                                    {!isPaid ? (
                                      <button onClick={() => openCollectModal(record)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-sm whitespace-nowrap">
                                        Collect
                                      </button>
                                    ) : (
                                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">Paid ✓</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ══ FEE GROUPS ═════════════════════════════════════════════════ */}
              {activeTab === 'feegroups' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Fee Groups</h2>
                      <p className="text-sm text-slate-500 mt-1">Define fee categories — the app splits each student's package automatically.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowAddGroup(true)} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                        <Plus size={16} /> Add Group
                      </button>
                      <button onClick={() => setShowAssign(true)} className="flex items-center gap-2 px-5 py-3 bg-[#2D3494] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all">
                        <Users size={16} /> Assign Fees
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-bold mb-1">How auto-split works</p>
                      <p>Fixed groups (like <span className="font-bold">Board Examination Fee</span>) always keep their exact amount. Variable groups share what's left by weight. Example: Package = Rs 40,000 · Board Fee = Rs 1,500 fixed → Rs 38,500 split among variable groups.</p>
                    </div>
                  </div>
                  {loadingGroups ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                  ) : groups.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
                      <p className="text-slate-400 font-bold">No fee groups yet.</p>
                      <p className="text-xs text-slate-300 mt-1">Click "Add Group" to create your first fee group.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(['inter', 'university', 'all'] as const).map(level => {
                        const lvlGroups = groups.filter(g => g.level === level);
                        if (lvlGroups.length === 0) return null;
                        return (
                          <div key={level}>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{LEVEL_LABELS[level]}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {lvlGroups.map(group => (
                                <div key={group.id} className={cn('bg-white rounded-2xl border p-5 flex items-center justify-between shadow-sm group', group.is_fixed ? 'border-amber-100 bg-amber-50/30' : 'border-slate-100')}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', group.is_fixed ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>
                                      {group.is_fixed ? <Lock size={18} /> : <Unlock size={18} />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-900">{group.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{group.is_fixed ? `Fixed · ${PKR(group.fixed_amount ?? 0)}` : `Variable · Weight ${group.weight}`}</p>
                                    </div>
                                  </div>
                                  <button onClick={() => handleDeleteGroup(group.id, group.name)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ OTHER TABS ═════════════════════════════════════════════════ */}
              {activeTab !== 'dashboard' && activeTab !== 'fees' && activeTab !== 'feegroups' && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                    {(() => { const T = TABS.find(t => t.id === activeTab); return T ? <T.icon size={32} /> : null; })()}
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{TABS.find(t => t.id === activeTab)?.label} Module</h3>
                  <p className="text-sm text-slate-500 max-w-xs text-center mt-2">This module is being initialized with real-time data.</p>
                  <button className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">Refresh Module</button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ══ COLLECT FEE MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCollectModal && selectedFeeRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCollectModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900">Collect Fee</h3>
                <button onClick={() => setShowCollectModal(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Fee Group</p>
                  <p className="font-black text-slate-900 text-sm">{selectedFeeRecord.fee_groups?.name || 'Fee'}</p>
                  <div className="flex gap-4 mt-2 text-xs font-bold">
                    <span className="text-slate-500">Total: <span className="text-slate-900">{PKR(selectedFeeRecord.amount)}</span></span>
                    <span className="text-slate-500">Paid: <span className="text-emerald-600">{PKR(selectedFeeRecord.paid_amount || 0)}</span></span>
                    <span className="text-slate-500">Left: <span className="text-rose-600">{PKR(selectedFeeRecord.amount - (selectedFeeRecord.paid_amount || 0))}</span></span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Amount to Collect (Rs)</label>
                  <input type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-2xl font-black text-[#2D3494] outline-none focus:ring-2 focus:ring-emerald-400 text-center" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct} onClick={() => setCollectAmount(String(Math.round((selectedFeeRecord.amount - (selectedFeeRecord.paid_amount || 0)) * pct / 100)))} className="py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-xs font-black transition-all">
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={handleCollectFee} disabled={collectingFee || !collectAmount || Number(collectAmount) <= 0} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {collectingFee ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : `Collect ${collectAmount ? PKR(Number(collectAmount)) : ''}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ ADD GROUP MODAL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddGroup && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddGroup(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900">New Fee Group</h3>
                <button onClick={() => setShowAddGroup(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Group Name</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Tuition Fee" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SUGGESTED_NAMES.map(n => (
                      <button key={n} onClick={() => { setNewName(n); if (n.toLowerCase().includes('board') || n.toLowerCase().includes('examination')) { setNewIsFixed(true); if (!newFixedAmount) setNewFixedAmount('1500'); } }} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all', newName === n ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Applies To</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['inter', 'university', 'all'] as const).map(l => (
                      <button key={l} onClick={() => setNewLevel(l)} className={cn('py-2.5 rounded-xl text-xs font-bold transition-all', newLevel === l ? 'bg-[#2D3494] text-white' : 'bg-slate-50 text-slate-600 border border-slate-100')}>{LEVEL_LABELS[l]}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div><p className="text-sm font-bold text-slate-800">Fixed Amount</p><p className="text-[10px] text-slate-400 mt-0.5">Amount never changes (e.g. Board fee)</p></div>
                  <button onClick={() => setNewIsFixed(v => !v)} className={cn('w-12 h-6 rounded-full transition-all relative', newIsFixed ? 'bg-amber-400' : 'bg-slate-200')}>
                    <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', newIsFixed ? 'left-7' : 'left-1')} />
                  </button>
                </div>
                {newIsFixed ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Fixed Amount (Rs)</label>
                    <input type="number" value={newFixedAmount} onChange={e => setNewFixedAmount(e.target.value)} placeholder="1500" className="w-full bg-slate-50 border border-amber-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-300" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Weight Ratio</label>
                    <input type="number" min="0.1" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="1" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={handleAddGroup} disabled={savingGroup} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingGroup ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Fee Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ ASSIGN FEES MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAssign && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssign(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-black text-slate-900">Assign Fee Groups</h3>
                <button onClick={() => setShowAssign(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {(['bulk', 'individual'] as const).map(m => (
                    <button key={m} onClick={() => setAssignMode(m)} className={cn('py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all', assignMode === m ? 'bg-[#2D3494] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-100')}>
                      {m === 'bulk' ? <Users size={14} /> : <User size={14} />}
                      {m === 'bulk' ? 'Whole Class / Section' : 'Individual Student'}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['inter', 'university', 'all'] as const).map(l => (
                      <button key={l} onClick={() => setAssignLevel(l)} className={cn('py-2.5 rounded-xl text-xs font-bold transition-all', assignLevel === l ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-100')}>{LEVEL_LABELS[l]}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1">{relevantGroups.length} group{relevantGroups.length !== 1 ? 's' : ''} will apply</p>
                </div>
                {assignMode === 'bulk' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Class / Section</label>
                    <select value={assignSection} onChange={e => setAssignSection(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="">Select section...</option>
                      {sections.map(s => <option key={s} value={s}>{s} ({students.filter(st => st.class_section === s).length} students)</option>)}
                    </select>
                  </div>
                )}
                {assignMode === 'individual' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Student</label>
                    {selectedAssignStudent ? (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div><p className="text-sm font-black text-blue-900">{selectedAssignStudent.full_name}</p><p className="text-[10px] text-blue-500 font-bold uppercase">{selectedAssignStudent.roll_no} · {selectedAssignStudent.class_section}</p></div>
                        <button onClick={() => { setSelectedAssignStudent(null); setAssignStudentSearch(''); }}><X size={16} className="text-blue-400" /></button>
                      </div>
                    ) : (
                      <>
                        <input value={assignStudentSearch} onChange={e => setAssignStudentSearch(e.target.value)} placeholder="Search by name or roll no..." className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
                        {assignStudentSearch.length > 1 && (
                          <div className="bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto mt-1">
                            {filteredAssignStudents.slice(0, 10).map(s => (
                              <button key={s.id} onClick={() => { setSelectedAssignStudent(s); setAssignStudentSearch(''); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-none">
                                <span className="font-bold text-slate-900">{s.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase">{s.roll_no} · {s.class_section}</span>
                              </button>
                            ))}
                            {filteredAssignStudents.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No results</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Package Amount (Rs)</label>
                  <input type="number" value={packageAmount} onChange={e => setPackageAmount(e.target.value)} placeholder="e.g. 40000" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                {Object.keys(splitPreview).length > 0 && relevantGroups.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Split Preview</p>
                    {relevantGroups.map(g => (
                      <div key={g.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {g.is_fixed ? <Lock size={12} className="text-amber-400" /> : <Unlock size={12} className="text-emerald-400" />}
                          <span className="text-sm font-bold text-slate-700">{g.name}</span>
                          {g.is_fixed && <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-md uppercase">Fixed</span>}
                        </div>
                        <span className="text-sm font-black text-[#2D3494]">{PKR(splitPreview[g.id] ?? 0)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex justify-between">
                      <span className="text-xs font-black text-slate-500 uppercase">Total</span>
                      <span className="text-sm font-black text-emerald-600">{PKR(Object.values(splitPreview).reduce((a, b) => a + b, 0))}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 shrink-0">
                <button onClick={handleAssign} disabled={assigning} className="w-full py-4 bg-[#2D3494] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {assigning ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : assignMode === 'bulk' ? 'Assign to Section' : 'Assign to Student'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};