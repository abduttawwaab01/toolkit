"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CreditBalance } from "@/components/credits/credit-balance";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-surface/80 backdrop-blur-xl border-b border-border-subtle"
          : "bg-transparent",
      )}
    >
      <div className="section-padding max-width-container flex items-center justify-between h-16 md:h-20">
        <motion.a
          href="/"
          className="flex items-center gap-2 text-xl font-bold font-display"
          whileHover={{ scale: 1.05 }}
        >
          <Zap size={20} className="text-neon-cyan" />
          <span className="gradient-text">{APP_NAME}</span>
        </motion.a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors relative group"
              whileHover={{ y: -1 }}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-neon-cyan group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <CreditBalance compact />
          <ThemeToggle />
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="neon" size="sm">Try Free</Button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-deep border-t border-border-subtle overflow-hidden"
          >
            <div className="section-padding py-4 space-y-4">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                   className="block text-text-secondary hover:text-text-primary transition-colors">
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <CreditBalance compact />
                <ThemeToggle />
                <Button variant="ghost" size="sm" className="flex-1">Sign In</Button>
                <Button variant="neon" size="sm" className="flex-1">Try Free</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
