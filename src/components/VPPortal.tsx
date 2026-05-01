import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, BarChart3, Bell, LogOut, Search, RefreshCw,
  CheckCircle, X, Lock, Unlock, Check, Settings, Calendar,
  DollarSign, Receipt, Tag, FileText, UserCheck, Loader2,
  ChevronDown, AlertTriangle, Eye, Printer, RefreshCcw,
  ToggleLeft, ToggleRight, UserPlus, Trash2, CreditCard,
  TrendingUp, Home, ClipboardList, Key, GraduationCap, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface VPPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

// ── Theme ─────────────────────────────────────────────────────────────────
const VP_ACCENT   = '#7C3AED';
const VP_GRADIENT = 'linear-gradient(135deg,#7C3AED,#6D28D9)';

// Director gets a richer crimson/dark theme
const DIR_ACCENT   = '#7c2d12';
const DIR_GRADIENT = 'linear-gradient(135deg,#7c2d12,#9a3412)';

const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

// All roles in the system — VP/Director can manage permissions for all of them
const ALL_ROLES = ['Principal','Accountant','Teacher','Coordinator','Examiner','Academics','Receptionist'];

// Default permission keys per role
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Principal:    { view_students: true,  edit_students: true,  approve_leave: true,  view_fees: false, edit_fees: false,  view_reports: true,  manage_staff: true,  view_timetable: true  },
  Accountant:   { view_students: true,  edit_students: false, approve_leave: false, view_fees: true,  edit_fees: true,   view_reports: true,  manage_staff: false, view_timetable: false },
  Teacher:      { view_students: true,  edit_students: false, approve_leave: false, view_fees: false, edit_fees: false,  view_reports: false, manage_staff: false, view_timetable: true  },
  Coordinator:  { view_students: true,  edit_students: true,  approve_leave: false, view_fees: false, edit_fees: false,  view_reports: true,  manage_staff: false, view_timetable: true  },
  Examiner:     { view_students: true,  edit_students: false, approve_leave: false, view_fees: false, edit_fees: false,  view_reports: true,  manage_staff: false, view_timetable: false },
  Academics:    { view_students: true,  edit_students: false, approve_leave: false, view_fees: false, edit_fees: false,  view_reports: true,  manage_staff: false, view_timetable: true  },
  Receptionist: { view_students: true,  edit_students: false, approve_leave: false, view_fees: false, edit_fees: false,  view_reports: false, manage_staff: false, view_timetable: false },
};

const PERMISSION_LABELS: Record<string, string> = {
  view_students:   'View Students',
  edit_students:   'Edit Students',
  approve_leave:   'Approve Leave',
  view_fees:       'View Fees',
  edit_fees:       'Collect Fees',
  view_reports:    'View Reports',
  manage_staff:    'Manage Staff',
  view_timetable:  'View Timetable',
};

const TABS_VP = [
  { id: 'dashboard',    label: 'Dashboard',    icon: Home },
  { id: 'permissions',  label: 'Permissions',  icon: Shield },
  { id: 'sessions',     label: 'Sessions',     icon: GraduationCap },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'staff',        label: 'Staff',        icon: Users },
  { id: 'leaves',       label: 'Leaves',       icon: Calendar },
  { id: 'reports',      label: 'Reports',      icon: BarChart3 },
];

const TABS_DIR = [
  { id: 'dashboard',    label: 'Dashboard',    icon: Home },
  { id: 'permissions',  label: 'Permissions',  icon: Shield },
  { id: 'sessions',     label: 'Sessions',     icon: GraduationCap },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'staff',        label: 'Staff',        icon: Users },
  { id: 'leaves',       label: 'Leaves',       icon: Calendar },
  { id: 'reports',      label: 'Reports',      icon: BarChart3 },
];

// ── Shared UI ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, alert }: any) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    className={cn('bg-white rounded-2xl p-4 border transition-all', alert ? 'border-rose-200' : 'border-slate-100')}
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={17} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

// ── Toggle Switch ─────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, accent }: { value: boolean; onChange: (v: boolean) => void; accent: string }) => (
  <button
    onClick={() => onChange(!value)}
    className={cn('w-11 h-6 rounded-full relative transition-all flex-shrink-0')}
    style={{ background: value ? accent : '#CBD5E1' }}>
    <motion.div
      animate={{ x: value ? 20 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
    />
  </button>
);

export default function VPPortal({ onLogout, adminData }: VPPortalProps) {
  const isDirector = adminData.role === 'Director';
  const ACCENT     = isDirector ? DIR_ACCENT   : VP_ACCENT;
  const GRADIENT   = isDirector ? DIR_GRADIENT : VP_GRADIENT;
  const TABS       = isDirector ? TABS_DIR     : TABS_VP;

  const [tab, setTab]                     = useState('dashboard');
  const [toast, setToast]                 = useState('');
  const [errMsg, setErrMsg]               = useState('');
  const [saving, setSaving]               = useState(false);

  // Data
  const [staff, setStaff]                 = useState<any[]>([]);
  const [transactions, setTransactions]   = useState<any[]>([]);
  const [students, setStudents]           = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [permissions, setPermissions]     = useState<Record<string, any>>({});
  const [income, setIncome]               = useState<any[]>([]);
  const [expenses, setExpenses]           = useState<any[]>([]);
  const [sessions, setSessions]           = useState<any[]>([]);

  // UI state
  const [editPermRole, setEditPermRole]   = useState<{ role: string; perms: Record<string, boolean> } | null>(null);
  const [reversing, setReversing]         = useState<string | null>(null);
  const [leaveSaving, setLeaveSaving]     = useState<string | null>(null);
  const [txSearch, setTxSearch]           = useState('');
  const [txFilter, setTxFilter]           = useState('');
  const [staffSearch, setStaffSearch]     = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [confirmReverse, setConfirmReverse] = useState<any>(null);
  const [sessionForm, setSessionForm]     = useState({ name: '', is_active: true });
  const [sessionLoading, setSessionLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const showErr   = (msg: string) => { setErrMsg(msg); setTimeout(() => setErrMsg(''), 4000); };

  // ── Load all data ──────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const [
      { data: staffData },
      { data: txData },
      { data: stuData },
      { data: leaveData },
      { data: permData },
      { data: incData },
      { data: expData },
      { data: sessData },
    ] = await Promise.all([
      supabase.from('admin_users').select('*').order('full_name'),
      supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(200),
      supabase.from('students').select('roll_no,full_name,class_section,program,gender,status').limit(500),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('role_permissions').select('*'),
      supabase.from('income').select('*').order('income_date', { ascending: false }).limit(100),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(100),
      supabase.from('academic_sessions').select('*').order('created_at', { ascending: false }),
    ]);
    setStaff(staffData || []);
    setTransactions(txData || []);
    setStudents(stuData || []);
    setLeaveRequests(leaveData || []);
    setIncome(incData || []);
    setExpenses(expData || []);
    setSessions(sessData || []);

    // Build permissions map
    const permMap: Record<string, any> = {};
    ALL_ROLES.forEach(r => { permMap[r] = { permissions: { ...DEFAULT_PERMISSIONS[r] } }; });
    (permData || []).forEach((p: any) => { if (permMap[p.role]) permMap[p.role] = { ...p }; });
    setPermissions(permMap);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save permissions ───────────────────────────────────────────────────
  const savePermission = async (role: string, perms: Record<string, boolean>) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('role_permissions').select('id').eq('role', role).single();
      if (existing) {
        await supabase.from('role_permissions').update({ permissions: perms, updated_by: adminData.full_name }).eq('role', role);
      } else {
        await supabase.from('role_permissions').insert([{ role, permissions: perms, updated_by: adminData.full_name }]);
      }
      setPermissions(prev => ({ ...prev, [role]: { ...prev[role], permissions: perms } }));
      setEditPermRole(null);
      showToast(`✅ Permissions updated for ${role}`);
    } catch (e: any) { showErr(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Reverse transaction ────────────────────────────────────────────────
  const reverseTransaction = async (tx: any) => {
    if (!tx) return;
    setReversing(tx.id);
    try {
      // 1. Mark transaction as reversed
      const { error: txErr } = await supabase
        .from('fee_transactions')
        .update({ is_reversed: true, reversed_by: adminData.full_name, reversed_at: new Date().toISOString() })
        .eq('id', tx.id);
      if (txErr) throw txErr;

      // 2. Subtract paid amount from fee_group
      if (tx.fee_group_id) {
        const { data: fg } = await supabase.from('fee_groups').select('paid, fine, discount, amount').eq('id', tx.fee_group_id).single();
        if (fg) {
          const newPaid = Math.max(0, (fg.paid || 0) - Number(tx.amount_paid || 0));
          const newStatus = newPaid === 0 ? 'Unpaid' : newPaid < fg.amount ? 'Partial' : 'Paid';
          await supabase.from('fee_groups').update({ paid: newPaid, status: newStatus }).eq('id', tx.fee_group_id);
        }
      }

      // 3. Update student paid_amount
      if (tx.student_roll_link) {
        const { data: stu } = await supabase.from('students').select('paid_amount').eq('roll_no', tx.student_roll_link).single();
        if (stu) {
          const newPaidAmt = Math.max(0, (stu.paid_amount || 0) - Number(tx.amount_paid || 0));
          await supabase.from('students').update({ paid_amount: newPaidAmt }).eq('roll_no', tx.student_roll_link);
        }
      }

      // 4. Log audit
      await supabase.from('audit_log').insert([{
        action: 'TRANSACTION_REVERSED',
        performed_by: adminData.full_name,
        role: adminData.role,
        details: `Reversed Tx #${tx.id} | Amount: Rs ${tx.amount_paid} | Student: ${tx.student_roll_link}`,
      }]);

      // Refresh
      const { data: fresh } = await supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(200);
      setTransactions(fresh || []);
      setConfirmReverse(null);
      showToast(`✅ Transaction reversed — Rs ${Number(tx.amount_paid).toLocaleString('en-PK')} credited back`);
    } catch (e: any) { showErr(e.message || 'Reversal failed'); }
    finally { setReversing(null); }
  };

  // ── Handle leave ───────────────────────────────────────────────────────
  const handleLeave = async (id: string, status: 'Approved' | 'Rejected') => {
    setLeaveSaving(id);
    try {
      await supabase.from('leave_requests').update({ status, reviewed_by: adminData.full_name }).eq('id', id);
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status, reviewed_by: adminData.full_name } : l));
      showToast(`✅ Leave ${status}`);
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setLeaveSaving(null); }
  };

  const createSession = async () => {
    if (!sessionForm.name) { showErr('Session name required'); return; }
    setSessionLoading(true);
    try {
      const { error } = await supabase.from('academic_sessions').insert([sessionForm]);
      if (error) throw error;
      showToast('✅ New academic session created');
      setSessionForm({ name: '', is_active: true });
      const { data } = await supabase.from('academic_sessions').select('*').order('created_at', { ascending: false });
      setSessions(data || []);
    } catch (e: any) { showErr(e.message || 'Failed to create session'); }
    finally { setSessionLoading(false); }
  };

  const toggleSession = async (id: string, active: boolean) => {
    try {
      await supabase.from('academic_sessions').update({ is_active: active }).eq('id', id);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
      showToast(`✅ Session ${active ? 'activated' : 'deactivated'}`);
    } catch (e: any) { showErr(e.message || 'Update failed'); }
  };

  // ── Computed ───────────────────────────────────────────────────────────
  const pendingLeaves  = leaveRequests.filter(l => !l.status || l.status === 'Pending').length;
  const todayRevenue   = transactions.filter(t => t.payment_date?.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((s, t) => s + Number(t.amount_paid || 0), 0);
  const totalRevenue   = transactions.filter(t => !t.is_reversed).reduce((s, t) => s + Number(t.amount_paid || 0), 0);
  const reversedCount  = transactions.filter(t => t.is_reversed).length;

  const filteredTx = transactions.filter(t => {
    if (txFilter === 'Reversed' && !t.is_reversed) return false;
    if (txFilter === 'Active' && t.is_reversed) return false;
    if (txSearch) {
      const q = txSearch.toLowerCase();
      const stu = students.find(s => String(s.roll_no) === String(t.student_roll_link));
      return String(t.student_roll_link).includes(q) || stu?.full_name?.toLowerCase().includes(q) || (t.receipt_serial || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredStaff = staff.filter(s => {
    if (selectedRoleFilter && s.role !== selectedRoleFilter) return false;
    if (staffSearch) return s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) || s.username?.toLowerCase().includes(staffSearch.toLowerCase());
    return true;
  });

  const ROLE_COLORS: Record<string, string> = {
    Director: 'bg-orange-100 text-orange-700', VP: 'bg-purple-100 text-purple-700',
    Principal: 'bg-teal-100 text-teal-700', Accountant: 'bg-emerald-100 text-emerald-700',
    Teacher: 'bg-blue-100 text-blue-700', Coordinator: 'bg-indigo-100 text-indigo-700',
    Examiner: 'bg-violet-100 text-violet-700', Academics: 'bg-cyan-100 text-cyan-700',
    Receptionist: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white shadow-2xl"
            style={{ background: GRADIENT }}>{toast}</motion.div>
        )}
        {errMsg && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white shadow-2xl bg-rose-600">{errMsg}</motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: GRADIENT }}>{adminData.role.charAt(0)}</div>
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">{adminData.full_name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: ACCENT }}>{adminData.role} Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={loadAll} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"><RefreshCw size={14} /></motion.button>
          {pendingLeaves > 0 && (
            <button onClick={() => setTab('leaves')} className="relative w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Bell size={16} className="text-amber-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{pendingLeaves}</span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-black border border-rose-200 hover:bg-rose-100 transition-all"><LogOut size={13} /> Logout</button>
        </div>
      </header>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100 px-4 md:px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const badge  = id === 'leaves' ? pendingLeaves : 0;
            return (
              <button key={id} onClick={() => setTab(id)} className={cn('flex items-center gap-2 px-4 py-3.5 text-xs font-black border-b-2 transition-all relative whitespace-nowrap', active ? 'border-current' : 'border-transparent text-slate-400 hover:text-slate-600')} style={active ? { color: ACCENT } : {}}>
                <Icon size={14} />{label}
                {badge > 0 && <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 md:px-6 py-6 pb-24 md:pb-6 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ════ DASHBOARD ════ */}
          {tab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: GRADIENT, boxShadow: `0 12px 40px ${ACCENT}40` }}>
                <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 bg-white" style={{ transform: 'translate(40%,-40%)' }} />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <h2 className="text-xl font-black mb-4">Welcome, {adminData.full_name.split(' ').slice(0, 2).join(' ')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{ l: "Today's Revenue", v: PKR(todayRevenue) }, { l: 'Total Revenue', v: PKR(totalRevenue) }, { l: 'Staff Count', v: staff.length }, { l: 'Pending Leaves', v: pendingLeaves }].map(({ l, v }) => (
                    <div key={l}><p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">{l}</p><p className="text-xl font-black">{v}</p></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Receipt}    label="Transactions"    value={transactions.length}     sub={`${reversedCount} reversed`}        color="bg-blue-50 text-blue-600"    />
                <StatCard icon={Shield}     label="Roles Managed"   value={ALL_ROLES.length}         sub="Permission sets"                    color={`text-white`} style={{ background: ACCENT }} />
                <StatCard icon={Calendar}   label="Pending Leaves"  value={pendingLeaves}            sub="Awaiting action"                    color="bg-amber-50 text-amber-600"  alert={pendingLeaves > 0} />
                <StatCard icon={Users}      label="Total Staff"     value={staff.length}             sub="Active portal users"                color="bg-teal-50 text-teal-600"    />
              </div>

              {/* Quick permissions overview */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">🔐 Role Permissions Overview</h3>
                  <button onClick={() => setTab('permissions')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>Manage All →</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {ALL_ROLES.slice(0, 5).map(role => {
                    const perms = permissions[role]?.permissions || DEFAULT_PERMISSIONS[role] || {};
                    const enabledCount = Object.values(perms).filter(Boolean).length;
                    const totalCount = Object.keys(perms).length;
                    return (
                      <div key={role} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', ROLE_COLORS[role] || 'bg-slate-100 text-slate-600')}>{role}</span>
                          <span className="text-xs text-slate-400">{enabledCount}/{totalCount} permissions enabled</span>
                        </div>
                        <button onClick={() => setEditPermRole({ role, perms: { ...perms } })} className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-slate-600 hover:border-slate-400 transition-all flex items-center gap-1">
                          <Key size={10} /> Edit
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">🧾 Recent Transactions</h3>
                  <button onClick={() => setTab('transactions')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All & Reverse →</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0, 5).map((t, i) => {
                    const stu = students.find(s => String(s.roll_no) === String(t.student_roll_link));
                    return (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={cn('flex items-center gap-3 px-5 py-3.5', t.is_reversed ? 'opacity-50' : '')}>
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', t.is_reversed ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600')}><Receipt size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{stu?.full_name || `Roll #${t.student_roll_link}`}</p>
                          <p className="text-[11px] text-slate-400">{t.payment_method || '—'} · {t.collected_by || '—'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn('font-black', t.is_reversed ? 'text-rose-400 line-through' : 'text-emerald-600')}>{PKR(Number(t.amount_paid))}</p>
                          {t.is_reversed && <p className="text-[9px] text-rose-400 font-bold">REVERSED</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ PERMISSIONS ════ */}
          {tab === 'permissions' && (
            <motion.div key="perms" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="rounded-3xl p-6 text-white" style={{ background: GRADIENT }}>
                <h2 className="text-xl font-black">Permission Control Center</h2>
                <p className="text-sm opacity-70 mt-1">Set granular access permissions for every role in the system. Changes take effect immediately.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_ROLES.map(role => {
                  const perms = permissions[role]?.permissions || DEFAULT_PERMISSIONS[role] || {};
                  const enabledCount = Object.values(perms).filter(Boolean).length;
                  return (
                    <motion.div key={role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: GRADIENT }}>{role.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900">{role}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{enabledCount} of {Object.keys(perms).length} permissions enabled</p>
                          </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditPermRole({ role, perms: { ...perms } })} className="px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5" style={{ background: GRADIENT }}>
                          <Key size={12} /> Edit
                        </motion.button>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {Object.entries(perms).map(([k, v]: any) => (
                          <span key={k} className={cn('px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1', v ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through')}>
                            {v ? <Check size={9} /> : <X size={9} />} {PERMISSION_LABELS[k] || k}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Edit Permission Modal */}
              <AnimatePresence>
                {editPermRole && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditPermRole(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10 max-h-[85vh] flex flex-col" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
                      <div className="h-1" style={{ background: GRADIENT }} />
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                        <div>
                          <h3 className="font-black text-slate-900">Edit: {editPermRole.role}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Toggle permissions on/off</p>
                        </div>
                        <button onClick={() => setEditPermRole(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                      </div>
                      <div className="overflow-y-auto flex-1 p-6 space-y-3">
                        {Object.entries(editPermRole.perms).map(([k, v]: any) => (
                          <div key={k} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                            <div>
                              <p className="text-sm font-bold text-slate-700">{PERMISSION_LABELS[k] || k}</p>
                              <p className="text-[10px] text-slate-400">{v ? 'Currently enabled' : 'Currently disabled'}</p>
                            </div>
                            <Toggle value={!!v} onChange={val => setEditPermRole(p => p ? ({ ...p, perms: { ...p.perms, [k]: val } }) : p)} accent={ACCENT} />
                          </div>
                        ))}
                      </div>
                      <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                        <button onClick={() => setEditPermRole(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => savePermission(editPermRole.role, editPermRole.perms)} disabled={saving} className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: GRADIENT }}>
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <><Shield size={15} /> Save Permissions</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ════ TRANSACTIONS ════ */}
          {tab === 'transactions' && (
            <motion.div key="txns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="rounded-2xl px-5 py-4 border flex items-center gap-3" style={{ background: `${ACCENT}0d`, borderColor: `${ACCENT}30` }}>
                <RefreshCcw size={16} style={{ color: ACCENT }} />
                <p className="text-sm font-bold" style={{ color: ACCENT }}>As <strong>{adminData.role}</strong>, you can reverse any transaction. This will deduct the payment from the student's ledger and mark the entry as reversed.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Receipt}    label="Total Transactions" value={transactions.length}                             color="bg-blue-50 text-blue-600" />
                <StatCard icon={DollarSign} label="Total Revenue"      value={PKR(totalRevenue)} sub="Excluding reversed"     color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={RefreshCcw} label="Reversed"           value={reversedCount} sub="Refunded transactions"     color="bg-rose-50 text-rose-600" alert={reversedCount > 0} />
                <StatCard icon={TrendingUp} label="Today's Revenue"    value={PKR(todayRevenue)}                              color="bg-amber-50 text-amber-600" />
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search name or roll no..." className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="flex gap-2">
                  {[{ v: '', l: 'All' }, { v: 'Active', l: 'Active' }, { v: 'Reversed', l: 'Reversed' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setTxFilter(v)} className={cn('px-3 py-2 rounded-xl text-[11px] font-black border transition-all', txFilter === v ? 'text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-200')} style={txFilter === v ? { background: GRADIENT } : {}}>{l}</button>
                  ))}
                </div>
                {(txSearch || txFilter) && (
                  <button onClick={() => { setTxSearch(''); setTxFilter(''); }} className="text-[10px] font-black text-rose-500 flex items-center gap-1"><X size={11} /> Clear</button>
                )}
              </div>

              {/* Transaction table */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto" style={{ maxHeight: 560 }}>
                  <table className="w-full text-xs min-w-[750px]">
                    <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                      <tr>{['Date', 'Student', 'Amount', 'Method', 'Collected By', 'Receipt', 'Status', 'Action'].map(h => <th key={h} className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredTx.map((t, i) => {
                        const stu = students.find(s => String(s.roll_no) === String(t.student_roll_link));
                        return (
                          <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.008, 0.3) }}
                            className={cn('border-b border-slate-50 transition-colors', t.is_reversed ? 'bg-rose-50/30 opacity-60' : 'hover:bg-slate-50/50')}>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}</td>
                            <td className="px-4 py-3">
                              <p className="font-black text-slate-900 leading-none">{stu?.full_name || 'Unknown'}</p>
                              <p className="text-[10px] font-bold mt-0.5" style={{ color: ACCENT }}>#{t.student_roll_link}</p>
                            </td>
                            <td className="px-4 py-3 font-black" style={{ color: t.is_reversed ? '#9CA3AF' : '#059669' }}>
                              {PKR(Number(t.amount_paid))}
                              {t.is_reversed && <span className="block text-[8px] font-bold text-rose-400 leading-none mt-0.5">REVERSED</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{t.payment_method || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{t.collected_by || '—'}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{t.receipt_serial || '—'}</td>
                            <td className="px-4 py-3">
                              {t.is_reversed ? (
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">Reversed by {t.reversed_by || 'Admin'}</span>
                              ) : t.confirmed_by ? (
                                <span className="text-emerald-600 font-bold text-[10px]">✓ Confirmed</span>
                              ) : (
                                <span className="text-amber-500 text-[10px]">Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {!t.is_reversed && (
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmReverse(t)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all">
                                  <RefreshCcw size={11} /> Reverse
                                </motion.button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                      {filteredTx.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No transactions found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STAFF ════ */}
          {tab === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search by name or username..." className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-white transition-all" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['', ...ALL_ROLES, 'Director', 'VP'].map(r => (
                    <button key={r} onClick={() => setSelectedRoleFilter(r)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all', selectedRoleFilter === r ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')} style={selectedRoleFilter === r ? { background: GRADIENT } : {}}>{r || 'All'}</button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">All Staff ({filteredStaff.length})</h3></div>
                <div className="divide-y divide-slate-50" style={{ maxHeight: 520, overflowY: 'auto' }}>
                  {filteredStaff.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.015, 0.3) }} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: `hsl(${(s.username?.charCodeAt(0) || 50) * 37 % 360},55%,45%)` }}>{s.full_name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{s.full_name}</p>
                        <p className="text-[10px] text-slate-400">@{s.username}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', ROLE_COLORS[s.role] || 'bg-slate-100 text-slate-600')}>{s.role}</span>
                        <button onClick={() => { const perms = permissions[s.role]?.permissions || DEFAULT_PERMISSIONS[s.role] || {}; setEditPermRole({ role: s.role, perms: { ...perms } }); setTab('permissions'); }} className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-400 transition-all flex items-center gap-1">
                          <Shield size={10} /> Perms
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {filteredStaff.length === 0 && <div className="px-5 py-12 text-center text-slate-400 text-sm">No staff found</div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ LEAVES ════ */}
          {tab === 'leaves' && (
            <motion.div key="leaves" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ l: 'Total', v: leaveRequests.length, c: 'text-slate-900' }, { l: 'Pending', v: pendingLeaves, c: 'text-amber-600' }, { l: 'Approved', v: leaveRequests.filter(l => l.status === 'Approved').length, c: 'text-emerald-600' }].map(({ l, v, c }) => (
                  <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                ))}
              </div>
              <div className="space-y-3">
                {leaveRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Calendar size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No leave requests yet</p></div>
                ) : leaveRequests.map((l: any, i: number) => {
                  const isPending = !l.status || l.status === 'Pending';
                  return (
                    <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={cn('bg-white rounded-2xl overflow-hidden shadow-sm', isPending ? 'border-l-4 border border-amber-200' : 'border border-slate-100')}
                      style={isPending ? { borderLeftColor: '#D97706' } : {}}>
                      <div className="px-4 py-4 flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0', l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{(l.student_name || l.student_roll_no || 'S')?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900">{l.student_name || `Roll #${l.student_roll_no}`}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{l.reason || l.leave_type || 'Leave request'}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {(l.from_date || l.request_date) && <span className="text-[11px] text-slate-400">{l.from_date || l.request_date}{l.to_date && l.to_date !== l.from_date ? ` → ${l.to_date}` : ''}</span>}
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{l.status || 'Pending'}</span>
                          </div>
                        </div>
                        {isPending && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Approved')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                              {leaveSaving === l.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Rejected')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={10} /> Reject
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ════ REPORTS ════ */}
          {tab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={DollarSign} label="Total Revenue"     value={PKR(totalRevenue)}          sub="All confirmed" color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={Receipt}    label="Transactions"      value={transactions.length}         sub="All time"      color="bg-blue-50 text-blue-600" />
                <StatCard icon={RefreshCcw} label="Reversed"          value={`${PKR(transactions.filter(t => t.is_reversed).reduce((s, t) => s + Number(t.amount_paid || 0), 0))}`} sub={`${reversedCount} txns`} color="bg-rose-50 text-rose-600" />
                <StatCard icon={TrendingUp} label="Net Income"        value={PKR(income.reduce((s, i) => s + i.amount, 0))}  sub="Non-fee income" color="bg-purple-50 text-purple-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">💵 Other Income</h3>
                    <p className="font-black text-emerald-600">{PKR(income.reduce((s, e) => s + e.amount, 0))}</p>
                  </div>
                  {income.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No income recorded</p>
                    : income.slice(0, 8).map(e => (
                    <div key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                      <div><p className="text-sm font-bold text-slate-800">{e.description}</p><p className="text-[11px] text-slate-400">{e.category} · {e.income_date}</p></div>
                      <span className="font-black text-emerald-600">{PKR(e.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">💸 Expenses</h3>
                    <p className="font-black text-rose-600">{PKR(expenses.reduce((s, e) => s + e.amount, 0))}</p>
                  </div>
                  {expenses.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No expenses recorded</p>
                    : expenses.slice(0, 8).map(e => (
                    <div key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                      <div><p className="text-sm font-bold text-slate-800">{e.description}</p><p className="text-[11px] text-slate-400">{e.category} · {e.expense_date}</p></div>
                      <span className="font-black text-rose-600">{PKR(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ SESSIONS ════ */}
          {tab === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Session */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
                  <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-emerald-500" /> Create Academic Session
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Session Name</label>
                      <input 
                        value={sessionForm.name} 
                        onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })}
                        placeholder="e.g. 2026-27"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-400 transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Initial Status</p>
                        <p className="text-[10px] text-slate-400">Mark as active session immediately</p>
                      </div>
                      <Toggle value={sessionForm.is_active} onChange={v => setSessionForm({ ...sessionForm, is_active: v })} accent={ACCENT} />
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.97 }} 
                      onClick={createSession} 
                      disabled={sessionLoading}
                      className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50"
                      style={{ background: GRADIENT }}>
                      {sessionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Session'}
                    </motion.button>
                  </div>
                </div>

                {/* List Sessions */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Academic Sessions</h3>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                    {sessions.map((s, i) => (
                      <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50">
                        <div>
                          <p className="font-black text-slate-800 tracking-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                            {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <Toggle value={s.is_active} onChange={v => toggleSession(s.id, v)} accent={ACCENT} />
                        </div>
                      </motion.div>
                    ))}
                    {sessions.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No sessions defined</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Confirm Reverse Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {confirmReverse && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmReverse(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1 bg-rose-500" />
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-rose-600" />
                </div>
                <h3 className="font-black text-slate-900 text-center text-lg">Reverse Transaction?</h3>
                <p className="text-sm text-slate-500 text-center mt-2">This will reverse the payment of <strong className="text-rose-600">{PKR(Number(confirmReverse.amount_paid))}</strong> and deduct it from the student's ledger.</p>
                <div className="bg-slate-50 rounded-2xl p-4 mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Student Roll:</span><span className="font-black text-slate-700">#{confirmReverse.student_roll_link}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Amount:</span><span className="font-black text-rose-600">{PKR(Number(confirmReverse.amount_paid))}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Collected By:</span><span className="font-black text-slate-700">{confirmReverse.collected_by || '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Method:</span><span className="font-black text-slate-700">{confirmReverse.payment_method || '—'}</span></div>
                </div>
                <p className="text-[10px] text-rose-500 font-bold text-center mt-3">⚠️ This action cannot be undone.</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setConfirmReverse(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => reverseTransaction(confirmReverse)} disabled={!!reversing} className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 bg-rose-600">
                    {reversing ? <Loader2 size={15} className="animate-spin" /> : <><RefreshCcw size={15} /> Confirm Reverse</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}