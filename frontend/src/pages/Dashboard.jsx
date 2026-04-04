import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  AudioLines,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  LineChart as LineChartIcon,
  PieChart,
  PlusCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Share2,
} from 'lucide-react';
import {
  Area,
  ComposedChart,
  Bar,
  Legend,
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
} from '../utils/storage';
import { buildTrendData, getTopCategory } from '../utils/financeMetrics';
import { fetchInsights, fetchTransactions } from '../services/api';

export default function Dashboard() {
  const { profile } = useAuth();
  const [balances, setBalances] = useState({ total: 0, categories: {}, accounts: {} });
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState("Analyzing your history to provide personalized insights...");
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const localBalances = getLocalBalances();
        const localTxs = getLocalTransactions();
        
        setBalances(localBalances);
        setTransactions(localTxs);

        const mode = getStorageMode();
        if (mode === 'cloud' || mode === 'hybrid') {
          const cloudInsights = await fetchInsights();
          setInsights(cloudInsights);
          const cloudTxs = await fetchTransactions();
          if (cloudTxs && cloudTxs.length > 0) {
            setTransactions(cloudTxs);
          }
        } else {
          setInsights("Switch to Cloud/Hybrid mode to unlock detailed AI spending analysis.");
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trendData = useMemo(() => buildTrendData(transactions), [transactions]);
  const [topCategory, topValue] = useMemo(() => getTopCategory(balances.categories), [balances]);

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
        className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10 font-sans min-h-screen pb-24"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Welcome, <span className="text-brand">{(profile?.name && profile.name !== 'New User') ? profile.name.split(' ')[0] : 'Member'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-base md:text-lg mt-1 tracking-tight">Your financial health at a glance.</p>
            {profile?.name === 'New User' && (
              <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100 italic"
              >
                 <Sparkles size={12} /> Complete your profile in the identity center
              </motion.div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-3">
             <ActionButton onClick={handleShareReport} variant="secondary" className="px-4 py-2 text-sm" icon={Share2}>Share Report</ActionButton>
             <ActionButton onClick={() => window.location.href='/chat'} icon={PlusCircle} className="px-5 py-3 shadow-premium">Log Activity</ActionButton>
          </motion.div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
              <GlassBox glassStyle="premium" className="h-full flex flex-col justify-between py-8 md:py-10 px-6 md:px-8 group relative overflow-hidden bg-gradient-to-br from-brand/90 to-indigo-700/90 text-white shadow-xl border-white/20">
                 <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                 
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <Wallet className="text-white/80" fill="white" fillOpacity={0.1}/>
                       <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Available Funds</h3>
                    </div>
                    <motion.div 
                      key={balances.total}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl md:text-6xl font-display font-black tracking-tighter"
                    >
                       ₹{balances.total.toLocaleString()}
                    </motion.div>
                 </div>

                 <div className="mt-8 md:mt-12 flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="flex gap-4">
                       <div>
                          <p className="text-[10px] font-black text-white/50 uppercase">Sync Status</p>
                          <p className="text-sm font-bold mt-1">Integrated</p>
                       </div>
                       <div className="w-px h-10 bg-white/10"></div>
                       <div>
                          <p className="text-[10px] font-black text-white/50 uppercase">Top Source</p>
                          <p className="text-sm font-bold mt-1">{topCategory}</p>
                       </div>
                    </div>
                    <button onClick={() => window.location.href='/history'} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors border border-white/10">
                       <ArrowRightIcon className="w-5 h-5" />
                    </button>
                 </div>
              </GlassBox>
           </motion.div>

           <motion.div variants={itemVariants}>
              <StatCard 
                 title="Total Wealth Change" 
                 value={balances.total} 
                 change={2.4} 
                 isPositive={balances.total >= 0} 
                 icon={TrendingUp}
                 className="h-full"
              />
           </motion.div>

           <motion.div variants={itemVariants}>
              <StatCard 
                 title="Weekly Activity" 
                 value={transactions.length} 
                 change={12.5} 
                 isPositive={true} 
                 icon={AudioLines}
                 className="h-full"
              />
           </motion.div>
        </div>

        {/* Charts & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
              <GlassBox className="p-6 md:p-8 group shadow-premium">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
                          <Sparkles size={24} className="group-hover:rotate-12 transition-transform"/>
                       </div>
                       <div>
                          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800 tracking-tight">AI Financial Brain</h2>
                          <p className="text-sm font-medium text-slate-400">Contextual spending analysis</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative overflow-hidden">
                    <p className="text-slate-600 leading-relaxed font-medium text-lg italic">
                      "{insights}"
                    </p>
                 </div>
              </GlassBox>

              {/* Categorical Breakdown */}
              <div className="space-y-6">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <PieChart size={20} className="text-brand"/> Category Balances
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(balances.categories).map(([name, val], idx) => (
                       <GlassBox key={name} className="p-4 md:p-5 flex flex-col gap-3 group" hover>
                          <div className="flex justify-between items-center px-1 transition-transform group-hover:translate-x-1">
                             <p className="text-sm font-bold text-slate-600 truncate">{name}</p>
                             <p className="text-sm font-black text-slate-800 font-mono">₹{val.toLocaleString()}</p>
                          </div>
                          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, (Math.abs(val) / Math.max(1, balances.total)) * 100)}%` }}
                               className={cn(
                                 "absolute left-0 top-0 h-full rounded-full transition-all",
                                 val >= 0 ? "bg-emerald-500" : "bg-red-500"
                               )}
                             />
                          </div>
                       </GlassBox>
                    ))}
                 </div>
              </div>
           </motion.div>

           <motion.div variants={itemVariants} className="space-y-6">
              <GlassBox ref={chartRef} className="p-6 bg-white shadow-premium">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Cash Flow (7 Days)</h3>
                    <button 
                      onClick={handleDownloadAnalytics}
                      className="text-slate-400 hover:text-brand transition-colors p-2 bg-slate-50 rounded-xl"
                    >
                       <Download size={16} />
                    </button>
                 </div>
                 <div className="h-[280px] w-full">
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
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                          <YAxis hide yAxisId="left" />
                          <ChartTooltip 
                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                          />
                          <Bar yAxisId="left" dataKey="income" name="Income" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                          <Area yAxisId="left" type="monotone" dataKey="spend" name="Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </GlassBox>

              <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Sparkles size={80} />
                 </div>
                 <h4 className="text-xl font-display font-bold mb-2">Pro Analytics</h4>
                 <p className="text-slate-400 text-sm mb-6 leading-relaxed">Predict future spending and identify leakages with our premium AI model.</p>
                 <ActionButton 
                   className="w-full bg-brand text-white border-none h-12 uppercase tracking-widest text-[10px] items-center justify-center" 
                   variant="secondary"
                 >
                   Upgrade Account
                 </ActionButton>
              </div>
           </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
