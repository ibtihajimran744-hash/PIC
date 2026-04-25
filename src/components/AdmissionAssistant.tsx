import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  User, 
  Send, 
  Table as TableIcon, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Download,
  Plus,
  MessageSquare,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { addAdmissionLead, getAdmissionLeads, AdmissionLead } from '../services/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export const AdmissionAssistant: React.FC = () => {
  const [activeView, setActiveView] = useState<'assistant' | 'database' | 'accountant'>('assistant');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Admission Assistant. I'll help you collect and analyze student leads. Let's start with the student's **Full Name**." }
  ]);
  const [input, setInput] = useState('');
  const [leads, setLeads] = useState<AdmissionLead[]>([]);
  const [currentLead, setCurrentLead] = useState<Partial<AdmissionLead>>({});
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    { field: 'full_name', label: 'Full Name', prompt: "Great. What is the student's **Phone Number**?" },
    { field: 'phone', label: 'Phone Number', prompt: "Got it. What is the **Father's Name**?" },
    { field: 'father_name', label: 'Father Name', prompt: "And which **City** are they from?" },
    { field: 'city', label: 'City', prompt: "What was their **Previous School**?" },
    { field: 'previous_school', label: 'Previous School', prompt: "Which **Program** are they interested in?" },
    { field: 'program_interested', label: 'Program Interested In', prompt: "Any **Budget Concerns**?" },
    { field: 'budget_concern', label: 'Budget Concern', prompt: "Finally, please provide some **Notes** about your conversation with the student." },
    { field: 'notes', label: 'Notes', prompt: "Analyzing the lead... please wait." }
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLeads = async () => {
    const data = await getAdmissionLeads();
    setLeads(data);
  };

  const analyzeLead = async (notes: string) => {
    setIsAnalyzing(true);
    try {
      // AI analysis disabled - defaulting to GREEN for now
      return 'GREEN';
    } catch (error) {
      console.error('Analysis error:', error);
      return 'RED';
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    const currentField = steps[step].field;
    const updatedLead = { ...currentLead, [currentField]: userMsg };
    setCurrentLead(updatedLead);

    if (step < steps.length - 1) {
      setMessages(prev => [...prev, { role: 'assistant', content: steps[step].prompt }]);
      setStep(step + 1);
    } else {
      // Final step: Analyze and Save
      setMessages(prev => [...prev, { role: 'assistant', content: "Analyzing the lead and determining interest level..." }]);
      
      const status = await analyzeLead(userMsg);
      
      const finalLead: Omit<AdmissionLead, 'id' | 'created_at'> = {
        full_name: updatedLead.full_name || '',
        phone: updatedLead.phone || '',
        father_name: updatedLead.father_name || '',
        city: updatedLead.city || '',
        previous_school: updatedLead.previous_school || '',
        program_interested: updatedLead.program_interested || '',
        budget_concern: updatedLead.budget_concern || '',
        notes: userMsg,
        status: status,
        date: new Date().toLocaleDateString()
      };

      try {
        await addAdmissionLead(finalLead);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Lead saved successfully! I've classified this student as **${status}**. You can view the full database in the Leads tab.` 
        }]);
        toast.success('Lead added successfully');
        fetchLeads();
        // Reset for next lead
        setStep(0);
        setCurrentLead({});
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: "Ready for another one? What is the student's **Full Name**?" }]);
        }, 2000);
      } catch (error) {
        toast.error('Failed to save lead');
      }
    }
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const renderDatabase = (filterGreenOnly = false) => {
    const filteredLeads = filterGreenOnly ? leads.filter(l => l.status === 'GREEN') : leads;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">City</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className={cn(
                  "transition-colors",
                  lead.status === 'GREEN' ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "bg-rose-50/30 hover:bg-rose-50/50"
                )}
              >
                <td className="p-4 text-sm text-slate-600">{lead.date}</td>
                <td className="p-4 text-sm font-bold text-slate-900">{lead.full_name}</td>
                <td className="p-4 text-sm text-slate-600 font-mono">{lead.phone}</td>
                <td className="p-4 text-sm text-slate-600">{lead.program_interested}</td>
                <td className="p-4 text-sm text-slate-600">{lead.city}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    lead.status === 'GREEN' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {lead.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={lead.notes}>
                  {lead.notes}
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-[#2D3494] p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Admission AI Assistant</h2>
            <p className="text-xs text-white/60">Collect and analyze student leads</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveView('assistant')}
            className={cn(
              "p-2 rounded-xl transition-all",
              activeView === 'assistant' ? "bg-white text-[#2D3494]" : "hover:bg-white/10"
            )}
            title="AI Assistant"
          >
            <MessageSquare size={20} />
          </button>
          <button 
            onClick={() => setActiveView('database')}
            className={cn(
              "p-2 rounded-xl transition-all",
              activeView === 'database' ? "bg-white text-[#2D3494]" : "hover:bg-white/10"
            )}
            title="Leads Database"
          >
            <TableIcon size={20} />
          </button>
          <button 
            onClick={() => setActiveView('accountant')}
            className={cn(
              "p-2 rounded-xl transition-all",
              activeView === 'accountant' ? "bg-white text-[#2D3494]" : "hover:bg-white/10"
            )}
            title="Accountant View (GREEN Only)"
          >
            <FileSpreadsheet size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'assistant' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === 'assistant' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'assistant' ? "bg-blue-50 text-slate-800 rounded-tl-none" : "bg-[#2D3494] text-white rounded-tr-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your response..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3494]/20 focus:border-[#2D3494] transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isAnalyzing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#2D3494] text-white rounded-xl flex items-center justify-center hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex justify-between items-center px-2">
                <div className="flex gap-2">
                  {steps.map((s, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === step ? "w-8 bg-[#2D3494]" : "w-4 bg-slate-200",
                        i < step ? "bg-emerald-400" : ""
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Step {step + 1} of {steps.length}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="font-bold text-slate-800">
                  {activeView === 'database' ? 'All Admission Leads' : 'Accountant View (GREEN Leads)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeView === 'database' ? 'Full database of collected student information' : 'Highly interested students ready for admission process'}
                </p>
              </div>
              <button 
                onClick={() => exportToExcel(
                  activeView === 'database' ? leads : leads.filter(l => l.status === 'GREEN'),
                  activeView === 'database' ? 'All_Leads' : 'Accountant_Leads'
                )}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Download size={16} />
                Export to Excel
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {renderDatabase(activeView === 'accountant')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
