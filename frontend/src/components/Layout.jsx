import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, History, Settings, LogOut, HandCoins, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import CommandPalette from './CommandPalette';
import ProfileDrawer from './ProfileDrawer';

const NavItem = ({ to, icon: Icon, label, isActive }) => (
  <Link 
    to={to} 
    className={cn(
      "relative p-3 lg:w-full flex items-center gap-4 rounded-2xl transition-all duration-300 group",
      isActive 
        ? "text-brand bg-brand/5 font-bold" 
        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/50"
    )}
  >
    <Icon size={24} className={cn("transition-transform group-hover:scale-110", isActive && "text-brand")} />
    <span className="hidden md:inline text-sm tracking-tight">{label}</span>
    {isActive && (
      <motion.div 
        layoutId="activeNav"
        className="absolute left-0 w-1 h-6 bg-brand rounded-r-full hidden md:block"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </Link>
);

const Layout = ({ children }) => {
  const { logout, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/chat', icon: MessageSquare, label: 'Assistant' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 md:flex-row overflow-hidden w-full relative">
      {/* Sidebar for Desktop */}
      <nav className="z-[100] hidden md:flex md:flex-col md:h-full md:border-r md:bg-white/80 md:backdrop-blur-2xl md:border-slate-100 md:w-20 lg:w-72 md:p-6 gap-2">
        
        <div className="hidden md:flex items-center gap-3 w-full mb-10 px-2 pt-2">
          <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20 shrink-0">
            <HandCoins size={22} />
          </div>
          <h1 className="text-xl font-display font-black text-slate-800 tracking-tighter hidden lg:block">Money<span className="text-brand">Manage</span></h1>
        </div>

        <div className="hidden md:block w-full px-2 mb-6">
           <CommandPalette />
        </div>

        <div className="flex flex-col gap-1 w-full flex-1">
          {navLinks.map((link) => (
            <NavItem 
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label === 'Assistant' ? 'AI Chat' : link.label}
              isActive={location.pathname === link.to}
            />
          ))}
        </div>

        <div className="flex-grow"></div>
        
        {/* Profile Hook */}
        <div className="flex flex-col gap-2 w-full px-1 pb-4 border-b border-slate-50 mb-2">
           <div 
             onClick={() => setProfileOpen(true)}
             className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-100"
           >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black relative shadow-lg shrink-0 overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                 {profile?.avatar ? (
                   <img src={profile.avatar} alt="P" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-sm">{profile?.name?.[0]?.toUpperCase() || 'U'}</span>
                 )}
                 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-[2px] border-slate-900"></div>
              </div>
              <div className="overflow-hidden flex-1 hidden lg:block">
                 <p className="text-sm font-black text-slate-800 truncate leading-tight group-hover:text-brand transition-colors">
                    {profile?.name || 'Verified User'}
                 </p>
                 <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Node Online</p>
                 </div>
              </div>
           </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="p-3 w-full flex items-center gap-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group lg:mb-2 shrink-0"
        >
            <LogOut size={24} className="group-hover:translate-x-1 transition-transform" /> 
            <span className="hidden lg:inline text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-red-600">Secure Exit</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-0 m-0 w-full min-h-0 scroller-hidden pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="z-[100] md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around px-4">
          {navLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                location.pathname === link.to ? "text-brand scale-110" : "text-slate-400"
              )}
            >
              <link.icon size={20} className={cn(location.pathname === link.to && "fill-brand/10")} />
              <span className="text-[10px] font-bold tracking-tight">{link.label === 'Assistant' ? 'AI' : link.label}</span>
            </Link>
          ))}
          <button 
            onClick={() => setProfileOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400"
          >
             <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 border border-slate-300">
                {profile?.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : null}
             </div>
             <span className="text-[10px] font-bold tracking-tight">Me</span>
          </button>
      </nav>

      {/* Global Profile Drawer */}
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};

export default Layout;

