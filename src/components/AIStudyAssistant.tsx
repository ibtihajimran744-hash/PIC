import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, FileText, Send, Upload, Trash2, Search, 
  MessageSquare, Loader2, Link as LinkIcon, Plus, X,
  ChevronRight, Bookmark, Sparkles, Book
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { aiService } from '../services/aiService';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface AIStudyAssistantProps {
  userRole: 'Student' | 'Teacher' | 'Admin';
  userName: string;
  courseFilter?: string; // If student, filter by their enrolled course
}

export const AIStudyAssistant: React.FC<AIStudyAssistantProps> = ({ userRole, userName, courseFilter }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(courseFilter || 'All');
  
  // Chat state
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, sources?: string[]}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    course: '',
    subject: '',
    semester: '1st',
    file: null as File | null
  });

  const COURSES = ['ICS Physics', 'ICS Statistics', 'Pre-Medical', 'Pre-Engineering', 'FA IT', 'BS Computer Science', 'BS English'];

  useEffect(() => {
    fetchDocuments();
  }, [selectedCourse]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    setLoading(true);
    let query = supabase.from('ai_documents').select('*');
    if (selectedCourse !== 'All') {
      query = query.eq('course_id', selectedCourse);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) setDocuments(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.course || !uploadForm.subject) {
      toast.error("Please fill all fields");
      return;
    }

    setIsUploading(true);
    try {
      await aiService.processAndSaveDocument(
        uploadForm.file,
        uploadForm.course,
        uploadForm.subject,
        uploadForm.semester,
        userName
      );
      toast.success("Document processed and added to library!");
      setShowUpload(false);
      fetchDocuments();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to process document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userQuery = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userQuery }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Use the first course from documents or the filter for context
      const contextCourse = selectedCourse === 'All' ? documents[0]?.course_id : selectedCourse;
      
      const response = await aiService.getChatAssistantResponse(
        userQuery,
        contextCourse || '',
        messages
      );

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: response.text,
        sources: response.sources 
      }]);
    } catch (error: any) {
      toast.error("AI Assistant is currently unavailable");
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      {/* LEFT PANEL: Document Library */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" />
              Library
            </h3>
            {userRole !== 'Student' && (
              <button 
                onClick={() => setShowUpload(true)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
          >
            <option value="All">All Courses</option>
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : documents.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-10">No documents found for this course.</p>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="group p-3 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{doc.subject} · {doc.semester}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN PANEL: Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Study Assistant</h3>
              <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Knowledge Base
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                <MessageSquare size={32} />
              </div>
              <h4 className="font-black text-slate-800">Ask your materials anything</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                I'm your AI tutor. I can summarize lectures, generate quizzes, or explain complex topics using only your uploaded course materials.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full pt-4">
                {["Summarize the latest lecture", "Generate a 5-question quiz", "Explain the core concepts"].map(s => (
                  <button key={s} onClick={() => setInput(s)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all">
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-4', m.role === 'user' ? 'flex-row-reverse' : '')}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm', m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white')}>
                  {m.role === 'user' ? userName[0] : <Sparkles size={14} />}
                </div>
                <div className={cn('max-w-[80%] space-y-2', m.role === 'user' ? 'items-end' : '')}>
                  <div className={cn('p-4 rounded-2xl shadow-sm text-sm leading-relaxed', m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-800')}>
                    {m.content}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(m.sources)).map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black border border-blue-100">
                          <Bookmark size={8} /> {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0"><Sparkles size={14} /></div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching library...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
             <div className="flex-1 relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about your course materials..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all pr-12 shadow-inner"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isUploading && setShowUpload(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl z-10 border border-slate-100">
               <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-black text-slate-900 text-xl">Upload Material</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Add to AI Knowledge Base</p>
                    </div>
                    <button onClick={() => !isUploading && setShowUpload(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select Course</label>
                      <select 
                        required
                        value={uploadForm.course} 
                        onChange={(e) => setUploadForm({...uploadForm, course: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                      >
                        <option value="">Select Course...</option>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                        <input 
                          required
                          value={uploadForm.subject}
                          onChange={(e) => setUploadForm({...uploadForm, subject: e.target.value})}
                          placeholder="e.g. Physics" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-inner outline-none focus:border-blue-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Semester</label>
                        <select 
                          value={uploadForm.semester}
                          onChange={(e) => setUploadForm({...uploadForm, semester: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                        >
                          {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => <option key={s} value={s}>{s} Sem</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Upload PDF</label>
                       <div className="relative group">
                          <input 
                            type="file" 
                            accept=".pdf"
                            onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                            className="hidden" 
                            id="pdf-upload"
                          />
                          <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all cursor-pointer">
                             {uploadForm.file ? (
                               <div className="text-center">
                                  <FileText className="mx-auto text-blue-600 mb-2" size={32} />
                                  <p className="text-xs font-black text-slate-800">{uploadForm.file.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Ready to process</p>
                               </div>
                             ) : (
                               <div className="text-center">
                                  <Upload className="mx-auto text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" size={32} />
                                  <p className="text-xs font-bold text-slate-500">Pick a PDF document</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Maximum 10MB</p>
                               </div>
                             )}
                          </label>
                       </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isUploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Processing Chunks...</>
                      ) : (
                        <><Sparkles size={18} /> Add to Knowledge Base</>
                      )}
                    </button>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
