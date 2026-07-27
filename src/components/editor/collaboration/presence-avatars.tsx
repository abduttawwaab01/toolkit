"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { getPresence, updatePresence, clearPresence, Presence } from "@/lib/ai/collaboration";
import { Users } from "lucide-react";

export function PresenceAvatars() {
  const { project } = useEditorStore();
  const projectId = project?.id;
  const [presences, setPresences] = useState<Presence[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll presence every 5 seconds
  useEffect(() => {
    if (!projectId) return;

    // Update own presence immediately
    updatePresence(projectId).catch(() => {});

    intervalRef.current = setInterval(() => {
      getPresence(projectId).then(setPresences).catch(() => {});
      updatePresence(projectId).catch(() => {});
    }, 5000);

    // Initial load
    getPresence(projectId).then(setPresences).catch(() => {});

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearPresence().catch(() => {});
    };
  }, [projectId]);

  if (presences.length === 0) return null;

  const colors = ["bg-neon-cyan", "bg-neon-pink", "bg-neon-orange", "bg-neon-green", "bg-neon-purple", "bg-amber-400"];

  return (
    <div className="flex items-center gap-1.5">
      <Users size={10} className="text-text-tertiary" />
      <div className="flex -space-x-1.5">
        {presences.slice(0, 5).map((p, i) => (
          <div key={p.userId}
            title={p.user.name || p.user.email || "Unknown"}
            className={`size-5 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-[8px] text-white font-bold border-2 border-surface-primary`}
            style={{ zIndex: 5 - i }}>
            {p.user.name?.[0] || p.user.email?.[0] || "?"}
          </div>
        ))}
      </div>
      {presences.length > 5 && (
        <span className="text-[8px] text-text-tertiary">+{presences.length - 5}</span>
      )}
    </div>
  );
}
