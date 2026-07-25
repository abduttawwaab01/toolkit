"use client";

import { motion } from "framer-motion";
import { Github, Twitter, Youtube, Mail, Heart, Zap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const footerLinks = {
  Product: ["Features", "AI Studio", "Pricing", "Changelog", "Roadmap"],
  Resources: ["Documentation", "API Reference", "Tutorials", "Community", "Status"],
  Company: ["About", "Blog", "Careers", "Press", "Contact"],
  Legal: ["Privacy", "Terms", "Cookies", "Licenses", "GDPR"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border-subtle py-16 md:py-20">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-10" />

      <div className="section-padding max-width-container relative">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <motion.a href="/" className="text-xl font-bold font-display gradient-text inline-flex items-center gap-2 mb-4" whileHover={{ scale: 1.05 }}>
              <Zap size={18} />
              {APP_NAME}
            </motion.a>
            <p className="text-sm text-text-tertiary leading-relaxed mb-4">
              The world&apos;s most advanced AI-powered video and audio editing platform.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Youtube, Mail].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ scale: 1.1, y: -2 }}
                  className="glass rounded-lg p-2 text-text-secondary hover:text-neon-cyan transition-colors">
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-tertiary hover:text-neon-cyan transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p className="text-xs text-text-tertiary flex items-center gap-1">
            Made with <Heart size={10} className="text-neon-pink" /> by the {APP_NAME} team
          </p>
        </div>
      </div>
    </footer>
  );
}
