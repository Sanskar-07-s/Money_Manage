import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, UserPlus, TrendingUp, HandCoins } from "lucide-react";
import GlassBox from "../components/GlassBox";
import ActionButton from "../components/ActionButton";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, authReady, authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authReady) return;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 overflow-hidden font-sans">
      {/* Dynamic Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-brand-50/30 to-slate-100/40 -z-30"></div>

      {/* Floating Animated Orbs */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          x: [0, 40, 0],
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -left-20 w-80 h-80 bg-brand/10 blur-[100px] rounded-full -z-20"
      />
      <motion.div
        animate={{
          y: [20, -20, 20],
          x: [0, -40, 0],
          rotate: [0, -360],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-indigo-200/20 blur-[120px] rounded-full -z-20"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg p-6 relative"
      >
        <GlassBox glassStyle="premium" className="shadow-2xl border-white/40 p-10 overflow-hidden">
          {/* Logo / Title Area */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="w-16 h-16 bg-gradient-to-tr from-brand to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand/20 mb-6"
            >
              <HandCoins size={36} />
            </motion.div>
            <h2 className="text-4xl font-display font-bold text-slate-800 tracking-tight">
              Money <span className="text-brand">Manage</span>
            </h2>
            <p className="text-slate-500 font-medium mt-2">Simplify your financial future.</p>
          </div>

          {authError && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={!authReady}
                  placeholder="name@example.com"
                  className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-700 font-medium focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all group-hover:border-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-brand transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Secret Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={!authReady}
                  placeholder="********"
                  className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-slate-700 font-medium focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all group-hover:border-slate-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-brand transition-colors" />
              </div>
            </div>

            <ActionButton
              type="submit"
              disabled={!authReady}
              className="w-full h-14 text-lg"
              icon={isLogin ? LogIn : UserPlus}
            >
              {authReady ? (isLogin ? 'Enter Workspace' : 'Get Started') : 'Firebase Setup Required'}
            </ActionButton>
          </form>

          <div className="mt-10 border-t border-slate-100 pt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-brand font-bold text-sm transition-all"
            >
              {isLogin ? (
                <>New here? <span className="text-brand underline underline-offset-4 ml-1">Create an account</span></>
              ) : (
                <>Already a member? <span className="text-brand underline underline-offset-4 ml-1">Sign in instead</span></>
              )}
            </button>
          </div>
        </GlassBox>

        {/* Small floating info cards for aesthetic */}
        <div className="hidden lg:block">
          <motion.div
            animate={{ x: [-10, 10, -10], y: [-5, 5, -5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-16"
          >
            <GlassBox className="p-4 shadow-xl border-white bg-white/80 scale-90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Daily Growth</p>
                  <p className="text-sm font-bold text-slate-800">+12.5%</p>
                </div>
              </div>
            </GlassBox>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
