/**
 * Client-side service for project collaboration (share, comments, presence, activity).
 */

export interface Collaborator {
  id: string;
  userId: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timeCode: number | null;
  resolved: boolean;
  parentId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
  replies?: Comment[];
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: any;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

export interface Presence {
  id: string;
  userId: string;
  projectId: string | null;
  lastActive: string;
  cursorPos: any;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

// ─── Collaborators ───

export async function listCollaborators(projectId: string): Promise<Collaborator[]> {
  const res = await fetch(`/api/collaboration/share?projectId=${projectId}`);
  if (!res.ok) throw new Error("Failed to load collaborators");
  const data = await res.json();
  return data.collaborators || [];
}

export async function inviteCollaborator(projectId: string, email: string, role = "editor"): Promise<Collaborator> {
  const res = await fetch("/api/collaboration/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Invite failed" }));
    throw new Error(err.error || "Invite failed");
  }
  const data = await res.json();
  return data.collaborator;
}

export async function removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
  const res = await fetch(`/api/collaboration/share?projectId=${projectId}&collaboratorId=${collaboratorId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove collaborator");
}

export async function toggleProjectSharing(projectId: string, isShared: boolean): Promise<{ shareLink: string | null }> {
  const res = await fetch("/api/collaboration/share", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, isShared }),
  });
  if (!res.ok) throw new Error("Failed to update sharing");
  const data = await res.json();
  return { shareLink: data.project.shareLink };
}

// ─── Comments ───

export async function listComments(projectId: string): Promise<Comment[]> {
  const res = await fetch(`/api/collaboration/comments?projectId=${projectId}`);
  if (!res.ok) throw new Error("Failed to load comments");
  const data = await res.json();
  return data.comments || [];
}

export async function addComment(projectId: string, content: string, timeCode?: number, parentId?: string): Promise<Comment> {
  const res = await fetch("/api/collaboration/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, content, timeCode, parentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Comment failed" }));
    throw new Error(err.error || "Comment failed");
  }
  const data = await res.json();
  return data.comment;
}

export async function resolveComment(commentId: string, resolved = true): Promise<void> {
  const res = await fetch("/api/collaboration/comments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commentId, resolved }),
  });
  if (!res.ok) throw new Error("Failed to update comment");
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`/api/collaboration/comments?commentId=${commentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete comment");
}

// ─── Presence ───

export async function getPresence(projectId: string): Promise<Presence[]> {
  const res = await fetch(`/api/collaboration/presence?projectId=${projectId}`);
  if (!res.ok) throw new Error("Failed to load presence");
  const data = await res.json();
  return data.presences || [];
}

export async function updatePresence(projectId: string, cursorPos?: { x: number; y: number }): Promise<void> {
  const res = await fetch("/api/collaboration/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, cursorPos }),
  });
  if (!res.ok) throw new Error("Failed to update presence");
}

export async function clearPresence(): Promise<void> {
  const res = await fetch("/api/collaboration/presence", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear presence");
}

// ─── Activity ───

export async function listActivities(projectId: string, limit = 50): Promise<Activity[]> {
  const res = await fetch(`/api/collaboration/activity?projectId=${projectId}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load activities");
  const data = await res.json();
  return data.activities || [];
}
