"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileType, Code2, FileCode, Download, Eye, Sparkles, Layout, Newspaper, ListChecks, ScrollText, ClipboardList, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { DocumentFormat } from "@/types/document";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  format: DocumentFormat;
  icon: React.ElementType;
  content: string;
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank Document",
    description: "Start with a clean slate",
    category: "General",
    format: "rich",
    icon: FileText,
    content: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
    color: "text-neon-cyan",
  },
  {
    id: "professional-letter",
    name: "Professional Letter",
    description: "Formal business correspondence",
    category: "Business",
    format: "rich",
    icon: ScrollText,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "paragraph", content: [{ type: "text", text: "[Your Name]" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Your Address]" }] },
        { type: "paragraph", content: [{ type: "text", text: "[City, State ZIP]" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "[Date]" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "[Recipient Name]" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Company]" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Address]" }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Dear [Recipient]," }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "I am writing to [purpose of letter]. This letter serves to formally [state your intention or request]." }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "I would appreciate the opportunity to discuss this matter further. Please feel free to contact me at [your phone number] or [your email address]." }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "Thank you for your time and consideration." }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Sincerely," }] },
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "[Your Name]" }] },
      ],
    }),
    color: "text-neon-purple",
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Structured meeting minutes",
    category: "Business",
    format: "rich",
    icon: ClipboardList,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Meeting Notes" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Date: " }, { type: "text", text: "[Date]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Attendees: " }, { type: "text", text: "[Names]" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Topic: " }, { type: "text", text: "[Meeting Topic]" }] },
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Agenda" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 3" }] }] },
        ] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Discussion Points" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Key discussion points]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Action Items" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action 1 - Owner: [Name]" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action 2 - Owner: [Name]" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Action 3 - Owner: [Name]" }] }] },
        ] },
      ],
    }),
    color: "text-neon-pink",
  },
  {
    id: "resume",
    name: "Resume / CV",
    description: "Professional resume template",
    category: "Career",
    format: "rich",
    icon: BookOpen,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "[Your Name]" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Email] | [Phone] | [LinkedIn] | [Portfolio]" }] },
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Professional Summary" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Brief professional summary highlighting your experience and key skills]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Experience" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Job Title" }, { type: "text", text: " | Company Name | Start - End" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Key achievement or responsibility" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Key achievement or responsibility" }] }] },
        ] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Education" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Degree" }, { type: "text", text: " | Institution | Year" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Skills" }] },
        { type: "paragraph", content: [{ type: "text", text: "Skill 1, Skill 2, Skill 3, Skill 4" }] },
      ],
    }),
    color: "text-neon-cyan",
  },
  {
    id: "report",
    name: "Report",
    description: "Professional business report",
    category: "Business",
    format: "rich",
    icon: Layout,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Report Title" }] },
        { type: "paragraph", content: [{ type: "text", text: "Prepared by: [Name]" }] },
        { type: "paragraph", content: [{ type: "text", text: "Date: [Date]" }] },
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Executive Summary" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Brief overview of the report's purpose and key findings]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Introduction" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Background and context]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Findings" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Detailed findings]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conclusion" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Summary and recommendations]" }] },
      ],
    }),
    color: "text-neon-purple",
  },
  {
    id: "blog-post",
    name: "Blog Post",
    description: "Ready-to-write blog structure",
    category: "Writing",
    format: "rich",
    icon: Newspaper,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Blog Post Title" }] },
        { type: "paragraph", content: [{ type: "text", text: "By [Author Name] | [Date]" }] },
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Introduction" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Hook your readers with an engaging opening paragraph]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section 1" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Main content for section 1]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section 2" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Main content for section 2]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conclusion" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Summarize and include a call to action]" }] },
      ],
    }),
    color: "text-neon-pink",
  },
  {
    id: "todo-list",
    name: "To-Do List",
    description: "Track tasks and priorities",
    category: "Productivity",
    format: "rich",
    icon: ListChecks,
    content: JSON.stringify({
      type: "doc", content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "To-Do List" }] },
        { type: "paragraph", content: [{ type: "text", text: "[Date]" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Today" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Task 1" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Task 2" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Task 3" }] }] },
        ] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "This Week" }] },
        { type: "taskList", content: [
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Week task 1" }] }] },
          { type: "taskItem", attrs: { checked: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "Week task 2" }] }] },
        ] },
      ],
    }),
    color: "text-neon-cyan",
  },
];

interface DocumentTemplatesProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function DocumentTemplates({ onSelect, onClose }: DocumentTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", ...new Set(TEMPLATES.map((t) => t.category))];

  const filtered = selectedCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassCard className="w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 flex items-center justify-center">
              <Layout className="size-5 text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-text-primary">Document Templates</h2>
              <p className="text-xs text-text-tertiary">Choose a template to get started quickly</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-glass-medium transition-colors">
            <Eye className="size-4" />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-border-subtle/50 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                  : "bg-glass-light border border-border-subtle text-text-secondary hover:bg-glass-medium hover:text-text-primary",
              )}
            >
              {cat === "All" ? <><Sparkles className="size-3 inline mr-1" />All</> : cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => {
              const Icon = template.icon;
              return (
                <motion.button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group text-left rounded-xl border border-border-subtle bg-glass-light hover:bg-glass-heavy hover:border-neon-cyan/30 p-5 transition-all duration-300"
                >
                  <div className={cn("size-10 rounded-lg bg-glass-medium flex items-center justify-center mb-3", template.color)}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">{template.name}</h3>
                  <p className="text-xs text-text-tertiary leading-relaxed">{template.description}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-glass-medium text-text-tertiary">{template.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-glass-medium text-text-tertiary capitalize">{template.format}</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export type { Template };
