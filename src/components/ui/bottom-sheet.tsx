"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, GripHorizontal } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  snapPoints?: string[];
  initialSnap?: number;
}

export function BottomSheet({ open, onClose, title, children, snapPoints = ["40%", "70%", "95%"], initialSnap = 1 }: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);

  const height = snapPoints[snapIndex];

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const offsetY = info.offset.y;
    const velocity = info.velocity.y;

    if (velocity > 500 || offsetY > 100) {
      if (snapIndex === 0) {
        onClose();
      } else {
        setSnapIndex((i) => Math.max(0, i - 1));
      }
    } else if (velocity < -500 || offsetY < -100) {
      setSnapIndex((i) => Math.min(snapPoints.length - 1, i + 1));
    }
  }, [snapIndex, snapPoints.length, onClose]);

  useEffect(() => {
    if (!open) return;
    setSnapIndex(initialSnap);
  }, [open, initialSnap]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ height }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-xl border-t border-border-subtle rounded-t-2xl flex flex-col"
            role="dialog"
            aria-label={title}
          >
            {/* Handle */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <div className="flex items-center gap-2" onTouchStart={(e) => e.stopPropagation()}>
                <div className="w-10 h-1 rounded-full bg-text-tertiary/30 mx-auto cursor-grab active:cursor-grabbing" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-[11px] font-medium text-text-primary">{title}</span>
              </div>
              <button
                onClick={onClose}
                className="size-7 rounded-lg glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
