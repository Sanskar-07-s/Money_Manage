import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  Download,
  PieChart,
  Sparkles,
  TrendingUp,
  Wallet,
  Share2,
  Plus,
  Brain,
  Cpu,
  Zap,
  Bell,
  AlertTriangle,
  Activity
} from 'lucide-react';
import {
  Area,
  ComposedChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import html2canvas from 'html2canvas';

import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import GlassBox from '../components/GlassBox';
import ActionButton from '../components/ActionButton';
import { cn } from '../utils/cn';
import {
  getLocalBalances,
  getLocalTransactions,
  getStorageMode,
  getBudgetGoals,
  recalculateLocalBalances,
  getPrivacyMode
} from '../utils/storage';
import { buildTrendData, getTopCategory } from '../utils/financeMetrics';
import { fetchInsights, fetchTransactions } from '../services/api';
import ManualAddModal from '../components/ManualAddModal';
import { getAILearningMemory, getSuggestionAccuracy, getMemoryInsights } from '../utils/aiLearning';
import BudgetIntelligence from '../components/BudgetIntelligence';
import FinancialIntelligenceReport from '../components/FinancialIntelligenceReport';

export default function Dashboard() {
  const { profile } = useAuth();
  const [balances, setBalances] = useState({ total: 0, categories: {}, accounts: {} });
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState("Analyzing your history to provide personalized insights...");
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [learningStats, setLearningStats] = useState({ accuracy: 100, memory: [], insight: "" });
  const [privacyMode, setPrivacyMode] = useState(getPrivacyMode());

  useEffect(() => {
    setLearningStats({
      accuracy: getSuggestionAccuracy(),
      memory: getAILearningMemory(),
      insight: getMemoryInsights()
    });
    
    const load = async () => {
      setLoading(true);
      try {
        const localTxs = getLocalTransactions();
        const absBalances = recalculateLocalBalances(localTxs);
        
        setBalances(absBalances);
        setTransactions(localTxs);

        const mode = getStorageMode();
        if (mode === 'cloud' || mode === 'hybrid') {
          const cloudInsights = await fetchInsights();
          setInsights(cloudInsights);
          const cloudTxs = await fetchTransactions();
          if (cloudTxs && cloudTxs.length > 0) {
            const combined = [...localTxs];
            cloudTxs.forEach(ctx => {
              if (!combined.some(ltx => ltx.id === ctx.id)) combined.push(ctx);
            });
            setTransactions(combined);
            recalculateLocalBalances(combined);
          }
        } else {
          setInsights("Switch to Cloud/Hybrid mode to unlock detailed AI spending analysis.");
        }
      } catch (e) {
        console.error("Dashboard stabilization error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    
    const handleUpdate = () => {
      setPrivacyMode(getPrivacyMode());
    };
    window.addEventListener('finance-update', handleUpdate);
    return () => window.removeEventListener('finance-update', handleUpdate);
  }, []);

  const refreshData = async () => {
    const localTxs = getLocalTransactions();
    const absBalances = recalculateLocalBalances(localTxs);
    setBalances(absBalances);
    setTransactions(localTxs);
  };

  const trendData = useMemo(() => buildTrendData(transactions), [transactions]);
  const [topCategory, topValue] = useMemo(() => getTopCategory(balances.categories), [balances]);

  const fA = (val) => {
    if (privacyMode) return '••••';
    return `₹${Number(val).toLocaleString()}`;
  };

  const handleDownloadAnalytics = () => {
    const jsonString = JSON.stringify(trendData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance_analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareReport = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        scale: 2
      });
      const image = canvas.toDataURL("image/png");
      
      if (navigator.share) {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'finance-report.png', { type: 'image/png' });
        await navigator.share({
          title: 'My Financial Report',
          text: 'Check out my cash flow analytics from MoneyManage!',
          files: [file]
        });
      } else {
        const link = document.createElement("a");
        link.href = image;
        link.download = `finance_report_${Date.now()}.png`;
        link.click();
      }
    } catch (e) {
      console.error("Share failed", e);
      alert("Could not generate shareable report.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <Layout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-3 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 font-sans min-h-screen pb-24 md:pb-10"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 text-center sm:text-left">
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-3">
              Welcome, <span className="text-brand">{(profile?.name && profile.name !== 'New User') ? profile.name.split(' ')[0] : 'Member'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-lg mt-1 tracking-tight">Your financial health at a glance.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-row justify-center sm:justify-end gap-2 md:gap-3">
             <ActionButton onClick={handleShareReport} variant="secondary" className="px-3 md:px-4 py-2 text-[10px] md:text-sm" icon={Share2}>Report</ActionButton>
             <ActionButton onClick={() => setIsManualModalOpen(true)} icon={Plus} className="px-4 md:px-5 py-2 md:py-3 shadow-premium bg-brand text-white border-none text-[10px] md:text-sm uppercase tracking-widest font-black">Add Action</ActionButton>
          </motion.div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
              <GlassBox glassStyle="premium" className="h-full flex flex-col justify-between py-6 md:py-10 px-6 md:px-8 group relative overflow-hidden bg-white text-slate-900 shadow-premium border-slate-100">
                 <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand/5 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                 
                 <div>
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                       <Wallet size={16} className="text-brand" />
                       <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Funds</h3>
                    </div>
                    <motion.div 
                      key={balances.total}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "text-3xl sm:text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-800",
                        privacyMode && "tracking-[0.2em] opacity-40"
                      )}
                    >
                       {fA(balances.total)}
                    </motion.div>
                 </div>

                 <div className="mt-6 md:mt-12 flex items-center justify-between border-t border-slate-50 pt-4 md:pt-6">
                    <div className="flex gap-3 md:gap-4 text-left">
                       <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">Status</p>
                          <p className="text-xs md:text-sm font-bold mt-0.5 text-slate-700">Live</p>
                       </div>
                       <div className="w-px h-8 md:h-10 bg-slate-100"></div>
                       <div>
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase">Top Source</p>
                          <p className="text-xs md:text-sm font-bold mt-0.5 text-slate-700 truncate max-w-[100px]">{topCategory}</p>
                       </div>
                    </div>
                    <button onClick={() => window.location.href='/history'} className="bg-slate-50 hover:bg-slate-100 p-2 md:p-3 rounded-full transition-colors border border-slate-100">
                       <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    </button>
                 </div>
              </GlassBox>
           </motion.div>

           <motion.div variants={itemVariants}>
              <StatCard 
                 title="Total Wealth" 
                 value={privacyMode ? '••••' : balances.total} 
                 change={2.4} 
                 isPositive={balances.total >= 0} 
                 icon={TrendingUp}
                 className="h-full"
              />
           </motion.div>

           <motion.div variants={itemVariants}>
              <StatCard 
                 title="Weekly Logs" 
                 value={transactions.length} 
                 change={12.5} 
                 isPositive={true} 
                 icon={Activity}
                 className="h-full"
              />
           </motion.div>
        </div>

        {/* Charts & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
           <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6 md:space-y-8">
              <GlassBox className="p-5 md:p-8 group shadow-premium">
                 <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
                          <Sparkles size={20} className="md:w-6 md:h-6 group-hover:rotate-12 transition-transform"/>
                       </div>
                       <div>
                          <h2 className="text-lg md:text-2xl font-display font-bold text-slate-800 tracking-tight">AI Financial Brain</h2>
                          <p className="text-[10px] md:text-sm font-medium text-slate-400">Contextual spending analysis</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl p-5 md:p-6 relative overflow-hidden">
                    <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-lg italic">
                      "{insights}"
                    </p>
                 </div>
              </GlassBox>

              <GlassBox className="p-5 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-2xl border-none">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none -rotate-12 translate-x-4 -translate-y-4">
                   <Brain size={100} className="md:w-[120px] md:h-[120px]" />
                 </div>
                 
                 <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                       <Cpu size={16} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                       <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight">AI Observation Node</h2>
                       <p className="text-[8px] md:text-[10px] font-black text-indigo-300/50 uppercase tracking-widest">Parallel Intelligence Layer</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 relative z-10">
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[9px] font-black uppercase text-indigo-300 tracking-widest">Model Accuracy</span>
                             <span className="text-xs font-black text-indigo-100">{learningStats.accuracy}%</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${learningStats.accuracy}%` }}
                                className="h-full bg-brand"
                             />
                          </div>
                       </div>
                       <div className="flex items-start gap-3">
                          <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] md:text-xs font-medium text-slate-300 leading-relaxed italic">
                            "{learningStats.insight}"
                          </p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-2 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-brand animate-ping"></div>
                          Live Learning Stream
                       </h4>
                       {learningStats.memory.length > 0 ? (
                         learningStats.memory.slice(0, 2).map((event, i) => (
                            <div key={i} className="text-[9px] font-medium text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                               User mapped <span className="text-slate-200">"{event.keyword}"</span> to <span className="text-brand font-bold">{event.userCorrectedCategory}</span>
                            </div>
                         ))
                       ) : (
                         <div className="text-[9px] font-medium text-slate-500 italic py-4">
                            Capture manual transactions to initiate self-correction algorithms.
                         </div>
                       )}
                    </div>
                 </div>
              </GlassBox>

              {/* Categorical Breakdown */}
              <div className="space-y-4 md:space-y-6">
                 <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <PieChart size={18} className="text-brand"/> Node Distributions
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-left">
                    {Object.entries(balances.categories).slice(0, 6).map(([name, val], idx) => (
                        <GlassBox key={name} className="p-3 md:p-4 flex flex-col gap-2 md:gap-3 group" hover>
                           <div className="flex justify-between items-center px-1 transition-transform group-hover:translate-x-1">
                              <div className="overflow-hidden flex-1">
                                 <p className="text-xs md:text-sm font-bold text-slate-600 truncate">{name}</p>
                                 <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">Node Status</p>
                              </div>
                              <p className={cn(
                                "text-xs md:text-sm font-black font-mono ml-2",
                                (val.net || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                {fA(val.net || 0)}
                              </p>
                           </div>
                           <div className="flex justify-between text-[7px] md:text-[8px] font-black uppercase text-slate-400 px-1">
                              <span>Out: {fA(val.spent || 0)}</span>
                              <span>In: {fA(val.got || 0)}</span>
                           </div>
                           <div className="relative w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (Math.max(0.1, Math.abs(val.net || 0)) / Math.max(1, balances.total)) * 100)}%` }}
                                className={cn(
                                  "absolute left-0 top-0 h-full rounded-full transition-all",
                                  (val.net || 0) >= 0 ? "bg-emerald-500" : "bg-red-500"
                                )}
                              />
                           </div>
                        </GlassBox>
                     ))}
                 </div>
              </div>
           </motion.div>

           <motion.div variants={itemVariants} className="space-y-6">
              <GlassBox ref={chartRef} className="p-5 md:p-6 bg-white shadow-premium">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Cash Flow (7D)</h3>
                    <button 
                      onClick={handleDownloadAnalytics}
                      className="text-slate-400 hover:text-brand transition-colors p-2 bg-slate-50 rounded-xl"
                    >
                       <Download size={14} />
                    </button>
                 </div>
                 <div className="h-[220px] md:h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={trendData}>
                          <defs>
                             <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                          <YAxis hide yAxisId="left" />
                          <ChartTooltip 
                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(5px)', backgroundColor: 'rgba(255,255,255,0.95)', fontSize: '10px' }}
                          />
                          <Bar yAxisId="left" dataKey="income" name="Income" fill="url(#colorIncome)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                          <Area yAxisId="left" type="monotone" dataKey="spend" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </GlassBox>

              <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Sparkles size={60} className="md:w-20 md:h-20" />
                 </div>
                 <h4 className="text-lg md:text-xl font-display font-bold mb-2">Pro Analytics</h4>
                 <p className="text-slate-400 text-[10px] md:text-sm mb-6 leading-relaxed">Predict future spending and identify leakages with our premium AI model.</p>
                 <ActionButton 
                    className="w-full bg-brand text-white border-none h-10 md:h-12 uppercase tracking-widest text-[9px] md:text-[10px] items-center justify-center font-black" 
                    variant="secondary"
                 >
                    Upgrade Account
                 </ActionButton>
              </div>

              {/* Active Alerts Sidebar / Bottom Stack */}
              <div className="space-y-4">
                 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 px-1 uppercase tracking-widest text-left">
                    <Bell size={16} className="text-amber-500" /> Active Alerts
                 </h3>
                 <GlassBox className="p-4 md:p-6 border-amber-100 bg-amber-50/30 space-y-4">
                    {(() => {
                       const budgets = getBudgetGoals();
                       const txs = transactions;
                       const now = new Date();
                       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                       
                       const alerts = budgets.map(b => {
                          const spent = txs
                             .filter(t => t.category === b.category && t.type === 'expense' && new Date(t.createdAt) >= startOfMonth)
                             .reduce((s, t) => s + Number(t.amount), 0);
                          const percent = (spent / b.limit) * 100;
                          return { ...b, spent, percent };
                       }).filter(a => a.percent >= 80);

                       if (alerts.length === 0) {
                          return <p className="text-[10px] font-medium text-slate-400 italic py-4 text-center">System healthy. No breaches detected.</p>;
                       }

                       return alerts.map(alert => (
                          <div key={alert.category} className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm text-left">
                             <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <AlertTriangle size={12} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{alert.percent >= 100 ? 'Breached' : '80%+ Used'}</span>
                             </div>
                             <h4 className="font-bold text-slate-800 text-xs">{alert.category}</h4>
                             <p className="text-[10px] text-slate-500 mt-1">₹{alert.spent.toLocaleString()} / ₹{alert.limit.toLocaleString()}</p>
                             <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div 
                                   className={cn("h-full rounded-full", alert.percent >= 100 ? "bg-red-500" : "bg-amber-500")}
                                   style={{ width: `${Math.min(100, alert.percent)}%` }}
                                />
                             </div>
                          </div>
                       ));
                    })()}
                 </GlassBox>
              </div>
           </motion.div>
        </div>

        <section className="pt-6 md:pt-10 mb-10 border-t border-slate-100">
           <BudgetIntelligence />
        </section>

        <section className="pt-6 md:pt-10 mb-10 border-t border-slate-100">
           <FinancialIntelligenceReport />
        </section>

        <ManualAddModal 
          isOpen={isManualModalOpen} 
          onClose={() => setIsManualModalOpen(false)} 
          onSuccess={refreshData}
        />
      </motion.div>
    </Layout>
  );
}
