import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginTeacher, loginStudent, loginAdmin, supabase } from '../services/supabase';

interface LandingPageProps {
  onLoginSuccess: (role: 'admin' | 'teacher' | 'student' | 'parent', userData?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const teacher = await loginTeacher(username, password);
      if (teacher) { onLoginSuccess('teacher', teacher); return; }

      const student = await loginStudent(username, password);
      if (student) { onLoginSuccess('student', student); return; }

      const admin = await loginAdmin(username, password);
      if (admin) { onLoginSuccess('admin', admin); return; }

      const { data: parentData } = await supabase
        .from('students').select('*')
        .eq('parent_username', username).eq('parent_password', password).single();
      if (parentData) { onLoginSuccess('parent', parentData); return; }

      setError('Invalid username or password. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative bg-cover bg-center"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop")',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for depth and readability */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full bg-blue-500/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full rounded-full bg-orange-500/10 blur-[120px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]"
            >
              <div className="text-[#1a2fa8] font-black text-4xl tracking-tighter">PIC</div>
            </motion.div>
            {/* Pulse rings */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-white/30"
            />
          </div>

          <div className="text-center space-y-1">
            <motion.h1 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white font-bold text-3xl tracking-tight"
            >
              Pak Informatics
            </motion.h1>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#f5a623] font-bold text-2xl tracking-tight"
            >
              Group of Colleges
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5 }}
              className="text-white text-[10px] font-bold uppercase tracking-[6px] mt-2"
            >
              Campus Portal
            </motion.p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full rounded-[2.5rem] border border-white/20 p-10 overflow-hidden relative"
          style={{ 
            background: 'rgba(255, 255, 255, 0.12)', 
            backdropFilter: 'blur(30px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/60 uppercase tracking-[4px] ml-1">Username</label>
              <motion.div whileFocus={{ scale: 1.01 }}>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username" required autoComplete="username"
                  className="w-full rounded-2xl py-4 px-6 text-white text-sm placeholder:text-white/20 outline-none transition-all border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                />
              </motion.div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/60 uppercase tracking-[4px] ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required autoComplete="current-password"
                  className="w-full rounded-2xl py-4 px-6 pr-14 text-white text-sm placeholder:text-white/20 outline-none transition-all border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.background = 'rgba(255,255,255,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl px-4 py-3 border border-rose-500/30 bg-rose-500/10">
                    <p className="text-rose-200 text-xs font-medium text-center">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02, backgroundColor: '#1e3799' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-[1.5rem] font-black text-white text-sm uppercase tracking-[6px] flex items-center justify-center gap-3 transition-all shadow-xl"
              style={{
                background: loading ? 'rgba(255,255,255,0.1)' : '#1a2fa8',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : 'Sign In'}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-white text-[11px] font-black uppercase tracking-[5px]">
            Prosperity <span className="mx-2 text-white/30">•</span> Integrity <span className="mx-2 text-white/30">•</span> Captivating
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};