import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Volume2, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles,
  BookOpen,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

const SYSTEM_PROMPT = `You are an AI Academic Assistant for Pak Informatics Group of Colleges (PIC). 
You must ONLY answer questions regarding studies, academics, college life, and educational topics. 
If a user asks about anything else, politely refuse and remind them of your academic purpose.
You can chat in both English and Urdu. When chatting in Urdu, ensure the grammar is natural.
Keep your responses clean and professional. 
DO NOT use bold text (**) too often as it can be confusing for reading long passages. Only use it for very important terms.
Avoid messy formatting. 
If the user explicitly asks to generate an image related to their studies, you should confirm you are generating it.`;

export const EduChatAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const speak = (text: string, id: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[#*`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Better voice selection
    const preferredVoices = [
      'Google US English', 
      'Google UK English Female',
      'Microsoft Aria Online (Natural)', 
      'Microsoft Jenny Online (Natural)',
      'en-US-Standard-C', 
      'en-US-Neural2-F'
    ];
    
    const urduPattern = /[\u0600-\u06FF]/;
    const isUrdu = urduPattern.test(text);
    
    if (isUrdu) {
      utterance.lang = 'ur-PK';
      const urVoice = voices.find(v => v.lang.startsWith('ur'));
      if (urVoice) utterance.voice = urVoice;
    } else {
      let bestVoice = voices.find(v => preferredVoices.some(p => v.name === p));
      if (!bestVoice) {
        bestVoice = voices.find(v => preferredVoices.some(p => v.name.includes(p)));
      }
      if (bestVoice) utterance.voice = bestVoice;
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    
    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = "I'm sorry, the AI assistant is currently disabled due to configuration issues. Please contact support for more information.";
      const generatedImage: string | undefined = undefined;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        image: generatedImage,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('AI assistant is currently busy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white overflow-hidden relative">
      {/* Background decoration inspired by Gemini */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 blur-[120px]" />
      </div>

      <header className="px-6 py-4 flex items-center border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none">EduChatAI</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Academic Assistant
            </p>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth z-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 mb-2">
              <GraduationCap size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">What do you want to learn today?</h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Ask me anything about your studies, exams, or homework in English or Urdu!
            </p>
            <div className="grid grid-cols-1 gap-2 w-full mt-4">
              {[
                "Exams ki tayari kaise karein?",
                "Explain the laws of thermodynamics.",
                "How to write a perfect essay?",
                "Solve this math equation: 2x + 5 = 15"
              ].map(q => (
                <button 
                  key={q}
                  onClick={() => { setInput(q); handleSend(); }}
                  className="p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 text-slate-600 text-[11px] font-bold transition-colors flex items-center justify-between group"
                >
                  {q}
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex group",
                    m.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] space-y-2",
                    m.role === 'user' ? "flex flex-col items-end" : "flex flex-col items-start"
                  )}>
                    <div className={cn(
                      "px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-slate-900 text-white rounded-tr-sm" 
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                    )}>
                      {m.image ? (
                        <div className="space-y-3">
                          <img 
                            src={m.image} 
                            alt="Generated" 
                            className="rounded-2xl max-w-full h-auto shadow-md border border-slate-100" 
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[10px] font-bold text-slate-400 italic">Generated based on: {m.content}</p>
                        </div>
                      ) : (
                        <div className="markdown-body prose prose-slate max-w-none prose-sm">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      )}
                    </div>
                    
                    {m.role === 'assistant' && !m.image && (
                      <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => speak(m.content, m.id)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isSpeaking === m.id ? "bg-blue-600 text-white scale-110" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          )}
                          title={isSpeaking === m.id ? "Stop playback" : "Listen to response"}
                        >
                          {isSpeaking === m.id ? (
                            <div className="flex items-center gap-0.5 h-3">
                              {[1,2,3].map(bit => (
                                <motion.div 
                                  key={bit}
                                  animate={{ height: ['40%', '100%', '40%'] }} 
                                  transition={{ repeat: Infinity, duration: 0.6, delay: bit * 0.1 }}
                                  className="w-0.5 bg-white" 
                                />
                              ))}
                            </div>
                          ) : <Volume2 size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start pl-2"
              >
                <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center gap-3 border border-slate-100">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EduChat is thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md border-t border-slate-50 z-10">
        <div className="max-w-3xl mx-auto flex gap-3 items-center">
          <div className="flex-1 relative group">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask for help with studies..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:bg-slate-100 rounded-[2.5rem] py-4 pl-6 pr-14 text-sm font-medium outline-none transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-md active:scale-95"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          {!isLoading && (
            <button
              onClick={() => {
                if (!input.trim()) { toast.error('Enter a prompt for image generation'); return; }
                handleSend(); // The handleSend already has image logic
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 text-white flex items-center justify-center shadow-lg hover:shadow-orange-200 transition-all active:scale-95 group shrink-0"
              title="Generate studied-related image"
            >
              <ImageIcon size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>
        <p className="text-[9px] text-slate-400 text-center mt-3 font-bold uppercase tracking-widest opacity-60">
          Powered by Gemini • Academic Accuracy matters
        </p>
      </div>
    </div>
  );
};
