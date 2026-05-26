import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, BarChart3, Bell, LogOut, Search, RefreshCw,
  CheckCircle, X, Lock, Unlock, Check, Settings, Calendar,
  DollarSign, Receipt, Tag, FileText, UserCheck, Loader2,
  ChevronDown, ChevronRight, AlertTriangle, Eye, Printer, RefreshCcw,
  ToggleLeft, ToggleRight, UserPlus, Trash2, CreditCard,
  TrendingUp, Home, ClipboardList, Key, GraduationCap, Plus,
  Truck, Building2, Award, Package, Mail, MessageSquare, Clipboard,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../services/supabase';
import * as XLSX from 'xlsx';
import hotToast from 'react-hot-toast';
import { Sparkles, Upload as UploadIcon, PenLine } from 'lucide-react';
import { BRANDING, LOGO_BASE64 } from '../lib/constants';

interface VPPortalProps {
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string; coordinator_type?: string };
}

const VP_ACCENT   = '#7C3AED';
const VP_GRADIENT = 'linear-gradient(135deg,#7C3AED,#6D28D9)';
const DIR_ACCENT   = '#7c2d12';
const DIR_GRADIENT = 'linear-gradient(135deg,#7c2d12,#9a3412)';
const PKR = (n: number) => `Rs ${(n || 0).toLocaleString('en-PK')}`;

const ALL_ROLES = ['Principal','Accountant','Teacher','Coordinator','Examiner','Academics','Receptionist'];
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Principal:    { view_students:true, edit_students:true,  approve_leave:true,  view_fees:false, edit_fees:false, view_reports:true,  manage_staff:true,  view_timetable:true  },
  Accountant:   { view_students:true, edit_students:false, approve_leave:false, view_fees:true,  edit_fees:true,  view_reports:true,  manage_staff:false, view_timetable:false },
  Teacher:      { view_students:true, edit_students:false, approve_leave:false, view_fees:false, edit_fees:false, view_reports:false, manage_staff:false, view_timetable:true  },
  Coordinator:  { view_students:true, edit_students:true,  approve_leave:false, view_fees:false, edit_fees:false, view_reports:true,  manage_staff:false, view_timetable:true  },
  Examiner:     { view_students:true, edit_students:false, approve_leave:false, view_fees:false, edit_fees:false, view_reports:true,  manage_staff:false, view_timetable:false },
  Academics:    { view_students:true, edit_students:false, approve_leave:false, view_fees:false, edit_fees:false, view_reports:true,  manage_staff:false, view_timetable:true  },
  Receptionist: { view_students:true, edit_students:false, approve_leave:false, view_fees:false, edit_fees:false, view_reports:false, manage_staff:false, view_timetable:false },
};
const PERMISSION_LABELS: Record<string, string> = {
  view_students:'View Students', edit_students:'Edit Students', approve_leave:'Approve Leave',
  view_fees:'View Fees', edit_fees:'Collect Fees', view_reports:'View Reports',
  manage_staff:'Manage Staff', view_timetable:'View Timetable',
};

const TABS_VP = [
  { id:'dashboard',    label:'Dashboard',          icon:Home },
  { id:'frontoffice',  label:'Front Office',        icon:Home },
  { id:'students',     label:'Students',            icon:Users },
  { id:'feemgmt',      label:'Fee Collection',      icon:DollarSign },
  { id:'hr',           label:'Human Resource',     icon:Users },
  { id:'academics',    label:'Academics',           icon:GraduationCap },
  { id:'communicate',  label:'Communication',       icon:Bell },
  { id:'transport',    label:'Transport',           icon:Truck },
  { id:'hostel',       label:'Hostel',              icon:Building2 },
  { id:'inventory',    label:'Inventory',           icon:Package },
  { id:'certificate',  label:'Certificate',         icon:Award },
  { id:'reports',      label:'Reports',             icon:BarChart3 },
];

const TABS_DIR = [...TABS_VP];

const StatCard = ({ icon: Icon, label, value, sub, color, alert }: any) => (
  <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
    className={cn('bg-white rounded-2xl p-4 border transition-all', alert ? 'border-rose-200' : 'border-slate-100')}
    style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={17} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={cn('text-xl font-black leading-none', alert ? 'text-rose-600' : 'text-slate-900')}>{value}</p>
    {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
  </motion.div>
);

const Toggle = ({ value, onChange, accent }: { value:boolean; onChange:(v:boolean)=>void; accent:string }) => (
  <button onClick={() => onChange(!value)}
    className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
    style={{ background: value ? accent : '#CBD5E1' }}>
    <motion.div animate={{ x: value ? 20 : 2 }} transition={{ type:'spring', stiffness:500, damping:30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
  </button>
);

// ── Sub-tab pill bar ─────────────────────────────────────────────────────
const SubTabs = ({ tabs, active, onChange, accent }: { tabs:{id:string;label:string}[]; active:string; onChange:(id:string)=>void; accent:string }) => (
  <div className="flex gap-2 flex-wrap mb-5">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={cn('px-4 py-2 rounded-xl text-xs font-black border transition-all', active===t.id ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}
        style={active===t.id ? { background: accent } : {}}>
        {t.label}
      </button>
    ))}
  </div>
);

// ── Modal wrapper ────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, accent }: any) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity:0, scale:0.94, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.94 }} transition={{ type:'spring', stiffness:400, damping:28 }}
          className="relative bg-white rounded-3xl w-full max-w-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden"
          style={{ boxShadow:'0 40px 100px rgba(0,0,0,0.25)' }}>
          <div className="h-1" style={{ background: accent }} />
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h3 className="font-black text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Form field ───────────────────────────────────────────────────────────
const Field = ({ label, children }: { label:string; children:React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
    {children}
  </div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn('w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-purple-400 transition-all bg-slate-50', props.className)} />
);
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { children:React.ReactNode }) => (
  <select {...props} className={cn('w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-purple-400 bg-slate-50', props.className)} />
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={cn('w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-purple-400 bg-slate-50 resize-none', props.className)} rows={3} />
);

// ── Table wrapper ────────────────────────────────────────────────────────
const TableWrap = ({ children }: { children:React.ReactNode }) => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
    <div className="overflow-x-auto">{children}</div>
  </div>
);
const Th = ({ children }: { children:React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{children}</th>
);
const Td = ({ children, className }: { children?:React.ReactNode; className?:string }) => (
  <td className={cn('px-4 py-3 text-sm', className)}>{children}</td>
);

// ── CSV export ────────────────────────────────────────────────────────────
const exportCSV = (rows: any[], filename: string) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

export default function VPPortal({ onLogout, adminData }: VPPortalProps) {
  const isDirector = adminData.role === 'Director';
  const ACCENT   = isDirector ? DIR_ACCENT   : VP_ACCENT;
  const GRADIENT = isDirector ? DIR_GRADIENT : VP_GRADIENT;
  const TABS     = isDirector ? TABS_DIR     : TABS_VP;

  const [tab, setTab]                     = useState('dashboard');
  const [activeSession, setActiveSession]   = useState<string>(''); // Active Session Name
  const [toast, setToast]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterClass, setFilterClass]     = useState('');
  const [errMsg, setErrMsg]               = useState('');
  const [saving, setSaving]               = useState(false);

  // Core data
  const [staff, setStaff]                 = useState<any[]>([]);
  const [transactions, setTransactions]   = useState<any[]>([]);
  const [students, setStudents]           = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [permissions, setPermissions]     = useState<Record<string, any>>({});
  const [income, setIncome]               = useState<any[]>([]);
  const [expenses, setExpenses]           = useState<any[]>([]);
  const [sessions, setSessions]           = useState<any[]>([]);
  const [teachers, setTeachers]           = useState<any[]>([]);
  const [feeGroupsConfig, setFeeGroupsConfig] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // New tab data
  const [inquiries, setInquiries]         = useState<any[]>([]);
  const [visitors, setVisitors]           = useState<any[]>([]);
  const [callLogs, setCallLogs]           = useState<any[]>([]);
  const [postalDispatch, setPostalDispatch] = useState<any[]>([]);
  const [postalReceive, setPostalReceive] = useState<any[]>([]);
  const [complaints, setComplaints]       = useState<any[]>([]);
  const [admissionForms, setAdmissionForms] = useState<any[]>([]);
  const [exams, setExams]                 = useState<any[]>([]);
  const [examMarks, setExamMarks]         = useState<any[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [attSearchQuery, setAttSearchQuery]       = useState('');
  const [attStatusFilter, setAttStatusFilter]     = useState('All');
  const [attSourceFilter, setAttSourceFilter]     = useState('All');
  const [attStartDate, setAttStartDate]           = useState('');
  const [attEndDate, setAttEndDate]               = useState('');
  const [showPrintReport, setShowPrintReport]     = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([]);
  const [timetable, setTimetable]         = useState<any[]>([]);
  const [subjects, setSubjects]           = useState<any[]>([]);
  const [departments, setDepartments]     = useState<any[]>([]);

  // HR & Payroll
  const [payroll, setPayroll]             = useState<any[]>([]);

  // Transport
  const [routes, setRoutes]               = useState<any[]>([]);
  const [vehicles, setVehicles]           = useState<any[]>([]);
  const [vehicleAssignments, setVehicleAssignments] = useState<any[]>([]);

  // Hostel
  const [hostels, setHostels]             = useState<any[]>([]);
  const [hostelRooms, setHostelRooms]     = useState<any[]>([]);
  const [hostelAssignments, setHostelAssignments] = useState<any[]>([]);

  // Inventory
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryStock, setInventoryStock] = useState<any[]>([]);
  const [inventoryStores, setInventoryStores] = useState<any[]>([]);
  const [inventoryIssues, setInventoryIssues] = useState<any[]>([]);

  // Certificates
  const [certificates, setCertificates]   = useState<any[]>([]);

  // Promotion state
  const [promoSearch, setPromoSearch]         = useState('');
  const [promoFilter, setPromoFilter]         = useState({ program:'', part:0 });
  const [selectedPromos, setSelectedPromos]   = useState<number[]>([]);
  const [promoTargetSession, setPromoTargetSession] = useState('');
  const [promoTargetPart, setPromoTargetPart] = useState(2);
  const [promoLoading, setPromoLoading]       = useState(false);

  // UI state
  const [editPermRole, setEditPermRole]       = useState<{ role:string; perms:Record<string,boolean> }|null>(null);
  const [reversing, setReversing]             = useState<string|null>(null);
  const [leaveSaving, setLeaveSaving]         = useState<string|null>(null);
  const [txSearch, setTxSearch]               = useState('');
  const [txFilter, setTxFilter]               = useState('');
  const [staffSearch, setStaffSearch]         = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [confirmReverse, setConfirmReverse]   = useState<any>(null);
  const [sessionForm, setSessionForm]         = useState({ name:'', is_active:true });
  const [sessionLoading, setSessionLoading]   = useState(false);

  // Sub-tab states
  const [foTab, setFoTab]           = useState('inquiry');
  const [hrTab, setHrTab]           = useState('directory');
  const [acadTab, setAcadTab]       = useState('timetable');
  const [attTab, setAttTab]         = useState('student');
  const [comTab, setComTab]         = useState('notify');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [transTab, setTransTab]     = useState('routes');
  const [hostelTab, setHostelTab]   = useState('rooms');
  const [certTab, setCertTab]       = useState('student');
  const [invTab, setInvTab]         = useState('issue');
  const [admTab, setAdmTab]         = useState('online');
  const [feeTab, setFeeTab]         = useState('search');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [collectSearch, setCollectSearch] = useState('');
  const [selectedCollectStudent, setSelectedCollectStudent] = useState<any>(null);
  const [stuFeeGroups, setStuFeeGroups] = useState<any[]>([]);
  const [stuFeeLoading, setStuFeeLoading] = useState(false);
  const [collectModal, setCollectModal] = useState<any>(null);
  const [feePayForm, setFeePayForm] = useState({ amount: '', method: 'Cash', receipt: '', discount: '' });
  const [incTab, setIncTab]         = useState('search');
  const [expTab, setExpTab]         = useState('search');
  const [examTab, setExamTab]       = useState('groups');
  const [repTab, setRepTab]         = useState('students');

  // Form states
  const [inquiryForm, setInquiryForm]   = useState<any>({ student_name:'', father_name:'', phone:'', email:'', program_interested:'', follow_up_date:'', status:'new', notes:'' });
  const [visitorForm, setVisitorForm]   = useState<any>({ visitor_name:'', phone:'', purpose:'', host_staff:'', visit_date:new Date().toISOString().slice(0,10), check_in_time:'', check_out_time:'', id_type:'CNIC', notes:'' });
  const [callForm, setCallForm]         = useState<any>({ caller_name:'', phone:'', call_date:new Date().toISOString().slice(0,10), call_type:'Incoming', purpose:'', forwarded_to:'', duration_minutes:'', follow_up_date:'', notes:'' });
  const [dispatchForm, setDispatchForm] = useState<any>({ reference_no:'', recipient_name:'', recipient_address:'', subject:'', dispatch_date:new Date().toISOString().slice(0,10), mode:'courier', tracking_no:'', status:'dispatched' });
  const [receiveForm, setReceiveForm]   = useState<any>({ reference_no:'', sender_name:'', sender_address:'', subject:'', receive_date:new Date().toISOString().slice(0,10), mode:'courier', forwarded_to:'', status:'received' });
  const [complaintForm, setComplaintForm] = useState<any>({ complainant_name:'', complaint_type:'', description:'', priority:'normal', status:'open', assigned_to:'', resolution_notes:'' });
  const [notifyForm, setNotifyForm]     = useState<any>({ to:'all', target_role:'', target_username:'', title:'', message:'', priority:'normal' });
  const [incomeForm, setIncomeForm]     = useState<any>({ description:'', amount:'', category:'', income_date:new Date().toISOString().slice(0,10), recorded_by:adminData.full_name });
  const [expenseForm, setExpenseForm]   = useState<any>({ description:'', amount:'', category:'', expense_date:new Date().toISOString().slice(0,10), paid_to:'', payment_method:'cash', entered_by:adminData.full_name });
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // New features forms
  const [routeForm, setRouteForm]     = useState<any>({ route_title:'', vehicle_no:'', driver_name:'', driver_phone:'', route_fare:'' });
  const [vehicleForm, setVehicleForm] = useState<any>({ vehicle_no:'', vehicle_model:'', manufacture_year:'', registration_no:'', chauffeur_name:'', chauffeur_phone:'' });
  const [hrAttMarks, setHrAttMarks]   = useState<Record<string,string>>({});
  const [itemForm, setItemForm]       = useState<any>({ item_name:'', category:'', unit:'', description:'' });
  const [stockForm, setStockForm]     = useState<any>({ item_id:'', supplier:'', storeName:'', quantity:'', purchase_price:'', date:new Date().toISOString().slice(0,10) });

  const [attDate, setAttDate]           = useState(new Date().toISOString().slice(0,10));
  const [attClass, setAttClass]         = useState('');
  const [attMarks, setAttMarks]         = useState<Record<number,string>>({});
  const [attSaving, setAttSaving]       = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [repFilter, setRepFilter]       = useState({ startDate:'', endDate:'', program:'', status:'' });

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''), 3500); };
  const showErr   = (msg:string) => { setErrMsg(msg); setTimeout(()=>setErrMsg(''), 4000); };

  const loadAll = useCallback(async () => {
    // Fetch sessions first to determine active session
    const { data: sessData } = await supabase.from('academic_sessions').select('*').order('created_at', { ascending: false });
    setSessions(sessData || []);

    let currentSess = activeSession;
    if (!currentSess && sessData?.length) {
      const active = sessData.find(s => s.is_active) || sessData[0];
      currentSess = active.name;
      setActiveSession(currentSess);
    }

    const [
      { data:staffData }, { data:txData }, { data:stuData },
      { data:leaveData }, { data:permData }, { data:incData },
      { data:expData }, { data:tLeaveData },
      { data:teachData }, { data:fgcData }, { data:notifData },
      { data:inquiryData }, { data:visitorData }, { data:callData },
      { data:pdData }, { data:prData }, { data:compData },
      { data:admData }, { data:examData }, { data:subData }, { data:deptData },
      { data:tRoutesData }, { data:tVehiclesData }, { data:hRoomsData },
      { data:iItemsData }, { data:iStockData }, { data:iIssuesData },
      { data:certData }, { data:payData }, { data:attData },
    ] = await Promise.all([
      supabase.from('admin_users').select('*').order('full_name'),
      supabase.from('fee_transactions').select('*').eq('session', currentSess).order('payment_date',{ascending:false}).limit(200),
      supabase.from('students').select('*').eq('session', currentSess).limit(2000),
      supabase.from('leave_requests').select('*').eq('session', currentSess).order('created_at',{ascending:false}),
      supabase.from('role_permissions').select('*'),
      supabase.from('income').select('*').order('income_date',{ascending:false}).limit(100),
      supabase.from('expenses').select('*').order('expense_date',{ascending:false}).limit(100),
      supabase.from('teacher_leave_requests').select('*').order('created_at',{ascending:false}),
      supabase.from('teachers').select('*').order('full_name'),
      supabase.from('fee_groups_config').select('*').order('weight'),
      supabase.from('notifications').select('*').eq('target_role', 'vice_principal').order('created_at',{ascending:false}).limit(50),
      supabase.from('admission_inquiries').select('*').order('created_at',{ascending:false}).limit(200),
      supabase.from('visitor_log').select('*').order('created_at',{ascending:false}).limit(200),
      supabase.from('reception_call_log').select('*').order('created_at',{ascending:false}).limit(200),
      supabase.from('postal_dispatch').select('*').order('created_at',{ascending:false}).limit(100),
      supabase.from('postal_receive').select('*').order('created_at',{ascending:false}).limit(100),
      supabase.from('complaints').select('*').order('created_at',{ascending:false}).limit(100),
      supabase.from('admission_forms').select('*').eq('session', currentSess).order('created_at',{ascending:false}).limit(100),
      supabase.from('exams').select('*').eq('session', currentSess).order('created_at',{ascending:false}).limit(100),
      supabase.from('subjects').select('*').eq('session', currentSess).order('name'),
      supabase.from('departments').select('*').order('name'),
      supabase.from('transport_routes').select('*').order('route_title'),
      supabase.from('transport_vehicles').select('*').order('vehicle_no'),
      supabase.from('hostel_rooms').select('*').order('room_no'),
      supabase.from('inventory_items').select('*').order('item_name'),
      supabase.from('inventory_stock').select('*').order('created_at',{ascending:false}),
      supabase.from('inventory_issues').select('*').order('created_at',{ascending:false}),
      supabase.from('student_certificates').select('*').eq('session', currentSess).order('created_at',{ascending:false}),
      supabase.from('payroll_log').select('*').order('created_at',{ascending:false}),
      supabase.from('attendance').select('*').order('date',{ascending:false}).limit(2000),
    ]);

    setStaff(staffData||[]); setTransactions(txData||[]); setStudents(stuData||[]);
    setLeaveRequests(leaveData||[]); setIncome(incData||[]); setExpenses(expData||[]);
    setTeacherLeaves(tLeaveData||[]); setTeachers(teachData||[]);
    setFeeGroupsConfig(fgcData||[]); setNotifications(notifData||[]);
    setInquiries(inquiryData||[]); setVisitors(visitorData||[]); setCallLogs(callData||[]);
    setPostalDispatch(pdData||[]); setPostalReceive(prData||[]); setComplaints(compData||[]);
    setAdmissionForms(admData||[]); setExams(examData||[]); setSubjects(subData||[]);
    setDepartments(deptData||[]);
    setRoutes(tRoutesData||[]); setVehicles(tVehiclesData||[]); setHostelRooms(hRoomsData||[]);
    setInventoryItems(iItemsData||[]); setInventoryStock(iStockData||[]); setInventoryIssues(iIssuesData||[]);
    setCertificates(certData||[]); setPayroll(payData||[]); setStudentAttendance(attData||[]);

    const permMap: Record<string,any> = {};
    ALL_ROLES.forEach(r => { permMap[r] = { permissions:{ ...DEFAULT_PERMISSIONS[r] } }; });
    (permData||[]).forEach((p:any) => { if (permMap[p.role]) permMap[p.role] = { ...p }; });
    setPermissions(permMap);
  }, [activeSession]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time subscription for student attendance live feed
  useEffect(() => {
    const channel = supabase.channel('vp-attendance-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newAtt = payload.new;
          setStudentAttendance(prev => [newAtt, ...prev]);

          // Live audio-visual notifications of every attendance marked in VP Portal
          if (newAtt) {
            // Find student details from our loaded students list
            const stu = students.find(s => s.roll_no === newAtt.student_roll || String(s.roll_no) === String(newAtt.student_roll));
            const studentName = stu ? stu.full_name : `Student Roll #${newAtt.student_roll}`;
            const programSec = stu ? `${stu.program} · Part ${stu.part}` : '';
            const statusEmoji = newAtt.status === 'Present' ? '✅' : newAtt.status === 'Late' ? '⚠️' : '❌';
            const detailMsg = `${studentName} (Roll: ${newAtt.student_roll}${programSec ? `, ${programSec}` : ''}) checked in as ${newAtt.status} at ${newAtt.time_in || 'now'}.`;

            // 1. Double chime sound using high quality HTML5 Web Audio API (totally offline compatible)
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
              osc.start(audioCtx.currentTime);
              osc.stop(audioCtx.currentTime + 0.4);
            } catch (soundErr) {
              console.log('Audio chime error:', soundErr);
            }

            // 2. Beautiful stacked in-app Toast notification using react-hot-toast
            hotToast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl pointer-events-auto flex p-4`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className="text-xl">{statusEmoji}</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                        Live Gate Feed Action
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-100">
                        {studentName} marked {newAtt.status}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {detailMsg}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-slate-800 pl-3 ml-3 justify-center items-center">
                  <button
                    onClick={() => hotToast.dismiss(t.id)}
                    className="text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 4500 });

            // 3. Immediately insert simulated record to VP Live alerts feed dashboard element,
            // so we don't have to wait for any delayed background process or db insert on admin_notifications!
            const simulatedNotif = {
              id: `live-alert-${Date.now()}-${newAtt.id || Math.random()}`,
              sender: 'Live Gate Sensor',
              title: `${statusEmoji} ${newAtt.status} — ${studentName}`,
              message: detailMsg,
              created_at: new Date().toISOString(),
              type: newAtt.status === 'Late' ? 'late_alert' : newAtt.status === 'Absent' ? 'absence_sub_alert' : 'attendance_alert'
            };

            setNotifications(prev => {
              if (prev.some(n => n.title === simulatedNotif.title && n.message === simulatedNotif.message)) return prev;
              return [simulatedNotif, ...prev];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          setStudentAttendance(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        } else if (payload.eventType === 'DELETE') {
          setStudentAttendance(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [students]);

  // Real-time subscription for admin notifications so VP receives live alerts (e.g., attendance logs)
  useEffect(() => {
    const channel = supabase.channel('vp-attendance-feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: 'target_role=eq.vice_principal'
      }, (payload: any) => {
        const newNotif = payload.new;
        if (newNotif) {
          setNotifications(prev => {
            if (prev.some(n => String(n.id) === String(newNotif.id))) return prev;
            return [newNotif, ...prev];
          });

          // Play double chime sound
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.4);
          } catch (soundErr) {
            console.log('Audio chime error:', soundErr);
          }

          // Show high quality toast
          hotToast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl pointer-events-auto flex p-4`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-xl">🚨</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                      Live Gates Feed Alert
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-100">
                      {newNotif.title}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {newNotif.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-800 pl-3 ml-3 justify-center items-center">
                <button
                  onClick={() => hotToast.dismiss(t.id)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          ), { duration: 4500 });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load attendance when date/class changes
  useEffect(() => {
    if (attTab !== 'student' || !attDate) return;
    (async () => {
      const q = supabase.from('attendance').select('student_roll,status').eq('date', attDate);
      const { data } = await q;
      const marks: Record<number,string> = {};
      (data||[]).forEach((r:any) => { marks[r.student_roll] = r.status; });
      setAttMarks(marks);
    })();
  }, [attDate, attTab]);

  // Load exam marks when exam selected
  useEffect(() => {
    if (!selectedExam) return;
    (async () => {
      const { data } = await supabase.from('exam_marks').select('*').eq('exam_id', selectedExam);
      setExamMarks(data||[]);
    })();
  }, [selectedExam]);

  const savePermission = async (role:string, perms:Record<string,boolean>) => {
    setSaving(true);
    try {
      const { data:existing } = await supabase.from('role_permissions').select('id').eq('role',role).single();
      if (existing) {
        await supabase.from('role_permissions').update({ permissions:perms, updated_by:adminData.full_name }).eq('role',role);
      } else {
        await supabase.from('role_permissions').insert([{ role, permissions:perms, updated_by:adminData.full_name }]);
      }
      setPermissions(prev => ({ ...prev, [role]:{ ...prev[role], permissions:perms } }));
      setEditPermRole(null);
      showToast(`✅ Permissions updated for ${role}`);
    } catch(e:any) { showErr(e.message||'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiProcessing(true);
    try {
      const reader = new FileReader();
      const loadPromise = new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });
      reader.readAsBinaryString(file);
      const evt: any = await loadPromise;
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      showToast(`🤖 Claude AI is processing ${data.length} records...`);
      await new Promise(r => setTimeout(r, 2000));

      const notif = {
        title: 'New Academic Data Uploaded',
        message: `New official academic records for session ${activeSession} have been uploaded and verified by Claude AI.`,
        sender: 'Claude AI',
        target_role: 'all',
        broadcast_type: 'all',
        type: 'urgent',
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('admin_notifications').insert([notif]);
      if (error) throw error;

      showToast(`✅ Claude AI processed and notified all users!`);
      loadAll();
    } catch (err: any) {
      showErr(err.message || 'Processing failed');
    } finally {
      setAiProcessing(false);
    }
  };

  const fetchStudentFees = async (rollNo: string | number) => {
    setStuFeeLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_groups')
        .select('*')
        .eq('student_roll', rollNo)
        .order('due_date', { ascending: true });
      if (error) throw error;
      setStuFeeGroups(data || []);
    } catch (e: any) {
      showErr(e.message || 'Failed to fetch student fees');
    } finally {
      setStuFeeLoading(false);
    }
  };

  const collectFee = async () => {
    if (!collectModal) return;
    const amt = Number(feePayForm.amount);
    const disc = Number(feePayForm.discount || 0);
    
    if ((!amt || amt <= 0) && (!disc || disc <= 0)) { showErr('Enter a valid amount or discount'); return; }
    const balance = Number(collectModal.amount || 0) + Number(collectModal.fine || 0) - Number(collectModal.paid || 0) - Number(collectModal.discount || 0);
    if (amt + disc > balance) { showErr(`Total exceeds balance of ${PKR(balance)}`); return; }
    
    setSaving(true);
    try {
      const newPaid     = (collectModal.paid || 0) + amt;
      const newDiscount = (collectModal.discount || 0) + disc;
      const newBalance  = balance - amt - disc;
      const newStatus   = newBalance <= 0 ? 'Paid' : 'Partial';

      const { error: updateError } = await supabase.from('fee_groups').update({ 
        paid: newPaid, 
        discount: newDiscount,
        status: newStatus 
      }).eq('id', collectModal.id);

      if (updateError) throw updateError;

      // Record Payment Transaction
      if (amt > 0) {
        await supabase.from('fee_transactions').insert([{
          student_roll_link: String(collectModal.student_roll),
          amount_paid: amt, payment_method: feePayForm.method,
          receipt_serial: feePayForm.receipt || null, collected_by: adminData.full_name,
          payment_date: new Date().toISOString(), transaction_type: 'Payment',
          fee_group_id: collectModal.id, confirmed_by: adminData.full_name,
        }]);

        // 🔔 Notification for Student
        await supabase.from('notifications').insert([{
          target_user_id: collectModal.student_roll,
          title: '💰 Fee Payment Received',
          message: `Your payment of ${PKR(amt)} for ${collectModal.fees_group} has been successfully recorded.`,
          type: 'fee_payment',
          target_role: 'STUDENT'
        }]);
        
        // Update student paid_amount
        const { data:stu } = await supabase.from('students').select('paid_amount').eq('roll_no', collectModal.student_roll).single();
        if (stu) {
          await supabase.from('students').update({ paid_amount: (stu.paid_amount || 0) + amt }).eq('roll_no', collectModal.student_roll);
        }
      }

      // Record Discount Transaction
      if (disc > 0) {
        await supabase.from('fee_transactions').insert([{
          student_roll_link: String(collectModal.student_roll),
          amount_paid: disc, payment_method: 'Discount',
          receipt_serial: `DISC-${Math.random().toString(36).substring(7).toUpperCase()}`, 
          collected_by: adminData.full_name,
          payment_date: new Date().toISOString(), transaction_type: 'Discount',
          fee_group_id: collectModal.id, confirmed_by: adminData.full_name,
        }]);
      }

      showToast(`✅ ${amt > 0 ? PKR(amt) + ' collected' : ''} ${disc > 0 ? (amt > 0 ? '& ' : '') + PKR(disc) + ' discount applied' : ''}`);
      setCollectModal(null); 
      setFeePayForm({ amount: '', method: 'Cash', receipt: '', discount: '' }); 
      fetchStudentFees(collectModal.student_roll);
      // Also refresh main lists
      const { data:freshTx } = await supabase.from('fee_transactions').select('*').order('payment_date',{ascending:false}).limit(200);
      setTransactions(freshTx||[]);
    } catch (e: any) { 
      console.error(e);
      showErr(e.message || 'Failed to collect fee');
    } finally { 
      setSaving(false); 
    }
  };

  const reverseTransaction = async (tx:any) => {
    if (!tx) return;
    setReversing(tx.id);
    try {
      const { error:txErr } = await supabase.from('fee_transactions')
        .update({ is_reversed:true, reversed_by:adminData.full_name, reversed_at:new Date().toISOString() })
        .eq('id',tx.id);
      if (txErr) throw txErr;
      if (tx.fee_group_id) {
        const { data:fg } = await supabase.from('fee_groups').select('paid,fine,discount,amount').eq('id',tx.fee_group_id).single();
        if (fg) {
          const newPaid = Math.max(0,(fg.paid||0)-Number(tx.amount_paid||0));
          const newStatus = newPaid===0?'Unpaid':newPaid<fg.amount?'Partial':'Paid';
          await supabase.from('fee_groups').update({ paid:newPaid, status:newStatus }).eq('id',tx.fee_group_id);
        }
      }
      if (tx.student_roll_link) {
        const { data:stu } = await supabase.from('students').select('paid_amount').eq('roll_no',tx.student_roll_link).single();
        if (stu) {
          const newPaidAmt = Math.max(0,(stu.paid_amount||0)-Number(tx.amount_paid||0));
          await supabase.from('students').update({ paid_amount:newPaidAmt }).eq('roll_no',tx.student_roll_link);
        }
      }
      await supabase.from('audit_log').insert([{ action:'TRANSACTION_REVERSED', performed_by:adminData.full_name, role:adminData.role, details:`Reversed Tx #${tx.id} | Amount: Rs ${tx.amount_paid} | Student: ${tx.student_roll_link}` }]);
      const { data:fresh } = await supabase.from('fee_transactions').select('*').order('payment_date',{ascending:false}).limit(200);
      setTransactions(fresh||[]);
      setConfirmReverse(null);
      showToast(`✅ Transaction reversed — Rs ${Number(tx.amount_paid).toLocaleString('en-PK')} credited back`);
    } catch(e:any) { showErr(e.message||'Reversal failed'); }
    finally { setReversing(null); }
  };

  const handleLeave = async (id:string, status:'Approved'|'Rejected', isTeacher=false) => {
    setLeaveSaving(id);
    try {
      const table = isTeacher ? 'teacher_leave_requests' : 'leave_requests';
      await supabase.from(table).update({ status, reviewed_by:adminData.full_name }).eq('id',id);
      if (isTeacher) setTeacherLeaves(prev=>prev.map(l=>l.id===id?{...l,status,reviewed_by:adminData.full_name}:l));
      else setLeaveRequests(prev=>prev.map(l=>l.id===id?{...l,status,reviewed_by:adminData.full_name}:l));
      showToast(`✅ Leave ${status}`);
    } catch(e:any) { showErr(e.message||'Failed'); }
    finally { setLeaveSaving(null); }
  };

  const createSession = async () => {
    if (!sessionForm.name) { showErr('Session name required'); return; }
    setSessionLoading(true);
    try {
      const { error } = await supabase.from('academic_sessions').insert([sessionForm]);
      if (error) throw error;
      showToast('✅ New academic session created');
      setSessionForm({ name:'', is_active:true });
      const { data } = await supabase.from('academic_sessions').select('*').order('created_at',{ascending:false});
      setSessions(data||[]);
    } catch(e:any) { showErr(e.message||'Failed to create session'); }
    finally { setSessionLoading(false); }
  };

  const toggleSession = async (id:string, active:boolean) => {
    try {
      await supabase.from('academic_sessions').update({ is_active:active }).eq('id',id);
      setSessions(prev=>prev.map(s=>s.id===id?{...s,is_active:active}:s));
      showToast(`✅ Session ${active?'activated':'deactivated'}`);
    } catch(e:any) { showErr(e.message||'Update failed'); }
  };

  const promoteStudents = async () => {
    if (!promoTargetSession) { showErr('Select a target session'); return; }
    if (!selectedPromos.length) { showErr('No students selected'); return; }
    setPromoLoading(true);
    try {
      const { error } = await supabase.from('students')
        .update({ session:promoTargetSession, part:promoTargetPart })
        .in('roll_no', selectedPromos);
      if (error) throw error;
      showToast(`✅ Promoted ${selectedPromos.length} students to ${promoTargetSession} (Part ${promoTargetPart})`);
      setSelectedPromos([]);
      await loadAll();
    } catch(e:any) { showErr(e.message||'Promotion failed'); }
    finally { setPromoLoading(false); }
  };

  const updateStudentResult = async (rollNo:number, result:string) => {
    try {
      const { error } = await supabase.from('students').update({ exam_result:result }).eq('roll_no',rollNo);
      if (error) throw error;
      setStudents(prev=>prev.map(s=>s.roll_no===rollNo?{...s,exam_result:result}:s));
      showToast(`✅ Updated result for #${rollNo}`);
    } catch(e:any) { showErr(e.message||'Update failed'); }
  };

  const updateStudentClass = async (rollNo:number, classSec:string) => {
    try {
      const { error } = await supabase.from('students').update({ class_section:classSec }).eq('roll_no',rollNo);
      if (error) throw error;
      setStudents(prev=>prev.map(s=>s.roll_no===rollNo?{...s,class_section:classSec}:s));
      showToast(`✅ Updated section for #${rollNo}`);
    } catch(e:any) { showErr(e.message||'Update failed'); }
  };

  // ── Generic insert helper ───────────────────────────────────────────────
  const insertRow = async (table:string, data:any, onSuccess:()=>void) => {
    setSaving(true);
    try {
      const { error } = await supabase.from(table).insert([data]);
      if (error) throw error;
      showToast('✅ Saved successfully');
      onSuccess();
    } catch(e:any) { showErr(e.message||'Failed to save'); }
    finally { setSaving(false); }
  };

  const updateRow = async (table:string, id:any, data:any, idCol='id', onSuccess?:()=>void) => {
    try {
      const { error } = await supabase.from(table).update(data).eq(idCol,id);
      if (error) throw error;
      showToast('✅ Updated');
      onSuccess?.();
    } catch(e:any) { showErr(e.message||'Failed'); }
  };

  // ── Save student attendance ─────────────────────────────────────────────
  const saveAttendance = async () => {
    setAttSaving(true);
    try {
      const rows = Object.entries(attMarks).map(([roll,status]) => ({
        student_roll:Number(roll), date:attDate, status, marked_by:0,
      }));
      for (const row of rows) {
        await supabase.from('attendance').upsert(row, { onConflict:'student_roll,date' });
      }
      showToast(`✅ Attendance saved for ${attDate}`);
    } catch(e:any) { showErr(e.message||'Failed'); }
    finally { setAttSaving(false); }
  };

  // ── Send notification ───────────────────────────────────────────────────
  const sendNotification = async () => {
    if (!notifyForm.title || !notifyForm.message) { showErr('Title and message required'); return; }
    setSaving(true);
    try {
      let targets: string[] = [];
      if (notifyForm.to === 'all') targets = ['ALL'];
      else if (notifyForm.to === 'role' && notifyForm.target_role) targets = [notifyForm.target_role];
      else if (notifyForm.to === 'person' && notifyForm.target_username) targets = [notifyForm.target_username];
      else targets = ['ALL'];

      const rows = targets.map(t => ({
        title:notifyForm.title, message:notifyForm.message,
        sender:adminData.full_name, target_role:notifyForm.to==='role'?notifyForm.target_role:'ALL',
        target:t, broadcast_type:notifyForm.to, type:notifyForm.priority, is_read:false,
      }));
      const { error } = await supabase.from('admin_notifications').insert(rows);
      if (error) throw error;
      showToast('✅ Notification sent');
      setNotifyForm({ to:'all', target_role:'', target_username:'', title:'', message:'', priority:'normal' });
      const { data } = await supabase.from('admin_notifications').select('*').order('created_at',{ascending:false}).limit(50);
      setNotifications(data||[]);
    } catch(e:any) { showErr(e.message||'Failed'); }
    finally { setSaving(false); }
  };

  // ── Computed ────────────────────────────────────────────────────────────
  const pendingLeaves  = leaveRequests.filter(l=>!l.status||l.status==='Pending').length + teacherLeaves.filter(tl=>!tl.status||tl.status==='Pending').length;
  const todayRevenue   = transactions.filter(t=>t.payment_date?.slice(0,10)===new Date().toISOString().slice(0,10)).reduce((s,t)=>s+Number(t.amount_paid||0),0);
  const totalRevenue   = transactions.filter(t=>!t.is_reversed).reduce((s,t)=>s+Number(t.amount_paid||0),0);
  const reversedCount  = transactions.filter(t=>t.is_reversed).length;
  const filteredTx     = transactions.filter(t => {
    if (txFilter==='Reversed'&&!t.is_reversed) return false;
    if (txFilter==='Active'&&t.is_reversed) return false;
    if (txSearch) {
      const q=txSearch.toLowerCase();
      const stu=students.find(s=>String(s.roll_no)===String(t.student_roll_link));
      return String(t.student_roll_link).includes(q)||(stu?.full_name?.toLowerCase() || '').includes(q)||(t.receipt_serial||'').toLowerCase().includes(q);
    }
    return true;
  });
  const filteredStaff = staff.filter(s => {
    if (selectedRoleFilter&&s.role!==selectedRoleFilter) return false;
    if (staffSearch) return (s.full_name?.toLowerCase() || '').includes(staffSearch.toLowerCase())||(s.username?.toLowerCase() || '').includes(staffSearch.toLowerCase());
    return true;
  });
  const filteredStudents = students.filter(s => {
    const q=searchQuery.toLowerCase();
    const matchSearch=(s.full_name?.toLowerCase() || '').includes(q)||String(s.roll_no).includes(q);
    const matchClass=filterClass?s.class_section===filterClass:true;
    return matchSearch&&matchClass;
  });
  const classOptions = Array.from(new Set(students.map(s=>s.class_section).filter(Boolean))).sort();

  const ROLE_COLORS: Record<string,string> = {
    Director:'bg-orange-100 text-orange-700', VP:'bg-purple-100 text-purple-700',
    Principal:'bg-teal-100 text-teal-700', Accountant:'bg-emerald-100 text-emerald-700',
    Teacher:'bg-blue-100 text-blue-700', Coordinator:'bg-indigo-100 text-indigo-700',
    Examiner:'bg-violet-100 text-violet-700', Academics:'bg-cyan-100 text-cyan-700',
    Receptionist:'bg-pink-100 text-pink-700',
  };

  const StatusBadge = ({ status }: { status:string }) => {
    const colors: Record<string,string> = {
      new:'bg-blue-100 text-blue-700', contacted:'bg-yellow-100 text-yellow-700',
      converted:'bg-emerald-100 text-emerald-700', dropped:'bg-red-100 text-red-700',
      open:'bg-blue-100 text-blue-700', resolved:'bg-emerald-100 text-emerald-700',
      pending:'bg-yellow-100 text-yellow-700', approved:'bg-emerald-100 text-emerald-700',
      rejected:'bg-red-100 text-red-700', issued:'bg-blue-100 text-blue-700',
      returned:'bg-emerald-100 text-emerald-700', active:'bg-emerald-100 text-emerald-700',
      normal:'bg-slate-100 text-slate-600', urgent:'bg-orange-100 text-orange-700',
      critical:'bg-red-100 text-red-700', dispatched:'bg-blue-100 text-blue-700',
      delivered:'bg-emerald-100 text-emerald-700', received:'bg-teal-100 text-teal-700',
    };
    return <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black capitalize', colors[status?.toLowerCase()]||'bg-slate-100 text-slate-600')}>{status}</span>;
  };

  // ── RENDER FRONT OFFICE ─────────────────────────────────────────────────
  const renderFrontOffice = () => {
    const foTabs = [
      {id:'inquiry',label:'Admission Inquiry'},{id:'visitor',label:'Visitor Book'},
      {id:'calllog',label:'Phone Call Log'},{id:'postal',label:'Postal Dispatch/Receive'},
      {id:'complaints',label:'Complaints'},{id:'forms',label:'Admission Forms'}
    ];
    return (
      <motion.div key="fo" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={foTabs} active={foTab} onChange={setFoTab} accent={ACCENT} />

        {foTab==='forms' && renderAdmissions()}
        {foTab==='postal' && (
          <div className="space-y-4">
             <div className="flex gap-2 mb-4">
               {['dispatch','receive'].map(t=>(
                 <button key={t} onClick={()=>setTransTab(t)} className={cn('px-4 py-2 rounded-xl text-xs font-black transition-all',transTab===t?'text-white':'bg-white text-slate-500 border border-slate-200')} style={transTab===t?{background:GRADIENT}:{}}>{t.toUpperCase()}</button>
               ))}
             </div>
             {transTab==='dispatch' && (
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                 <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                   <h3 className="font-black text-slate-900">Add Dispatch</h3>
                   {[['Reference No','reference_no','text'],['Recipient','recipient_name','text'],['Subject','subject','text'],['Tracking No','tracking_no','text']].map(([l,k,t])=>(
                     <Field key={k} label={l}><Input type={t} value={dispatchForm[k]} onChange={e=>setDispatchForm({...dispatchForm,[k]:e.target.value})} /></Field>
                   ))}
                   <button onClick={()=>insertRow('postal_dispatch',dispatchForm,()=>{ loadAll(); setDispatchForm({reference_no:'',recipient_name:'',recipient_address:'',subject:'',dispatch_date:new Date().toISOString().slice(0,10),mode:'courier',tracking_no:'',status:'dispatched'}); })} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>Save Dispatch</button>
                 </div>
                 <div className="lg:col-span-3"><TableWrap><table className="w-full text-xs">
                   <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Ref #</Th><Th>Recipient</Th><Th>Date</Th></tr></thead>
                   <tbody>{postalDispatch.map(p=><tr key={p.id}><Td>{p.reference_no}</Td><Td>{p.recipient_name}</Td><Td>{p.dispatch_date}</Td></tr>)}</tbody>
                 </table></TableWrap></div>
               </div>
             )}
          </div>
        )}

        {foTab==='inquiry' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Inquiry</h3>
              {[['Student Name','student_name','text'],['Father Name','father_name','text'],['Phone','phone','text'],['Email','email','email'],['Program Interested','program_interested','text'],['Follow Up Date','follow_up_date','date']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={inquiryForm[k]} onChange={e=>setInquiryForm({...inquiryForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="Status">
                <Select value={inquiryForm.status} onChange={e=>setInquiryForm({...inquiryForm,status:e.target.value})}>
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="dropped">Dropped</option>
                </Select>
              </Field>
              <Field label="Notes"><Textarea value={inquiryForm.notes} onChange={e=>setInquiryForm({...inquiryForm,notes:e.target.value})} /></Field>
              <button onClick={()=>insertRow('admission_inquiries',{...inquiryForm,handled_by:adminData.full_name,inquiry_date:new Date().toISOString().slice(0,10)},()=>{ loadAll(); setInquiryForm({student_name:'',father_name:'',phone:'',email:'',program_interested:'',follow_up_date:'',status:'new',notes:''}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50"
                style={{background:GRADIENT}}>{saving?'Saving...':'Save Inquiry'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Name</Th><Th>Phone</Th><Th>Program</Th><Th>Follow Up</Th><Th>Status</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {inquiries.map(i=>(
                      <tr key={i.id} className="hover:bg-slate-50/50">
                        <Td><p className="font-bold text-slate-800">{i.student_name}</p><p className="text-[10px] text-slate-400">{i.father_name}</p></Td>
                        <Td className="text-slate-600">{i.phone}</Td>
                        <Td className="text-slate-600">{i.program_interested}</Td>
                        <Td className="text-slate-500">{i.follow_up_date}</Td>
                        <Td><StatusBadge status={i.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!inquiries.length && <p className="p-8 text-center text-slate-400 text-sm">No inquiries yet</p>}
              </TableWrap>
            </div>
          </div>
        )}

        {foTab==='visitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Visitor</h3>
              {[['Visitor Name','visitor_name','text'],['Phone','phone','text'],['Purpose','purpose','text'],['Host Staff','host_staff','text'],['Visit Date','visit_date','date'],['Check In','check_in_time','time'],['Check Out','check_out_time','time']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={visitorForm[k]} onChange={e=>setVisitorForm({...visitorForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="ID Type">
                <Select value={visitorForm.id_type} onChange={e=>setVisitorForm({...visitorForm,id_type:e.target.value})}>
                  <option>CNIC</option><option>Passport</option><option>Student Card</option><option>Other</option>
                </Select>
              </Field>
              <Field label="Notes"><Textarea value={visitorForm.notes} onChange={e=>setVisitorForm({...visitorForm,notes:e.target.value})} /></Field>
              <button onClick={()=>insertRow('visitor_log',visitorForm,()=>{ loadAll(); setVisitorForm({visitor_name:'',phone:'',purpose:'',host_staff:'',visit_date:new Date().toISOString().slice(0,10),check_in_time:'',check_out_time:'',id_type:'CNIC',notes:''}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Log Visitor'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Visitor</Th><Th>Purpose</Th><Th>Host</Th><Th>Date</Th><Th>Check In</Th><Th>Check Out</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {visitors.map(v=>(
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <Td><p className="font-bold text-slate-800">{v.visitor_name}</p><p className="text-[10px] text-slate-400">{v.phone}</p></Td>
                        <Td className="text-slate-600">{v.purpose}</Td><Td className="text-slate-600">{v.host_staff}</Td>
                        <Td className="text-slate-500">{v.visit_date}</Td><Td className="text-slate-500">{v.check_in_time}</Td><Td className="text-slate-500">{v.check_out_time}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visitors.length && <p className="p-8 text-center text-slate-400 text-sm">No visitors logged</p>}
              </TableWrap>
            </div>
          </div>
        )}

        {foTab==='calllog' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Call Log</h3>
              {[['Caller Name','caller_name','text'],['Phone','phone','text'],['Call Date','call_date','date'],['Purpose','purpose','text'],['Forwarded To','forwarded_to','text'],['Duration (min)','duration_minutes','number'],['Follow Up Date','follow_up_date','date']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={callForm[k]} onChange={e=>setCallForm({...callForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="Call Type">
                <div className="flex gap-4 mt-1">
                  {['Incoming','Outgoing'].map(ct=>(
                    <label key={ct} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={callForm.call_type===ct} onChange={()=>setCallForm({...callForm,call_type:ct})} className="accent-purple-600" />
                      <span className="text-sm font-bold text-slate-700">{ct}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Notes"><Textarea value={callForm.notes} onChange={e=>setCallForm({...callForm,notes:e.target.value})} /></Field>
              <button onClick={()=>insertRow('reception_call_log',{...callForm,handled_by:adminData.full_name},()=>{ loadAll(); setCallForm({caller_name:'',phone:'',call_date:new Date().toISOString().slice(0,10),call_type:'Incoming',purpose:'',forwarded_to:'',duration_minutes:'',follow_up_date:'',notes:''}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save Log'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Name</Th><Th>Phone</Th><Th>Date</Th><Th>Follow Up</Th><Th>Type</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {callLogs.map(c=>(
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <Td className="font-bold text-slate-800">{c.caller_name}</Td>
                        <Td className="text-slate-600">{c.phone}</Td>
                        <Td className="text-slate-500">{c.call_date}</Td>
                        <Td className="text-slate-500">{c.follow_up_date||'—'}</Td>
                        <Td><StatusBadge status={c.call_type} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!callLogs.length && <p className="p-8 text-center text-slate-400 text-sm">No call logs</p>}
              </TableWrap>
            </div>
          </div>
        )}

        {foTab==='dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Postal Dispatch</h3>
              {[['Reference No','reference_no','text'],['Recipient Name','recipient_name','text'],['Recipient Address','recipient_address','text'],['Subject','subject','text'],['Dispatch Date','dispatch_date','date'],['Tracking No','tracking_no','text']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={dispatchForm[k]} onChange={e=>setDispatchForm({...dispatchForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="Mode"><Select value={dispatchForm.mode} onChange={e=>setDispatchForm({...dispatchForm,mode:e.target.value})}><option value="courier">Courier</option><option value="hand">Hand</option><option value="email">Email</option></Select></Field>
              <button onClick={()=>insertRow('postal_dispatch',{...dispatchForm,dispatched_by:adminData.full_name},()=>{ loadAll(); setDispatchForm({reference_no:'',recipient_name:'',recipient_address:'',subject:'',dispatch_date:new Date().toISOString().slice(0,10),mode:'courier',tracking_no:'',status:'dispatched'}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Recipient</Th><Th>Subject</Th><Th>Date</Th><Th>Mode</Th><Th>Tracking</Th><Th>Status</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {postalDispatch.map(p=>(
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <Td className="font-bold text-slate-800">{p.recipient_name}</Td><Td className="text-slate-600">{p.subject}</Td>
                        <Td className="text-slate-500">{p.dispatch_date}</Td><Td className="text-slate-500">{p.mode}</Td>
                        <Td className="text-slate-500 font-mono">{p.tracking_no||'—'}</Td><Td><StatusBadge status={p.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!postalDispatch.length && <p className="p-8 text-center text-slate-400 text-sm">No dispatches</p>}
              </TableWrap>
            </div>
          </div>
        )}

        {foTab==='receive' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Log Received Post</h3>
              {[['Reference No','reference_no','text'],['Sender Name','sender_name','text'],['Sender Address','sender_address','text'],['Subject','subject','text'],['Receive Date','receive_date','date'],['Forwarded To','forwarded_to','text']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={receiveForm[k]} onChange={e=>setReceiveForm({...receiveForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="Mode"><Select value={receiveForm.mode} onChange={e=>setReceiveForm({...receiveForm,mode:e.target.value})}><option value="courier">Courier</option><option value="hand">Hand</option></Select></Field>
              <button onClick={()=>insertRow('postal_receive',{...receiveForm,received_by:adminData.full_name},()=>{ loadAll(); setReceiveForm({reference_no:'',sender_name:'',sender_address:'',subject:'',receive_date:new Date().toISOString().slice(0,10),mode:'courier',forwarded_to:'',status:'received'}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Sender</Th><Th>Subject</Th><Th>Date</Th><Th>Forwarded To</Th><Th>Status</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {postalReceive.map(p=>(
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <Td className="font-bold text-slate-800">{p.sender_name}</Td><Td className="text-slate-600">{p.subject}</Td>
                        <Td className="text-slate-500">{p.receive_date}</Td><Td className="text-slate-500">{p.forwarded_to||'—'}</Td><Td><StatusBadge status={p.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!postalReceive.length && <p className="p-8 text-center text-slate-400 text-sm">No received post</p>}
              </TableWrap>
            </div>
          </div>
        )}

        {foTab==='complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Log Complaint</h3>
              {[['Complainant Name','complainant_name','text'],['Complaint Type','complaint_type','text'],['Assigned To','assigned_to','text']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={complaintForm[k]} onChange={e=>setComplaintForm({...complaintForm,[k]:e.target.value})} /></Field>
              ))}
              <Field label="Priority"><Select value={complaintForm.priority} onChange={e=>setComplaintForm({...complaintForm,priority:e.target.value})}><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option></Select></Field>
              <Field label="Description"><Textarea value={complaintForm.description} onChange={e=>setComplaintForm({...complaintForm,description:e.target.value})} /></Field>
              <Field label="Resolution Notes"><Textarea value={complaintForm.resolution_notes} onChange={e=>setComplaintForm({...complaintForm,resolution_notes:e.target.value})} /></Field>
              <button onClick={()=>insertRow('complaints',complaintForm,()=>{ loadAll(); setComplaintForm({complainant_name:'',complaint_type:'',description:'',priority:'normal',status:'open',assigned_to:'',resolution_notes:''}); })}
                disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save'}</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Complainant</Th><Th>Type</Th><Th>Priority</Th><Th>Assigned To</Th><Th>Status</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {complaints.map(c=>(
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <Td className="font-bold text-slate-800">{c.complainant_name}</Td><Td className="text-slate-600">{c.complaint_type}</Td>
                        <Td><StatusBadge status={c.priority} /></Td><Td className="text-slate-500">{c.assigned_to||'—'}</Td>
                        <Td>
                          <div className="flex gap-1 items-center">
                            <StatusBadge status={c.status} />
                            {c.status==='open' && (
                              <button onClick={()=>updateRow('complaints',c.id,{status:'resolved'},undefined,loadAll)} className="px-2 py-1 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Resolve</button>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!complaints.length && <p className="p-8 text-center text-slate-400 text-sm">No complaints</p>}
              </TableWrap>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER ADMISSIONS ───────────────────────────────────────────────────
  const renderAdmissions = () => {
    const admTabs = [{id:'online',label:'Online Admissions'},{id:'disabled',label:'Disabled Students'},{id:'categories',label:'Student Categories'},{id:'houses',label:'Student Houses'}];
    return (
      <motion.div key="adm" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={admTabs} active={admTab} onChange={setAdmTab} accent={ACCENT} />

        {admTab==='online' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900">Online Admission Forms ({admissionForms.filter(f=>f.status==='pending').length} pending)</h3>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Form No</Th><Th>Student Name</Th><Th>Program</Th><Th>Part</Th><Th>Submitted</Th><Th>Status</Th><Th>Action</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {admissionForms.map(f=>(
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <Td className="font-mono text-slate-500">{f.form_no||`#${f.id}`}</Td>
                    <Td className="font-bold text-slate-800">{f.student_name}</Td>
                    <Td className="text-slate-600">{f.program}</Td><Td className="text-slate-500">{f.part}</Td>
                    <Td className="text-slate-400">{f.created_at?.slice(0,10)}</Td>
                    <Td><StatusBadge status={f.status} /></Td>
                    <Td>
                      {f.status==='pending' && (
                        <div className="flex gap-1">
                          <button onClick={()=>updateRow('admission_forms',f.id,{status:'approved',approved_by:adminData.full_name,approved_at:new Date().toISOString()},undefined,loadAll)} className="px-2 py-1 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Approve</button>
                          <button onClick={()=>updateRow('admission_forms',f.id,{status:'rejected'},undefined,loadAll)} className="px-2 py-1 rounded-lg text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200">Reject</button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!admissionForms.length && <p className="p-8 text-center text-slate-400 text-sm">No forms submitted</p>}
          </TableWrap>
        )}

        {admTab==='disabled' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Disabled Students</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Name</Th><Th>Program</Th><Th>Section</Th><Th>Action</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {students.filter(s=>s.status?.toLowerCase()==='inactive'||s.status?.toLowerCase()==='disabled').map(s=>(
                  <tr key={s.roll_no} className="hover:bg-slate-50/50">
                    <Td className="font-mono text-slate-500">#{s.roll_no}</Td>
                    <Td className="font-bold text-slate-800">{s.full_name}</Td>
                    <Td className="text-slate-600">{s.program}</Td><Td className="text-slate-500">{s.class_section}</Td>
                    <Td><button onClick={()=>updateRow('students',s.roll_no,{status:'Active'},'roll_no',loadAll)} className="px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Re-enable</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!students.filter(s=>s.status?.toLowerCase()==='inactive'||s.status?.toLowerCase()==='disabled').length && <p className="p-8 text-center text-slate-400 text-sm">No disabled students</p>}
          </TableWrap>
        )}

        {admTab==='categories' && <PlaceholderCard title="Student Categories" desc="Manage student categories from the database table student_categories." />}
        {admTab==='houses' && <PlaceholderCard title="Student Houses" desc="Manage student houses with colours from student_houses table." />}
      </motion.div>
    );
  };

  const renderCollectFee = () => {
    const filteredSearch = students.filter(s => 
      (s.full_name?.toLowerCase() || '').includes(collectSearch.toLowerCase()) || 
      String(s.roll_no).includes(collectSearch)
    ).slice(0, 5);

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            value={collectSearch} 
            onChange={e => setCollectSearch(e.target.value)} 
            placeholder="Search student by name or roll number..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
          />
          {collectSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden divide-y divide-slate-50">
              {filteredSearch.map(s => (
                <button key={s.roll_no} onClick={() => { setSelectedCollectStudent(s); setCollectSearch(''); fetchStudentFees(s.roll_no); }} className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div><p className="font-black text-slate-900">{s.full_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Roll #{s.roll_no} • {s.program} ({s.part})</p></div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
              {!filteredSearch.length && <div className="px-5 py-4 text-center text-slate-400 text-xs font-bold">No students found</div>}
            </div>
          )}
        </div>

        {selectedCollectStudent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">{selectedCollectStudent.full_name?.charAt(0)}</div>
                <div><h3 className="font-black text-slate-900 text-lg">{selectedCollectStudent.full_name}</h3><p className="text-xs text-slate-400 font-bold">Roll #{selectedCollectStudent.roll_no} • {selectedCollectStudent.program} {selectedCollectStudent.part} • {selectedCollectStudent.section}</p></div>
              </div>
              <button onClick={() => setSelectedCollectStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Clear</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Fee Type</Th><Th>Amount</Th><Th>Fine</Th><Th>Paid</Th><Th>Discount</Th><Th>Balance</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {stuFeeLoading ? (
                    <tr><td colSpan={8} className="py-20 text-center"><Loader2 size={24} className="animate-spin mx-auto text-slate-200" /></td></tr>
                  ) : stuFeeGroups.map(f => {
                    const balance = Number(f.amount || 0) + Number(f.fine || 0) - Number(f.paid || 0) - Number(f.discount || 0);
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/50">
                        <Td className="font-black text-slate-800">{f.fees_group}</Td>
                        <Td className="font-bold">{PKR(f.amount)}</Td>
                        <Td className="text-rose-500 font-bold">{PKR(f.fine || 0)}</Td>
                        <Td className="text-emerald-600 font-bold">{PKR(f.paid || 0)}</Td>
                        <Td className="text-blue-600 font-bold">{PKR(f.discount || 0)}</Td>
                        <Td className="font-black text-slate-900 bg-slate-50/50">{PKR(balance)}</Td>
                        <Td><span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black', f.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{f.status}</span></Td>
                        <Td>
                          {balance > 0 && (
                            <button onClick={() => { setCollectModal(f); setFeePayForm({ ...feePayForm, amount: String(balance) }); }} className="px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black hover:bg-emerald-100 transition-all">Collect</button>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                  {!stuFeeLoading && !stuFeeGroups.length && <tr><td colSpan={8} className="py-20 text-center text-slate-300 font-bold italic">No fees assigned to this student</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // ── RENDER FEE MANAGEMENT ───────────────────────────────────────────────
  const renderFeeManagement = () => {
    const feeTabs = [
      {id:'collect',label:'Collect Fee'},{id:'search',label:'Search Payments'},{id:'due',label:'Due Fee'},{id:'master',label:'Fee Master'},
      {id:'reminder',label:'Fee Reminder'},{id:'income',label:'Income'},{id:'expenses',label:'Expenses'}
    ];
    const dueStudents = students.filter(s=>(s.total_package||0)>(s.paid_amount||0));
    return (
      <motion.div key="fee" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={feeTabs} active={feeTab} onChange={setFeeTab} accent={ACCENT} />

        {feeTab==='income' && renderIncome()}
        {feeTab==='expenses' && renderExpenses()}
        {feeTab==='collect' && renderCollectFee()}

        {feeTab==='search' && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><Input className="pl-10" placeholder="Search by name or roll..." value={txSearch} onChange={e=>setTxSearch(e.target.value)} /></div>
              <button onClick={()=>exportCSV(filteredTx,'fee_payments')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">Export CSV</button>
              <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">Print</button>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Date</Th><Th>Student</Th><Th>Amount</Th><Th>Method</Th><Th>Collected By</Th><Th>Receipt</Th><Th>Status</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTx.slice(0,50).map(t=>{
                    const stu=students.find(s=>String(s.roll_no)===String(t.student_roll_link));
                    return (
                      <tr key={t.id} className={cn('hover:bg-slate-50/50',t.is_reversed&&'opacity-50 bg-rose-50/20')}>
                        <Td className="text-slate-400">{t.payment_date?.slice(0,10)}</Td>
                        <Td><p className="font-bold text-slate-800">{stu?.full_name||`#${t.student_roll_link}`}</p></Td>
                        <Td className={cn('font-black',t.is_reversed?'text-slate-400 line-through':'text-emerald-600')}>{PKR(Number(t.amount_paid))}</Td>
                        <Td className="text-slate-500">{t.payment_method}</Td><Td className="text-slate-500">{t.collected_by}</Td>
                        <Td className="font-mono text-slate-400">{t.receipt_serial||'—'}</Td>
                        <Td>{t.is_reversed?<span className="text-rose-500 text-[10px] font-black">REVERSED</span>:<span className="text-emerald-600 text-[10px] font-black">✓ OK</span>}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {feeTab==='due' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-600">{dueStudents.length} students with outstanding dues</p>
              <button onClick={()=>exportCSV(dueStudents.map(s=>({roll_no:s.roll_no,name:s.full_name,program:s.program,due:((s.total_package||0)-(s.paid_amount||0))})),'due_fee')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Name</Th><Th>Program</Th><Th>Total Package</Th><Th>Paid</Th><Th>Due</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {dueStudents.sort((a,b)=>((b.total_package||0)-(b.paid_amount||0))-((a.total_package||0)-(a.paid_amount||0))).map(s=>(
                    <tr key={s.roll_no} className="hover:bg-slate-50/50">
                      <Td className="font-mono text-slate-500">#{s.roll_no}</Td>
                      <Td className="font-bold text-slate-800">{s.full_name}</Td>
                      <Td className="text-slate-600">{s.program}</Td>
                      <Td className="font-bold text-slate-700">{PKR(s.total_package||0)}</Td>
                      <Td className="font-bold text-emerald-600">{PKR(s.paid_amount||0)}</Td>
                      <Td className="font-black text-rose-600">{PKR((s.total_package||0)-(s.paid_amount||0))}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!dueStudents.length && <p className="p-8 text-center text-slate-400 text-sm">All fees cleared! 🎉</p>}
            </TableWrap>
          </div>
        )}

        {feeTab==='master' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Fee Groups Configuration</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Name</Th><Th>Amount</Th><Th>Level</Th><Th>Fixed</Th><Th>Weight</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {feeGroupsConfig.map(f=>(
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <Td className="font-bold text-slate-800">{f.name}</Td>
                    <Td className="font-black text-emerald-600">{PKR(Number(f.amount))}</Td>
                    <Td className="text-slate-500">{f.level||'—'}</Td>
                    <Td><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black',f.is_fixed?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-500')}>{f.is_fixed?'Yes':'No'}</span></Td>
                    <Td className="text-slate-400">{f.weight}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!feeGroupsConfig.length && <p className="p-8 text-center text-slate-400 text-sm">No fee configuration</p>}
          </TableWrap>
        )}

        {feeTab==='reminder' && (
          <div className="max-w-xl space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Send Fee Reminder</h3>
              <p className="text-sm text-slate-500">{dueStudents.length} students have outstanding fees. This will send a notification to all of them.</p>
              <Field label="Custom Message">
                <Textarea value={notifyForm.message||`Dear Student, you have an outstanding fee balance. Please clear your dues at the earliest. — ${adminData.full_name}`}
                  onChange={e=>setNotifyForm({...notifyForm,message:e.target.value})} rows={4} />
              </Field>
              <button onClick={async()=>{
                setSaving(true);
                try {
                  const rows = dueStudents.map(s=>({
                    title:'Fee Reminder', message:notifyForm.message||'You have outstanding fee dues.',
                    sender:adminData.full_name, target_role:'STUDENT', target:String(s.roll_no), broadcast_type:'student', type:'urgent', is_read:false,
                  }));
                  if (rows.length) { const {error}=await supabase.from('admin_notifications').insert(rows); if(error) throw error; }
                  showToast(`✅ Reminders sent to ${rows.length} students`);
                } catch(e:any){ showErr(e.message||'Failed'); } finally{ setSaving(false); }
              }} disabled={saving||!dueStudents.length} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>
                {saving ? 'Sending...' : `Send Reminders to ${dueStudents.length} Students`}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER INCOME ───────────────────────────────────────────────────────
  const renderIncome = () => {
    const incTabs = [{id:'search',label:'All Income'},{id:'add',label:'Add Income'}];
    return (
      <motion.div key="inc" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={incTabs} active={incTab} onChange={setIncTab} accent={ACCENT} />
        {incTab==='add' && (
          <div className="max-w-lg bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900">Add Income</h3>
            {[['Description','description','text'],['Amount','amount','number'],['Category','category','text'],['Date','income_date','date']].map(([l,k,t])=>(
              <Field key={k} label={l}><Input type={t} value={incomeForm[k]} onChange={e=>setIncomeForm({...incomeForm,[k]:e.target.value})} /></Field>
            ))}
            <button onClick={()=>insertRow('income',{...incomeForm,amount:Number(incomeForm.amount),recorded_by:adminData.full_name},()=>{ loadAll(); setIncomeForm({description:'',amount:'',category:'',income_date:new Date().toISOString().slice(0,10),recorded_by:adminData.full_name}); })}
              disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save Income'}</button>
          </div>
        )}
        {incTab==='search' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-black text-slate-900">Total: <span style={{color:ACCENT}}>{PKR(income.reduce((s,i)=>s+i.amount,0))}</span></p>
              <button onClick={()=>exportCSV(income,'income')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th>Amount</Th><Th>Recorded By</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {income.map(i=>(
                    <tr key={i.id} className="hover:bg-slate-50/50">
                      <Td className="text-slate-400">{i.income_date}</Td>
                      <Td className="font-bold text-slate-800">{i.description}</Td>
                      <Td className="text-slate-500">{i.category}</Td>
                      <Td className="font-black text-emerald-600">{PKR(i.amount)}</Td>
                      <Td className="text-slate-400">{i.recorded_by}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!income.length && <p className="p-8 text-center text-slate-400 text-sm">No income recorded</p>}
            </TableWrap>
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER EXPENSES ─────────────────────────────────────────────────────
  const renderExpenses = () => {
    const expTabs = [{id:'search',label:'All Expenses'},{id:'add',label:'Add Expense'}];
    return (
      <motion.div key="exp" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={expTabs} active={expTab} onChange={setExpTab} accent={ACCENT} />
        {expTab==='add' && (
          <div className="max-w-lg bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900">Add Expense</h3>
            {[['Description','description','text'],['Amount','amount','number'],['Category','category','text'],['Date','expense_date','date'],['Paid To','paid_to','text']].map(([l,k,t])=>(
              <Field key={k} label={l}><Input type={t} value={expenseForm[k]} onChange={e=>setExpenseForm({...expenseForm,[k]:e.target.value})} /></Field>
            ))}
            <Field label="Payment Method"><Select value={expenseForm.payment_method} onChange={e=>setExpenseForm({...expenseForm,payment_method:e.target.value})}><option value="cash">Cash</option><option value="bank">Bank</option><option value="online">Online</option></Select></Field>
            <button onClick={()=>insertRow('expenses',{...expenseForm,amount:Number(expenseForm.amount),entered_by:adminData.full_name},()=>{ loadAll(); setExpenseForm({description:'',amount:'',category:'',expense_date:new Date().toISOString().slice(0,10),paid_to:'',payment_method:'cash',entered_by:adminData.full_name}); })}
              disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save Expense'}</button>
          </div>
        )}
        {expTab==='search' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-black text-slate-900">Total: <span className="text-rose-600">{PKR(expenses.reduce((s,e)=>s+e.amount,0))}</span></p>
              <button onClick={()=>exportCSV(expenses,'expenses')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th>Paid To</Th><Th>Amount</Th><Th>Method</Th><Th>Action</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.map(e=>(
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <Td className="text-slate-400">{e.expense_date}</Td>
                      <Td className="font-bold text-slate-800">{e.description}</Td>
                      <Td className="text-slate-500">{e.category}</Td><Td className="text-slate-500">{e.paid_to||'—'}</Td>
                      <Td className="font-black text-rose-600">{PKR(e.amount)}</Td>
                      <Td className="text-slate-400">{e.payment_method}</Td>
                      <Td>
                        <button
                          onClick={() => setEditingExpense({ ...e })}
                          className="p-1.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-all border border-slate-100 flex items-center justify-center"
                          title="Edit Expense"
                        >
                          <PenLine size={13} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!expenses.length && <p className="p-8 text-center text-slate-400 text-sm">No expenses recorded</p>}
            </TableWrap>
          </div>
        )}
        {editingExpense && (
          <Modal
            open={!!editingExpense}
            onClose={() => setEditingExpense(null)}
            title="Edit Expense Entry"
            accent={ACCENT}
          >
            <div className="space-y-4">
              <Field label="Description">
                <Input value={editingExpense.description} onChange={e=>setEditingExpense({...editingExpense, description: e.target.value})} />
              </Field>
              <Field label="Amount">
                <Input type="number" value={editingExpense.amount} onChange={e=>setEditingExpense({...editingExpense, amount: e.target.value})} />
              </Field>
              <Field label="Category">
                <Input value={editingExpense.category} onChange={e=>setEditingExpense({...editingExpense, category: e.target.value})} />
              </Field>
              <Field label="Date">
                <Input type="date" value={editingExpense.expense_date} onChange={e=>setEditingExpense({...editingExpense, expense_date: e.target.value})} />
              </Field>
              <Field label="Paid To">
                <Input value={editingExpense.paid_to} onChange={e=>setEditingExpense({...editingExpense, paid_to: e.target.value})} />
              </Field>
              <Field label="Payment Method">
                <Select value={editingExpense.payment_method} onChange={e=>setEditingExpense({...editingExpense, payment_method: e.target.value})}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="online">Online</option>
                </Select>
              </Field>
              <button
                onClick={() => {
                  updateRow('expenses', editingExpense.id, {
                    description: editingExpense.description,
                    amount: Number(editingExpense.amount),
                    category: editingExpense.category,
                    expense_date: editingExpense.expense_date,
                    paid_to: editingExpense.paid_to,
                    payment_method: editingExpense.payment_method
                  }, 'id', () => {
                    loadAll();
                    setEditingExpense(null);
                  });
                }}
                disabled={saving}
                className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50"
                style={{ background: GRADIENT }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Modal>
        )}
      </motion.div>
    );
  };

  // ── RENDER EXAMINATION ──────────────────────────────────────────────────
  const renderExamination = () => {
    const examTabs = [{id:'groups',label:'Exam Groups'},{id:'result',label:'Exam Results'},{id:'print',label:'Print Marks'}];
    return (
      <motion.div key="exam" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={examTabs} active={examTab} onChange={setExamTab} accent={ACCENT} />

        {examTab==='groups' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Exam Groups ({exams.length})</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Title</Th><Th>Class/Section</Th><Th>Subject</Th><Th>Date</Th><Th>Total Marks</Th><Th>Type</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {exams.map(e=>(
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <Td className="font-bold text-slate-800">{e.title}</Td>
                    <Td className="text-slate-600">{e.class_section}</Td>
                    <Td className="text-slate-500">{e.subject}</Td>
                    <Td className="text-slate-400">{e.date}</Td>
                    <Td className="font-bold text-slate-700">{e.total_marks}</Td>
                    <Td><StatusBadge status={e.exam_type||'exam'} /></Td>
                    <Td><StatusBadge status={e.grading_status||'pending'} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!exams.length && <p className="p-8 text-center text-slate-400 text-sm">No exams found</p>}
          </TableWrap>
        )}

        {examTab==='result' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <Field label="Select Exam">
                <Select value={selectedExam} onChange={e=>setSelectedExam(e.target.value)}>
                  <option value="">-- Select Exam --</option>
                  {exams.map(e=><option key={e.id} value={e.id}>{e.title} — {e.class_section} — {e.subject}</option>)}
                </Select>
              </Field>
            </div>
            {selectedExam && (
              <div className="space-y-3">
                <div className="flex justify-end gap-2">
                  <button onClick={()=>exportCSV(examMarks,'exam_results')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
                  <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Print</button>
                </div>
                <TableWrap>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Student Name</Th><Th>Obtained</Th><Th>Total</Th><Th>%</Th><Th>Grade</Th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {examMarks.map(m=>{
                        const stu=students.find(s=>s.roll_no===m.student_roll||s.roll_no===m.student_roll_no);
                        const exam=exams.find(e=>String(e.id)===selectedExam);
                        const pct=exam?.total_marks?Math.round((m.marks_obtained/exam.total_marks)*100):0;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <Td className="font-mono text-slate-500">#{m.student_roll||m.student_roll_no}</Td>
                            <Td className="font-bold text-slate-800">{stu?.full_name||'—'}</Td>
                            <Td className="font-black text-slate-700">{m.marks_obtained}</Td>
                            <Td className="text-slate-500">{exam?.total_marks}</Td>
                            <Td className={cn('font-black',pct>=50?'text-emerald-600':'text-rose-600')}>{pct}%</Td>
                            <Td><StatusBadge status={pct>=80?'A+':pct>=70?'A':pct>=60?'B':pct>=50?'C':'F'} /></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!examMarks.length && <p className="p-8 text-center text-slate-400 text-sm">No marks entered for this exam</p>}
                </TableWrap>
              </div>
            )}
          </div>
        )}

        {examTab==='print' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <Field label="Select Exam to Print">
                <Select value={selectedExam} onChange={e=>setSelectedExam(e.target.value)}>
                  <option value="">-- Select Exam --</option>
                  {exams.map(e=><option key={e.id} value={e.id}>{e.title} — {e.class_section}</option>)}
                </Select>
              </Field>
              <button onClick={()=>window.print()} className="mt-4 px-6 py-2.5 rounded-xl text-white font-black text-sm" style={{background:GRADIENT}}>Print Mark Sheets</button>
            </div>
            {selectedExam && (
              <div id="printable-marks" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="text-center mb-6 print:block">
                  <p className="font-black text-xl text-slate-900">PAK INFORMATICS GROUP OF COLLEGES, GUJRANWALA</p>
                  <p className="text-slate-500 font-bold">{exams.find(e=>String(e.id)===selectedExam)?.title} — {exams.find(e=>String(e.id)===selectedExam)?.class_section}</p>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b-2 border-slate-200"><th className="py-2 text-left">Roll No</th><th className="py-2 text-left">Name</th><th className="py-2 text-right">Marks</th><th className="py-2 text-right">%</th><th className="py-2 text-right">Grade</th></tr></thead>
                  <tbody>
                    {examMarks.map(m=>{
                      const stu=students.find(s=>s.roll_no===m.student_roll||s.roll_no===m.student_roll_no);
                      const exam=exams.find(e=>String(e.id)===selectedExam);
                      const pct=exam?.total_marks?Math.round((m.marks_obtained/exam.total_marks)*100):0;
                      return (
                        <tr key={m.id} className="border-b border-slate-100">
                          <td className="py-2 font-mono">{m.student_roll||m.student_roll_no}</td>
                          <td className="py-2 font-bold">{stu?.full_name||'—'}</td>
                          <td className="py-2 text-right">{m.marks_obtained}/{exam?.total_marks}</td>
                          <td className="py-2 text-right">{pct}%</td>
                          <td className="py-2 text-right font-black">{pct>=80?'A+':pct>=70?'A':pct>=60?'B':pct>=50?'C':'F'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER ATTENDANCE ───────────────────────────────────────────────────
  const renderAttendance = () => {
    const attTabs = [{id:'student',label:'Student Attendance'},{id:'report',label:'Attendance Report'}];
    const classStudents = attClass ? students.filter(s=>s.class_section===attClass) : students.slice(0,30);
    return (
      <motion.div key="att" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={attTabs} active={attTab} onChange={setAttTab} accent={ACCENT} />

        {attTab==='student' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-4 items-end">
              <Field label="Date"><Input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} className="w-48" /></Field>
              <Field label="Class/Section">
                <Select value={attClass} onChange={e=>setAttClass(e.target.value)} className="w-48">
                  <option value="">All (first 30)</option>
                  {classOptions.map(c=><option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <div className="flex gap-2">
                <button onClick={()=>{ const all:Record<number,string>={};classStudents.forEach(s=>{all[s.roll_no]='Present'});setAttMarks(all); }} className="px-4 py-2.5 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-700">Mark All Present</button>
                <button onClick={saveAttendance} disabled={attSaving} className="px-4 py-2.5 rounded-xl text-white font-black text-xs disabled:opacity-50" style={{background:GRADIENT}}>{attSaving?'Saving...':'Save Attendance'}</button>
              </div>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Name</Th><Th>Class</Th><Th>Status</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {classStudents.map(s=>(
                    <tr key={s.roll_no} className="hover:bg-slate-50/50">
                      <Td className="font-mono text-slate-500">#{s.roll_no}</Td>
                      <Td className="font-bold text-slate-800">{s.full_name}</Td>
                      <Td className="text-slate-500">{s.class_section}</Td>
                      <Td>
                        <div className="flex gap-1">
                          {['Present','Absent','Late','Leave'].map(st=>(
                            <button key={st} onClick={()=>setAttMarks(prev=>({...prev,[s.roll_no]:st}))}
                              className={cn('px-2 py-1 rounded text-[9px] font-black transition-all',
                                attMarks[s.roll_no]===st
                                  ? st==='Present'?'bg-emerald-500 text-white':st==='Absent'?'bg-rose-500 text-white':st==='Late'?'bg-amber-500 text-white':'bg-blue-500 text-white'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              )}>{st}</button>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {attTab==='report' && (
          <div className="space-y-3">
            <div className="flex justify-end"><button onClick={()=>exportCSV(studentAttendance,'attendance')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button></div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Name</Th><Th>Date</Th><Th>Status</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {studentAttendance.slice(0,100).map(a=>{
                    const stu=students.find(s=>s.roll_no===a.student_roll);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <Td className="font-mono text-slate-500">#{a.student_roll}</Td>
                        <Td className="font-bold text-slate-800">{stu?.full_name||'—'}</Td>
                        <Td className="text-slate-400">{a.date}</Td>
                        <Td><StatusBadge status={a.status} /></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!studentAttendance.length && <p className="p-8 text-center text-slate-400 text-sm">No attendance records. Mark attendance first.</p>}
            </TableWrap>
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER ACADEMICS ────────────────────────────────────────────────────
  const renderAcademics = () => {
    const acadTabs = [
      {id:'timetable',label:'Class Timetable'},{id:'assign_teacher',label:'Assign Class Teacher'},
      {id:'subjects',label:'Subjects'},{id:'examination',label:'Examination'}
    ];
    return (
      <motion.div key="acad" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={acadTabs} active={acadTab} onChange={setAcadTab} accent={ACCENT} />

        {acadTab==='examination' && renderExamination()}

        {acadTab==='timetable' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <Field label="Select Class"><Select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="w-64"><option value="">All</option>{classOptions.map(c=><option key={c} value={c}>{c}</option>)}</Select></Field>
            </div>
            <TableWrap>
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Timetable {filterClass?`— ${filterClass}`:''}</h3></div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Day</Th><Th>Period</Th><Th>Subject</Th><Th>Teacher</Th><Th>Class</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {timetable.filter(t=>filterClass?t.class_section===filterClass:true).slice(0,50).map(t=>{
                    const teacher=teachers.find(tc=>tc.id===t.teacher_id);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <Td className="font-bold text-slate-700">{t.day}</Td>
                        <Td className="text-slate-500">{t.period_number||t.period}</Td>
                        <Td className="font-bold text-slate-800">{t.subject}</Td>
                        <Td className="text-slate-600">{teacher?.full_name||'—'}</Td>
                        <Td className="text-slate-500">{t.class_section}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!timetable.length && <p className="p-8 text-center text-slate-400 text-sm">No timetable entries</p>}
            </TableWrap>
          </div>
        )}

        {acadTab==='subjects' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Subjects ({subjects.length})</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Name</Th><Th>Code</Th><Th>Class</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {subjects.map(s=>(
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <Td className="font-bold text-slate-800">{s.name}</Td>
                    <Td className="font-mono text-slate-500">{s.code||'—'}</Td>
                    <Td className="text-slate-500">{s.class_section||'—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!subjects.length && <p className="p-8 text-center text-slate-400 text-sm">No subjects</p>}
          </TableWrap>
        )}

        {acadTab==='departments' && (
          <TableWrap>
            <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Departments ({departments.length})</h3></div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Name</Th><Th>Description</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map(d=>(
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <Td className="font-bold text-slate-800">{d.name}</Td>
                    <Td className="text-slate-500">{d.description||'—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!departments.length && <p className="p-8 text-center text-slate-400 text-sm">No departments</p>}
          </TableWrap>
        )}
      </motion.div>
    );
  };

  // ── RENDER COMMUNICATE ──────────────────────────────────────────────────
  const renderCommunicate = () => {
    const comTabs = [
      {id:'notify',label:'Notice Board'},{id:'ai_bulk',label:'AI Bulk Processor'},
      {id:'sms',label:'Send SMS'}, {id:'email',label:'Send Email'},{id:'log',label:'Message Log'}
    ];
    const myNotifs = notifications.filter(n=>n.sender===adminData.full_name || n.sender === 'Claude AI');
    return (
      <motion.div key="com" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={comTabs} active={comTab} onChange={setComTab} accent={ACCENT} />

        {comTab==='ai_bulk' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-50 rounded-full opacity-50" />
               <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center mx-auto relative z-10">
                 <Sparkles size={40} className="text-purple-600 animate-pulse" />
               </div>
               <div className="space-y-2 relative z-10">
                 <h3 className="font-black text-slate-900 text-2xl tracking-tight">Claude AI Bulk Importer</h3>
                 <p className="text-slate-500 text-sm max-w-sm mx-auto">Upload your academic Excel files here. Claude AI will automatically parse the data, update the system, and notify students & parents via the app.</p>
               </div>
               
               <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 hover:border-purple-400 transition-all cursor-pointer relative group">
                 <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" disabled={aiProcessing} />
                 <div className="space-y-3">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto group-hover:bg-purple-50 transition-colors">
                     <UploadIcon className="text-slate-400 group-hover:text-purple-500" />
                   </div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{aiProcessing ? 'Processing...' : 'Click or Drag Excel File'}</p>
                 </div>
               </div>

               {aiProcessing && (
                 <div className="space-y-2">
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <motion.div initial={{x:'-100%'}} animate={{x:'100%'}} transition={{repeat:Infinity, duration:1.5}} className="h-full w-1/3 bg-purple-500 rounded-full" />
                   </div>
                   <p className="text-[10px] font-black text-purple-600 animate-pulse uppercase tracking-widest">Claude AI is extracting data & generating notifications...</p>
                 </div>
               )}

               <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Auto-Validation</span>
                 <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Smart Notify</span>
                 <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Secure Sync</span>
               </div>
            </div>
          </div>
        )}

        {(comTab==='sms' || comTab==='email') && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
              {comTab==='sms'?<MessageSquare className="text-slate-400" />:<Mail className="text-slate-400" />}
            </div>
            <h3 className="font-black text-slate-900 text-xl">Service Integration Required</h3>
            <p className="text-sm text-slate-500">To send {comTab.toUpperCase()}, please connect your Twilio or SendGrid API keys in the system settings.</p>
            <button className="px-6 py-2.5 rounded-xl text-white font-black text-sm" style={{background:GRADIENT}}>Configure Integration</button>
          </div>
        )}

        {comTab==='notify' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Compose Notification</h3>
              <Field label="To">
                <Select value={notifyForm.to} onChange={e=>setNotifyForm({...notifyForm,to:e.target.value})}>
                  <option value="all">Everyone</option>
                  <option value="role">Specific Role</option>
                  <option value="person">Specific Person</option>
                </Select>
              </Field>
              {notifyForm.to==='role' && (
                <Field label="Role">
                  <Select value={notifyForm.target_role} onChange={e=>setNotifyForm({...notifyForm,target_role:e.target.value})}>
                    <option value="">Select...</option>
                    {['Accountant','Teacher','Examiner','Registrar','Receptionist','Director','VP','Principal'].map(r=><option key={r} value={r}>{r}</option>)}
                  </Select>
                </Field>
              )}
              {notifyForm.to==='person' && (
                <Field label="Username"><Input placeholder="Enter username..." value={notifyForm.target_username} onChange={e=>setNotifyForm({...notifyForm,target_username:e.target.value})} /></Field>
              )}
              <Field label="Title"><Input placeholder="Notification title..." value={notifyForm.title} onChange={e=>setNotifyForm({...notifyForm,title:e.target.value})} /></Field>
              <Field label="Message"><Textarea rows={4} placeholder="Write your message..." value={notifyForm.message} onChange={e=>setNotifyForm({...notifyForm,message:e.target.value})} /></Field>
              <Field label="Priority">
                <div className="flex gap-2">
                  {['normal','urgent','critical'].map(p=>(
                    <button key={p} onClick={()=>setNotifyForm({...notifyForm,priority:p})}
                      className={cn('px-3 py-1.5 rounded-xl text-[11px] font-black border capitalize transition-all',notifyForm.priority===p?'text-white border-transparent':'bg-white text-slate-500 border-slate-200')}
                      style={notifyForm.priority===p?{background:GRADIENT}:{}}>{p}</button>
                  ))}
                </div>
              </Field>
              <button onClick={sendNotification} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Sending...':'Send Notification'}</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4">Recent Sent</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myNotifs.slice(0,10).map(n=>(
                  <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-black text-slate-800 text-sm">{n.title}</p>
                      <StatusBadge status={n.type||'normal'} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">→ {n.target_role||n.target} · {n.created_at?.slice(0,10)}</p>
                  </div>
                ))}
                {!myNotifs.length && <p className="text-slate-400 text-sm text-center py-8">No notifications sent yet</p>}
              </div>
            </div>
          </div>
        )}

        {comTab==='log' && (
          <div className="space-y-3">
            <div className="flex justify-end"><button onClick={()=>exportCSV(myNotifs,'notifications')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button></div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Title</Th><Th>Message</Th><Th>Target</Th><Th>Priority</Th><Th>Sent At</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {myNotifs.map(n=>(
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <Td className="font-bold text-slate-800">{n.title}</Td>
                      <Td className="text-slate-500 max-w-xs truncate">{n.message}</Td>
                      <Td className="text-slate-500">{n.target_role||n.target}</Td>
                      <Td><StatusBadge status={n.type||'normal'} /></Td>
                      <Td className="text-slate-400">{n.created_at?.slice(0,16).replace('T',' ')}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!myNotifs.length && <p className="p-8 text-center text-slate-400 text-sm">No notifications sent</p>}
            </TableWrap>
          </div>
        )}
      </motion.div>
    );
  };

  const renderHumanResource = () => {
    const hrTabs = [{id:'directory',label:'Staff Directory'},{id:'attendance',label:'Staff Attendance'},{id:'payroll',label:'Payroll'}];
    const filteredStaff = staff.filter(s => {
      const matchSearch = s.full_name?.toLowerCase().includes(staffSearch.toLowerCase()) || s.username?.toLowerCase().includes(staffSearch.toLowerCase());
      const matchRole   = !selectedRoleFilter || s.role === selectedRoleFilter;
      return matchSearch && matchRole;
    });

    return (
      <motion.div key="hr" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={hrTabs} active={hrTab} onChange={setHrTab} accent={ACCENT} />

        {hrTab==='directory' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Search staff..."
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-white" />
              </div>
              <div className="flex gap-2">
                {['',...ALL_ROLES].map(r=>(
                  <button key={r} onClick={()=>setSelectedRoleFilter(r)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all',selectedRoleFilter===r?'text-white border-transparent':'bg-white text-slate-500 border-slate-200')} style={selectedRoleFilter===r?{background:GRADIENT}:{}}>{r||'All'}</button>
                ))}
              </div>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Staff</Th><Th>Role</Th><Th>Username</Th><Th>Actions</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStaff.map(s=>(
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <Td><p className="font-bold text-slate-800">{s.full_name}</p></Td>
                      <Td><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black',ROLE_COLORS[s.role]||'bg-slate-100 text-slate-600')}>{s.role}</span></Td>
                      <Td className="text-slate-500 font-mono">@{s.username}</Td>
                      <Td><button onClick={()=>{setTab('permissions'); setEditPermRole({role:s.role,perms:permissions[s.role]?.permissions||DEFAULT_PERMISSIONS[s.role]});}} className="text-purple-600 font-bold hover:underline">Permissions</button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {hrTab==='attendance' && (
          <div className="space-y-4">
             <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-4 items-end">
              <Field label="Date"><Input type="date" value={attDate} onChange={e=>setAttDate(e.target.value)} className="w-48" /></Field>
              <div className="flex gap-2">
                <button onClick={()=>{ const all:Record<string,string>={}; staff.forEach(s=>{all[s.username]='Present'}); setHrAttMarks(all); }} className="px-4 py-2.5 rounded-xl text-xs font-black border border-emerald-200 bg-emerald-50 text-emerald-700">Mark All Present</button>
                <button onClick={async ()=>{
                  setSaving(true);
                  try {
                    const rows = staff.map(s=>({ staff_username:s.username, status:hrAttMarks[s.username]||'Absent', date:attDate, recorded_by:adminData.full_name }));
                    const {error} = await supabase.from('staff_attendance').upsert(rows,{onConflict:'staff_username,date'});
                    if(error) throw error;
                    showToast('✅ Staff attendance saved');
                  } catch(e:any){ showErr(e.message); } finally{ setSaving(false); }
                }} disabled={saving} className="px-4 py-2.5 rounded-xl text-white font-black text-xs disabled:opacity-50" style={{background:GRADIENT}}>{saving?'Saving...':'Save Attendance'}</button>
              </div>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Staff</Th><Th>Role</Th><Th>Status</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {staff.map(s=>(
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <Td className="font-bold text-slate-800">{s.full_name}</Td>
                      <Td className="text-slate-500">{s.role}</Td>
                      <Td>
                        <div className="flex gap-1">
                          {['Present','Absent','Late','Leave'].map(st=>(
                            <button key={st} onClick={()=>setHrAttMarks(prev=>({...prev,[s.username]:st}))}
                              className={cn('px-2 py-1 rounded text-[9px] font-black transition-all', hrAttMarks[s.username]===st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400')}>{st}</button>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {hrTab==='payroll' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4">Staff Payroll</h3>
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Staff</Th><Th>Role</Th><Th>Base Salary</Th><Th>Allowances</Th><Th>Deductions</Th><Th>Net Pay</Th><Th>Actions</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {staff.map(s=>(
                      <tr key={s.id}>
                        <Td className="font-bold">{s.full_name}</Td>
                        <Td>{s.role}</Td>
                        <Td className="font-mono">{PKR(s.salary||0)}</Td>
                        <Td className="font-mono text-emerald-600">+0</Td>
                        <Td className="font-mono text-rose-600">-0</Td>
                        <Td className="font-black text-slate-900">{PKR(s.salary||0)}</Td>
                        <Td><button className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-[10px]">Process</button></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ── RENDER REPORTS ──────────────────────────────────────────────────────
  const renderTransport = () => {
    const tTabs = [{id:'routes',label:'Routes'},{id:'vehicles',label:'Vehicles'},{id:'assign',label:'Assign Vehicle'}];
    return (
      <motion.div key="trans" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={tTabs} active={transTab} onChange={setTransTab} accent={ACCENT} />
        {transTab==='routes' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Route</h3>
              {[['Route Title','route_title','text'],['Vehicle No','vehicle_no','text'],['Driver Name','driver_name','text'],['Driver Phone','driver_phone','text'],['Route Fare','route_fare','number']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={routeForm[k]} onChange={e=>setRouteForm({...routeForm,[k]:e.target.value})} /></Field>
              ))}
              <button onClick={()=>insertRow('transport_routes',routeForm,()=>{ loadAll(); setRouteForm({route_title:'',vehicle_no:'',driver_name:'',driver_phone:'',route_fare:''}); })} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>Save Route</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Route</Th><Th>Vehicle</Th><Th>Driver</Th><Th>Fare</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {routes.map(r=>(
                      <tr key={r.id}>
                        <Td className="font-bold">{r.route_title}</Td><Td>{r.vehicle_no}</Td><Td><p>{r.driver_name}</p><p className="text-[10px] text-slate-400">{r.driver_phone}</p></Td><Td className="font-black">{PKR(r.route_fare)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
        {transTab==='vehicles' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Vehicle</h3>
              {[['Vehicle No','vehicle_no','text'],['Model','vehicle_model','text'],['Year','manufacture_year','number'],['Registration No','registration_no','text'],['Chauffeur','chauffeur_name','text']].map(([l,k,t])=>(
                <Field key={k} label={l}><Input type={t} value={vehicleForm[k]} onChange={e=>setVehicleForm({...vehicleForm,[k]:e.target.value})} /></Field>
              ))}
              <button onClick={()=>insertRow('transport_vehicles',vehicleForm,()=>{ loadAll(); setVehicleForm({vehicle_no:'',vehicle_model:'',manufacture_year:'',registration_no:'',chauffeur_name:'',chauffeur_phone:''}); })} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>Save Vehicle</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Vehicle No</Th><Th>Model</Th><Th>Chauffeur</Th><Th>Status</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {vehicles.map(v=>(
                      <tr key={v.id}><Td className="font-mono font-bold uppercase">{v.vehicle_no}</Td><Td>{v.vehicle_model} ({v.manufacture_year})</Td><Td>{v.chauffeur_name}</Td><Td><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-black text-[9px]">ACTIVE</span></Td></tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderHostel = () => {
    const hTabs = [{id:'rooms',label:'Hostel Rooms'},{id:'type',label:'Hostel Type'},{id:'assign',label:'Assign Hostel'}];
    return (
      <motion.div key="hostel" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={hTabs} active={hostelTab} onChange={setHostelTab} accent={ACCENT} />
        {hostelTab==='rooms' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"><h3 className="font-black text-slate-900 mb-4">Hostel Room List</h3>
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Room No</Th><Th>Hostel</Th><Th>Room Type</Th><Th>Capacity</Th><Th>Cost Per Bed</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {hostelRooms.map(r=>(
                      <tr key={r.id}><Td className="font-bold">{r.room_no}</Td><Td>{r.hostel_name||'Main Hostel'}</Td><Td>{r.room_type}</Td><Td>{r.capacity}</Td><Td className="font-black">{PKR(r.cost_per_bed)}</Td></tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderCertificate = () => {
    const cTabs = [{id:'student',label:'Student Certificate'},{id:'generate',label:'Generate Certificate'}];
    return (
      <motion.div key="cert" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={cTabs} active={certTab} onChange={setCertTab} accent={ACCENT} />
        {certTab==='student' && (
          <TableWrap>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Student</Th><Th>Certificate Type</Th><Th>Issue Date</Th><Th>Issued By</Th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {certificates.map(c=>(
                  <tr key={c.id}><Td className="font-bold">{c.student_name}</Td><Td>{c.certificate_type}</Td><Td>{c.created_at?.slice(0,10)}</Td><Td>{c.issued_by}</Td></tr>
                ))}
              </tbody>
            </table>
            {!certificates.length && <p className="p-12 text-center text-slate-400">No certificates issued yet</p>}
          </TableWrap>
        )}
      </motion.div>
    );
  };

  const renderInventory = () => {
    const iTabs = [{id:'issue',label:'Issue Item'},{id:'item',label:'Add Item'},{id:'stock',label:'Item Stock'},{id:'store',label:'Item Store'},{id:'category',label:'Item Category'}];
    return (
      <motion.div key="inv" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={iTabs} active={invTab} onChange={setInvTab} accent={ACCENT} />
        {invTab==='item' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add New Item</h3>
              <Field label="Item Name"><Input value={itemForm.item_name} onChange={e=>setItemForm({...itemForm,item_name:e.target.value})} /></Field>
              <Field label="Category"><Input value={itemForm.category} onChange={e=>setItemForm({...itemForm,category:e.target.value})} /></Field>
              <Field label="Unit"><Input value={itemForm.unit} onChange={e=>setItemForm({...itemForm,unit:e.target.value})} placeholder="e.g. pcs, kgs" /></Field>
              <Field label="Description"><Textarea value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})} /></Field>
              <button onClick={()=>insertRow('inventory_items',itemForm,()=>{ loadAll(); setItemForm({item_name:'',category:'',unit:'',description:''}); })} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>Save Item</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Item</Th><Th>Category</Th><Th>Unit</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventoryItems.map(i=>(
                      <tr key={i.id}><Td className="font-bold">{i.item_name}</Td><Td>{i.category}</Td><Td>{i.unit}</Td></tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
        {invTab==='stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Add Stock</h3>
              <Field label="Item"><Select value={stockForm.item_id} onChange={e=>setStockForm({...stockForm,item_id:e.target.value})}>{inventoryItems.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}</Select></Field>
              <Field label="Quantity"><Input type="number" value={stockForm.quantity} onChange={e=>setStockForm({...stockForm,quantity:e.target.value})} /></Field>
              <Field label="Supplier"><Input value={stockForm.supplier} onChange={e=>setStockForm({...stockForm,supplier:e.target.value})} /></Field>
              <button onClick={()=>insertRow('inventory_stock',stockForm,()=>{ loadAll(); setStockForm({item_id:'',supplier:'',storeName:'',quantity:'',purchase_price:'',date:new Date().toISOString().slice(0,10)}); })} disabled={saving} className="w-full py-3 rounded-2xl text-white font-black text-sm disabled:opacity-50" style={{background:GRADIENT}}>Add Stock</button>
            </div>
            <div className="lg:col-span-3">
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Item</Th><Th>Supplier</Th><Th>Qty</Th><Th>Date</Th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventoryStock.map(s=>(
                      <tr key={s.id}>
                        <Td className="font-bold text-slate-800">{inventoryItems.find(i=>i.id===s.item_id)?.item_name||'—'}</Td>
                        <Td>{s.supplier}</Td><Td className="font-black text-emerald-600">+{s.quantity}</Td><Td className="text-slate-400">{s.date}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderReports = () => {
    const repTabs = [{id:'students',label:'Students'},{id:'finance',label:'Finance'},{id:'attendance',label:'Attendance'},{id:'exams',label:'Examination'},{id:'hr',label:'Human Resources'}];
    return (
      <motion.div key="rep" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
        <SubTabs tabs={repTabs} active={repTab} onChange={setRepTab} accent={ACCENT} />

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap gap-4 items-end">
          <Field label="Program"><Select value={repFilter.program} onChange={e=>setRepFilter({...repFilter,program:e.target.value})} className="w-40"><option value="">All</option>{Array.from(new Set(students.map(s=>s.program).filter(Boolean))).map(p=><option key={p} value={p}>{p}</option>)}</Select></Field>
          <Field label="Status"><Select value={repFilter.status} onChange={e=>setRepFilter({...repFilter,status:e.target.value})} className="w-40"><option value="">All</option><option value="Active">Active</option><option value="inactive">Inactive</option></Select></Field>
        </div>

        {repTab==='students' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-black text-slate-900">{students.filter(s=>(repFilter.program?s.program===repFilter.program:true)&&(repFilter.status?s.status===repFilter.status:true)).length} students</p>
              <div className="flex gap-2">
                <button onClick={()=>exportCSV(students,'students_report')} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
                <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600">Print</button>
              </div>
            </div>
            <TableWrap>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100"><tr><Th>Roll No</Th><Th>Name</Th><Th>Father</Th><Th>Program</Th><Th>Part</Th><Th>Section</Th><Th>Phone</Th><Th>Status</Th><Th>Session</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {students.filter(s=>(repFilter.program?s.program===repFilter.program:true)&&(repFilter.status?s.status===repFilter.status:true)).map(s=>(
                    <tr key={s.roll_no} className="hover:bg-slate-50/50">
                      <Td className="font-mono text-slate-500">#{s.roll_no}</Td>
                      <Td className="font-bold text-slate-800">{s.full_name}</Td>
                      <Td className="text-slate-500">{s.father_name}</Td>
                      <Td className="text-slate-600">{s.program}</Td>
                      <Td className="text-slate-500">{s.part}</Td>
                      <Td className="text-slate-500">{s.class_section}</Td>
                      <Td className="text-slate-400">{s.phone_no}</Td>
                      <Td><StatusBadge status={s.status||'active'} /></Td>
                      <Td className="text-slate-400">{s.session}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {repTab==='finance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={TrendingUp} label="Total Income"   value={PKR(income.reduce((s,i)=>s+i.amount,0))}    color="bg-emerald-50 text-emerald-600" />
              <StatCard icon={Receipt}    label="Total Expenses" value={PKR(expenses.reduce((s,e)=>s+e.amount,0))}  color="bg-rose-50 text-rose-600" />
              <StatCard icon={DollarSign} label="Fee Collected"  value={PKR(totalRevenue)}                           color="bg-blue-50 text-blue-600" />
              <StatCard icon={TrendingUp} label="Net Balance"    value={PKR(income.reduce((s,i)=>s+i.amount,0)-expenses.reduce((s,e)=>s+e.amount,0))} color="bg-purple-50 text-purple-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-900">Income</h3>
                  <button onClick={()=>exportCSV(income,'income_report')} className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 bg-white text-slate-600">Export</button>
                </div>
                {income.map(i=><div key={i.id} className="flex justify-between px-5 py-3 border-b border-slate-50"><div><p className="text-sm font-bold text-slate-700">{i.description}</p><p className="text-[10px] text-slate-400">{i.category}·{i.income_date}</p></div><span className="font-black text-emerald-600">{PKR(i.amount)}</span></div>)}
                {!income.length && <p className="p-6 text-center text-slate-400 text-sm">No income</p>}
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-900">Expenses</h3>
                  <button onClick={()=>exportCSV(expenses,'expenses_report')} className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 bg-white text-slate-600">Export</button>
                </div>
                {expenses.map(e=><div key={e.id} className="flex justify-between px-5 py-3 border-b border-slate-50"><div><p className="text-sm font-bold text-slate-700">{e.description}</p><p className="text-[10px] text-slate-400">{e.category}·{e.expense_date}</p></div><span className="font-black text-rose-600">{PKR(e.amount)}</span></div>)}
                {!expenses.length && <p className="p-6 text-center text-slate-400 text-sm">No expenses</p>}
              </div>
            </div>
          </div>
        )}

        {repTab==='attendance' && (() => {
          // Calculate filtered records
          const filteredAttendance = studentAttendance.filter(a => {
            const stu = students.find(s => s.roll_no === a.student_roll);
            if (!stu) return false;

            if (repFilter.program && stu.program !== repFilter.program) return false;
            
            if (attSearchQuery) {
              const q = attSearchQuery.toLowerCase();
              const matchRoll = a.student_roll?.toLowerCase().includes(q) || false;
              const matchName = stu.full_name?.toLowerCase().includes(q) || false;
              if (!matchRoll && !matchName) return false;
            }

            if (attStatusFilter !== 'All' && a.status !== attStatusFilter) return false;

            const isBiometric = a.source === 'biometric' || a.sender?.toLowerCase().includes('biometric') || a.sender?.toLowerCase().includes('gate');
            if (attSourceFilter !== 'All') {
              if (attSourceFilter === 'Biometric' && !isBiometric) return false;
              if (attSourceFilter === 'Manual' && isBiometric) return false;
            }

            if (attStartDate && a.date < attStartDate) return false;
            if (attEndDate && a.date > attEndDate) return false;

            return true;
          });

          // Metrics based on filtered set
          const presentsCount = filteredAttendance.filter(a => a.status === 'Present').length;
          const absentsCount = filteredAttendance.filter(a => a.status === 'Absent').length;
          const latesCount = filteredAttendance.filter(a => a.status === 'Late').length;
          const totalLogs = filteredAttendance.length;

          return (
            <div className="space-y-4">
              {/* Header actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    <span>Live Attendance Feed Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-400">Real-time gate and manual attendance synchronisation active.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowPrintReport(true)} className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition-all">
                    <Printer size={14} /> Design & Print Official Ledger
                  </button>
                  <button onClick={() => exportCSV(filteredAttendance, 'filtered_attendance_report')} className="px-3.5 py-2 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all">
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Advanced Filter Panel */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">🔍 Fine-tune Filter Criteria</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Search Student</label>
                    <div className="relative">
                      <input type="text" placeholder="Roll No or Name..." value={attSearchQuery} onChange={e => setAttSearchQuery(e.target.value)} className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-slate-700 bg-slate-50/50" />
                      <Search size={11} className="absolute left-2.5 top-[10px] text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">From Date</label>
                    <input type="date" value={attStartDate} onChange={e => setAttStartDate(e.target.value)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-slate-700 bg-slate-50/50" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">To Date</label>
                    <input type="date" value={attEndDate} onChange={e => setAttEndDate(e.target.value)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-slate-700 bg-slate-50/50" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status Type</label>
                    <select value={attStatusFilter} onChange={e => setAttStatusFilter(e.target.value)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-slate-700 bg-slate-50/50 cursor-pointer">
                      <option value="All">All statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Source Stream</label>
                    <select value={attSourceFilter} onChange={e => setAttSourceFilter(e.target.value)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-slate-700 bg-slate-50/50 cursor-pointer">
                      <option value="All">All channels</option>
                      <option value="Biometric">🤖 Biometric Gate</option>
                      <option value="Manual">👨‍🏫 Coordinator Manual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center font-bold">∑</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total Matched</p>
                    <p className="text-lg font-black text-slate-800 leading-none">{totalLogs} logs</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Presents</p>
                    <p className="text-lg font-black text-emerald-600 leading-none">{presentsCount}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold">✗</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Absents</p>
                    <p className="text-lg font-black text-rose-600 leading-none">{absentsCount}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">⚠</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Lates</p>
                    <p className="text-lg font-black text-amber-500 leading-none">{latesCount} lates</p>
                  </div>
                </div>
              </div>

              {/* Data Table with custom columns */}
              <TableWrap>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <Th>Roll No</Th>
                      <Th>Name</Th>
                      <Th>Program & Sec</Th>
                      <Th>Date</Th>
                      <Th>Subject / Period</Th>
                      <Th>Arrival Time</Th>
                      <Th>Tracking Channel</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAttendance.slice(0, 80).map(a => {
                      const stu = students.find(s => s.roll_no === a.student_roll);
                      const isBiometric = a.source === 'biometric' || a.sender?.toLowerCase().includes('biometric') || a.sender?.toLowerCase().includes('gate');
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono text-slate-500">#{a.student_roll}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{stu?.full_name || '—'}</td>
                          <td className="px-4 py-3 text-slate-500">{stu ? `${stu.program} · Part ${stu.part}` : '—'}</td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{new Date(a.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-slate-500 font-bold">{a.subject || 'Staff/Gate Log'} {a.period ? `(P${a.period})` : ''}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{a.time_in || '—'}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {isBiometric ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                🤖 BIOMETRIC
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                👨‍🏫 MANUAL
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredAttendance.length === 0 && (
                  <p className="p-12 text-center text-slate-400 text-sm italic">
                    No attendance logs match the current search or filters.
                  </p>
                )}
              </TableWrap>

              {/* ── DESIGNED PRINT MODAL WITH COLLEGE LOGO & METRICS ──────────────── */}
              <AnimatePresence>
                {showPrintReport && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto print-portal" id="printable-area-outer">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl relative border border-slate-100 max-h-[85vh] overflow-y-auto" id="printable-report-area">
                      
                      {/* Top actions - hidden in print */}
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6 print:hidden">
                        <div className="flex items-center gap-2">
                          <Printer className="text-indigo-600" size={18} />
                          <h4 className="font-black text-slate-800 text-lg">Official Attendance Ledger Draft</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-md">
                            <Printer size={13} /> Trigger System Print (PDF)
                          </button>
                          <button onClick={() => setShowPrintReport(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                            <X size={15} />
                          </button>
                        </div>
                      </div>

                      {/* 🏫 OFFICIAL COLLEGE REPORT HEADER BLOCK */}
                      <div className="text-center space-y-2 pb-6 border-b border-slate-200 relative">
                        {/* Base64 centered official logo */}
                        <div className="flex justify-center mb-1">
                          <img src={LOGO_BASE64} alt="College Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <h2 className="font-black text-slate-900 text-2xl uppercase tracking-wide leading-none">{BRANDING.name}</h2>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{BRANDING.address}</p>
                        <p className="text-[9px] font-bold text-slate-500 tracking-wide">Phone: {BRANDING.phone} · Active Academic Session: {BRANDING.session}</p>
                        
                        {/* Title of the ledger */}
                        <div className="pt-3">
                          <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-250">
                            Official Student Attendance Ledger
                          </span>
                        </div>
                      </div>

                      {/* 📋 REPORT SPECIFICATION METADATA CHUNKS */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Report Generated By</p>
                          <p className="text-slate-800 font-bold">{adminData.full_name} ({adminData.role})</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date bounds</p>
                          <p className="text-slate-800 font-bold">
                            {attStartDate ? attStartDate : 'Beginning'} to {attEndDate ? attEndDate : 'Present'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Academic Program</p>
                          <p className="text-slate-800 font-bold">{repFilter.program || 'All Programs'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Extracted Dataset</p>
                          <p className="text-slate-800 font-bold">{totalLogs} verified logs</p>
                        </div>
                      </div>

                      {/* 📊 SUMMARY STATISTICS ROW IN REPORT */}
                      <div className="grid grid-cols-3 gap-3 my-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Presents Row</p>
                          <p className="text-sm font-black text-emerald-600">{presentsCount}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Absents Row</p>
                          <p className="text-sm font-black text-rose-600">{absentsCount}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Lates Offset Row</p>
                          <p className="text-sm font-black text-amber-600">{latesCount}</p>
                        </div>
                      </div>

                      {/* 📄 LEDGER CONTENT DATA TABLE */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-400">
                              <th className="py-2.5">Roll No</th>
                              <th className="py-2.5">Student Name</th>
                              <th className="py-2.5">Program Details</th>
                              <th className="py-2.5">Tracking Date</th>
                              <th className="py-2.5">Subject Stream</th>
                              <th className="py-2.5">Arrival</th>
                              <th className="py-2.5 text-right">Status Badge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredAttendance.map(a => {
                              const stu = students.find(s => s.roll_no === a.student_roll);
                              return (
                                <tr key={a.id} className="py-2">
                                  <td className="py-2.5 font-mono">#{a.student_roll}</td>
                                  <td className="py-2.5 font-bold text-slate-900">{stu?.full_name || '—'}</td>
                                  <td className="py-2.5 text-slate-500">{stu ? `${stu.program} · P${stu.part}` : '—'}</td>
                                  <td className="py-2.5 text-slate-500">{new Date(a.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                  <td className="py-2.5 text-slate-500 font-semibold">{a.subject || 'Staff/Gate Log'} {a.period ? `(P${a.period})` : ''}</td>
                                  <td className="py-2.5 text-slate-400 font-mono">{a.time_in || '—'}</td>
                                  <td className="py-2.5 text-right font-black">
                                    <span className={cn(
                                      "text-[9px] uppercase px-2 py-0.5 rounded-full border tracking-wide inline-block",
                                      a.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      a.status === 'Absent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      'bg-amber-50 text-amber-600 border-amber-150'
                                    )}>
                                      {a.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {filteredAttendance.length === 0 && (
                          <div className="p-8 text-center text-slate-300 text-sm">
                            No ledger logs found in selected date boundary.
                          </div>
                        )}
                      </div>

                      {/* ✍️ SIGNATURE AUTHORISATION FOOTER BLOCK */}
                      <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs font-semibold text-slate-600">
                        <div className="space-y-4">
                          <div className="h-10 border-b border-slate-200 w-48 mx-auto"></div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">College Vice Principal Autograph</p>
                        </div>
                        <div className="space-y-4">
                          <div className="h-10 border-b border-slate-200 w-48 mx-auto"></div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Director / Head of Institution Office</p>
                        </div>
                      </div>

                      {/* Printer Instructions/Notes */}
                      <p className="mt-8 text-center text-[9px] text-slate-400 italic">
                        This document is a certified dynamic academic ledger generated directly via Pak Informatics Group of Colleges secure biometric portal.
                      </p>

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* 📄 Dynamic Print Style Injection */}
              <style>{`
                @media print {
                  /* Hide all page content except the printable overlay report area */
                  body * {
                    visibility: hidden !important;
                    background: none !important;
                  }
                  #printable-report-area, #printable-report-area * {
                    visibility: visible !important;
                  }
                  #printable-report-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    max-height: 100% !important;
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                  }
                  #printable-area-outer {
                    position: absolute !important;
                    background: white !important;
                    inset: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                    z-index: 999999 !important;
                  }
                  .print\\:hidden, button, .lucide {
                    display: none !important;
                  }
                }
              `}</style>
            </div>
          );
        })()}

        {repTab==='exams' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <Field label="Select Exam for Report">
                <Select value={selectedExam} onChange={e=>setSelectedExam(e.target.value)} className="w-80">
                  <option value="">-- Select Exam --</option>
                  {exams.map(e=><option key={e.id} value={e.id}>{e.title} — {e.class_section} — {e.subject}</option>)}
                </Select>
              </Field>
            </div>
            {selectedExam && examMarks.length>0 && (() => {
              const exam=exams.find(e=>String(e.id)===selectedExam);
              const total=exam?.total_marks||100;
              const pcts=examMarks.map(m=>Math.round((m.marks_obtained/total)*100));
              const avg=Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length);
              const pass=pcts.filter(p=>p>=33).length;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Users}      label="Appeared"  value={examMarks.length}  color="bg-blue-50 text-blue-600" />
                  <StatCard icon={CheckCircle} label="Pass"     value={pass}               color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={X}           label="Fail"     value={examMarks.length-pass} color="bg-rose-50 text-rose-600" />
                  <StatCard icon={TrendingUp}  label="Avg %"    value={`${avg}%`}           color="bg-purple-50 text-purple-600" />
                </div>
              );
            })()}
          </div>
        )}

        {repTab==='hr' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Staff ({teachers.length})</h3></div>
              {teachers.map(t=>(
                <div key={t.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.full_name}</p>
                    <p className="text-[10px] text-slate-400">{t.designation||'Teacher'} · {t.subject_dept}</p>
                  </div>
                  <StatusBadge status={t.status||'active'} />
                </div>
              ))}
              {!teachers.length && <p className="p-6 text-center text-slate-400 text-sm">No staff</p>}
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">Leave Summary</h3></div>
              <div className="p-5 space-y-3">
                {[['Pending',teacherLeaves.filter(l=>!l.status||l.status==='Pending').length,'text-amber-600'],['Approved',teacherLeaves.filter(l=>l.status==='Approved').length,'text-emerald-600'],['Rejected',teacherLeaves.filter(l=>l.status==='Rejected').length,'text-rose-600']].map(([l,v,c])=>(
                  <div key={String(l)} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <p className="font-bold text-slate-700">{l}</p>
                    <p className={cn('font-black text-xl',String(c))}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const TUTORIAL_STEPS = [
    {
      title: "Welcome to your VP Portal 🏢",
      description: "We've built this command center to give you 360-degree control over the campus. Let's walk through the key areas.",
      position: "center"
    },
    {
      title: "Academic Session 📅",
      description: "Switch between different years and sessions here. All data across the portal automatically updates based on your selection.",
      position: "top-right"
    },
    {
      title: "Smart Navigation 🧭",
      description: "Everything you need is just a click away. From Front Office and Students to HR and Hostel management.",
      position: "top-nav"
    },
    {
      title: "Real-time Fee Collection 💰",
      description: "Our newest feature! You can now search for any student and collect their fees instantly. No more manual ledger headaches.",
      position: "fee-nav"
    },
    {
      title: "Claude AI Bulk Upload 🤖",
      description: "Upload academic Excel files in the Communication tab. Claude AI will verify the data and notify students automatically.",
      position: "ai-nav"
    },
    {
      title: "Comprehensive Reports 📊",
      description: "Access deep insights into finances, student performance, and staff attendance in the Reports section.",
      position: "rep-nav"
    },
    {
      title: "You're all set! 🚀",
      description: "Your portal is powerful and intelligent. If you ever need help, just click the help icon in the header.",
      position: "center"
    }
  ];

  const TutorialOverlay = () => {
    if (!showTutorial) return null;
    const step = TUTORIAL_STEPS[tutorialStep];
    
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto" onClick={() => setShowTutorial(false)} />
        
        <motion.div
          key={tutorialStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn(
            "relative bg-white rounded-[32px] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.3)] max-w-sm w-full mx-4 border border-white/20 pointer-events-auto",
            step.position === 'top-right' ? 'md:fixed md:top-20 md:right-8' : 
            step.position === 'top-nav' ? 'md:fixed md:top-40' :
            step.position === 'fee-nav' ? 'md:fixed md:top-40 md:left-1/2 md:-translate-x-1/2' :
            ''
          )}
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full p-2 shadow-xl flex items-center justify-center">
             <div className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl" style={{ background: GRADIENT }}>
                {tutorialStep + 1}
             </div>
          </div>
          
          <div className="text-center mt-6">
            <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{step.description}</p>
          </div>

          <div className="flex gap-2 mt-8">
            {tutorialStep > 0 && (
              <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all">Back</button>
            )}
            <button 
              onClick={() => {
                if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                  setTutorialStep(prev => prev + 1);
                  // Auto-switch tabs for certain steps
                  if (tutorialStep === 2) setTab('feemgmt');
                  if (tutorialStep === 3) setTab('communicate');
                } else {
                  setShowTutorial(false);
                  setTab('dashboard');
                }
              }} 
              className="flex-1 py-3 rounded-2xl text-white font-black text-xs shadow-lg transition-all"
              style={{ background: GRADIENT }}
            >
              {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Got it!" : "Next Step"}
            </button>
          </div>
          
          <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"><X size={20} /></button>
          
          <div className="flex justify-center gap-1.5 mt-6">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={cn("h-1 rounded-full transition-all", i === tutorialStep ? "w-4" : "w-1")} style={{ background: i === tutorialStep ? ACCENT : '#E2E8F0' }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Placeholder card for WIP sections ───────────────────────────────────
  const PlaceholderCard = ({ title, desc }: { title:string; desc:string }) => (
    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-sm">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:`${ACCENT}15`}}>
        <Settings size={28} style={{color:ACCENT}} />
      </div>
      <h3 className="font-black text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm mx-auto">{desc}</p>
    </div>
  );

  // ── RENDER STUDENTS ─────────────────────────────────────────────────────
  const renderStudents = () => (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search students by name or roll number..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-purple-400 transition-all outline-none" />
        </div>
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
          className="w-full md:w-48 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-purple-400">
          <option value="">All Sections</option>
          {classOptions.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={()=>exportCSV(filteredStudents,'students')} className="px-4 py-3 rounded-2xl text-xs font-black border border-slate-200 bg-white text-slate-600 whitespace-nowrap">Export CSV</button>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Program</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Result</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((s:any)=>(
                <tr key={s.roll_no} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">{s.full_name?.charAt(0)}</div>
                      <span className="font-bold text-slate-900">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.program} Pt {s.part}</td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{s.roll_no}</td>
                  <td className="px-6 py-4">
                    <input defaultValue={s.class_section||''} onBlur={e=>{ if(e.target.value!==s.class_section) updateStudentClass(s.roll_no,e.target.value); }}
                      className="w-20 px-2 py-1 rounded bg-slate-50 border border-transparent focus:border-purple-200 text-xs font-bold outline-none" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {['Pass','Fail'].map(r=>(
                        <button key={r} onClick={()=>updateStudentResult(s.roll_no,r)}
                          className={cn('px-2 py-1 rounded text-[9px] font-black transition-all',s.exam_result===r?(r==='Pass'?'bg-emerald-500 text-white':'bg-rose-500 text-white'):'bg-slate-100 text-slate-400 hover:bg-slate-200')}>
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',s.status==='Active'?'bg-emerald-50 text-emerald-600':'bg-slate-50 text-slate-400')}>{s.status||'Active'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={()=>updateRow('students',s.roll_no,{status:'inactive'},'roll_no',loadAll)}
                      className="px-2 py-1 rounded-lg text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">Disable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredStudents.length && (
          <div className="py-20 text-center text-slate-400"><Users size={32} className="mx-auto mb-3 opacity-20" /><p className="font-bold">No students found</p></div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white shadow-2xl"
            style={{background:GRADIENT}}>{toast}</motion.div>
        )}
        {errMsg && (
          <motion.div initial={{opacity:0,y:-40}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-40}}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-black text-white shadow-2xl bg-rose-600">{errMsg}</motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40" style={{boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{background:GRADIENT}}>{adminData.role.charAt(0)}</div>
          <div>
            <p className="font-black text-slate-900 text-sm leading-none">{adminData.full_name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{color:ACCENT}}>{adminData.role} Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Session Selector */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Session</span>
            <select value={activeSession} onChange={e=>setActiveSession(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-slate-700 outline-none cursor-pointer">
              {sessions.map(s=><option key={s.id} value={s.name}>{s.name} {s.is_active?'(Active)':''}</option>)}
            </select>
          </div>
          <motion.button whileTap={{scale:0.95}} onClick={() => { setShowTutorial(true); setTutorialStep(0); }} className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-all" title="Start Tutorial"><HelpCircle size={14} /></motion.button>
          <motion.button whileTap={{scale:0.95}} onClick={loadAll} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"><RefreshCw size={14} /></motion.button>
          {pendingLeaves>0 && (
            <button onClick={()=>setTab('leaves')} className="relative w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Bell size={16} className="text-amber-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{pendingLeaves}</span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-black border border-rose-200 hover:bg-rose-100 transition-all"><LogOut size={13} /> Logout</button>
        </div>
      </header>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100 px-4 md:px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({id,label,icon:Icon})=>{
            const active=tab===id;
            const badge=id==='leaves'?pendingLeaves:0;
            return (
              <button key={id} onClick={()=>setTab(id)} className={cn('flex items-center gap-2 px-4 py-3.5 text-xs font-black border-b-2 transition-all relative whitespace-nowrap',active?'border-current':'border-transparent text-slate-400 hover:text-slate-600')} style={active?{color:ACCENT}:{}}>
                <Icon size={14} />{label}
                {badge>0 && <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">{badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 md:px-6 py-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ════ DASHBOARD ════ */}
          {tab==='dashboard' && (
            <motion.div key="dash" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
              <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{background:GRADIENT,boxShadow:`0 12px 40px ${ACCENT}40`}}>
                <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 bg-white" style={{transform:'translate(40%,-40%)'}} />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{new Date().toLocaleDateString('en-PK',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
                <h2 className="text-xl font-black mb-4">Welcome, {adminData.full_name.split(' ').slice(0,2).join(' ')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{l:"Today's Revenue",v:PKR(todayRevenue)},{l:"Students enrolled",v:students.length},{l:'Staff Count',v:staff.length},{l:'Pending Leaves',v:pendingLeaves}].map(({l,v})=>(
                    <div key={l}><p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">{l}</p><p className="text-xl font-black">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Receipt}       label="Transactions"   value={transactions.length}    sub={`${reversedCount} reversed`}    color="bg-blue-50 text-blue-600" />
                <StatCard icon={Shield}        label="Roles Managed"  value={ALL_ROLES.length}        sub="Permission sets"                color="bg-purple-50 text-purple-600" />
                <StatCard icon={Calendar}      label="Pending Leaves" value={pendingLeaves}           sub="Awaiting action"                color="bg-amber-50 text-amber-600" alert={pendingLeaves>0} />
                <StatCard icon={GraduationCap} label="Total Students" value={students.length}         sub="Enrolled"                      color="bg-purple-50 text-purple-600" />
              </div>

              {/* 🔔 Real-time Campus Alerts & Attendance Feed */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-fade-in">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="font-black text-slate-900 text-lg">Live Campus Alerts & Biometric Check-In Logs</h3>
                  </div>
                  <button onClick={() => setTab('communicate')} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>
                    Message Log & Broadcasts →
                  </button>
                </div>
                <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto">
                  {notifications.slice(0, 8).map((n, i) => {
                    const isSystem = n.sender === 'Biometric Gate' || n.sender === 'Biometric System' || n.sender === 'Biometric';
                    const iconBg = n.type === 'late_alert' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100' 
                      : n.type?.includes('absence') 
                      ? 'bg-red-50 text-red-600 border-red-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100';

                    return (
                      <div key={n.id || i} className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-all">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center border text-sm font-black flex-shrink-0", iconBg)}>
                            {n.type === 'late_alert' ? '⚠️' : n.type?.includes('absence') ? '❌' : '✅'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-800 line-clamp-1">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-bold text-slate-400">
                                Source: {n.sender || 'System'}
                              </span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {n.created_at ? new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Just Now'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="text-right flex-shrink-0 self-center">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            isSystem ? "bg-sky-50 text-sky-600 border-sky-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {isSystem ? "🤖 BIOMETRIC" : "👨‍🏫 STAFF"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <div className="p-12 text-center text-slate-400 space-y-1">
                      <p className="font-bold text-sm">No real-time logs received today yet</p>
                      <p className="text-xs text-slate-400">Activity signals from biometrics and teacher check-ins will show up here as they occur.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-lg">📚 Recent Enrollments</h3>
                  <button onClick={()=>setTab('sessions')} className="text-xs font-bold hover:underline" style={{color:ACCENT}}>Promotion Portal →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-50">
                  {[students.slice(0,5),students.slice(5,10)].map((chunk,ci)=>(
                    <div key={ci} className="divide-y divide-slate-50">
                      {chunk.map(s=>(
                        <div key={s.roll_no} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{s.full_name?.charAt(0)}</div>
                            <div><p className="text-sm font-bold text-slate-800">{s.full_name}</p><p className="text-[10px] text-slate-400 font-medium">{s.program} · Part {s.part}</p></div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-700">#{s.roll_no}</p>
                            <p className={cn('text-[9px] font-black px-2 py-0.5 rounded-full inline-block',s.status==='Active'?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-500')}>{s.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {!students.length && <p className="p-12 text-center text-slate-300 text-sm italic">No students found.</p>}
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">🔐 Role Permissions Overview</h3>
                  <button onClick={()=>setTab('permissions')} className="text-xs font-bold hover:underline" style={{color:ACCENT}}>Manage All →</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {ALL_ROLES.slice(0,5).map(role=>{
                    const perms=permissions[role]?.permissions||DEFAULT_PERMISSIONS[role]||{};
                    const enabledCount=Object.values(perms).filter(Boolean).length;
                    return (
                      <div key={role} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black',ROLE_COLORS[role]||'bg-slate-100 text-slate-600')}>{role}</span>
                          <span className="text-xs text-slate-400">{enabledCount}/{Object.keys(perms).length} permissions enabled</span>
                        </div>
                        <button onClick={()=>setEditPermRole({role,perms:{...perms}})} className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 text-slate-600 hover:border-slate-400 flex items-center gap-1"><Key size={10} /> Edit</button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">🧾 Recent Transactions</h3>
                  <button onClick={()=>setTab('transactions')} className="text-xs font-bold hover:underline" style={{color:ACCENT}}>View All & Reverse →</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0,5).map((t,i)=>{
                    const stu=students.find(s=>String(s.roll_no)===String(t.student_roll_link));
                    return (
                      <motion.div key={t.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} className={cn('flex items-center gap-3 px-5 py-3.5',t.is_reversed&&'opacity-50')}>
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',t.is_reversed?'bg-rose-50 text-rose-500':'bg-emerald-50 text-emerald-600')}><Receipt size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{stu?.full_name||`Roll #${t.student_roll_link}`}</p>
                          <p className="text-[11px] text-slate-400">{t.payment_method||'—'} · {t.collected_by||'—'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn('font-black',t.is_reversed?'text-rose-400 line-through':'text-emerald-600')}>{PKR(Number(t.amount_paid))}</p>
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
          {tab==='permissions' && (
            <motion.div key="perms" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
              <div className="rounded-3xl p-6 text-white" style={{background:GRADIENT}}>
                <h2 className="text-xl font-black">Permission Control Center</h2>
                <p className="text-sm opacity-70 mt-1">Set granular access permissions for every role in the system.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_ROLES.map(role=>{
                  const perms=permissions[role]?.permissions||DEFAULT_PERMISSIONS[role]||{};
                  const enabledCount=Object.values(perms).filter(Boolean).length;
                  return (
                    <motion.div key={role} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{background:GRADIENT}}>{role.charAt(0)}</div>
                          <div><p className="font-black text-slate-900">{role}</p><p className="text-[10px] text-slate-400 font-bold">{enabledCount} of {Object.keys(perms).length} permissions enabled</p></div>
                        </div>
                        <motion.button whileTap={{scale:0.95}} onClick={()=>setEditPermRole({role,perms:{...perms}})} className="px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5" style={{background:GRADIENT}}>
                          <Key size={12} /> Edit
                        </motion.button>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {Object.entries(perms).map(([k,v]:any)=>(
                          <span key={k} className={cn('px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1',v?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-400 line-through')}>
                            {v?<Check size={9} />:<X size={9} />} {PERMISSION_LABELS[k]||k}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <AnimatePresence>
                {editPermRole && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setEditPermRole(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                    <motion.div initial={{opacity:0,scale:0.94,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94}} transition={{type:'spring',stiffness:400,damping:28}}
                      className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10 max-h-[85vh] flex flex-col" style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
                      <div className="h-1" style={{background:GRADIENT}} />
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                        <div><h3 className="font-black text-slate-900">Edit: {editPermRole.role}</h3><p className="text-[10px] text-slate-400 mt-0.5">Toggle permissions on/off</p></div>
                        <button onClick={()=>setEditPermRole(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                      </div>
                      <div className="overflow-y-auto flex-1 p-6 space-y-3">
                        {Object.entries(editPermRole.perms).map(([k,v]:any)=>(
                          <div key={k} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl">
                            <div><p className="text-sm font-bold text-slate-700">{PERMISSION_LABELS[k]||k}</p><p className="text-[10px] text-slate-400">{v?'Currently enabled':'Currently disabled'}</p></div>
                            <Toggle value={!!v} onChange={val=>setEditPermRole(p=>p?({...p,perms:{...p.perms,[k]:val}}):p)} accent={ACCENT} />
                          </div>
                        ))}
                      </div>
                      <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                        <button onClick={()=>setEditPermRole(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                        <motion.button whileTap={{scale:0.97}} onClick={()=>savePermission(editPermRole.role,editPermRole.perms)} disabled={saving}
                          className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{background:GRADIENT}}>
                          {saving?<Loader2 size={15} className="animate-spin" />:<><Shield size={15} /> Save Permissions</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ════ TRANSACTIONS ════ */}
          {tab==='transactions' && (
            <motion.div key="txns" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-5">
              <div className="rounded-2xl px-5 py-4 border flex items-center gap-3" style={{background:`${ACCENT}0d`,borderColor:`${ACCENT}30`}}>
                <RefreshCcw size={16} style={{color:ACCENT}} />
                <p className="text-sm font-bold" style={{color:ACCENT}}>As <strong>{adminData.role}</strong>, you can reverse any transaction.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Receipt}    label="Total Transactions" value={transactions.length}            color="bg-blue-50 text-blue-600" />
                <StatCard icon={DollarSign} label="Total Revenue"      value={PKR(totalRevenue)}             color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={RefreshCcw} label="Reversed"           value={reversedCount}                  color="bg-rose-50 text-rose-600" alert={reversedCount>0} />
                <StatCard icon={TrendingUp} label="Today's Revenue"    value={PKR(todayRevenue)}             color="bg-amber-50 text-amber-600" />
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={txSearch} onChange={e=>setTxSearch(e.target.value)} placeholder="Search name or roll no..."
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-slate-50 focus:bg-white transition-all" />
                </div>
                <div className="flex gap-2">
                  {[{v:'',l:'All'},{v:'Active',l:'Active'},{v:'Reversed',l:'Reversed'}].map(({v,l})=>(
                    <button key={v} onClick={()=>setTxFilter(v)} className={cn('px-3 py-2 rounded-xl text-[11px] font-black border transition-all',txFilter===v?'text-white border-transparent':'bg-slate-50 text-slate-500 border-slate-200')} style={txFilter===v?{background:GRADIENT}:{}}>{l}</button>
                  ))}
                </div>
                <button onClick={()=>exportCSV(filteredTx,'transactions')} className="px-3 py-2 rounded-xl text-[11px] font-black border border-slate-200 bg-white text-slate-600">Export CSV</button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto" style={{maxHeight:560}}>
                  <table className="w-full text-xs min-w-[750px]">
                    <thead className="sticky top-0" style={{background:'#f8f9fd'}}>
                      <tr>{['Date','Student','Amount','Method','Collected By','Receipt','Status','Action'].map(h=><th key={h} className="px-4 py-3.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredTx.map((t,i)=>{
                        const stu=students.find(s=>String(s.roll_no)===String(t.student_roll_link));
                        return (
                          <motion.tr key={t.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:Math.min(i*0.008,0.3)}}
                            className={cn('border-b border-slate-50 transition-colors',t.is_reversed?'bg-rose-50/30 opacity-60':'hover:bg-slate-50/50')}>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</td>
                            <td className="px-4 py-3"><p className="font-black text-slate-900 leading-none">{stu?.full_name||'Unknown'}</p><p className="text-[10px] font-bold mt-0.5" style={{color:ACCENT}}>#{t.student_roll_link}</p></td>
                            <td className="px-4 py-3 font-black" style={{color:t.is_reversed?'#9CA3AF':'#059669'}}>{PKR(Number(t.amount_paid))}{t.is_reversed&&<span className="block text-[8px] font-bold text-rose-400 leading-none mt-0.5">REVERSED</span>}</td>
                            <td className="px-4 py-3 text-slate-600">{t.payment_method||'—'}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{t.collected_by||'—'}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{t.receipt_serial||'—'}</td>
                            <td className="px-4 py-3">{t.is_reversed?<span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">Reversed</span>:t.confirmed_by?<span className="text-emerald-600 font-bold text-[10px]">✓ Confirmed</span>:<span className="text-amber-500 text-[10px]">Pending</span>}</td>
                            <td className="px-4 py-3">{!t.is_reversed&&<motion.button whileTap={{scale:0.9}} onClick={()=>setConfirmReverse(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"><RefreshCcw size={11} /> Reverse</motion.button>}</td>
                          </motion.tr>
                        );
                      })}
                      {!filteredTx.length && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No transactions found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STAFF ════ */}
          {tab==='staff' && (
            <motion.div key="staff" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Search by name or username..."
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-white transition-all" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['',...ALL_ROLES,'Director','VP'].map(r=>(
                    <button key={r} onClick={()=>setSelectedRoleFilter(r)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all',selectedRoleFilter===r?'text-white border-transparent':'bg-white text-slate-500 border-slate-200')} style={selectedRoleFilter===r?{background:GRADIENT}:{}}>{r||'All'}</button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-black text-slate-900">All Staff ({filteredStaff.length})</h3></div>
                <div className="divide-y divide-slate-50" style={{maxHeight:520,overflowY:'auto'}}>
                  {filteredStaff.map((s,i)=>(
                    <motion.div key={s.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.015,0.3)}} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{background:`hsl(${(s.username?.charCodeAt(0)||50)*37%360},55%,45%)`}}>{s.full_name?.charAt(0)}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate">{s.full_name}</p><p className="text-[10px] text-slate-400">@{s.username}</p></div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black',ROLE_COLORS[s.role]||'bg-slate-100 text-slate-600')}>{s.role}</span>
                        <button onClick={()=>{const perms=permissions[s.role]?.permissions||DEFAULT_PERMISSIONS[s.role]||{};setEditPermRole({role:s.role,perms:{...perms}});setTab('permissions');}} className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-400 flex items-center gap-1"><Shield size={10} /> Perms</button>
                      </div>
                    </motion.div>
                  ))}
                  {!filteredStaff.length && <div className="px-5 py-12 text-center text-slate-400 text-sm">No staff found</div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ LEAVES ════ */}
          {tab==='leaves' && (
            <motion.div key="leaves" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
              {(()=>{
                const combined=[
                  ...leaveRequests.map(l=>({...l,isTeacher:false})),
                  ...teacherLeaves.map(l=>({...l,isTeacher:true,student_name:l.teacher_name,student_roll_no:`Teacher ID: ${l.teacher_id}`}))
                ].sort((a,b)=>new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime());
                const totalPending=combined.filter(l=>!l.status||l.status==='Pending').length;
                const totalApproved=combined.filter(l=>l.status==='Approved').length;
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[{l:'Total',v:combined.length,c:'text-slate-900'},{l:'Pending',v:totalPending,c:'text-amber-600'},{l:'Approved',v:totalApproved,c:'text-emerald-600'}].map(({l,v,c})=>(
                        <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{l}</p><p className={cn('text-2xl font-black',c)}>{v}</p></div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {!combined.length?(
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Calendar size={28} className="mx-auto mb-3 text-slate-300" /><p className="text-slate-400 font-bold">No leave requests</p></div>
                      ):combined.map((l:any,i:number)=>{
                        const isPending=!l.status||l.status==='Pending';
                        return (
                          <motion.div key={l.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                            className={cn('bg-white rounded-2xl overflow-hidden shadow-sm',isPending?'border-l-4 border border-amber-200':'border border-slate-100')}
                            style={isPending?{borderLeftColor:'#D97706'}:{}}>
                            <div className="px-4 py-4 flex items-start gap-3">
                              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0',l.status==='Approved'?'bg-emerald-100 text-emerald-700':l.status==='Rejected'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700')}>{(l.student_name||l.teacher_name||'L')?.charAt(0)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 flex items-center gap-2">
                                  {l.student_name||l.teacher_name||`Roll #${l.student_roll_no}`}
                                  {l.isTeacher&&<span className="bg-blue-50 text-blue-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black">Teacher</span>}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{l.reason||l.leave_type||'Leave request'}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  {(l.from_date||l.request_date)&&<span className="text-[11px] text-slate-400">{l.from_date||l.request_date}{l.to_date&&l.to_date!==l.from_date?` → ${l.to_date}`:''}</span>}
                                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black',l.status==='Approved'?'bg-emerald-100 text-emerald-700':l.status==='Rejected'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700')}>{l.status||'Pending'}</span>
                                </div>
                              </div>
                              {isPending&&(
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <motion.button whileTap={{scale:0.9}} onClick={()=>handleLeave(l.id,'Approved',l.isTeacher)} disabled={leaveSaving===l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black text-white disabled:opacity-50" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                                    {leaveSaving===l.id?<Loader2 size={10} className="animate-spin" />:<Check size={10} />} Approve
                                  </motion.button>
                                  <motion.button whileTap={{scale:0.9}} onClick={()=>handleLeave(l.id,'Rejected',l.isTeacher)} disabled={leaveSaving===l.id} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                    <X size={10} /> Reject
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ════ NEW TABS ════ */}
          {tab==='frontoffice'  && renderFrontOffice()}
          {tab==='admission'    && renderAdmissions()}
          {tab==='feemgmt'      && renderFeeManagement()}
          {tab==='income'       && renderIncome()}
          {tab==='expenses'     && renderExpenses()}
          {tab==='examination'  && renderExamination()}
          {tab==='attendance'   && renderAttendance()}
          {tab==='academics'    && renderAcademics()}
          {tab==='hr'           && renderHumanResource()}
          {tab==='communicate'  && renderCommunicate()}
          {tab==='transport'    && renderTransport()}
          {tab==='hostel'       && renderHostel()}
          {tab==='certificate'  && renderCertificate()}
          {tab==='inventory'    && renderInventory()}
          {tab==='reports'      && renderReports()}

          {/* ════ STUDENTS ════ */}
          {tab==='students' && renderStudents()}

          {/* ════ SESSIONS ════ */}
          {tab==='sessions' && (
            <motion.div key="sessions" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Plus size={18} className="text-emerald-500" /> Create Session</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Session Name</label>
                        <input value={sessionForm.name} onChange={e=>setSessionForm({...sessionForm,name:e.target.value})} placeholder="e.g. 2026-28"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-400 transition-all" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-bold text-slate-700">Set as Active</p>
                        <Toggle value={sessionForm.is_active} onChange={v=>setSessionForm({...sessionForm,is_active:v})} accent={ACCENT} />
                      </div>
                      <motion.button whileTap={{scale:0.97}} onClick={createSession} disabled={sessionLoading}
                        className="w-full py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50" style={{background:GRADIENT}}>
                        {sessionLoading?<Loader2 size={16} className="animate-spin" />:'Create'}
                      </motion.button>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Sessions</h3></div>
                    <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                      {sessions.map(s=>(
                        <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                          <p className="font-black text-slate-800 text-sm">{s.name}</p>
                          <Toggle value={s.is_active} onChange={v=>toggleSession(s.id,v)} accent={ACCENT} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                    <div className="p-6 border-b border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2"><TrendingUp size={20} className="text-purple-600" /> Student Promotion</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected:</span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-black">{selectedPromos.length}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input value={promoSearch} onChange={e=>setPromoSearch(e.target.value)} placeholder="Search roll/name..." className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-purple-400 bg-slate-50" /></div>
                        <select value={promoFilter.program} onChange={e=>setPromoFilter({...promoFilter,program:e.target.value})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-slate-50"><option value="">All Programs</option>{Array.from(new Set(students.map(s=>s.program))).map(p=><option key={p} value={p}>{p}</option>)}</select>
                        <select value={promoFilter.part} onChange={e=>setPromoFilter({...promoFilter,part:Number(e.target.value)})} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-slate-50"><option value={0}>All Parts</option><option value={1}>Part 1</option><option value={2}>Part 2</option><option value={3}>Part 3</option></select>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-[300px]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                            <th className="px-6 py-3 w-10">
                              <button onClick={()=>{
                                const ids=students.filter(s=>(promoFilter.program?s.program===promoFilter.program:true)&&(promoFilter.part!==0?s.part===promoFilter.part:true)&&(promoSearch?(s.full_name?.toLowerCase().includes(promoSearch.toLowerCase())||String(s.roll_no).includes(promoSearch)):true)).map(s=>s.roll_no);
                                if(selectedPromos.length===ids.length) setSelectedPromos([]);else setSelectedPromos(ids);
                              }} className="w-4 h-4 border-2 border-slate-200 rounded flex items-center justify-center hover:border-purple-400">
                                {selectedPromos.length>0&&<div className="w-2 h-2 bg-purple-500 rounded-sm" />}
                              </button>
                            </th>
                            <th className="px-4 py-3">Student</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {students.filter(s=>(promoFilter.program?s.program===promoFilter.program:true)&&(promoFilter.part!==0?s.part===promoFilter.part:true)&&(promoSearch?(s.full_name?.toLowerCase().includes(promoSearch.toLowerCase())||String(s.roll_no).includes(promoSearch)):true)).map(s=>(
                            <tr key={s.roll_no} className={cn('hover:bg-slate-50/50 transition-colors',selectedPromos.includes(s.roll_no)&&'bg-purple-50/30')}>
                              <td className="px-6 py-3"><button onClick={()=>setSelectedPromos(prev=>prev.includes(s.roll_no)?prev.filter(id=>id!==s.roll_no):[...prev,s.roll_no])} className={cn('w-4 h-4 border-2 rounded flex items-center justify-center transition-colors',selectedPromos.includes(s.roll_no)?'border-purple-600 bg-purple-600':'border-slate-200')}>{selectedPromos.includes(s.roll_no)&&<Check size={10} className="text-white" />}</button></td>
                              <td className="px-4 py-3"><p className="font-black text-slate-800">{s.full_name}</p><p className="text-[10px] text-slate-400">#{s.roll_no}·{s.program}</p></td>
                              <td className="px-4 py-3"><div className="flex gap-1">{['Pass','Fail'].map(r=><button key={r} onClick={()=>updateStudentResult(s.roll_no,r)} className={cn('px-2 py-1 rounded text-[9px] font-black',s.exam_result===r?(r==='Pass'?'bg-emerald-500 text-white':'bg-rose-500 text-white'):'bg-slate-100 text-slate-400')}>{r.toUpperCase()}</button>)}</div></td>
                              <td className="px-4 py-3"><input defaultValue={s.class_section||''} onBlur={e=>{ if(e.target.value!==s.class_section) updateStudentClass(s.roll_no,e.target.value); }} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 w-32 outline-none focus:border-purple-400 font-bold" /></td>
                              <td className="px-4 py-3 text-slate-500">{s.session} (Pt {s.part})</td>
                              <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black',s.status==='Active'?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-500')}>{s.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                      <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[180px]">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Promote To Session</label>
                          <select value={promoTargetSession} onChange={e=>setPromoTargetSession(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-400 bg-white"><option value="">Select Session...</option>{sessions.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select>
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Part</label>
                          <select value={promoTargetPart} onChange={e=>setPromoTargetPart(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-400 bg-white"><option value={1}>Part 1</option><option value={2}>Part 2</option><option value={3}>Part 3</option></select>
                        </div>
                        <motion.button whileTap={{scale:0.97}} onClick={promoteStudents} disabled={promoLoading||!selectedPromos.length}
                          className="px-6 py-2.5 rounded-xl text-white font-black text-sm flex items-center gap-2 shadow-lg disabled:opacity-50" style={{background:GRADIENT}}>
                          {promoLoading?<Loader2 size={16} className="animate-spin" />:<><CheckCircle size={16} /> Promote Selected</>}
                        </motion.button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-4 flex items-center gap-1.5 opacity-60"><AlertTriangle size={12} /> Promotion will update student session and part across the system.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Confirm Reverse Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmReverse && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setConfirmReverse(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:420,damping:28}}
              className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden z-10" style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
              <div className="h-1 bg-rose-500" />
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-rose-600" /></div>
                <h3 className="font-black text-slate-900 text-center text-lg">Reverse Transaction?</h3>
                <p className="text-sm text-slate-500 text-center mt-2">This will reverse <strong className="text-rose-600">{PKR(Number(confirmReverse.amount_paid))}</strong> and deduct it from the student's ledger.</p>
                <div className="bg-slate-50 rounded-2xl p-4 mt-4 space-y-1.5">
                  {[['Student Roll',`#${confirmReverse.student_roll_link}`],['Amount',PKR(Number(confirmReverse.amount_paid))],['Collected By',confirmReverse.collected_by||'—'],['Method',confirmReverse.payment_method||'—']].map(([l,v])=>(
                    <div key={l} className="flex justify-between text-xs"><span className="text-slate-400 font-bold">{l}:</span><span className="font-black text-slate-700">{v}</span></div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-500 font-bold text-center mt-3">⚠️ This action cannot be undone.</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={()=>setConfirmReverse(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                  <motion.button whileTap={{scale:0.97}} onClick={()=>reverseTransaction(confirmReverse)} disabled={!!reversing}
                    className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 bg-rose-600">
                    {reversing?<Loader2 size={15} className="animate-spin" />:<><RefreshCcw size={15} /> Confirm Reverse</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {collectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setCollectModal(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:420,damping:28}}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden z-10" style={{boxShadow:'0 40px 100px rgba(0,0,0,0.25)'}}>
              <div className="h-1 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center"><DollarSign className="text-emerald-600" /></div>
                  <div><h3 className="font-black text-slate-900 text-lg">Collect Fee</h3><p className="text-xs text-slate-400 font-bold">{collectModal.fees_group}</p></div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                   {[{l:'Total',v:PKR(collectModal.amount),c:'text-slate-900'},{l:'Paid',v:PKR(collectModal.paid),c:'text-emerald-600'},{l:'Balance',v:PKR(Number(collectModal.amount)+Number(collectModal.fine||0)-Number(collectModal.paid||0)-Number(collectModal.discount||0)),c:'text-rose-600'}].map(({l,v,c})=>(
                     <div key={l} className="bg-slate-50 p-3 rounded-2xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">{l}</p><p className={cn('text-xs font-black',c)}>{v}</p></div>
                   ))}
                </div>

                <div className="space-y-4">
                  <Field label="Amount to Collect">
                    <input type="number" value={feePayForm.amount} onChange={e=>setFeePayForm({...feePayForm,amount:e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all font-mono" placeholder="0.00" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Payment Method">
                      <select value={feePayForm.method} onChange={e=>setFeePayForm({...feePayForm,method:e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all bg-white font-black">
                        {['Cash','Bank Transfer','Cheque','Online'].map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Receipt # (Optional)">
                      <input value={feePayForm.receipt} onChange={e=>setFeePayForm({...feePayForm,receipt:e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all uppercase placeholder:normal-case font-mono" placeholder="REC-123" />
                    </Field>
                  </div>
                  <Field label="Discount (Optional)">
                    <input type="number" value={feePayForm.discount} onChange={e=>setFeePayForm({...feePayForm,discount:e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all font-mono" placeholder="0.00" />
                  </Field>

                  <motion.button whileTap={{scale:0.97}} onClick={collectFee} disabled={saving}
                    className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2" style={{background:'linear-gradient(135deg,#059669,#10b981)'}}>
                    {saving?<Loader2 size={18} className="animate-spin" />:<><Check size={18} /> Confirm Payment</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <TutorialOverlay />
    </div>
  );
}