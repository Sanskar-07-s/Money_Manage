import { motion } from "framer-motion";
import { cn } from "../utils/cn";

const ActionButton = ({ 
  children, 
  onClick, 
  className, 
  variant = "primary", 
  disabled = false,
  icon: Icon
}) => {
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group";
  
  const variants = {
    primary: "bg-brand text-white shadow-lg hover:bg-brand-dark shadow-brand/30",
    secondary: "bg-white/80 backdrop-blur text-brand border border-brand/20 hover:bg-white shadow-sm",
    glass: "bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30",
    danger: "bg-red-500 text-white shadow-lg hover:bg-red-600 shadow-red-500/30",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-brand hover:text-brand",
    ghost: "text-slate-500 hover:bg-slate-100/50 hover:text-brand",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], className)}
    >
      {/* Subtle Shine Effect */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10 group-hover:bg-white/20 transition-all rounded-t-2xl"></span>
      
      {Icon && <Icon className="w-5 h-5" />}
      <span className="relative z-10">{children}</span>
      
      {/* Decorative Outer Glow on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </motion.button>
  );
};

export default ActionButton;
