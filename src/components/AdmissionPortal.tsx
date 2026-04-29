import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus, Users, Search, X, GraduationCap, LogOut,
  RefreshCw, Plus, Loader2, CheckCircle, AlertTriangle,
  FileText, Database, Eye, Save
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { cn } from '../lib/utils';

interface AdmissionPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ── Section logic ─────────────────────────────────────────────
const getSuggestedSection = (pct: number, gender: string) => {
  const g = gender === 'Female' ? 'G' : 'B';
  if (pct >= 85) return `A-${g}`;
  if (pct >= 70) return `B-${g}`;
  return `C-${g}`;
};

const CLASS_MAP: Record<string, Record<number, Record<string,string>>> = {
  'ICS Physics':    { 1:{'A-B':'ICS-Phy-A-B','B-B':'ICS-Phy-B-B','C-B':'ICS-Phy-B-B','A-G':'ICS-Phy-A-G','B-G':'ICS-Phy-A-G','C-G':'ICS-Phy-A-G'}, 2:{'A-B':'ICS-Phy-II-A-B','B-B':'ICS-Phy-II-B-B','C-B':'ICS-Phy-II-B-B','A-G':'ICS-Phy-II-A-G','B-G':'ICS-Phy-II-A-G','C-G':'ICS-Phy-II-A-G'} },
  'ICS Statistics': { 1:{'A-B':'ICS-Stat-B','B-B':'ICS-Stat-B','C-B':'ICS-Stat-B','A-G':'ICS-Stat-G','B-G':'ICS-Stat-G','C-G':'ICS-Stat-G'}, 2:{'A-B':'ICS-Stat-II-B','B-B':'ICS-Stat-II-B','C-B':'ICS-Stat-II-B','A-G':'ICS-Stat-II-G','B-G':'ICS-Stat-II-G','C-G':'ICS-Stat-II-G'} },
  'Pre-Medical':    { 1:{'A-B':'Pre-Med-B','B-B':'Pre-Med-B','C-B':'Pre-Med-B','A-G':'Pre-Med-G','B-G':'Pre-Med-G','C-G':'Pre-Med-G'}, 2:{'A-B':'Pre-Med-II-B','B-B':'Pre-Med-II-B','C-B':'Pre-Med-II-B','A-G':'Pre-Med-II-G','B-G':'Pre-Med-II-G','C-G':'Pre-Med-II-G'} },
  'Pre-Engineering':{ 1:{'A-B':'Pre-Eng-B','B-B':'Pre-Eng-B','C-B':'Pre-Eng-B','A-G':'Pre-Eng-G','B-G':'Pre-Eng-G','C-G':'Pre-Eng-G'}, 2:{'A-B':'Pre-Eng-II-B','B-B':'Pre-Eng-II-B','C-B':'Pre-Eng-II-B','A-G':'Pre-Eng-II-G','B-G':'Pre-Eng-II-G','C-G':'Pre-Eng-II-G'} },
  'FA IT':          { 1:{'A-B':'FA-IT-B','B-B':'FA-IT-B','C-B':'FA-IT-B','A-G':'FA-IT-G','B-G':'FA-IT-G','C-G':'FA-IT-G'}, 2:{'A-B':'FA-IT-II-B','B-B':'FA-IT-II-B','C-B':'FA-IT-II-B','A-G':'FA-IT-II-G','B-G':'FA-IT-II-G','C-G':'FA-IT-II-G'} },
  'FA General':     { 1:{'A-B':'FA-Gen-B','B-B':'FA-Gen-B','C-B':'FA-Gen-B','A-G':'FA-Gen-G','B-G':'FA-Gen-G','C-G':'FA-Gen-G'}, 2:{'A-B':'FA-Gen-II-B','B-B':'FA-Gen-II-B','C-B':'FA-Gen-II-B','A-G':'FA-Gen-II-G','B-G':'FA-Gen-II-G','C-G':'FA-Gen-II-G'} },
  'I.Com':          { 1:{'A-B':'I.Com-B','B-B':'I.Com-B','C-B':'I.Com-B','A-G':'I.Com-G','B-G':'I.Com-G','C-G':'I.Com-G'}, 2:{'A-B':'I.Com-II-B','B-B':'I.Com-II-B','C-B':'I.Com-II-B','A-G':'I.Com-II-G','B-G':'I.Com-II-G','C-G':'I.Com-II-G'} },
};

const DEGREES = ['Intermediate', 'ADP', 'BS', 'BS 5th Semester Entry', 'Category B', 'Others'];

const PROGRAM_OPTIONS: Record<string, string[]> = {
  'Intermediate': ['ICS Physics', 'ICS Statistics', 'Pre-Medical', 'Pre-Engineering', 'FA IT', 'FA General', 'I.Com'],
  'BS': [
    'BS COMPUTER SCIENCE', 'BS SOFTWARE ENGINEERING', 'BS DATA SCIENCE', 
    'BS CHEMISTRY', 'BS PHYSICS', 'BS MATH', 'BS BOTONY', 'BS ZOOLOGY', 
    'BS ENGLISH', 'BS PSYCHOLOGY', 'BS URDU', 'BS ISLAMYAT'
  ],
  'ADP': [
    'ADP COMPUTER SCIENCE (2-YEARS)', 'ADP BUSINESS ADMINISTRATION', 'ADP RECOGNIZED BY HEC'
  ],
  'BS 5th Semester Entry': [
    'BS COMPUTER SCIENCE (5TH SEMESTER)', 'BS SOFTWARE ENGINEERING (5TH SEM)',
    'BS CHEMISTRY (5th)', 'BS PHYSICS (5th)', 'BS MATH (5th)', 'BS BOTONY (5th)',
    'BS ZOOLOGY (5th)', 'BS ENGLISH (5th)', 'BS PSYCHOLOGY (5th)'
  ],
  'Others': ['Summer Camp', 'Short Course'],
  'Category B': ['Category B - General', 'Category B - Science', 'Category B - Arts', 'Category B - Commerce'],
};

const BOARDS   = ['BISE Gujranwala','BISE Lahore','BISE Faisalabad','BISE Rawalpindi','BISE Multan','BISE Sargodha','BISE Sahiwal','Federal Board','Other'];
const PKR = (n:number) => `Rs ${(n||0).toLocaleString('en-PK')}`;

const F = ({ label, req, children }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
      {label}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const TI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className="w-full border-b-2 border-slate-200 focus:border-[#c0392b] bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300"/>
);
const TS = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="w-full border-b-2 border-slate-200 focus:border-[#c0392b] bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors appearance-none">{children}</select>
);

const Toast = ({ msg, type }: { msg:string; type:'ok'|'err'|'info' }) => (
  <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:24}}
    className={cn('fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white flex items-center gap-2 shadow-xl whitespace-nowrap',
      type==='ok'?'bg-emerald-500':type==='err'?'bg-rose-500':'bg-blue-500')}>
    {type==='ok'?<CheckCircle size={15}/>:type==='err'?<AlertTriangle size={15}/>:<Loader2 size={15} className="animate-spin"/>}
    {msg}
  </motion.div>
);

const EMPTY: any = {
  applied_for:'Intermediate', program:'ICS Physics', part:1, session:'2026-27',
  student_name:'', b_form_nic:'', father_name:'', father_nic:'', father_occupation:'',
  student_dob:'', contact_home:'', cell_no:'', whatsapp_no:'', email:'',
  religion:'Islam', gender:'Male', current_address:'',
  matric_year:'', matric_roll_no:'', matric_marks:'', matric_subjects:'',
  matric_board:'BISE Gujranwala', matric_division:'', matric_percentage:'',
  inter_year:'', inter_roll_no:'', inter_marks:'', inter_subjects:'',
  inter_board:'BISE Gujranwala', inter_division:'',
  graduation_year:'', graduation_roll_no:'', graduation_marks:'', graduation_board:'', graduation_division:'',
  fee_package: 8000,
  installments: 1,
  student_type: 'Regular',
  student_picture: '',
  extra_fees: {
    welcome_party: { active: false, amount: 2000 },
    annual_trip: { active: false, amount: 3500 },
    farewell_party: { active: false, amount: 2500 },
    examination_fee: { active: false, amount: 3000 },
    registration_fee: { active: false, amount: 5000 },
    student_card_fee: { active: false, amount: 500 },
    annual_charges: { active: false, amount: 2500 }
  }
};

export const AdmissionPortal: React.FC<AdmissionPortalProps> = ({ onLogout, adminData }) => {
  const isAccountant = adminData.role === 'Accountant';
  const [tab,     setTab]     = useState<'form'|'list'|'confirm'>(isAccountant?'list':'form');
  const [forms,   setForms]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [toast,   setToast]   = useState<{msg:string;type:'ok'|'err'|'info'}|null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [confirming, setConfirming] = useState<any>(null);
  const [instDates, setInstDates] = useState<string[]>([]);
  const [nextRoll,setNextRoll]= useState(2527290);
  const [form,    setForm]    = useState<any>({...EMPTY});

  const showToast = (msg:string, type:'ok'|'err'|'info'='ok') => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3500);
  };

  const pct = Number(form.matric_percentage) || 0;
  const sec  = pct > 0 ? getSuggestedSection(pct, form.gender) : '';
  const cls  = sec ? CLASS_MAP[form.program]?.[form.part]?.[sec] || '' : '';
  const set  = (k:string, v:any) => setForm((p:any)=>({...p,[k]:v}));

  const loadForms = async () => {
    setLoading(true);
    const { data } = await supabase.from('admission_forms').select('*').order('created_at',{ascending:false});
    setForms(data||[]);
    setLoading(false);
  };

  const loadNextRoll = async () => {
    const { data } = await supabase.from('students').select('roll_no').lt('roll_no',9999999).order('roll_no',{ascending:false}).limit(1);
    if(data?.[0]) setNextRoll(data[0].roll_no+1);
  };

  useEffect(()=>{ loadForms(); loadNextRoll(); },[]);

  const syncToSheets = async (fd:any) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/sync-to-sheets`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({form:fd}),
      });
    } catch(e){ console.warn('Sheets sync skipped',e); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Only JPG and PNG formats are allowed', 'err');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('student_picture', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleExtraFee = (key: string) => {
    const newFees = { ...form.extra_fees };
    newFees[key].active = !newFees[key].active;
    set('extra_fees', newFees);
  };

  const updateExtraFeeAmount = (key: string, amount: number) => {
    const newFees = { ...form.extra_fees };
    newFees[key].amount = amount;
    set('extra_fees', newFees);
  };

  const handleSubmit = async () => {
    if(!form.student_name.trim()||!form.father_name.trim()){
      showToast('Name and father name are required','err'); return;
    }
    setSaving(true); showToast('Saving…','info');
    try {
      const payload = {
        ...form,
        student_name:      form.student_name.trim().toUpperCase(),
        father_name:       form.father_name.trim().toUpperCase(),
        matric_marks:      form.matric_marks      ? Number(form.matric_marks)      : null,
        matric_percentage: form.matric_percentage ? Number(form.matric_percentage) : null,
        inter_marks:       form.inter_marks       ? Number(form.inter_marks)       : null,
        graduation_marks:  form.graduation_marks  ? Number(form.graduation_marks)  : null,
        fee_package:       Number(form.fee_package),
        installments:      Number(form.installments),
        suggested_section: sec,
        suggested_class:   cls,
        status:'Pending', synced_to_db:false,
        created_by:adminData.full_name,
        form_no:'',
      };
      const { data:saved, error } = await supabase.from('admission_forms').insert([payload]).select().single();
      if(error) throw error;

      // 🔔 VP Notification
      await supabase.from('admin_notifications').insert([{
        target_role: 'VP',
        title: 'New Admission Form (External)',
        message: `${payload.student_name} (${payload.program}) submitted via Admission Portal.`,
        type: 'Admission',
        is_read: false
      }]);
      syncToSheets(saved);
      showToast(`✅ Form ${saved.form_no} saved & synced to Google Sheets`);
      setForm({...EMPTY});
      loadForms();
    } catch(e:any){ showToast(e.message||'Error','err'); }
    finally{ setSaving(false); }
  };

  const confirmToDatabase = async (f:any, installmentDates: string[]) => {
    setSaving(true);
    try {
      const studentType = f.student_type || (f.program === 'Summer Camp' ? 'Summer Camp' : 'Regular');
      let roll = f.student_roll_no;
      let ledgerFees: any[] = [];
      const today = new Date().toISOString().split('T')[0];
      
      if (!roll) {
        roll = nextRoll;
        const username=`stu_${roll}`, password=`PIC${roll}`;
        const classSection = f.suggested_class || CLASS_MAP[f.program]?.[f.part]?.['B-B'] || (f.program === 'Summer Camp' ? 'Summer-Camp' : 'TBD');
        
        let totalPackage = 0;
        if (studentType === 'Summer Camp') totalPackage = 7000;
        else if (studentType === 'Regular') totalPackage = (Number(f.fee_package)||0) + 7000 + 1000;
        else if (studentType === 'Transfer') totalPackage = (Number(f.fee_package)||0) + 7000 + 1000;

        // Additional Fees (Optional)
        for (const [key, details] of Object.entries(f.extra_fees || {})) {
          const fee = details as any;
          if (fee.active && fee.amount > 0) {
            const feeName = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            ledgerFees.push({
              student_roll: roll,
              fees_group: feeName,
              fees_code: `OPT-${key.toUpperCase().slice(0, 3)}`,
              due_date: today,
              amount: fee.amount,
              paid: 0,
              status: 'Unpaid'
            });
            totalPackage += fee.amount;
          }
        }

        const { error: se } = await supabase.from('students').insert([{
          roll_no:roll, full_name:f.student_name, father_name:f.father_name,
          gender:f.gender, program:f.program, applied_for: f.applied_for, part:f.part, 
          student_picture: f.student_picture,
          class_section: f.program === 'Summer Camp' ? 'Summer-Camp' : classSection,
          total_package: totalPackage, paid_amount:0, status:'Active',
          username, password, total_xp:0, profile_xp:0, current_badge:'🥉 Newcomer'
        }]);
        if(se) throw se;
        if (!f.student_roll_no) setNextRoll(roll+1);
      } else {
        // Handle Transfer / Update
        let totalPackage = (Number(f.fee_package)||0) + 7000 + 1000;
        await supabase.from('students').update({
            total_package: totalPackage,
            program: f.program,
            applied_for: f.applied_for,
            student_picture: f.student_picture,
            status: 'Active'
        }).eq('roll_no', roll);
      }

      if (studentType === 'Summer Camp') {
        ledgerFees = [
            { student_roll: roll, fees_group: 'Summer Camp Fee', fees_code: 'SC-FEE', due_date: installmentDates[0] || today, amount: 7000, paid: 0, status: 'Unpaid' }
        ];
      } else {
        // Regular or Transfer
        const pkgAmt = Number(f.fee_package) || 0;
        const instCount = f.installments || 1;
        const perInst = Math.floor(pkgAmt / instCount);
        
        // Fee Package installments
        for(let i=0; i<instCount; i++){
            ledgerFees.push({
                student_roll: roll,
                fees_group: instCount > 1 ? `Fee Package (Inst ${i+1})` : 'Fee Package',
                fees_code: `FEE-PK${instCount > 1 ? `-${i+1}` : ''}`,
                due_date: installmentDates[i] || today,
                amount: i === instCount - 1 ? pkgAmt - (perInst * (instCount - 1)) : perInst,
                paid: 0, status: 'Unpaid'
            });
        }

        // Summer Camp Fee if not exists
        const { data: exSC } = await supabase.from('fee_groups').select('id').eq('student_roll', roll).eq('fees_group', 'Summer Camp Fee').maybeSingle();
        if(!exSC) {
            ledgerFees.push({ student_roll: roll, fees_group: 'Summer Camp Fee', fees_code: 'SC-FEE', due_date: today, amount: 7000, paid: 0, status: 'Unpaid' });
        }

        // Uniform Fee if not exists
        const { data: exUN } = await supabase.from('fee_groups').select('id').eq('student_roll', roll).eq('fees_group', 'Uniform Fee').maybeSingle();
        if(!exUN) {
            ledgerFees.push({ student_roll: roll, fees_group: 'Uniform Fee', fees_code: 'UN-FEE', due_date: today, amount: 1000, paid: 0, status: 'Unpaid' });
        }
      }

      if (ledgerFees.length > 0) {
        const { error: fe } = await supabase.from('fee_groups').insert(ledgerFees);
        if (fe) throw fe;
      }
      
      // Notify student
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

      // Notify VP
      await supabase.from('admin_notifications').insert([{
        target_role: 'VP',
        title: 'New Admission/Fee Ledger Created',
        message: `${f.student_name} (Roll: ${roll}) confirmed by ${adminData.full_name}. Fees initialized.`,
        type: 'Admission',
        is_read: false
      }]);

      await supabase.from('admission_forms').update({
        status:'Approved', synced_to_db:true, student_roll_no:roll,
        approved_by:adminData.full_name, approved_at:new Date().toISOString(),
      }).eq('id',f.id);
      syncToSheets({...f, status:'Approved', synced_to_db:true, student_roll_no:roll});
      showToast(`✅ ${f.student_name} → Roll #${roll}`);
      setPreview(null);
      setConfirming(null);
      loadForms();
    } catch(e:any){ showToast(e.message||'Failed','err'); }
    finally{ setSaving(false); }
  };

  const rejectForm = async (f:any) => {
    await supabase.from('admission_forms').update({status:'Rejected',approved_by:adminData.full_name}).eq('id',f.id);
    showToast('Form rejected'); setPreview(null); loadForms();
  };

  const filtered = forms.filter(f=>{
    const q=search.toLowerCase();
    return (!search||f.student_name?.toLowerCase().includes(q)||f.father_name?.toLowerCase().includes(q)||f.form_no?.includes(q))
      && (!filter||f.status===filter);
  });

  const pending  = forms.filter(f=>f.status==='Pending').length;
  const approved = forms.filter(f=>f.status==='Approved').length;

  const NAV_OFF = [{id:'form',label:'New Form',icon:UserPlus},{id:'list',label:'All Forms',icon:FileText}];
  const NAV_ACC = [{id:'list',label:'All Forms',icon:FileText},{id:'confirm',label:'Confirm to DB',icon:Database}];
  const NAV = isAccountant ? NAV_ACC : NAV_OFF;

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{background:'#f5f5f0',fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-10 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100" style={{background:'#c0392b'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap size={20} className="text-white"/>
            </div>
            <div>
              <p className="font-black text-white text-sm leading-none">PAK INFORMATICS</p>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Group of Colleges</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Logged in as</p>
            <p className="text-white text-xs font-black">{adminData.full_name}</p>
            <p className="text-white/60 text-[9px]">{adminData.role}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setTab(id as any)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                tab===id?'text-white shadow-md':'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}
              style={tab===id?{background:'#c0392b'}:{}}>
              <Icon size={16}/>{label}
              {id==='confirm'&&pending>0&&<span className="ml-auto bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
              <p className="text-xl font-black text-amber-700">{pending}</p>
              <p className="text-[9px] font-black text-amber-500 uppercase">Pending</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-xl font-black text-emerald-700">{approved}</p>
              <p className="text-[9px] font-black text-emerald-500 uppercase">Approved</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50">
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-20 border-b px-4 py-3 flex items-center justify-between" style={{background:'#c0392b'}}>
        <div className="flex items-center gap-2">
          <GraduationCap size={19} className="text-white"/>
          <div><p className="font-black text-white text-sm">PIC Admissions</p><p className="text-white/60 text-[9px]">{adminData.role}</p></div>
        </div>
        <div className="flex gap-1">
          {NAV.map(({id,icon:Icon})=>(
            <button key={id} onClick={()=>setTab(id as any)} className={cn('w-9 h-9 rounded-xl flex items-center justify-center',tab===id?'bg-white/20 text-white':'text-white/50')}>
              <Icon size={17}/>
            </button>
          ))}
          <button onClick={onLogout} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white"><LogOut size={17}/></button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 min-h-screen pb-10">
        <div className="hidden md:flex sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {tab==='form'?'New Admission Form':tab==='confirm'?'Confirm to Database':'All Admission Forms'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Session 2026–27 · Gujranwala Campus</p>
          </div>
          <button onClick={loadForms} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <RefreshCw size={14} className={cn('text-slate-500',loading&&'animate-spin')}/>
          </button>
        </div>

        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">

            {/* ══ ADMISSION FORM ══ */}
            {tab==='form'&&(
              <motion.div key="form" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                <div className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">

                  {/* Form Header */}
                  <div className="border-b-4 border-[#c0392b] px-6 md:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-4 border-[#c0392b] flex items-center justify-center bg-red-50 flex-shrink-0">
                        <GraduationCap size={28} className="text-[#c0392b]"/>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg leading-tight">PAK INFORMATICS</p>
                        <p className="font-bold text-slate-600 text-sm">Group of Colleges</p>
                        <span className="bg-[#c0392b] text-white text-[9px] font-black px-2 py-0.5 rounded">Gujranwala</span>
                        <p className="text-[10px] text-slate-400 mt-1">Saddar Bypass Road · 055-3200545</p>
                        <p className="text-[10px] text-slate-400">0300-0642773 · 0300-0642771</p>
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-2xl font-black text-[#c0392b] uppercase tracking-wide">Admission Form</p>
                      <p className="text-sm text-slate-500 mt-1">Session: <strong>2026–27</strong></p>
                      <div 
                        onClick={() => document.getElementById('student-pic-input')?.click()}
                        className="mt-2 w-24 h-28 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center text-[9px] text-slate-400 font-bold ml-auto cursor-pointer hover:border-[#c0392b] transition-all relative group"
                      >
                        {form.student_picture ? (
                          <img src={form.student_picture} className="w-full h-full object-cover" alt="Student" />
                        ) : (
                          <div className="text-center p-2">
                             <Plus size={20} className="mx-auto mb-1 opacity-40 group-hover:opacity-100 group-hover:text-[#c0392b]" />
                             UPLOAD PHOTO
                          </div>
                        )}
                        <input id="student-pic-input" type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      </div>
                    </div>
                  </div>

                  <div className="px-6 md:px-8 py-6 space-y-6">

                    {/* Row 1: Form No / Roll / Session */}
                    <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
                      <F label="Form No.">
                        <div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black text-[#c0392b]">Auto-assigned</div>
                      </F>
                      <F label="Roll No.">
                        <div className="border-b-2 border-slate-200 px-1 py-1.5 text-sm font-black text-blue-600">#{nextRoll}</div>
                      </F>
                      <F label="Session">
                        <TS value={form.session} onChange={e=>set('session',e.target.value)}>
                          <option>2026-27</option><option>2025-26</option>
                        </TS>
                      </F>
                    </div>

                    {/* Applied For */}
                    <div className="pb-5 border-b border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Student Type" req>
                          <TS value={form.student_type} onChange={e=>set('student_type',e.target.value)}>
                            <option>Regular</option>
                            <option>Summer Camp</option>
                            <option>Transfer</option>
                          </TS>
                        </F>
                        <F label="Applied For" req>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {DEGREES.map(o => (
                              <label key={o} className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                setForm((p: any) => ({
                                  ...p,
                                  applied_for: o,
                                  program: (PROGRAM_OPTIONS[o] || PROGRAM_OPTIONS['Others'])[0],
                                  part: o === 'BS 5th Semester Entry' ? 5 : 1
                                }));
                              }}>
                                <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', form.applied_for === o ? 'bg-[#c0392b] border-[#c0392b]' : 'border-slate-400')}>
                                  {form.applied_for === o && <div className="w-2 h-2 bg-white rounded-sm" />}
                                </div>
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{o}</span>
                              </label>
                            ))}
                          </div>
                        </F>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <F label="Program" req>
                            <TS value={form.program} onChange={e => set('program', e.target.value)}>
                              {PROGRAM_OPTIONS[form.applied_for]?.map(p => <option key={p} value={p}>{p}</option>)}
                            </TS>
                          </F>
                          <F label={form.applied_for === 'Intermediate' ? "Part" : "Semester / Year"} req>
                            <TS value={form.part} onChange={e => set('part', Number(e.target.value))}>
                              {form.applied_for === 'Intermediate' ? (
                                <>
                                  <option value={1}>Part 1</option>
                                  <option value={2}>Part 2</option>
                                </>
                              ) : form.applied_for === 'ADP' ? (
                                <>
                                  <option value={1}>1st Semester</option>
                                  <option value={2}>2nd Semester</option>
                                  <option value={3}>3rd Semester</option>
                                  <option value={4}>4th Semester</option>
                                </>
                              ) : form.applied_for === 'BS 5th Semester Entry' ? (
                                <>
                                  {form.applied_for === 'Category B' ? null : [1,2,3,4,5,6,7,8].map(s => (
                                    <option key={s} value={s}>{s}{s===1?'st':s===2?'nd':s===3?'rd':'th'} Semester</option>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {[1,2,3,4,5,6,7,8].map(s => (
                                    <option key={s} value={s}>{s}{s===1?'st':s===2?'nd':s===3?'rd':'th'} Semester</option>
                                  ))}
                                  {form.applied_for === 'Category B' && <><option value={1}>1st Year</option><option value={2}>2nd Year</option></>}
                                </>
                              )}
                            </TS>
                          </F>
                          <F label="Subjects (1)(2)(3)"><TI placeholder="(1) _____ (2) _____ (3) _____" value={form.inter_subjects} onChange={e => set('inter_subjects', e.target.value)} /></F>
                        </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                    <div className="pb-5 border-b border-slate-100 space-y-4">
                      <div className="inline-block bg-[#c0392b] text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Personal Details</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Student's Name" req><TI placeholder="Full name as per B-Form" value={form.student_name} onChange={e=>set('student_name',e.target.value)}/></F>
                        <F label="B Form / NIC"><TI placeholder="_ _ _ _ _ - _ _ _ _ _ _ _ - _" value={form.b_form_nic} onChange={e=>set('b_form_nic',e.target.value)}/></F>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Father's Name" req><TI placeholder="Father's full name" value={form.father_name} onChange={e=>set('father_name',e.target.value)}/></F>
                        <F label="NIC"><TI placeholder="_ _ _ _ _ - _ _ _ _ _ _ _ - _" value={form.father_nic} onChange={e=>set('father_nic',e.target.value)}/></F>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Father's Occupation"><TI placeholder="Business / Service / etc." value={form.father_occupation} onChange={e=>set('father_occupation',e.target.value)}/></F>
                        <F label="Student's D.O.B"><TI type="date" value={form.student_dob} onChange={e=>set('student_dob',e.target.value)}/></F>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Contact No. (Home)"><TI placeholder="055-XXXXXXX" value={form.contact_home} onChange={e=>set('contact_home',e.target.value)}/></F>
                        <F label="Cell No."><TI placeholder="0300-XXXXXXX" value={form.cell_no} onChange={e=>set('cell_no',e.target.value)}/></F>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="WhatsApp No."><TI placeholder="0300-XXXXXXX" value={form.whatsapp_no} onChange={e=>set('whatsapp_no',e.target.value)}/></F>
                        <F label="E-mail ID"><TI type="email" placeholder="student@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/></F>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <F label="Religion">
                          <TS value={form.religion} onChange={e=>set('religion',e.target.value)}><option>Islam</option><option>Christianity</option><option>Hinduism</option><option>Other</option></TS>
                        </F>
                        <F label="Gender" req>
                          <div className="flex gap-6 mt-2">
                            {['Male','Female'].map(g=>(
                              <label key={g} className="flex items-center gap-2 cursor-pointer" onClick={()=>set('gender',g)}>
                                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center',form.gender===g?'border-[#c0392b]':'border-slate-400')}>
                                  {form.gender===g&&<div className="w-2 h-2 bg-[#c0392b] rounded-full"/>}
                                </div>
                                <span className="text-sm text-slate-700">{g}</span>
                              </label>
                            ))}
                          </div>
                        </F>
                      </div>
                    </div>

                    {/* Current Address */}
                    <div className="pb-5 border-b border-slate-100 space-y-3">
                      <div className="inline-block bg-[#c0392b] text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Current Address</div>
                      <textarea value={form.current_address} onChange={e=>set('current_address',e.target.value)} rows={2} placeholder="Street, Mohalla, City..."
                        className="w-full border-b-2 border-slate-200 focus:border-[#c0392b] bg-transparent px-1 py-1.5 text-sm font-medium text-slate-800 outline-none transition-colors resize-none"/>
                    </div>

                    {/* Academic Record */}
                    <div className="space-y-3">
                      <div className="inline-block bg-[#c0392b] text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Academic Record</div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs min-w-[680px]">
                          <thead>
                            <tr style={{background:'#c0392b'}}>
                              {['Particulars','Year','Roll No','Marks','Subjects','Board / University','Division / Grade','Remarks (%)'].map(h=>(
                                <th key={h} className="px-3 py-2.5 text-left text-white font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Matric */}
                            <tr className="border-b border-slate-100 bg-slate-50/40">
                              <td className="px-3 py-3 font-black text-slate-700">Matric</td>
                              <td className="px-2 py-2"><TI placeholder="2024" value={form.matric_year} onChange={e=>set('matric_year',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Roll No" value={form.matric_roll_no} onChange={e=>set('matric_roll_no',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={form.matric_marks} onChange={e=>set('matric_marks',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Subjects" value={form.matric_subjects} onChange={e=>set('matric_subjects',e.target.value)}/></td>
                              <td className="px-2 py-2"><TS value={form.matric_board} onChange={e=>set('matric_board',e.target.value)}>{BOARDS.map(b=><option key={b}>{b}</option>)}</TS></td>
                              <td className="px-2 py-2"><TI placeholder="A/B/C" value={form.matric_division} onChange={e=>set('matric_division',e.target.value)}/></td>
                              <td className="px-2 py-2">
                                <TI type="number" placeholder="%" value={form.matric_percentage} onChange={e=>set('matric_percentage',e.target.value)}/>
                                {pct>0&&form.applied_for === 'Intermediate' && <div className={cn('mt-1 px-2 py-0.5 rounded text-[9px] font-black inline-block border',
                                  sec.startsWith('A')?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-blue-50 text-blue-700 border-blue-200')}>
                                  → Section {sec}
                                </div>}
                              </td>
                            </tr>
                            {/* Intermediate */}
                            <tr className="border-b border-slate-100">
                              <td className="px-3 py-3 font-black text-slate-700">Intermediate</td>
                              <td className="px-2 py-2"><TI placeholder="2026" value={form.inter_year} onChange={e=>set('inter_year',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Roll No" value={form.inter_roll_no} onChange={e=>set('inter_roll_no',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={form.inter_marks} onChange={e=>set('inter_marks',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Subjects" value={form.inter_subjects} onChange={e=>set('inter_subjects',e.target.value)}/></td>
                              <td className="px-2 py-2"><TS value={form.inter_board} onChange={e=>set('inter_board',e.target.value)}>{BOARDS.map(b=><option key={b}>{b}</option>)}</TS></td>
                              <td className="px-2 py-2"><TI placeholder="A/B/C" value={form.inter_division} onChange={e=>set('inter_division',e.target.value)}/></td>
                              <td className="px-2 py-2 text-slate-300 text-[10px]">—</td>
                            </tr>
                            {/* Graduation */}
                            <tr className="border-b border-slate-100">
                              <td className="px-3 py-3 font-black text-slate-700">Graduation</td>
                              <td className="px-2 py-2"><TI placeholder="Year" value={form.graduation_year} onChange={e=>set('graduation_year',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Roll No" value={form.graduation_roll_no} onChange={e=>set('graduation_roll_no',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI type="number" placeholder="Marks" value={form.graduation_marks} onChange={e=>set('graduation_marks',e.target.value)}/></td>
                              <td className="px-2 py-2"><TI placeholder="Subjects"/></td>
                              <td className="px-2 py-2"><TS value={form.graduation_board} onChange={e=>set('graduation_board',e.target.value)}><option value="">Select Board</option>{BOARDS.map(b=><option key={b}>{b}</option>)}</TS></td>
                              <td className="px-2 py-2"><TI placeholder="A/B/C" value={form.graduation_division} onChange={e=>set('graduation_division',e.target.value)}/></td>
                              <td className="px-2 py-2 text-slate-300 text-[10px]">—</td>
                            </tr>
                            {/* Others */}
                            <tr style={{background:'#fef2f2'}}>
                              <td className="px-3 py-3 font-black text-slate-700">Others</td>
                              {Array(7).fill(0).map((_,i)=><td key={i} className="px-2 py-2"><div className="h-6 border-b border-slate-200"/></td>)}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Optional Fees */}
                      <div className="pt-4 space-y-3">
                        <div className="inline-block bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest">Optional Fee Choices</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(form.extra_fees).map(([key, details]: [string, any]) => {
                            const name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            return (
                              <div key={key} className={cn('p-3 rounded-2xl border transition-all flex flex-col gap-2', details.active ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100')}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-slate-700">{name}</span>
                                  <button 
                                    onClick={() => toggleExtraFee(key)}
                                    className={cn('w-8 h-4 rounded-full relative transition-all', details.active ? 'bg-blue-600' : 'bg-slate-300')}
                                  >
                                    <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all', details.active ? 'right-0.5' : 'left-0.5')} />
                                  </button>
                                </div>
                                {details.active && (
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rs</span>
                                    <input 
                                      type="number" 
                                      value={details.amount} 
                                      onChange={(e) => updateExtraFeeAmount(key, Number(e.target.value))}
                                      className="w-full bg-white border border-blue-100 rounded-lg pl-7 pr-2 py-1 text-xs font-black outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section preview */}
                      {form.applied_for === 'Category B' && (
  <div className="mt-3 p-4 bg-purple-50 rounded-2xl border border-purple-200">
    <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Category B Fee Amount</p>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs</span>
      <input
        type="number"
        value={form.fee_package}
        onChange={e => set('fee_package', Number(e.target.value))}
        placeholder="Enter fee amount"
        className="w-full pl-8 pr-3 py-2.5 border-2 border-purple-200 rounded-xl text-sm font-black text-purple-900 outline-none focus:border-purple-500 bg-white"
      />
    </div>
  </div>
)}

{sec && form.applied_for === 'Intermediate' && (
                        <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                          className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
                          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0"/>
                          <p className="text-sm font-black text-emerald-900">
                            {pct}% Matric → Auto Section <span className="text-[#c0392b]">{sec}</span> → Class: <strong>{cls||'—'}</strong>
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Quick Fee Presets */}
                    <div className="pt-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quick Fee Presets</p>
                       <div className="flex flex-wrap gap-2">
                         {[
                           { label: 'Inter (80k)', amt: 80000, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                           { label: 'BS/ADP (120k)', amt: 120000, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                           { label: 'Masters (150k)', amt: 150000, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                           { label: 'CS (140k)', amt: 140000, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                         ].map(p => (
                           <button 
                             key={p.label}
                             onClick={() => set('fee_package', p.amt)}
                             className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all hover:scale-105 active:scale-95', p.color)}
                           >
                             {p.label}
                           </button>
                         ))}
                       </div>
                    </div>

                    {/* Fee + Submit */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      {form.student_type === 'Summer Camp' ? (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 italic space-y-2">
                           <p className="text-sm font-black text-amber-700">Summer Camp Fee Applied</p>
                           <p className="text-xs text-amber-600">A fee of 7,000 (Summer Camp Fee) will be applied for this admission.</p>
                        </div>
                      ) : (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 italic space-y-2">
                           <p className="text-sm font-black text-amber-700">Standard Fee Structure Applied</p>
                           <p className="text-xs text-amber-600">The accountant-defined package plus 8,000 (Summer Camp Fee: 7,000 + Uniform Fee: 1,000) will be applied.</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button whileHover={{y:-1}} whileTap={{scale:0.98}}
                          onClick={handleSubmit} disabled={saving}
                          className="flex-1 py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{background:'#c0392b',boxShadow:'0 6px 20px rgba(192,57,43,0.3)'}}>
                          {saving?<Loader2 size={17} className="animate-spin"/>:<><Save size={17}/> Submit Admission Form + Sync to Google Sheets</>}
                        </motion.button>
                        <button onClick={()=>setForm({...EMPTY})}
                          className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                          Clear Form
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ LIST ══ */}
            {tab==='list'&&(
              <motion.div key="list" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, form number..."
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:border-[#c0392b] shadow-sm"/>
                  </div>
                  <select value={filter} onChange={e=>setFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none shadow-sm">
                    <option value="">All Status</option>
                    <option>Pending</option><option>Approved</option><option>Rejected</option>
                  </select>
                  {!isAccountant&&<button onClick={()=>setTab('form')} className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-black" style={{background:'#c0392b'}}><Plus size={15}/> New Form</button>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{l:'Total',v:forms.length,c:'text-slate-900',bg:'bg-white'},{l:'Pending',v:pending,c:'text-amber-600',bg:'bg-amber-50'},{l:'Approved',v:approved,c:'text-emerald-600',bg:'bg-emerald-50'}].map(({l,v,c,bg})=>(
                    <div key={l} className={cn('rounded-2xl p-4 border border-slate-100',bg)}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l}</p>
                      <p className={cn('text-2xl font-black mt-0.5',c)}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  {loading?<div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-[#c0392b]"/></div>:(
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[750px]">
                        <thead>
                          <tr style={{background:'#c0392b'}}>
                            {['Form No','Student','Father','Program','Section','Matric %','Status','Date',''].map(h=>(
                              <th key={h} className="px-4 py-3 text-left text-white font-black text-[9px] uppercase tracking-widest whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((f,i)=>(
                            <motion.tr key={f.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
                              className="border-b border-slate-50 hover:bg-white">
                              <td className="px-4 py-3 font-mono font-bold text-[#c0392b]">{f.form_no}</td>
                              <td className="px-4 py-3 font-black text-slate-900">{f.student_name}</td>
                              <td className="px-4 py-3 text-slate-500">{f.father_name}</td>
                              <td className="px-4 py-3 text-slate-600"><p>{f.program}</p><p className="text-[10px] text-slate-400">Part {f.part}</p></td>
                              <td className="px-4 py-3">
                                {f.suggested_section?<span className={cn('px-2 py-0.5 rounded text-[10px] font-black border',f.suggested_section.startsWith('A')?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-blue-50 text-blue-700 border-blue-200')}>{f.suggested_section}</span>:'—'}
                              </td>
                              <td className="px-4 py-3 font-bold">{f.matric_percentage?`${f.matric_percentage}%`:'—'}</td>
                              <td className="px-4 py-3">
                                <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black',f.status==='Approved'?'bg-emerald-50 text-emerald-700':f.status==='Rejected'?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700')}>{f.status}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-400">{new Date(f.created_at).toLocaleDateString('en-PK',{day:'2-digit',month:'short'})}</td>
                              <td className="px-4 py-3">
                                <button onClick={()=>setPreview(f)} className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Eye size={13}/></button>
                              </td>
                            </motion.tr>
                          ))}
                          {filtered.length===0&&<tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No forms found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══ ACCOUNTANT: CONFIRM TO DB ══ */}
            {tab==='confirm'&&isAccountant&&(
              <motion.div key="confirm" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-black text-amber-900">Accountant Action Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Review each pending form. Clicking <strong>"Confirm to DB"</strong> adds the student to the main database with roll number, login credentials, and fee groups. Google Sheets is also updated automatically.
                    </p>
                  </div>
                </div>
                {forms.filter(f=>f.status==='Pending').length===0?(
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                    <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4"/>
                    <p className="font-bold text-slate-500">All forms have been processed</p>
                  </div>
                ):(
                  <div className="space-y-3">
                    {forms.filter(f=>f.status==='Pending').map((f,i)=>(
                      <motion.div key={f.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                              style={{background:`hsl(${(f.student_name?.charCodeAt(0)||50)*37%360},60%,50%)`}}>
                              {f.student_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{f.student_name}</p>
                              <p className="text-xs text-slate-400">{f.father_name} · {f.program} Part {f.part}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] font-mono text-[#c0392b]">{f.form_no}</span>
                                {f.suggested_section&&<span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border border-blue-200">Section: {f.suggested_section}</span>}
                                {f.matric_percentage&&<span className="text-[10px] text-slate-500">Matric: <strong>{f.matric_percentage}%</strong></span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={()=>{
                                setConfirming(f);
                            }} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"><Eye size={12}/> View & Confirm</button>
                            <motion.button whileTap={{scale:0.95}} disabled={saving} onClick={()=>{
                                confirmToDatabase(f, []);
                            }}
                              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-50"
                              style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                              {saving?<Loader2 size={12} className="animate-spin"/>:<><Database size={12}/> Quick Confirm</>}
                            </motion.button>
                            <motion.button whileTap={{scale:0.95}} onClick={()=>rejectForm(f)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={12}/> Reject
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* PREVIEW/CONFIRM MODAL */}
      <AnimatePresence>
        {(preview || confirming) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setPreview(null); setConfirming(null);}} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"/>
            <motion.div initial={{opacity:0,scale:0.94,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94}}
              transition={{type:'spring',stiffness:400,damping:28}}
              className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
              style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
              <div className="h-1" style={{background:'#c0392b'}}/>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div><h3 className="font-black text-slate-900">Form Details</h3><p className="text-xs text-[#c0392b] font-bold">{(preview || confirming).form_no}</p></div>
                <button onClick={()=>{setPreview(null); setConfirming(null);}} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 space-y-3">
                {confirming && (
                  <div className="space-y-4 mb-4">
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                      <p className="text-sm font-black text-indigo-700 mb-1">Set Installment Due Dates</p>
                      <p className="text-[10px] text-indigo-500 mb-3 uppercase tracking-widest font-black leading-none">Schedule Payment Timeline</p>
                      <div className="space-y-2">
                        {Array.from({length: confirming.installments || 1}).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100">
                            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">{idx+1}</span>
                            <span className="flex-1 text-[11px] font-bold text-slate-700">Installment {idx+1}</span>
                            <input type="date" value={instDates[idx] || ''} onChange={(e) => {
                              const newDates = [...instDates];
                              newDates[idx] = e.target.value;
                              setInstDates(newDates);
                            }} className="text-[11px] font-black p-1.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {[
                  ['Student Name',(preview || confirming).student_name],['Father Name',(preview || confirming).father_name],
                  ['B-Form / NIC',(preview || confirming).b_form_nic||'—'],['Program',`${(preview || confirming).program} Part ${(preview || confirming).part}`],
                  ['Gender',(preview || confirming).gender],['DOB',(preview || confirming).student_dob||'—'],
                  ['Cell No',(preview || confirming).cell_no||'—'],['WhatsApp',(preview || confirming).whatsapp_no||'—'],
                  ['Email',(preview || confirming).email||'—'],['Address',(preview || confirming).current_address||'—'],
                  ['Matric Year',(preview || confirming).matric_year||'—'],['Matric Marks',(preview || confirming).matric_marks||'—'],
                  ['Matric %',(preview || confirming).matric_percentage?`${(preview || confirming).matric_percentage}%`:'—'],
                  ['Matric Board',(preview || confirming).matric_board||'—'],
                  ['Suggested Section',(preview || confirming).suggested_section||'—'],['Suggested Class',(preview || confirming).suggested_class||'—'],
                  ['Student Type', (preview || confirming).student_type || 'Regular'],
                  ['Fee Package Amount', PKR((preview || confirming).fee_package)],
                  ['Installments', (preview || confirming).installments || 1],
                  ['Status',(preview || confirming).status],
                  ['Submitted By',(preview || confirming).created_by||'—'],['Date',new Date((preview || confirming).created_at).toLocaleString('en-PK')],
                ].map(([l,v])=>(
                  <div key={l as string} className="flex items-start justify-between py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 flex-shrink-0">{l as string}</span>
                    <span className="text-sm font-bold text-slate-800 text-right flex-1">{v}</span>
                  </div>
                ))}
              </div>
              {confirming && isAccountant && (
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                  <motion.button whileTap={{scale:0.97}} disabled={saving} onClick={()=>confirmToDatabase(confirming, instDates)}
                    className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                    {saving?<Loader2 size={15} className="animate-spin"/>:<><Database size={15}/> Confirm Admission & Sync</>}
                  </motion.button>
                  <button onClick={()=>setConfirming(null)} className="flex-1 py-3 rounded-2xl text-slate-600 font-bold text-sm bg-slate-50 border border-slate-200">Cancel</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast&&<Toast msg={toast.msg} type={toast.type}/>}</AnimatePresence>
    </div>
  );
};