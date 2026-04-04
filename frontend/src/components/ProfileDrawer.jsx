import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Shield, 
  CreditCard, 
  LogOut, 
  Bell, 
  Settings as SettingsIcon, 
  ArrowUpRight, 
  Edit3, 
  Save,
  Phone,
  Mail,
  Camera,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassBox from './GlassBox';
import ActionButton from './ActionButton';
import { updateProfile as updateProfileApi } from '../services/api';
import { cn } from '../utils/cn';

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, profile, setProfile, logout, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        avatar: profile.avatar || ''
      });
    }
  }, [profile, isOpen]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateProfileApi(formData);
      setProfile(updated);
      setSuccess('Identity protocols updated.');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: 'Security Center', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
    { label: 'Notifications', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50/50' },
    { label: 'Cloud Subscription', icon: CreditCard, color: 'text-brand', bg: 'bg-brand/5' },
    { label: 'Account Settings', icon: SettingsIcon, color: 'text-indigo-500', bg: 'bg-indigo-50/50' },
  ];

  const formatLastSync = (dateStr) => {
     if (!dateStr) return 'Recently';
     const date = new Date(dateStr);
     if (isNaN(date.getTime())) return 'Recently';
     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!loading) onClose(); }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000]"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl z-[1001] flex flex-col overflow-hidden font-sans"
          >
            {/* Header - Compact */}
            <div className="flex items-center justify-between p-6 border-b border-slate-50">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                    <Shield size={18} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">Identity Center</h2>
              </div>
              <button 
                onClick={onClose}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               
               {/* Profile Overview Card - Professional Layout */}
               <div className="relative p-6 rounded-[2rem] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-slate-200">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand/20 blur-[50px] rounded-full"></div>
                  
                  <div className="relative z-10 flex items-center gap-5">
                     <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand to-brand-light p-1 shadow-inner">
                           <div className="w-full h-full rounded-[1.25rem] bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                              {profile?.avatar ? (
                                <img src={profile.avatar} alt="P" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-3xl font-black">{profile?.name?.[0]?.toUpperCase() || 'U'}</span>
                              )}
                           </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                           <CheckCircle2 size={12} className="text-white" />
                        </div>
                     </div>

                     <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black tracking-tight truncate">{profile?.name || 'Authorized User'}</h3>
                        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                           <Mail size={12} className="text-brand" /> {profile?.email || user?.email}
                        </p>
                        <div className="mt-3 flex gap-2">
                           <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/5">Tier: Platinum</span>
                           <span className="px-2 py-0.5 rounded-md bg-brand/20 text-brand-light text-[9px] font-black uppercase tracking-widest border border-brand/20">AI Node: Active</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Toggleable Sections */}
               <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.form 
                      key="edit"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onSubmit={handleUpdate}
                      className="space-y-4"
                    >
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1">Modify Node Metadata</h4>
                       
                       <div className="space-y-4 rounded-3xl bg-slate-50 p-6 border border-slate-100">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Universal Name</label>
                             <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                  type="text"
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm font-bold text-slate-800"
                                  placeholder="Full Name"
                                />
                             </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Secure Contact</label>
                             <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                  type="tel"
                                  value={formData.phone}
                                  onChange={e => setFormData({...formData, phone: e.target.value})}
                                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm font-bold text-slate-800"
                                  placeholder="Phone Number"
                                />
                             </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Avatar Pointer (URL)</label>
                             <div className="relative">
                                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                  type="text"
                                  value={formData.avatar}
                                  onChange={e => setFormData({...formData, avatar: e.target.value})}
                                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm font-bold text-slate-800"
                                  placeholder="https://..."
                                />
                             </div>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200 cursor-pointer"
                          >
                             {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                             Update Identity
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 h-12 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                          >
                             Cancel
                          </button>
                       </div>
                    </motion.form>
                  ) : (
                    <motion.div 
                      key="view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                       <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personal Vault</h4>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand hover:bg-brand/5 px-3 py-1 rounded-full transition-colors"
                          >
                             <Edit3 size={12} /> Edit Metadata
                          </button>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                          {navItems.map((item, i) => (
                            <button 
                              key={i}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm group",
                                item.bg
                              )}
                            >
                               <div className="flex items-center gap-4">
                                  <div className={cn("p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform", item.color)}>
                                     <item.icon size={18} />
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                               </div>
                               <ArrowUpRight size={14} className="text-slate-300 group-hover:text-brand transition-colors" />
                            </button>
                          ))}
                       </div>

                       {/* Status Banner - Fixed Date */}
                       <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 shadow-inner">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                             <CheckCircle2 size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Integrity</p>
                             <p className="text-[10px] text-slate-900 font-bold mt-0.5">Last Sync: <span className="text-brand font-black italic">{formatLastSync(profile?.updatedAt)}</span></p>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/30 space-y-4">
               {success && (
                 <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity:1, y: 0 }} className="p-3 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest text-center rounded-xl border border-emerald-100">
                    {success}
                 </motion.div>
               )}
               {error && (
                 <div className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest text-center rounded-xl border border-red-100 italic">
                    Error: {error}
                 </div>
               )}

               <button 
                 onClick={logout}
                 className="w-full h-14 bg-white border-2 border-slate-100 text-slate-900 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
               >
                 <LogOut size={16} /> Secure Termination
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
