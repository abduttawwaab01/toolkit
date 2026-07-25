"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 25, stiffness: 200 });
  const springY = useSpring(y, { damping: 25, stiffness: 200 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
      if (!visible) setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, [x, y, visible]);

  return (
    <motion.div
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
      className="pointer-events-none fixed top-0 left-0 z-[9999] size-[400px] rounded-full"
      transition={{ opacity: { duration: 0.3 } }}
    >
      <div className="size-full rounded-full bg-gradient-to-br from-neon-cyan/8 via-neon-purple/5 to-transparent blur-[80px]" />
    </motion.div>
  );
}
