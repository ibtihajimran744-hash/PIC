import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, BarChart3, CreditCard, GraduationCap,
  Bell, LogOut, Search, Download, RefreshCw, AlertTriangle,
  CheckCircle, Clock, ChevronRight, X, Star, Shield, UserPlus,
  TrendingDown, TrendingUp, FileText, Check, Loader2, Home,
  PieChart, CheckCircle2, UserCheck, ArrowUpRight, ArrowDownRight,
  Banknote, Eye, Settings, UserCog, Trash2, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface VPPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

const PKR  = (n: number | null | undefined) => `Rs ${(n ?? 0).toLocaleString('en-PK')}`;
const PKRs = (n: number | null | undefined) => {
  const v = n ?? 0;
  if (v >= 10000000) return `Rs ${(v/10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `Rs ${(v/100000).toFixed(1)}L`;
  if (v >= 1000)     return `Rs ${(v/1000).toFixed(0)}k`;
  return `Rs ${v.toLocaleString('en-PK')}`;
};

// ── Shared mini components ─────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, trend, color, alert }: any) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className={cn('bg-white rounded-2xl p-4 border transition-all', alert ? 'border-rose-200' : 'border-slate-100')}
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className="flex items-start justify-between mb-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}><Icon size={19} /></div>
      {trend !== undefined && (
        <span className={cn('flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full',
          trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50')}>
          {trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}{Math.abs(trend)}%
        </span>
      )}
      {alert && !trend && <AlertTriangle size={15} className="text-rose-500 mt-0.5"/>}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black tracking-tight leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

const Badge = ({ status }: { status: string }) => {
  const map: Record<string,string> = {
    'Active':'bg-emerald-50 text-emerald-700','Inactive':'bg-slate-100 text-slate-500',
    'Paid':'bg-emerald-50 text-emerald-700','Partial':'bg-amber-50 text-amber-700',
    'Unpaid':'bg-rose-50 text-rose-700','Pending':'bg-amber-50 text-amber-700',
    'Approved':'bg-emerald-50 text-emerald-700','Rejected':'bg-rose-50 text-rose-700',
  };
  return <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', map[status]||'bg-slate-100 text-slate-600')}>{status}</span>;
};

// ── Role Assignment Modal ──────────────────────────────────────
const RoleAssignModal = ({ onClose, onSave, assignableRoles, vpName }: {
  onClose: () => void;
  onSave: (data: any) => void;
  assignableRoles: string[];
  vpName: string;
}) => {
  const [form, setForm] = useState({ full_name:'', username:'', role: assignableRoles[0]||'', password:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.full_name.trim() || !form.username.trim() || !form.role || !form.password.trim()) {
      setError('All fields except notes are required'); return;
    }
    setSaving(true); setError('');
    try {
      // Check username uniqueness
      const { data: existing } = await supabase.from('admin_users').select('id').eq('username', form.username.trim()).single();
      if (existing) { setError('Username already taken'); setSaving(false); return; }

      const { data: newAdmin, error: adminErr } = await supabase.from('admin_users').insert([{
        full_name: form.full_name.trim().toUpperCase(),
        username: form.username.trim().toLowerCase(),
        role: form.role,
        password: form.password.trim(),
      }]).select().single();
      if (adminErr) throw adminErr;

      await supabase.from('staff_role_assignments').insert([{
        admin_user_id: newAdmin.id,
        full_name: newAdmin.full_name,
        username: newAdmin.username,
        role: form.role,
        assigned_by: vpName,
        notes: form.notes,
      }]);

      onSave(newAdmin);
    } catch(e: any) { setError(e.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose} className="absolute inset-0 backdrop-blur-sm bg-slate-900/40"/>
      <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:420,damping:28}}
        className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10"
        style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
        <div className="h-1" style={{background:'linear-gradient(90deg,#7C3AED,#6D28D9)'}}/>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Assign New Role</h3>
              <p className="text-xs text-slate-400 mt-0.5">Creates login credentials and assigns portal access</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))}
                placeholder="e.g. Muhammad Ali Khan"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                <input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}
                  placeholder="e.g. acc_02"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                <input value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  placeholder="Initial password"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500"/>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 bg-white font-medium">
                {assignableRoles.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
              <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                placeholder="Reason for assignment, department, etc."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500"/>
            </div>
            {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100">Cancel</button>
              <motion.button whileTap={{scale:0.97}} onClick={submit} disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
                style={{background:'linear-gradient(135deg,#7C3AED,#6D28D9)'}}>
                {saving ? <Loader2 size={15} className="animate-spin"/> : <><UserPlus size={15}/> Assign Role</>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN VP PORTAL
// ═══════════════════════════════════════════════════════════════
export const VPPortal: React.FC<VPPortalProps> = ({ onLogout, adminData }) => {
  const ACCENT = '#7C3AED'; // Purple for VP
  const GRADIENT = 'linear-gradient(135deg,#7C3AED,#6D28D9)';

  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data
  const [stats,         setStats]         = useState<any>({});
  const [students,      setStudents]       = useState<any[]>([]);
  const [transactions,  setTransactions]   = useState<any[]>([]);
  const [expenses,      setExpenses]       = useState<any[]>([]);
  const [incomeList,    setIncomeList]     = useState<any[]>([]);
  const [discounts,     setDiscounts]      = useState<any[]>([]);
  const [notifications, setNotifications]  = useState<any[]>([]);
  const [classSummary,  setClassSummary]   = useState<any[]>([]);
  const [summerStudents,setSummerStudents] = useState<any[]>([]);
  const [staffList,     setStaffList]      = useState<any[]>([]);
  const [permissions,   setPermissions]    = useState<any>({});
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<any>({});

  // UI
  const [searchQ,         setSearchQ]         = useState('');
  const [showNotifs,      setShowNotifs]       = useState(false);
  const [showAssignModal, setShowAssignModal]  = useState(false);
  const [approveItem,     setApproveItem]      = useState<any>(null);
  const [saving,          setSaving]           = useState(false);
  const [editPermRole,    setEditPermRole]     = useState<any>(null);
  const [selectedReport,  setSelectedReport]  = useState<any>(null);
  const [moreOpen,        setMoreOpen]         = useState(false);

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(()=>setSavedMsg(''),3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(()=>setErrorMsg(''),4500); };
  const refresh   = () => setRefreshKey(k=>k+1);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const today      = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split('T')[0];

    const [s1,s2,s3,s4,s5,s6,s7,s8,s9] = await Promise.all([
      supabase.from('fee_transactions').select('amount_paid,payment_method,payment_date,student_roll_link'),
      supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,total_package,paid_amount,status,gender').order('full_name'),
      supabase.from('expenses').select('*').order('expense_date',{ascending:false}).limit(40),
      supabase.from('income').select('*').order('income_date',{ascending:false}).limit(40),
      supabase.from('discount_requests').select('*').eq('status','Pending').order('created_at',{ascending:false}),
      supabase.from('admin_notifications').select('*').in('target_role',['VP','Director']).order('created_at',{ascending:false}).limit(30),
      supabase.from('academics_class_summary').select('*'),
      supabase.from('summer_camp_students').select('*').order('created_at',{ascending:false}),
      supabase.from('attendance').select('status').eq('date',today),
    ]);

    const txns=s1.data||[], studs=s2.data||[], exps=s3.data||[], incs=s4.data||[];
    const present = (s9.data||[]).filter((a:any)=>a.status==='Present').length;
    const absent  = (s9.data||[]).filter((a:any)=>a.status==='Absent').length;
    const attPct  = (s9.data||[]).length>0?Math.round((present/(s9.data||[]).length)*100):0;
    const monthlyFee = txns.filter(t=>t.payment_date?.startsWith(monthStart.slice(0,7))).reduce((s,t)=>s+Number(t.amount_paid),0);
    const outstanding = studs.filter(s=>s.status==='Active').reduce((s,st)=>s+((st.total_package||0)-(st.paid_amount||0)),0);
    const monthlyExp = exps.filter(e=>e.expense_date?.startsWith(monthStart.slice(0,7))).reduce((s,e)=>s+(e.amount||0),0);
    const monthlyInc = incs.filter(i=>i.income_date?.startsWith(monthStart.slice(0,7))).reduce((s,i)=>s+(i.amount||0),0);

    setStats({ monthlyFee, outstanding, monthlyExp, monthlyInc, present, absent, attPct,
      totalStu: studs.filter(s=>s.status==='Active').length,
      unpaidStu: studs.filter(s=>s.status==='Active'&&s.paid_amount===0).length,
      maleStudents: studs.filter(s=>s.gender==='Male').length,
      femaleStudents: studs.filter(s=>s.gender==='Female').length,
      netSurplus: monthlyFee+monthlyInc-monthlyExp,
    });
    setStudents(studs);
    setTransactions(txns.slice(0,30).map((t:any)=>{ const st=studs.find((s:any)=>String(s.roll_no)===String(t.student_roll_link)); return {...t,student_name:st?.full_name,class_section:st?.class_section}; }));
    setExpenses(exps); setIncomeList(incs);
    setDiscounts(s5.data||[]); setNotifications(s6.data||[]);
    setClassSummary(s7.data||[]); setSummerStudents(s8.data||[]);
    setLoading(false);
  }, []);

  const loadStaff = async () => {
    const { data } = await supabase.from('admin_users').select('id,full_name,username,role').order('role');
    setStaffList(data||[]);
  };

  const loadPermissions = async () => {
    const { data } = await supabase.from('role_permissions').select('*');
    const map: Record<string,any> = {};
    (data||[]).forEach((r:any) => { map[r.role] = r; });
    setAllPermissions(map);
    // VP's own permissions
    const vpPerms = map['VP'];
    if (vpPerms) {
      setPermissions(vpPerms.permissions||{});
      setAssignableRoles(vpPerms.assignable_roles||[]);
    }
  };

  useEffect(()=>{ loadAll(); loadStaff(); loadPermissions(); },[refreshKey]);

  const handleDiscount = async (item: any, action: 'Approved'|'Rejected') => {
    setSaving(true);
    try {
      await supabase.from('discount_requests').update({status:action,reviewed_by:adminData.full_name,reviewed_at:new Date().toISOString()}).eq('id',item.id);
      if (action==='Approved') {
        const {data:stu}=await supabase.from('students').select('total_package').eq('roll_no',item.student_roll).single();
        if (stu) await supabase.from('students').update({total_package:Math.max(0,(stu.total_package||0)-item.discount_amount)}).eq('roll_no',item.student_roll);
      }
      setApproveItem(null); showToast(`✅ Discount ${action.toLowerCase()}`); refresh();
    } catch(e:any){showErr(e.message);}
    finally{setSaving(false);}
  };

  const savePermission = async (role: string, perms: any) => {
    await supabase.from('role_permissions').update({ permissions: perms, updated_by: adminData.full_name, updated_at: new Date().toISOString() }).eq('role', role);
    showToast(`✅ Permissions updated for ${role}`);
    loadPermissions(); setEditPermRole(null);
  };

  const deactivateStaff = async (userId: string, username: string) => {
    if (!confirm(`Deactivate ${username}?`)) return;
    await supabase.from('admin_users').delete().eq('id', userId);
    await supabase.from('staff_role_assignments').update({is_active:false}).eq('admin_user_id',userId);
    showToast(`✅ ${username} deactivated`); loadStaff();
  };

  const unreadNotifs = notifications.filter(n=>!n.is_read).length;
  const filteredStudents = students.filter(s=>!searchQ||s.full_name?.toLowerCase().includes(searchQ.toLowerCase())||String(s.roll_no).includes(searchQ)||s.class_section?.toLowerCase().includes(searchQ.toLowerCase()));

  const NAV = [
    {id:'dashboard', label:'Dashboard', icon:Home},
    {id:'students',  label:'Students',  icon:Users},
    {id:'finance',   label:'Finance',   icon:PieChart},
    {id:'approvals', label:'Approvals', icon:CheckCircle2},
    {id:'academics', label:'Academics', icon:GraduationCap},
    {id:'staff',     label:'Staff & Roles', icon:UserCog},
    {id:'summer-camp',label:'Summer Camp',  icon:Star},
    {id:'reports',   label:'Reports',   icon:FileText},
    {id:'permissions',label:'Permissions',  icon:Shield},
  ];

  // Mobile: show 4 tabs + More
  const MOBILE_NAV_PRIMARY = NAV.slice(0, 4);
  const MOBILE_NAV_MORE = NAV.slice(4);

  const PAGE_TITLES: Record<string,string> = {
    dashboard:'VP Overview', students:'Student Accounts', finance:'Financial Overview (Read-Only)',
    approvals:'Pending Approvals', academics:'Academic Overview', staff:'Staff & Role Management',
    'summer-camp':'Summer Camp Students', reports:'Reports & Exports', permissions:'Permission Control',
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{background:'#f4f6fb',fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10"
        style={{boxShadow:'2px 0 20px rgba(0,0,0,0.04)'}}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:GRADIENT}}>
              <Shield size={18} className="text-white"/>
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">PIC Campus</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">VP Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({id,label,icon:Icon}) => {
            const active = tab===id;
            return (
              <motion.button key={id} onClick={()=>setTab(id)} whileHover={{x:2}}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left',
                  active?'text-white':'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active?{background:GRADIENT}:{}}>
                <Icon size={16}/><span className="flex-1">{label}</span>
                {id==='approvals'&&discounts.length>0&&<span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center" style={{background:'#C0392B'}}>{discounts.length}</span>}
              </motion.button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0" style={{background:GRADIENT}}>
              {adminData.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{adminData.full_name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vice Principal</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between"
        style={{boxShadow:'0 1px 10px rgba(0,0,0,0.07)'}}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:GRADIENT}}>
            <Shield size={14} className="text-white"/>
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">VP Portal</p>
            <p className="text-[9px] text-purple-600 font-bold">{adminData.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg&&<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">{savedMsg}</span>}
          <button onClick={()=>setShowNotifs(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
            <Bell size={16} className="text-slate-600"/>
            {unreadNotifs>0&&<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{background:ACCENT}}>{unreadNotifs>9?'9+':unreadNotifs}</span>}
          </button>
          <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
            <RefreshCw size={14} className={loading?'animate-spin':''}/>
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-0">
        {/* Desktop topbar */}
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between"
          style={{boxShadow:'0 1px 12px rgba(0,0,0,0.05)'}}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{PAGE_TITLES[tab]||'VP Portal'}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <div className="flex items-center gap-3">
            {savedMsg&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={13}/>{savedMsg}</motion.div>}
            {errorMsg&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"><AlertTriangle size={13}/>{errorMsg}</motion.div>}
            <button onClick={()=>setShowNotifs(true)} className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <Bell size={14}/>
              {unreadNotifs>0&&<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{background:ACCENT}}>{unreadNotifs>9?'9+':unreadNotifs}</span>}
            </button>
            <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
              <RefreshCw size={14} className={loading?'animate-spin':''}/>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">

            {/* ══ DASHBOARD ══ */}
            {tab==='dashboard'&&(
              <motion.div key="dash" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                {/* VP Hero */}
                <div className="rounded-3xl p-6 text-white relative overflow-hidden"
                  style={{background:'linear-gradient(135deg,#3B0764 0%,#6D28D9 100%)',boxShadow:'0 12px 40px rgba(109,40,217,0.3)'}}>
                  <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-10" style={{background:'#A78BFA',transform:'translate(40%,-40%)'}}/>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-3">
                    Welcome, {adminData.full_name} · {new Date().toLocaleDateString('en-PK',{weekday:'long',day:'2-digit',month:'long'})}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    {[
                      {l:'Net Surplus',    v:stats.netSurplus>=0?`✅ ${PKRs(stats.netSurplus)}`:`⚠️ ${PKRs(Math.abs(stats.netSurplus))}`, c:'text-white'},
                      {l:'Fee Collected',  v:PKRs(stats.monthlyFee),  c:'text-purple-200'},
                      {l:'Outstanding',    v:PKRs(stats.outstanding), c:'text-rose-300'},
                      {l:'Attendance',     v:`${stats.attPct||0}%`,   c:'text-amber-300'},
                    ].map(({l,v,c})=>(
                      <div key={l}>
                        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p>
                        <p className={cn('text-lg md:text-2xl font-black leading-tight',c)}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <StatCard icon={Users}         label="Total Students" value={stats.totalStu||0}      sub={`${stats.maleStudents||0} Boys · ${stats.femaleStudents||0} Girls`} color="bg-purple-50 text-purple-600"/>
                  <StatCard icon={AlertTriangle} label="Outstanding"    value={PKRs(stats.outstanding)} sub={`${stats.unpaidStu||0} unpaid`} color="bg-amber-50 text-amber-600" alert={stats.outstanding>1000000}/>
                  <StatCard icon={UserCheck}     label="Present Today"  value={`${stats.attPct||0}%`}  sub={`${stats.present||0}P · ${stats.absent||0}A`} color="bg-emerald-50 text-emerald-600"/>
                  <StatCard icon={Clock}         label="Pending Approvals" value={discounts.length}     sub="Discount requests" color="bg-rose-50 text-rose-600" alert={discounts.length>0}/>
                </div>

                {/* Pending approvals preview */}
                {discounts.length>0&&(
                  <div className="bg-white rounded-3xl border border-amber-100 overflow-hidden" style={{boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
                      <h3 className="font-black text-slate-900">⏳ Pending Discount Approvals</h3>
                      <button onClick={()=>setTab('approvals')} className="text-xs font-bold text-purple-600 hover:underline">View All <ChevronRight size={12} className="inline"/></button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {discounts.slice(0,3).map(d=>(
                        <div key={d.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800">Roll #{d.student_roll} · {PKR(d.discount_amount)}</p>
                            <p className="text-xs text-slate-400 truncate">{d.reason} · Ref: {d.reference_name||'—'}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileTap={{scale:0.9}} onClick={()=>setApproveItem(d)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white"
                              style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                              <Check size={10}/> OK
                            </motion.button>
                            <motion.button whileTap={{scale:0.9}} onClick={()=>handleDiscount(d,'Rejected')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={10}/> No
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Class attendance summary */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Today's Class Attendance</h3>
                    <button onClick={()=>setTab('academics')} className="text-xs font-bold text-purple-600">View All →</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[400px]">
                      <thead style={{background:'#f8f9fd'}}>
                        <tr>{['Class','Students','Present','Absent','%'].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {classSummary.slice(0,6).map((r:any,i:number)=>(
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-black text-slate-900">{r.class_section}</td>
                            <td className="px-4 py-3 text-slate-600">{r.total_students}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{r.present_today||0}</td>
                            <td className="px-4 py-3 font-bold text-rose-600">{r.absent_today||0}</td>
                            <td className="px-4 py-3 font-black">
                              {r.total_students>0?`${Math.round(((r.present_today||0)/r.total_students)*100)}%`:'—'}
                            </td>
                          </tr>
                        ))}
                        {classSummary.length===0&&<tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ STUDENTS ══ */}
            {tab==='students'&&(
              <motion.div key="stu" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{l:'Total Active',v:stats.totalStu||0,c:'#7C3AED'},{l:'Boys',v:stats.maleStudents||0,c:'#2563EB'},{l:'Girls',v:stats.femaleStudents||0,c:'#9333EA'}].map(({l,v,c})=>(
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p>
                      <p className="text-2xl font-black" style={{color:c}}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15}/>
                  <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Name, roll number, class..."
                    className="w-full border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-500 bg-white"/>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0" style={{background:'#f8f9fd'}}>
                        <tr>{['Roll','Name','Class','Program','Package','Paid','Balance','Status'].map(h=>(
                          <th key={h} className="px-3 md:px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s,i)=>{
                          const bal=(s.total_package||0)-(s.paid_amount||0);
                          return (
                            <motion.tr key={s.roll_no} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.01,0.2)}}
                              className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-3 md:px-4 py-3 font-mono text-slate-400 text-[10px]">{s.roll_no}</td>
                              <td className="px-3 md:px-4 py-3 font-black text-slate-800 max-w-[120px] truncate">{s.full_name}</td>
                              <td className="px-3 md:px-4 py-3 text-slate-500 whitespace-nowrap">{s.class_section}</td>
                              <td className="px-3 md:px-4 py-3 text-slate-500">{s.program}</td>
                              <td className="px-3 md:px-4 py-3 font-bold text-slate-700">{PKR(s.total_package)}</td>
                              <td className="px-3 md:px-4 py-3 font-bold text-emerald-600">{PKR(s.paid_amount)}</td>
                              <td className={cn('px-3 md:px-4 py-3 font-black',bal>0?'text-rose-600':'text-emerald-600')}>{PKR(bal)}</td>
                              <td className="px-3 md:px-4 py-3"><Badge status={bal===0?'Paid':s.paid_amount>0?'Partial':'Unpaid'}/></td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ FINANCE (read-only) ══ */}
            {tab==='finance'&&(
              <motion.div key="fin" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <Eye size={16} className="text-purple-600 flex-shrink-0"/>
                  <p className="text-sm font-bold text-purple-900">Read-only view. Contact the Accountant or Director to make changes.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <StatCard icon={TrendingUp}   label="Monthly Fees"    value={PKRs(stats.monthlyFee)}  color="bg-emerald-50 text-emerald-600" trend={8}/>
                  <StatCard icon={AlertTriangle} label="Outstanding"    value={PKRs(stats.outstanding)} color="bg-amber-50 text-amber-600" alert/>
                  <StatCard icon={TrendingDown}  label="Monthly Expenses" value={PKRs(stats.monthlyExp)} color="bg-rose-50 text-rose-600"/>
                  <StatCard icon={CreditCard}    label="Monthly Income" value={PKRs(stats.monthlyInc)}  color="bg-blue-50 text-blue-600"/>
                </div>
                {/* Recent transactions read-only */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Recent Transactions</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">View Only</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[400px]">
                      <thead style={{background:'#f8f9fd'}}>
                        <tr>{['Student','Amount','Method','Date'].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0,10).map((t,i)=>(
                          <tr key={i} className="border-b border-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{t.student_name||`Roll #${t.student_roll_link}`}</td>
                            <td className="px-4 py-3 font-black text-emerald-600">{PKR(Number(t.amount_paid))}</td>
                            <td className="px-4 py-3 text-slate-500">{t.payment_method}</td>
                            <td className="px-4 py-3 text-slate-400">{t.payment_date?new Date(t.payment_date).toLocaleDateString('en-PK',{day:'2-digit',month:'short'}):'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* New admissions requiring accountant action */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Recent Admissions Stream</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Read-only · Accountant manages</span>
                  </div>
                  <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-bold text-blue-800">📋 When Admission Officers file new forms, they appear immediately on the Accountant portal. The Accountant confirms to DB, assigns roll numbers, and sets instalment schedules.</p>
                  </div>
                  {([] as any[]).length===0 && <div className="p-8 text-center text-slate-400 text-sm">Admission form stream loads from Accountant portal</div>}
                </div>

              </motion.div>
            )}

            {/* ══ APPROVALS ══ */}
            {tab==='approvals'&&(
              <motion.div key="approvals" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Discount Approval Requests</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Approving reduces the student's fee package permanently.</p>
                  </div>
                  {discounts.length===0?(
                    <div className="px-6 py-16 text-center"><CheckCircle size={40} className="text-emerald-400 mx-auto mb-4"/><p className="font-bold text-slate-500">No pending requests</p></div>
                  ):(
                    <div className="divide-y divide-slate-50">
                      {discounts.map(d=>(
                        <div key={d.id} className="px-5 py-5">
                          <div className="mb-3">
                            <p className="font-black text-slate-900">Roll #{d.student_roll}</p>
                            <p className="text-sm text-amber-600 font-bold mt-0.5">{PKR(d.discount_amount)} discount requested</p>
                            <p className="text-xs text-slate-500 mt-0.5">Ref: {d.reference_name||'—'} · {d.reason}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5">By: {d.requested_by} · {new Date(d.created_at).toLocaleDateString('en-PK')}</p>
                          </div>
                          <div className="flex gap-2">
                            <motion.button whileTap={{scale:0.95}} onClick={()=>setApproveItem(d)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-black"
                              style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                              <Check size={15}/> Approve
                            </motion.button>
                            <motion.button whileTap={{scale:0.95}} onClick={()=>handleDiscount(d,'Rejected')}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={15}/> Reject
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ ACADEMICS ══ */}
            {tab==='academics'&&(
              <motion.div key="acad" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {l:'Total Classes',  v:classSummary.length,                                                             c:'text-purple-600', bg:'bg-purple-50'},
                    {l:'Total Students', v:classSummary.reduce((s:number,r:any)=>s+(r.total_students||0),0),                c:'text-blue-600',   bg:'bg-blue-50'},
                    {l:'Present Today',  v:classSummary.reduce((s:number,r:any)=>s+(r.present_today||0),0),                c:'text-emerald-600',bg:'bg-emerald-50'},
                    {l:'Absent Today',   v:classSummary.reduce((s:number,r:any)=>s+(r.absent_today||0),0),                 c:'text-rose-600',   bg:'bg-rose-50'},
                  ].map(({l,v,c,bg})=>(
                    <div key={l} className={cn('rounded-2xl p-4 border border-slate-100',bg)}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</p>
                      <p className={cn('text-2xl font-black mt-1',c)}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Class-wise Summary</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead style={{background:'#f8f9fd'}}>
                        <tr>{['Class','Program','Part','Students','Present','Absent','Avg Marks'].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {classSummary.map((r:any,i:number)=>(
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-black text-slate-900">{r.class_section}</td>
                            <td className="px-4 py-3 text-slate-600">{r.program}</td>
                            <td className="px-4 py-3 text-slate-500">P{r.part}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{r.total_students}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{r.present_today||0}</td>
                            <td className="px-4 py-3 font-bold text-rose-600">{r.absent_today||0}</td>
                            <td className="px-4 py-3 font-bold">{r.avg_marks_pct?`${r.avg_marks_pct}%`:'—'}</td>
                          </tr>
                        ))}
                        {classSummary.length===0&&<tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ STAFF & ROLES ══ */}
            {tab==='staff'&&(
              <motion.div key="staff" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Staff & Role Management</h2>
                    <p className="text-xs text-slate-400 mt-0.5">You can assign: {assignableRoles.join(', ')}</p>
                  </div>
                  <motion.button whileHover={{y:-1}} whileTap={{scale:0.97}} onClick={()=>setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white"
                    style={{background:GRADIENT}}>
                    <UserPlus size={15}/> Assign New Role
                  </motion.button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3">
                  <p className="text-sm font-bold text-purple-900">
                    ℹ️ As VP, you can create new portal accounts for: {assignableRoles.join(', ')}. Director has full authority.
                  </p>
                </div>

                {/* Staff list */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">All Staff ({staffList.length})</h3>
                    <button onClick={loadStaff} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><RefreshCw size={12} className="text-slate-500"/></button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {staffList.map((s:any,i:number)=>{
                      const canManage = assignableRoles.includes(s.role);
                      return (
                        <motion.div key={s.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                            style={{background:`hsl(${(s.username?.charCodeAt(0)||50)*37%360},55%,45%)`}}>
                            {s.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{s.full_name}</p>
                            <p className="text-[10px] text-slate-400">{s.username}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black',
                              s.role==='Director'||s.role==='VP'?'bg-purple-100 text-purple-700':
                              s.role==='Principal'?'bg-blue-100 text-blue-700':
                              s.role==='Accountant'?'bg-emerald-100 text-emerald-700':
                              'bg-slate-100 text-slate-600')}>
                              {s.role}
                            </span>
                            {canManage&&(
                              <motion.button whileTap={{scale:0.9}} onClick={()=>deactivateStaff(s.id, s.username)}
                                className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100">
                                <Trash2 size={12}/>
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ SUMMER CAMP ══ */}
            {tab==='summer-camp'&&(
              <motion.div key="sc" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Summer Camp Students</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{summerStudents.length} enrolled</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {summerStudents.length===0?(
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">No summer camp students</div>
                  ):summerStudents.map((s:any,i:number)=>(
                    <motion.div key={s.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                          style={{background:`hsl(${(s.full_name?.charCodeAt(0)||50)*37%360},55%,45%)`}}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.father_name} · {s.program||'—'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-slate-700">{PKR(s.fee_package)}</p>
                          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full',
                            s.converted_to_regular?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>
                            {s.converted_to_regular?'Regular':'Summer Camp'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ REPORTS ══ */}
            {tab==='reports'&&(
              <motion.div key="rep" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {icon:Users,        label:'All Students',    sub:'Complete student list',     type:'all_students',      color:'bg-purple-50 text-purple-600'},
                    {icon:CreditCard,   label:'Payment History', sub:'All fee transactions',      type:'payments',          color:'bg-blue-50 text-blue-600'},
                    {icon:TrendingDown, label:'Expense Report',  sub:'Monthly expenses',          type:'expenses',          color:'bg-rose-50 text-rose-600'},
                    {icon:TrendingUp,   label:'Income Report',   sub:'All income sources',        type:'income',            color:'bg-emerald-50 text-emerald-600'},
                    {icon:BarChart3,    label:'Academic Report', sub:'Class-wise performance',    type:'academic',          color:'bg-indigo-50 text-indigo-600'},
                    {icon:AlertTriangle,label:'Pending Fees',    sub:'Students with balance',     type:'pending_fees',      color:'bg-amber-50 text-amber-600'},
                  ].map(({icon:Icon,label,sub,type,color})=>(
                    <motion.button key={type+label} whileHover={{y:-2}} whileTap={{scale:0.98}}
                      onClick={()=>setSelectedReport({type, label})}
                      className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 border border-slate-100 text-left hover:shadow-md transition-all shadow-sm">
                      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',color)}><Icon size={20}/></div>
                      <div className="flex-1 min-w-0"><p className="font-black text-slate-800">{label}</p><p className="text-xs text-slate-400 font-medium">{sub}</p></div>
                      <Download size={16} className="text-slate-300 flex-shrink-0"/>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ PERMISSIONS ══ */}
            {tab==='permissions'&&(
              <motion.div key="perms" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="rounded-3xl p-6 text-white" style={{background:'linear-gradient(135deg,#3B0764,#6D28D9)'}}>
                  <h2 className="text-xl font-black">Permission Control</h2>
                  <p className="text-purple-200 text-sm mt-1">Edit permissions for roles you manage. Director manages VP & Principal permissions.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(allPermissions).filter(([role])=>assignableRoles.includes(role)).map(([role, permData]: [string, any]) => (
                    <div key={role} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{background:GRADIENT}}>{role.charAt(0)}</div>
                          <p className="font-black text-slate-900">{role}</p>
                        </div>
                        <motion.button whileTap={{scale:0.95}} onClick={()=>setEditPermRole({role, perms:{...(permData.permissions||{})}})}
                          className="px-3 py-1.5 rounded-xl text-xs font-black text-white" style={{background:GRADIENT}}>Edit</motion.button>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {Object.entries(permData.permissions||{}).map(([k,v]:any) => (
                          <span key={k} className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', v===true?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700')}>
                            {k.replace(/_/g,' ')} {v===true?'✓':'✗'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.entries(allPermissions).filter(([role])=>assignableRoles.includes(role)).length===0&&(
                    <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                      <Shield size={28} className="mx-auto mb-3"/>
                      <p>No editable permissions for your assigned roles</p>
                    </div>
                  )}
                </div>

                {/* Edit permission modal */}
                <AnimatePresence>
                  {editPermRole&&(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setEditPermRole(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"/>
                      <motion.div initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.94}}
                        transition={{type:'spring',stiffness:400,damping:28}}
                        className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden z-10 max-h-[85vh] flex flex-col"
                        style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
                        <div className="h-1" style={{background:GRADIENT}}/>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                          <h3 className="font-black text-slate-900">Edit: {editPermRole.role}</h3>
                          <button onClick={()=>setEditPermRole(null)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3">
                          {Object.entries(editPermRole.perms).map(([k,v]:any) => (
                            <div key={k} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                              <span className="text-sm font-bold text-slate-700">{k.replace(/_/g,' ')}</span>
                              <button onClick={()=>setEditPermRole((p:any)=>({...p,perms:{...p.perms,[k]:!v}}))}
                                className={cn('w-12 h-6 rounded-full transition-all flex items-center',v===true?'bg-purple-500':'bg-slate-300')}>
                                <div className={cn('w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5',v===true?'translate-x-6':'translate-x-0')}/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                          <button onClick={()=>setEditPermRole(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
                          <motion.button whileTap={{scale:0.97}} onClick={()=>savePermission(editPermRole.role, editPermRole.perms)}
                            className="flex-1 py-3 rounded-2xl text-white font-black text-sm" style={{background:GRADIENT}}>
                            Save
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50"
        style={{boxShadow:'0 -4px 20px rgba(0,0,0,0.08)'}}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV_PRIMARY.map(({id,label,icon:Icon})=>{
            const active=tab===id;
            return (
              <button key={id} onClick={()=>setTab(id)}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0"
                style={{color:active?ACCENT:'#94a3b8'}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={active?{background:`${ACCENT}15`}:{}}>
                  <Icon size={19}/>
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{label}</span>
                {active&&<div className="w-1 h-1 rounded-full" style={{background:ACCENT}}/>}
              </button>
            );
          })}
          {/* More button */}
          <div className="relative flex-1 min-w-0">
            <button onClick={()=>setMoreOpen(p=>!p)}
              className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl w-full"
              style={{color:MOBILE_NAV_MORE.some(n=>n.id===tab)?ACCENT:'#94a3b8'}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={MOBILE_NAV_MORE.some(n=>n.id===tab)?{background:`${ACCENT}15`}:{}}>
                <Settings size={19}/>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight">More</span>
            </button>
            {/* More dropdown */}
            <AnimatePresence>
              {moreOpen&&(
                <motion.div initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}}
                  exit={{opacity:0,y:8,scale:0.95}} transition={{type:'spring',stiffness:420,damping:28}}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                  style={{minWidth:180}}>
                  {MOBILE_NAV_MORE.map(({id,label,icon:Icon})=>(
                    <button key={id} onClick={()=>{setTab(id);setMoreOpen(false);}}
                      className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-bold border-b border-slate-50 last:border-0',
                        tab===id?'text-white':'text-slate-700 hover:bg-slate-50')}
                      style={tab===id?{background:GRADIENT}:{}}>
                      <Icon size={16}/>{label}
                      {id==='approvals'&&discounts.length>0&&<span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{discounts.length}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onLogout}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0"
            style={{color:'#ef4444'}}>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center"><LogOut size={19} className="text-rose-500"/></div>
            <span className="text-[9px] font-black uppercase tracking-tight">Exit</span>
          </button>
        </div>
      </nav>

      {/* ── MODALS ── */}

      <AnimatePresence>
        {showAssignModal&&(
          <RoleAssignModal
            onClose={()=>setShowAssignModal(false)}
            onSave={(newAdmin)=>{ showToast(`✅ ${newAdmin.full_name} → ${newAdmin.role} created`); setShowAssignModal(false); loadStaff(); }}
            assignableRoles={assignableRoles}
            vpName={adminData.full_name}
          />
        )}
      </AnimatePresence>

      {/* Approve discount modal */}
      <AnimatePresence>
        {approveItem&&(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setApproveItem(null)} className="absolute inset-0 backdrop-blur-sm bg-slate-900/40"/>
            <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:420,damping:28}}
              className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden z-10"
              style={{boxShadow:'0 40px 100px rgba(0,0,0,0.3)'}}>
              <div className="h-1" style={{background:'linear-gradient(90deg,#059669,#10b981)'}}/>
              <div className="p-6">
                <h3 className="font-black text-slate-900 text-lg mb-1">Approve Discount?</h3>
                <p className="text-xs text-slate-400 mb-5">Permanently reduces the student's fee package.</p>
                <div className="space-y-2 mb-5">
                  {[{l:'Student Roll',v:`#${approveItem.student_roll}`},{l:'Discount',v:PKR(approveItem.discount_amount)},{l:'Reason',v:approveItem.reason}].map(({l,v})=>(
                    <div key={l} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l}</span>
                      <span className="text-sm font-black text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setApproveItem(null)} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100">Cancel</button>
                  <motion.button whileTap={{scale:0.97}} disabled={saving} onClick={()=>handleDiscount(approveItem,'Approved')}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
                    style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                    {saving?<Loader2 size={15} className="animate-spin"/>:<><Check size={15}/> Approve</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setSelectedReport(null)} className="absolute inset-0 backdrop-blur-md bg-slate-900/60"/>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.95}} transition={{type:'spring',stiffness:400,damping:30}}
              className="relative bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
              style={{boxShadow:'0 40px 120px rgba(0,0,0,0.4)'}}>
              
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{selectedReport.label}</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">VP Executive Report</p>
                </div>
                <button onClick={()=>setSelectedReport(null)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                  <X size={24}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {selectedReport.type === 'all_students' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-purple-700">{students.length}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</p>
                        <p className="text-2xl font-black text-emerald-700">{students.filter(s=>s.status==='Active').length}</p>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Inactive</p>
                        <p className="text-2xl font-black text-rose-700">{students.filter(s=>s.status!=='Active').length}</p>
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3 px-2">Student</th>
                          <th className="pb-3 px-2">Roll #</th>
                          <th className="pb-3 px-2">Class</th>
                          <th className="pb-3 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.slice(0, 50).map(s => (
                          <tr key={s.roll_no} className="text-sm font-bold text-slate-700">
                            <td className="py-3 px-2">{s.full_name}</td>
                            <td className="py-3 px-2 text-slate-400">#{s.roll_no}</td>
                            <td className="py-3 px-2">{s.class_section}</td>
                            <td className="py-3 px-2"><Badge status={s.status}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReport.type === 'payments' && (
                  <div className="space-y-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3 px-2">Date</th>
                          <th className="pb-3 px-2">Student</th>
                          <th className="pb-3 px-2">Amount</th>
                          <th className="pb-3 px-2">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {transactions.map((t, i) => (
                          <tr key={i} className="text-sm font-bold text-slate-700">
                            <td className="py-3 px-2 text-slate-400">{t.payment_date}</td>
                            <td className="py-3 px-2">{t.student_name}</td>
                            <td className="py-3 px-2 text-emerald-600">{PKR(t.amount_paid)}</td>
                            <td className="py-3 px-2"><span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px]">{t.payment_method}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReport.type === 'expenses' && (
                  <div className="space-y-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3 px-2">Date</th>
                          <th className="pb-3 px-2">Category</th>
                          <th className="pb-3 px-2">Description</th>
                          <th className="pb-3 px-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {expenses.map((e, i) => (
                          <tr key={i} className="text-sm font-bold text-slate-700">
                            <td className="py-3 px-2 text-slate-400">{e.expense_date}</td>
                            <td className="py-3 px-2"><span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-[10px]">{e.category}</span></td>
                            <td className="py-3 px-2 truncate max-w-[200px]">{e.description}</td>
                            <td className="py-3 px-2 text-rose-600">{PKR(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReport.type === 'income' && (
                  <div className="space-y-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3 px-2">Date</th>
                          <th className="pb-3 px-2">Source</th>
                          <th className="pb-3 px-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {incomeList.map((inc, i) => (
                          <tr key={i} className="text-sm font-bold text-slate-700">
                            <td className="py-3 px-2 text-slate-400">{inc.income_date}</td>
                            <td className="py-3 px-2">{inc.source}</td>
                            <td className="py-3 px-2 text-emerald-600">{PKR(inc.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReport.type === 'academic' && (
                  <div className="space-y-6">
                    {classSummary.map((c, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-slate-900">{c.class_section}</h4>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Avg: {c.average_percentage}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pass</p>
                            <p className="text-lg font-black text-emerald-600">{c.pass_count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fail</p>
                            <p className="text-lg font-black text-rose-600">{c.fail_count}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Score</p>
                            <p className="text-lg font-black text-indigo-600">{c.top_percentage}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedReport.type === 'pending_fees' && (
                  <div className="space-y-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-3 px-2">Student</th>
                          <th className="pb-3 px-2">Total</th>
                          <th className="pb-3 px-2">Paid</th>
                          <th className="pb-3 px-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.filter(s => (s.total_package||0) > (s.paid_amount||0)).slice(0, 50).map(s => (
                          <tr key={s.roll_no} className="text-sm font-bold text-slate-700">
                            <td className="py-3 px-2">{s.full_name}</td>
                            <td className="py-3 px-2 text-slate-400">{PKR(s.total_package)}</td>
                            <td className="py-3 px-2 text-emerald-600">{PKR(s.paid_amount)}</td>
                            <td className="py-3 px-2 text-rose-600">{PKR((s.total_package||0)-(s.paid_amount||0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <motion.button whileTap={{scale:0.97}} onClick={()=>setSelectedReport(null)}
                  className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-lg shadow-slate-900/20">
                  Close Report
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications panel */}
      <AnimatePresence>
        {showNotifs&&(
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setShowNotifs(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"/>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',stiffness:380,damping:32}}
              className="relative bg-white w-full max-w-2xl rounded-t-3xl overflow-hidden z-10"
              style={{maxHeight:'85vh'}}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-black text-slate-900">Notifications ({unreadNotifs} unread)</h3>
                <button onClick={()=>setShowNotifs(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
              </div>
              <div className="overflow-y-auto" style={{maxHeight:'calc(85vh - 65px)'}}>
                {notifications.length===0?(
                  <div className="p-10 text-center text-slate-400 text-sm">No notifications</div>
                ):notifications.map((n,i)=>(
                  <motion.div key={n.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                    className={cn('px-5 py-4 border-b border-slate-50 flex items-start gap-3',!n.is_read?'bg-purple-50/40':'')}>
                    {!n.is_read&&<div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{background:ACCENT}}/>}
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{n.message}</p>
                      <p className="text-[9px] text-slate-300 mt-1">{new Date(n.created_at).toLocaleString('en-PK',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};