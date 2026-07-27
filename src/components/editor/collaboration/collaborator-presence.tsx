"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, User } from "lucide-react";

interface Collaborator {
  userId: string;
  name: string | null;
  playhead: number;
}

interface Props {
  projectId: string;
  currentUserId: string;
}

export function CollaboratorPresence({ projectId, currentUserId }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`/api/sync?projectId=${projectId}`, {
        headers: { "x-session-id": currentUserId },
      });
      if (res.ok) {
        const json = await res.json();
        setCollaborators(json.collaborators || []);
      }
    } catch {
      // silently fail
    }
  }, [projectId, currentUserId]);

  const pingPresence = useCallback(async () => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": currentUserId },
        body: JSON.stringify({ projectId, tracks: [], clips: [], playhead: 0, version: 0 }),
      });
    } catch {
      // silently fail
    }
  }, [projectId, currentUserId]);

  useEffect(() => {
    pingPresence();
    intervalRef.current = setInterval(fetchPresence, 5000);
    const pingInterval = setInterval(pingPresence, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(pingInterval);
    };
  }, [fetchPresence, pingPresence]);

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass border border-border-subtle">
      <Users size={10} className="text-neon-cyan" />
      <div className="flex -space-x-1">
        {collaborators.slice(0, 4).map((c) => (
          <div
            key={c.userId}
            className="size-5 rounded-full glass flex items-center justify-center border border-border-subtle"
            title={`${c.name || "Anonymous"} at ${c.playhead.toFixed(1)}s`}
          >
            <User size={8} className="text-text-secondary" />
          </div>
        ))}
      </div>
      <span className="text-[8px] text-text-tertiary">{collaborators.length} online</span>
    </div>
  );
}
