import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Layout from '../components/Layout';
import { 
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from '../services/api';
import { 
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Tag,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search
} from 'lucide-react';
import GlassBox from '../components/GlassBox';
import { cn } from '../utils/cn';
import { getLocalCategories, getLocalBalances, getPrivacyMode } from '../utils/storage';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('expense');
  const [error, setError] = useState('');
  const [privacyMode, setPrivacyMode] = useState(getPrivacyMode());

  useEffect(() => {
    loadCategories();
    
    const handleUpdate = () => {
      setPrivacyMode(getPrivacyMode());
    };
    window.addEventListener('finance-update', handleUpdate);
    return () => window.removeEventListener('finance-update', handleUpdate);
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      if (data && data.length > 0) {
        localStorage.setItem('user_categories', JSON.stringify(data));
      }
      setCategories(getLocalCategories());
    } catch (e) {
      setCategories(getLocalCategories());
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setError('');
    try {
      const added = await addCategory({ name: newCatName.trim(), type: newCatType });
      const updated = [...categories, added];
      setCategories(updated);
      setNewCatName('');
      localStorage.setItem('user_categories', JSON.stringify(updated));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setError('');
    try {
      const updated = await updateCategory({ id, name: editName.trim(), type: editType });
      const updatedList = categories.map(c => c.id === id ? updated : c);
      setCategories(updatedList);
      setEditingId(null);
      localStorage.setItem('user_categories', JSON.stringify(updatedList));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await deleteCategory(id);
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem('user_categories', JSON.stringify(updated));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fA = (val) => {
    if (privacyMode) return '••••';
    return `₹${Number(val).toLocaleString()}`;
  };

  return (
    <Layout>
      <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-10 font-sans min-h-screen pb-24 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -z-10 -translate-y-1/2 translate-x-1/2 opacity-30 pointer-events-none"></div>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 text-center md:text-left"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-3">
               <Tag size={28} className="text-brand md:w-8 md:h-8" /> Classification Nodes
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-lg mt-1 tracking-tight">Manage your personalized financial taxonomy.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10 items-start">
          {/* Main List Area */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search category nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-white border border-slate-100 focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all font-medium text-slate-700 shadow-sm text-sm"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2"
              >
                <AlertTriangle size={12} /> {error}
              </motion.div>
            )}

            <GlassBox className="p-0 overflow-hidden border-white shadow-premium bg-white/50">
              <div className="p-4 md:p-5 border-b border-slate-50 bg-white/80">
                <div className="grid grid-cols-12 items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <div className="col-span-6 md:col-span-4">Category Node</div>
                  <div className="hidden md:block col-span-2 text-right">Spent</div>
                  <div className="hidden md:block col-span-2 text-right">Got</div>
                  <div className="col-span-4 md:col-span-3 text-right">Net Status</div>
                  <div className="col-span-2 md:col-span-1"></div>
                </div>
              </div>

              <div className="p-3 md:p-4 space-y-2">
                {loading ? (
                  <div className="py-12 text-center text-slate-400 animate-pulse font-black text-[10px] uppercase tracking-[0.3em]">Synching Neural Categories...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic font-medium">No results found in taxonomy.</div>
                ) : (
                  filtered.map((cat, idx) => (
                    <motion.div 
                      key={cat.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group p-3 md:p-4 bg-white border border-slate-50 rounded-xl md:rounded-[1.5rem] grid grid-cols-12 items-center hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300"
                    >
                      <div className="col-span-6 md:col-span-4 flex items-center gap-2 md:gap-3">
                        <div 
                          onClick={() => editingId === cat.id && setEditType(prev => prev === 'income' ? 'expense' : 'income')}
                          className={cn(
                            "w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-all",
                            (editingId === cat.id ? editType : cat.type) === 'income' ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
                          )}
                        >
                          {(editingId === cat.id ? editType : cat.type) === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        </div>
                        
                        {editingId === cat.id ? (
                          <div className="flex flex-col gap-1 w-full mr-2">
                             <input 
                               autoFocus
                               value={editName}
                               onChange={(e) => setEditName(e.target.value)}
                               className="bg-slate-50 border border-brand/20 rounded-lg px-2 py-0.5 font-bold text-slate-800 outline-none w-full transition-all text-[10px] md:text-[11px]"
                             />
                             <div className="flex gap-1">
                                <button type="button" onClick={() => setEditType('income')} className={cn("text-[6px] md:text-[7px] font-bold px-1 py-0.5 rounded", editType === 'income' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>INC</button>
                                <button type="button" onClick={() => setEditType('expense')} className={cn("text-[6px] md:text-[7px] font-bold px-1 py-0.5 rounded", editType === 'expense' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400")}>EXP</button>
                             </div>
                          </div>
                        ) : (
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-800 text-[10px] md:text-sm tracking-tight truncate">{cat.name}</h4>
                            <p className="text-[6px] md:text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{cat.type}</p>
                          </div>
                        )}
                      </div>

                      <div className="hidden md:block col-span-2 text-right">
                         <span className="text-[10px] md:text-xs font-bold text-slate-600">
                           {fA(getLocalBalances().categories[cat.name]?.spent || 0)}
                         </span>
                      </div>

                      <div className="hidden md:block col-span-2 text-right">
                         <span className="text-[10px] md:text-xs font-bold text-emerald-500">
                           {fA(getLocalBalances().categories[cat.name]?.got || 0)}
                         </span>
                      </div>

                      <div className="col-span-4 md:col-span-3 text-right">
                         <span className={cn(
                           "text-xs md:text-sm font-black tracking-tighter",
                           (getLocalBalances().categories[cat.name]?.net || 0) >= 0 ? "text-emerald-600" : "text-red-500"
                         )}>
                           {fA(getLocalBalances().categories[cat.name]?.net || 0)}
                         </span>
                         <div className="md:hidden text-[6px] text-slate-400 uppercase font-bold tracking-widest">Net</div>
                      </div>

                      <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1">
                        {editingId === cat.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(cat.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              <Check size={10} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                              <X size={10} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditType(cat.type); }}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-brand hover:bg-brand/5 transition-all md:opacity-0 group-hover:opacity-100"
                            >
                              <Pencil size={10} />
                            </button>
                            <button 
                              onClick={() => handleDelete(cat.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all md:opacity-0 group-hover:opacity-100"
                            >
                              <Trash size={10} />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassBox>
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6 order-1 lg:order-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 px-1 text-center md:text-left">Inject New Node</h3>
            <GlassBox className="p-5 md:p-8">
              <form onSubmit={handleAdd} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Label Name</label>
                  <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Subscriptions"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all shadow-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Behavior Mode</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl border border-slate-100">
                    {['expense', 'income'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewCatType(type)}
                        className={cn(
                          "flex-1 py-1.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all",
                          newCatType === type ? "bg-white text-brand shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 md:py-5 bg-brand text-white rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Create Node
                </button>
              </form>
            </GlassBox>

            <div className="hidden lg:block bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Tag size={80} />
               </div>
               <h4 className="text-xl font-display font-bold mb-2">Smart Tagging</h4>
               <p className="text-indigo-200/60 text-xs mb-6 leading-relaxed">AI will prioritize these nodes when scanning your transaction inputs.</p>
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  Neural Sync Active
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
