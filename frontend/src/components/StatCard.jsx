import { motion } from "framer-motion";
import { cn } from "../utils/cn";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import GlassBox from "./GlassBox";

const StatCard = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon: Icon, 
  className 
}) => {
  return (
    <GlassBox
      className={cn("flex flex-col gap-4 relative overflow-hidden group min-w-[140px]", className)}
      hover
    >
      {/* Background Neon Accent */}
      <div className={cn(
        "absolute -top-4 -right-4 w-24 h-24 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity",
        isPositive ? "bg-green-500" : "bg-red-500"
      )} />

      <div className="flex items-center justify-between">
        <div className={cn(
          "p-3 rounded-2xl",
          isPositive ? "bg-green-50 text-green-600 shadow-green-100" : "bg-red-50 text-red-600 shadow-red-100",
          "shadow-lg backdrop-blur-sm"
        )}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}%
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <motion.h3 
          className="text-2xl font-bold font-mono tracking-tight text-slate-800"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          ₹{value.toLocaleString()}
        </motion.h3>
      </div>

      <button className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors self-start mt-1">
        Details <ArrowRight size={10} />
      </button>
    </GlassBox>
  );
};

export default StatCard;
