import { forwardRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { cn } from "../utils/cn";

const GlassBox = forwardRef(({ 
  children, 
  className, 
  animate = true, 
  hover = false,
  glassStyle = "standard",
  ...props
}, ref) => {
  const styles = {
    standard: "bg-white/40 backdrop-blur-md border border-white/20 shadow-glass",
    dark: "bg-slate-900/40 backdrop-blur-lg border border-white/10 shadow-glass",
    premium: "bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border border-white/30 shadow-premium",
  };

  // 3D Tilt Hook Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!hover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (!hover) return;
    x.set(0);
    y.set(0);
  };

  const Component = animate || hover ? motion.div : "div";
  const hoverProps = hover ? {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: {
      rotateX,
      rotateY,
      transformPerspective: 1000
    },
    whileHover: { scale: 1.02, zIndex: 10 },
  } : {};

  return (
    <Component
      ref={ref}
      className={cn(
        "rounded-3xl p-6 transition-colors duration-300 relative",
        styles[glassStyle],
        className
      )}
      {...hoverProps}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      {/* 3D Inner Glare effect based on tilt */}
      {hover && (
        <motion.div 
          className="absolute inset-0 z-0 bg-gradient-to-tr from-white/5 to-white/20 rounded-[inherit] pointer-events-none mix-blend-overlay"
          style={{
            x: useTransform(mouseXSpring, [-0.5, 0.5], ["-10%", "10%"]),
            y: useTransform(mouseYSpring, [-0.5, 0.5], ["-10%", "10%"])
          }}
        />
      )}
    </Component>
  );
});

GlassBox.displayName = "GlassBox";

export default GlassBox;
