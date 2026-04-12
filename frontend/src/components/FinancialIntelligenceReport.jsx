import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, TrendingDown, Target, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import GlassBox from './GlassBox';
import { fetchFinancialReport } from '../services/api';
import { getLatestReport, saveReport } from '../utils/storage';
import { cn } from '../utils/cn';

export default function FinancialIntelligenceReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getLatestReport();
    if (saved) setReport(saved);
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await fetchFinancialReport();
      setReport(data);
      saveReport(data);
    } catch (err) {
      alert("Intelligence engine is currently processing a large data batch. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  const personalityColors = {
    'Saver': 'text-emerald-500 bg-emerald-50 border-emerald-100',
    'Balanced': 'text-brand bg-brand/5 border-brand/20',
    'Spender': 'text-amber-500 bg-amber-50 border-amber-100',
    'Risky Spender': 'text-red-500 bg-red-50 border-red-100'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Brain className="text-brand" size={24} /> Neural Persona Analysis
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Behavioral modeling and impulse detection.</p>
        </div>
        <button 
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
        >
          {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
          Recalculate Persona
        </button>
      </div>

      <AnimatePresence mode="wait">
        {report ? (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Personality Card */}
            <GlassBox className="lg:col-span-1 p-8 overflow-hidden relative border-white">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                <Brain size={120} />
              </div>
              
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Detected Archetype</p>
              <div className={cn(
                "inline-block px-4 py-2 rounded-xl border font-black text-xl mb-6",
                personalityColors[report.personalityType] || personalityColors['Balanced']
              )}>
                {report.personalityType}
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6 italic">
                "{report.insights}"
              </p>

              <div className="space-y-3">
                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Neural Status</p>
                 <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Stable Patterns Detected
                 </div>
              </div>
            </GlassBox>

            {/* Recommendations Checkpoints */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassBox className="p-8 border-white bg-white/40">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                      <Zap size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">Growth Actions</h3>
                </div>
                <ul className="space-y-4">
                  {(report.recommendations || []).map((rec, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                        <ShieldCheck size={12} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 leading-tight group-hover:text-slate-800 transition-colors">{rec}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassBox>

              <div className="grid grid-cols-1 gap-6">
                <GlassBox className="p-6 bg-indigo-900 border-none text-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <TrendingUp size={60} />
                  </div>
                  <h4 className="text-sm font-bold mb-1">Weekly Savings Potential</h4>
                  <p className="text-2xl font-black mb-4">₹1,200 <span className="text-[10px] opacity-40">estimated</span></p>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
                    Auto-Allocate <ChevronRight size={12} />
                  </button>
                </GlassBox>

                <GlassBox className="p-6 border-brand/10 bg-brand/5 group cursor-pointer hover:bg-brand/10 transition-colors">
                  <div className="flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-bold text-brand">Impulse Control</h4>
                        <p className="text-xs text-brand/60 font-medium">87% Accuracy Rate</p>
                     </div>
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand shadow-sm">
                        <Target size={18} />
                     </div>
                  </div>
                </GlassBox>
              </div>
            </div>
          </motion.div>
        ) : (
          <GlassBox key="no-report" className="p-16 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
              <Brain size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-400 tracking-tight">Financial Persona Locked</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-sm">The intelligence engine needs recent transaction nodes to map your behavioral spending personality.</p>
            <button 
              onClick={generateReport}
              disabled={loading}
              className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
            >
              Initialize Deep Scan
            </button>
          </GlassBox>
        )}
      </AnimatePresence>
    </div>
  );
}
