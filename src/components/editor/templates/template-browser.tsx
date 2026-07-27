"use client";

import { useState, useMemo } from "react";
import { Layout, Search, Clock, Film, Music, Gamepad2, Briefcase, GraduationCap } from "lucide-react";
import { getAllTemplates, getTemplatesByCategory, templateToProject, type TemplateDefinition } from "@/lib/templates";
import { useEditorStore } from "@/lib/editor-store";

const CATEGORY_ICONS: Record<string, any> = {
  social: Film,
  presentation: Clock,
  music: Music,
  gaming: Gamepad2,
  business: Briefcase,
  education: GraduationCap,
};

const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "social", name: "Social Media" },
  { id: "presentation", name: "Presentations" },
  { id: "music", name: "Music" },
  { id: "gaming", name: "Gaming" },
  { id: "business", name: "Business" },
];

export function TemplateBrowser() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  const setProject = useEditorStore((s) => s.setProject);
  const setTracks = useEditorStore((s: any) => s.setTracks);
  const setClips = useEditorStore((s: any) => s.setClips);

  const templates = useMemo(() => {
    const all = activeCategory === "all" ? getAllTemplates() : getTemplatesByCategory(activeCategory);
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [activeCategory, searchQuery]);

  const applyTemplate = async (template: TemplateDefinition) => {
    setApplying(template.id);
    try {
      const { project, tracks, clips } = templateToProject(template, { TITLE: "Your Title Here" });
      setProject({ id: crypto.randomUUID(), name: project.name, duration: project.duration, fps: project.fps, width: project.width, height: project.height });
      setTracks(tracks);
      setClips(clips);
    } catch {
      // Fallback to basic project
    }
    setTimeout(() => setApplying(null), 500);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Layout size={14} className="text-neon-cyan" />
        <span className="text-[11px] font-medium text-text-primary">Templates</span>
      </div>

      <div className="px-3">
        <div className="flex items-center gap-1.5 glass rounded-lg px-2 py-1.5 border border-border-subtle">
          <Search size={10} className="text-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 bg-transparent text-[10px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-1 px-3 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-2 py-1 rounded-lg text-[9px] transition-all ${
              activeCategory === cat.id
                ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                : "glass text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {templates.length === 0 ? (
          <p className="text-[9px] text-text-tertiary text-center py-4">No templates found</p>
        ) : (
          templates.map((template) => {
            const CatIcon = CATEGORY_ICONS[template.category] || Layout;
            return (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                disabled={applying === template.id}
                className="w-full glass rounded-lg p-2 border border-border-subtle hover:border-neon-cyan/20 transition-all text-left group"
              >
                <div className="flex items-start gap-2">
                  <div className="size-8 rounded-lg glass flex items-center justify-center shrink-0">
                    <CatIcon size={14} className="text-neon-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-text-primary truncate">{template.name}</span>
                      {template.platform && (
                        <span className="text-[7px] px-1 py-0.5 rounded glass text-text-tertiary">{template.platform}</span>
                      )}
                    </div>
                    <p className="text-[8px] text-text-tertiary line-clamp-1">{template.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[7px] text-text-tertiary">{template.duration}s</span>
                      <span className="text-[7px] text-text-tertiary">{template.width}x{template.height}</span>
                      <span className="text-[7px] text-text-tertiary">{template.tracks.length} tracks</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded ${applying === template.id ? "bg-neon-cyan/20 text-neon-cyan" : "text-neon-cyan opacity-0 group-hover:opacity-100"} transition-all`}>
                    {applying === template.id ? "Applied!" : "Use"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
