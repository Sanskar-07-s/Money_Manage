import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CreditCard, Wallet, Banknote, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import GlassBox from './GlassBox';
import ActionButton from './ActionButton';
import { addLocalTransaction, getLocalCategories } from '../utils/storage';
import { addTransaction, logManualTransaction, fetchCategorySuggestion } from '../services/api';
import { recordLearningEvent } from '../utils/aiLearning';
import { Sparkles } from 'lucide-react';

export default function ManualAddModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    account: 'UPI',
    note: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const userCats = getLocalCategories();
      setCategories(userCats);
      // Set first category as default if available
      if (userCats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: userCats[0].name }));
      }
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!formData.note || formData.note.length < 3) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const result = await fetchCategorySuggestion(formData.note);
        setSuggestion(result);
      } catch (err) {
        console.warn("Suggestion fetch failed", err);
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.note]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const transaction = {
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        account: formData.account,
        note: formData.note || 'Manual entry',
        createdAt: new Date().toISOString(),
        isManual: true
      };

      // 1. Add to Cloud if possible
      try {
        await addTransaction(transaction);
        // Inform AI about manual entry
        await logManualTransaction(transaction);
      } catch (err) {
        console.warn("Cloud sync/AI log failed for manual entry, saved locally only.");
      }

      // 2. Add to Local Storage (Updates balance immediately)
      addLocalTransaction(transaction);

      // 3. Parallel AI Learning Node - Record if user diverged from suggestion
      if (suggestion && formData.note) {
        recordLearningEvent(
          formData.note, 
          suggestion.category, 
          formData.category, 
          suggestion.confidence
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setFormData({ amount: '', type: 'expense', category: categories[0]?.name || '', account: 'UPI', note: '' });
      }, 1500);
    } catch (err) {
      console.error("Manual entry failed:", err);
      alert("Failed to add transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg"
      >
        <GlassBox className="p-8 shadow-2xl border-white relative overflow-hidden">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-slate-800">Transaction Recorded</h2>
              <p className="text-slate-500 mt-2 font-medium">Balance updated successfully node-wide.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Manual Override</h2>
                  <p className="text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">Bypass AI processing</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Volume (Amount)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input 
                      type="number"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vector (Type)</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-100">
                      {['expense', 'income'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, type})}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            formData.type === type ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Account</label>
                    <select
                      value={formData.account}
                      onChange={(e) => setFormData({...formData, account: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="UPI">UPI Sync</option>
                      <option value="Cash">Physical Cash</option>
                      <option value="Bank">Savings/Bank</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Category Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classification Category</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Note Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Description (Note)</label>
                      <AnimatePresence>
                        {suggestion && (
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5"
                          >
                             <Sparkles size={10} className="text-brand" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Suggests </span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-brand">{suggestion.category}</span>
                             <span className="text-[8px] font-medium text-slate-300">({Math.round(suggestion.confidence * 100)}%)</span>
                          </motion.div>
                        )}
                        {isSuggesting && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-brand rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black text-slate-300 uppercase">Analyzing...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 text-slate-300" size={16} />
                      <textarea 
                        rows="2"
                        placeholder="Neural entry details..."
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-brand text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus size={18} /> record transaction
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </GlassBox>
      </motion.div>
    </div>
  );
}
