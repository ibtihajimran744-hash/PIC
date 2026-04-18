import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Users, BarChart3, GraduationCap, Bell, LogOut,
  Search, RefreshCw, AlertTriangle, CheckCircle, Clock, X,
  Shield, UserPlus, Loader2, Home, UserCog, Trash2,
  FileText, UserCheck, Check, Settings, Calendar, Eye,
  DollarSign, Receipt, Tag, Database, Save, CreditCard,
  Plus, Lock, Unlock, User, Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';

interface AdminPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

// ── Theme helpers ─────────────────────────────────────────────────────────
const getTheme = (role: string) => {
  if (role === 'Accountant') return { ACCENT: '#1a2fa8', GRADIENT: 'linear-gradient(135deg,#1a2fa8,#2952e3)' };
  return { ACCENT: '#0F766E', GRADIENT: 'linear-gradient(135deg,#0F766E,#0D9488)' };
};

// ── Accountant constants ──────────────────────────────────────────────────
const PROGRAMS = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com'];
const BOARDS   = ['BISE Gujranwala','BISE Lahore','BISE Faisalabad','BISE Rawalpindi','BISE Multan','BISE Sargodha','BISE Sahiwal','Federal Board','Other'];
const PKR      = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

const CLASS_MAP: Record<string, Record<number, Record<string, string>>> = {
  'ICS Physics':     { 1:{'A-B':'ICS-Phy-A-B','B-B':'ICS-Phy-B-B','C-B':'ICS-Phy-B-B','A-G':'ICS-Phy-A-G','B-G':'ICS-Phy-A-G','C-G':'ICS-Phy-A-G'}, 2:{'A-B':'ICS-Phy-II-A-B','B-B':'ICS-Phy-II-B-B','C-B':'ICS-Phy-II-B-B','A-G':'ICS-Phy-II-A-G','B-G':'ICS-Phy-II-A-G','C-G':'ICS-Phy-II-A-G'} },
  'ICS Statistics':  { 1:{'A-B':'ICS-Stat-B','B-B':'ICS-Stat-B','C-B':'ICS-Stat-B','A-G':'ICS-Stat-G','B-G':'ICS-Stat-G','C-G':'ICS-Stat-G'}, 2:{'A-B':'ICS-Stat-II-B','B-B':'ICS-Stat-II-B','C-B':'ICS-Stat-II-B','A-G':'ICS-Stat-II-G','B-G':'ICS-Stat-II-G','C-G':'ICS-Stat-II-G'} },
  'Pre-Medical':     { 1:{'A-B':'Pre-Med-B','B-B':'Pre-Med-B','C-B':'Pre-Med-B','A-G':'Pre-Med-G','B-G':'Pre-Med-G','C-G':'Pre-Med-G'}, 2:{'A-B':'Pre-Med-II-B','B-B':'Pre-Med-II-B','C-B':'Pre-Med-II-B','A-G':'Pre-Med-II-G','B-G':'Pre-Med-II-G','C-G':'Pre-Med-II-G'} },
  'Pre-Engineering': { 1:{'A-B':'Pre-Eng-B','B-B':'Pre-Eng-B','C-B':'Pre-Eng-B','A-G':'Pre-Eng-G','B-G':'Pre-Eng-G','C-G':'Pre-Eng-G'}, 2:{'A-B':'Pre-Eng-II-B','B-B':'Pre-Eng-II-B','C-B':'Pre-Eng-II-B','A-G':'Pre-Eng-II-G','B-G':'Pre-Eng-II-G','C-G':'Pre-Eng-II-G'} },
  'FA IT':           { 1:{'A-B':'FA-IT-B','B-B':'FA-IT-B','C-B':'FA-IT-B','A-G':'FA-IT-G','B-G':'FA-IT-G','C-G':'FA-IT-G'}, 2:{'A-B':'FA-IT-II-B','B-B':'FA-IT-II-B','C-B':'FA-IT-II-B','A-G':'FA-IT-II-G','B-G':'FA-IT-II-G','C-G':'FA-IT-II-G'} },
  'FA General':      { 1:{'A-B':'FA-Gen-B','B-B':'FA-Gen-B','C-B':'FA-Gen-B','A-G':'FA-Gen-G','B-G':'FA-Gen-G','C-G':'FA-Gen-G'}, 2:{'A-B':'FA-Gen-II-B','B-B':'FA-Gen-II-B','C-B':'FA-Gen-II-B','A-G':'FA-Gen-II-G','B-G':'FA-Gen-II-G','C-G':'FA-Gen-II-G'} },
  'I.Com':           { 1:{'A-B':'I.Com-B','B-B':'I.Com-B','C-B':'I.Com-B','A-G':'I.Com-G','B-G':'I.Com-G','C-G':'I.Com-G'}, 2:{'A-B':'I.Com-II-B','B-B':'I.Com-II-B','C-B':'I.Com-II-B','A-G':'I.Com-II-G','B-G':'I.Com-II-G','C-G':'I.Com-II-G'} },
};
const getSuggestedSection = (pct: number, gender: string) => {
  const g = gender === 'Female' ? 'G' : 'B';
  if (pct >= 85) return `A-${g}`; if (pct >= 70) return `B-${g}`; return `C-${g}`;
};
const EMPTY_FORM: any = {
  applied_for:'Intermediate', program:'ICS Physics', part:1, session:'2026-27',
  student_name:'', b_form_nic:'', father_name:'', father_nic:'', father_occupation:'',
  student_dob:'', contact_home:'', cell_no:'', whatsapp_no:'', email:'',
  religion:'Islam', gender:'Male', current_address:'',
  matric_year:'', matric_roll_no:'', matric_marks:'', matric_subjects:'',
  matric_board:'BISE Gujranwala', matric_division:'', matric_percentage:'',
  inter_year:'', inter_roll_no:'', inter_marks:'', inter_subjects:'',
  inter_board:'BISE Gujranwala', inter_division:'',
  graduation_year:'', graduation_roll_no:'', graduation_marks:'', graduation_board:'', graduation_division:'',
  fee_package:40000, student_type:'Regular', is_fresher:true, num_instalments:1,
  notes: '',
};

// ── Shared UI primitives ──────────────────────────────────────────────────
const ProgressBar = ({ pct, color = '#0F766E', label, sub }: { pct: number; color?: string; label?: string; sub?: string }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      {(label || sub) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <p className="text-xs font-bold text-slate-800">{label}</p>}
          {sub   && <p className="text-[11px] font-black" style={{ color }}>{sub}</p>}
        </div>
      )}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${w}%` }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg,${color},${color}bb)` }}>
          <motion.div
            animate={{ x: ['-200%', '400%'] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear', delay: 0.8 }}
            className="absolute inset-y-0 w-1/3 bg-white/25" style={{ transform: 'skewX(-20deg)' }} />
        </motion.div>
      </div>
    </div>
  );
};

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

// ── Admission form field helpers (used in accountant mode) ────────────────
const F = ({ label, req, children }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
      {label}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const TI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="w-full border-b-2 border-slate-200 focus:border-blue-700 bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300" />
);
const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full border-b-2 border-slate-200 focus:border-blue-700 bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors appearance-none">{children}</select>
);

// ── RoleAssignModal (Principal only) ─────────────────────────────────────
const RoleAssignModal = ({ onClose, onSave, assignableRoles, principalName, GRADIENT }: any) => {
  const [form, setForm]     = useState({ full_name: '', username: '', role: assignableRoles[0] || '', password: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const submit = async () => {
    if (!form.full_name.trim() || !form.username.trim() || !form.role || !form.password.trim()) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      const { data: ex } = await supabase.from('admin_users').select('id').eq('username', form.username.trim()).single();
      if (ex) { setError('Username already taken'); setSaving(false); return; }
      const { data: newAdmin, error: adminErr } = await supabase.from('admin_users').insert([{
        full_name: form.full_name.trim().toUpperCase(), username: form.username.trim().toLowerCase(),
        role: form.role, password: form.password.trim(),
      }]).select().single();
      if (adminErr) throw adminErr;
      await supabase.from('staff_role_assignments').insert([{
        admin_user_id: newAdmin.id, full_name: newAdmin.full_name, username: newAdmin.username,
        role: form.role, assigned_by: principalName, notes: form.notes,
      }]);
      onSave(newAdmin);
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 backdrop-blur-sm bg-slate-900/40" />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
        <div className="h-1" style={{ background: GRADIENT }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-black text-slate-900 text-lg">Assign Staff Role</h3><p className="text-xs text-slate-400 mt-0.5">Creates portal login credentials</p></div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Staff member name" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="e.g. teacher_04" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Initial password" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500" /></div>
            </div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 bg-white font-medium">
                {assignableRoles.map((r: string) => <option key={r}>{r}</option>)}
              </select></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Subject, department..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500" /></div>
            {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">⚠️ {error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: GRADIENT }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <><UserPlus size={15} /> Assign Role</>}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── FeeGroupsTab Component ───────────────────────────────────────────────
const FeeGroupsTab = ({ adminData, GRADIENT, ACCENT, showToast, showErr, PKR }: any) => {
  const LEVEL_LABELS: Record<string, string> = { inter: 'Intermediate', university: 'University', all: 'All Levels' };
  const SUGGESTED_NAMES = ['Tuition Fee','Admission Fee','Exam Fee','Lab Fee','Library Fee','Sports Fee','Board Examination Fee','University Examination Fee','Computer Lab Fee','Development Fee'];

  const [fgGroups, setFgGroups]           = useState<any[]>([]);
  const [fgStudents, setFgStudents]       = useState<any[]>([]);
  const [fgLoading, setFgLoading]         = useState(true);
  const [showAddFg, setShowAddFg]         = useState(false);
  const [fgName, setFgName]               = useState('');
  const [fgLevel, setFgLevel]             = useState('inter');
  const [fgFixed, setFgFixed]             = useState(false);
  const [fgFixedAmt, setFgFixedAmt]       = useState('');
  const [fgWeight, setFgWeight]           = useState('1');
  const [fgSaving, setFgSaving]           = useState(false);
  const [editFg, setEditFg]               = useState<any>(null);
  const [editName, setEditName]           = useState('');
  const [editAmount, setEditAmount]       = useState('');
  const [editFixed, setEditFixed]         = useState(false);
  const [editFixedAmt, setEditFixedAmt]   = useState('');
  const [editWeight, setEditWeight]       = useState('1');
  const [editSaving, setEditSaving]       = useState(false);
  const [showAssignFg, setShowAssignFg]   = useState(false);
  const [fgAssignMode, setFgAssignMode]   = useState<'bulk'|'individual'>('bulk');
  const [fgAssignLevel, setFgAssignLevel] = useState('inter');
  const [fgSection, setFgSection]         = useState('');
  const [fgPkg, setFgPkg]                 = useState('');
  const [fgDue, setFgDue]                 = useState('');
  const [fgSelStu, setFgSelStu]           = useState<any>(null);
  const [fgStuSearch, setFgStuSearch]     = useState('');
  const [fgAssigning, setFgAssigning]     = useState(false);
  const [fgPreview, setFgPreview]         = useState<Record<string,number>>({});

  const splitPkg = (grps: any[], total: number) => {
    const r: Record<string,number> = {};
    let rem = total;
    grps.forEach(g => { if (g.is_fixed && g.fixed_amount) { r[g.id] = g.fixed_amount; rem -= g.fixed_amount; } });
    const vars = grps.filter(g => !g.is_fixed);
    const tw = vars.reduce((s,g) => s + (g.weight || 1), 0);
    if (tw > 0 && rem > 0) vars.forEach(g => { r[g.id] = Math.round(((g.weight||1)/tw)*rem); });
    return r;
  };

  const reload = async () => {
    const { data } = await supabase.from('fee_groups_config').select('*').order('name').order('amount');
    setFgGroups(data || []);
  };

  useEffect(() => {
    (async () => {
      setFgLoading(true);
      const [g, s] = await Promise.all([
        supabase.from('fee_groups_config').select('*').order('name').order('amount'),
        supabase.from('students').select('id,roll_no,full_name,class_section').order('full_name'),
      ]);
      setFgGroups(g.data || []); setFgStudents(s.data || []);
      setFgLoading(false);
    })();
  }, []);

  useEffect(() => {
    const pkg = Number(fgPkg);
    if (!pkg || !fgGroups.length) { setFgPreview({}); return; }
    const rel = fgGroups.filter(g => g.level === fgAssignLevel || g.level === 'all');
    setFgPreview(splitPkg(rel, pkg));
  }, [fgPkg, fgAssignLevel, fgGroups]);

  const addGroup = async () => {
    if (!fgName.trim()) { showErr('Enter a name'); return; }
    if (fgFixed && (!fgFixedAmt || Number(fgFixedAmt) <= 0)) { showErr('Enter fixed amount'); return; }
    setFgSaving(true);
    const { error } = await supabase.from('fee_groups_config').insert([{
      name: fgName.trim(), level: fgLevel, is_fixed: fgFixed,
      fixed_amount: fgFixed ? Number(fgFixedAmt) : null,
      weight: fgFixed ? 0 : Number(fgWeight) || 1,
      amount: fgFixed ? Number(fgFixedAmt) : 0,
    }]);
    setFgSaving(false);
    if (error) { showErr(error.message); return; }
    showToast(`"${fgName}" added`);
    setShowAddFg(false); setFgName(''); setFgFixed(false); setFgFixedAmt(''); setFgWeight('1');
    reload();
  };

  const openEdit = (g: any) => {
    setEditFg(g); setEditName(g.name); setEditAmount(String(g.amount || 0));
    setEditFixed(g.is_fixed); setEditFixedAmt(String(g.fixed_amount || '')); setEditWeight(String(g.weight || 1));
  };

  const saveEdit = async () => {
    if (!editFg) return;
    if (!editName.trim()) { showErr('Enter a name'); return; }
    if (editFixed && (!editFixedAmt || Number(editFixedAmt) <= 0)) { showErr('Enter fixed amount'); return; }
    setEditSaving(true);
    const { error } = await supabase.from('fee_groups_config').update({
      name: editName.trim(),
      amount: editFixed ? Number(editFixedAmt) : Number(editAmount) || 0,
      is_fixed: editFixed,
      fixed_amount: editFixed ? Number(editFixedAmt) : null,
      weight: editFixed ? 0 : Number(editWeight) || 1,
    }).eq('id', editFg.id);
    setEditSaving(false);
    if (error) { showErr(error.message); return; }
    showToast('Updated'); setEditFg(null); reload();
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await supabase.from('fee_groups_config').delete().eq('id', id);
    showToast('Deleted'); reload();
  };

  const assignFees = async () => {
    const pkg = Number(fgPkg);
    if (!pkg || pkg <= 0) { showErr('Enter package amount'); return; }
    if (!fgDue) { showErr('Select due date'); return; }
    const rel = fgGroups.filter(g => g.level === fgAssignLevel || g.level === 'all');
    if (!rel.length) { showErr('No groups for this level'); return; }
    const split = splitPkg(rel, pkg);
    let targets: any[] = [];
    if (fgAssignMode === 'bulk') {
      if (!fgSection) { showErr('Select a section'); return; }
      targets = fgStudents.filter(s => s.class_section === fgSection);
      if (!targets.length) { showErr('No students in that section'); return; }
    } else {
      if (!fgSelStu) { showErr('Select a student'); return; }
      targets = [fgSelStu];
    }
    setFgAssigning(true);
    const rows: any[] = [];
    for (const stu of targets) {
      for (const grp of rel) {
        rows.push({ student_roll: stu.roll_no, fees_group: grp.name, fees_code: grp.id.slice(0, 8).toUpperCase(), amount: split[grp.id] ?? 0, due_date: fgDue, status: 'Unpaid', paid: 0 });
      }
    }
    const rolls = [...new Set(targets.map((t: any) => t.roll_no))];
    for (const roll of rolls) { await supabase.from('students').update({ total_package: pkg }).eq('roll_no', roll); }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from('fee_groups').insert(rows.slice(i, i+200));
      if (error) { showErr(error.message); setFgAssigning(false); return; }
    }
    setFgAssigning(false);
    showToast(fgAssignMode === 'bulk' ? `Created for ${targets.length} students` : `Created for ${fgSelStu.full_name}`);
    setShowAssignFg(false); setFgPkg(''); setFgDue(''); setFgSelStu(null); setFgStuSearch('');
  };

  const relGroups = fgGroups.filter(g => g.level === fgAssignLevel || g.level === 'all');
  const sections  = [...new Set(fgStudents.map((s: any) => s.class_section))].sort();
  const filtStu   = fgStudents.filter((s: any) => s.full_name.toLowerCase().includes(fgStuSearch.toLowerCase()) || String(s.roll_no).includes(fgStuSearch));

  return (
    <motion.div key="fee-groups" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-black text-slate-900">Fee Groups</h2><p className="text-sm text-slate-500 mt-1">{fgGroups.length} templates · Click any group to edit it.</p></div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddFg(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}><Plus size={15} /> Add Group</button>
          <button onClick={() => setShowAssignFg(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white shadow-lg" style={{ background: GRADIENT }}><Users size={15} /> Assign Fees</button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-sm text-blue-700">
        <CreditCard size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p><strong>Click any group to edit.</strong> Fixed groups keep their exact amount always. Variable groups share the remainder by weight after fixed groups are deducted.</p>
      </div>
      {fgLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>
      ) : fgGroups.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center"><p className="text-slate-400 font-bold">No fee groups yet. Click "Add Group".</p></div>
      ) : (
        <div className="space-y-5">
          {(['inter','university','all'] as const).map(level => {
            const lvl = fgGroups.filter(g => g.level === level);
            if (!lvl.length) return null;
            return (
              <div key={level}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{LEVEL_LABELS[level]} ({lvl.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lvl.map(g => (
                    <div key={g.id} onClick={() => openEdit(g)}
                      className={cn('bg-white rounded-2xl border p-4 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all group', g.is_fixed ? 'border-amber-100 bg-amber-50/20 hover:border-amber-300' : 'border-slate-100 hover:border-emerald-200')}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', g.is_fixed ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>
                          {g.is_fixed ? <Lock size={16} /> : <Unlock size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{g.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{PKR(g.amount || 0)} · {g.is_fixed ? 'Fixed' : `Wt ${g.weight}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 flex items-center justify-center transition-all"><Save size={12} /></div>
                        <button onClick={e => { e.stopPropagation(); deleteGroup(g.id, g.name); }} className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      <AnimatePresence>
        {editFg && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditFg(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div><h3 className="font-black text-slate-900">Edit Fee Group</h3><p className="text-xs text-slate-400 mt-0.5">Changes apply to future assignments only</p></div>
                <button onClick={() => setEditFg(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Group Name</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500" /></div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div><p className="text-sm font-bold text-slate-800">Fixed Amount</p><p className="text-[10px] text-slate-400">Amount never changes regardless of package</p></div>
                  <button onClick={() => setEditFixed(v => !v)} className={cn('w-12 h-6 rounded-full transition-all relative', editFixed ? 'bg-amber-400' : 'bg-slate-200')}>
                    <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', editFixed ? 'left-7' : 'left-1')} />
                  </button>
                </div>
                {editFixed ? (
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fixed Amount (Rs)</label>
                    <input type="number" value={editFixedAmt} onChange={e => setEditFixedAmt(e.target.value)} placeholder="e.g. 1500" className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" /></div>
                ) : (
                  <>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Default Amount (Rs)</label>
                      <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500" /></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weight Ratio <span className="text-slate-300 normal-case">(higher = larger share of package)</span></label>
                      <input type="number" min="0.1" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="1" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500" /></div>
                  </>
                )}
              </div>
              <div className="p-5 border-t border-slate-100 flex gap-3">
                <button onClick={() => setEditFg(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                  {editSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD GROUP MODAL */}
      <AnimatePresence>
        {showAddFg && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddFg(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-black text-slate-900">New Fee Group</h3><button onClick={() => setShowAddFg(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
                  <input value={fgName} onChange={e => setFgName(e.target.value)} placeholder="e.g. Tuition Fee" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTED_NAMES.map(n => <button key={n} onClick={() => { setFgName(n); if (n.toLowerCase().includes('board') || n.toLowerCase().includes('examination')) { setFgFixed(true); if (!fgFixedAmt) setFgFixedAmt('1500'); } }} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all', fgName === n ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{n}</button>)}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Applies To</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['inter','university','all'] as const).map(l => <button key={l} onClick={() => setFgLevel(l)} className={cn('py-2.5 rounded-xl text-xs font-bold transition-all', fgLevel === l ? 'text-white' : 'bg-slate-50 text-slate-600 border border-slate-100')} style={fgLevel === l ? { background: GRADIENT } : {}}>{LEVEL_LABELS[l]}</button>)}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div><p className="text-sm font-bold text-slate-800">Fixed Amount</p><p className="text-[10px] text-slate-400">Never changes (e.g. Board fee)</p></div>
                  <button onClick={() => setFgFixed(v => !v)} className={cn('w-12 h-6 rounded-full transition-all relative', fgFixed ? 'bg-amber-400' : 'bg-slate-200')}><span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', fgFixed ? 'left-7' : 'left-1')} /></button>
                </div>
                {fgFixed ? (
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fixed Amount (Rs)</label><input type="number" value={fgFixedAmt} onChange={e => setFgFixedAmt(e.target.value)} placeholder="1500" className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" /></div>
                ) : (
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weight Ratio</label><input type="number" min="0.1" step="0.1" value={fgWeight} onChange={e => setFgWeight(e.target.value)} placeholder="1" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" /></div>
                )}
              </div>
              <div className="p-5 border-t border-slate-100">
                <button onClick={addGroup} disabled={fgSaving} className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                  {fgSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Fee Group'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN FEES MODAL */}
      <AnimatePresence>
        {showAssignFg && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignFg(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0"><h3 className="font-black text-slate-900">Assign Fee Groups</h3><button onClick={() => setShowAssignFg(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {(['bulk','individual'] as const).map(m => <button key={m} onClick={() => setFgAssignMode(m)} className={cn('py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all', fgAssignMode === m ? 'text-white' : 'bg-slate-50 text-slate-600 border border-slate-100')} style={fgAssignMode === m ? { background: GRADIENT } : {}}>{m === 'bulk' ? <Users size={13} /> : <User size={13} />}{m === 'bulk' ? 'Whole Section' : 'Individual'}</button>)}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['inter','university','all'] as const).map(l => <button key={l} onClick={() => setFgAssignLevel(l)} className={cn('py-2.5 rounded-xl text-xs font-bold transition-all', fgAssignLevel === l ? 'text-white' : 'bg-slate-50 text-slate-600 border border-slate-100')} style={fgAssignLevel === l ? { background: 'linear-gradient(135deg,#059669,#10b981)' } : {}}>{LEVEL_LABELS[l]}</button>)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{relGroups.length} group{relGroups.length !== 1 ? 's' : ''} will apply</p>
                </div>
                {fgAssignMode === 'bulk' ? (
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Section</label>
                    <select value={fgSection} onChange={e => setFgSection(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-white">
                      <option value="">Select section…</option>
                      {sections.map((s: any) => <option key={s} value={s}>{s} ({fgStudents.filter((st: any) => st.class_section === s).length} students)</option>)}
                    </select>
                  </div>
                ) : (
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Student</label>
                    {fgSelStu ? (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div><p className="text-sm font-black text-blue-900">{fgSelStu.full_name}</p><p className="text-[10px] text-blue-500 font-bold uppercase">{fgSelStu.roll_no} · {fgSelStu.class_section}</p></div>
                        <button onClick={() => { setFgSelStu(null); setFgStuSearch(''); }}><X size={15} className="text-blue-400" /></button>
                      </div>
                    ) : (
                      <>
                        <input value={fgStuSearch} onChange={e => setFgStuSearch(e.target.value)} placeholder="Search name or roll no…" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                        {fgStuSearch.length > 1 && (
                          <div className="bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto mt-1">
                            {filtStu.slice(0,10).map((s: any) => <button key={s.id} onClick={() => { setFgSelStu(s); setFgStuSearch(''); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-none"><span className="font-bold text-slate-900">{s.full_name}</span><span className="text-[10px] text-slate-400 ml-2">{s.roll_no} · {s.class_section}</span></button>)}
                            {!filtStu.length && <p className="px-4 py-3 text-sm text-slate-400">No results</p>}
                          </div>
                        )}
                      </>
                    )}</div>
                )}
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Package Amount (Rs)</label><input type="number" value={fgPkg} onChange={e => setFgPkg(e.target.value)} placeholder="e.g. 40000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label><input type="date" value={fgDue} onChange={e => setFgDue(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" /></div>
                {Object.keys(fgPreview).length > 0 && relGroups.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Split Preview</p>
                    {relGroups.map(g => (
                      <div key={g.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">{g.is_fixed ? <Lock size={11} className="text-amber-400" /> : <Unlock size={11} className="text-emerald-400" />}<span className="text-sm font-bold text-slate-700">{g.name}</span>{g.is_fixed && <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded">Fixed</span>}</div>
                        <span className="text-sm font-black" style={{ color: ACCENT }}>{PKR(fgPreview[g.id] ?? 0)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex justify-between"><span className="text-xs font-black text-slate-500 uppercase">Total</span><span className="text-sm font-black text-emerald-600">{PKR(Object.values(fgPreview).reduce((a: number,b: number) => a+b, 0))}</span></div>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button onClick={assignFees} disabled={fgAssigning} className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: GRADIENT }}>
                  {fgAssigning ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : fgAssignMode === 'bulk' ? 'Assign to Section' : 'Assign to Student'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, adminData }) => {
  const isAccountant = adminData.role === 'Accountant';
  const { ACCENT, GRADIENT } = getTheme(adminData.role);

  const [tab, setTab]               = useState('dashboard');
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg]     = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [moreOpen, setMoreOpen]     = useState(false);

  // ── Principal state ────────────────────────────────────────────────────
  const [stats,           setStats]           = useState<any>({});
  const [students,        setStudents]        = useState<any[]>([]);
  const [classSummary,    setClassSummary]    = useState<any[]>([]);
  const [notifications,   setNotifications]   = useState<any[]>([]);
  const [admForms,        setAdmForms]        = useState<any[]>([]);
  const [staffList,       setStaffList]       = useState<any[]>([]);
  const [schemeList,      setSchemeList]      = useState<any[]>([]);
  const [allPermissions,  setAllPermissions]  = useState<Record<string, any>>({});
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);
  const [leaveRequests,   setLeaveRequests]   = useState<any[]>([]);
  const [searchQ,         setSearchQ]         = useState('');
  const [filterProgram,   setFilterProgram]   = useState('');
  const [filterSection,   setFilterSection]   = useState('');
  const [showNotifs,      setShowNotifs]      = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editPermRole,    setEditPermRole]    = useState<any>(null);
  const [admFilter,       setAdmFilter]       = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [studentLoading,  setStudentLoading]  = useState(false);
  const [leaveSaving,     setLeaveSaving]     = useState<string | null>(null);

  // ── Accountant state ───────────────────────────────────────────────────
  const [feeGroups,    setFeeGroups]    = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [discounts,    setDiscounts]    = useState<any[]>([]);
  const [expenses,     setExpenses]     = useState<any[]>([]);
  const [income,       setIncome]       = useState<any[]>([]);
  const [nextRoll,     setNextRoll]     = useState(2527290);
  const [discSaving,   setDiscSaving]   = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [preview,      setPreview]      = useState<any>(null);
  const [selectedAccStu,  setSelectedAccStu]  = useState<any>(null);
  const [stuFeeGroups,    setStuFeeGroups]    = useState<any[]>([]);
  const [stuFeeLoading,   setStuFeeLoading]   = useState(false);
  const [collectModal,    setCollectModal]    = useState<any>(null);
  const [feePayForm,      setFeePayForm]      = useState({ amount: '', method: 'Cash', receipt: '' });
  const [ledgerProgram,   setLedgerProgram]   = useState('');
  const [ledgerSection,   setLedgerSection]   = useState('');
  const [ledgerStatus,    setLedgerStatus]    = useState('');
  const [printTx,         setPrintTx]         = useState<any>(null);

  const [admForm, setAdmForm] = useState<any>({ ...EMPTY_FORM });
  const pct = Number(admForm.matric_percentage) || 0;
  const sec = pct > 0 ? getSuggestedSection(pct, admForm.gender) : '';
  const cls = sec ? CLASS_MAP[admForm.program]?.[admForm.part]?.[sec] || '' : '';
  const setF = (k: string, v: any) => setAdmForm((p: any) => ({ ...p, [k]: v }));

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh   = () => setRefreshKey(k => k + 1);

  const handlePrint = (tx: any) => {
    setPrintTx(tx);
    showToast("Generating receipt...");
  };

  useEffect(() => {
    if (printTx) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print error:", err);
          showErr("Print blocked by browser. Please try in a new tab.");
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [printTx]);

  useEffect(() => {
    const onAfterPrint = () => setPrintTx(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  // ── Load: Principal ────────────────────────────────────────────────────
  const loadPrincipal = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [s1, s2, s3, s4, s5, s6] = await Promise.all([
      supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,gender,status,total_xp,current_badge').order('class_section').order('full_name'),
      supabase.from('academics_class_summary').select('*'),
      supabase.from('admin_notifications').select('*').in('target_role', ['Principal', 'VP', 'Director']).order('created_at', { ascending: false }).limit(30),
      supabase.from('admission_forms').select('*').order('created_at', { ascending: false }).limit(60),
      supabase.from('attendance').select('status').eq('date', today),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const studs   = s1.data || [];
    const present = (s5.data || []).filter((a: any) => a.status === 'Present').length;
    const absent  = (s5.data || []).filter((a: any) => a.status === 'Absent').length;
    const total   = (s5.data || []).length;
    setStats({ totalStu: studs.filter(s => s.status === 'Active').length, maleStudents: studs.filter(s => s.gender === 'Male').length, femaleStudents: studs.filter(s => s.gender === 'Female').length, present, absent, attPct: total > 0 ? Math.round((present / total) * 100) : 0 });
    setStudents(studs); setClassSummary(s2.data || []); setNotifications(s3.data || []);
    setAdmForms(s4.data || []); setLeaveRequests(s6.data || []);
    setLoading(false);
  }, []);

  // ── Load: Accountant ───────────────────────────────────────────────────
  const loadAccountant = useCallback(async () => {
    setLoading(true);
    const [s1, s2, s3, s4, s5, s6, s7, s8] = await Promise.all([
      supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,status,total_package,paid_amount,current_badge,total_xp,gender').order('roll_no', { ascending: false }),
      supabase.from('fee_groups').select('*').order('created_at', { ascending: false }).limit(600),
      supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(150),
      supabase.from('discount_requests').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(50),
      supabase.from('income').select('*').order('income_date', { ascending: false }).limit(50),
      supabase.from('admission_forms').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('roll_no').lt('roll_no', 9999999).order('roll_no', { ascending: false }).limit(1),
    ]);
    setStudents(s1.data || []); setFeeGroups(s2.data || []); setTransactions(s3.data || []);
    setDiscounts(s4.data || []); setExpenses(s5.data || []); setIncome(s6.data || []);
    setAdmForms(s7.data || []);
    if (s8.data?.[0]) setNextRoll(s8.data[0].roll_no + 1);
    setLoading(false);
  }, []);

  const loadStaff = async () => { const { data } = await supabase.from('admin_users').select('id,full_name,username,role').order('role'); setStaffList(data || []); };
  const loadScheme = async () => { const { data } = await supabase.from('scheme_of_study').select('*').order('week_no'); setSchemeList(data || []); };
  const loadPermissions = async () => {
    const { data } = await supabase.from('role_permissions').select('*');
    const map: Record<string, any> = {};
    (data || []).forEach((r: any) => { map[r.role] = r; });
    setAllPermissions(map);
    const pp = map['Principal']; if (pp) setAssignableRoles(pp.assignable_roles || []);
  };

  useEffect(() => {
    if (isAccountant) { loadAccountant(); }
    else { loadPrincipal(); loadStaff(); loadPermissions(); loadScheme(); }
  }, [refreshKey]);

  // ── Principal actions ──────────────────────────────────────────────────
  const openStudentDetail = async (student: any) => {
    setSelectedStudent(student); setStudentLoading(true);
    const { data } = await supabase.from('student_course_progress').select('*').eq('student_roll', student.roll_no).order('subject');
    setStudentProgress(data || []); setStudentLoading(false);
  };

  const handleLeave = async (id: string, action: 'Approved' | 'Rejected') => {
    setLeaveSaving(id);
    try {
      await supabase.from('leave_requests').update({ status: action, reviewed_by: adminData.full_name, reviewed_at: new Date().toISOString(), vp_decision: action }).eq('id', id);
      showToast(`✅ Leave ${action.toLowerCase()}`); refresh();
    } catch (e: any) { showErr(e.message); }
    finally { setLeaveSaving(null); }
  };

  const savePermission = async (role: string, perms: any) => {
    await supabase.from('role_permissions').update({ permissions: perms, updated_by: adminData.full_name, updated_at: new Date().toISOString() }).eq('role', role);
    showToast(`✅ Permissions updated for ${role}`); loadPermissions(); setEditPermRole(null);
  };

  const deactivateStaff = async (userId: string, username: string) => {
    if (!confirm(`Deactivate ${username}? They will lose portal access.`)) return;
    await supabase.from('admin_users').delete().eq('id', userId);
    await supabase.from('staff_role_assignments').update({ is_active: false }).eq('admin_user_id', userId);
    showToast(`✅ ${username} deactivated`); loadStaff();
  };

  // ── Accountant: open student profile (loads results + fee summary) ─────
  const openAccStudentProfile = async (student: any) => {
    const isSelected = selectedAccStu?.roll_no === student.roll_no;
    if (isSelected) { setSelectedAccStu(null); setStuFeeGroups([]); return; }
    setSelectedAccStu(student);
    setStuFeeLoading(true);
    const [progress, fees] = await Promise.all([
      supabase.from('student_course_progress').select('*').eq('student_roll', student.roll_no).order('subject'),
      supabase.from('fee_groups').select('*').eq('student_roll', student.roll_no).order('due_date'),
    ]);
    setStudentProgress(progress.data || []);
    setStuFeeGroups(fees.data || []);
    setStuFeeLoading(false);
  };

  // ── Accountant actions ─────────────────────────────────────────────────
  const saveAdmission = async () => {
    if (!admForm.student_name.trim() || !admForm.father_name.trim()) { showErr('Student name and father name are required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('admission_forms').insert([{
        ...admForm,
        student_name:      admForm.student_name.trim().toUpperCase(),
        father_name:       admForm.father_name.trim().toUpperCase(),
        matric_marks:      admForm.matric_marks      ? Number(admForm.matric_marks)      : null,
        matric_percentage: admForm.matric_percentage ? Number(admForm.matric_percentage) : null,
        inter_marks:       admForm.inter_marks       ? Number(admForm.inter_marks)       : null,
        graduation_marks:  admForm.graduation_marks  ? Number(admForm.graduation_marks)  : null,
        fee_package: Number(admForm.fee_package),
        suggested_section: sec, suggested_class: cls,
        status: 'Pending', synced_to_db: false,
        created_by: adminData.full_name, form_no: '',
        notes: admForm.notes || '',
      }]);
      if (error) throw error;
      showToast('✅ Admission form saved'); setAdmForm({ ...EMPTY_FORM }); setTab('admissions'); refresh();
    } catch (e: any) { showErr(e.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const confirmToDatabase = async (f: any) => {
    setSaving(true);
    try {
      const roll = nextRoll, username = `stu_${roll}`, password = `PIC${roll}`;
      const { error: se } = await supabase.from('students').insert([{
        roll_no: roll, full_name: f.student_name, father_name: f.father_name,
        gender: f.gender, program: f.program, part: f.part,
        class_section: f.suggested_class || CLASS_MAP[f.program]?.[f.part]?.['B-B'] || 'TBD',
        total_package: f.fee_package || 40000, paid_amount: 0, status: 'Active',
        username, password, total_xp: 0, profile_xp: 0, current_badge: 'Newcomer',
      }]);
      if (se) throw se;
      await supabase.from('fee_groups').insert([
        { student_roll: roll, fees_group: 'Admission Fee',       fees_code: 'ADM-001', due_date: '2026-01-15', amount: 2500,  paid: 0, status: 'Unpaid' },
        { student_roll: roll, fees_group: 'Tuition Fee - Term 1',fees_code: 'TUI-T1',  due_date: '2026-03-10', amount: 13000, paid: 0, status: 'Unpaid' },
        { student_roll: roll, fees_group: 'Tuition Fee - Term 2',fees_code: 'TUI-T2',  due_date: '2026-06-10', amount: 13000, paid: 0, status: 'Unpaid' },
        { student_roll: roll, fees_group: 'Tuition Fee - Term 3',fees_code: 'TUI-T3',  due_date: '2026-09-10', amount: 9000,  paid: 0, status: 'Unpaid' },
        { student_roll: roll, fees_group: 'Examination Fee',     fees_code: 'EXM-001', due_date: '2026-11-01', amount: 1500,  paid: 0, status: 'Unpaid' },
        { student_roll: roll, fees_group: 'Student Card Fee',    fees_code: 'SCD-001', due_date: '2026-01-15', amount: 500,   paid: 0, status: 'Unpaid' },
      ]);
      await supabase.from('admission_forms').update({
        status: 'Approved', synced_to_db: true, student_roll_no: roll,
        approved_by: adminData.full_name, approved_at: new Date().toISOString(),
        accountant_confirmed: true, accountant_confirmed_by: adminData.full_name,
        accountant_confirmed_at: new Date().toISOString(),
      }).eq('id', f.id);
      setNextRoll(roll + 1);
      showToast(`✅ ${f.student_name} enrolled → Roll #${roll}`);
      setPreview(null); refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const rejectForm = async (f: any) => {
    await supabase.from('admission_forms').update({ status: 'Rejected', approved_by: adminData.full_name }).eq('id', f.id);
    showToast('Form rejected'); setPreview(null); refresh();
  };

  const approveDiscount = async (d: any) => {
    setDiscSaving(d.id);
    try {
      await supabase.from('discount_requests').update({ status: 'Approved', reviewed_by: adminData.full_name, reviewed_at: new Date().toISOString(), applied: true }).eq('id', d.id);
      await supabase.from('fee_groups').update({ discount: d.discount_amount }).eq('student_roll', d.student_roll).eq('status', 'Unpaid').limit(1);
      showToast('✅ Discount approved & applied'); refresh();
    } catch { showErr('Failed'); }
    finally { setDiscSaving(null); }
  };
  const rejectDiscount = async (d: any) => {
    await supabase.from('discount_requests').update({ status: 'Rejected', reviewed_by: adminData.full_name, reviewed_at: new Date().toISOString() }).eq('id', d.id);
    showToast('Discount rejected'); refresh();
  };

  const collectFee = async () => {
    if (!collectModal) return;
    const amt = Number(feePayForm.amount);
    if (!amt || amt <= 0) { showErr('Enter a valid amount'); return; }
    if (amt > collectModal.balance) { showErr(`Amount exceeds balance of ${PKR(collectModal.balance)}`); return; }
    setSaving(true);
    try {
      const newPaid   = (collectModal.paid || 0) + amt;
      const newBalance = (collectModal.balance || 0) - amt;
      const newStatus = newBalance === 0 ? 'Paid' : 'Partial';
      await supabase.from('fee_groups').update({ paid: newPaid, status: newStatus }).eq('id', collectModal.id);
      await supabase.from('fee_transactions').insert([{
        student_roll_link: String(collectModal.student_roll),
        amount_paid: amt, payment_method: feePayForm.method,
        receipt_serial: feePayForm.receipt || null, collected_by: adminData.full_name,
        payment_date: new Date().toISOString(), transaction_type: 'Payment',
        fee_group_id: collectModal.id, confirmed_by: adminData.full_name,
      }]);
      showToast(`✅ Rs ${amt.toLocaleString('en-PK')} collected`);
      setCollectModal(null); setFeePayForm({ amount: '', method: 'Cash', receipt: '' }); refresh();
    } catch (e: any) { showErr(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  // ── Computed ───────────────────────────────────────────────────────────
  const unreadNotifs   = notifications.filter(n => !n.is_read).length;
  const pendingLeaves  = leaveRequests.filter(l => !l.status || l.status === 'Pending').length;
  const pendingAdm     = admForms.filter(f => f.status === 'Pending').length;
  const pendingDisc    = discounts.filter(d => d.status === 'Pending').length;
  const paidGroups     = feeGroups.filter(g => g.status === 'Paid').length;
  const unpaidGroups   = feeGroups.filter(g => g.status === 'Unpaid').length;
  const partialGroups  = feeGroups.filter(g => g.status === 'Partial').length;
  const totalGroups    = feeGroups.length || 1;
  const today          = new Date().toISOString().slice(0, 10);
  const todayTx        = transactions.filter(t => t.payment_date?.startsWith(today));
  const todayRevenue   = todayTx.reduce((s, t) => s + Number(t.amount_paid || 0), 0);
  const totalBalance   = feeGroups.reduce((s, g) => s + (g.balance || 0), 0);
  const totalFines     = feeGroups.reduce((s, g) => s + (g.fine || 0), 0);

  const filteredStudents = students.filter(s => {
    if (filterProgram && s.program !== filterProgram) return false;
    if (filterSection && s.class_section !== filterSection) return false;
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || String(s.roll_no).includes(q) || s.class_section?.toLowerCase().includes(q) || s.father_name?.toLowerCase().includes(q);
  });

  const filteredSectionOptions = students
    .filter(s => !filterProgram || s.program === filterProgram)
    .map(s => s.class_section).filter((v, i, a) => a.indexOf(v) === i).sort();
  const filteredAdmForms = admForms.filter(f => !admFilter || f.status === admFilter);

  // ── NAV definitions ────────────────────────────────────────────────────
  const PRINCIPAL_NAV = [
    { id: 'dashboard',   label: 'Dashboard',  icon: Home },
    { id: 'students',    label: 'Students',   icon: Users },
    { id: 'academics',   label: 'Academics',  icon: GraduationCap },
    { id: 'leaves',      label: 'Leaves',     icon: Calendar },
    { id: 'admissions',  label: 'Admissions', icon: FileText },
    { id: 'staff',       label: 'Staff',      icon: UserCog },
    { id: 'permissions', label: 'Perms',      icon: Shield },
    { id: 'scheme',      label: 'Scheme',     icon: BookOpen },
  ];
  const ACCOUNTANT_NAV = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Home },
    { id: 'fee-ledger',    label: 'Fee Ledger',    icon: DollarSign },
    { id: 'fee-groups',    label: 'Fee Groups',    icon: CreditCard },
    { id: 'transactions',  label: 'Transactions',  icon: Receipt },
    { id: 'admissions',    label: 'Admissions',    icon: FileText },
    { id: 'new-admission', label: 'New Admission', icon: UserPlus },
    { id: 'discounts',     label: 'Discounts',     icon: Tag },
    { id: 'students',      label: 'Students',      icon: Users },
    { id: 'reports',       label: 'Reports',       icon: BarChart3 },
  ];

  const NAV            = isAccountant ? ACCOUNTANT_NAV : PRINCIPAL_NAV;
  const MOBILE_PRIMARY = NAV.slice(0, 4);
  const MOBILE_MORE    = NAV.slice(4);

  const getBadge = (id: string) => {
    if (id === 'leaves')     return !isAccountant && pendingLeaves > 0 ? pendingLeaves : 0;
    if (id === 'admissions') return isAccountant   && pendingAdm > 0   ? pendingAdm   : 0;
    if (id === 'discounts')  return isAccountant   && pendingDisc > 0  ? pendingDisc  : 0;
    return 0;
  };

  const TAB_TITLE: Record<string, string> = {
    dashboard: isAccountant ? 'Accountant Overview' : 'Principal Overview',
    students: 'Student Records', academics: 'Academic Overview',
    leaves: 'Leave Requests', admissions: 'Admissions',
    'new-admission': 'New Admission Form', 'fee-ledger': 'Fee Ledger',
    'fee-groups': 'Fee Groups', transactions: 'Transactions',
    discounts: 'Discount Requests', reports: 'Financial Reports',
    staff: 'Staff & Role Management', permissions: 'Permission Control', scheme: 'Scheme of Study',
  };

  const portalLabel = isAccountant ? 'Accountant Portal' : 'Principal Portal';
  const SidebarIcon = isAccountant ? CreditCard : GraduationCap;

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-10" style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRADIENT }}><SidebarIcon size={18} className="text-white" /></div>
            <div><p className="font-black text-slate-900 text-sm">PIC Campus</p><p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-widest">{portalLabel}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id; const badgeN = getBadge(id);
            return (
              <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: 2 }}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left', active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                style={active ? { background: GRADIENT } : {}}>
                <Icon size={16} /><span className="flex-1">{label}</span>
                {badgeN > 0 && <span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center" style={{ background: '#C0392B' }}>{badgeN > 9 ? '9+' : badgeN}</span>}
              </motion.button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ background: GRADIENT }}>{adminData.full_name?.charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-800 truncate">{adminData.full_name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{adminData.role}</p></div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"><LogOut size={13} /> Sign Out</button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between" style={{ boxShadow: '0 1px 10px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}><SidebarIcon size={14} className="text-white" /></div>
          <div><p className="font-black text-slate-900 text-sm leading-none">{adminData.role}</p><p className="text-[9px] font-bold" style={{ color: ACCENT }}>{adminData.full_name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">{savedMsg}</span>}
          {!isAccountant && (
            <button onClick={() => setShowNotifs(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
              <Bell size={16} className="text-slate-600" />
              {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ background: ACCENT }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
            </button>
          )}
          <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-0">
        <div className="hidden md:flex sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-8 py-4 items-center justify-between" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="text-xl font-black text-slate-900">{TAB_TITLE[tab] || portalLabel}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            {savedMsg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={13} />{savedMsg}</motion.div>}
            {errorMsg  && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"><AlertTriangle size={13} />{errorMsg}</motion.div>}
            {!isAccountant && (
              <button onClick={() => setShowNotifs(true)} className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <Bell size={14} />{unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] font-black flex items-center justify-center" style={{ background: ACCENT }}>{unreadNotifs}</span>}
              </button>
            )}
            <button onClick={refresh} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">

            {/* ════ PRINCIPAL TABS ════ */}

            {!isAccountant && tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#042F2E 0%,#0F766E 60%,#0D9488 100%)', boxShadow: '0 12px 40px rgba(15,118,110,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10" style={{ background: '#5EEAD4', transform: 'translate(40%,-40%)' }} />
                  <p className="text-teal-300 text-[10px] font-black uppercase tracking-widest mb-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <h2 className="text-xl font-black text-white mb-4">Good day, {adminData.full_name.split(' ').slice(0, 2).join(' ')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    {[{ l: 'Total Students', v: stats.totalStu || 0 }, { l: 'Boys', v: stats.maleStudents || 0 }, { l: 'Girls', v: stats.femaleStudents || 0 }, { l: 'Attendance', v: `${stats.attPct || 0}%` }].map(({ l, v }) => (
                      <div key={l}><p className="text-teal-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users}         label="Total Students" value={stats.totalStu || 0}    sub={`${stats.maleStudents || 0}M · ${stats.femaleStudents || 0}F`} color="bg-teal-50 text-teal-600" />
                  <StatCard icon={UserCheck}     label="Present Today"  value={`${stats.attPct || 0}%`} sub={`${stats.present || 0} present`} color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={GraduationCap} label="Classes"        value={classSummary.length}    sub="Active sections"   color="bg-blue-50 text-blue-600" />
                  <StatCard icon={Calendar}      label="Pending Leaves" value={pendingLeaves}           sub="Awaiting decision" color="bg-amber-50 text-amber-600" alert={pendingLeaves > 0} />
                </div>
                {pendingLeaves > 0 && (
                  <div className="bg-white rounded-3xl border border-amber-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
                      <h3 className="font-black text-slate-900">⏳ Pending Leave Requests</h3>
                      <button onClick={() => setTab('leaves')} className="text-xs font-bold text-amber-600 hover:underline">View All →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {leaveRequests.filter(l => !l.status || l.status === 'Pending').slice(0, 3).map((l: any) => (
                        <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center flex-shrink-0">{(l.student_name || l.student_roll_no || 'S')?.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{l.student_name || `Roll #${l.student_roll_no}`}</p>
                            <p className="text-[11px] text-slate-400 truncate">{l.reason || l.leave_type || 'Leave request'} · {l.from_date || l.request_date || '—'}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Approved')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                              {leaveSaving === l.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} OK
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Rejected')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-50">
                              <X size={10} /> No
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">📊 Class Attendance Today</h3>
                    <button onClick={() => setTab('academics')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>Full Overview →</button>
                  </div>
                  <div className="p-5 space-y-3.5">
                    {classSummary.slice(0, 7).map((r: any) => {
                      const p = r.total_students > 0 ? Math.round(((r.present_today || 0) / r.total_students) * 100) : 0;
                      const color = p >= 75 ? '#059669' : p >= 50 ? '#D97706' : '#C0392B';
                      return <ProgressBar key={r.class_section} pct={p} color={color} label={r.class_section} sub={`${p}% · ${r.present_today || 0}/${r.total_students}`} />;
                    })}
                    {classSummary.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No class data yet</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scheme Entries</p><p className="text-3xl font-black" style={{ color: ACCENT }}>{schemeList.length}</p><p className="text-xs text-slate-400 mt-1">Topics uploaded</p></div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Staff Count</p><p className="text-3xl font-black" style={{ color: ACCENT }}>{staffList.length}</p><p className="text-xs text-slate-400 mt-1">Portal users</p></div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'students' && (
              <motion.div key="stu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <BookOpen size={16} className="text-teal-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-teal-900">Academic view only — fee data is not shown</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Active', v: stats.totalStu || 0, c: ACCENT }, { l: 'Boys', v: stats.maleStudents || 0, c: '#2563EB' }, { l: 'Girls', v: stats.femaleStudents || 0, c: '#9333EA' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black" style={{ color: c }}>{v}</p></div>
                  ))}
                </div>
                <AnimatePresence>
                  {selectedStudent && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="bg-white rounded-3xl border border-teal-200 overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ background: `hsl(${(selectedStudent.roll_no * 37) % 360},60%,50%)` }}>{selectedStudent.full_name?.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900">{selectedStudent.full_name}</p>
                            <p className="text-xs text-slate-500">Roll #{selectedStudent.roll_no} · {selectedStudent.class_section} · {selectedStudent.program} P{selectedStudent.part}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                      </div>
                      <div className="p-5 space-y-5">
                        <div>
                          <p className="font-black text-slate-900 text-sm mb-3">📚 Course Progress</p>
                          {studentLoading ? <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading...</span></div>
                            : studentProgress.length === 0 ? <p className="text-sm text-slate-400 italic">No progress data recorded yet</p>
                            : <div className="space-y-3.5">{studentProgress.map((cp: any) => { const p2 = cp.progress_pct || 0; const color = p2 >= 80 ? '#059669' : p2 >= 50 ? '#0891B2' : p2 >= 25 ? '#D97706' : '#C0392B'; return <ProgressBar key={cp.id} pct={p2} color={color} label={cp.subject} sub={`${cp.topics_done}/${cp.topics_total} topics · ${p2}%`} />; })}</div>}
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                          <span className="text-2xl">{selectedStudent.current_badge?.split(' ')[0] || '🥉'}</span>
                          <div><p className="font-black text-slate-900 text-sm">{selectedStudent.current_badge || '🥉 Newcomer'}</p><p className="text-xs text-slate-400">{(selectedStudent.total_xp || 0).toLocaleString()} XP earned</p></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Name, roll, class section..." className="w-full border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500 bg-white transition-all" /></div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100"><p className="text-xs font-bold text-slate-500">{filteredStudents.length} students · click a row to view details</p></div>
                  <div className="overflow-x-auto" style={{ maxHeight: 480 }}>
                    <table className="w-full text-xs">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Roll', 'Name', 'Father', 'Class', 'Program', 'P', 'Gender', ''].map(h => <th key={h} className="px-3 md:px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s, i) => (
                          <motion.tr key={s.id || s.roll_no || i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.01, 0.2) }}
                            className={cn('border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors', selectedStudent?.roll_no === s.roll_no ? 'bg-teal-50/40' : '')}
                            onClick={() => openStudentDetail(s)}>
                            <td className="px-3 md:px-4 py-3 font-mono text-slate-400 text-[10px]">{s.roll_no}</td>
                            <td className="px-3 md:px-4 py-3 font-black text-slate-900 max-w-[120px] truncate">{s.full_name}</td>
                            <td className="px-3 md:px-4 py-3 text-slate-500 max-w-[100px] truncate">{s.father_name}</td>
                            <td className="px-3 md:px-4 py-3 text-slate-500 whitespace-nowrap">{s.class_section}</td>
                            <td className="px-3 md:px-4 py-3 text-slate-500 max-w-[80px] truncate">{s.program}</td>
                            <td className="px-3 md:px-4 py-3 text-slate-400">P{s.part}</td>
                            <td className="px-3 md:px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700')}>{s.gender}</span></td>
                            <td className="px-3 md:px-4 py-3"><Eye size={14} className="text-teal-400" /></td>
                          </motion.tr>
                        ))}
                        {filteredStudents.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">No students found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'academics' && (
              <motion.div key="acad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{ l: 'Classes', v: classSummary.length, c: 'text-teal-600', bg: 'bg-teal-50' }, { l: 'Students', v: classSummary.reduce((s: number, r: any) => s + (r.total_students || 0), 0), c: 'text-blue-600', bg: 'bg-blue-50' }, { l: 'Present', v: classSummary.reduce((s: number, r: any) => s + (r.present_today || 0), 0), c: 'text-emerald-600', bg: 'bg-emerald-50' }, { l: 'Absent', v: classSummary.reduce((s: number, r: any) => s + (r.absent_today || 0), 0), c: 'text-rose-600', bg: 'bg-rose-50' }].map(({ l, v, c, bg }) => (
                    <div key={l} className={cn('rounded-2xl p-4 border border-slate-100', bg)}><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</p><p className={cn('text-2xl font-black mt-1', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Attendance by Class</h3></div>
                  <div className="p-5 space-y-4">
                    {classSummary.map((r: any) => { const p2 = r.total_students > 0 ? Math.round(((r.present_today || 0) / r.total_students) * 100) : 0; const color = p2 >= 75 ? '#059669' : p2 >= 50 ? '#D97706' : '#C0392B'; return <ProgressBar key={r.class_section} pct={p2} color={color} label={`${r.class_section} · ${r.program} Part ${r.part}`} sub={`${p2}% · ${r.present_today || 0}/${r.total_students}`} />; })}
                    {classSummary.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No class data available</p>}
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Class-wise Detail</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead style={{ background: '#f8f9fd' }}><tr>{['Class', 'Program', 'Part', 'Students', 'Present', 'Absent', 'Avg %'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>
                        {classSummary.map((r: any, i: number) => (
                          <motion.tr key={r.id || r.class_section || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-black text-slate-900">{r.class_section}</td>
                            <td className="px-4 py-3 text-slate-600">{r.program}</td>
                            <td className="px-4 py-3 text-slate-500">Part {r.part}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{r.total_students}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{r.present_today || 0}</td>
                            <td className="px-4 py-3 font-bold text-rose-600">{r.absent_today || 0}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{r.avg_marks_pct ? `${r.avg_marks_pct}%` : '—'}</td>
                          </motion.tr>
                        ))}
                        {classSummary.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'leaves' && (
              <motion.div key="leaves" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Total', v: leaveRequests.length, c: 'text-slate-900' }, { l: 'Pending', v: pendingLeaves, c: 'text-amber-600' }, { l: 'Approved', v: leaveRequests.filter(l => l.status === 'Approved').length, c: 'text-emerald-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="space-y-3">
                  {leaveRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Calendar size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No leave requests yet</p></div>
                  ) : leaveRequests.map((l: any, i: number) => {
                    const isPending = !l.status || l.status === 'Pending';
                    return (
                      <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={cn('bg-white rounded-2xl overflow-hidden shadow-sm', isPending ? 'border-l-4 border border-amber-200' : 'border border-slate-100')}
                        style={isPending ? { borderLeftColor: '#D97706' } : {}}>
                        <div className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0', l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{(l.student_name || l.student_roll_no || 'S')?.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900">{l.student_name || `Roll #${l.student_roll_no}`}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{l.reason || l.leave_type || 'Leave request'}</p>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {(l.from_date || l.request_date) && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={10} />{l.from_date || l.request_date}{l.to_date && l.to_date !== l.from_date ? ` → ${l.to_date}` : ''}</span>}
                                {l.class_section && <span className="text-[11px] text-slate-400">{l.class_section}</span>}
                                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{l.status || 'Pending'}</span>
                              </div>
                            </div>
                            {isPending && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Approved')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                  {leaveSaving === l.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLeave(l.id, 'Rejected')} disabled={leaveSaving === l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-50">
                                  <X size={10} /> Reject
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'admissions' && (
              <motion.div key="adm-p" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <BookOpen size={16} className="text-teal-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-teal-900">View only. Processed by Admission Officer & Accountant.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{ v: '', l: 'All' }, { v: 'Pending', l: 'Pending' }, { v: 'Approved', l: 'Approved' }, { v: 'Rejected', l: 'Rejected' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setAdmFilter(v)} className={cn('px-4 py-1.5 rounded-xl text-xs font-black border transition-all', admFilter === v ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')} style={admFilter === v ? { background: GRADIENT } : {}}>{l} ({admForms.filter(f => !v || f.status === v).length})</button>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead style={{ background: '#f8f9fd' }}><tr>{['Form', 'Student', 'Father', 'Program', 'Section', '%', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredAdmForms.map((f: any, i: number) => (
                          <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold" style={{ color: ACCENT }}>{f.form_no}</td>
                            <td className="px-4 py-3 font-black text-slate-900">{f.student_name}</td>
                            <td className="px-4 py-3 text-slate-500">{f.father_name}</td>
                            <td className="px-4 py-3 text-slate-600"><p>{f.program}</p><p className="text-[10px] text-slate-400">Part {f.part}</p></td>
                            <td className="px-4 py-3">{f.suggested_section ? <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">{f.suggested_section}</span> : '—'}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{f.matric_percentage ? `${f.matric_percentage}%` : '—'}</td>
                            <td className="px-4 py-3"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', f.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : f.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{f.status}</span></td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                          </motion.tr>
                        ))}
                        {filteredAdmForms.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No forms found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'staff' && (
              <motion.div key="staff" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-lg font-black text-slate-900">Staff Management</h2><p className="text-xs text-slate-400 mt-0.5">You can assign: {assignableRoles.length > 0 ? assignableRoles.join(', ') : '—'}</p></div>
                  {assignableRoles.length > 0 && <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}><UserPlus size={15} /> Assign Role</motion.button>}
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3"><p className="text-sm font-bold text-teal-900">Principal manages: {assignableRoles.join(', ')}. Financial roles managed by VP/Director.</p></div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">All Staff ({staffList.length})</h3>
                    <button onClick={loadStaff} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100"><RefreshCw size={12} className="text-slate-500" /></button>
                  </div>
                  <div className="divide-y divide-slate-50" style={{ maxHeight: 480, overflowY: 'auto' }}>
                    {staffList.map((s: any, i: number) => {
                      const canManage = assignableRoles.includes(s.role);
                      const rc: Record<string, string> = { Director: 'bg-orange-100 text-orange-700', VP: 'bg-purple-100 text-purple-700', Principal: 'bg-teal-100 text-teal-700', Accountant: 'bg-emerald-100 text-emerald-700', Teacher: 'bg-blue-100 text-blue-700', Coordinator: 'bg-indigo-100 text-indigo-700', Examiner: 'bg-violet-100 text-violet-700', Academics: 'bg-cyan-100 text-cyan-700' };
                      return (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ background: `hsl(${(s.username?.charCodeAt(0) || 50) * 37 % 360},55%,45%)` }}>{s.full_name?.charAt(0)}</div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate">{s.full_name}</p><p className="text-[10px] text-slate-400">{s.username}</p></div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', rc[s.role] || 'bg-slate-100 text-slate-600')}>{s.role}</span>
                            {canManage && <motion.button whileTap={{ scale: 0.9 }} onClick={() => deactivateStaff(s.id, s.username)} className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 hover:bg-rose-100"><Trash2 size={12} /></motion.button>}
                          </div>
                        </motion.div>
                      );
                    })}
                    {staffList.length === 0 && <div className="px-5 py-10 text-center text-slate-400 text-sm">No staff found</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'permissions' && (
              <motion.div key="perms" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#042F2E,#0F766E)' }}>
                  <h2 className="text-xl font-black">Permission Control</h2>
                  <p className="text-teal-200 text-sm mt-1">Manage permissions for academic staff you oversee.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(allPermissions).filter(([role]) => assignableRoles.includes(role)).map(([role, permData]: [string, any]) => (
                    <div key={role} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: GRADIENT }}>{role.charAt(0)}</div><p className="font-black text-slate-900">{role}</p></div>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditPermRole({ role, perms: { ...(permData.permissions || {}) } })} className="px-3 py-1.5 rounded-xl text-xs font-black text-white" style={{ background: GRADIENT }}>Edit</motion.button>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {Object.entries(permData.permissions || {}).map(([k, v]: any) => (
                          <span key={k} className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', v === true ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{k.replace(/_/g, ' ')} {v === true ? '✓' : '✗'}</span>
                        ))}
                        {Object.keys(permData.permissions || {}).length === 0 && <span className="text-xs text-slate-400">No permissions set</span>}
                      </div>
                    </div>
                  ))}
                  {Object.entries(allPermissions).filter(([role]) => assignableRoles.includes(role)).length === 0 && (
                    <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400"><Shield size={28} className="mx-auto mb-3" /><p>No editable permissions</p></div>
                  )}
                </div>
                <AnimatePresence>
                  {editPermRole && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditPermRole(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden z-10 max-h-[85vh] flex flex-col" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
                        <div className="h-1" style={{ background: GRADIENT }} />
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0"><h3 className="font-black text-slate-900">Edit: {editPermRole.role}</h3><button onClick={() => setEditPermRole(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3">
                          {Object.entries(editPermRole.perms).map(([k, v]: any) => (
                            <div key={k} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                              <span className="text-sm font-bold text-slate-700">{k.replace(/_/g, ' ')}</span>
                              <button onClick={() => setEditPermRole((p: any) => ({ ...p, perms: { ...p.perms, [k]: !v } }))} className={cn('w-12 h-6 rounded-full transition-all flex items-center', v === true ? 'bg-teal-500' : 'bg-slate-300')}><div className={cn('w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5', v === true ? 'translate-x-6' : 'translate-x-0')} /></button>
                            </div>
                          ))}
                          <p className="text-xs text-slate-400 text-center pt-2">Changes take effect immediately after saving.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                          <button onClick={() => setEditPermRole(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={() => savePermission(editPermRole.role, editPermRole.perms)} className="flex-1 py-3 rounded-2xl text-white font-black text-sm" style={{ background: GRADIENT }}>Save Changes</motion.button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {!isAccountant && tab === 'scheme' && (
              <motion.div key="scheme" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {schemeList.length > 0 && (() => {
                  const bySub: Record<string, number> = {};
                  schemeList.forEach((s: any) => { bySub[s.subject] = (bySub[s.subject] || 0) + 1; });
                  const subs = Object.entries(bySub).sort((a, b) => b[1] - a[1]);
                  const maxCnt = Math.max(...subs.map(s => s[1]));
                  return (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <p className="font-black text-slate-900 mb-4 text-sm">Topics Uploaded by Subject</p>
                      <div className="space-y-2.5">{subs.map(([subject, count]) => <ProgressBar key={subject} pct={Math.round((count / maxCnt) * 100)} color={ACCENT} label={subject} sub={`${count} ${count === 1 ? 'entry' : 'entries'}`} />)}</div>
                    </div>
                  );
                })()}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Scheme of Study ({schemeList.length})</h3>
                    <button onClick={loadScheme} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"><RefreshCw size={12} className="text-slate-500" /></button>
                  </div>
                  {schemeList.length === 0 ? <div className="p-12 text-center text-slate-400"><BookOpen size={28} className="mx-auto mb-3" /><p>No entries yet</p></div> : (
                    <div className="overflow-x-auto" style={{ maxHeight: 480 }}>
                      <table className="w-full text-xs min-w-[600px]">
                        <thead className="sticky top-0" style={{ background: '#f8f9fd' }}><tr>{['Week', 'Month', 'Subject', 'Program', 'Part', 'Topic', 'By', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr></thead>
                        <tbody>
                          {schemeList.map((s: any, i: number) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-black" style={{ color: ACCENT }}>W{s.week_no}</td>
                              <td className="px-4 py-3 text-slate-600">{s.month || '—'}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{s.subject}</td>
                              <td className="px-4 py-3 text-slate-500">{s.program}</td>
                              <td className="px-4 py-3 text-slate-500">P{s.part}</td>
                              <td className="px-4 py-3 font-bold text-slate-900 max-w-[160px] truncate">{s.topic}</td>
                              <td className="px-4 py-3 text-slate-400">{s.uploaded_by}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {isAccountant && tab === 'fee-groups' && (
              <FeeGroupsTab adminData={adminData} GRADIENT={GRADIENT} ACCENT={ACCENT} showToast={showToast} showErr={showErr} PKR={PKR} />
            )}

            {/* ════ ACCOUNTANT DASHBOARD ════ */}
            {isAccountant && tab === 'dashboard' && (
              <motion.div key="acc-dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0d1b6e 0%,#1a2fa8 60%,#2952e3 100%)', boxShadow: '0 12px 40px rgba(26,47,168,0.3)' }}>
                  <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10 bg-blue-300" style={{ transform: 'translate(40%,-40%)' }} />
                  <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <h2 className="text-xl font-black text-white mb-4">Good day, {adminData.full_name.split(' ').slice(0, 2).join(' ')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    {[{ l: 'Total Balance Due', v: PKR(totalBalance) }, { l: 'Total Fines', v: PKR(totalFines) }, { l: "Today's Revenue", v: PKR(todayRevenue) }, { l: 'Pending Admissions', v: pendingAdm }].map(({ l, v }) => (
                      <div key={l}><p className="text-blue-400/70 text-[9px] font-black uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black">{v}</p></div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={DollarSign}  label="Balance Due"       value={PKR(totalBalance)} sub="Across all students"     color="bg-rose-50 text-rose-600"     alert={totalBalance > 0} />
                  <StatCard icon={Receipt}     label="Today's Revenue"   value={PKR(todayRevenue)} sub={`${todayTx.length} txns`} color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={FileText}    label="Pending Forms"     value={pendingAdm}        sub="Awaiting DB confirm"      color="bg-amber-50 text-amber-600"   alert={pendingAdm > 0} />
                  <StatCard icon={Tag}         label="Pending Discounts" value={pendingDisc}       sub="Awaiting review"          color="bg-purple-50 text-purple-600" alert={pendingDisc > 0} />
                </div>
                {pendingAdm > 0 && (
                  <div className="bg-white rounded-3xl border border-amber-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
                      <h3 className="font-black text-slate-900">⏳ Pending Admissions</h3>
                      <button onClick={() => setTab('admissions')} className="text-xs font-bold text-amber-600 hover:underline">View All →</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {admForms.filter(f => f.status === 'Pending').slice(0, 3).map((f: any) => (
                        <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center flex-shrink-0">{f.student_name?.charAt(0)}</div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate">{f.student_name}</p><p className="text-[11px] text-slate-400 truncate">{f.program} Part {f.part} · {f.form_no}</p></div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => confirmToDatabase(f)} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} OK
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPreview(f)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200"><Eye size={10} /> View</motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">📊 Fee Collection Status</h3>
                    <button onClick={() => setTab('fee-ledger')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>Full Ledger →</button>
                  </div>
                  <div className="p-5 space-y-3.5">
                    {[{ label: 'Paid', count: paidGroups, color: '#059669' }, { label: 'Partial', count: partialGroups, color: '#D97706' }, { label: 'Unpaid', count: unpaidGroups, color: '#C0392B' }].map(({ label, count, color }) => (
                      <ProgressBar key={label} pct={Math.round((count / totalGroups) * 100)} color={color} label={label} sub={`${count} · ${Math.round((count / totalGroups) * 100)}%`} />
                    ))}
                    {feeGroups.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No fee data yet</p>}
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">🧾 Recent Transactions</h3>
                    <button onClick={() => setTab('transactions')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>View All →</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {transactions.slice(0, 5).map((t: any, i: number) => (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.2) }} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0"><Receipt size={14} /></div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900">Roll #{t.student_roll_link}</p><p className="text-[11px] text-slate-400">{t.payment_method || '—'} · {t.collected_by || '—'}</p></div>
                        <div className="text-right"><p className="font-black text-emerald-600">{PKR(Number(t.amount_paid))}</p><p className="text-[9px] text-slate-400">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK') : '—'}</p></div>
                      </motion.div>
                    ))}
                    {!transactions.length && <p className="p-6 text-center text-slate-400 text-sm">No transactions yet</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Students</p><p className="text-3xl font-black" style={{ color: ACCENT }}>{students.length}</p><p className="text-xs text-slate-400 mt-1">Enrolled this session</p></div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Revenue</p><p className="text-3xl font-black text-emerald-600">{PKR(transactions.reduce((s, t) => s + Number(t.amount_paid || 0), 0))}</p><p className="text-xs text-slate-400 mt-1">All transactions</p></div>
                </div>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT FEE LEDGER — Fee collection happens here ════ */}
            {isAccountant && tab === 'fee-ledger' && (() => {
              const ledgerSectionOptions = students.filter(s => !ledgerProgram || s.program === ledgerProgram).map(s => s.class_section).filter((v, i, a) => a.indexOf(v) === i).sort();
              const ledgerFiltered = feeGroups.filter(g => {
                if (ledgerStatus && g.status !== ledgerStatus) return false;
                const st = students.find(s => s.roll_no === g.student_roll);
                if (ledgerProgram && (!st || st.program !== ledgerProgram)) return false;
                if (ledgerSection && (!st || st.class_section !== ledgerSection)) return false;
                if (!searchQ) return true;
                const q = searchQ.toLowerCase();
                return String(g.student_roll).includes(q) || st?.full_name?.toLowerCase().includes(q);
              });
              return (
                <motion.div key="ledger" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                    <DollarSign size={16} className="text-blue-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-blue-900">Fee Ledger — Click any unpaid row to collect payment from a student.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ l: 'Paid', v: paidGroups, c: '#059669', bg: 'bg-emerald-50' }, { l: 'Partial', v: partialGroups, c: '#D97706', bg: 'bg-amber-50' }, { l: 'Unpaid', v: unpaidGroups, c: '#C0392B', bg: 'bg-rose-50' }].map(({ l, v, c, bg }) => (
                      <div key={l} className={cn('rounded-2xl p-4 border border-slate-100 text-center', bg)}><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black" style={{ color: c }}>{v}</p></div>
                    ))}
                  </div>
                  {/* Filters */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Filters</p>
                      {(ledgerProgram || ledgerSection || ledgerStatus || searchQ) && (
                        <button onClick={() => { setLedgerProgram(''); setLedgerSection(''); setLedgerStatus(''); setSearchQ(''); }} className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all" style={{ color: ACCENT, background: `${ACCENT}12` }}><X size={11} /> Clear</button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Status</p>
                        <div className="flex gap-2 flex-wrap">
                          {[{ v: '', l: 'All', bg: GRADIENT }, { v: 'Unpaid', l: 'Unpaid', bg: 'linear-gradient(135deg,#C0392B,#e74c3c)' }, { v: 'Partial', l: 'Partial', bg: 'linear-gradient(135deg,#D97706,#f59e0b)' }, { v: 'Paid', l: 'Paid', bg: 'linear-gradient(135deg,#059669,#10b981)' }].map(({ v, l, bg }) => {
                            const active = ledgerStatus === v;
                            const cnt = v === '' ? feeGroups.length : feeGroups.filter(g => g.status === v).length;
                            return <motion.button key={v} whileTap={{ scale: 0.96 }} onClick={() => setLedgerStatus(v)} className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all" style={active ? { background: bg, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>{l} <span className="ml-1 text-[9px] opacity-70">{cnt}</span></motion.button>;
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Program</p>
                        <div className="flex gap-2 flex-wrap">
                          {PROGRAMS.map(prog => {
                            const active = ledgerProgram === prog;
                            return <motion.button key={prog} whileTap={{ scale: 0.96 }} onClick={() => { setLedgerProgram(active ? '' : prog); setLedgerSection(''); }} className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all" style={active ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>{prog}</motion.button>;
                          })}
                        </div>
                      </div>
                      <AnimatePresence>
                        {ledgerSectionOptions.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Section</p>
                            <div className="flex gap-2 flex-wrap">
                              {ledgerSectionOptions.map(sec => {
                                const active = ledgerSection === sec;
                                const cnt = feeGroups.filter(g => { const st2 = students.find(s => s.roll_no === g.student_roll); return st2?.class_section === sec; }).length;
                                return <motion.button key={sec} whileTap={{ scale: 0.96 }} onClick={() => setLedgerSection(active ? '' : sec)} className="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all" style={active ? { background: GRADIENT, color: '#fff', borderColor: 'transparent' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>{sec} <span className="ml-1 text-[9px] opacity-70">{cnt}</span></motion.button>;
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="relative pt-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by roll no or student name…" className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all" />
                      </div>
                    </div>
                  </div>
                  {/* Ledger table — clicking Collect opens the collect modal */}
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500">{ledgerFiltered.length} records{ledgerProgram ? ` · ${ledgerProgram}` : ''}{ledgerSection ? ` · ${ledgerSection}` : ''}{ledgerStatus ? ` · ${ledgerStatus}` : ''}</p>
                      <p className="text-[10px] font-black text-rose-600">Outstanding: {PKR(ledgerFiltered.reduce((s, g) => s + (g.balance || 0), 0))}</p>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
                      <table className="w-full text-xs min-w-[780px]">
                        <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                          <tr>{['Roll #', 'Name', 'Class', 'Fee Group', 'Amount', 'Discount', 'Fine', 'Paid', 'Balance', 'Status', 'Due Date', 'Action'].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {ledgerFiltered.slice(0, 200).map((g, i) => {
                            const st = students.find(s => s.roll_no === g.student_roll);
                            return (
                              <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.005, 0.3) }} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-mono font-bold" style={{ color: ACCENT }}>{g.student_roll}</td>
                                <td className="px-4 py-2.5 font-medium text-slate-900 max-w-[120px] truncate">{st?.full_name || '—'}</td>
                                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{st?.class_section || '—'}</td>
                                <td className="px-4 py-2.5 text-slate-700 max-w-[140px] truncate">{g.fees_group}</td>
                                <td className="px-4 py-2.5 font-bold text-slate-700">{PKR(g.amount)}</td>
                                <td className="px-4 py-2.5 text-emerald-600">{g.discount ? PKR(g.discount) : '—'}</td>
                                <td className="px-4 py-2.5 text-rose-500">{g.fine ? PKR(g.fine) : '—'}</td>
                                <td className="px-4 py-2.5 font-bold text-emerald-600">{PKR(g.paid)}</td>
                                <td className="px-4 py-2.5 font-black text-rose-700">{PKR(g.balance)}</td>
                                <td className="px-4 py-2.5"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', g.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : g.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>{g.status}</span></td>
                                <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{g.due_date || '—'}</td>
                                <td className="px-4 py-2.5">
                                  {g.status !== 'Paid' && g.balance > 0 && (
                                    <motion.button whileTap={{ scale: 0.95 }}
                                      onClick={() => { setCollectModal(g); setFeePayForm({ amount: String(g.balance), method: 'Cash', receipt: '' }); }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white"
                                      style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                      <DollarSign size={11} /> Collect
                                    </motion.button>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                          {ledgerFiltered.length === 0 && <tr><td colSpan={12} className="px-4 py-10 text-center text-slate-400">No records match filters</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* ════ ACCOUNTANT TRANSACTIONS ════ */}
            {isAccountant && tab === 'transactions' && (
              <motion.div key="txns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Total Transactions', v: transactions.length, c: 'text-slate-900' }, { l: "Today's Count", v: todayTx.length, c: 'text-blue-700' }, { l: "Today's Revenue", v: PKR(todayRevenue), c: 'text-emerald-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-xl font-black', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
                    <table className="w-full text-xs min-w-[700px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Date', 'Roll #', 'Amount', 'Method', 'Collected By', 'Type', 'Receipt', 'Confirmed By', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {transactions.map((t, i) => (
                          <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.008, 0.3) }} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}</td>
                            <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{t.student_roll_link}</td>
                            <td className="px-4 py-2.5 font-black text-emerald-600">{PKR(Number(t.amount_paid))}</td>
                            <td className="px-4 py-2.5 text-slate-600">{t.payment_method || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-600">{t.collected_by || '—'}</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700">{t.transaction_type || 'Payment'}</span></td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{t.receipt_serial || '—'}</td>
                            <td className="px-4 py-2.5">{t.confirmed_by ? <span className="text-emerald-600 font-bold text-[10px]">✓ {t.confirmed_by}</span> : <span className="text-amber-500 text-[10px]">Pending</span>}</td>
                            <td className="px-4 py-2.5 text-right">
                              <button 
                                onClick={() => handlePrint(t)} 
                                title="Print Receipt"
                                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all active:scale-90"
                              >
                                <Printer size={18} />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                        {!transactions.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No transactions yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT ADMISSIONS ════ */}
            {isAccountant && tab === 'admissions' && (
              <motion.div key="acc-adm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {[{ v: '', l: 'All' }, { v: 'Pending', l: 'Pending' }, { v: 'Approved', l: 'Approved' }, { v: 'Rejected', l: 'Rejected' }].map(({ v, l }) => (
                      <button key={v} onClick={() => setAdmFilter(v)} className={cn('px-4 py-1.5 rounded-xl text-xs font-black border transition-all', admFilter === v ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200')} style={admFilter === v ? { background: GRADIENT } : {}}>{l} ({admForms.filter(f => !v || f.status === v).length})</button>
                    ))}
                  </div>
                  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setTab('new-admission')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}><UserPlus size={15} /> New Admission</motion.button>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[640px]">
                      <thead style={{ background: '#f8f9fd' }}>
                        <tr>{['Form', 'Student', 'Father', 'Program', 'Section', '%', 'Status', 'Date', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filteredAdmForms.map((f: any, i: number) => (
                          <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold" style={{ color: ACCENT }}>{f.form_no}</td>
                            <td className="px-4 py-3 font-black text-slate-900">{f.student_name}</td>
                            <td className="px-4 py-3 text-slate-500">{f.father_name}</td>
                            <td className="px-4 py-3 text-slate-600"><p>{f.program}</p><p className="text-[10px] text-slate-400">Part {f.part}</p></td>
                            <td className="px-4 py-3">{f.suggested_section ? <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">{f.suggested_section}</span> : '—'}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{f.matric_percentage ? `${f.matric_percentage}%` : '—'}</td>
                            <td className="px-4 py-3"><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', f.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : f.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}>{f.status}</span></td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <button onClick={() => setPreview(f)} className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1"><Eye size={10} />View</button>
                                {f.status === 'Pending' && <>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => confirmToDatabase(f)} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                    {saving ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />} Confirm
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => rejectForm(f)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200"><X size={10} /> Reject</motion.button>
                                </>}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filteredAdmForms.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">No forms found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT NEW ADMISSION — with Notes field ════ */}
            {isAccountant && tab === 'new-admission' && (() => {
              const FA = '#c2410c';
              const FG = 'linear-gradient(135deg,#ea580c,#c2410c)';
              return (
                <motion.div key="new-adm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                    <div className="border-b-4 px-6 md:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderColor: FA }}>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center bg-orange-50 flex-shrink-0" style={{ borderColor: FA }}><GraduationCap size={28} style={{ color: FA }} /></div>
                        <div><p className="font-black text-slate-900 text-lg leading-tight">PAK INFORMATICS</p><p className="font-bold text-slate-600 text-sm">Group of Colleges</p><span className="text-white text-[9px] font-black px-2 py-0.5 rounded" style={{ background: FA }}>Gujranwala</span><p className="text-[10px] text-slate-400 mt-1">Saddar Bypass Road · 055-3200545</p></div>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-2xl font-black uppercase tracking-wide" style={{ color: FA }}>Admission Form</p>
                        <p className="text-sm text-slate-500 mt-1">Session: <strong>2026–27</strong></p>
                        <div className="mt-2 w-20 h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-bold ml-auto">PHOTO</div>
                      </div>
                    </div>
                    <div className="px-6 md:px-8 py-6 space-y-6">
                      <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
                        <F label="Form No."><div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black" style={{ color: FA }}>Auto-assigned</div></F>
                        <F label="Roll No."><div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black" style={{ color: FA }}>#{nextRoll}</div></F>
                        <F label="Session"><TS value={admForm.session} onChange={e => setF('session', e.target.value)}><option>2026-27</option><option>2025-26</option></TS></F>
                      </div>
                      <div className="pb-5 border-b border-slate-100 space-y-4">
                        <F label="Applied For" req>
                          <div className="flex flex-wrap gap-5 mt-2">
                            {['Intermediate', 'ADP/BS', 'BS 0*', 'Others'].map(o => (
                              <label key={o} className="flex items-center gap-2 cursor-pointer" onClick={() => setF('applied_for', o)}>
                                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={admForm.applied_for === o ? { background: FA, borderColor: FA } : { borderColor: '#94a3b8' }}>{admForm.applied_for === o && <div className="w-2 h-2 bg-white rounded-sm" />}</div>
                                <span className="text-sm text-slate-700">{o}</span>
                              </label>
                            ))}
                          </div>
                        </F>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <F label="Program" req><TS value={admForm.program} onChange={e => setF('program', e.target.value)}>{PROGRAMS.map(p => <option key={p}>{p}</option>)}</TS></F>
                          <F label="Part / Year" req><TS value={admForm.part} onChange={e => setF('part', Number(e.target.value))}><option value={1}>Part 1 (1st Year)</option><option value={2}>Part 2 (2nd Year)</option></TS></F>
                          <F label="Student Type"><TS value={admForm.student_type} onChange={e => setF('student_type', e.target.value)}><option>Regular</option><option>Summer Camp</option><option>Transfer</option></TS></F>
                        </div>
                      </div>
                      <div className="pb-5 border-b border-slate-100 space-y-4">
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest" style={{ background: FA }}>Personal Details</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <F label="Student's Name" req><TI placeholder="Full name as per B-Form" value={admForm.student_name} onChange={e => setF('student_name', e.target.value)} /></F>
                          <F label="B Form / NIC"><TI placeholder="_ _ _ _ _ - _ _ _ _ _ _ _ - _" value={admForm.b_form_nic} onChange={e => setF('b_form_nic', e.target.value)} /></F>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <F label="Father's Name" req><TI placeholder="Father's full name" value={admForm.father_name} onChange={e => setF('father_name', e.target.value)} /></F>
                          <F label="Father's NIC"><TI placeholder="_ _ _ _ _ - _ _ _ _ _ _ _ - _" value={admForm.father_nic} onChange={e => setF('father_nic', e.target.value)} /></F>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <F label="Father's Occupation"><TI placeholder="Business / Service / etc." value={admForm.father_occupation} onChange={e => setF('father_occupation', e.target.value)} /></F>
                          <F label="Student's D.O.B"><TI type="date" value={admForm.student_dob} onChange={e => setF('student_dob', e.target.value)} /></F>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <F label="Cell No."><TI placeholder="0300-XXXXXXX" value={admForm.cell_no} onChange={e => setF('cell_no', e.target.value)} /></F>
                          <F label="WhatsApp"><TI placeholder="0300-XXXXXXX" value={admForm.whatsapp_no} onChange={e => setF('whatsapp_no', e.target.value)} /></F>
                          <F label="Email"><TI type="email" placeholder="student@email.com" value={admForm.email} onChange={e => setF('email', e.target.value)} /></F>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <F label="Religion"><TS value={admForm.religion} onChange={e => setF('religion', e.target.value)}><option>Islam</option><option>Christianity</option><option>Hinduism</option><option>Other</option></TS></F>
                          <F label="Gender" req>
                            <div className="flex gap-6 mt-2">
                              {['Male', 'Female'].map(g => (
                                <label key={g} className="flex items-center gap-2 cursor-pointer" onClick={() => setF('gender', g)}>
                                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={admForm.gender === g ? { borderColor: FA } : { borderColor: '#94a3b8' }}>{admForm.gender === g && <div className="w-2 h-2 rounded-full" style={{ background: FA }} />}</div>
                                  <span className="text-sm text-slate-700">{g}</span>
                                </label>
                              ))}
                            </div>
                          </F>
                        </div>
                        <F label="Current Address"><textarea value={admForm.current_address} onChange={e => setF('current_address', e.target.value)} rows={2} placeholder="Street, Mohalla, City..." className="w-full border-b-2 border-slate-200 focus:border-blue-700 bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors resize-none" /></F>
                      </div>
                      <div className="space-y-3">
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest" style={{ background: FA }}>Academic Record</div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-xs min-w-[680px]">
                            <thead><tr style={{ background: FA }}>{['Particulars', 'Year', 'Roll No', 'Marks', 'Subjects', 'Board / University', 'Division', 'Remarks (%)'].map(h => <th key={h} className="px-3 py-2.5 text-left text-white font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr></thead>
                            <tbody>
                              <tr className="border-b border-slate-100 bg-slate-50/40">
                                <td className="px-3 py-3 font-black text-slate-700">Matric</td>
                                <td className="px-2 py-2"><TI placeholder="2024" value={admForm.matric_year} onChange={e => setF('matric_year', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Roll No" value={admForm.matric_roll_no} onChange={e => setF('matric_roll_no', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={admForm.matric_marks} onChange={e => setF('matric_marks', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Science" value={admForm.matric_subjects} onChange={e => setF('matric_subjects', e.target.value)} /></td>
                                <td className="px-2 py-2"><TS value={admForm.matric_board} onChange={e => setF('matric_board', e.target.value)}>{BOARDS.map(b => <option key={b}>{b}</option>)}</TS></td>
                                <td className="px-2 py-2"><TI placeholder="A/B/C" value={admForm.matric_division} onChange={e => setF('matric_division', e.target.value)} /></td>
                                <td className="px-2 py-2">
                                  <TI type="number" placeholder="%" value={admForm.matric_percentage} onChange={e => setF('matric_percentage', e.target.value)} />
                                  {pct > 0 && <div className="mt-1 px-2 py-0.5 rounded text-[9px] font-black inline-block bg-orange-50 border border-orange-200" style={{ color: FA }}>→ {sec}</div>}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="px-3 py-3 font-black text-slate-700">Intermediate</td>
                                <td className="px-2 py-2"><TI placeholder="2026" value={admForm.inter_year} onChange={e => setF('inter_year', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Roll No" value={admForm.inter_roll_no} onChange={e => setF('inter_roll_no', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={admForm.inter_marks} onChange={e => setF('inter_marks', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Subjects" value={admForm.inter_subjects} onChange={e => setF('inter_subjects', e.target.value)} /></td>
                                <td className="px-2 py-2"><TS value={admForm.inter_board} onChange={e => setF('inter_board', e.target.value)}>{BOARDS.map(b => <option key={b}>{b}</option>)}</TS></td>
                                <td className="px-2 py-2"><TI placeholder="A/B/C" value={admForm.inter_division} onChange={e => setF('inter_division', e.target.value)} /></td>
                                <td className="px-2 py-2 text-slate-300 text-[10px]">—</td>
                              </tr>
                              <tr>
                                <td className="px-3 py-3 font-black text-slate-700">Graduation</td>
                                <td className="px-2 py-2"><TI placeholder="Year" value={admForm.graduation_year} onChange={e => setF('graduation_year', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Roll No" value={admForm.graduation_roll_no} onChange={e => setF('graduation_roll_no', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={admForm.graduation_marks} onChange={e => setF('graduation_marks', e.target.value)} /></td>
                                <td className="px-2 py-2"><TI placeholder="Subjects" value={admForm.graduation_subjects} onChange={e => setF('graduation_subjects', e.target.value)} /></td>
                                <td className="px-2 py-2"><TS value={admForm.graduation_board} onChange={e => setF('graduation_board', e.target.value)}>{BOARDS.map(b => <option key={b}>{b}</option>)}</TS></td>
                                <td className="px-2 py-2"><TI placeholder="A/B/C" value={admForm.graduation_division} onChange={e => setF('graduation_division', e.target.value)} /></td>
                                <td className="px-2 py-2 text-slate-300 text-[10px]">—</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="pb-5 border-b border-slate-100 space-y-4">
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest" style={{ background: FA }}>Fee Package</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <F label="Annual Package (PKR)" req><TI type="number" value={admForm.fee_package} onChange={e => setF('fee_package', Number(e.target.value))} placeholder="40000" /></F>
                          <F label="No. of Instalments"><TS value={admForm.num_instalments} onChange={e => setF('num_instalments', Number(e.target.value))}><option value={1}>Full Payment</option><option value={2}>2 Instalments</option><option value={3}>3 Instalments</option><option value={4}>4 Instalments</option><option value={5}>5 Instalments</option><option value={6}>6 Instalments</option><option value={7}>7 Instalments</option><option value={8}>8 Instalments</option><option value={9}>9 Instalments</option><option value={10}>10 Instalments</option><option value={11}>11 Instalments</option><option value={12}>12 Instalments</option></TS></F>
                          <F label="Is Fresher?">
                            <div className="flex gap-6 mt-2">
                              {[true, false].map(v => (
                                <label key={String(v)} className="flex items-center gap-2 cursor-pointer" onClick={() => setF('is_fresher', v)}>
                                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={admForm.is_fresher === v ? { borderColor: FA } : { borderColor: '#94a3b8' }}>{admForm.is_fresher === v && <div className="w-2 h-2 rounded-full" style={{ background: FA }} />}</div>
                                  <span className="text-sm text-slate-700">{v ? 'Yes' : 'No'}</span>
                                </label>
                              ))}
                            </div>
                          </F>
                        </div>
                        {pct > 0 && sec && (
                          <div className="p-4 rounded-2xl border" style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
                            <p className="text-xs font-black" style={{ color: FA }}>Auto-assigned Section: <span className="text-slate-900 text-sm">{sec}</span></p>
                            <p className="text-xs font-black mt-0.5" style={{ color: FA }}>Class Code: <span className="text-slate-900 text-sm">{cls || 'TBD'}</span></p>
                          </div>
                        )}
                      </div>

                      {/* ══ NOTES FIELD — at the end of admission form ══ */}
                      <div className="pb-5 border-b border-slate-100 space-y-3">
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest" style={{ background: '#64748b' }}>Notes</div>
                        <F label="Additional Notes (optional)">
                          <textarea
                            value={admForm.notes || ''}
                            onChange={e => setF('notes', e.target.value)}
                            rows={3}
                            placeholder="Any additional information, special remarks, or notes about this student or admission…"
                            className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors resize-none placeholder:text-slate-300"
                          />
                        </F>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setAdmForm({ ...EMPTY_FORM })} className="px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Clear Form</button>
                        <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={saveAdmission}
                          className="flex-1 py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: FG, boxShadow: '0 6px 20px rgba(194,65,12,0.35)' }}>
                          {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Admission Form</>}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* ════ ACCOUNTANT DISCOUNTS ════ */}
            {isAccountant && tab === 'discounts' && (
              <motion.div key="disc" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Total', v: discounts.length, c: 'text-slate-900' }, { l: 'Pending', v: pendingDisc, c: 'text-amber-600' }, { l: 'Approved', v: discounts.filter(d => d.status === 'Approved').length, c: 'text-emerald-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="space-y-3">
                  {discounts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Tag size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No discount requests</p></div>
                  ) : discounts.map((d: any, i: number) => {
                    const st = students.find(s => s.roll_no === d.student_roll);
                    const isPending = d.status === 'Pending';
                    return (
                      <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={cn('bg-white rounded-2xl overflow-hidden shadow-sm', isPending ? 'border-l-4 border border-amber-200' : 'border border-slate-100')}
                        style={isPending ? { borderLeftColor: '#D97706' } : {}}>
                        <div className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0', d.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : d.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}><Tag size={16} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><p className="font-black text-slate-900">{st?.full_name || `Roll #${d.student_roll}`}</p><span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black', d.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : d.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{d.status || 'Pending'}</span></div>
                              <p className="text-xs text-slate-500 mt-0.5">{d.reason}</p>
                              <div className="flex items-center gap-3 mt-1.5"><span className="text-[11px] text-slate-400">Amount: <strong className="font-black" style={{ color: ACCENT }}>{PKR(d.discount_amount)}</strong></span>{d.reference_name && <span className="text-[11px] text-slate-400">Ref: {d.reference_name}</span>}</div>
                            </div>
                            {isPending && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => approveDiscount(d)} disabled={discSaving === d.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                  {discSaving === d.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => rejectDiscount(d)} disabled={discSaving === d.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-50"><X size={10} /> Reject</motion.button>
                              </div>
                            )}
                            {!isPending && d.reviewed_by && <p className="text-[10px] text-slate-400 flex-shrink-0">by {d.reviewed_by}</p>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT STUDENTS — Profile view only, no fee collection ════ */}
            {isAccountant && tab === 'students' && (
              <motion.div key="acc-stu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <GraduationCap size={16} className="text-blue-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-blue-900">Student Profiles — Click any row to view full profile including results, course progress and fee summary. To collect fees, use the <button onClick={() => setTab('fee-ledger')} className="underline font-black text-blue-700">Fee Ledger</button> tab.</p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Showing', v: filteredStudents.length, c: ACCENT }, { l: 'Total Enrolled', v: students.length, c: '#059669' }, { l: 'Fee Groups', v: feeGroups.length, c: '#D97706' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className="text-2xl font-black" style={{ color: c }}>{v}</p></div>
                  ))}
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Filter by Class</p>
                    {(filterProgram || filterSection || searchQ) && <button onClick={() => { setFilterProgram(''); setFilterSection(''); setSearchQ(''); }} className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all" style={{ color: ACCENT, background: `${ACCENT}12` }}><X size={11} /> Clear All</button>}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Program</p>
                      <div className="flex flex-wrap gap-2">
                        {PROGRAMS.map(prog => {
                          const count = students.filter(s => s.program === prog).length;
                          const active = filterProgram === prog;
                          return (
                            <motion.button key={prog} whileTap={{ scale: 0.96 }} onClick={() => { setFilterProgram(active ? '' : prog); setFilterSection(''); }} className={cn('px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all', active ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300')} style={active ? { background: GRADIENT, borderColor: 'transparent' } : {}}>
                              {prog} <span className={cn('ml-1 text-[9px]', active ? 'text-white/70' : 'text-slate-400')}>{count}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <AnimatePresence>
                      {filteredSectionOptions.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Section</p>
                          <div className="flex flex-wrap gap-2">
                            {filteredSectionOptions.map(sec => {
                              const count = students.filter(s => s.class_section === sec).length;
                              const active = filterSection === sec;
                              return <motion.button key={sec} whileTap={{ scale: 0.96 }} onClick={() => setFilterSection(active ? '' : sec)} className={cn('px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all', active ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300')} style={active ? { background: GRADIENT } : {}}>{sec} <span className={cn('ml-1 text-[9px]', active ? 'text-white/70' : 'text-slate-400')}>{count}</span></motion.button>;
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative pt-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search name, roll no, father name…" className="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Student table — click opens full profile panel */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">{filteredStudents.length} of {students.length} students · click a row to view full profile</p>
                  </div>
                  <div className="overflow-x-auto" style={{ maxHeight: 400 }}>
                    <table className="w-full text-xs min-w-[580px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['Roll', 'Name', 'Father', 'Class', 'Program', 'Gender', 'Status', ''].map(h => <th key={h} className="px-3 md:px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s, i) => {
                          const isSelected = selectedAccStu?.roll_no === s.roll_no;
                          return (
                            <motion.tr key={s.roll_no} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.008, 0.25) }}
                              onClick={() => openAccStudentProfile(s)}
                              className={cn('border-b border-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors', isSelected ? 'bg-blue-50/60' : '')}>
                              <td className="px-3 md:px-4 py-3 font-mono text-slate-400 text-[10px]">{s.roll_no}</td>
                              <td className="px-3 md:px-4 py-3 font-black text-slate-900 max-w-[130px] truncate">{s.full_name}</td>
                              <td className="px-3 md:px-4 py-3 text-slate-500 max-w-[100px] truncate">{s.father_name || '—'}</td>
                              <td className="px-3 md:px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100">{s.class_section}</span></td>
                              <td className="px-3 md:px-4 py-3 text-slate-500 max-w-[80px] truncate">{s.program}</td>
                              <td className="px-3 md:px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700')}>{s.gender}</span></td>
                              <td className="px-3 md:px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{s.status}</span></td>
                              <td className="px-3 md:px-4 py-3"><Eye size={14} className="text-blue-400" /></td>
                            </motion.tr>
                          );
                        })}
                        {filteredStudents.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center"><Users size={28} className="mx-auto mb-2 text-slate-200" /><p className="text-slate-400 text-sm font-bold">No students match</p></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Full Student Profile Panel ── */}
                <AnimatePresence>
                  {selectedAccStu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-white rounded-3xl border border-blue-200 overflow-hidden shadow-md">
                      {/* Header */}
                      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0" style={{ background: `hsl(${(selectedAccStu.roll_no * 37) % 360},55%,48%)` }}>{selectedAccStu.full_name?.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900">{selectedAccStu.full_name}</p>
                            <p className="text-xs text-slate-500">Roll #{selectedAccStu.roll_no} · {selectedAccStu.class_section} · {selectedAccStu.program} Part {selectedAccStu.part}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Father: {selectedAccStu.father_name || '—'} · {selectedAccStu.gender} · <span className={cn('font-bold', selectedAccStu.status === 'Active' ? 'text-emerald-600' : 'text-rose-600')}>{selectedAccStu.status}</span></p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedAccStu(null); setStuFeeGroups([]); setStudentProgress([]); }} className="text-slate-400 hover:text-slate-700 ml-2"><X size={18} /></button>
                      </div>

                      {stuFeeLoading ? (
                        <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-blue-400" size={24} /></div>
                      ) : (
                        <div className="p-5 space-y-5">
                          {/* Badge & XP */}
                          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                            <span className="text-2xl">{selectedAccStu.current_badge?.split(' ')[0] || '🥉'}</span>
                            <div><p className="font-black text-slate-900 text-sm">{selectedAccStu.current_badge || 'Newcomer'}</p><p className="text-xs text-slate-400">{(selectedAccStu.total_xp || 0).toLocaleString()} XP earned</p></div>
                          </div>

                          {/* Course Progress */}
                          <div>
                            <p className="font-black text-slate-900 text-sm mb-3">📚 Course Progress</p>
                            {studentProgress.length === 0
                              ? <p className="text-sm text-slate-400 italic">No course progress data recorded yet</p>
                              : <div className="space-y-3">{studentProgress.map((cp: any) => { const p2 = cp.progress_pct || 0; const color = p2 >= 80 ? '#059669' : p2 >= 50 ? '#0891B2' : p2 >= 25 ? '#D97706' : '#C0392B'; return <ProgressBar key={cp.id} pct={p2} color={color} label={cp.subject} sub={`${cp.topics_done}/${cp.topics_total} topics · ${p2}%`} />; })}</div>
                            }
                          </div>

                          {/* Fee Summary (read-only view) */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-black text-slate-900 text-sm">💰 Fee Summary</p>
                              <div className="flex gap-3 text-[10px] font-bold text-slate-400">
                                <span>Paid: <strong className="text-emerald-600">{PKR(stuFeeGroups.reduce((t, g) => t + (g.paid || 0), 0))}</strong></span>
                                <span>Due: <strong className="text-rose-600">{PKR(stuFeeGroups.reduce((t, g) => t + (g.balance || 0), 0))}</strong></span>
                              </div>
                            </div>
                            {stuFeeGroups.length === 0
                              ? <p className="text-sm text-slate-400 italic">No fee records assigned yet</p>
                              : (
                                <div className="space-y-2">
                                  {stuFeeGroups.map(g => (
                                    <div key={g.id} className={cn('flex items-center justify-between px-4 py-3 rounded-xl border', g.status === 'Paid' ? 'bg-emerald-50/50 border-emerald-100' : g.status === 'Partial' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/30 border-rose-100')}>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-black text-slate-900">{g.fees_group}</p>
                                          <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black', g.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : g.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>{g.status}</span>
                                        </div>
                                        <div className="flex gap-3 mt-0.5 flex-wrap">
                                          <span className="text-[11px] text-slate-400">Amount: <strong>{PKR(g.amount)}</strong></span>
                                          {g.discount > 0 && <span className="text-[11px] text-emerald-600">Discount: -{PKR(g.discount)}</span>}
                                          {g.fine > 0 && <span className="text-[11px] text-rose-500">Fine: +{PKR(g.fine)}</span>}
                                          <span className="text-[11px] text-emerald-600">Paid: {PKR(g.paid)}</span>
                                          {g.due_date && <span className="text-[11px] text-slate-400">Due: {g.due_date}</span>}
                                        </div>
                                      </div>
                                      <span className="font-black text-sm ml-3 flex-shrink-0" style={{ color: g.balance > 0 ? '#C0392B' : '#059669' }}>{PKR(g.balance || 0)}</span>
                                    </div>
                                  ))}
                                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-xs text-slate-500 font-bold">To collect payment, use the <button onClick={() => { setSelectedAccStu(null); setTab('fee-ledger'); }} className="text-blue-600 underline font-black">Fee Ledger</button> tab.</p>
                                  </div>
                                </div>
                              )
                            }
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT REPORTS ════ */}
            {isAccountant && tab === 'reports' && (
              <motion.div key="rep" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={DollarSign}    label="Total Balance Due" value={PKR(totalBalance)} color="bg-rose-50 text-rose-600" alert={totalBalance > 0} />
                  <StatCard icon={AlertTriangle} label="Total Fines"       value={PKR(totalFines)}   color="bg-amber-50 text-amber-600" />
                  <StatCard icon={Receipt}       label="Transactions"      value={transactions.length} sub="This session" color="bg-blue-50 text-blue-600" />
                  <StatCard icon={BarChart3}     label="Session Revenue"   value={PKR(transactions.reduce((s, t) => s + Number(t.amount_paid || 0), 0))} color="bg-emerald-50 text-emerald-600" />
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Fee Collection Status</h3></div>
                  <div className="p-5 space-y-4">
                    {[{ label: 'Paid Groups', count: paidGroups, color: '#059669' }, { label: 'Partial Groups', count: partialGroups, color: '#D97706' }, { label: 'Unpaid Groups', count: unpaidGroups, color: '#C0392B' }].map(({ label, count, color }) => (
                      <ProgressBar key={label} pct={Math.round((count / totalGroups) * 100)} color={color} label={label} sub={`${count} · ${Math.round((count / totalGroups) * 100)}%`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">💸 Expenses</h3><p className="font-black text-rose-600">{PKR(expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
                    {expenses.slice(0, 8).map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                        <div><p className="text-sm font-bold text-slate-800">{e.description}</p><p className="text-[11px] text-slate-400">{e.category} · {e.expense_date}</p></div>
                        <span className="font-black text-rose-600">{PKR(e.amount)}</span>
                      </motion.div>
                    ))}
                    {!expenses.length && <p className="p-6 text-center text-slate-400 text-sm">No expenses recorded</p>}
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">💵 Other Income</h3><p className="font-black text-emerald-600">{PKR(income.reduce((s, e) => s + e.amount, 0))}</p></div>
                    {income.slice(0, 8).map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                        <div><p className="text-sm font-bold text-slate-800">{e.description}</p><p className="text-[11px] text-slate-400">{e.category} · {e.income_date}</p></div>
                        <span className="font-black text-emerald-600">{PKR(e.amount)}</span>
                      </motion.div>
                    ))}
                    {!income.length && <p className="p-6 text-center text-slate-400 text-sm">No income recorded</p>}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_PRIMARY.map(({ id, label, icon: Icon }) => {
            const active = tab === id; const badgeN = getBadge(id);
            return (
              <button key={id} onClick={() => setTab(id)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: active ? ACCENT : '#94a3b8' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={active ? { background: `${ACCENT}18` } : {}}>
                  <Icon size={19} />
                  {badgeN > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{badgeN > 9 ? '9+' : badgeN}</span>}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full text-center">{label}</span>
                {active && <div className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />}
              </button>
            );
          })}
          <div className="relative flex-1 min-w-0">
            <button onClick={() => setMoreOpen(p => !p)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl w-full" style={{ color: MOBILE_MORE.some(n => n.id === tab) ? ACCENT : '#94a3b8' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={MOBILE_MORE.some(n => n.id === tab) ? { background: `${ACCENT}18` } : {}}><Settings size={19} /></div>
              <span className="text-[9px] font-black uppercase tracking-tight">More</span>
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden" style={{ minWidth: 185 }}>
                  {MOBILE_MORE.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setTab(id); setMoreOpen(false); }} className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-bold border-b border-slate-50 last:border-0', tab === id ? 'text-white' : 'text-slate-700 hover:bg-slate-50')} style={tab === id ? { background: GRADIENT } : {}}><Icon size={16} />{label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onLogout} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: '#ef4444' }}>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center"><LogOut size={19} className="text-rose-500" /></div>
            <span className="text-[9px] font-black uppercase tracking-tight">Exit</span>
          </button>
        </div>
      </nav>

      {/* COLLECT FEE MODAL */}
      <AnimatePresence>
        {collectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCollectModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div><h3 className="font-black text-slate-900 text-lg">Collect Fee</h3><p className="text-xs text-slate-400 mt-0.5">{collectModal.fees_group}</p></div>
                  <button onClick={() => setCollectModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ l: 'Total', v: PKR(collectModal.amount), c: 'text-slate-700' }, { l: 'Paid', v: PKR(collectModal.paid), c: 'text-emerald-600' }, { l: 'Balance', v: PKR(collectModal.balance), c: 'text-rose-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-sm font-black', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount to Collect (PKR)</label>
                    <input type="number" value={feePayForm.amount} onChange={e => setFeePayForm(p => ({ ...p, amount: e.target.value }))} placeholder={`Max: Rs ${collectModal.balance?.toLocaleString('en-PK')}`} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[collectModal.balance, Math.round(collectModal.balance / 2), Math.round(collectModal.balance / 4)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(amt => (
                        <button key={amt} onClick={() => setFeePayForm(p => ({ ...p, amount: String(amt) }))} className="px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">{PKR(amt)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Cash', 'Bank Transfer', 'Cheque', 'Online'].map(m => (
                        <button key={m} onClick={() => setFeePayForm(p => ({ ...p, method: m }))} className={cn('px-3 py-2 rounded-xl text-xs font-black border transition-all', feePayForm.method === m ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200')} style={feePayForm.method === m ? { background: 'linear-gradient(135deg,#059669,#10b981)' } : {}}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Receipt No. (optional)</label>
                    <input value={feePayForm.receipt} onChange={e => setFeePayForm(p => ({ ...p, receipt: e.target.value }))} placeholder="e.g. REC-2026-001" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  {errorMsg && <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">⚠️ {errorMsg}</p>}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setCollectModal(null)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={collectFee} disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <><DollarSign size={15} /> Collect Fee</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROLE ASSIGN MODAL */}
      <AnimatePresence>
        {showAssignModal && <RoleAssignModal onClose={() => setShowAssignModal(false)} onSave={(n: any) => { showToast(`✅ ${n.full_name} → ${n.role} created`); setShowAssignModal(false); loadStaff(); }} assignableRoles={assignableRoles} principalName={adminData.full_name} GRADIENT={GRADIENT} />}
      </AnimatePresence>

      {/* NOTIFICATIONS PANEL (Principal only) */}
      <AnimatePresence>
        {showNotifs && !isAccountant && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifs(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="relative bg-white w-full max-w-2xl rounded-t-3xl overflow-hidden z-10" style={{ maxHeight: '85vh' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-black text-slate-900">Notifications <span className="text-slate-400 font-medium text-sm">({unreadNotifs} unread)</span></h3>
                <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 65px)' }}>
                {notifications.length === 0 ? <div className="p-10 text-center text-slate-400 text-sm">No notifications</div> : notifications.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className={cn('px-5 py-4 border-b border-slate-50 flex items-start gap-3', !n.is_read ? 'bg-teal-50/40' : '')}>
                    {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: ACCENT }} />}
                    <div className="flex-1"><p className="text-sm font-black text-slate-800">{n.title}</p><p className="text-xs text-slate-500 mt-0.5">{n.message}</p><p className="text-[9px] text-slate-300 mt-1">{new Date(n.created_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORM PREVIEW MODAL */}
      <AnimatePresence>
        {preview && isAccountant && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreview(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col" style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
              <div className="h-1" style={{ background: GRADIENT }} />
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div><h3 className="font-black text-slate-900">Admission Form Details</h3><p className="text-xs font-bold mt-0.5" style={{ color: ACCENT }}>{preview.form_no}</p></div>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 space-y-2">
                {[['Student Name', preview.student_name], ['Father Name', preview.father_name], ['B-Form / NIC', preview.b_form_nic || '—'], ['Program', `${preview.program} Part ${preview.part}`], ['Gender', preview.gender], ['DOB', preview.student_dob || '—'], ['Cell No', preview.cell_no || '—'], ['WhatsApp', preview.whatsapp_no || '—'], ['Email', preview.email || '—'], ['Address', preview.current_address || '—'], ['Matric Year', preview.matric_year || '—'], ['Matric Marks', preview.matric_marks || '—'], ['Matric %', preview.matric_percentage ? `${preview.matric_percentage}%` : '—'], ['Matric Board', preview.matric_board || '—'], ['Suggested Section', preview.suggested_section || '—'], ['Suggested Class', preview.suggested_class || '—'], ['Fee Package', PKR(preview.fee_package)], ['Notes', preview.notes || '—'], ['Status', preview.status], ['Submitted By', preview.created_by || '—'], ['Date', new Date(preview.created_at).toLocaleString('en-PK')]].map(([l, v]) => (
                  <div key={l} className="flex items-start justify-between py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 flex-shrink-0">{l}</span>
                    <span className="text-sm font-bold text-slate-800 text-right flex-1">{v}</span>
                  </div>
                ))}
              </div>
              {preview.status === 'Pending' && (
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.97 }} disabled={saving} onClick={() => confirmToDatabase(preview)} className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <><Database size={15} /> Confirm to DB</>}
                  </motion.button>
                  <button onClick={() => rejectForm(preview)} className="flex-1 py-3 rounded-2xl text-rose-700 font-bold text-sm bg-rose-50 border border-rose-200">Reject</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINTABLE RECEIPT (Hidden in UI, visible in print) */}
      <div id="printable-receipt" className="p-8 text-black bg-white">
        {printTx && (
          <div className="max-w-[450px] mx-auto border-2 border-slate-200 p-8 rounded-lg shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">PAK INFORMATICS</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Group of Colleges · Gujranwala</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-px w-12 bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Official Fee Receipt</span>
                <span className="h-px w-12 bg-slate-200" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Receipt Number</p>
                <p className="text-base font-black text-slate-900">{printTx.receipt_serial || printTx.id?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Date Issued</p>
                <p className="text-base font-black text-slate-900">{new Date(printTx.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Student Roll ID</span>
                <span className="text-sm font-black text-slate-900">#{printTx.student_roll_link}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Payment Method</span>
                <span className="text-sm font-black text-slate-900">{printTx.payment_method}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Category</span>
                <span className="text-sm font-black text-slate-900">{printTx.transaction_type || 'Academic Fee'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase">Processed By</span>
                <span className="text-sm font-black text-slate-900">{printTx.collected_by || 'Accountant Office'}</span>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl text-center mb-8 shadow-xl shadow-slate-200">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Total Amount Collected</p>
              <p className="text-4xl font-black">{PKR(Number(printTx.amount_paid))}</p>
              <p className="text-[10px] text-slate-300 font-bold mt-2 italic uppercase">Received with thanks</p>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <div className="text-center">
                <div className="h-px border-b border-slate-300 w-full mb-2" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature</p>
              </div>
              <div className="text-center">
                <div className="h-px border-b border-slate-300 w-full mb-2" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student / Guardian</p>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                Thank you for choosing Pak Informatics. This receipt validates your financial commitment to excellence. 
                Keep this safe for future reference.
              </p>
              <p className="text-[8px] text-slate-300 font-black mt-4 uppercase tracking-[0.3em]">Generated via Admin Portal</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};