"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { listActivities, Activity } from "@/lib/ai/collaboration";
import { History, MessageSquare, UserPlus, Settings, Edit3, Trash2 } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  commented: <MessageSquare size={10} className="text-neon-cyan" />,
  invited: <UserPlus size={10} className="text-neon-green" />,
  removed: <Trash2 size={10} className="text-red-400" />,
  edited: <Edit3 size={10} className="text-neon-orange" />,
  updated: <Settings size={10} className="text-neon-purple" />,
};

const ACTION_LABELS: Record<string, string> = {
  commented: "commented",
  invited: "invited",
  removed: "removed",
  edited: "edited",
  updated: "updated",
};

export function ActivityLog() {
  const { project } = useEditorStore();
  const projectId = project?.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    listActivities(projectId, 30).then((a) => {
      setActivities(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  // Poll for new activities every 10s
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(() => {
      listActivities(projectId, 30).then(setActivities).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-[9px] text-text-tertiary animate-pulse">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <History size={20} className="text-text-tertiary mx-auto mb-2" />
        <p className="text-[9px] text-text-tertiary">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2 py-1.5">
          <div className="mt-0.5 shrink-0">
            {ACTION_ICONS[activity.action] || <Edit3 size={10} className="text-text-tertiary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-text-secondary leading-relaxed">
              <span className="text-text-primary font-medium">
                {activity.user.name || activity.user.email || "Unknown"}
              </span>
              {" "}
              {ACTION_LABELS[activity.action] || activity.action}
              {activity.entity && (
                <span className="text-text-tertiary"> a {activity.entity}</span>
              )}
            </p>
            <p className="text-[8px] text-text-tertiary mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
