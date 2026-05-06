import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    // Phase timeline: fade-in (800ms) → hold (1400ms) → fade-out (600ms)
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const outTimer  = setTimeout(() => setPhase('out'),  2200);
    const doneTimer = setTimeout(() => onFinished(),     2900);
    return () => { clearTimeout(holdTimer); clearTimeout(outTimer); clearTimeout(doneTimer); };
  }, [onFinished]);

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-6"
          >
            <img
              src={window.location.origin + "/pic-logo.png"}
              alt="Pak Informatics College"
              className="w-44 h-44 object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback: render an SVG placeholder if image not found
                const target = e.currentTarget;
                target.style.display = 'none';
                const next = target.nextElementSibling as HTMLElement;
                if (next) next.style.display = 'flex';
              }}
            />
            {/* Fallback logo placeholder — hidden by default */}
            <div
              style={{ display: 'none' }}
              className="w-44 h-44 rounded-full bg-[#2D3494] items-center justify-center shadow-2xl shadow-blue-200"
            >
              <span className="text-white font-black text-5xl tracking-tight">PIC</span>
            </div>

            {/* College name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-2xl font-black text-[#2D3494] tracking-tight leading-none uppercase">
                Pak Informatics
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.25em] mt-1">
                Group of Colleges
              </p>
              <p className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-[0.2em] mt-2">
                Prosperity · Integrity · Captivating
              </p>
            </motion.div>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-16 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#2D3494]"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};