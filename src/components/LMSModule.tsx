import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, FileText, Calendar, Video, Plus, Send,
  Download, Upload, Clock, CheckCircle2, ChevronRight, VideoIcon,
  BookOpen, Info, Search, Paperclip, MoreVertical, Layout, Trash2, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  supabase, LMPost, LMMeeting, LMAssignment, LMSubmission,
  getLMSPosts, createLMSPost, getLMMeetings, scheduleMeeting,
  getLMAssignments, submitAssignment, getSubmissions,Teacher, Student
} from '../services/supabase';
import toast from 'react-hot-toast';

interface LMSModuleProps {
  user: {
    id: number | string;
    full_name: string;
    role: 'TEACHER' | 'STUDENT';
    class_section: string;
    subject?: string;
  };
  onClose?: () => void;
}

export const LMSModule: React.FC<LMSModuleProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'files' | 'assignments' | 'meetings'>('posts');
  const [posts, setPosts] = useState<LMPost[]>([]);
  const [meetings, setMeetings] = useState<LMMeeting[]>([]);
  const [assignments, setAssignments] = useState<LMAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Post state
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'ANNOUNCEMENT' | 'DISCUSSION'>('DISCUSSION');
  
  // Schedule Meeting state
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('60');

  // Assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');
  const [assignMarks, setAssignMarks] = useState('100');

  useEffect(() => {
    loadData();
  }, [user.class_section]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, m, a] = await Promise.all([
        getLMSPosts(user.class_section, user.subject),
        getLMMeetings(user.class_section),
        getLMAssignments(user.class_section, user.subject)
      ]);
      setPosts(p);
      setMeetings(m);
      setAssignments(a);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try {
      const post = await createLMSPost({
        class_section: user.class_section,
        subject: user.subject || 'General',
        author_id: user.id,
        author_name: user.full_name,
        author_role: user.role as any,
        content: newPost,
        type: postType
      });
      setPosts([post, ...posts]);
      setNewPost('');
      toast.success('Post shared with class');
    } catch (err) {
      toast.error('Failed to create post');
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle || !meetingTime) return;
    try {
      // Generate unique meeting link (Jitsi)
      const roomName = `${user.class_section}-${user.subject || 'General'}-${Date.now()}`.replace(/\s+/g, '-');
      const link = `https://meet.jit.si/${roomName}`;
      
      const meeting = await scheduleMeeting({
        class_section: user.class_section,
        subject: user.subject || 'General',
        title: meetingTitle,
        meeting_link: link,
        start_time: meetingTime,
        end_time: new Date(new Date(meetingTime).getTime() + Number(meetingDuration) * 60000).toISOString(),
        teacher_id: Number(user.id),
        status: 'SCHEDULED'
      });
      
      setMeetings([...meetings, meeting]);
      setMeetingTitle('');
      setMeetingTime('');
      toast.success('Online class scheduled!');
    } catch (err) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignTitle || !assignDue) return;
    try {
      const { data, error } = await supabase.from('lms_assignments').insert([{
        class_section: user.class_section,
        subject: user.subject || 'General',
        title: assignTitle,
        description: assignDesc,
        due_date: assignDue,
        total_marks: Number(assignMarks),
        teacher_id: Number(user.id)
      }]).select().single();
      
      if (error) throw error;
      setAssignments([data, ...assignments]);
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      toast.success('Assignment posted');
    } catch (err) {
      toast.error('Failed to post assignment');
    }
  };

  const joinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#2D3494] text-white flex items-center justify-center shadow-lg">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">{user.class_section} - {user.subject || 'Class Hub'}</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Learning Group</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 bg-white border-b border-slate-200">
        {[
          { id: 'posts', label: 'Posts', icon: MessageSquare },
          { id: 'files', label: 'Files', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'meetings', label: 'Meetings', icon: Video }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2",
              activeTab === t.id 
                ? "border-[#2D3494] text-[#2D3494]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
              {/* Post Creation */}
              {user.role === 'TEACHER' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setPostType('DISCUSSION')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", postType === 'DISCUSSION' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400")}
                    >Discussion</button>
                    <button 
                      onClick={() => setPostType('ANNOUNCEMENT')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", postType === 'ANNOUNCEMENT' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400")}
                    >Announcement</button>
                  </div>
                  <div className="relative">
                    <textarea 
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      placeholder={postType === 'ANNOUNCEMENT' ? "Share an important announcement..." : "Start a discussion with the class..."}
                      className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all resize-none min-h-[100px]"
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                       <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={18} /></button>
                       <button 
                        onClick={handleCreatePost}
                        disabled={!newPost.trim()}
                        className="bg-[#2D3494] text-white p-2.5 rounded-xl shadow-lg disabled:opacity-50 hover:scale-105 transition-all"
                       >
                         <Send size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed */}
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                        {post.author_name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{post.author_name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{post.author_role} · {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {post.type === 'ANNOUNCEMENT' && (
                      <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                        <Info size={10} /> Announcement
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-4">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <MessageSquare size={14} /> 0 Comments
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-slate-900 font-black">No posts yet</h3>
                  <p className="text-slate-400 text-xs">Start a conversation with your students or peers.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'meetings' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* Schedule Form */}
              {user.role === 'TEACHER' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 max-w-2xl">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Video size={16} className="text-blue-600" /> Schedule Online Class
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Meeting Title</label>
                      <input 
                        value={meetingTitle}
                        onChange={e => setMeetingTitle(e.target.value)}
                        placeholder="e.g. Quantum Mechanics - Lecture 1"
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start Date & Time</label>
                      <input 
                        type="datetime-local"
                        value={meetingTime}
                        onChange={e => setMeetingTime(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Duration (Minutes)</label>
                      <select 
                        value={meetingDuration}
                        onChange={e => setMeetingDuration(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                        <option value="90">1.5 Hours</option>
                        <option value="120">2 Hours</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={handleScheduleMeeting}
                    disabled={!meetingTitle || !meetingTime}
                    className="mt-6 w-full py-4 bg-[#2D3494] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >Schedule Meeting</button>
                </div>
              )}

              {/* Meetings List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map(m => (
                  <div key={m.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                          <Video size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{m.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{m.subject}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        m.status === 'LIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(m.start_time).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1.5"><Clock size={14} /> {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button 
                      onClick={() => joinMeeting(m.meeting_link)}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                    >
                      <VideoIcon size={16} /> Join Live Class
                    </button>
                  </div>
                ))}
                {meetings.length === 0 && !loading && (
                   <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                     <p className="text-slate-400 font-bold">No online classes scheduled</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {user.role === 'TEACHER' && (
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                   <div>
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Assignments</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">Manage class tasks and homework</p>
                   </div>
                   <button 
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 bg-[#2D3494] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                   >
                     <Plus size={16} /> Create Task
                   </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {assignments.map(a => (
                  <div key={a.id} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 flex flex-col hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                       <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                         <FileText size={24} />
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                         <p className="text-xs font-black text-rose-500">{new Date(a.due_date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2 truncate">{a.title}</h4>
                    <p className="text-xs font-bold text-slate-400 mb-6 line-clamp-2">{a.description}</p>
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Points</p>
                          <p className="text-sm font-black text-slate-700">{a.total_marks}</p>
                        </div>
                         <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Subject</p>
                          <p className="text-sm font-black text-slate-700">{a.subject}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toast.success('Submission portal opening...')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                      >
                        {user.role === 'TEACHER' ? 'View Submissions' : 'Submit Work'}
                      </button>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && !loading && (
                   <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                     <p className="text-slate-400 font-bold">No assignments posted</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {/* Quick Filters */}
                 <div className="lg:col-span-1 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase px-4 mb-2">Folders</p>
                    {['Lectures', 'Notes', 'Syllabus', 'Readings', 'Shared'].map(f => (
                      <button key={f} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                        <div className="flex items-center gap-2"><Layout size={16} /> {f}</div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    ))}
                 </div>

                 {/* Files List */}
                 <div className="lg:col-span-3 space-y-4">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search class documents..." />
                      </div>
                      {user.role === 'TEACHER' && (
                        <button className="flex items-center gap-2 bg-[#2D3494] text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                          <Upload size={16} /> Upload
                        </button>
                      )}
                   </div>

                   <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-slate-50/50">
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</th>
                           <th className="px-6 py-4"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {[
                           { name: 'Semester Syllabus 2026.pdf', date: '2026-05-01', size: '1.2 MB' },
                           { name: 'Unit 1 - Foundations.docx', date: '2026-05-05', size: '450 KB' },
                           { name: 'Weekly Planner - May.pdf', date: '2026-05-10', size: '890 KB' }
                         ].map((item, i) => (
                           <tr key={i} className="hover:bg-slate-50/50 group cursor-pointer transition-colors">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={18} /></div>
                                 <span className="text-sm font-black text-slate-800">{item.name}</span>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.date}</td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.size}</td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download size={16} /></button>
                                 <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={16} /></button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     <div className="p-8 text-center text-slate-300">
                        <Layout size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest">End of file list</p>
                     </div>
                   </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-black text-slate-800">New Assignment</h3>
               <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1 mb-1 block">Title</label>
                 <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="Enter task title" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all" />
               </div>
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1 mb-1 block">Description</label>
                 <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)} rows={3} placeholder="Instructions for students..." className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all resize-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase px-1 mb-1 block">Due Date</label>
                   <input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase px-1 mb-1 block">Total Marks</label>
                   <input type="number" value={assignMarks} onChange={e => setAssignMarks(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all" />
                 </div>
               </div>
            </div>
            <div className="mt-8 flex gap-3">
               <button onClick={() => setShowAssignModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
               <button onClick={handleCreateAssignment} className="flex-[2] py-4 bg-[#2D3494] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Create Assignment</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
