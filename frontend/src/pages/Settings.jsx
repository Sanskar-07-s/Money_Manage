import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Layout from '../components/Layout';
import { 
  getStorageMode, 
  setStorageMode, 
  getLocalBalances, 
  getLocalTransactions, 
  replaceLocalBalances,
  replaceLocalTransactions,
  getPrivacyMode,
  setPrivacyMode,
  getSecurityLock,
  setSecurityLock
} from '../utils/storage';
import { 
  fetchCloudStatus, 
  fetchSummary, 
  syncCloudData, 
  deleteUserAllData
} from '../services/api';
import { 
  Settings as SettingsIcon, 
  Database, 
  ShieldCheck, 
  Layers, 
  Download, 
  Lock, 
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import GlassBox from '../components/GlassBox';
import ActionButton from '../components/ActionButton';
import { cn } from '../utils/cn';

export default function Settings() {
  const [cloudStatus, setCloudStatus] = useState({ cloudAvailable: false, transactionCount: 0 });
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isPrivacyMode, setIsPrivacyMode] = useState(getPrivacyMode());
  const [isSecurityLock, setIsSecurityLock] = useState(getSecurityLock());

  useEffect(() => {
    loadCloudStatus();
    setIsPrivacyMode(getPrivacyMode());
    setIsSecurityLock(getSecurityLock());
  }, []);

  const loadCloudStatus = async () => {
    try {
      const status = await fetchCloudStatus();
      setCloudStatus(status);
    } catch (e) {
      setCloudStatus({ cloudAvailable: false, transactionCount: 0 });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');

    try {
      const result = await syncCloudData(getLocalBalances(), getLocalTransactions());
      const cloudBalances = await fetchSummary();

      if (cloudBalances) {
        replaceLocalBalances(cloudBalances);
      }

      setSyncMessage(`Cloud sync completed. ${result.syncedTransactions} records uploaded.`);
      await loadCloudStatus();
    } catch (error) {
      setSyncMessage(error?.response?.data?.error || 'Cloud sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    try {
      const backup = {
        balances: getLocalBalances(),
        transactions: getLocalTransactions(),
        exportedAt: new Date().toISOString(),
        version: "2.0"
      };
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `money_manage_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. Please check console for errors.");
      console.error(e);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      // 1. Delete Local Storage
      localStorage.clear();
      
      // 2. Delete Remote Data via Backend
      await deleteUserAllData();

      alert("All data has been permanently deleted.");
      window.location.href = '/login';
    } catch (error) {
      console.error("Deletion error:", error);
      alert("Partial deletion occurred. Please check your connection.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'database', label: 'Data Mgmt', icon: Database },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 font-sans min-h-screen pb-24 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -z-10 -translate-y-1/2 translate-x-1/2 opacity-30 pointer-events-none"></div>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-3">
               <SettingsIcon size={32} className="text-brand" /> Settings
            </h1>
            <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">Configure your personalized environment.</p>
          </div>
          <div className="flex bg-white/50 backdrop-blur p-1 rounded-2xl border border-slate-100 shadow-sm">
             {tabs.map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)} 
                 className={cn(
                   "p-2 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all", 
                   activeTab === tab.id ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                  <tab.icon size={12} /> {tab.label}
               </button>
             ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div 
                  key="general"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <GlassBox className="p-10 shadow-premium border-white overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                       <div>
                          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight leading-none">System Intelligence</h2>
                          <p className="text-slate-400 font-medium text-sm mt-2">Core neural parameters and AI synchronization.</p>
                       </div>
                       <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand shadow-xl shadow-brand/5">
                          <Layers size={21} />
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-brand/20 transition-all">
                          <div>
                             <h3 className="font-bold text-slate-700 tracking-tight">Real-time Hybrid Sync</h3>
                             <p className="text-[11px] text-slate-400 mt-0.5">Automated local caching with secondary cloud verification.</p>
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                          </div>
                       </div>

                       <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 italic transition-all group hover:bg-white hover:border-indigo-200">
                          <h3 className="font-bold text-slate-800 tracking-tight">AI Policy Engine</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">Privacy protocols and spend forecasting are optimized for your profile.</p>
                       </div>
                    </div>
                  </GlassBox>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <GlassBox 
                       onClick={handleExport}
                       className="p-8 border-none bg-slate-100/50 shadow-none hover:bg-white hover:shadow-xl transition-all cursor-pointer group" 
                       hover
                     >
                        <Download className="text-slate-300 w-10 h-10 mb-4 group-hover:text-brand transition-colors" />
                        <h3 className="text-lg font-bold text-slate-700 tracking-tight">Export Data</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1 italic">Download full transaction ledger as JSON.</p>
                     </GlassBox>
                     
                     <GlassBox className="p-8 border-none bg-slate-100/50 shadow-none hover:bg-white hover:shadow-xl transition-all cursor-pointer group" hover>
                        <Lock className="text-slate-300 w-10 h-10 mb-4 group-hover:text-indigo-500 transition-colors" />
                        <h3 className="text-lg font-bold text-slate-700 tracking-tight">Privacy Vault</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1 italic">Manage encryption and data access logs.</p>
                     </GlassBox>
                  </div>
                </motion.div>
              )}

              {activeTab === 'database' && (
                <motion.div 
                  key="database"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <GlassBox className="p-10 bg-slate-900 border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12 translate-x-1/2 -translate-y-1/2 text-white">
                       <Database size={200} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                       <div>
                          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Cloud Persistence</h2>
                          <p className="text-indigo-200/50 font-medium text-sm mt-1 max-w-sm">Synchronize your financial snapshots with secure cloud storage.</p>
                       </div>
                       <ActionButton 
                         onClick={loadCloudStatus}
                         variant="glass" 
                         className="border-white/10" 
                         icon={RefreshCw}
                       >
                         Sync Status
                       </ActionButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 relative z-10">
                       {[
                         { label: "Connectivity", val: cloudStatus.cloudAvailable ? 'Secure' : 'Offline', sub: "Remote Link" },
                         { label: "Records", val: cloudStatus.transactionCount || 0, sub: "Synced Items" },
                         { label: "Stability", val: "100%", sub: "Data Integrity" }
                       ].map((stat, i) => (
                         <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur">
                            <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-[0.2em]">{stat.label}</p>
                            <p className="text-2xl font-black text-white mt-1 tracking-tighter">{stat.val}</p>
                            <p className="text-xs font-medium text-indigo-200/30 mt-1">{stat.sub}</p>
                         </div>
                       ))}
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center gap-6 relative z-10">
                       <ActionButton 
                         onClick={handleSync}
                         disabled={syncing || !cloudStatus.cloudAvailable}
                         className={cn("w-full md:w-auto px-8 h-14 text-indigo-900 bg-white hover:bg-indigo-50 border-none shadow-2xl", syncing && "animate-pulse")}
                         icon={Database}
                       >
                         {syncing ? 'Processing...' : 'Manual Cloud Sync'}
                       </ActionButton>
                       {syncMessage && (
                         <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-indigo-200 italic">
                            {syncMessage}
                         </motion.div>
                       )}
                    </div>
                  </GlassBox>

                  {/* Danger Zone */}
                  <div className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 mt-6 relative overflow-hidden">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                           <AlertTriangle size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold text-red-900 tracking-tight">Danger Zone</h3>
                           <p className="text-xs text-red-600/70 font-medium">Permanent account actions</p>
                        </div>
                     </div>
                     
                     <p className="text-sm text-red-700/80 mb-6 leading-relaxed bg-white/50 p-4 rounded-2xl border border-red-50">
                        Deleting your data will permanently remove all transactions, balances, and AI history from both local storage and our cloud servers. This action is **irreversible**.
                     </p>

                     {!showDeleteConfirm ? (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-200"
                        >
                           <Trash2 size={16} /> Delete All Data
                        </button>
                     ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                           <button 
                             onClick={handleDeleteAllData}
                             disabled={deleting}
                             className="px-6 py-3 bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest animate-pulse"
                           >
                              {deleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                           </button>
                           <button 
                             onClick={() => setShowDeleteConfirm(false)}
                             className="px-6 py-3 bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest"
                           >
                              Cancel
                           </button>
                        </div>
                     )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassBox className="p-8 border-none bg-slate-900 text-white relative overflow-hidden group shadow-2xl">
                      <div className="absolute top-0 right-0 p-6 opacity-10 -rotate-12 translate-x-4 -translate-y-4">
                        <ShieldCheck size={80} />
                      </div>
                      <h3 className="text-xl font-display font-bold tracking-tight mb-2">Neural Access Control</h3>
                      <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">Multi-factor authentication and biometric validation layers.</p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Biometric Lock</span>
                          <div 
                            onClick={() => {
                               const next = !isSecurityLock;
                               setSecurityLock(next);
                               setIsSecurityLock(next);
                            }}
                            className={cn(
                               "w-10 h-5 rounded-full relative cursor-pointer border transition-all duration-300",
                               isSecurityLock ? "bg-brand/50 border-brand/20" : "bg-slate-700 border-white/10"
                            )}
                          >
                            <motion.div 
                               animate={{ x: isSecurityLock ? 20 : 0 }}
                               className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">2FA Node Verification</span>
                          <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-slate-400 rounded-full shadow-sm"></div>
                          </div>
                        </div>
                      </div>
                    </GlassBox>

                    <GlassBox className="p-8 border-slate-100 bg-white shadow-premium flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 shadow-sm">
                           <Lock size={20} />
                        </div>
                        <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight mb-2">Privacy Protocols</h3>
                        <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">Mask sensitive financial data across the entire interface.</p>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-2 h-2 rounded-full transition-all", isPrivacyMode ? "bg-brand animate-pulse" : "bg-slate-300")}></div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Invisible Mode</span>
                        </div>
                        <button 
                          onClick={() => {
                             const next = !isPrivacyMode;
                             setPrivacyMode(next);
                             setIsPrivacyMode(next);
                          }}
                          className={cn(
                             "text-[9px] font-black uppercase tracking-widest hover:underline px-2 transition-colors",
                             isPrivacyMode ? "text-brand" : "text-slate-400"
                          )}
                        >
                           {isPrivacyMode ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </GlassBox>
                  </div>

                  <GlassBox className="p-8 md:p-10 border-white shadow-premium">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Session Matrix</h2>
                           <p className="text-sm font-medium text-slate-400 mt-1">Live authorized access nodes and device synchronization.</p>
                        </div>
                        <div className="px-4 py-1.5 bg-brand/5 border border-brand/10 rounded-full">
                           <span className="text-[9px] font-black uppercase tracking-widest text-brand">2 Active Nodes</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {[
                          { node: "Primary Browser Node", status: "Current", ip: "192.168.1.1", icon: Layers, color: "text-brand bg-brand/5" },
                          { node: "Mobile Sync Client", status: "Active", ip: "172.16.0.42", icon: ShieldCheck, color: "text-indigo-500 bg-indigo-50" }
                        ].map((sess, i) => (
                           <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:border-brand/20 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", sess.color)}>
                                    <sess.icon size={20} />
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-800 text-sm tracking-tight">{sess.node}</h4>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sess.ip} • Verified Instance</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={cn(
                                   "text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                   sess.status === 'Current' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                                 )}>
                                    {sess.status}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </GlassBox>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-bold text-slate-800 px-1">Identity Node</h3>
            <GlassBox className="p-6 overflow-hidden">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand to-indigo-600 shadow-lg shadow-brand/20 flex items-center justify-center text-white text-xl font-black">
                     U
                  </div>
                  <div className="overflow-hidden">
                     <p className="font-bold text-slate-800 truncate text-sm capitalize">Verified User</p>
                     <p className="text-[10px] font-mono text-slate-400 break-all leading-tight mt-1 truncate">{cloudStatus.userId || 'Guest'}</p>
                  </div>
               </div>
               
               <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 text-xs">
                     <ShieldCheck size={14} /> End-to-End Encryption
                  </div>
                  <p className="text-[10px] text-emerald-600/70 font-medium mt-1 leading-relaxed">
                     Your financial logs are encrypted before cloud synchronization.
                  </p>
               </div>
            </GlassBox>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
