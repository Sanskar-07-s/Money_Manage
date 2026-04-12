import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import GlassBox from './GlassBox';
import { getBudgetGoals, saveBudgetGoals, getLocalTransactions, getLocalCategories } from '../utils/storage';
import { fetchBudgetSuggestions, updateBudgets } from '../services/api';
import { cn } from '../utils/cn';

export default function BudgetIntelligence() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('finance-update', handleUpdate);
    return () => window.removeEventListener('finance-update', handleUpdate);
  }, []);

  const loadData = () => {
    setBudgets(getBudgetGoals());
    setCategories(getLocalCategories());
    setTransactions(getLocalTransactions());
  };

  const calculateUsage = (categoryName) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(tx => 
        tx.category === categoryName && 
        tx.type === 'expense' && 
        new Date(tx.createdAt) >= startOfMonth
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  const handleSetBudget = async (category, limit) => {
    const newBudgets = [...budgets.filter(b => b.category !== category), { category, limit: Number(limit) }];
    setBudgets(newBudgets);
    saveBudgetGoals(newBudgets);
    try {
      await updateBudgets(newBudgets);
    } catch (e) {
      console.warn("Cloud budget sync failed.");
    }
  };

  const handleRemoveBudget = async (category) => {
    const newBudgets = budgets.filter(b => b.category !== category);
    setBudgets(newBudgets);
    saveBudgetGoals(newBudgets);
    try {
      await updateBudgets(newBudgets);
    } catch (e) {
      console.warn("Cloud budget sync failed.");
    }
  };

  const handleAISuggest = async () => {
    setSuggesting(true);
    try {
      const suggestions = await fetchBudgetSuggestions();
      if (suggestions && suggestions.length > 0) {
        // Merge suggestions with existing
        const merged = [...budgets];
        suggestions.forEach(s => {
          if (!merged.some(m => m.category === s.category)) {
            merged.push({ category: s.category, limit: s.limit });
          }
        });
        setBudgets(merged);
        saveBudgetGoals(merged);
      }
    } catch (e) {
      alert("AI was unable to process patterns right now.");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Target className="text-brand" size={24} /> Budget Optimization
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">AI-driven liquidity guardrails.</p>
        </div>
        <button 
          onClick={handleAISuggest}
          disabled={suggesting}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand/10 text-brand rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand/20 transition-all border border-brand/20"
        >
          {suggesting ? <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
          AI Suggest Limits
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.filter(c => c.type === 'expense').map((cat) => {
          const budget = budgets.find(b => b.category === cat.name);
          const spent = calculateUsage(cat.name);
          const percent = budget ? Math.min(100, (spent / budget.limit) * 100) : 0;
          const isWarning = percent >= 80 && percent < 100;
          const isDanger = percent >= 100;

          return (
            <GlassBox key={cat.name} className="p-6 relative group overflow-hidden border-white/40">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{cat.name}</h4>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Cycle</p>
                </div>
                {budget ? (
                  <button onClick={() => handleRemoveBudget(cat.name)} className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
                    <Target size={14} />
                  </div>
                )}
              </div>

              {budget ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Utilized</p>
                      <p className="font-black text-lg text-slate-800">₹{spent.toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Ceiling</p>
                      <p className="font-black text-lg text-slate-800">₹{budget.limit.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className={cn(
                          "h-full rounded-full",
                          isDanger ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                          isWarning ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                          "bg-brand shadow-[0_0_10px_rgba(var(--brand),0.3)]"
                        )}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{Math.round(percent)}% Consumed</span>
                       {isDanger && <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Breach Detected</span>}
                       {isWarning && !isDanger && <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1"><AlertCircle size={10}/> Warning 80%</span>}
                       {!isWarning && !isDanger && <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10}/> On Track</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-xs font-medium text-slate-400 italic">No budget guardrail active.</p>
                  <div className="flex gap-2 w-full">
                    <input 
                      type="number" 
                      placeholder="Goal ₹" 
                      className="flex-1 bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-brand"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSetBudget(cat.name, e.target.value);
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        const val = e.currentTarget.previousSibling.value;
                        if(val) handleSetBudget(cat.name, val);
                      }}
                      className="p-2 bg-brand text-white rounded-xl hover:scale-105 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </GlassBox>
          );
        })}
      </div>
    </div>
  );
}
