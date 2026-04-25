import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Sparkles, Download, Loader2, Wand2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      // AI Image generation removed due to missing API key
      toast.error('AI Image generation is currently disabled.');
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
      return;
    } catch (error) {
      console.error('Image Generation Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Wand2 size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Project Image Lab</h3>
          <p className="text-slate-500 text-sm">Generate visual assets for your school presentations</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        {/* Preview Area */}
        <div className="flex-1 min-h-[300px] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <Loader2 size={48} className="text-indigo-600 animate-spin" />
                  <Sparkles size={20} className="text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Visualizing your idea...</p>
              </motion.div>
            ) : generatedImage ? (
              <motion.div 
                key="image"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full relative"
              >
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = 'project-image.png';
                      link.click();
                    }}
                    className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <ImageIcon size={64} strokeWidth={1} />
                <p className="text-sm font-medium">Your generated image will appear here</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Control Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you need (e.g., 'A 3D model of a solar system with vibrant planets')"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-16 text-sm font-medium focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[100px] resize-none"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? "Generating..." : "Generate Project Asset"}
          </button>
        </div>
      </div>
    </div>
  );
};
