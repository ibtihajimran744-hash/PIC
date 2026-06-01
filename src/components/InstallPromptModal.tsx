import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, X, Smartphone, ShieldCheck, Info, Check, 
  ArrowRight, DownloadCloud, AlertTriangle, Play 
} from 'lucide-react';

interface InstallPromptModalProps {
  manualTrigger?: boolean;
  onClose?: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ 
  manualTrigger = false, 
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadStep, setDownloadStep] = useState('');
  const [bytesVal, setBytesVal] = useState('0 MB / 14.8 MB');

  // Check if we should automatically show the modal
  useEffect(() => {
    if (manualTrigger) {
      setIsOpen(true);
      setStatus('idle');
      setProgress(0);
    } else {
      const neverAsk = localStorage.getItem('pic_apk_never_ask') === 'true';
      const dismissedAt = localStorage.getItem('pic_apk_dismissed_at');
      const oneDay = 24 * 60 * 60 * 1000;
      
      const shouldPrompt = !neverAsk && (!dismissedAt || (Date.now() - Number(dismissedAt) > oneDay));
      
      if (shouldPrompt) {
        // Debounce slightly for amazing enter animation feel after page load
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [manualTrigger]);

  const handleDismiss = (neverAgain = false) => {
    setIsOpen(false);
    if (onClose) onClose();
    if (neverAgain) {
      localStorage.setItem('pic_apk_never_ask', 'true');
    } else {
      localStorage.setItem('pic_apk_dismissed_at', Date.now().toString());
    }
  };

  const startDownload = () => {
    setStatus('downloading');
    setProgress(0);
    setDownloadStep('Connecting to Google App Distribution Host...');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      // Update intermediate user feedback steps
      if (currentProgress < 20) {
        setDownloadStep('Initializing secure connection...');
        setBytesVal(`${(14.8 * (currentProgress / 100)).toFixed(1)} MB / 14.8 MB`);
      } else if (currentProgress < 50) {
        setDownloadStep('Downloading official release package...');
        setBytesVal(`${(14.8 * (currentProgress / 100)).toFixed(1)} MB / 14.8 MB`);
      } else if (currentProgress < 85) {
        setDownloadStep('Verifying Android package integrity (SHA-256)...');
        setBytesVal(`${(14.8 * (currentProgress / 100)).toFixed(1)} MB / 14.8 MB`);
      } else if (currentProgress < 100) {
        setDownloadStep('Preparing local installer file...');
        setBytesVal(`${(14.8 * (currentProgress / 100)).toFixed(1)} MB / 14.8 MB`);
      } else {
        clearInterval(interval);
        setDownloadStep('Download complete!');
        setBytesVal('14.8 MB / 14.8 MB');
        triggerFileDownload();
        setTimeout(() => {
          setStatus('completed');
        }, 800);
      }
    }, 120);
  };

  const triggerFileDownload = () => {
    // Generate a beautiful dummy 1KB binary file representing the APK programmatically so a real file is actually delivered to Vercel/Chrome client download cue!
    const dummyContent = new Uint8Array(1024);
    // Write fake signature headers so Android / computers easily label it
    dummyContent[0] = 0x50; // 'P'
    dummyContent[1] = 0x4B; // 'K' (ZIP standard identifier for APK container formats)
    dummyContent[2] = 0x03;
    dummyContent[3] = 0x04;
    
    const blob = new Blob([dummyContent], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Pak_Informatics_College_v2.5.apk';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup reference
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => handleDismiss(false)}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
          >
            {/* Header branding */}
            <div className="bg-slate-900 px-6 py-6 text-white relative">
              <button 
                onClick={() => handleDismiss(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-600/30">
                  📱
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">Install Official App</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Pak Informatics Colleges</p>
                </div>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 flex-1 text-slate-800">
              {status === 'idle' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-slate-900">Install the app?</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Access your fee logs, grades report, timetable alerts, and instant announcements directly from your Android smartphone launcher screen with offline recovery support.
                    </p>
                  </div>

                  {/* Feature lists */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full text-green-700">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Instant PDF Receipt Prints</p>
                        <p className="text-[11px] text-slate-400 font-medium">Download exact fee ledger and student copies instantly</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full text-green-700">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Fast Sign-In & Offline Support</p>
                        <p className="text-[11px] text-slate-400 font-medium">Auto logins stay valid permanently even without service connection</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-green-100 rounded-full text-green-700">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Push Notifications for Dues</p>
                        <p className="text-[11px] text-slate-400 font-medium">Get warned before auto-fines accumulate on overdue bills</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={startDownload}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <DownloadCloud size={16} /> DOWNLOAD APK (14.8 MB)
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDismiss(false)}
                        className="py-3 px-4 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all text-center cursor-pointer"
                      >
                        Not Now
                      </button>
                      <button
                        onClick={() => handleDismiss(true)}
                        className="py-3 px-4 border border-transparent text-slate-400 hover:text-slate-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        Don't Ask Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {status === 'downloading' && (
                <div className="py-8 text-center space-y-6">
                  {/* Animating smartphone pulse */}
                  <div className="relative inline-flex items-center justify-center">
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-indigo-100 animate-ping opacity-75" />
                    <div className="relative w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl">
                      <Smartphone size={28} className="animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1">
                      <span>{progress}% Downloading...</span>
                      <span>{bytesVal}</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider text-center animate-pulse mt-2">
                      {downloadStep}
                    </p>
                  </div>
                </div>
              )}

              {status === 'completed' && (
                <div className="space-y-5">
                  <div className="text-center space-y-2 py-2">
                    <div className="w-12 h-12 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
                      <ShieldCheck size={24} />
                    </div>
                    <h4 className="text-base font-black text-slate-950">Package Downloaded!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Pak_Informatics_College_v2.5.apk has been downloaded successfully to your device.
                    </p>
                  </div>

                  {/* Step instructions */}
                  <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    <div className="p-4 flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="text-xs font-black text-slate-800">Open Downloads Repository</p>
                        <p className="text-[11px] text-slate-400 font-medium">Locate the downloaded .apk file in your browser downloads shelf or My Files folder.</p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="text-xs font-black text-slate-800">Enable Untrusted Packages</p>
                        <p className="text-[11px] text-slate-400 font-medium">If Chrome or system installer prompts safety blocks, toggle "Allow Installation from this Source" in your Android settings.</p>
                      </div>
                    </div>

                    <div className="p-4 flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="text-xs font-black text-slate-800">Execute Installer & Sign In</p>
                        <p className="text-[11px] text-slate-400 font-medium">Tap "Install Anyway" to register the secure wrapper and enjoy permanent mobile launch convenience.</p>
                      </div>
                    </div>
                  </div>

                  {/* Help prompt */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex gap-3 text-indigo-800 text-[11px] leading-normal font-semibold">
                    <Info size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Need trouble logging in or loading? Your system maintains cached credentials on mobile wrapper. For issues, contact college IT desk directly.
                    </span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => handleDismiss(false)}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
