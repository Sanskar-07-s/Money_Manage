import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Layout from '../components/Layout';
import { fetchTransactions } from '../services/api';
import { getLocalTransactions, getPrivacyMode } from '../utils/storage';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Tag, Wallet, ChevronRight, Download } from 'lucide-react';
import GlassBox from '../components/GlassBox';
import { cn } from '../utils/cn';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(getPrivacyMode());

  useEffect(() => {
    loadData();
    
    // Refresh history when updates happen elsewhere
    const handleUpdate = () => {
      loadData();
      setPrivacyMode(getPrivacyMode());
    };
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

  const fA = (val) => {
    if (privacyMode) return '••••';
    return `₹${Number(val).toLocaleString()}`;
  };

  const handleDownload = () => {
    try {
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
    } catch (e) {
      console.error("Ledger export failed", e);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans min-h-screen pb-24 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-800 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-500 font-medium mt-1">Deep history and verified transaction records.</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={handleDownload}
               className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand transition-all hover:scale-105 active:scale-95 shadow-sm"
               title="Export Ledger"
             >
                <Download size={20} />
             </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search notes or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border border-slate-100 focus:bg-white focus:border-brand/40 focus:ring-0 transition-all font-medium text-slate-700 shadow-sm"
              />
           </div>
           
           <div className="flex bg-white/50 p-1 rounded-2xl border border-slate-100 shadow-sm">
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

           <button className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white border border-slate-100 text-slate-600 font-bold text-xs hover:border-brand/40 transition-all shadow-sm">
              <Filter size={14} /> Global Filters
           </button>
        </div>

        {/* List */}
        <GlassBox className="p-0 overflow-hidden border-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amount</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                           <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/10"></td>
                        </tr>
                      ))
                    ) : filtered.length > 0 ? (
                      filtered.map((tx, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          key={tx.id || idx} 
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        >
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                    <Calendar size={14} />
                                 </div>
                                 <span className="text-xs font-bold text-slate-500">
                                   {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-800 tracking-tight">{tx.note || 'Manual Entry'}</span>
                                 <div className="flex items-center gap-1.5 mt-0.5">
                                    <Wallet size={10} className="text-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.account || 'Checkings'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                 <Tag size={10} className="opacity-50" />
                                 {tx.category || 'General'}
                              </div>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <div className="text-right">
                               <p className={cn(
                                 "text-lg font-black tracking-tighter",
                                 tx.type === 'income' ? "text-emerald-500" : "text-slate-800"
                               )}>
                                 {tx.type === 'income' ? '+' : '-'}{fA(tx.amount)}
                               </p>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{tx.account || 'Local'}</p>
                            </div>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <ChevronRight size={16} className="text-slate-200 group-hover:text-brand transition-colors ml-auto" />
                           </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                         <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-300">
                               <Database size={48} className="opacity-20" />
                               <p className="font-bold text-sm italic">No entries found matching filters.</p>
                            </div>
                         </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </GlassBox>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <GlassBox className="p-6 bg-slate-50 border-none shadow-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Wealth</p>
              <p className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">₹{transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)), 0).toLocaleString()}</p>
           </GlassBox>
           <GlassBox className="p-6 bg-slate-50 border-none shadow-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Entries</p>
              <p className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">{transactions.length} Records</p>
           </GlassBox>
           <GlassBox className="p-6 bg-slate-50 border-none shadow-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Average</p>
              <p className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">
                ₹{transactions.length ? (transactions.reduce((acc, tx) => acc + Number(tx.amount), 0) / transactions.length).toFixed(0) : 0}
              </p>
           </GlassBox>
        </div>
      </div>
    </Layout>
  );
}
