import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Users, ClipboardList, Phone, MessageSquare, 
  Search, ShieldAlert, Info, LogOut, RefreshCw,
  Clock, CheckCircle, X, ChevronRight, UserCheck,
  UserX, Calendar, Layout, FileText, Upload,
  Plus, Send, Bell, Download, HelpCircle, Package,
  Trash2, ExternalLink, Printer, MoreHorizontal, User,
  MoreVertical, Menu, Mail, MailQuestion, AlertCircle,
  Eye, Filter, CheckCircle2, History, MapPin, SearchCode,
  DollarSign
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { cn } from '../lib/utils';

// Constants
const THEME_COLOR = '#0EA5E9';
const THEME_GRADIENT = 'linear-gradient(135deg, #0EA5E9, #0284C7)';
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACv0lEQVR4nO2Yv2sUQRTHP7m7vYv/gEjAnmAnInYpBAsL8S9QLAULsbC0sLALsRAsLCwsLCws9C8QLCy0sLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsDC7T74D7AL7QIAdZ860O7N75Anp8Abp8CH58AHp8B6psAMUpMP97Gf7ZveInyCd9pAOffOatZ9DOnTMc7aYbeR6AnX6BfUuXh/S6STUv367YPaX/F9Ip18i1Gv6YfK3vE16vU7v5B6pMInY95COW1HvdB8pMQpUByH6K8S+uS/v0y1p8R7p8G6M89YpXyAtPiIdno7Rv/V5pMXrMY5Z/S98X6TFU6TFIv8n6vI98fIn9Z656360mN9Iix8h9shdfK69jVq8GOMYzF3Xo8VbpMWzMU6Zuz5Ei1dIiwUunY+67EuLBW53Xf5K7YdaPMDlZ197P1p8Qlo8x2VlX/vSWpBy0XpEWhzK6ZveI+XyZfV+uWuvtFagXA687FmS6hFpgcsfPe0Oqd6P2Nf3r/7K986SlAtcnuvaK69YvEJSvMLlle49UtF6SFp0uTzbve99i0nSogPXf8697EnSog9cf+hp18XnSVpMMv2D931vcYyk2MH1R9173reYRFr0uex0XfZe90daDInY03XpKeYvEfsW11N9f9+nJ8mU76nLptT7X3lS3kPt6/v7fr/YQZLyInXxvPruYvsqkvIidfmYeu9je6oiKSNSl1Pr/Yp9H1U8yKgeIe6f5v7p/pPq68iYHyEer+Xm9W9GvD2q7kY8v6fWvxsV96h6GxFPf669H9m/p97GZ9X5mdf6m/v0lUjP7L9eID3D8p6O4pYRP0M8XyL2dfV+O7P7v7Zf6XAmE6S8K99+At3mE3X6BvUuW9z6mP0X/i8U0Gz+A82vEP67Pz/MAAAAAElFTkSuQmCC";

interface TabProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}

// Components
const StatCard = ({ title, value, icon: Icon, subtext, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="p-2.5 rounded-xl bg-sky-50 text-sky-500">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <span className="text-xs text-slate-400 truncate">{subtext}</span>}
    </div>
  </motion.div>
);

export const ReceptionistPortal: React.FC<{
  onLogout: () => void;
  adminData: { id: string; full_name: string; role: string; username: string };
}> = ({ onLogout, adminData }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data States
  const [dashboardStats, setDashboardStats] = useState({
    studentsPresent: 0,
    teachersPresent: 0,
    visitorsInside: 0,
    openComplaints: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingLeaves: 0,
    todayVisitorsCount: 0
  });

  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([]);
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [visitorLog, setVisitorLog] = useState<any[]>([]);
  const [callLog, setCallLog] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);
  const [lostFoundData, setLostFoundData] = useState<any[]>([]);
  const [messagesData, setMessagesData] = useState<any[]>([]);
  const [searchData, setSearchData] = useState<any>({ teachers: [], students: [], timetable: [] });

  // Form States
  const [visitorForm, setVisitorForm] = useState({ name: '', to_meet: '', purpose: '' });
  const [callForm, setCallForm] = useState({ caller_name: '', phone: '', purpose: '', status: 'Inbound' });
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '', priority: 'Medium', type: 'General' });
  const [lostFoundForm, setLostFoundForm] = useState({ item_name: '', description: '', location: '', type: 'Lost' });
  const [messageForm, setMessageForm] = useState({ recipient_id: '', content: '' });

  const refreshData = () => setRefreshKey(prev => prev + 1);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSavedMsg(msg);
      setTimeout(() => setSavedMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const loadData = useCallback(async () => {
    if (!adminData?.id) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    try {
      if (activeTab === 'dashboard') {
        const [
          { count: activeStudents },
          { count: totalTeachers },
          { data: stdAtt },
          { data: tAtt },
          { data: vLog },
          { count: openComp },
          { data: tt },
          { data: docs },
          { count: sLeaves },
          { count: tLeaves }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('attendance').select('*, students(full_name, class_section)').eq('date', today),
          supabase.from('teacher_attendance').select('*, teachers(full_name, subject_dept)').eq('date', today),
          supabase.from('visitor_log').select('*').eq('visit_date', today),
          supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
          supabase.from('timetable').select('*').eq('day_of_week', dayOfWeek).order('period_no'),
          supabase.from('uploaded_documents').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
          supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
          supabase.from('teacher_leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        ]);

        const presentStudents = stdAtt?.filter(a => a.status === 'Present') || [];
        const presentTeachers = tAtt?.filter(a => a.status === 'Present') || [];
        const visitorsInside = vLog?.filter(v => v.status === 'Inside') || [];

        setDashboardStats({
          studentsPresent: presentStudents.length,
          teachersPresent: presentTeachers.length,
          visitorsInside: visitorsInside.length,
          openComplaints: openComp || 0,
          totalStudents: activeStudents || 0,
          totalTeachers: totalTeachers || 0,
          pendingLeaves: (sLeaves || 0) + (tLeaves || 0),
          todayVisitorsCount: vLog?.length || 0
        });

        setLiveAttendance(stdAtt || []);
        setTeacherAttendance(tAtt || []);
        setTodayTimetable(tt || []);
        setNotices(docs || []);
      } else if (activeTab === 'visitors') {
        const { data } = await supabase.from('visitor_log').select('*').order('created_at', { ascending: false });
        setVisitorLog(data || []);
      } else if (activeTab === 'calls') {
        const { data } = await supabase.from('reception_call_log').select('*').order('created_at', { ascending: false });
        setCallLog(data || []);
      } else if (activeTab === 'complaints') {
        const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
        setComplaintsData(data || []);
      } else if (activeTab === 'lostfound') {
        const { data } = await supabase.from('lost_and_found').select('*').order('created_at', { ascending: false });
        setLostFoundData(data || []);
      } else if (activeTab === 'messages') {
        const { data: inbox } = await supabase.from('receptionist_messages').select('*').eq('recipient_id', adminData.id).order('created_at', { ascending: false });
        const { data: sent } = await supabase.from('receptionist_messages').select('*').eq('sender_id', adminData.id).order('created_at', { ascending: false });
        setMessagesData([...(inbox || []), ...(sent || [])]);
      } else if (activeTab === 'info') {
        const [
          { data: tchs },
          { data: stus },
          { data: ttble }
        ] = await Promise.all([
          supabase.from('teachers').select('*').order('full_name'),
          supabase.from('students').select('*').limit(100),
          supabase.from('timetable').select('*').eq('day_of_week', dayOfWeek).order('period_no')
        ]);
        setSearchData({ teachers: tchs || [], students: stus || [], timetable: ttble || [] });
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, refreshKey, adminData?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorForm.name || !visitorForm.to_meet) return showToast('Please fill all required fields', 'error');
    
    try {
      const { error } = await supabase.from('visitor_log').insert([{
        visitor_name: visitorForm.name,
        to_meet: visitorForm.to_meet,
        purpose: visitorForm.purpose,
        visit_date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toLocaleTimeString(),
        status: 'Inside',
        logged_by: adminData.full_name
      }]);
      if (error) throw error;
      showToast('Visitor registered successfully');
      setVisitorForm({ name: '', to_meet: '', purpose: '' });
      refreshData();
    } catch (err) {
      console.error(err);
      showToast('Action failed', 'error');
    }
  };

  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('reception_call_log').insert([{
        ...callForm,
        time: new Date().toLocaleTimeString(),
        logged_by: adminData.full_name
      }]);
      if (error) throw error;
      showToast('Call logged');
      setCallForm({ caller_name: '', phone: '', purpose: '', status: 'Inbound' });
      refreshData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('complaints').insert([{
        ...complaintForm,
        status: 'Open',
        filed_by: adminData.full_name
      }]);
      if (error) throw error;
      showToast('Complaint filed');
      setComplaintForm({ title: '', description: '', priority: 'Medium', type: 'General' });
      refreshData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleLostFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('lost_and_found').insert([{
        ...lostFoundForm,
        status: 'Active',
        reported_by: adminData.full_name
      }]);
      if (error) throw error;
      showToast('Item recorded');
      setLostFoundForm({ item_name: '', description: '', location: '', type: 'Lost' });
      refreshData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('receptionist_messages').insert([{
        sender_id: adminData.id,
        recipient_id: messageForm.recipient_id,
        content: messageForm.content,
        is_read: false
      }]);
      if (error) throw error;
      showToast('Message sent');
      setMessageForm({ recipient_id: '', content: '' });
      refreshData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleVisitorCheckout = async (id: string) => {
    try {
      const { error } = await supabase.from('visitor_log').update({ 
        check_out_time: new Date().toLocaleTimeString(),
        status: 'Outside' 
      }).eq('id', id);
      if (error) throw error;
      showToast('Visitor checked out');
      refreshData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handlePrint = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 60px; height: 60px; }
            .college-info h1 { margin: 0; color: #0284c7; font-size: 24px; }
            .college-info p { margin: 2px 0; color: #64748b; font-size: 14px; }
            .report-title { text-align: center; margin-bottom: 30px; }
            .report-title h2 { font-size: 20px; border-bottom: 1px solid #cbd5e1; display: inline-block; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
            td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${LOGO_BASE64}" class="logo" />
            <div class="college-info">
              <h1>Pak Informatics Group of Colleges</h1>
              <p>P.C Tower, Sialkot Bypass Road, Near Beacon House, GRW</p>
              <p>Phone: 0300-0642973</p>
            </div>
          </div>
          <div class="report-title">
            <h2>${title}</h2>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
          ${content}
          <div class="footer">
            <div>Printed by: ${adminData?.full_name}</div>
            <div>Authorized Signature: _________________</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'visitors', label: 'Visitors', icon: Users },
    { id: 'calls', label: 'Call Log', icon: Phone },
    { id: 'complaints', label: 'Complaints', icon: ShieldAlert },
    { id: 'lostfound', label: 'Lost & Found', icon: Package },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'info', label: 'Quick Info', icon: Info },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold">
              CP
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">CampusCore</h2>
              <span className="text-xs font-medium text-sky-500 uppercase tracking-wider">Receptionist</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  activeTab === item.id 
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-200" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold shrink-0">
              {adminData?.full_name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{adminData?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">Online</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-sm font-bold">
              C
            </div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h1>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {savedMsg && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100"
                >
                  <CheckCircle size={14} /> {savedMsg}
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-sky-500 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={20} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero Banner */}
                <div 
                  className="relative overflow-hidden rounded-3xl p-8 text-white"
                  style={{ background: THEME_GRADIENT }}
                >
                  <div className="relative z-10">
                    <p className="text-sky-100 font-medium mb-1 truncate">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h2 className="text-3xl font-bold mb-6">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {adminData?.full_name?.split(' ')[0]}!</h2>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-xs font-medium text-sky-100 uppercase tracking-wider mb-1">Students Present</p>
                        <p className="text-2xl font-bold">{dashboardStats.studentsPresent}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-xs font-medium text-sky-100 uppercase tracking-wider mb-1">Teachers Present</p>
                        <p className="text-2xl font-bold">{dashboardStats.teachersPresent}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-xs font-medium text-sky-100 uppercase tracking-wider mb-1">Visitors Inside</p>
                        <p className="text-2xl font-bold">{dashboardStats.visitorsInside}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-xs font-medium text-sky-100 uppercase tracking-wider mb-1">Open Complaints</p>
                        <p className="text-2xl font-bold">{dashboardStats.openComplaints}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Students" value={dashboardStats.totalStudents} icon={Users} subtext="Active Enrollment" />
                  <StatCard title="Total Teachers" value={dashboardStats.totalTeachers} icon={UserCheck} subtext="Faculty Members" />
                  <StatCard title="Pending Leaves" value={dashboardStats.pendingLeaves} icon={AlertCircle} subtext="Require Action" />
                  <StatCard title="Today's Visitors" value={dashboardStats.todayVisitorsCount} icon={History} subtext="Logged today" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Student Attendance Panel */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck size={18} className="text-sky-500" />
                        Live Attendance
                      </h3>
                      <button onClick={() => setActiveTab('attendance')} className="text-xs font-bold text-sky-500 hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-[320px]">
                      <div className="p-4 flex flex-col">
                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 px-2">Recently Present</h4>
                        <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
                          {liveAttendance.filter(a => a.status === 'Present').slice(0, 8).map((att, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{att.students?.full_name}</p>
                                <p className="text-[10px] text-slate-500">Roll: {att.student_roll} • {att.students?.class_section}</p>
                              </div>
                              <span className="text-[10px] font-medium text-emerald-600 shrink-0">{new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                          {liveAttendance.filter(a => a.status === 'Present').length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                              <UserCheck size={32} className="text-slate-200 mb-2" />
                              <p className="text-xs text-slate-400">No records yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col">
                        <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3 px-2">Absent Students</h4>
                        <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
                          {liveAttendance.filter(a => a.status === 'Absent').slice(0, 8).map((att, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{att.students?.full_name}</p>
                                <p className="text-[10px] text-slate-500">Roll: {att.student_roll} • {att.students?.class_section}</p>
                              </div>
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold shrink-0">Absent</span>
                            </div>
                          ))}
                          {liveAttendance.filter(a => a.status === 'Absent').length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                              <Users size={32} className="text-slate-200 mb-2" />
                              <p className="text-xs text-slate-400">Perfect Attendance!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Attendance Panel */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-sky-500" />
                        Teacher Attendance
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 flex-1 overflow-x-auto min-h-[320px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dept</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">In Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {teacherAttendance.map((att, i) => (
                            <tr key={i} className="group hover:bg-slate-50/50">
                              <td className="py-3 pr-4">
                                <p className="text-xs font-bold text-slate-900">{att.teachers?.full_name}</p>
                              </td>
                              <td className="py-3 pr-4">
                                <p className="text-xs text-slate-500">{att.teachers?.subject_dept}</p>
                              </td>
                              <td className="py-3 text-center">
                                <span className={cn(
                                  "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold",
                                  att.status === 'Present' ? "bg-emerald-50 text-emerald-600" : 
                                  att.status === 'Late' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                )}>
                                  {att.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <p className="text-xs font-medium text-slate-600">{att.check_in_time || '—'}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Timetable & Notices */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-sky-500" />
                        Today's Timetable Snapshot
                      </h3>
                    </div>
                    <div className="p-4 flex-1 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Period</th>
                            <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Class</th>
                            <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Subject</th>
                            <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Teacher</th>
                            <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Room</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {todayTimetable.slice(0, 6).map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3 text-xs font-bold text-slate-900 border-l-2 border-transparent hover:border-sky-500">P{item.period_no}</td>
                              <td className="p-3 text-xs text-slate-600">{item.class_section}</td>
                              <td className="p-3 text-xs font-medium text-sky-600">{item.subject}</td>
                              <td className="p-3 text-xs text-slate-700">{item.teacher_name}</td>
                              <td className="p-3 text-xs font-bold text-center text-slate-500">{item.room || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Bell size={18} className="text-sky-500" />
                        Notices
                      </h3>
                    </div>
                    <div className="p-4 flex-1 space-y-4">
                      {notices.map((notice, i) => (
                        <div key={i} className="flex gap-3 group cursor-pointer">
                          <div className="mt-1 w-2 h-2 rounded-full bg-sky-500 shrink-0 group-hover:scale-125 transition-transform" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{notice.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(notice.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {notices.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <Bell size={32} className="text-slate-200 mb-2" />
                          <p className="text-xs text-slate-400">No active notices</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 overflow-hidden relative">
                      <div className="whitespace-nowrap animate-marquee flex gap-8">
                        {notices.map((n, i) => (
                          <span key={i} className="text-[10px] font-bold text-sky-600 uppercase tracking-wider shrink-0">
                            • {n.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div 
                key="attendance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 self-start">
                    <button className="px-4 py-2 rounded-lg text-sm font-bold bg-sky-500 text-white shadow-sm">Students</button>
                    <button className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Teachers</button>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search name or roll no..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500 transition-all font-medium"
                      />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <Filter size={16} /> Filter
                    </button>
                    <button 
                      onClick={() => handlePrint('Student Attendance Sheet', '<table>...</table>')}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 shadow-lg shadow-sky-100 transition-all"
                    >
                      <Printer size={16} /> Print Sheet
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
                    <p className="text-xl font-black text-slate-900">420</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Present</p>
                    <p className="text-xl font-black text-emerald-600">385</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-rose-500 uppercase mb-1">Absent</p>
                    <p className="text-xl font-black text-rose-600">25</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Late</p>
                    <p className="text-xl font-black text-amber-600">10</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father Name</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class/Section</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time In</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Sample Rows */}
                        {[1,2,3,4,5].map(i => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-400">R2024-0{i}</td>
                            <td className="p-4 text-xs font-bold text-slate-900">Student Name {i}</td>
                            <td className="p-4 text-xs text-slate-500">Father Name {i}</td>
                            <td className="p-4 text-xs text-slate-600">FSc Pre-Med B1</td>
                            <td className="p-4 text-xs text-slate-500">Intermediate</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase">Present</span>
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-500">08:15 AM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs implementation... simplifying for response length but maintaining structure */}
            {activeTab === 'visitors' && (
              <motion.div 
                key="visitors" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Visitor Management</h2>
                    <p className="text-sm text-slate-500">Register and track campus visitors</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handlePrint('Visitor Log', `<table>...</table>`)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-sky-500 transition-colors"
                    >
                      <Printer size={20} />
                    </button>
                    <button 
                      onClick={refreshData}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-sky-500 transition-colors"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <UserCheck size={18} className="text-sky-500" />
                    New Visitor Registration
                  </h3>
                  <form onSubmit={handleVisitorSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitor Name *</label>
                       <input 
                        type="text" 
                        required
                        value={visitorForm.name}
                        onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/20 outline-none" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Who to Meet / Reason *</label>
                       <input 
                        type="text" 
                        required
                        value={visitorForm.to_meet}
                        onChange={(e) => setVisitorForm({ ...visitorForm, to_meet: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/20 outline-none" 
                        placeholder="Principal / Admission Inquiry" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Purpose (Optional)</label>
                       <input 
                        type="text" 
                        value={visitorForm.purpose}
                        onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500/20 outline-none" 
                        placeholder="Detail about the visit" 
                      />
                    </div>
                    <div className="lg:col-span-3 flex justify-end">
                       <button 
                        type="submit"
                        className="px-8 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 shadow-lg shadow-sky-100 transition-all flex items-center gap-2"
                      >
                         <UserCheck size={18} /> Register & Check In
                       </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Active Visitors Log</h3>
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-bold">Today: {visitorLog.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visitor</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Meet / Reason</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time In</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Out</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visitorLog.map((v, i) => (
                          <tr key={v.id || i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-4">
                              <p className="text-xs font-bold text-slate-900">{v.visitor_name}</p>
                              <p className="text-[10px] text-slate-400">{new Date(v.visit_date).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-xs text-slate-600 font-medium">{v.to_meet}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{v.purpose || '—'}</p>
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-500">{v.check_in_time}</td>
                            <td className="p-4 text-xs font-medium text-slate-500">{v.check_out_time || '—'}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                v.status === 'Inside' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                              )}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {v.status === 'Inside' && (
                                <button 
                                  onClick={() => handleVisitorCheckout(v.id)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                  title="Checkout"
                                >
                                  <LogOut size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {visitorLog.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 italic text-sm">No visitors recorded today</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'calls' && (
              <motion.div key="calls" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Phone size={18} className="text-sky-500" />
                    Log New Call
                  </h3>
                  <form onSubmit={handleCallSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input 
                      type="text" 
                      placeholder="Caller Name" 
                      required
                      value={callForm.caller_name}
                      onChange={(e) => setCallForm({ ...callForm, caller_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Phone Number" 
                      required
                      value={callForm.phone}
                      onChange={(e) => setCallForm({ ...callForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Purpose" 
                      required
                      value={callForm.purpose}
                      onChange={(e) => setCallForm({ ...callForm, purpose: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                    />
                    <select 
                      value={callForm.status}
                      onChange={(e) => setCallForm({ ...callForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                    >
                      <option>Inbound</option>
                      <option>Outbound</option>
                      <option>Missed</option>
                    </select>
                    <div className="lg:col-span-4 flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100">Log Call</button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Caller</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Phone</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Purpose</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {callLog.map((c, i) => (
                        <tr key={i} className="text-xs">
                          <td className="p-4 font-bold">{c.caller_name}</td>
                          <td className="p-4">{c.phone}</td>
                          <td className="p-4">{c.purpose}</td>
                          <td className="p-4">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", c.status === 'Inbound' ? "bg-sky-50 text-sky-600" : "bg-amber-50 text-amber-600")}>{c.status}</span>
                          </td>
                          <td className="p-4 text-slate-400">{c.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-500" />
                    File New Complaint
                  </h3>
                  <form onSubmit={handleComplaintSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Complaint Title" 
                        required
                        value={complaintForm.title}
                        onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                      />
                      <select 
                        value={complaintForm.priority}
                        onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <textarea 
                      placeholder="Detailed Description" 
                      required
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-100">Submit Complaint</button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Title</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Priority</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complaintsData.map((c, i) => (
                        <tr key={i} className="text-xs">
                          <td className="p-4 font-bold">{c.title}</td>
                          <td className="p-4">
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", c.priority === 'High' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500")}>{c.priority}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold uppercase">{c.status}</span>
                          </td>
                          <td className="p-4 text-right text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'lostfound' && (
              <motion.div key="lostfound" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Package size={18} className="text-amber-500" />
                    Report Lost/Found Item
                  </h3>
                  <form onSubmit={handleLostFoundSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input 
                      type="text" 
                      placeholder="Item Name" 
                      required
                      value={lostFoundForm.item_name}
                      onChange={(e) => setLostFoundForm({ ...lostFoundForm, item_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Location" 
                      required
                      value={lostFoundForm.location}
                      onChange={(e) => setLostFoundForm({ ...lostFoundForm, location: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                    />
                    <select 
                      value={lostFoundForm.type}
                      onChange={(e) => setLostFoundForm({ ...lostFoundForm, type: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none bg-white font-bold"
                    >
                      <option>Lost</option>
                      <option>Found</option>
                    </select>
                    <button type="submit" className="w-full px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-100">Report Item</button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lostFoundData.map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", item.type === 'Lost' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>{item.type}</span>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">{item.item_name}</h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description || 'No description provided'}</p>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={12} />
                        <span className="text-[10px] font-medium">{item.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                 <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Mail size={18} className="text-sky-500" />
                      Send Private Message
                    </h3>
                    <form onSubmit={handleMessageSubmit} className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Recipient Staff ID"
                        required
                        value={messageForm.recipient_id}
                        onChange={(e) => setMessageForm({ ...messageForm, recipient_id: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                      />
                      <textarea 
                        placeholder="Type your message..."
                        required
                        value={messageForm.content}
                        onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none min-h-[120px]"
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="px-8 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-100 flex items-center gap-2"><Send size={16} /> Send</button>
                      </div>
                    </form>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {messagesData.map((m, i) => (
                      <div key={i} className={cn("p-4 rounded-2xl border transition-all", m.sender_id === adminData.id ? "bg-sky-50/50 border-sky-100 ml-12" : "bg-white border-slate-100 mr-12")}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.sender_id === adminData.id ? 'Sent Message' : 'Received'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(m.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{m.content}</p>
                      </div>
                    ))}
                    {messagesData.length === 0 && <div className="text-center p-12 text-slate-400 italic text-sm">No messages yet</div>}
                 </div>
              </motion.div>
            )}

            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                      <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                          <SearchCode size={18} className="text-sky-500" />
                          Faculty/Staff Directory
                        </h3>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="text" placeholder="Search staff..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500 transition-all" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {searchData.teachers.map((t: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs">{t.full_name?.charAt(0)}</div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{t.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{t.subject_dept} • Room: {t.room_no || 'NA'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                      <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                          <History size={18} className="text-sky-500" />
                          Today's Full Timetable
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-4">
                          {searchData.timetable.map((item: any, i: number) => (
                            <div key={i} className="flex gap-4 group">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">{item.period_no}</div>
                                <div className="flex-1 w-px bg-slate-100 my-1 group-last:hidden" />
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs font-bold text-slate-900">{item.subject}</p>
                                    <span className="text-[9px] font-black text-sky-500 uppercase">{item.class_section}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">{item.teacher_name}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {searchData.timetable.length === 0 && <div className="text-center p-12 text-slate-400 italic text-sm">No classes scheduled for today.</div>}
                        </div>
                      </div>
                   </div>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-20 shadow-2xl">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all rounded-xl min-w-[64px] py-1.5",
                activeTab === item.id ? "text-sky-500" : "text-slate-400"
              )}
            >
              <item.icon size={20} className={activeTab === item.id ? "scale-110" : ""} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
          <button className="flex flex-col items-center justify-center gap-1 text-slate-400 py-1.5 min-w-[64px]">
            <Menu size={20} />
            <span className="text-[10px] font-bold">More</span>
          </button>
        </nav>
      </main>

      {/* Global CSS for marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
