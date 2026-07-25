"use client";

import { useRef, useCallback, useState } from "react";

export interface TouchGesture {
  type: "tap" | "doubletap" | "swipe-left" | "swipe-right" | "swipe-up" | "swipe-down" | "pinch-in" | "pinch-out" | "longpress";
  x: number;
  y: number;
  distance?: number;
}

interface UseTouchOptions {
  onGesture?: (gesture: TouchGesture) => void;
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number, dx: number, dy: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  threshold?: number;
  longPressDuration?: number;
}

export function useTouch(options: UseTouchOptions = {}) {
  const { onGesture, onDragStart, onDragMove, onDragEnd, threshold = 30, longPressDuration = 500 } = options;
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, lastTap: 0, dragging: false, longPressTimer: null as any });
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchRef.current.startX = touch.clientX;
    touchRef.current.startY = touch.clientY;
    touchRef.current.startTime = Date.now();
    touchRef.current.dragging = false;

    touchRef.current.longPressTimer = setTimeout(() => {
      if (!touchRef.current.dragging) {
        onGesture?.({ type: "longpress", x: touch.clientX, y: touch.clientY });
      }
    }, longPressDuration);
  }, [onGesture, longPressDuration]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist > threshold && !touchRef.current.dragging) {
      clearTimeout(touchRef.current.longPressTimer);
      touchRef.current.dragging = true;
      setIsDragging(true);
      onDragStart?.(touchRef.current.startX, touchRef.current.startY);
    }

    if (touchRef.current.dragging) {
      onDragMove?.(touch.clientX, touch.clientY, dx, dy);
    }
  }, [threshold, onDragStart, onDragMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    clearTimeout(touchRef.current.longPressTimer);
    const touch = e.changedTouches[0];
    if (!touch) return;

    const elapsed = Date.now() - touchRef.current.startTime;
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (touchRef.current.dragging) {
      setIsDragging(false);
      onDragEnd?.(touch.clientX, touch.clientY);
      return;
    }

    // Short tap / gesture detection
    if (elapsed < 300) {
      // Check for double tap
      if (Date.now() - touchRef.current.lastTap < 300) {
        onGesture?.({ type: "doubletap", x: touch.clientX, y: touch.clientY });
        touchRef.current.lastTap = 0;
        return;
      }
      touchRef.current.lastTap = Date.now();

      // Swipe detection
      if (absDx > threshold || absDy > threshold) {
        if (absDx > absDy) {
          onGesture?.({ type: dx > 0 ? "swipe-right" : "swipe-left", x: touch.clientX, y: touch.clientY });
        } else {
          onGesture?.({ type: dy > 0 ? "swipe-down" : "swipe-up", x: touch.clientX, y: touch.clientY });
        }
        return;
      }

      onGesture?.({ type: "tap", x: touch.clientX, y: touch.clientY });
    }
  }, [onGesture, onDragEnd, threshold]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    isDragging,
  };
}
