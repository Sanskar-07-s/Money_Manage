import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Layout from '../components/Layout';
import { fetchTransactions } from '../services/api';
import { getLocalTransactions } from '../utils/storage';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Tag, Wallet, ChevronRight, Download, Database } from 'lucide-react';
import GlassBox from '../components/GlassBox';
import { cn } from '../utils/cn';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Refresh history when updates happen elsewhere
    const handleUpdate = () => loadData();
    window.addEventListener('finance-update', handleUpdate);
    return () => window.removeEventListener('finance-update', handleUpdate);
  }, []);

  const loadData = async () => {
    try {
      const cloud = await fetchTransactions();
      const local = getLocalTransactions();
      const combined = [...local, ...cloud];
      
      // Remove duplicates by ID or timestamp+amount
      const unique = Array.from(new Set(combined.map(t => t.id || `${t.createdAt}_${t.amount}`)))
        .map(id => combined.find(t => (t.id || `${t.createdAt}_${t.amount}`) === id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTransactions(unique);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(tx => {
    const matchesSearch = (tx.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDownload = () => {
    const jsonString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance_ledger_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans min-h-screen pb-24 relative overflow-hidden">
        
        {/* Premium Background Fade */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand/5 to-transparent -z-10 opacity-50"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-display font-bold text-slate-800 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-500 font-medium mt-1">Deep analysis of your verified transaction nodes.</p>
          </motion.div>
          <div className="flex gap-2">
             <button 
               onClick={handleDownload}
               className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand transition-all hover:scale-105 active:scale-95 shadow-sm"
             >
                <Download size={20} />
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
           <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search notes or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border border-white focus:bg-white focus:border-brand focus:ring-0 transition-all font-medium text-slate-700 shadow-premium"
              />
           </div>
           
           <div className="flex bg-white/40 p-1 rounded-2xl border border-white shadow-premium backdrop-blur-md">
              {['all', 'income', 'expense'].map(type => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    filterType === type ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {type}
                </button>
              ))}
           </div>

           <button className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/40 border border-white text-slate-600 font-bold text-xs hover:border-brand transition-all shadow-premium backdrop-blur-md italic">
              <Filter size={14} /> Advanced
           </button>
        </motion.div>

        {/* List */}
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.15 }}
        >
          <GlassBox className="p-0 overflow-hidden border-white shadow-premium bg-white/30">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-indigo-50/50 bg-white/50">
                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date/Time</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction node</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logic Category</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amnt (Rs)</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-indigo-50/20">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                             <td colSpan={5} className="px-6 py-8 h-20 bg-slate-50/20"></td>
                          </tr>
                        ))
                      ) : filtered.length > 0 ? (
                        filtered.map((tx, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            key={tx.id || idx} 
                            className="hover:bg-brand/5 transition-colors group cursor-pointer"
                          >
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-indigo-50 rounded-xl text-indigo-400 scale-90">
                                      <Calendar size={14} />
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-600">
                                        {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400 italic">
                                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-800 tracking-tight">{tx.note || 'Neural entry recorded'}</span>
                                   <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                      <Wallet size={10} className="text-slate-400" />
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.account || 'Universal Node'}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                   <Tag size={10} className="text-brand opacity-70" />
                                   {tx.category || 'General'}
                                </div>
                             </td>
                             <td className="px-6 py-5 text-right">
                                <div className={cn(
                                  "text-sm font-black tracking-tighter flex items-center justify-end gap-1.5",
                                  tx.type === 'income' ? "text-emerald-500" : "text-slate-800"
                                )}>
                                   {tx.type === 'income' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString()}
                                   {tx.type === 'income' ? <ArrowDownLeft size={16} fill="white" className="p-1 bg-emerald-50 rounded-md"/> : <ArrowUpRight size={16} className="p-1 bg-slate-50 rounded-md opacity-40"/>}
                                </div>
                             </td>
                             <td className="px-6 py-5 text-right">
                                <ChevronRight size={16} className="text-slate-200 group-hover:text-brand transition-all -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 ml-auto" />
                             </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                           <td colSpan={5} className="px-6 py-28 text-center">
                              <div className="flex flex-col items-center gap-4 text-slate-300">
                                 <Database size={64} className="opacity-10" />
                                 <div className="space-y-1">
                                    <p className="font-black text-[10px] uppercase tracking-[0.3em]">Vault is empty</p>
                                    <p className="font-medium text-xs text-slate-400 italic">Initiate AI protocols or log manual entries to populate ledger.</p>
                                 </div>
                              </div>
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </GlassBox>
        </motion.div>

        {/* Stats Summary */}
         <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
           <GlassBox className="p-8 bg-white/50 border-white shadow-premium">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Volume</p>
              <p className="text-3xl font-black text-slate-800 mt-2 tracking-tighter">₹{transactions.reduce((acc, tx) => acc + Number(tx.amount), 0).toLocaleString()}</p>
           </GlassBox>
           <GlassBox className="p-8 bg-white/50 border-white shadow-premium">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Active Records</p>
              <p className="text-3xl font-black text-slate-800 mt-2 tracking-tighter">{transactions.length} <span className="text-xs font-black text-slate-400 ml-1">Entries</span></p>
           </GlassBox>
           <GlassBox className="p-8 bg-white/50 border-white shadow-premium">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Value</p>
              <p className="text-3xl font-black text-slate-800 mt-2 tracking-tighter">
                ₹{transactions.length ? (transactions.reduce((acc, tx) => acc + Number(tx.amount), 0) / transactions.length).toFixed(0) : 0}
              </p>
           </GlassBox>
        </motion.div>
      </div>
    </Layout>
  );
}
