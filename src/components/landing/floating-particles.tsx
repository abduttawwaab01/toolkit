"use client";

import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  glow: number;
}

const COLORS = [
  "rgba(0, 245, 212, ",   // cyan
  "rgba(191, 106, 255, ", // purple
  "rgba(255, 0, 110, ",   // pink
];

function createParticles(width: number, height: number, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 2 + Math.random() * 4,
      color: colorBase,
      opacity: 0.2 + Math.random() * 0.5,
      glow: Math.random() * 0.3,
    };
  });
}

export function FloatingParticles({
  className,
  count = 60,
}: {
  className?: string;
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const isVisibleRef = useRef(true);
  const prefersReducedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const particles = particlesRef.current;
    const connectionDist = 150;

    // Update positions
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > width) { p.x = width; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > height) { p.y = height; p.vy *= -1; }
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist) {
          const alpha = (1 - dist / connectionDist) * 0.15;
          const gradient = ctx.createLinearGradient(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          );
          gradient.addColorStop(0, particles[i].color + alpha + ")");
          gradient.addColorStop(1, particles[j].color + alpha + ")");
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      gradient.addColorStop(0, p.color + (p.opacity + p.glow) + ")");
      gradient.addColorStop(0.5, p.color + (p.opacity * 0.5) + ")");
      gradient.addColorStop(1, p.color + "0)");

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = p.color + p.opacity + ")";
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const animate = useCallback(() => {
    if (!isVisibleRef.current || prefersReducedRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    draw();
    animFrameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedRef.current = prefersReduced.matches;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (particlesRef.current.length === 0) {
        particlesRef.current = createParticles(canvas.width, canvas.height, count);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    // IntersectionObserver for visibility
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    io.observe(canvas);

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      io.disconnect();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate, count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className ?? ""}`}
      style={{ zIndex: 0 }}
    />
  );
}
