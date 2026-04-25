import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Edit2, 
  X, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '../utils/cn';

export default function ProposalCard({ action, onAccept, onCancel, isExecuted }) {
  const { type, data, action: actionType, confidence = 0.8 } = action;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    amount: data?.amount || 0,
    category: data?.category || 'Uncategorized',
    note: data?.note || '',
    account: data?.account || 'Cash',
    type: data?.type || type || 'expense'
  });

  const isIncome = editedData.type === 'income';
  
  const getConfidenceInfo = (conf) => {
    if (conf >= 0.9) return { label: 'Strong Suggestion', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (conf >= 0.7) return { label: 'Normal Confirmation', color: 'text-brand', bg: 'bg-brand/10' };
    return { label: 'Needs Clarification', color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const confInfo = getConfidenceInfo(confidence);

  if (isExecuted) return null;

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] mt-4 overflow-hidden relative group"
    >
      {/* Action Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className={cn(
              "p-3 rounded-2xl transition-colors shadow-sm",
              isIncome ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {actionType === 'DELETE_TRANSACTION' ? <Trash2 size={18} /> : (isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              {actionType?.replace('_', ' ')}
            </span>
            {isEditing && (
                <span className="text-[9px] font-black text-brand uppercase tracking-widest animate-pulse mt-0.5">Live Editing</span>
            )}
          </div>
        </div>
        {!isEditing && (
            <div className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm", confInfo.bg, "border-white/20")}>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", confInfo.color)}>
                    {confInfo.label}
                </span>
            </div>
        )}
      </div>

      {/* Action Details */}
      <div className="space-y-5 mb-8">
        <div className="flex justify-between items-center gap-5">
          {isEditing ? (
            <div className="flex-1 relative group/input">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                <input 
                    type="number"
                    value={editedData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full bg-white/50 backdrop-blur-md border border-white/60 rounded-[1.5rem] py-4 pl-10 pr-4 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all shadow-inner"
                />
            </div>
          ) : (
            <span className="text-3xl font-black text-slate-800 tracking-tighter">
                ₹{Number(editedData.amount).toLocaleString()}
            </span>
          )}

          {isEditing ? (
            <select 
                value={editedData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={cn(
                    "px-4 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border focus:outline-none transition-all shadow-sm",
                    isIncome ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
                )}
            >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
            </select>
          ) : (
            <span className={cn(
                "text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border",
                isIncome ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
            )}>
                {isIncome ? 'Income' : 'Expense'}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/40 rounded-[1.5rem] border border-white/60 flex flex-col gap-1.5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
            {isEditing ? (
                <input 
                    type="text"
                    value={editedData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
            ) : (
                <p className="text-sm font-bold text-slate-700">{editedData.category}</p>
            )}
          </div>
          <div className="p-4 bg-white/40 rounded-[1.5rem] border border-white/60 flex flex-col gap-1.5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</p>
            {isEditing ? (
                <select 
                    value={editedData.account}
                    onChange={(e) => handleInputChange('account', e.target.value)}
                    className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank</option>
                </select>
            ) : (
                <p className="text-sm font-bold text-slate-700">{editedData.account}</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/40 rounded-[1.5rem] border border-white/60 flex flex-col gap-1.5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</p>
            {isEditing ? (
                <input 
                    type="text"
                    value={editedData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
            ) : (
                <p className="text-sm font-bold text-slate-700 italic">"{editedData.note || 'No note added'}"</p>
            )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isEditing ? (
            <>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-brand to-indigo-600 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[11px] shadow-xl shadow-brand/30 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    Commit Changes
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setIsEditing(false);
                        setEditedData({
                            amount: data?.amount || 0,
                            category: data?.category || 'Uncategorized',
                            note: data?.note || '',
                            account: data?.account || 'Cash',
                            type: data?.type || type || 'expense'
                        });
                    }}
                    className="p-4 bg-slate-100 text-slate-500 rounded-[1.5rem] hover:bg-slate-200 transition-colors border border-slate-200"
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </motion.button>
            </>
        ) : (
            <>
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAccept({ ...action, data: editedData })}
                    className={cn(
                        "flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[11px] shadow-xl transition-all flex items-center justify-center gap-3",
                        confidence < 0.7 
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30" 
                          : "bg-gradient-to-r from-brand to-indigo-600 text-white shadow-brand/30"
                    )}
                >
                    <Check size={18} />
                    {confidence < 0.7 ? 'Verify & Finalize' : 'Approve & Execute'}
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="p-4 bg-white/80 text-slate-500 rounded-[1.5rem] hover:bg-white hover:text-brand transition-all border border-slate-100 shadow-sm"
                    title="Edit Details"
                >
                    <Edit2 size={18} />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="p-4 bg-red-50/50 text-red-500 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all border border-red-100/50 shadow-sm"
                    title="Dismiss"
                >
                    <X size={18} />
                </motion.button>
            </>
        )}
      </div>

      {/* Decorative Glow */}
      <div className={cn(
        "absolute -bottom-12 -right-12 w-24 h-24 blur-3xl opacity-20 pointer-events-none transition-colors",
        isIncome ? "bg-emerald-500" : "bg-red-500"
      )}></div>
    </motion.div>
  );
}

