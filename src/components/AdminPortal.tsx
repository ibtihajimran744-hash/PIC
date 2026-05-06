import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Users, BarChart3, GraduationCap, Bell, LogOut,
  Search, RefreshCw, AlertTriangle, CheckCircle, Clock, X,
  Shield, UserPlus, Loader2, Home, UserCog, Trash2,
  FileText, UserCheck, Check, Settings, Calendar, Eye,
  DollarSign, Receipt, Tag, Database, Save, CreditCard,
  Plus, Lock, Unlock, User, Printer, Minus, Layers, Target,
  Shirt, Sun, Camera, History as HistoryIcon, ShieldCheck, PenLine
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AcademicsPortal } from './AcademicsPortal';
import { ExaminerPortal } from './ExaminerPortal';
import { supabase } from '../services/supabase';

interface AdminPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

// ── Theme helpers ─────────────────────────────────────────────────────────
const getTheme = (role: string) => {
  if (role === 'Accountant') return { ACCENT: '#1a2fa8', GRADIENT: 'linear-gradient(135deg,#1a2fa8,#2952e3)' };
  if (role === 'Director')   return { ACCENT: '#7c2d12', GRADIENT: 'linear-gradient(135deg,#7c2d12,#9a3412)' };
  if (role === 'VP')         return { ACCENT: '#1e3a8a', GRADIENT: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)' };
  if (role === 'Principal')  return { ACCENT: '#065f46', GRADIENT: 'linear-gradient(135deg,#065f46,#047857)' };
  return { ACCENT: '#0F766E', GRADIENT: 'linear-gradient(135deg,#0F766E,#0D9488)' };
};

// ── Accountant constants ──────────────────────────────────────────────────
const LOGO_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA3ADcAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAA7ADsDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KD0oJA6mmkgr1oA5n4l/Fn4X/BrwzL4z+LPxE0Xw1pMLKJtS17U4rWBCTgAvIwXk8Dmvhv4+/8AByL+wP8ACbVW0D4bQeJviFcIzJNdaBpogs42WTaymW6aMvkZZWiR0bj5gDmvlX/gvN+yr8Nv2afiN4H+Our/ABV8XfElta8SX/8AaPgHxv4we68iOfdMBZ7VDWtuHwgUA5wgzxXxP8FP+CX37dv7QrWN18MP2bvEsmmalC01lrmsWf2CxkUcH/SJisY5yAN2T+lfoGRcOZLiMGsVjazUXttFX1utXd2tvotTOUpKVkfu5+yd/AFm/2Gv2sNFhvdJ8fT+Db241L7DBpPjuJLCSa4JG2KKbe1vNIwYMI45WcBgWVcivq23uYbmNZ7eZJI2HyujAg/jX8t3xN/YR/bX/ZF1x/FPxg/Z58a6RpelagLW+1rTY5I4J1cESRw3sSun7yPeu8blwTkMMg/vD/wSg+DXwL+Gv7PXhr4i/Bj4jfEG+034geHba/03w7458WrfrpMKKCYLaGJUhgCmTDbFBPAPAAHl8SZJlmWU418LW5oydls1ftdP7tCqblLofWtFAYEdaK+TKI25r4d/ay/4KQy/DL44eLv+EO8WXWm6J8IvDEc3iKzk06K8/fXdQwwWNku5SjxS7Y3uS+1Gn8vy3JZo/t6+edbOWS1XMqxMYxtzlsccfWvypu/hXD448G6b8ZJfB3i3T7LVviIda8ZWvijw/wD2bG3iKyttTSQtbGJDJp51We3SFZTI7bGJPAdp9vh8LB1q/wAEE3L0WrNsPQqYjERpQ3k0vvNz9hf9lnW9W+K+tfti/t66Xp/i/wCKWsSPGkPiqSI6XoLLF532OCF8x+bDHgsThIhkAmQkj6Y8f/FT9mWDxlr3xp8U/tIr4v1LwjdCOLwtYalKtppLGEtDvs7Z904JBZndZQQy7UBAJk+LnwD8MaloPgf9mzxjr0Vr4bXSLzVNYsrRTMdcv4Ig7faosgvbht0pLMA7qiHO7FflP/wV/wDGz/Bn9rzQPiP8EvBFx4Z8ZSadbeJ18cxQmIuhhMMMVvCy7IkRACVw2GYc4wK9zI1iM+xkKOKqctWcXJRVlGMU1aK7JbaJu+uppjKdOMpSor3E7J9/N+u9jovjL/Xuv69+1RHiX9unwRHc+L/C3wvRvfPstc0/SltdU1aa1RJJEO3EbNNveUlwcmJlB6A/aP8AwS6/4JmftafsuftffC354W1Xwt4m0nVLvxNdXN9tuEsSg8iC4gX5ElZnjkAUnjeMqmr7LOMrymjk7pV4qnWjqldPma1Wqsn5aJp+ZxRlPmvF+R+nX7H3xc1z43/s9+HfiN4m1XTr7UL61/0u80mMrbyyKSCVGSAR0YKzKHDBWYAMfUq+Wv2Evh0fgx8dHi18I/D3xMiNY8MWd/BqGg6DP4mutR/sH7Te6g0tswuRvgbeu4JuZfLMZViuK+pa/MyyOWKO4hkhmXKyKVYeoNfm1Y/s6+Fv2a/jJ8af2fdPi1ixuvihb6dr3wy0m2upJtKP8AY0U8kllALiZ5luSpE074WAiSNVYSfK36TnJOT6V5n8Zf2erD4v8Ajbwv441nX7xoPCMlxdW/h2FYY4dSuyg+zvLP5ZmQQyASKEYLvCsysUXHJjsLHHYKph57TTj96OjCYmeDxUK8N4tNfJ3PzF/aC8c/HW5+Py/GP4Z6vqDeKdKa38V6LBpqu8Ot+HL2G2s9YsjFK4ST7PNbCVo0U4jZm4619yfDzwf8Ffj18OfiBH8VPCE3hvwbpmuroPw+1S00+S+k8HaIkMIghtJ4o/JaSZY2keRFVd0yqqxqsSHC8e6D8IvifQWqfBf4U/A3xr4k0bwR8OPEfxH1jXNW0a21DR7mQeG/AfiJLeO7gkjtTKY/s8JkZXOxYzKwBYvIVHW/s9fst/sz33jzQf2jvhN4k0TVrPwFHcNe+ENW0c6n4s8Vm4tp47ya8uGimuoYpbWCJWhKq7OMZVY0A5fYZfhMLhJy55wacU09Wn3SXT1/4OFadWSbk/d7I8C/4JCf8E9Ph/DH/D/Dbi8R1488F3F54X8A+LrjSbfw5qOnXDN/aBd2tGm+XaY1SNmYORzsJ6jP7bfGn4lfDn4KeA5/G3jTxRb6Xa+HdPn1KGCTWILIXiQx7PJHnOiMC0sSAMyqJHiyRkV89fAf4Q/sz/sueHrn4z/APA34Q6TpGpeKLC28U6R4Wi1AXtxY/a9Xmt7i58zyomuBG7eWwDn5zJj5AK+paKACiiigD//2Q==";

const PROGRAMS = ['ICS Physics','ICS Statistics','Pre-Medical','Pre-Engineering','FA IT','FA General','I.Com','Summer Camp'];
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

const getGrade = (pct: number) => {
  if (pct >= 85) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 45) return 'D';
  return 'F';
};

const getSuggestedSection = (pct: number, gender: string) => {
  const g = gender === 'Female' ? 'G' : 'B';
  if (pct >= 85) return `A-${g}`; if (pct >= 70) return `B-${g}`; return `C-${g}`;
};
const EMPTY_FORM: any = {
  applied_for:'Intermediate', program:'ICS Physics', part:1, session:'2026-28',
  student_name:'', b_form_nic:'', father_name:'', father_nic:'', father_occupation:'',
  student_dob:'', contact_home:'', cell_no:'', whatsapp_no:'', email:'',
  religion:'Islam', gender:'Male', current_address:'',
  matric_year:'', matric_roll_no:'', matric_marks:'', matric_subjects:'',
  matric_board:'BISE Gujranwala', matric_division:'', matric_percentage:'',
  inter_year:'', inter_roll_no:'', inter_marks:'', inter_subjects:'',
  inter_board:'BISE Gujranwala', inter_division:'',
  graduation_year:'', graduation_roll_no:'', graduation_marks:'', graduation_board:'', graduation_division:'',
  fee_package: 8000, student_type: 'Regular', is_fresher: true, num_installments: 1,
  notes: '',
  student_photo_url: '',
  _localPhotoPreview: '',
  include_welcome_party: false, welcome_party_amount: 0,
  include_exam_fee: false, exam_fee_amount: 0,
  include_registration_fee: false, registration_fee_amount: 0,
  include_student_card: false, student_card_amount: 500,
  include_annual_charges: false, annual_charges_amount: 0,
};

const BS_PROGRAMS = ['BS Mathematics','BS Cybersecurity','BS Data Science','BS Computer Science','BS Information Technology','BS Chemistry','BS English','BBA'];
const ADP_PROGRAMS = ['Mathematics','Cyber Security','Data Science','Information Technology','Computer Science','Business Administration','Chemistry','English'];
const BS5_PROGRAMS = ['Computer Science','Chemistry','Information Technology','English','BBA'];

const isUniversityProgram = (appliedFor: string) => ['ADP', 'BS', 'BS 5th Semester'].includes(appliedFor);
const getUniversityPrograms = (appliedFor: string) => {
  if (appliedFor === 'BS') return BS_PROGRAMS;
  if (appliedFor === 'ADP') return ADP_PROGRAMS;
  if (appliedFor === 'BS 5th Semester') return BS5_PROGRAMS;
  return [];
};

// ── Shared UI primitives ──────────────────────────────────────────────────
const TI = (props: any) => <input {...props} className={cn("w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all", props.className)} />;

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
const FeeGroupsTab = ({ adminData, GRADIENT, ACCENT, showToast, showErr, PKR, onAssigned, students = [] }: any) => {
  const [fgSaving, setFgSaving]           = useState(false);
  
  // --- NEW STATE ---
  const [sectionStudentList, setSectionStudentList] = useState<any[]>([]);
  const [sectionExpanded, setSectionExpanded]       = useState<string | null>(null);
  const [multiSelected, setMultiSelected]           = useState<number[]>([]);
  // ------------------
  
  // Simplified Form State
  const [simpleName, setSimpleName]     = useState('');
  const [simpleAmount, setSimpleAmount] = useState('');
  const [simpleDue, setSimpleDue]       = useState('');
  const [simpleDesc, setSimpleDesc]     = useState('');
  const [installments, setInstallments] = useState(1);
  const [simpleTarget, setSimpleTarget] = useState('all'); // all, section name, or 'single_student'
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch]     = useState('');

  // Only target "Active" students by default for fees
  const fgStudents = students.filter((s: any) => s.status === 'Active');

  const handleSubmit = async () => {
    if (!fgStudents.length) {
      showErr('No active students available in the system.');
      return;
    }
    if (!simpleName.trim() || !simpleAmount || !simpleDue) {
      showErr('Name, Amount and Due Date are required');
      return;
    }
    const amt = Number(simpleAmount);
    if (amt <= 0) { showErr('Enter a valid amount'); return; }

    setFgSaving(true);
    try {
      let targets = [];
      if (simpleTarget === 'all') {
        targets = fgStudents;
      } else if (simpleTarget === 'single_student') {
        if (!selectedStudent) throw new Error('Please select a student');
        targets = [selectedStudent];
      } else if (simpleTarget === 'multi_select') {
        if (!multiSelected.length) throw new Error('No students selected');
        targets = fgStudents.filter((s: any) => multiSelected.includes(s.roll_no));
      } else {
        targets = fgStudents.filter((s: any) => s.class_section === simpleTarget);
      }

      if (!targets.length) throw new Error('No students found for this selection');

      const batchSize = 100;
      for (let i = 0; i < targets.length; i += batchSize) {
        const chunk = targets.slice(i, i + batchSize);
        
        // 1. Create fee groups (ledger entries)
        const feeRows: any[] = [];
        chunk.forEach(s => {
          const baseAmt = Math.floor(amt / installments);
          for (let inst = 1; inst <= installments; inst++) {
            const currentAmt = inst === installments ? amt - (baseAmt * (installments - 1)) : baseAmt;
            const dueDate = inst === 1 ? simpleDue : new Date(new Date(simpleDue).setMonth(new Date(simpleDue).getMonth() + (inst - 1))).toISOString().split('T')[0];
            
            feeRows.push({
              student_roll: s.roll_no,
              fees_group: installments > 1 ? `${simpleName.trim()} (Inst ${inst}/${installments})` : simpleName.trim(),
              fees_code: 'FEE-' + Math.random().toString(36).substring(7).toUpperCase(),
              amount: currentAmt,
              balance: currentAmt,
              due_date: dueDate,
              status: 'Unpaid',
              paid: 0,
              description: simpleDesc.trim() || null
            });
          }
        });
        const { error: fe } = await supabase.from('fee_groups').insert(feeRows);
        if (fe) throw fe;

        // 2. Notifications
        const noteRows = chunk.map(s => ({
          target_user_id: s.roll_no,
          target_role: 'STUDENT',
          title: `New Fee: ${simpleName}${installments > 1 ? ` (${installments} Installments)` : ''}`,
          message: `A new fee of PKR ${amt.toLocaleString()} has been added to your ledger${installments > 1 ? ` in ${installments} monthly installments` : ''}.`,
          type: 'fee_due',
          due_date: simpleDue,
          is_read: false
        }));
        await supabase.from('notifications').insert(noteRows);

        // 3. Update student total_package logic is skipped for simplification if user didn't ask 
        // But user said "Add the fee into student's fee ledger". fee_groups insert handles that.
      }

      showToast(`✅ Assigned "${simpleName}" to ${targets.length} students`);
      setSimpleName(''); setSimpleAmount(''); setSimpleDue(''); setSimpleDesc('');
      onAssigned?.();
    } catch (e: any) {
      console.error(e);
      showErr(e.message || 'Failed to assign fees');
    } finally {
      setFgSaving(false);
    }
  };

  const sections = [...new Set(fgStudents.map((s: any) => s.class_section))].sort() as string[];

  return (
    <motion.div key="fee-groups-simple" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">New Fee Assignment</h2>
          <p className="text-sm text-slate-500 mt-1">Create a fee group and instantly assign it to students</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black border border-emerald-100">
           <Check size={14} /> Accountant Mode Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FORM */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <CreditCard size={180} className="rotate-12" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fee Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <TI value={simpleName} onChange={(e:any)=>setSimpleName(e.target.value)} placeholder="e.g. Examination Fee 2026" className="pl-4 py-4 text-base" />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Monthly Fee','Fine','Uniform','Books','ID Card','Sports'].map(n => (
                    <button key={n} onClick={() => setSimpleName(n)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border', simpleName === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300')}>{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount (Rs) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">PKR</span>
                  <input type="number" value={simpleAmount} onChange={e => setSimpleAmount(e.target.value)} placeholder="0" className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50/30 transition-all text-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Due Date <span className="text-rose-500">*</span></label>
                <input type="date" value={simpleDue} onChange={e => setSimpleDue(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50/30 transition-all text-lg" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Installments</label>
                <select value={installments} onChange={e => setInstallments(Number(e.target.value))} className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-black text-slate-900 bg-slate-50/30 transition-all text-lg appearance-none">
                  {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n} Installment{n > 1 ? 's' : ''}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Fee will be divided equally over {installments} month{installments > 1 ? 's' : ''}.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description (Optional)</label>
                <textarea value={simpleDesc} onChange={e => setSimpleDesc(e.target.value)} placeholder="Provide context about this fee..." className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 text-sm font-bold text-slate-700 bg-slate-50/30 min-h-[100px] resize-none" />
              </div>
            </div>

            {/* Student selection summary */}
            {((simpleTarget === 'single_student' && selectedStudent) || simpleTarget === 'all' || (simpleTarget === 'multi_select' && multiSelected.length > 0)) && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-600 rounded-2xl p-4 text-white flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Users size={20} /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">Students Targetted</p>
                    <p className="text-xl font-black">
                      {simpleTarget === 'all' ? fgStudents.length : 
                       simpleTarget === 'single_student' ? 1 :
                       multiSelected.length} Students
                    </p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black uppercase tracking-widest opacity-80">Total Value</p>
                   <p className="text-xl font-black">PKR {(Number(simpleAmount) * (simpleTarget === 'all' ? fgStudents.length : simpleTarget === 'single_student' ? 1 : multiSelected.length)).toLocaleString()}</p>
                </div>
              </motion.div>
            )}

            <div className="pt-4 border-t border-slate-100">
               <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={fgSaving} className="w-full py-5 rounded-2xl text-white font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all text-lg" style={{ background: GRADIENT }}>
                 {fgSaving ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Confirm and Assign Fee</>}
               </motion.button>
               <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-bold tracking-widest">Fee will be posted to all selected student ledgers immediately</p>
            </div>
          </div>
        </div>

        {/* TARGETING */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14} className="text-blue-500" /> Target Audience</p>
            <div className="space-y-3">
               <button onClick={() => { setSimpleTarget('all'); setSelectedStudent(null); }} className={cn('w-full flex items-center justify-between p-4 rounded-2xl border transition-all', simpleTarget === 'all' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' : 'bg-slate-50 border-slate-100')}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', simpleTarget === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 shadow-sm')}><Users size={18} /></div>
                    <div className="text-left"><p className="text-sm font-black text-slate-900">All Students</p><p className="text-[10px] font-bold text-slate-400">{fgStudents.length} Students</p></div>
                  </div>
                  {simpleTarget === 'all' && <Check size={16} className="text-blue-600" />}
               </button>

               <div className="pt-2">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-2 ml-1">Single Student</p>
                 {!selectedStudent ? (
                   <div className="relative">
                     <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                       type="text"
                       placeholder="Search by Name or Roll No..."
                       value={studentSearch}
                       onChange={(e) => {
                         setStudentSearch(e.target.value);
                         setSimpleTarget('single_student');
                       }}
                       className={cn(
                         "w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-bold transition-all outline-none",
                         simpleTarget === 'single_student' ? "bg-white border-blue-200 ring-2 ring-blue-500/10" : "bg-slate-50 border-slate-100"
                       )}
                     />
                     {studentSearch && (
                       <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                         {fgStudents
                           .filter(s => s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || String(s.roll_no).includes(studentSearch))
                           .slice(0, 10)
                           .map(s => (
                             <button
                               key={s.roll_no}
                               onClick={() => {
                                 setSelectedStudent(s);
                                 setSimpleTarget('single_student');
                                 setStudentSearch('');
                               }}
                               className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-all text-left border-b border-slate-50 last:border-0"
                             >
                               <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">
                                 {s.full_name?.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-[11px] font-black text-slate-800">{s.full_name}</p>
                                 <p className="text-[9px] font-bold text-slate-400">Roll: {s.roll_no} • {s.class_section}</p>
                               </div>
                             </button>
                           ))}
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="flex items-center justify-between p-4 rounded-2xl border bg-blue-50 border-blue-200 ring-2 ring-blue-500/10">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                         {selectedStudent.full_name?.charAt(0)}
                       </div>
                       <div className="text-left">
                         <p className="text-sm font-black text-slate-900">{selectedStudent.full_name}</p>
                         <p className="text-[10px] font-bold text-slate-500">Roll: {selectedStudent.roll_no} • {selectedStudent.class_section}</p>
                       </div>
                     </div>
                     <button
                       onClick={() => {
                         setSelectedStudent(null);
                         setSimpleTarget('all');
                       }}
                       className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                     >
                       <X size={16} />
                     </button>
                   </div>
                 )}
               </div>

               <div className="pt-2">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-2 ml-1">Or Specific Section</p>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                   {sections.map((s: string) => {
                     const secStudents = fgStudents.filter((st: any) => st.class_section === s);
                     const isExpanded  = sectionExpanded === s;
                     const allSelected = secStudents.length > 0 && secStudents.every(st => multiSelected.includes(st.roll_no));
                     return (
                       <div key={s}>
                         <button
                           onClick={() => {
                             if (isExpanded) {
                               setSectionExpanded(null);
                               setSectionStudentList([]);
                               setMultiSelected([]);
                               setSimpleTarget('all');
                               setSelectedStudent(null);
                             } else {
                               setSectionExpanded(s);
                               setSectionStudentList(secStudents);
                               setMultiSelected(secStudents.map(st => st.roll_no));
                               setSimpleTarget('multi_select');
                               setSelectedStudent(null);
                             }
                           }}
                           className={cn('w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all', isExpanded ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/10' : 'bg-white border-slate-100 hover:border-slate-200')}>
                           <div className="flex items-center gap-3">
                             <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black', isExpanded ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400')}>{s.charAt(0)}</div>
                             <div className="text-left">
                               <p className="text-xs font-black text-slate-700">{s}</p>
                               <p className="text-[9px] font-bold text-slate-400">{secStudents.length} Students</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             {isExpanded && <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{multiSelected.filter(r => secStudents.some(st => st.roll_no === r)).length} selected</span>}
                             {isExpanded ? <Check size={14} className="text-amber-500" /> : <span className="text-slate-300 text-xs">→</span>}
                           </div>
                         </button>

                         {isExpanded && (
                           <div className="mt-1 ml-2 border-l-2 border-amber-200 pl-3 space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                             <div className="flex items-center justify-between py-1.5 px-2">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select Students</p>
                               <button
                                 onClick={() => {
                                   if (allSelected) setMultiSelected(p => p.filter(r => !secStudents.some(st => st.roll_no === r)));
                                   else setMultiSelected(p => [...new Set([...p, ...secStudents.map(st => st.roll_no)])]);
                                 }}
                                 className="text-[9px] font-black text-amber-600 hover:underline"
                               >{allSelected ? 'Deselect All' : 'Select All'}</button>
                             </div>
                             {secStudents.map(st => {
                               const isChecked = multiSelected.includes(st.roll_no);
                               return (
                                 <button
                                   key={st.roll_no}
                                   onClick={() => setMultiSelected(p => isChecked ? p.filter(r => r !== st.roll_no) : [...p, st.roll_no])}
                                   className={cn('w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left', isChecked ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:border-slate-200')}
                                 >
                                   <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all', isChecked ? 'bg-amber-500 border-amber-500' : 'border-slate-300')}>
                                      {isChecked && <Check size={11} className="text-white" />}
                                   </div>
                                   <div className="min-w-0 flex-1">
                                     <p className="text-[11px] font-black text-slate-800 truncate">{st.full_name}</p>
                                     <p className="text-[9px] font-bold text-slate-400">Roll: {st.roll_no}</p>
                                   </div>
                                 </button>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-blue-800 space-y-3">
             <div className="flex items-center gap-2"><CreditCard size={18} className="text-blue-600" /><p className="text-xs font-black uppercase tracking-widest">Pro Tip</p></div>
             <p className="text-xs font-bold leading-relaxed opacity-80">This form is a one-click posting tool. Unlike the previous system, there's no need to create "Templates" first — just type the fee name and hit save to update student ledgers instantly.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout, adminData }) => {
  const isAccountant = adminData.role === 'Accountant' || adminData.role === 'VP';
  const isSuperAdmin = ['Director', 'VP', 'Principal'].includes(adminData.role);
  const { ACCENT, GRADIENT } = getTheme(adminData.role);

  const [tab, setTab]               = useState('dashboard');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg]     = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [moreOpen, setMoreOpen]     = useState(false);
const [showAcademicsPortal, setShowAcademicsPortal] = useState(false);
const [showExaminerPortal, setShowExaminerPortal] = useState(false);


  // ── Permissions state ──────────────────────────────────────────────────
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [targetUserPerms, setTargetUserPerms] = useState<{ userId: string, perms: string[] } | null>(null);

  const ALL_UI_PERMISSIONS = [
    { id: 'view_accounts',     label: 'View Accounts' },
    { id: 'edit_accounts',     label: 'Edit Accounts' },
    { id: 'add_transactions',  label: 'Add Transactions' },
    { id: 'undo_transactions', label: 'Undo Transactions' },
    { id: 'manage_salaries',   label: 'Manage Salaries' },
    { id: 'manage_expenses',   label: 'Manage Expenses' },
    { id: 'manage_income',     label: 'Manage Income' },
    { id: 'manage_teachers',   label: 'Manage Teachers' },
    { id: 'manage_classes',    label: 'Manage Classes' },
    { id: 'upload_schedules',  label: 'Upload Schedules' },
    { id: 'send_announcements',label: 'Send Announcements' },
  ];

  const hasPermission = useCallback((perm: string) => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(perm);
  }, [isSuperAdmin, userPermissions]);

  const handleUndoTransaction = async (tx: any) => {
    if (!tx || !isSuperAdmin) return;
    if (!window.confirm(`Are you sure you want to UNDO this transaction of ${PKR(tx.amount_paid)}? This will reverse the payment and log your ID.`)) return;
    
    setSaving(true);
    try {
      // 1. Mark transaction as reversed
      const { error: txErr } = await supabase.from('fee_transactions').update({
        is_reversed: true,
        reversed_by: adminData.full_name,
        reversed_at: new Date().toISOString(),
        transaction_type: 'Correction'
      }).eq('id', tx.id);
      if (txErr) throw txErr;

      // 2. Adjust student paid_amount and fee_group status
      if (tx.fee_group_id) {
         const { data: fg } = await supabase.from('fee_groups').select('*').eq('id', tx.fee_group_id).maybeSingle();
         if (fg) {
            const newPaid = Math.max(0, (fg.paid || 0) - tx.amount_paid);
            const newBalance = fg.amount - newPaid;
            const newStatus = newPaid >= fg.amount ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
            await supabase.from('fee_groups').update({ paid: newPaid, balance: newBalance, status: newStatus }).eq('id', fg.id);
         }
      }

      // 3. Audit Log
      await supabase.from('audit_logs').insert([{ action: 'UNDO_TX', user_id: adminData.id, user_name: adminData.full_name, details: `Undo TX ${tx.id}`, timestamp: new Date().toISOString() }]);

      showToast('✅ Transaction Reversed');
      refresh();
    } catch (e: any) { showErr(e.message); }
    finally { setSaving(false); }
  };

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
  const [selectedStaff,   setSelectedStaff]   = useState<any>(null);
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
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [discounts,    setDiscounts]    = useState<any[]>([]);
  const [expenses,     setExpenses]     = useState<any[]>([]);
  const [income,       setIncome]       = useState<any[]>([]);
  const [salaries,     setSalaries]     = useState<any[]>([]);
  const [teachers,     setTeachers]     = useState<any[]>([]);
  const [nextRoll,     setNextRoll]     = useState(2628001);
  const [discSaving,   setDiscSaving]   = useState<string | null>(null);
  const [instDates,      setInstDates]      = useState<string[]>([]);
  const [saving,         setSaving]         = useState(false);
  const [preview,      setPreview]      = useState<any>(null);
  const [selectedAccStu,  setSelectedAccStu]  = useState<any>(null);
  const [stuFeeGroups,    setStuFeeGroups]    = useState<any[]>([]);
  const [stuFeeFilter,    setStuFeeFilter]    = useState<'All'|'Paid'|'Unpaid'>('All');
  const [selectedFeeGroups, setSelectedFeeGroups] = useState<Set<string>>(new Set());
  const [stuFeeLoading,   setStuFeeLoading]   = useState(false);
  const [collectModal,    setCollectModal]    = useState<any>(null);
  const [deleteId,        setDeleteId]        = useState<string | null>(null);
  const [finType, setFinType]         = useState<'Income' | 'Expense'>('Expense');
  const [finName, setFinName]         = useState('');
  const [finSlipNo, setFinSlipNo]     = useState('');
  const [finAmount, setFinAmount]     = useState('');
  const [finDesc, setFinDesc]         = useState('');
  const [salaryModal, setSalaryModal] = useState<any>(null);
  const [salaryForm, setSalaryForm]   = useState<{fine: number; bonus: number; deductions: number; notes: string; method: string}>({ fine: 0, bonus: 0, deductions: 0, notes: '', method: 'Cash' });
  const [expenseHeaders, setExpenseHeaders] = useState<any[]>([]);
  const [newExpenseHeader, setNewExpenseHeader] = useState('');
  const [finCategory, setFinCategory] = useState('');
  const [finDate, setFinDate]         = useState(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType]   = useState<'Daily' | 'Monthly' | 'Yearly'>('Monthly');
  const [reportFrom, setReportFrom] = useState(new Date().toISOString().slice(0, 10));
  const [reportTo, setReportTo]     = useState(new Date().toISOString().slice(0, 10));
  const [showFinModal, setShowFinModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState<any>(null);
  const [feePayForm,      setFeePayForm]      = useState({ amount: '', method: 'Cash', receipt: '', discount: '' });
  const [ledgerProgram,   setLedgerProgram]   = useState('');
  const [ledgerSection,   setLedgerSection]   = useState('');
  const [ledgerStatus,    setLedgerStatus]    = useState('');
  const [selectedLedgerRoll, setSelectedLedgerRoll] = useState<number | null>(null);
  const [feeFilter,       setFeeFilter]       = useState('All');
  const [selectedFeeIds,  setSelectedFeeIds]  = useState<number[]>([]);

  const [distProgram, setDistProgram] = useState('');
  const [distPart,    setDistPart]    = useState(1);
  const [distCount,   setDistCount]   = useState(2);
  const [distGender,  setDistGender]  = useState<'Any' | 'Male' | 'Female'>('Any');

  // --- NEW STATE BLOCK ---
  const [advanceSalaryModal, setAdvanceSalaryModal] = useState<any>(null);
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '', method: 'Cash', notes: '' });
  const [ledgerGender,   setLedgerGender]   = useState('');
  const [ledgerCategory, setLedgerCategory] = useState(''); // 'university' | 'intermediate' | ''
  // ------------------------


  const [admForm, setAdmForm] = useState<any>({ 
    ...EMPTY_FORM,
    fee_package: 8000,
    num_installments: 1,
  });
  
  const pct = Number(admForm.matric_percentage) || 0;
  const sec = pct > 0 ? getSuggestedSection(pct, admForm.gender) : '';
  const cls = sec ? CLASS_MAP[admForm.program]?.[admForm.part]?.[sec] || '' : '';
  const setF = (k: string, v: any) => setAdmForm((p: any) => ({ ...p, [k]: v }));

  const showToast = (msg: string) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3500); };
  const showErr   = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4500); };
  const refresh   = () => setRefreshKey(k => k + 1);

  const distributeSections = async () => {
    if (!distProgram) { showErr('Select a program'); return; }
    setSaving(true);
    try {
      const { data: stus, error: fetchErr } = await supabase.from('students')
        .select('*')
        .eq('program', distProgram)
        .eq('part', distPart);
      
      if (fetchErr) throw fetchErr;
      if (!stus || stus.length === 0) { showErr('No students found for this class'); return; }

      const filtered = distGender === 'Any' ? stus : stus.filter((s: any) => s.gender === distGender);
      if (filtered.length === 0) { showErr(`No ${distGender} students found`); return; }

      // Standardize suffix based on current PIC naming conventions
      // A-B, B-B, C-B for Boys
      // A-G, B-G, C-G for Girls

      // Sort students by Matric Percentage or Roll No for balanced/stable distribution
      filtered.sort((a: any, b: any) => (Number(b.matric_percentage) || 0) - (Number(a.matric_percentage) || 0));

      const updates = [];
      for (let i = 0; i < filtered.length; i++) {
        // Correct naming logic
        const baseLetter = String.fromCharCode(65 + (i % distCount));
        const genderCode = distGender === 'Female' ? 'G' : distGender === 'Male' ? 'B' : (filtered[i].gender === 'Female' ? 'G' : 'B');
        const secName = `${baseLetter}-${genderCode}`;
        
        const clsCode = CLASS_MAP[distProgram]?.[distPart]?.[secName] || `${distProgram}-${distPart}-${secName}`;
        
        updates.push(supabase.from('students').update({ class_section: secName, class_code: clsCode }).eq('id', filtered[i].id));
      }

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      showToast(`✅ Distributed ${filtered.length} students into ${distCount} sections`);
      refresh();
    } catch (e: any) {
      console.error(e);
      showErr(e.message || 'Distribution failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (tx: any) => {
    const txs = Array.isArray(tx) ? tx : [tx];
    if (txs.length === 0) { showErr('No fee selected'); return; }
    
    if (!txs || txs.length === 0) {
      const emptyIframe = document.createElement('iframe');
      emptyIframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
      document.body.appendChild(emptyIframe);
      emptyIframe.contentWindow!.document.open();
      emptyIframe.contentWindow!.document.write('<html><body style="font-family:sans-serif;text-align:center;padding-top:100px"><h2>No fee record found</h2><button onclick="window.close()">Close</button></body></html>');
      emptyIframe.contentWindow!.document.close();
      return;
    }

    // Use the first transaction to find the student
    const firstTx = txs[0];
    const roll = firstTx.student_roll_link || firstTx.student_roll;
    if (!roll) { showErr('Could not identify student identifier'); return; }
    
    const student = students.find(s => String(s.roll_no) === String(roll));
    const stuFees = txs;

    const totalAmount = stuFees.reduce((s, g) => s + (g.amount || 0), 0);
    const totalPaid   = stuFees.reduce((s, g) => s + (g.paid || 0), 0);
    const totalFine   = stuFees.reduce((s, g) => s + (g.fine || 0), 0);
    const totalDiscount = stuFees.reduce((s, g) => s + (g.discount || 0), 0);

    const totalBalance = stuFees.reduce((s, g) => {
      const amount = g.amount || 0;
      const paid = g.paid || 0;
      const fine = g.fine || 0;
      const discount = g.discount || 0;

      const balance = Math.max(0, amount + fine - paid - discount);
      return s + balance;
    }, 0);

    const dateStr = new Date().toLocaleDateString('en-PK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const fmt = (n: number) => `PKR${(n ?? 0).toLocaleString('en-PK')}`;

    const fmtDate = (d: string) =>
      d
        ? new Date(d)
            .toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
            .replace(/\//g, '-')
        : '-';

    const logoUrl = LOGO_BASE64;

    const feeRows = stuFees
      .map(f => {

        const history: any[] = f.payment_history ?? [];
        const payments = history.length > 0 ? history : [null];

        const amount = f.amount || 0;
        const paid = f.paid || 0;
        const fine = f.fine || 0;
        const discount = f.discount || 0;

        const balance = Math.max(0, amount + fine - paid - discount);

        return payments
          .map((p: any, pi: number) => `
        <tr>

          ${
            pi === 0
              ? `
            <td rowspan="${payments.length}" style="vertical-align:top">${f.fees_group ?? '-'}</td>
            <td rowspan="${payments.length}" style="vertical-align:top;text-align:center">${f.fees_code ?? '-'}</td>
            <td rowspan="${payments.length}" style="vertical-align:top;text-align:center">${fmtDate(f.due_date)}</td>
            <td rowspan="${payments.length}" style="vertical-align:top;text-align:center">${balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID'}</td>
            <td rowspan="${payments.length}" style="vertical-align:top;text-align:right">${fmt(amount)}</td>
          `
              : ''
          }

          <td style="text-align:center">${p?.payment_id ?? '-'}</td>
          <td style="text-align:center">${p?.method ?? '-'}</td>
          <td style="text-align:center">${p ? fmtDate(p.date) : '-'}</td>
          <td style="text-align:right">${fmt(p?.amount ?? 0)}</td>
          <td style="text-align:right">${fmt(fine)}</td>
          <td style="text-align:right">${fmt(discount)}</td>
          <td style="text-align:right"><strong>${fmt(balance)}</strong></td>

        </tr>
      `)
          .join('');
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Fee Voucher</title>

<style>

*{margin:0;padding:0;box-sizing:border-box;}

body{
font-family:Arial, sans-serif;
font-size:9pt;
color:#000;
background:#fff;
padding:18px 22px;
}

/* Header */

.header{
display:flex;
align-items:center;
gap:14px;
border-bottom:2px solid #000;
padding-bottom:8px;
margin-bottom:4px;
}

.logo-box{
width:62px;
height:62px;
display:flex;
align-items:center;
justify-content:center;
font-size:28px;
flex-shrink:0;
}

.header-text{flex:1;}

.college-name{
font-size:20pt;
font-weight:bold;
line-height:1.1;
}

.header-sub{
font-size:9pt;
margin-top:2px;
}

.header-address{
font-size:8.5pt;
margin-top:1px;
color:#333;
}

.copy-label{
text-align:center;
font-weight:bold;
font-size:10.5pt;
margin:6px 0 8px;
letter-spacing:0.5px;
}

/* Student info */

.student-row{
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:10px;
}

.student-info{
font-size:9.5pt;
line-height:1.8;
}

.student-info strong{
font-size:10pt;
}

.date-label{
font-size:9.5pt;
font-weight:bold;
white-space:nowrap;
}

/* Fee table */

.fee-table{
width:100%;
border-collapse:collapse;
margin-bottom:10px;
font-size:8.5pt;
}

.fee-table th{
border:1px solid #000;
padding:4px 5px;
text-align:left;
font-weight:bold;
background:#f0f0f0;
white-space:nowrap;
font-size:8pt;
}

.fee-table td{
border:1px solid #000;
padding:4px 5px;
vertical-align:middle;
}

.fee-table tfoot td{
border:1px solid #000;
padding:5px;
font-weight:bold;
background:#f5f5f5;
}

/* Notes */

.notes{
font-size:8.5pt;
line-height:1.9;
margin-bottom:10px;
}

.notes p{
margin-bottom:1px;
}

.urdu{
font-family:'Noto Nastaliq Urdu', serif;
font-size:9.5pt;
margin-top:4px;
}

/* Payment */

.payment-title{
font-size:9pt;
font-weight:bold;
text-decoration:underline;
margin-bottom:6px;
}

.payment-cols{
display:flex;
gap:40px;
font-size:8.5pt;
}

.payment-cols>div{
flex:1;
}

.payment-cols p{
margin-bottom:3px;
}

@media print{
body{padding:6px 10px;}
}

</style>
</head>

<body>

<div class="header">
<div class="logo-box"><img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;"/></div>
<div class="header-text">
<div class="college-name">Pak Informatics Group of Colleges</div>
<div class="header-sub">Session: 2026-28 &nbsp;&nbsp;&nbsp; Head Office, Gujranwala &nbsp;&nbsp;&nbsp; ph: 0300-0642973</div>
<div class="header-address">P.C Tower, Sialkot bypass Road Near Beacon House Palm Tree Campus GRW.</div>
</div>
</div>

<div class="copy-label">Student Copy</div>

<div class="student-row">
<div class="student-info">
<strong>${student?.full_name ?? '—'}</strong> (${student?.roll_no ?? '—'})<br/>
Father Name: ${student?.father_name ?? '—'}<br/>
Class: ${student?.class_section ?? '—'}
</div>
<div class="date-label">Date: ${dateStr}</div>
</div>

<table class="fee-table">

<thead>
<tr>
<th>Fees Group</th>
<th style="text-align:center">Fees Code</th>
<th style="text-align:center">Due Date</th>
<th style="text-align:center">Status</th>
<th style="text-align:right">Amount</th>
<th style="text-align:center">Payment ID</th>
<th style="text-align:center">Mode</th>
<th style="text-align:center">Date</th>
<th style="text-align:right">Paid</th>
<th style="text-align:right">Fine</th>
<th style="text-align:right">Discount</th>
<th style="text-align:right">Balance</th>
</tr>
</thead>

<tbody>

${feeRows || '<tr><td colspan="12" style="text-align:center;padding:10px">No fee records found</td></tr>'}

</tbody>

<tfoot>
<tr>
<td colspan="4" style="text-align:right">Grand Total</td>
<td style="text-align:right">${fmt(totalAmount)}</td>
<td colspan="3"></td>
<td style="text-align:right">${fmt(totalPaid)}</td>
<td style="text-align:right">${fmt(totalFine)}</td>
<td style="text-align:right">${fmt(totalDiscount)}</td>
<td style="text-align:right">${fmt(totalBalance)}</td>
</tr>
</tfoot>

</table>

<div class="notes">
<p><strong>NOTE 1:</strong> The Fee once deposited is not refundable and transferable in any case.</p>
<p><strong>NOTE 2:</strong> After the due date of the tuition fee, a fine of Rs. 100 per day will be charged.</p>
<p class="urdu" style="direction:rtl;">بر ماہ کی 10 تاریخ فیس کی ادائیگی کے لیے مقرر ہے، بعد فیس جمع کروانے کی صورت میں مبلغ 100 روپے روزانہ جرمانہ وصول کیا جائے گا</p>
</div>

<div class="payment-title">ONLINE PAYMENT DETAILS:</div>

<div class="payment-cols">

<div>
<p><strong><u>1) UBL Bank Limited</u></strong></p>
<p><u>Account No</u>: 0785335426309</p>
<p><u>Account Title</u>: Pak Informatics Educational Network Pvt.</p>
</div>

<div>
<p><strong><u>2) Jazz Cash Account:</u></strong></p>
<p><u>Account No.</u>: 03000642780 &nbsp; OR &nbsp; TILL ID: 980244377</p>
<p><u>Account Title:</u> Informatics Group of Colleges GRW</p>
</div>

</div>

<script>
window.onload=function(){
window.print();
window.onafterprint=function(){window.close();}
}
</script>

</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';

  document.body.appendChild(iframe);

  iframe.contentWindow!.document.open();
  iframe.contentWindow!.document.write(html);
  iframe.contentWindow!.document.close();

  setTimeout(() => document.body.removeChild(iframe), 6000);
};

const handlePrintList = (title: string, columns: string[], rows: any[][], summary?: string) => {
  const dateStr = new Date().toLocaleString('en-PK');
  const win = window.open('', '_blank');
  if (!win) return;
  
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          h1 { margin: 0; color: #0f172a; font-size: 1.5rem; font-weight: 900; text-transform: uppercase; }
          .meta { text-align: right; color: #94a3b8; font-size: 0.8rem; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #f8fafc; padding: 12px 15px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #334155; }
          .summary { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 16px; text-align: right; font-weight: 900; color: #0f172a; font-size: 1.1rem; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header" style="display:flex;align-items:center;gap:20px;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">
          <img src="${LOGO_BASE64}" style="width:60px;height:60px;object-fit:contain;"/>
          <div>
            <h1 style="margin:0;font-size:1.5rem;text-transform:uppercase;">${title}</h1>
            <p style="margin:2px 0 0;color:#64748b;font-weight:700;font-size:0.85rem;">Pak Informatics Group of Colleges · Session 2026-28</p>
          </div>
          <div class="meta" style="flex:1;text-align:right;color:#94a3b8;font-size:0.8rem;font-weight:700;">Report Date: ${dateStr}</div>
        </div>
        <table>
          <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        ${summary ? `<div class="summary">${summary}</div>` : ''}
        <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body>
    </html>
  `);
  win.document.close();
};

const handlePrintReport = (data: any) => {
  const dateStr = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  const win = window.open('', '_blank');
  if (!win) return;
  
  win.document.write(`
    <html>
      <head>
        <title>${data.type} Financial Statement</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; line-height: 1.5; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #f1f5f9; padding-bottom: 25px; }
          .inst-info h1 { margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; font-weight: 900; font-size: 1.75rem; }
          .inst-info p { margin: 4px 0 0; color: #64748b; font-weight: 600; font-size: 0.9rem; }
          .report-meta { text-align: right; }
          .report-meta .type { font-size: 0.75rem; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; }
          .report-meta .date { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin-top: 5px; }
          
          .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
          .stat { background: #f8fafc; padding: 22px; border-radius: 20px; border: 1px solid #f1f5f9; }
          .stat-l { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
          .stat-v { font-size: 1.3rem; font-weight: 900; color: #0f172a; }
          
          .section-title { font-size: 0.8rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; margin: 40px 0 20px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
          
          .financial-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .financial-table th { text-align: left; background: #f8fafc; padding: 12px 15px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #cbd5e1; }
          .financial-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; color: #475569; }
          .financial-table .amt { text-align: right; font-weight: 700; color: #0f172a; }
          
          .summary-box { 
            margin-top: 50px; 
            padding: 30px; 
            background: #f8fafc; 
            border-radius: 24px; 
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .summary-item { text-align: right; }
          .summary-item .label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
          .summary-item .value { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; }
          
          @media print { 
            body { padding: 20px; } 
            .stat { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:20px;">
            <img src="${LOGO_BASE64}" style="width:70px;height:70px;object-fit:contain;"/>
            <div class="inst-info">
              <h1>Pak Informatics Group of Colleges</h1>
              <p>Financial Statement · Session 2026-28 · Head Office, Gujranwala</p>
            </div>
          </div>
          <div class="report-meta">
            <div class="type">${data.type} Revenue Report</div>
            <div class="date">${dateStr}</div>
          </div>
        </div>

        <div class="grid">
          <div class="stat"><div class="stat-l">Fee Collections</div><div class="stat-v">${PKR(data.feeRev)}</div></div>
          <div class="stat"><div class="stat-l">Other Income</div><div class="stat-v">${PKR(data.otherInc)}</div></div>
          <div class="stat"><div class="stat-l">Total Expenditure</div><div class="stat-v">${PKR(data.totalExp)}</div></div>
          <div class="stat"><div class="stat-l">Total Discounts</div><div class="stat-v">${PKR(data.discounts)}</div></div>
        </div>

        <div class="summary-box">
          <div style="font-size: 0.85rem; color: #64748b; max-width: 40%; font-weight: 500;">
            This document serves as an official financial summary for the specified period. 
            All student fee collection and miscellaneous operational records have been audited.
          </div>
          <div class="summary-item">
            <div class="label">Net Performance</div>
            <div class="value" style="color: ${data.net >= 0 ? '#10b981' : '#ef4444'}">
              ${data.net >= 0 ? '+' : ''}${PKR(data.net)}
            </div>
          </div>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Accountant Signature</div>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Principal Approval</div>
          </div>
        </div>

        <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body>
    </html>
  `);
  win.document.close();
};

  // ── Load: Principal ────────────────────────────────────────────────────
  const loadPrincipal = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const [s1, s2, s3, s4, s5, s6, s9, s10] = await Promise.all([
        supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,gender,status,total_xp,current_badge,total_package,paid_amount').order('class_section').order('full_name'),
        supabase.from('academics_class_summary').select('*'),
        supabase.from('admin_notifications').select('*').in('target_role', ['Principal', 'VP', 'Director']).order('created_at', { ascending: false }).limit(30),
        supabase.from('admission_forms').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('attendance').select('status').eq('date', today),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('teachers').select('*').order('full_name'),
        supabase.from('teacher_salaries').select('*').order('payment_date', { ascending: false }).limit(100),
      ]);
      const studs   = s1.data || [];
      const present = (s5.data || []).filter((a: any) => a.status === 'Present').length;
      const absent  = (s5.data || []).filter((a: any) => a.status === 'Absent').length;
      const total   = (s5.data || []).length;
      setStats({ totalStu: studs.filter(s => s.status === 'Active').length, maleStudents: studs.filter(s => s.gender === 'Male').length, femaleStudents: studs.filter(s => s.gender === 'Female').length, present, absent, attPct: total > 0 ? Math.round((present / total) * 100) : 0 });
      setStudents(studs); setClassSummary(s2.data || []); setNotifications(s3.data || []);
      setAdmForms(s4.data || []); setLeaveRequests(s6.data || []);
      setTeachers(s9.data || []); setSalaries(s10.data || []);

      if (isSuperAdmin) {
        const [sf1, sf2, sf3, sf4, sf5, sf8, sf11] = await Promise.all([
          supabase.from('fee_groups').select('*').order('created_at', { ascending: false }).limit(1000),
          supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(200),
          supabase.from('discount_requests').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(100),
          supabase.from('income').select('*').order('income_date', { ascending: false }).limit(100),
          supabase.from('students').select('roll_no').lt('roll_no', 9999999).order('roll_no', { ascending: false }).limit(1),
          supabase.from('expense_headers').select('*').order('name'),
        ]);
        setFeeGroups((sf1.data || []).map((g: any) => ({ ...g, balance: (g.amount || 0) - (g.paid || 0) - (g.discount || 0) })));
        setTransactions(sf2.data || []); setDiscounts(sf3.data || []);
        setExpenses(sf4.data || []); setIncome(sf5.data || []);
        setExpenseHeaders(sf11.data || []);
        if (sf8.data?.[0]) setNextRoll(sf8.data[0].roll_no + 1);
      }
    } catch (e: any) {
      showErr("Data failed to load.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  // ── Load: Accountant ───────────────────────────────────────────────────
  const loadAccountant = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch permissions for non-superadmins
      if (!isSuperAdmin) {
        const { data: pData } = await supabase.from('staff_permissions').select('permissions').eq('admin_user_id', adminData.id).maybeSingle();
        if (pData) setUserPermissions(pData.permissions || []);
      }

      const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10] = await Promise.all([
        supabase.from('students').select('roll_no,full_name,father_name,class_section,program,part,status,total_package,paid_amount,current_badge,total_xp,gender').order('roll_no', { ascending: false }),
        supabase.from('fee_groups').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false }).limit(200),
        supabase.from('discount_requests').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(50),
        supabase.from('income').select('*').order('income_date', { ascending: false }).limit(50),
        supabase.from('admission_forms').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('roll_no').lt('roll_no', 9999999).order('roll_no', { ascending: false }).limit(1),
        supabase.from('teachers').select('*').order('full_name'),
        supabase.from('teacher_salaries').select('*').order('payment_date', { ascending: false }).limit(100),
      ]);
      setStudents(s1.data || []);
      setFeeGroups((s2.data || []).map((g: any) => ({ ...g, balance: (g.amount || 0) - (g.paid || 0) - (g.discount || 0) })));
      setTransactions(s3.data || []);
      setDiscounts(s4.data || []); setExpenses(s5.data || []); setIncome(s6.data || []);
      const { data: ehData } = await supabase.from('expense_headers').select('*').order('name');
      setExpenseHeaders(ehData || []);
      setAdmForms(s7.data || []); setTeachers(s9.data || []); setSalaries(s10.data || []);
      if (s8.data?.[0]) setNextRoll(s8.data[0].roll_no + 1);
    } catch (e: any) {
      showErr("Data failed to load. Please check your connection.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaff = async () => { const { data } = await supabase.from('admin_users').select('id,full_name,username,role').order('role'); setStaffList(data || []); };
  const loadScheme = async () => { const { data } = await supabase.from('scheme_of_study').select('*').order('week_no'); setSchemeList(data || []); };
  const loadPermissions = async () => {
    const { data } = await supabase.from('role_permissions').select('*');
    const map: Record<string, any> = {};
    (data || []).forEach((r: any) => { map[r.role] = r; });
    setAllPermissions(map);
    
    if (isSuperAdmin) {
      // Super admins can assign anything except super admin roles to avoid self-locking or elevating others too high easily
      const allRoles = (data || []).map((r: any) => r.role);
      setAssignableRoles(allRoles.filter(r => !['Director', 'VP', 'Principal'].includes(r) || adminData.role === 'Director'));
    } else {
      const pp = map['Principal']; if (pp) setAssignableRoles(pp.assignable_roles || []);
    }
  };

  useEffect(() => {
    if (isAccountant) { loadAccountant(); }
    else { loadPrincipal(); loadStaff(); loadPermissions(); loadScheme(); }
  }, [refreshKey, isAccountant, loadAccountant, loadPrincipal]);

  // ── Principal actions ──────────────────────────────────────────────────
  const openStudentDetail = async (student: any) => {
    setSelectedStudent(student); setStudentLoading(true);
    const [prog, fees] = await Promise.all([
      supabase.from('student_course_progress').select('*').eq('student_roll', student.roll_no).order('subject'),
      supabase.from('fee_groups').select('*').eq('student_roll', student.roll_no).order('created_at', { ascending: false })
    ]);
    setStudentProgress(prog.data || []);
    setStuFeeGroups(fees.data || []);
    setStudentLoading(false);
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

  const uploadStudentPhoto = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const path = `student-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('admissions').upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        // Fallback: store as base64 if storage bucket not set up
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      const { data } = supabase.storage.from('admissions').getPublicUrl(path);
      return data.publicUrl;
    } catch {
      // Fallback to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  // ── Accountant: open student profile (loads results + fee summary) ─────
  const openAccStudentProfile = async (student: any) => {
    const isSelected = selectedAccStu?.roll_no === student.roll_no;
    if (isSelected) { setSelectedAccStu(null); setStuFeeGroups([]); return; }
    setSelectedAccStu(student);
    setStuFeeFilter('All');
    setSelectedFeeGroups(new Set());
    setStuFeeLoading(true);
    const [progress, fees] = await Promise.all([
      supabase.from('student_course_progress').select('*').eq('student_roll', student.roll_no).order('subject'),
      supabase.from('fee_groups').select('*').eq('student_roll', student.roll_no).order('due_date'),
    ]);
    setStudentProgress(progress.data || []);
    setStuFeeGroups((fees.data || []).map((g: any) => ({ ...g, balance: (g.amount || 0) - (g.paid || 0) - (g.discount || 0) })));
    setStuFeeLoading(false);
  };

  // ── Accountant actions ─────────────────────────────────────────────────
  const saveAdmission = async () => {
    if (!admForm.student_name.trim() || !admForm.father_name.trim()) { showErr('Student name and father name are required'); return; }
    setSaving(true);
    const editingId = admForm._editingId;
    const payload = {
      applied_for:        admForm.applied_for,
      program:            admForm.program,
      part:               admForm.part,
      session:            admForm.session,
      student_name:       admForm.student_name.trim().toUpperCase(),
      father_name:        admForm.father_name.trim().toUpperCase(),
      b_form_nic:         admForm.b_form_nic,
      father_nic:         admForm.father_nic,
      father_occupation:  admForm.father_occupation,
      student_dob:        admForm.student_dob,
      contact_home:       admForm.contact_home,
      cell_no:            admForm.cell_no,
      whatsapp_no:        admForm.whatsapp_no,
      email:              admForm.email,
      religion:           admForm.religion,
      gender:             admForm.gender,
      current_address:    admForm.current_address,
      matric_year:        admForm.matric_year,
      matric_roll_no:     admForm.matric_roll_no,
      matric_marks:       admForm.matric_marks      ? Number(admForm.matric_marks)      : null,
      matric_subjects:    admForm.matric_subjects,
      matric_board:       admForm.matric_board,
      matric_division:    admForm.matric_division,
      matric_percentage:  admForm.matric_percentage ? Number(admForm.matric_percentage) : null,
      inter_year:         admForm.inter_year,
      inter_roll_no:      admForm.inter_roll_no,
      inter_marks:        admForm.inter_marks       ? Number(admForm.inter_marks)       : null,
      inter_subjects:     admForm.inter_subjects,
      inter_board:        admForm.inter_board,
      inter_division:     admForm.inter_division,
      graduation_year:    admForm.graduation_year,
      graduation_roll_no: admForm.graduation_roll_no,
      graduation_marks:   admForm.graduation_marks  ? Number(admForm.graduation_marks)  : null,
      graduation_board:   admForm.graduation_board,
      graduation_division:admForm.graduation_division,
      fee_package:        Number(admForm.fee_package),
      student_type:       admForm.student_type,
      is_fresher:         admForm.is_fresher,
      installments:       Number(admForm.num_installments),
      suggested_section:  sec,
      suggested_class:    cls,
      notes:              admForm.notes || '',
      degree_type:        admForm.degree_type || (isUniversityProgram(admForm.applied_for) ? admForm.applied_for : 'Intermediate'),
      university_program: isUniversityProgram(admForm.applied_for) ? admForm.program : null,
      student_photo_url:  admForm.student_photo_url || null,
      admission_data: {
        ...admForm,
        _localPhotoPreview: undefined // don't save blob url
      }
    };
    try {
      if (editingId) {
        // UPDATE existing form
        const { error } = await supabase.from('admission_forms').update(payload).eq('id', editingId);
        if (error) throw error;
        
        // If it was already synced to students table, update the student record too
        const oldForm = admForms.find(f => f.id === editingId);
        if (oldForm && oldForm.synced_to_db && oldForm.student_roll_no) {
          await supabase.from('students').update({
            full_name: payload.student_name,
            father_name: payload.father_name,
            gender: payload.gender,
            program: payload.program,
            part: payload.part,
            class_section: payload.suggested_section || oldForm.suggested_section,
            total_package: payload.fee_package,
          }).eq('roll_no', oldForm.student_roll_no);
        }
        
        showToast('✅ Admission form updated');
      } else {
        // INSERT new form
        const { error } = await supabase.from('admission_forms').insert([{
          ...payload, status: 'Pending', synced_to_db: false,
          created_by: adminData.full_name, form_no: '',
        }]);
        if (error) throw error;
        showToast('✅ Admission form saved');
      }

      // 🔔 VP Notification
      await supabase.from('admin_notifications').insert([{
        target_role: 'VP',
        title: editingId ? 'Admission Updated' : 'New Admission Form',
        message: `${payload.student_name} (${payload.program}) ${editingId ? 'updated' : 'submitted'} by ${adminData.full_name}.`,
        type: 'Admission',
        is_read: false
      }]);

      setAdmForm({ ...EMPTY_FORM });
      setTab('admissions');
      refresh();
    } catch (e: any) { showErr(e.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const confirmToDatabase = async (f: any) => {
    if (f.status === 'Pending' && instDates.length === 0) {
       // Initialize if not already
       setInstDates(Array(f.installments || 3).fill(new Date().toISOString().split('T')[0]));
    }
    setSaving(true);
    try {
      const studentType = f.student_type || (f.program === 'Summer Camp' ? 'Summer Camp' : 'Regular');
      let roll = f.student_roll_no;

      if (!roll) {
        const now = new Date();
      const joinYear = now.getFullYear(); 
      const endYear  = joinYear + 2;     
      const prefix   = Number(`${String(joinYear).slice(2)}${String(endYear).slice(2)}`); 
      const { data: lastRollData } = await supabase
        .from('students')
        .select('roll_no')
        .gte('roll_no', prefix * 1000)
        .lt('roll_no', (prefix + 1) * 1000)
        .order('roll_no', { ascending: false })
        .limit(1);
      const lastRoll = lastRollData?.[0]?.roll_no ?? (prefix * 1000);
      const seq = (lastRoll % 1000) + 1; 
          const roll_val = prefix * 1000 + seq;  
          roll = roll_val;
          const username = `stu_${roll}`, password = `PIC${roll}`;

          let totalPackage = 0;
          if (studentType === 'Summer Camp') totalPackage = 7000;
          else {
              totalPackage = (Number(f.fee_package) || 0) + 7000 + 1000;
          }

          const { error: se } = await supabase.from('students').insert([{
            roll_no: roll, full_name: f.student_name, father_name: f.father_name,
            gender: f.gender, program: f.program, part: f.part,
            class_section: f.suggested_class || CLASS_MAP[f.program]?.[f.part]?.['B-B'] || (f.program === 'Summer Camp' ? 'Summer-Camp' : 'TBD'),
            total_package: totalPackage, paid_amount: 0, status: 'Active',
            username, password, total_xp: 0, profile_xp: 0, current_badge: 'Newcomer',
          }]);
          if (se) throw se;
      } else {
          // Update existing
          let totalPackage = (Number(f.fee_package) || 0) + 7000 + 1000;
          await supabase.from('students').update({
              total_package: totalPackage,
              status: 'Active'
          }).eq('roll_no', roll);
      }

      let ledgerFees: any[] = [];
      const today = new Date().toISOString().split('T')[0];

      if (studentType === 'Summer Camp') {
          ledgerFees = [
            { student_roll: roll, fees_group: 'Summer Camp Fee', fees_code: 'SC-FEE', due_date: instDates[0] || today, amount: 7000, paid: 0, status: 'Unpaid' }
          ];
      } else {
          const pkgAmt = Number(f.fee_package) || 0;
          const instCount = f.num_instalments || f.installments || 1;
          const perInst = Math.floor(pkgAmt / instCount);
          
          for (let i = 0; i < instCount; i++) {
              ledgerFees.push({
                  student_roll: roll,
                  fees_group: instCount > 1 ? `Fee Package (Inst ${i + 1})` : 'Fee Package',
                  fees_code: `FEE-PK${instCount > 1 ? `-${i + 1}` : ''}`,
                  due_date: instDates[i] || today,
                  amount: i === instCount - 1 ? pkgAmt - (perInst * (instCount - 1)) : perInst,
                  paid: 0, status: 'Unpaid'
              });
          }

          const { data: exSC } = await supabase.from('fee_groups').select('id').eq('student_roll', roll).eq('fees_group', 'Summer Camp Fee').maybeSingle();
          if (!exSC) {
              ledgerFees.push({ student_roll: roll, fees_group: 'Summer Camp Fee', fees_code: 'SC-FEE', due_date: today, amount: 7000, paid: 0, status: 'Unpaid' });
          }
          const { data: exUN } = await supabase.from('fee_groups').select('id').eq('student_roll', roll).eq('fees_group', 'Uniform Fee').maybeSingle();
          if (!exUN) {
              ledgerFees.push({ student_roll: roll, fees_group: 'Uniform Fee', fees_code: 'UN-FEE', due_date: today, amount: 1000, paid: 0, status: 'Unpaid' });
          }
      }

      // Add after the existing ledgerFees array is populated:
      const optionalFees = [
        { key: 'include_welcome_party',    amtKey: 'welcome_party_amount',    group: 'Welcome Party Fee',    code: 'WP-FEE' },
        { key: 'include_exam_fee',         amtKey: 'exam_fee_amount',         group: 'Examination Fee',       code: 'EX-FEE' },
        { key: 'include_registration_fee', amtKey: 'registration_fee_amount', group: 'Registration Fee',      code: 'REG-FEE' },
        { key: 'include_student_card',     amtKey: 'student_card_amount',     group: 'Student Card Fee',      code: 'SC-CARD' },
        { key: 'include_annual_charges',   amtKey: 'annual_charges_amount',   group: 'Annual Charges',        code: 'ANN-FEE' },
      ];
      for (const { key, amtKey, group, code } of optionalFees) {
        if (f[key] && Number(f[amtKey]) > 0) {
          const { data: existing } = await supabase.from('fee_groups').select('id').eq('student_roll', roll).eq('fees_group', group).maybeSingle();
          if (!existing) {
            ledgerFees.push({ student_roll: roll, fees_group: group, fees_code: code, due_date: today, amount: Number(f[amtKey]), paid: 0, status: 'Unpaid' });
          }
        }
      }

      if (ledgerFees.length > 0) {
        const { error: fe } = await supabase.from('fee_groups').insert(ledgerFees);
        if (fe) throw fe;
      }

      // Notification for Student
      const scNotify = ledgerFees.map(inst => `${inst.fees_group} → ${inst.amount} → Due: ${inst.due_date}`).join('\n');
      if (scNotify) {
        await supabase.from('notifications').insert([{
           target_user_id: roll,
           title: 'Student Enrollment & Fee Ledger',
           message: `Welcome!\n\nYour fee ledger has been updated:\n${scNotify}`,
           type: 'Fee',
           is_read: false
        }]);
      }

      // Notification for VP
      await supabase.from('admin_notifications').insert([{
        target_role: 'VP',
        title: 'New Admission/Fee Ledger Created',
        message: `${f.student_name} (Roll: ${roll}) confirmed by ${adminData.full_name}. Fees initialized.`,
        type: 'Admission',
        is_read: false
      }]);

      await supabase.from('admission_forms').update({
        status: 'Approved', synced_to_db: true, student_roll_no: roll,
        approved_by: adminData.full_name, approved_at: new Date().toISOString(),
        accountant_confirmed: true, accountant_confirmed_by: adminData.full_name,
        accountant_confirmed_at: new Date().toISOString(),
      }).eq('id', f.id);
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
      
      // Apply to an unpaid fee group
      const { data: groups } = await supabase.from('fee_groups').select('*').eq('student_roll', d.student_roll).eq('status', 'Unpaid').limit(1);
      if (groups && groups.length > 0) {
        const group = groups[0];
        const newDiscount = (group.discount || 0) + d.discount_amount;
        await supabase.from('fee_groups').update({ discount: newDiscount }).eq('id', group.id);
        
        // Also record as a transaction so it can be printed
        await supabase.from('fee_transactions').insert([{
          student_roll_link: String(d.student_roll),
          amount_paid: d.discount_amount,
          payment_method: 'Discount',
          collected_by: adminData.full_name,
          payment_date: new Date().toISOString(),
          transaction_type: 'Discount',
          fee_group_id: group.id,
          receipt_serial: `DISC-${d.id.slice(0, 4).toUpperCase()}`
        }]);
      }
      
      showToast('✅ Discount approved & applied'); refresh();
    } catch (error) { 
      console.error(error);
      showErr('Failed to apply discount'); 
    }
    finally { setDiscSaving(null); }
  };
  const rejectDiscount = async (d: any) => {
    await supabase.from('discount_requests').update({ status: 'Rejected', reviewed_by: adminData.full_name, reviewed_at: new Date().toISOString() }).eq('id', d.id);
    showToast('Discount rejected'); refresh();
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from('fee_groups').delete().eq('id', id);
    if (error) { showErr('Failed to delete assignment'); return; }
    showToast('Assignment removed');
    setDeleteId(null);
    loadAccountant();
  };

  const collectFee = async () => {
    if (!collectModal) return;
    const amt = Number(feePayForm.amount);
    const disc = Number(feePayForm.discount || 0);
    
    if ((!amt || amt <= 0) && (!disc || disc <= 0)) { showErr('Enter a valid amount or discount'); return; }
    if (amt + disc > collectModal.balance) { showErr(`Total exceeds balance of ${PKR(collectModal.balance)}`); return; }
    
    setSaving(true);
    try {
      const newPaid     = (collectModal.paid || 0) + amt;
      const newDiscount = (collectModal.discount || 0) + disc;
      const newBalance  = (collectModal.balance || 0) - amt - disc;
      const newStatus   = newBalance <= 0 ? 'Paid' : 'Partial';

      const { error: updateError } = await supabase.from('fee_groups').update({ 
        paid: newPaid, 
        discount: newDiscount,
        status: newStatus 
      }).eq('id', collectModal.id);

      if (updateError) throw updateError;

      // Record Payment Transaction
      if (amt > 0) {
        const { error: txError } = await supabase.from('fee_transactions').insert([{
          student_roll_link: String(collectModal.student_roll),
          amount_paid: amt, payment_method: feePayForm.method,
          receipt_serial: feePayForm.receipt || null, collected_by: adminData.full_name,
          payment_date: new Date().toISOString(), transaction_type: 'Payment',
          fee_group_id: collectModal.id, confirmed_by: adminData.full_name,
        }]);
        if (txError) console.error("Tx Error:", txError);

        // 🔔 Notification for Student
        await supabase.from('notifications').insert([{
          target_user_id: collectModal.student_roll,
          title: '💰 Fee Payment Received',
          message: `Your payment of ${PKR(amt)} for ${collectModal.fees_group} has been successfully recorded.`,
          type: 'fee_payment',
          target_role: 'STUDENT'
        }]);
      }

      // Record Discount Transaction
      if (disc > 0) {
        const { error: discError } = await supabase.from('fee_transactions').insert([{
          student_roll_link: String(collectModal.student_roll),
          amount_paid: disc, payment_method: 'Discount',
          receipt_serial: `DISC-${Math.random().toString(36).substring(7).toUpperCase()}`, 
          collected_by: adminData.full_name,
          payment_date: new Date().toISOString(), transaction_type: 'Discount',
          fee_group_id: collectModal.id, confirmed_by: adminData.full_name,
        }]);
        if (discError) console.error("Disc Error:", discError);

        // 🔔 Notification for Student (Discount)
        await supabase.from('notifications').insert([{
          target_user_id: collectModal.student_roll,
          title: '🏷️ Fee Discount Applied',
          message: `A discount of ${PKR(disc)} has been applied to your ${collectModal.fees_group}.`,
          type: 'fee_payment',
          target_role: 'STUDENT'
        }]);
      }

      // 🔔 Notification for VP
      await supabase.from('admin_notifications').insert([{
        target_role: 'VP',
        title: '💰 Fee Collected',
        message: `Payment/Discount of ${PKR(amt + disc)} processed for ${collectModal.student_roll} (${collectModal.fees_group}) by ${adminData.full_name}.`,
        type: 'Fee',
        is_read: false
      }]);

      showToast(`✅ ${amt > 0 ? PKR(amt) + ' collected' : ''} ${disc > 0 ? (amt > 0 ? '& ' : '') + PKR(disc) + ' discount applied' : ''}`);
      setCollectModal(null); setFeePayForm({ amount: '', method: 'Cash', receipt: '', discount: '' }); refresh();
    } catch (e: any) { 
      console.error(e);
      showErr(e.message || 'Failed to collect fee'); 
    }
    finally { setSaving(false); }
  };

  const loadExpenseHeaders = async () => {
    const { data } = await supabase.from('expense_headers').select('*').order('name');
    setExpenseHeaders(data || []);
  };

  const saveExpenseHeader = async () => {
    if (!newExpenseHeader.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('expense_headers').insert([{ name: newExpenseHeader.trim(), created_by: adminData.full_name }]);
      if (error) throw error;
      setNewExpenseHeader('');
      showToast('✅ Expense tag created');
      await loadExpenseHeaders();
    } catch (e: any) { showErr(e.message); }
    finally { setSaving(false); }
  };

  const deleteExpenseHeader = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const { error } = await supabase.from('expense_headers').delete().eq('id', id);
      if (error) throw error;
      showToast('✅ Expense tag deleted');
      await loadExpenseHeaders();
    } catch (e: any) { showErr(e.message); }
  };

  const saveFinancialRecord = async () => {
  const amt = Number(finAmount);
  if (!amt || amt <= 0) { showErr('Enter a valid amount'); return; }
  if (!finCategory.trim()) { showErr('Category is required'); return; }
  
  setSaving(true);
  try {
    const table = finType === 'Income' ? 'income' : 'expenses';
    const payload: any = {
      description: finDesc.trim() || finCategory.trim(),
      [finType === 'Income' ? 'income_date' : 'expense_date']: finDate,
      amount: amt,
      category: finCategory.trim(),
      recorded_by: adminData.full_name
    };

    if (finType === 'Expense') {
      payload.name = finName.trim() || null;
      payload.paid_to = finName.trim() || null;
      payload.slip_no = finSlipNo.trim() || null;
      payload.receipt_no = finSlipNo.trim() || null;
      payload.entered_by = adminData.full_name;
    }
    
    const { error } = await supabase.from(table).insert([payload]);
    if (error) throw error;
    
    showToast(`✅ ${finType} recorded successfully`);
    setTab('reports');
    setFinAmount('');
    setFinCategory(''); setFinName(''); setFinSlipNo(''); setFinDesc('');
    refresh();
  } catch (e: any) { showErr(e.message || 'Failed to save'); }
  finally { setSaving(false); }
};

  const payTeacherSalary = async () => {
    if (!salaryModal) return;
    const net = Number(salaryModal.monthly_salary) + Number(salaryForm.bonus) - Number(salaryForm.fine) - Number(salaryForm.deductions);
    setSaving(true);
    try {
       const { error } = await supabase.from('teacher_salaries').insert([{
         teacher_id: salaryModal.id,
         teacher_name: salaryModal.full_name,
         monthly_salary: salaryModal.monthly_salary,
         bonus: salaryForm.bonus,
         fine: salaryForm.fine,
         deductions: salaryForm.deductions,
         net_salary: net,
         payment_date: new Date().toISOString(),
         payment_method: salaryForm.method,
         notes: salaryForm.notes,
         recorded_by: adminData.full_name
       }]);
       if (error) throw error;
       
       // Record as expense too
       await supabase.from('expenses').insert([{
         description: `Salary: ${salaryModal.full_name}`,
         amount: net,
         category: 'Salaries',
         expense_date: new Date().toISOString().slice(0, 10),
         recorded_by: adminData.full_name,
         name: salaryModal.full_name
       }]);

       showToast(`✅ Salary paid to ${salaryModal.full_name}`);
       setSalaryModal(null); refresh();
    } catch (e: any) { showErr(e.message || 'Payment failed'); }
    finally { setSaving(false); }
  };

  const payAdvanceSalary = async () => {
    if (!advanceSalaryModal) return;
    const amt = Number(advanceForm.amount);
    if (!amt || amt <= 0) { showErr('Enter a valid advance amount'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('teacher_salaries').insert([{
        teacher_id: advanceSalaryModal.id,
        teacher_name: advanceSalaryModal.full_name,
        monthly_salary: 0,
        bonus: 0,
        fine: 0,
        deductions: 0,
        net_salary: amt,
        payment_date: new Date().toISOString(),
        payment_method: advanceForm.method,
        notes: advanceForm.notes || advanceForm.reason,
        recorded_by: adminData.full_name,
        is_advance: true,
        advance_note: advanceForm.reason,
      }]);
      if (error) throw error;
      await supabase.from('expenses').insert([{
        description: `Advance Salary: ${advanceSalaryModal.full_name}`,
        amount: amt,
        category: 'Advance Salary',
        expense_date: new Date().toISOString().slice(0, 10),
        recorded_by: adminData.full_name,
        name: advanceSalaryModal.full_name,
        paid_to: advanceSalaryModal.full_name,
      }]);
      showToast(`✅ Advance of ${PKR(amt)} paid to ${advanceSalaryModal.full_name}`);
      setAdvanceSalaryModal(null);
      setAdvanceForm({ amount: '', reason: '', method: 'Cash', notes: '' });
      refresh();
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
  const todayOtherInc  = income.filter(i => i.income_date === today).reduce((s, i) => s + i.amount, 0);
  const todayRevenue   = (todayTx.reduce((s, t) => s + Number(t.amount_paid || 0), 0)) + todayOtherInc;

  // Monthly Balance Tracking (Calculated Monthly, resets counter per month but carries forward unpaid)
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const calculateBalance = (g: any) => {
    const amount = Number(g.amount || 0);
    const paid = Number(g.paid || 0);
    const fine = Number(g.fine || 0);
    const discount = Number(g.discount || 0);
    return Math.max(0, amount + fine - paid - discount);
  };

  const totalBalance = feeGroups
    .filter(g => !g.due_date || g.due_date <= endOfMonth)
    .reduce((s, g) => s + calculateBalance(g), 0);
    
  const totalFines = feeGroups.reduce((s, g) => s + (g.fine || 0), 0);

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
  const SUPER_NAV_GROUPS = [
    {
      group: 'Dashboard',
      items: [{ id: 'dashboard', label: 'Overview', icon: Home }]
    },
    {
      group: 'Accounts',
      items: [
        { id: 'fee-ledger',   label: 'Fee Ledger',   icon: DollarSign },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'income',       label: 'Income Mgmt',  icon: BarChart3 },
        { id: 'expense-header', label: 'Expense Headers', icon: Tag },
        { id: 'expenses',     label: 'Expenses',     icon: Minus },
        { id: 'salaries',     label: 'Teacher Salaries', icon: UserCheck }
      ]
    },
    {
      group: 'Academics',
      items: [
        { id: 'staff',      label: 'Teachers',     icon: UserCog },
        { id: 'academics',  label: 'Academics Portal', icon: GraduationCap },
        { id: 'exams', label: 'Examiner Portal', icon: FileText },
        { id: 'leaves',     label: 'Leaves',       icon: Calendar },
        { id: 'scheme',     label: 'Topics/Schedules', icon: BookOpen }
      ]
    },
    {
      group: 'Admissions',
      items: [
        { id: 'admissions', label: 'Admission Forms', icon: FileText },
        { id: 'students',   label: 'Student Records',  icon: Users }
      ]
    },
    {
      group: 'Registrar',
      items: [
        { id: 'new-admission', label: 'Quick Register', icon: UserPlus },
        { id: 'sections',      label: 'Section Mgmt',    icon: Layers }
      ]
    },
    {
      group: 'Permissions',
      items: [
        { id: 'permissions', label: 'Access Control', icon: Shield }
      ]
    }
  ];

  // Define base navs
  const PRINCIPAL_NAV_BASE = [
    { id: 'dashboard',   label: 'Dashboard',  icon: Home },
    { id: 'students',    label: 'Students',   icon: Users },
    { id: 'academics',   label: 'Academics',  icon: GraduationCap },
    { id: 'leaves',      label: 'Leaves',     icon: Calendar },
    { id: 'admissions',  label: 'Admissions', icon: FileText },
    { id: 'staff',       label: 'Staff',      icon: UserCog },
    { id: 'permissions', label: 'Perms',      icon: Shield },
    { id: 'scheme',      label: 'Scheme',     icon: BookOpen },
  ];
  const PRINCIPAL_NAV = PRINCIPAL_NAV_BASE;
  const ACCOUNTANT_NAV = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Home },
    { id: 'fee-ledger',    label: 'Fee Ledger',    icon: DollarSign },
    { id: 'fee-groups',    label: 'Fee Groups',    icon: CreditCard },
    { id: 'transactions',  label: 'Transactions',  icon: Receipt },
    { id: 'salaries',      label: 'Salaries',      icon: UserCheck },
    { id: 'admissions',    label: 'Admissions',    icon: FileText },
    { id: 'expense-header', label: 'Expense Header', icon: Tag },
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
    'expense-header': 'Expense Header Management',
    'fee-groups': 'Fee Groups', transactions: 'Transactions',
    discounts: 'Discount Requests', reports: 'Financial Reports',
    salaries: 'Teacher Salaries',
    staff: 'Staff & Role Management', permissions: 'Permission Control', scheme: 'Scheme of Study',
  };

  if (showAcademicsPortal) {
  return (
    <AcademicsPortal
      adminData={adminData}
      onBack={() => setShowAcademicsPortal(false)}
    />
  );
}

if (showExaminerPortal) {
  return (
    <ExaminerPortal
      adminData={adminData}
      onLogout={() => setShowExaminerPortal(false)}
    />
  );
}

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
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {isSuperAdmin ? (
            SUPER_NAV_GROUPS.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{group.group}</p>
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = tab === id;
                  return (
                    <motion.button 
                      key={id} 
                      onClick={() => {
                        if (id === 'academics') setShowAcademicsPortal(true);
                        else if (id === 'exams') setShowExaminerPortal(true);
                        else setTab(id);
                      }} 
                      whileHover={{ x: 2 }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all text-left', 
                        active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      )}
                      style={active ? { background: GRADIENT } : {}}>
                      <Icon size={14} /><span className="flex-1">{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            ))
          ) : (
            NAV.map(({ id, label, icon: Icon }) => {
              if (id === 'academics') return (
  <motion.button key={id} onClick={() => setShowAcademicsPortal(true)} whileHover={{ x: 2 }}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800">
    <GraduationCap size={16} /><span className="flex-1">Academics Portal</span>
  </motion.button>
);
const active = tab === id; const badgeN = getBadge(id);
              return (
                <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: 2 }}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left', active ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
                  style={active ? { background: GRADIENT } : {}}>
                  <Icon size={16} /><span className="flex-1">{label}</span>
                  {badgeN > 0 && <span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center" style={{ background: '#C0392B' }}>{badgeN > 9 ? '9+' : badgeN}</span>}
                </motion.button>
              );
            })
          )}
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
                    <button onClick={() => setShowAcademicsPortal(true)} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>Full Overview →</button>
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

                        {/* Fee Summary for Principal */}
                        <div>
                          <p className="font-black text-slate-900 text-sm mb-3">💰 Fee Summary</p>
                          {studentLoading ? <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading...</span></div>
                            : stuFeeGroups.length === 0 ? <p className="text-sm text-slate-400 italic">No fee records assigned</p>
                            : (
                              <div className="space-y-3">
                                {(() => {
                                  const totalAmt = stuFeeGroups.reduce((s: number, f: any) => s + (f.amount || 0), 0);
                                  const totalPd = stuFeeGroups.reduce((s: number, f: any) => s + (f.paid || 0), 0);
                                  const totalDisc = stuFeeGroups.reduce((s: number, f: any) => s + (f.discount || 0), 0);
                                  const balance = totalAmt - totalPd - totalDisc;
                                  const paidPct = totalAmt > 0 ? Math.round((totalPd / totalAmt) * 100) : 0;
                                  
                                  return (
                                    <>
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                          <p className="text-sm font-black text-slate-900">{PKR(totalAmt)}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Paid</p>
                                          <p className="text-sm font-black text-emerald-700">{PKR(totalPd)}</p>
                                        </div>
                                        <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Balance</p>
                                          <p className="text-sm font-black text-rose-700">{PKR(balance)}</p>
                                        </div>
                                      </div>
                                      <ProgressBar pct={paidPct} color={paidPct >= 100 ? '#059669' : '#0D9488'} label="Payment Progress" sub={`${paidPct}% of total fees cleared`} />
                                    </>
                                  );
                                })()}
                              </div>
                            )}
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

            {!isAccountant && tab === 'staff' && (
              <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-white rounded-2xl px-4 py-2 border border-slate-100 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-800">{staffList.length} Personnel</p>
                  </div>
                  {isSuperAdmin && (
                    <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 rounded-xl text-sm font-black text-white" style={{ background: GRADIENT }}>
                      Add Portal User
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffList.map((s: any) => (
                    <motion.div key={s.id} whileHover={{ y: -2 }} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg" style={{ background: `hsl(${(s.id.length * 45) % 360},65%,45%)` }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 truncate">{s.full_name}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{s.role}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-mono">@{s.username}</p>
                        {isSuperAdmin && <button onClick={() => { setSelectedStaff(s); setShowAssignModal(true); }} className="text-xs font-bold text-blue-600 hover:underline">Manage Access →</button>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Guest Account Info for Verification */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    <h4 className="font-black text-indigo-900 uppercase tracking-widest text-sm">Guest Verification Accounts</h4>
                  </div>
                  <p className="text-sm text-indigo-700 mb-4 font-medium">Use these credentials for Google Play Console verification or testing:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { role: 'Principal', user: 'principal_guest', pass: 'picguest123' },
                      { role: 'Accountant', user: 'accountant_guest', pass: 'picguest123' },
                      { role: 'Teacher', user: 'teacher_guest', pass: 'picguest123' },
                      { role: 'Examiner', user: 'examiner_guest', pass: 'picguest123' }
                    ].map(g => (
                      <div key={g.role} className="bg-white rounded-2xl p-4 border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{g.role}</p>
                        <p className="text-xs font-bold text-slate-700">Username: <span className="font-mono text-indigo-600">{g.user}</span></p>
                        <p className="text-xs font-bold text-slate-700">Password: <span className="font-mono text-indigo-600">{g.pass}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isAccountant && tab === 'permissions' && (
              <motion.div key="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-4">
                  <div className="flex items-center gap-3">
                    <Lock size={18} className="text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">Role-based Access Control (RBAC)</p>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">Modify the global permissions for each designated role. Changes apply to all users assigned that specific role.</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest text-left border-b border-slate-100">
                        <th className="px-6 py-3">Portal Role</th>
                        <th className="px-6 py-3">Permission Level</th>
                        <th className="px-6 py-3">Special Rights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.keys(allPermissions).map(role => (
                        <tr key={role} className={cn("hover:bg-slate-50 transition-all", isSuperAdmin ? "cursor-pointer" : "")}>
                          <td className="px-6 py-4 font-black text-slate-900">{role}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                              {role === 'Director' ? 'Owner' : role === 'Principal' ? 'Admin' : 'Standard'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">
                             {role === 'Director' ? 'Global Override' : 'Restricted to Module Access'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {(isAccountant || isSuperAdmin) && tab === 'fee-groups' && (
              <FeeGroupsTab adminData={adminData} GRADIENT={GRADIENT} ACCENT={ACCENT} showToast={showToast} showErr={showErr} PKR={PKR} students={students} />
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
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                setPreview(f);
                                setInstDates(Array(f.num_installments || f.installments || 3).fill(new Date().toISOString().split('T')[0]));
                            }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200"><Eye size={10} /> View</motion.button>
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
            {(isAccountant || isSuperAdmin) && tab === 'fee-ledger' && (() => {
              const studentsWithFees = students.filter(s => {
                const groups = feeGroups.filter(g => String(g.student_roll) === String(s.roll_no));
                if (groups.length === 0) return false;
                
                if (ledgerStatus) {
                  if (ledgerStatus === 'Unpaid' && !groups.some(g => g.status === 'Unpaid')) return false;
                  if (ledgerStatus === 'Paid' && groups.some(g => g.status !== 'Paid')) return false;
                  if (ledgerStatus === 'Partial' && (!groups.some(g => g.status === 'Partial') && !groups.some(g => g.status === 'Paid'))) return false;
                }
                if (ledgerProgram && s.program !== ledgerProgram) return false;
                if (ledgerSection && s.class_section !== ledgerSection) return false;
                if (ledgerGender && s.gender !== ledgerGender) return false;
                if (ledgerCategory) {
                  const isUni = isUniversityProgram(s.applied_for);
                  if (ledgerCategory === 'university' && !isUni) return false;
                  if (ledgerCategory === 'intermediate' && isUni) return false;
                }
                if (searchQ) {
                  const q = searchQ.toLowerCase();
                  return String(s.roll_no).includes(q) || s.full_name?.toLowerCase().includes(q);
                }
                return true;
              });

              if (selectedLedgerRoll) {
                const s = students.find(x => x.roll_no === selectedLedgerRoll);
                const sFees = (stuFeeGroups.length > 0 ? stuFeeGroups : feeGroups.filter(g => String(g.student_roll) === String(selectedLedgerRoll)));
                
                const filteredFees = sFees.filter(g => {
                  if (feeFilter === 'Paid') return g.status === 'Paid';
                  if (feeFilter === 'Unpaid') return g.status !== 'Paid';
                  return true;
                });

                if (s) {
                   return (
                     <motion.div key="full-ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                       <div className="flex items-center justify-between">
                          <button onClick={() => { setSelectedLedgerRoll(null); setFeeFilter('All'); setSelectedFeeIds([]); }} className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900 transition-all">
                            ← Back to Students List
                          </button>
                          <div className="flex gap-2">
                             <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                               {['All', 'Paid', 'Unpaid'].map(f => (
                                 <button key={f} onClick={() => { setFeeFilter(f); setSelectedFeeIds([]); }}
                                   className={cn('px-4 py-1.5 rounded-lg text-[10px] font-black transition-all', 
                                     feeFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700')}>
                                   {f}
                                 </button>
                               ))}
                             </div>
                             <button onClick={() => {
                                  if (selectedFeeIds.length === 0 && filteredFees.length === 0) {
                                    handlePrint([]); // Should show No Rec Found
                                    return;
                                  }
                                  const toPrint = selectedFeeIds.length > 0 
                                    ? sFees.filter(f => selectedFeeIds.includes(f.id)) 
                                    : filteredFees;
                                  handlePrint(toPrint);
                                }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-black active:scale-95 transition-all">
                               <Printer size={14} /> {selectedFeeIds.length > 0 ? `Print Selected (${selectedFeeIds.length})` : 'Print Ledger'}
                             </button>
                          </div>
                       </div>

                       <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                         <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                           <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl" style={{ background: GRADIENT }}>{s.full_name?.charAt(0)}</div>
                             <div>
                               <h3 className="text-xl font-black text-slate-900 leading-none">{s.full_name}</h3>
                               <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{s.roll_no} · {s.program} · {s.class_section}</p>
                             </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                              <p className="text-3xl font-black text-rose-600 font-mono">{PKR(sFees.reduce((acc, g) => acc + (g.balance || 0), 0))}</p>
                           </div>
                         </div>

                         <div className="p-8 bg-slate-50/30">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Total Package</p>
                                 <p className="text-2xl font-black text-slate-900">{PKR(s.total_package)}</p>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Total Paid</p>
                                 <p className="text-2xl font-black text-emerald-600">{PKR(s.paid_amount)}</p>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70">Scholarship/Disc.</p>
                                 <p className="text-2xl font-black text-blue-600">{PKR(sFees.reduce((acc,g)=>acc+(g.discount||0), 0))}</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Detailed Statement</p>
                                 {selectedFeeIds.length > 0 && (
                                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                                     {selectedFeeIds.length} items selected for printing
                                   </p>
                                 )}
                              </div>
                              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                 <table className="w-full text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                       <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                          <th className="px-4 py-4 text-center">
                                            <input 
                                              type="checkbox" 
                                              checked={filteredFees.length > 0 && selectedFeeIds.length === filteredFees.length} 
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedFeeIds(filteredFees.map(f => f.id));
                                                else setSelectedFeeIds([]);
                                              }}
                                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                          </th>
                                          <th className="px-6 py-4 text-left">Fee Category</th>
                                          <th className="px-6 py-4 text-left">Status</th>
                                          <th className="px-6 py-4 text-right">Amount</th>
                                          <th className="px-6 py-4 text-right">Paid</th>
                                          <th className="px-6 py-4 text-right">Fine</th>
                                          <th className="px-6 py-4 text-right">Balance</th>
                                          <th className="px-6 py-4 text-center">Action</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                       {filteredFees.map(g => (
                                         <tr key={g.id} className={cn('hover:bg-slate-50 transition-all', selectedFeeIds.includes(g.id) ? 'bg-indigo-50/30' : '')}>
                                            <td className="px-4 py-4 text-center">
                                              <input 
                                                type="checkbox" 
                                                checked={selectedFeeIds.includes(g.id)} 
                                                onChange={(e) => {
                                                  if (e.target.checked) setSelectedFeeIds(prev => [...prev, g.id]);
                                                  else setSelectedFeeIds(prev => prev.filter(id => id !== g.id));
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                            </td>
                                            <td className="px-6 py-4">
                                               <p className="font-black text-slate-800">{g.fees_group}</p>
                                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{g.fees_code}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                               <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap', 
                                                 g.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : g.status === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>
                                                 {g.status}
                                               </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">{PKR(g.amount)}</td>
                                            <td className="px-6 py-4 text-right font-black text-emerald-600">{PKR(g.paid)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-500">{PKR(g.fine || 0)}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 border-l border-slate-50" style={{ background: g.balance > 0 ? '#fffafb' : '' }}>{PKR(g.balance)}</td>
                                            <td className="px-6 py-4">
                                               <div className="flex justify-center gap-2">
                                                  {g.status !== 'Paid' && g.balance > 0 && (
                                                     <button onClick={() => { setCollectModal(g); setFeePayForm({ amount: String(g.balance), method: 'Cash', receipt: '', discount: '' }); }}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black text-white shadow-md shadow-emerald-500/20"
                                                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                                                        Collect
                                                     </button>
                                                  )}
                                                  {(isSuperAdmin || hasPermission('edit_accounts')) && (
                                                     <button onClick={() => setDeleteId(g.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-colors">
                                                        <Trash2 size={14} />
                                                     </button>
                                                  )}
                                               </div>
                                            </td>
                                         </tr>
                                       ))}
                                       {filteredFees.length === 0 && (
                                         <tr>
                                           <td colSpan={8} className="py-20 text-center">
                                             <div className="flex flex-col items-center gap-2">
                                               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                 <Receipt size={32} />
                                               </div>
                                               <p className="text-slate-500 font-bold">No fee record found for this filter</p>
                                             </div>
                                           </td>
                                         </tr>
                                       )}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                         </div>
                       </div>
                     </motion.div>
                   );
                }
              }

              const totalOutstanding = studentsWithFees.reduce((acc, s) => {
                 const groups = feeGroups.filter(g => String(g.student_roll) === String(s.roll_no));
                 return acc + groups.reduce((s2, g) => s2 + (g.balance || 0), 0);
              }, 0);

              const selectedStudent = students.find(s => s.roll_no === selectedLedgerRoll);
              const selectedStudentFees = feeGroups.filter(g => String(g.student_roll) === String(selectedLedgerRoll));

              return (
                <motion.div key="ledger" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <DollarSign size={16} className="text-blue-600 flex-shrink-0" />
                      <p className="text-sm font-bold text-blue-900">Fee Ledger — Grouped by student. Click "View Ledger" to see individual fees.</p>
                    </div>
                    <p className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Total Outstanding: {PKR(totalOutstanding)}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[{ l: 'Total Balanced', v: feeGroups.filter(g=>g.status === 'Paid').length, c: '#059669', bg: 'bg-emerald-50' }, { l: 'Partial', v: feeGroups.filter(g=>g.status === 'Partial').length, c: '#D97706', bg: 'bg-amber-50' }, { l: 'Unpaid Items', v: feeGroups.filter(g=>g.status === 'Unpaid').length, c: '#C0392B', bg: 'bg-rose-50' }, { l: 'Students List', v: studentsWithFees.length, c: '#1e3a8a', bg: 'bg-blue-50' }].map(({ l, v, c, bg }) => (
                      <div key={l} className={cn('rounded-2xl p-4 border border-slate-100 text-center', bg)}><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className="text-xl font-black" style={{ color: c }}>{v}</p></div>
                    ))}
                  </div>
                  {/* Filters */}
                  <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Students</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                             value={searchQ} onChange={e => setSearchQ(e.target.value)} 
                             placeholder="Roll No or Name..." 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Status</label>
                        <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 px-4 h-[48px] focus:border-blue-500/50 outline-none transition-all text-xs font-black appearance-none">
                           <option value="" className="bg-slate-800">All Students (Paid + Unpaid)</option>
                           <option value="Unpaid" className="bg-slate-800">Pending Balance Only</option>
                           <option value="Paid" className="bg-slate-800">Cleared (Zero Balance)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Major Program</label>
                        <select value={ledgerProgram} onChange={e => { setLedgerProgram(e.target.value); setLedgerSection(''); }} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 px-4 h-[48px] focus:border-blue-500/50 outline-none transition-all text-xs font-black appearance-none">
                           <option value="" className="bg-slate-800">All Programs</option>
                           {PROGRAMS.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
                           {BS_PROGRAMS.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Class</label>
                        <select value={ledgerSection} onChange={e => setLedgerSection(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 px-4 h-[48px] focus:border-blue-500/50 outline-none transition-all text-xs font-black appearance-none">
                           <option value="" className="bg-slate-800">All Sections</option>
                           {[...new Set(students.filter(st => !ledgerProgram || st.program === ledgerProgram).map(st => st.class_section))].sort().map(s => (
                             <option key={s as string} value={s as string} className="bg-slate-800">{s as string}</option>
                           ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead style={{ background: '#f8f9fd' }}>
                          <tr>{['Roll #', 'Student Name', 'Program', 'Total Package', 'Paid', 'Outstanding', 'Action'].map(h => <th key={h} className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {studentsWithFees.map((s, i) => {
                             const sFees = feeGroups.filter(g => String(g.student_roll) === String(s.roll_no));
                             const totalOut = sFees.reduce((acc, g) => acc + (g.balance || 0), 0);
                             return (
                               <motion.tr key={s.roll_no} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i*0.01, 0.4) }} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                 <td className="px-5 py-3 font-mono font-bold text-slate-900">{s.roll_no}</td>
                                 <td className="px-5 py-3">
                                   <p className="font-black text-slate-800 leading-none">{s.full_name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold mt-1">{s.class_section}</p>
                                 </td>
                                 <td className="px-5 py-3 text-slate-500 font-medium">{s.program}</td>
                                 <td className="px-5 py-3 font-bold text-slate-700">{PKR(s.total_package)}</td>
                                 <td className="px-5 py-3 font-bold text-emerald-600">{PKR(s.paid_amount)}</td>
                                 <td className="px-5 py-3 font-black text-rose-600">{PKR(totalOut)}</td>
                                 <td className="px-5 py-3">
                                   <button onClick={async () => { 
                                     setSelectedLedgerRoll(s.roll_no);
                                     setStuFeeLoading(true);
                                     const { data } = await supabase.from('fee_groups').select('*').eq('student_roll', s.roll_no).order('created_at', { ascending: false });
                                     setStuFeeGroups((data || []).map((g: any) => ({ ...g, balance: (g.amount || 0) + (g.fine || 0) - (g.paid || 0) - (g.discount || 0) })));
                                     setStuFeeLoading(false);
                                   }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black text-white shadow-lg shadow-indigo-200" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                                     {stuFeeLoading && selectedLedgerRoll === s.roll_no ? <Loader2 size={12} className="animate-spin" /> : <><Eye size={12} /> View Ledger</>}
                                   </button>
                                 </td>
                               </motion.tr>
                             );
                          })}
                          {studentsWithFees.length === 0 && <tr><td colSpan={7} className="py-20 text-center text-slate-400">No students found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table */}
                </motion.div>
              );
            })()}

            {/* ════ ACCOUNTANT TRANSACTIONS ════ */}
            {(isAccountant || isSuperAdmin) && tab === 'transactions' && (
              <motion.div key="txns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: 'Total Transactions', v: transactions.length, c: 'text-slate-900' }, { l: "Today's Count", v: todayTx.length, c: 'text-blue-700' }, { l: "Today's Revenue", v: PKR(todayRevenue), c: 'text-emerald-600' }].map(({ l, v, c }) => (
                    <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-xl font-black', c)}>{v}</p></div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-2 px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction History</p>
                  <motion.button 
                    id="printVoucherBtn"
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handlePrint(transactions.filter(t => selectedTxIds.includes(t.id)))}
                    className="px-6 py-2 rounded-2xl bg-blue-600 text-white font-black text-xs shadow-xl shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Printer size={15} /> Print Selected ({selectedTxIds.length})
                  </motion.button>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
                    <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="sticky top-0" style={{ background: '#f8f9fd' }}>
                  <th className="px-4 py-3 border-b border-slate-100">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedTxIds(e.target.checked ? transactions.map(t => t.id) : [])}
                      checked={selectedTxIds.length === transactions.length && transactions.length > 0}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {['Date', 'Roll #', 'Amount', 'Method', 'Collected By', 'Type', 'Receipt', 'Confirmed By', ''].map(h => <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.008, 0.3) }} className={cn('border-b border-slate-50 hover:bg-slate-50/50', selectedTxIds.includes(t.id) && 'bg-blue-50/50')}>
                    <td className="px-4 py-2.5">
                      <input 
                        type="checkbox" 
                        className="transaction-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        data-id={t.id}
                        checked={selectedTxIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTxIds(p => [...p, t.id]);
                          else setSelectedTxIds(p => p.filter(id => id !== t.id));
                        }}
                      />
                    </td>
                            <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}</td>
                            <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{t.student_roll_link}</td>
                            <td className="px-4 py-2.5 font-black text-emerald-600">{PKR(Number(t.amount_paid))}</td>
                            <td className="px-4 py-2.5 text-slate-600">{t.payment_method || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-600">{t.collected_by || '—'}</td>
                            <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700">{t.transaction_type || 'Payment'}</span></td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{t.receipt_serial || '—'}</td>
                            <td className="px-4 py-2.5">{t.confirmed_by ? <span className="text-emerald-600 font-bold text-[10px]">✓ {t.confirmed_by}</span> : <span className="text-amber-500 text-[10px]">Pending</span>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && !t.is_reversed && (
                          <button onClick={() => handleUndoTransaction(t)} title="Undo/Reverse" className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"><RefreshCw size={14} /></button>
                        )}
                        <button 
                          onClick={() => handlePrint(t)} 
                          disabled={t.is_reversed}
                          title={t.is_reversed ? "Reversed" : "Print Receipt"}
                          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all active:scale-90 disabled:opacity-30"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
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

            {/* ════ EXPENSE HEADERS ════ */}
            {(isAccountant || isSuperAdmin) && tab === 'expense-header' && (
              <motion.div key="exp-hd" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl overflow-hidden">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm"><Tag size={28} /></div>
                    <h2 className="text-2xl font-black text-slate-900">Expense Headlines / Tags</h2>
                    <p className="text-sm text-slate-500 font-medium">Create fixed categories for proper expense classification</p>
                  </div>

                  <div className="flex gap-3 mb-8">
                    <TI placeholder="e.g. Electricity, Rent, Salary..." value={newExpenseHeader} onChange={(e: any) => setNewExpenseHeader(e.target.value)} />
                    <button 
                      onClick={saveExpenseHeader}
                      disabled={saving || !newExpenseHeader.trim()}
                      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : 'Add Tag'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Existing Tags ({expenseHeaders.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {expenseHeaders.map(h => (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                          <span className="font-bold text-slate-700 text-sm">{h.name}</span>
                          <button onClick={() => deleteExpenseHeader(h.id)} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {expenseHeaders.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">No expense tags defined yet</p>}
                  </div>
                </div>
              </motion.div>
            )}

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
                  <div className="px-5 py-3 border-b border-slate-100 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Forms</p>
                      <button 
                        onClick={() => {
                          const rows = filteredAdmForms.map(f => [f.student_name, f.father_name, f.program, f.matric_percentage+'%', f.status, f.cell_no || '—', f.created_at?.slice(0,10) || '—']);
                          handlePrintList('Admissions Report', ['Candidate','Parent','Program','Matric %','Status','Contact','Date'], rows);
                        }}
                        className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline"
                      >
                        <Printer size={12} /> Print Report
                      </button>
                    </div>
                  </div>
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
                                <button onClick={() => {
                                    setPreview(f);
                                    setInstDates(Array(f.num_installments || f.installments || 3).fill(new Date().toISOString().split('T')[0]));
                                }} className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1"><Eye size={10} />View</button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                                  setAdmForm({
                                    applied_for:        f.applied_for        || 'Intermediate',
                                    program:            f.program            || 'ICS Physics',
                                    part:               f.part               || 1,
                                    session:            f.session            || '2026-28',
                                    student_name:       f.student_name       || '',
                                    b_form_nic:         f.b_form_nic         || '',
                                    father_name:        f.father_name        || '',
                                    father_nic:         f.father_nic         || '',
                                    father_occupation:  f.father_occupation  || '',
                                    student_dob:        f.student_dob        || '',
                                    contact_home:       f.contact_home       || '',
                                    cell_no:            f.cell_no            || '',
                                    whatsapp_no:        f.whatsapp_no        || '',
                                    email:              f.email              || '',
                                    religion:           f.religion           || 'Islam',
                                    gender:             f.gender             || 'Male',
                                    current_address:    f.current_address    || '',
                                    matric_year:        f.matric_year        || '',
                                    matric_roll_no:     f.matric_roll_no     || '',
                                    matric_marks:       f.matric_marks       || '',
                                    matric_subjects:    f.matric_subjects    || '',
                                    matric_board:       f.matric_board       || 'BISE Gujranwala',
                                    matric_division:    f.matric_division    || '',
                                    matric_percentage:  f.matric_percentage  || '',
                                    inter_year:         f.inter_year         || '',
                                    inter_roll_no:      f.inter_roll_no      || '',
                                    inter_marks:        f.inter_marks        || '',
                                    inter_subjects:     f.inter_subjects     || '',
                                    inter_board:        f.inter_board        || 'BISE Gujranwala',
                                    inter_division:     f.inter_division     || '',
                                    graduation_year:    f.graduation_year    || '',
                                    graduation_roll_no: f.graduation_roll_no || '',
                                    graduation_marks:   f.graduation_marks   || '',
                                    graduation_board:   f.graduation_board   || '',
                                    graduation_division:f.graduation_division|| '',
                                    fee_package:        f.fee_package        || 8000,
                                    student_type:       f.student_type       || 'Regular',
                                    is_fresher:         f.is_fresher         ?? true,
                                    num_instalments:    f.num_instalments    || 1,
                                    notes:              f.notes              || '',
                                    _editingId:         f.id,
                                  });
                                  setTab('new-admission');
                                }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                  <Save size={10} /> Edit
                                </motion.button>
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
            {(isAccountant || isSuperAdmin) && tab === 'new-admission' && (() => {
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
                        <p className="text-sm text-slate-500 mt-1">Session: <strong>2026-28</strong></p>
                        <div className="mt-2 w-20 h-24 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-[9px] text-slate-400 font-bold ml-auto overflow-hidden relative group">
                          {admForm._localPhotoPreview ? (
                            <img src={admForm._localPhotoPreview} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                               <Camera size={16} className="mx-auto mb-1 text-slate-300" />
                               PHOTO
                            </div>
                          )}
                          <input type="file" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setF('_localPhotoPreview', URL.createObjectURL(file));
                              const url = await uploadStudentPhoto(file);
                              if (url) setF('student_photo_url', url);
                            }
                          }} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                    <div className="px-6 md:px-8 py-6 space-y-6">
                      <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
                        <F label="Form No."><div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black" style={{ color: FA }}>Auto-assigned</div></F>
                        <F label="Roll No."><div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black" style={{ color: FA }}>Auto (2628XXX)</div></F>
                        <F label="Session"><TS value={admForm.session} onChange={e => setF('session', e.target.value)}><option>2026-28</option><option>2025-27</option><option>2024-26</option></TS></F>
                      </div>
                      <div className="pb-5 border-b border-slate-100 space-y-4">
                        <F label="Applied For" req>
                          <div className="flex flex-wrap gap-5 mt-2">
                            {['Intermediate', 'ADP', 'BS', 'BS 5th Semester', 'Category B', 'Others'].map(o => (
                              <label key={o} className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                setF('applied_for', o);
                                if (isUniversityProgram(o)) {
                                  const progs = getUniversityPrograms(o);
                                  setF('program', progs[0] || '');
                                } else {
                                  setF('program', 'ICS Physics');
                                }
                              }}>
                                <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={admForm.applied_for === o ? { background: FA, borderColor: FA } : { borderColor: '#94a3b8' }}>{admForm.applied_for === o && <div className="w-2 h-2 bg-white rounded-sm" />}</div>
                                <span className="text-sm text-slate-700">{o}</span>
                              </label>
                            ))}
                          </div>
                        </F>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <F label="Program" req>
                            <TS value={admForm.program} onChange={e => setF('program', e.target.value)}>
                              {(isUniversityProgram(admForm.applied_for) ? getUniversityPrograms(admForm.applied_for) : PROGRAMS).map(p => <option key={p}>{p}</option>)}
                            </TS>
                          </F>
                          <F label="Part / Semester" req>
                            <TS value={admForm.part} onChange={e => setF('part', Number(e.target.value))}>
                              {isUniversityProgram(admForm.applied_for) ? (
                                [1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)
                              ) : (
                                <>
                                  <option value={1}>Part 1 (XI)</option>
                                  <option value={2}>Part 2 (XII)</option>
                                </>
                              )}
                            </TS>
                          </F>
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
                                <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={admForm.matric_marks} onChange={e => {
                                  const obtained = Number(e.target.value);
                                  const total = 1100; // usually
                                  const pctVal = obtained > 0 ? (obtained / total) * 100 : 0;
                                  setAdmForm((p: any) => ({ ...p, matric_marks: obtained, matric_percentage: pctVal.toFixed(1) }));
                                }} /></td>
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
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest mt-6" style={{ background: FA }}>Optional/Add-on Fees</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                           {[
                             { k: 'include_welcome_party', ak: 'welcome_party_amount', l: 'Welcome Party Fee', d: 'Freshers party charges' },
                             { k: 'include_exam_fee', ak: 'exam_fee_amount', l: 'Internal Exam Fee', d: 'Full year exams' },
                             { k: 'include_registration_fee', ak: 'registration_fee_amount', l: 'Board Registration', d: 'Registration process' },
                             { k: 'include_student_card', ak: 'student_card_amount', l: 'Student ID Card', d: 'Physical card print' },
                             { k: 'include_annual_charges', ak: 'annual_charges_amount', l: 'Annual Charges', d: 'Campus maintenance' },
                           ].map(item => (
                             <div key={item.k} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                               <div className="flex items-center gap-3">
                                 <button onClick={() => setF(item.k, !(admForm as any)[item.k])} className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all', (admForm as any)[item.k] ? 'bg-orange-600 border-orange-600' : 'border-slate-300')}>
                                   {(admForm as any)[item.k] && <Check size={12} className="text-white" />}
                                 </button>
                                 <div><p className="text-xs font-black text-slate-700">{item.l}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{item.d}</p></div>
                               </div>
                               <div className="w-24"><TI type="number" value={(admForm as any)[item.ak]} onChange={(e:any)=>setF(item.ak, e.target.value)} placeholder="Amount" /></div>
                             </div>
                           ))}
                        </div>
                      </div>
                      {/* ══ FEE PACKAGE ══ */}
                      <div className="pb-5 border-b border-slate-100 space-y-4">
                        <div className="inline-block text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest" style={{ background: FA }}>Fee Package</div>
                        {admForm.student_type === 'Summer Camp' ? (
                          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                             <p className="text-sm font-black text-amber-700">Summer Camp Fee Applied</p>
                             <p className="text-xs text-amber-600 mt-1">A total package of 7,000 (Summer Camp Fee) will be applied.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <F label="Total Package Amount (Accountant Defined)" req>
                                <TI type="number" value={admForm.fee_package} onChange={(e: any) => setF('fee_package', e.target.value)} placeholder="e.g. 50000" />
                              </F>
                              <F label="No. of Installments" req>
                                <TS value={admForm.num_installments} onChange={(e: any) => setF('num_installments', Number(e.target.value))}>
                                  {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
                                </TS>
                              </F>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                              <p className="text-xs text-orange-700 font-bold flex items-center gap-2 italic">
                                <AlertTriangle size={14} className="text-orange-500"/> Note: Summer Camp Fee (7,000) and Uniform Fee (1,000) will be added automatically.
                              </p>
                            </div>
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
                          {saving ? <><Loader2 size={15} className="animate-spin" /> {admForm._editingId ? 'Updating…' : 'Saving…'}</> : <><Save size={15} /> {admForm._editingId ? 'Update Admission Form' : 'Save Admission Form'}</>}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* ════ ACCOUNTANT DISCOUNTS ════ */}
            {(isAccountant || isSuperAdmin) && tab === 'discounts' && (
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
            {(isAccountant || isSuperAdmin) && tab === 'students' && (
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
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-slate-500">{filteredStudents.length} of {students.length} students · click a row to view full profile</p>
                      <button 
                        onClick={() => {
                          const rows = filteredStudents.map(s => [s.roll_no, s.full_name, s.father_name || '—', s.class_section, s.program, s.gender, s.status]);
                          handlePrintList('Student Record Report', ['Roll','Name','Father','Class','Program','Gender','Status'], rows);
                        }}
                        className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline"
                      >
                        <Printer size={12} /> Print Student List
                      </button>
                    </div>
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
                            <div className="flex flex-col gap-3 mb-4">
                              <div className="flex items-center justify-between">
                                <p className="font-black text-slate-900 text-sm">💰 Fee Summary</p>
                                <div className="flex gap-3 text-[10px] font-bold text-slate-400">
                                  <span>Paid: <strong className="text-emerald-600">{PKR(stuFeeGroups.reduce((t, g) => t + (g.paid || 0), 0))}</strong></span>
                                  <span>Due: <strong className="text-rose-600">{PKR(stuFeeGroups.reduce((t, g) => t + (g.balance || 0), 0))}</strong></span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                  {(['All', 'Paid', 'Unpaid'] as const).map(f => (
                                    <button key={f} onClick={() => setStuFeeFilter(f)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black transition-all', stuFeeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{f}</button>
                                  ))}
                                </div>
                                
                                {selectedFeeGroups.size > 0 && (
                                  <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setShowVoucherModal(stuFeeGroups.filter(g => selectedFeeGroups.has(g.id)))}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                    <Printer size={12} /> Print Selected ({selectedFeeGroups.size})
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {stuFeeGroups.length === 0
                              ? <p className="text-sm text-slate-400 italic">No fee records assigned yet</p>
                              : (
                                <div className="space-y-2">
                                  {stuFeeGroups.filter(g => {
                                    if (stuFeeFilter === 'Paid') return g.status === 'Paid';
                                    if (stuFeeFilter === 'Unpaid') return g.status === 'Unpaid' || g.status === 'Partial';
                                    return true;
                                  }).map(g => (
                                    <div key={g.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border transition-all', g.status === 'Paid' ? 'bg-emerald-50/50 border-emerald-100' : g.status === 'Partial' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/30 border-rose-100')}>
                                      <input type="checkbox" checked={selectedFeeGroups.has(g.id)} onChange={() => {
                                        const next = new Set(selectedFeeGroups);
                                        if (next.has(g.id)) next.delete(g.id); else next.add(g.id);
                                        setSelectedFeeGroups(next);
                                      }} className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                                      
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
                                      <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                                        <span className="font-black text-sm" style={{ color: g.balance > 0 ? '#C0392B' : '#059669' }}>{PKR(g.balance || 0)}</span>
                                        <div className="flex gap-2">
                                          <button onClick={() => setShowVoucherModal([g])} className="p-1.5 bg-white text-slate-400 rounded-lg border border-slate-200 hover:text-blue-600 hover:border-blue-200 transition-all">
                                            <Printer size={12} />
                                          </button>
                                          {g.status !== 'Paid' && g.balance > 0 && (
                                            <button onClick={() => { setCollectModal(g); setFeePayForm({ amount: String(g.balance), method: 'Cash', receipt: '', discount: '' }); }}
                                              className="px-3 py-1 rounded-lg text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1">
                                              <DollarSign size={10} /> Collect
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-xs text-slate-400 font-bold italic">Individual fee records for this student.</p>
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

            {/* ════ INCOME & EXPENSE MANAGEMENT ════ */}
            {(isSuperAdmin || isAccountant) && (tab === 'income' || tab === 'expenses') && (
              <motion.div key="fin-ext" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Cards */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Entry: {tab === 'income' ? 'Income' : 'Expense'}</p>
                    <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Category/Source</label><TI value={finCategory} onChange={(e:any)=>setFinCategory(e.target.value)} placeholder="e.g. Donation, Rent" /></div>
                      <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Amount</label><TI type="number" value={finAmount} onChange={(e:any)=>setFinAmount(e.target.value)} placeholder="0.00" /></div>
                      {tab === 'expenses' && (
                        <>
                          <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Payer Name</label><TI value={finName} onChange={(e:any)=>setFinName(e.target.value)} /></div>
                          <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Slip No</label><TI value={finSlipNo} onChange={(e:any)=>setFinSlipNo(e.target.value)} /></div>
                        </>
                      )}
                      <div><label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-1 block">Description</label><textarea value={finDesc} onChange={(e:any)=>setFinDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-600 min-h-[80px]" /></div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setFinType(tab === 'income' ? 'Income' : 'Expense'); saveFinancialRecord(); }} className="w-full py-3 rounded-2xl bg-white text-white font-black text-sm shadow-xl flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Record</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* History View */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-black text-slate-900">Recent {tab === 'income' ? 'Income' : 'Expenses'}</h3>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-black text-slate-800">{PKR((tab === 'income' ? income : expenses).reduce((s,x)=>s+x.amount,0))}</p>
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-[500px]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b border-slate-100">
                          <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">Description</th><th className="px-6 py-3 text-left">Category</th><th className="px-6 py-3 text-right">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(tab === 'income' ? income : expenses).slice(0, 50).map(x => (
                            <tr key={x.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-3 text-slate-500">{(x.income_date || x.expense_date).slice(0,10)}</td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{x.description}</p>
                                {x.recorded_by && <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Recorded by: {x.recorded_by}</p>}
                                {x.slip_no && <p className="text-[9px] text-blue-600 font-bold mt-0.5">Slip: {x.slip_no} · {x.name}</p>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black text-[9px]">{x.category}</span></td>
                              <td className="px-6 py-4 text-right font-black text-slate-900">{PKR(x.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {(isAccountant || isSuperAdmin) && tab === 'salaries' && (
              <motion.div key="salaries" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><UserCheck className="text-blue-600" size={18} /> Teacher Salary Management</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{teachers.length} Teachers found</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-6 py-3 text-left">Teacher Name</th>
                          <th className="px-6 py-3 text-left">Employee ID</th>
                          <th className="px-6 py-3 text-right">Fixed Monthly Salary</th>
                          <th className="px-6 py-3 text-center">Last Paid</th>
                          <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {teachers.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No teachers recorded yet</td></tr>
                        ) : teachers.map(t => {
                          const lastPaid = salaries.find(s => s.teacher_id === t.id);
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-black text-slate-800">{t.full_name}</p>
                                <p className="text-[10px] text-slate-400">{t.subject_dept}</p>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">{t.employee_id}</td>
                              <td className="px-6 py-4 text-right font-black text-slate-900">{PKR(t.monthly_salary)}</td>
                              <td className="px-6 py-4 text-center">
                                {lastPaid ? (
                                  <div className="inline-block px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-700">
                                    {new Date(lastPaid.payment_date).toLocaleDateString()}
                                  </div>
                                ) : <span className="text-[10px] text-slate-300 font-bold italic">Never Paid</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setAdvanceSalaryModal(t)} className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[10px] font-black hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 text-center"><HistoryIcon size={12} /> Pay Advance</button>
                                  <button onClick={() => setSalaryModal(t)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 ml-auto"><DollarSign size={12} /> Pay Salary</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Salary History */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm">Recent Salary Payments</h3>
                    <button onClick={() => handlePrintList('Teacher Salary Report', ['Date', 'Teacher', 'Base', 'Bonus', 'Fine', 'Net Paid'], salaries.map(s => [new Date(s.payment_date).toLocaleDateString(), s.teacher_name, PKR(s.monthly_salary), PKR(s.bonus), PKR(s.fine), PKR(s.net_salary)]))} className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline"><Printer size={12} /> Print History</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead><tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter"><th className="px-6 py-2 text-left">Date</th><th className="px-6 py-2 text-left">Teacher</th><th className="px-6 py-2 text-right">Base</th><th className="px-6 py-2 text-right">Bonus</th><th className="px-6 py-2 text-right">Fine</th><th className="px-6 py-2 text-right">Net</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {salaries.slice(0, 15).map(s => (
                          <tr key={s.id}>
                            <td className="px-6 py-3 text-slate-500">{new Date(s.payment_date).toLocaleDateString()}</td>
                            <td className="px-6 py-3 font-bold text-slate-800">{s.teacher_name}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{PKR(s.monthly_salary)}</td>
                            <td className="px-6 py-3 text-right text-emerald-600">+{PKR(s.bonus)}</td>
                            <td className="px-6 py-3 text-right text-rose-600">-{PKR(s.fine)}</td>
                            <td className="px-6 py-3 text-right font-black text-slate-900">{PKR(s.net_salary)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ ACCOUNTANT REPORTS ════ */}
      {/* ════ ACCOUNTANT REPORTS ════ */}
            {isAccountant && tab === 'reports' && (() => {
              const reportTx = transactions.filter(t => {
                if (!t.payment_date) return false;
                const d = t.payment_date.slice(0, 10);
                return d >= reportFrom && d <= reportTo;
              });

  const generateStatement = (period: 'Daily' | 'Weekly' | 'Monthly') => {
    const now = new Date();
    let start = new Date();
    if (period === 'Daily') start.setHours(0,0,0,0);
    else if (period === 'Weekly') start.setDate(now.getDate() - 7);
    else if (period === 'Monthly') start.setMonth(now.getMonth() - 1);
    
    const sStr = start.toISOString().slice(0, 10);
    const filteredTx = transactions.filter(t => t.payment_date?.slice(0,10) >= sStr);
    const filteredExp = expenses.filter(e => e.expense_date >= sStr);
    const filteredInc = income.filter(i => i.income_date >= sStr);

    const feeRev = filteredTx.reduce((s,t) => s + Number(t.amount_paid || 0), 0);
    const otherInc = filteredInc.reduce((s,i) => s + i.amount, 0);
    const totalExp = filteredExp.reduce((s,e) => s + e.amount, 0);
    const disc = filteredTx.reduce((s,t) => s + Number(t.discount || 0), 0);
    
    // Monthly balance logic: previous unpaid + current period dues
    const receivable = feeGroups
      .filter(g => !g.due_date || g.due_date <= endOfMonth)
      .reduce((s, g) => s + calculateBalance(g), 0);

    handlePrintReport({
      type: period,
      feeRev,
      otherInc,
      totalIncome: feeRev + otherInc,
      totalExp,
      discounts: disc,
      net: (feeRev + otherInc) - totalExp,
      txs: filteredTx,
      others: [...filteredInc, ...filteredExp],
      receivable
    });
  };

              const grandPaid    = reportTx.reduce((s, t) => s + Number(t.amount_paid   || 0), 0);
              const grandDisc    = reportTx.reduce((s, t) => s + Number(t.discount      || 0), 0);
              const grandFine    = reportTx.reduce((s, t) => s + Number(t.fine_amount   || 0), 0);
              const grandTotal   = reportTx.reduce((s, t) => s + Number(t.amount_paid   || 0), 0);

              const LOGO_B64 = LOGO_BASE64;

              const printReport = () => {
                const fromFmt = new Date(reportFrom).toLocaleDateString('en-PK', { day:'2-digit', month:'2-digit', year:'numeric' });
                const toFmt   = new Date(reportTo).toLocaleDateString('en-PK',   { day:'2-digit', month:'2-digit', year:'numeric' });

                const rows = reportTx.map((t, i) => {
                  const stu = students.find(s => String(s.roll_no) === String(t.student_roll_link));
                  return `<tr>
                    <td>${i + 1}</td>
                    <td>${t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'}</td>
                    <td>${t.student_roll_link || '—'}</td>
                    <td>${stu?.full_name || '—'}</td>
                    <td>${stu?.class_section || '—'}</td>
                    <td>${t.transaction_type || 'Fee Payment'}</td>
                    <td>${t.collected_by || '—'}</td>
                    <td>${t.payment_method || '—'}</td>
                    <td>${Number(t.amount_paid || 0).toLocaleString('en-PK')}</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>${Number(t.amount_paid || 0).toLocaleString('en-PK')}</td>
                  </tr>`;
                }).join('');

                const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Fees Collection Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #000; padding: 20px; }
  .header { text-align: center; margin-bottom: 16px; }
  .header-top { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px; }
  .logo { width: 52px; height: 52px; object-fit: contain; }
  .college-name { font-size: 18pt; font-weight: bold; }
  .address { font-size: 9pt; color: #333; margin: 2px 0; }
  .report-title { font-size: 13pt; font-weight: bold; margin-top: 10px; }
  .report-sub { font-size: 9pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #f2f2f2; border: 1px solid #999; padding: 5px 4px; font-size: 8.5pt; font-weight: bold; text-align: left; white-space: nowrap; }
  td { border: 1px solid #bbb; padding: 4px; font-size: 8pt; vertical-align: top; }
  .grand-row td { font-weight: bold; background: #f9f9f9; border-top: 2px solid #666; }
  @media print { body { padding: 8px; } }
</style>
</head><body>
  <div class="header">
    <div class="header-top">
      <img src="${LOGO_BASE64}" class="logo" alt="Logo"/>
      <div class="college-name">Pak Informatics Group of Colleges</div>
    </div>
    <div class="address">Original Campus, Gujranwala | Ph: 0300-0642973</div>
    <div class="address">PIC Tower, Sialkot bypass Road Near Beacon House Palm Tree Campus GRW.</div>
    <div class="report-title">Fees Collection Report</div>
    <div class="report-sub">Session: 2026-28 &nbsp; | &nbsp; (Search Type: ${fromFmt} To ${toFmt})</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Admission No</th>
        <th>Name</th>
        <th>Class</th>
        <th>Fee Type</th>
        <th>Collect By</th>
        <th>Mode</th>
        <th>Paid (PKR)</th>
        <th>Discount (PKR)</th>
        <th>Fine (PKR)</th>
        <th>Total (PKR)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="12" style="text-align:center;padding:12px">No transactions in this date range</td></tr>'}
      <tr class="grand-row">
        <td colspan="8" style="text-align:right"><strong>Grand Total</strong></td>
        <td><strong>${grandPaid.toLocaleString('en-PK')}</strong></td>
        <td><strong>${grandDisc.toLocaleString('en-PK')}</strong></td>
        <td><strong>${grandFine.toLocaleString('en-PK')}</strong></td>
        <td><strong>${grandTotal.toLocaleString('en-PK')}</strong></td>
      </tr>
    </tbody>
  </table>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body></html>`;

                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
                document.body.appendChild(iframe);
                iframe.contentWindow!.document.open();
                iframe.contentWindow!.document.write(html);
                iframe.contentWindow!.document.close();
                setTimeout(() => document.body.removeChild(iframe), 6000);
              };

              return (
              <motion.div key="rep" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Summary cards */}
                <div className="relative group">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={DollarSign}    label="Total Balance Due" value={PKR(totalBalance)} color="bg-rose-50 text-rose-600" alert={totalBalance > 0} />
                    <StatCard icon={AlertTriangle} label="Total Fines"       value={PKR(totalFines)}   color="bg-amber-50 text-amber-600" />
                    <StatCard icon={Receipt}       label="Transactions"      value={transactions.length} sub="This session" color="bg-blue-50 text-blue-600" />
                    <StatCard icon={BarChart3}     label="Session Revenue"   value={PKR(transactions.reduce((s, t) => s + Number(t.amount_paid || 0), 0))} color="bg-emerald-50 text-emerald-600" />
                  </div>
                  <button 
                    onClick={() => generateStatement('Daily')}
                    className="absolute -top-12 right-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Printer size={14} /> Print Summary Report
                  </button>
                </div>

                {/* ── Income / Expense Periodic Statements ── */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900">Income & Expense Reports</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Generate periodic financial statements</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => generateStatement('Daily')} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-wider">Daily</button>
                      <button onClick={() => generateStatement('Weekly')} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-wider">Weekly</button>
                      <button onClick={() => generateStatement('Monthly')} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-wider">Monthly</button>
                      <button 
                        onClick={() => { setFinType('Expense'); setShowFinModal(true); }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-1.5 ml-2 transition-all active:scale-95"
                      >
                        <Plus size={12} /> Record
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fee collection progress */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Fee Collection Status</h3></div>
                  <div className="p-5 space-y-4">
                    {[{ label: 'Paid Groups', count: paidGroups, color: '#059669' }, { label: 'Partial Groups', count: partialGroups, color: '#D97706' }, { label: 'Unpaid Groups', count: unpaidGroups, color: '#C0392B' }].map(({ label, count, color }) => (
                      <ProgressBar key={label} pct={Math.round((count / totalGroups) * 100)} color={color} label={label} sub={`${count} · ${Math.round((count / totalGroups) * 100)}%`} />
                    ))}
                  </div>
                </div>

                {/* ── Fees Collection Report Export ── */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900">Fees Collection Report</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Filter by date range and export to print</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={printReport}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white"
                      style={{ background: GRADIENT }}>
                      <Printer size={15} /> Export & Print
                    </motion.button>
                  </div>

                  {/* Date range filters */}
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">From Date</label>
                      <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">To Date</label>
                      <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-all" />
                    </div>
                    <div className="flex gap-3 text-sm font-bold text-slate-600">
                      <span className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">{reportTx.length} transactions</span>
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl">{PKR(grandPaid)} collected</span>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-x-auto" style={{ maxHeight: 460 }}>
                    <table className="w-full text-xs min-w-[900px]">
                      <thead className="sticky top-0" style={{ background: '#f8f9fd' }}>
                        <tr>{['#','Date','Admission No','Name','Class','Fee Type','Collect By','Mode','Paid (PKR)','Discount','Fine','Total','Action'].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-b border-slate-100">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {reportTx.length === 0 ? (
                          <tr><td colSpan={13} className="px-4 py-12 text-center text-slate-400">No transactions in this date range</td></tr>
                        ) : reportTx.map((t, i) => {
                          const stu = students.find(s => String(s.roll_no) === String(t.student_roll_link));
                          return (
                            <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.005, 0.2) }}
                              className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-PK', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'}</td>
                              <td className="px-3 py-2.5 font-bold" style={{ color: ACCENT }}>{t.student_roll_link}</td>
                              <td className="px-3 py-2.5 font-black text-slate-900 max-w-[110px] truncate">{stu?.full_name || '—'}</td>
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{stu?.class_section || '—'}</td>
                              <td className="px-3 py-2.5 text-slate-600">{t.transaction_type || 'Fee Payment'}</td>
                              <td className="px-3 py-2.5 text-slate-600 max-w-[100px] truncate">{t.collected_by || '—'}</td>
                              <td className="px-3 py-2.5 text-slate-600">{t.payment_method || '—'}</td>
                              <td className="px-3 py-2.5 font-black text-emerald-600">{Number(t.amount_paid || 0).toLocaleString('en-PK')}</td>
                              <td className="px-3 py-2.5 text-slate-400">0.00</td>
                              <td className="px-3 py-2.5 text-slate-400">0.00</td>
                              <td className="px-3 py-2.5 font-black text-slate-900">{Number(t.amount_paid || 0).toLocaleString('en-PK')}</td>
                              <td className="px-3 py-2.5">
                                <button onClick={() => handlePrint(t)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors tooltip" title="Print Receipt">
                                  <Printer size={12} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                        {/* Grand total row */}
                        {reportTx.length > 0 && (
                          <tr className="border-t-2 border-slate-300 bg-slate-50">
                            <td colSpan={8} className="px-3 py-3 text-right font-black text-slate-900 text-xs uppercase tracking-widest">Grand Total</td>
                            <td className="px-3 py-3 font-black text-emerald-700">{grandPaid.toLocaleString('en-PK')}</td>
                            <td className="px-3 py-3 font-black text-slate-600">{grandDisc.toLocaleString('en-PK')}</td>
                            <td className="px-3 py-3 font-black text-slate-600">{grandFine.toLocaleString('en-PK')}</td>
                            <td className="px-3 py-3 font-black text-slate-900">{grandTotal.toLocaleString('en-PK')}</td>
                            <td className="px-3 py-3"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expenses & Income */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-slate-900">💸 Expenses</h3>
                        <button 
                          onClick={() => {
                            const rows = expenses.map(e => [e.expense_date, e.description, e.category, PKR(e.amount), e.recorded_by || '—']);
                            handlePrintList('Expenditure Report', ['Date','Description','Category','Amount','Recorded By'], rows, `Total Expenditure: ${PKR(expenses.reduce((s,e)=>s+e.amount,0))}`);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors" title="Print Expenses"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                      <p className="font-black text-rose-600">{PKR(expenses.reduce((s, e) => s + e.amount, 0))}</p>
                    </div>
                    {expenses.slice(0, 8).map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                        <div><p className="text-sm font-bold text-slate-800">{e.name || e.description}</p><p className="text-[11px] text-slate-400">{e.category} · {e.expense_date}</p></div>
                        <span className="font-black text-rose-600">{PKR(e.amount)}</span>
                      </motion.div>
                    ))}
                    {!expenses.length && <p className="p-6 text-center text-slate-400 text-sm">No expenses recorded</p>}
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-slate-900">💵 Other Income</h3>
                        <button 
                          onClick={() => {
                            const rows = income.map(e => [e.income_date, e.description, e.category, PKR(e.amount), e.recorded_by || '—']);
                            handlePrintList('Other Income Report', ['Date','Description','Category','Amount','Recorded By'], rows, `Total Other Income: ${PKR(income.reduce((s,e)=>s+e.amount,0))}`);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors" title="Print Income"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                      <p className="font-black text-emerald-600">{PKR(income.reduce((s, e) => s + e.amount, 0))}</p>
                    </div>
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
              );
            })()}

      {/* ════ ACCOUNTANT FINANCIAL ENTRY (New Tab) ════ */}
      {isAccountant && tab === 'manage-financials' && (
        <motion.div key="fin-man" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ background: finType === 'Income' ? '#f0fdf4' : '#fef2f2' }}>
               <h3 className="font-black text-slate-900">Record {finType}</h3>
               <button onClick={() => setTab('reports')} className="text-slate-400"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-5">
               <div className="flex gap-2">
                 {['Income', 'Expense'].map((t: any) => (
                   <button key={t} onClick={() => setFinType(t)} className={cn('flex-1 py-3 rounded-2xl text-sm font-black transition-all border', finType === t ? 'text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-100')} style={finType === t ? { background: t === 'Income' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#e11d48,#fb7185)' } : {}}>{t}</button>
                 ))}
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category / Headline</label>
                  {finType === 'Expense' ? (
                    <TS value={finCategory} onChange={(e: any) => setFinCategory(e.target.value)}>
                      <option value="">Select Headline...</option>
                      {expenseHeaders.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                      <option value="Other">Other</option>
                    </TS>
                  ) : (
                    <TI placeholder={finType === 'Income' ? "e.g. Donation, Library Fund" : "e.g. Electricity Bill, Stationery"} value={finCategory} onChange={(e: any) => setFinCategory(e.target.value)} />
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount (PKR)</label>
                   <TI type="number" placeholder="0.00" value={finAmount} onChange={(e: any) => setFinAmount(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                   <TI type="date" value={finDate} onChange={(e: any) => setFinDate(e.target.value)} />
                 </div>
               </div>
               <div className="pt-2">
                 <motion.button whileTap={{ scale: 0.97 }} onClick={saveFinancialRecord} disabled={saving} className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: finType === 'Income' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#e11d48,#fb7185)' }}>
                   {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16}/> Save {finType} Record</>}
                 </motion.button>
               </div>
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
            if (id === 'academics') return (
  <motion.button key={id} onClick={() => setShowAcademicsPortal(true)} whileHover={{ x: 2 }}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800">
    <GraduationCap size={16} /><span className="flex-1">Academics Portal</span>
  </motion.button>
);
const active = tab === id; const badgeN = getBadge(id);
            return (
              <button key={id} onClick={() => id === 'academics' ? setShowAcademicsPortal(true) : setTab(id)} className="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl flex-1 min-w-0" style={{ color: active ? ACCENT : '#94a3b8' }}>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount to Collect (PKR)</label>
                      <input type="number" value={feePayForm.amount} onChange={e => setFeePayForm(p => ({ ...p, amount: e.target.value }))} placeholder={`Max: Rs ${collectModal.balance?.toLocaleString('en-PK')}`} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Direct Discount (PKR)</label>
                      <input type="number" value={feePayForm.discount} onChange={e => setFeePayForm(p => ({ ...p, discount: e.target.value }))} placeholder="Apply Discount" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all bg-amber-50/30" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[collectModal.balance, Math.round(collectModal.balance / 2), Math.round(collectModal.balance / 4)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(amt => (
                      <button key={amt} onClick={() => setFeePayForm(p => ({ ...p, amount: String(amt) }))} className="px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">{PKR(amt)}</button>
                    ))}
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
      
      {/* RECORD FINANCIAL MODAL */}
      <AnimatePresence>
        {showFinModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFinModal(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-10 border border-slate-100">
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Record Transaction</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Financial Ledger</p>
                  </div>
                  <button onClick={() => setShowFinModal(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={16} /></button>
                </div>

                <div className="space-y-4">
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    {['Income', 'Expense'].map(t => (
                      <button key={t} onClick={() => setFinType(t as any)} 
                        className={cn('flex-1 py-2.5 rounded-xl text-xs font-black transition-all', finType === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400')}>
                        {t}
                      </button>
                    ))}
                  </div>

                  {finType === 'Expense' && (
                    <div className="grid grid-cols-1 gap-4 bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Paid To (Name)</label>
                        <input value={finName} onChange={e => setFinName(e.target.value)} placeholder="e.g. Ali Stationary" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Slip / Invoice No.</label>
                        <input value={finSlipNo} onChange={e => setFinSlipNo(e.target.value)} placeholder="e.g. SN-001" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-inner outline-none focus:border-rose-500 transition-all font-mono" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category / Reason</label>
                    {finType === 'Expense' ? (
                      <select 
                        value={finCategory} 
                        onChange={(e: any) => setFinCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="">Select Category...</option>
                        {expenseHeaders.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input value={finCategory} onChange={e => setFinCategory(e.target.value)} placeholder="e.g. Donation, Library Fund…" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount (PKR)</label>
                      <input type="number" value={finAmount} onChange={e => setFinAmount(e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-blue-500 transition-all text-blue-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                      <input type="date" value={finDate} onChange={e => setFinDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Detailed Description / Remarks</label>
                    <textarea value={finDesc} onChange={e => setFinDesc(e.target.value)} rows={2} placeholder="Optional details..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none" />
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={saveFinancialRecord} disabled={saving} className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2" style={{ background: finType === 'Income' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#e11d48,#fb7185)' }}>
                    {saving ? <Loader2 size={16} className="animate-spin text-white" /> : <><Save size={16} /> Save Record</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADVANCE SALARY MODAL */}
      <AnimatePresence>
        {advanceSalaryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAdvanceSalaryModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-10 border border-slate-100">
               <div className="h-1.5 w-full bg-amber-500" />
               <div className="p-7">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">Advance Salary</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{advanceSalaryModal.full_name}</p>
                    </div>
                    <button onClick={() => setAdvanceSalaryModal(null)} className="text-slate-400 hover:text-slate-900 border border-slate-100 rounded-xl p-2 transition-all"><X size={18} /></button>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white"><HistoryIcon size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Base Salary</p>
                        <p className="text-lg font-black text-amber-900">{PKR(advanceSalaryModal.monthly_salary || 0)}</p>
                      </div>
                    </div>
                    <F label="Advance Amount" req><TI type="number" value={advanceForm.amount} onChange={(e:any)=>setAdvanceForm(p=>({ ...p, amount: e.target.value }))} placeholder="0.00" /></F>
                    <F label="Reason / Description" req><TI value={advanceForm.reason} onChange={(e:any)=>setAdvanceForm(p=>({ ...p, reason: e.target.value }))} placeholder="Health, Travel, etc." /></F>
                    <F label="Payment Method"><TS value={advanceForm.method} onChange={(e:any)=>setAdvanceForm(p=>({ ...p, method: e.target.value }))}><option>Cash</option><option>Online Transfer</option><option>Cheque</option></TS></F>
                    
                    <motion.button whileTap={{ scale: 0.97 }} onClick={payAdvanceSalary} disabled={saving} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 mt-6">
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Confirm Payment</>}
                    </motion.button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEACHER SALARY MODAL */}
      <AnimatePresence>
        {salaryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSalaryModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-10 border border-slate-100">
              <div className="h-1.5 w-full bg-emerald-500" />
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Disburse Salary</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Payroll Management</p>
                  </div>
                  <button onClick={() => setSalaryModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 mb-6 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center font-black text-emerald-600 text-lg shadow-sm">{salaryModal.full_name?.charAt(0)}</div>
                   <div>
                      <p className="text-sm font-black text-slate-900Leading-none">{salaryModal.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1"><UserCheck size={10} /> Fixed: {PKR(salaryModal.monthly_salary)}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bonus (Add)</label>
                        <input type="number" value={salaryForm.bonus} onChange={e => setSalaryForm(p => ({ ...p, bonus: Number(e.target.value) }))} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-emerald-500 text-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fine (Deduct)</label>
                        <input type="number" value={salaryForm.fine} onChange={e => setSalaryForm(p => ({ ...p, fine: Number(e.target.value) }))} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-rose-500 text-rose-500" />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deductions (Income Tax, etc)</label>
                      <input type="number" value={salaryForm.deductions} onChange={e => setSalaryForm(p => ({ ...p, deductions: Number(e.target.value) }))} placeholder="0" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-rose-500 text-rose-500" />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Cash', 'Bank Transfer'].map(m => (
                          <button key={m} onClick={() => setSalaryForm(p => ({ ...p, method: m }))} className={cn('py-2.5 rounded-xl text-xs font-black border transition-all', salaryForm.method === m ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100')}>{m}</button>
                        ))}
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
                      <textarea value={salaryForm.notes} onChange={e => setSalaryForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Add specific details..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-emerald-500 transition-all resize-none" />
                   </div>

                   <div className="pt-6 border-t border-slate-100 mt-2">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-xs font-black text-slate-600">Net Payable Amount</span>
                         <span className="text-lg font-black text-slate-900">{PKR(Number(salaryModal.monthly_salary) + Number(salaryForm.bonus) - Number(salaryForm.fine) - Number(salaryForm.deductions))}</span>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={payTeacherSalary} disabled={saving} className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                        {saving ? <Loader2 size={16} className="animate-spin text-white" /> : <><DollarSign size={16} /> Confirm Disbursement</>}
                      </motion.button>
                   </div>
                </div>
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
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 p-1 flex items-center justify-center">
                    <img src={LOGO_BASE64} className="w-full h-full object-contain" alt="College Logo" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-none">Admission Form Details</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1.5" style={{ color: ACCENT }}>{preview.form_no} · Session 2026-28</p>
                  </div>
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 space-y-2">
                {preview.status === 'Pending' && (
                    <div className="bg-amber-50 rounded-2xl p-5 mb-4 border border-amber-100">
                       <p className="text-sm font-black text-amber-700 text-center">Standard Enrollment Fees</p>
                       <ul className="mt-3 space-y-2">
                         <li className="flex justify-between items-center text-xs font-bold text-amber-600 px-3 py-2 bg-white rounded-lg border border-amber-200">
                           <span>Summer Camp Fee</span>
                           <span>{PKR(7000)}</span>
                         </li>
                         <li className="flex justify-between items-center text-xs font-bold text-amber-600 px-3 py-2 bg-white rounded-lg border border-amber-200">
                           <span>Uniform Fee</span>
                           <span>{PKR(1000)}</span>
                         </li>
                         <li className="flex justify-between items-center text-xs font-black text-amber-800 px-3 py-2 bg-amber-100 rounded-lg border border-amber-300 mt-2">
                           <span>Total Enrollment Package</span>
                           <span>{PKR(8000)}</span>
                         </li>
                       </ul>
                       <p className="text-[10px] text-amber-500 mt-3 italic text-center font-bold">These fees will be automatically generated in the student's ledger upon confirmation.</p>
                    </div>
                  )}
                  {[['Student Name', preview.student_name], ['Father Name', preview.father_name], ['B-Form / NIC', preview.b_form_nic || '—'], ['Program', `${preview.program} Part ${preview.part}`], ['Gender', preview.gender], ['DOB', preview.student_dob || '—'], ['Cell No', preview.cell_no || '—'], ['WhatsApp', preview.whatsapp_no || '—'], ['Email', preview.email || '—'], ['Address', preview.current_address || '—'], ['Matric Year', preview.matric_year || '—'], ['Matric Marks', preview.matric_marks || '—'], ['Matric %', preview.matric_percentage ? `${preview.matric_percentage}%` : '—'], ['Matric Board', preview.matric_board || '—'], ['Suggested Section', preview.suggested_section || '—'], ['Suggested Class', preview.suggested_class || '—'], ['Fee Package', PKR(8000)], ['Notes', preview.notes || '—'], ['Status', preview.status], ['Submitted By', preview.created_by || '—'], ['Date', new Date(preview.created_at).toLocaleString('en-PK')]].map(([l, v]) => (
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
    </div>
  );
};