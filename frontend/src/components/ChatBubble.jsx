import { motion } from "framer-motion";
import { cn } from "../utils/cn";
import { Sparkles, User, CheckCheck } from "lucide-react";

export default function ChatBubble({ text, sender, isTyping = false, time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) {
  const isAi = sender === 'ai';

  const variants = {
    initial: { 
      opacity: 0, 
      scale: 0.9, 
      y: 10,
      x: isAi ? -10 : 10 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      x: 0 
    },
    transition: { type: "spring", stiffness: 400, damping: 25 }
  };

  return (
    <motion.div 
      variants={variants}
      initial="initial"
      animate="animate"
      className={cn(
        "flex w-full mb-4 group justify-start items-end gap-2",
        isAi ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar Container */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden",
        isAi ? "bg-brand text-white shadow-brand/20" : "bg-white text-slate-500 shadow-slate-200"
      )}>
        {isAi ? <Sparkles size={14} className="animate-pulse" /> : <User size={14} />}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/10"></div>
      </div>

      {/* Bubble Container */}
      <div className={cn(
        "max-w-[85%] relative flex flex-col gap-1",
        isAi ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "px-5 py-3 rounded-3xl shadow-premium relative transition-all duration-300 backdrop-blur-sm",
          isAi 
            ? "bg-white/80 border border-white/40 text-slate-800 rounded-bl-sm" 
            : "bg-brand/90 border border-brand/20 text-white rounded-br-sm shadow-brand/10"
        )}>
          {/* Subtle Glow on AI message */}
          {isAi && (
            <div className="absolute -inset-[1px] -z-10 rounded-[inherit] bg-gradient-to-br from-brand/5 to-transparent blur-sm opacity-50"></div>
          )}

          {isTyping ? (
            <div className="flex gap-1.5 py-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-sm font-medium leading-relaxed tracking-tight mb-1">
              {text}
            </div>
          )}

          {/* Timestamp Indicator */}
          <div className={cn(
            "text-[10px] font-bold flex items-center gap-1 mt-1 uppercase tracking-wider opacity-60",
            isAi ? "text-slate-400" : "text-brand-50"
          )}>
            {time}
            {!isAi && <CheckCheck size={10} className="text-white opacity-40 ml-auto" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
