import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Settings, LayoutDashboard, History, MessageSquare, CreditCard, LogOut, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const baseCommands = [
    { section: "Navigation", id: 'nav-dash', label: "Go to Dashboard", icon: LayoutDashboard, action: () => navigate('/dashboard') },
    { section: "Navigation", id: 'nav-chat', label: "Open AI Assistant", icon: MessageSquare, action: () => navigate('/chat') },
    { section: "Navigation", id: 'nav-hist', label: "View History", icon: History, action: () => navigate('/history') },
    { section: "Navigation", id: 'nav-sett', label: "Settings", icon: Settings, action: () => navigate('/settings') },
    
    { section: "Actions", id: 'act-trans', label: "Log Transaction", icon: ArrowRightLeft, action: () => { navigate('/chat'); /* trigger chat focus */ } },
    { section: "Actions", id: 'act-bill', label: "Billing & Plans", icon: CreditCard, action: () => navigate('/settings') },
    
    { section: "System", id: 'sys-logout', label: "Sign Out", icon: LogOut, action: () => { /* Add logic */ navigate('/login'); } },
  ];

  const filteredCommands = search.trim() === '' 
    ? baseCommands 
    : baseCommands.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.section.toLowerCase().includes(search.toLowerCase()));

  // Group commands for display
  const groupedList = filteredCommands.reduce((acc, cmd) => {
     if(!acc[cmd.section]) acc[cmd.section] = [];
     acc[cmd.section].push(cmd);
     return acc;
  }, {});

  const handleSelect = (action) => {
      action();
      setIsOpen(false);
      setSearch('');
  }

  return (
    <>
       {/* UI Hint / Trigger Button */}
       <button 
         onClick={() => setIsOpen(true)}
         className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl transition-colors text-sm font-medium w-full max-w-[200px]"
       >
          <Search size={16} />
          <span>Search...</span>
          <div className="ml-auto flex items-center gap-0.5 opacity-50 font-sans">
             <Command size={12} />
             <span className="text-xs font-bold leading-none">K</span>
          </div>
       </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Palette */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5 focus-within:ring-brand/50 transition-shadow"
            >
              <div className="flex items-center px-6 py-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-brand mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="What would you like to do?"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-medium text-slate-800 placeholder:text-slate-400"
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scroller-hidden">
                {Object.keys(groupedList).length > 0 ? (
                    Object.entries(groupedList).map(([section, cmds]) => (
                        <div key={section} className="space-y-2">
                           <h4 className="px-3 text-xs font-black text-slate-400 uppercase tracking-widest">{section}</h4>
                           <div className="space-y-1">
                              {cmds.map(cmd => (
                                 <button
                                    key={cmd.id}
                                    onClick={() => handleSelect(cmd.action)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand hover:text-white group transition-colors text-left"
                                 >
                                    <div className="p-2 bg-slate-100 group-hover:bg-brand-dark rounded-lg transition-colors text-slate-500 group-hover:text-white/80">
                                       <cmd.icon size={16} />
                                    </div>
                                    <span className="font-semibold text-slate-700 group-hover:text-white flex-1">{cmd.label}</span>
                                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 group-hover:text-white/50" />
                                 </button>
                              ))}
                           </div>
                        </div>
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <Command className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="font-semibold text-slate-800 text-lg">No results found.</p>
                        <p className="text-slate-500 mt-1">Try searching for navigation or actions.</p>
                    </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
