"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import {
  listCollaborators,
  inviteCollaborator,
  removeCollaborator,
  toggleProjectSharing,
  Collaborator,
} from "@/lib/ai/collaboration";
import { Share2, Link2, Copy, Trash2, UserPlus, Check, X, Users } from "lucide-react";

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { project } = useEditorStore();
  const projectId = project?.id;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [isShared, setIsShared] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    listCollaborators(projectId).then((c) => {
      setCollaborators(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  const handleToggleShare = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await toggleProjectSharing(projectId, !isShared);
      setIsShared(!isShared);
      setShareLink(result.shareLink);
    } catch (error: any) {
      toast.error("Failed", error.message);
    }
  }, [projectId, isShared, toast]);

  const handleInvite = useCallback(async () => {
    if (!projectId || !email.trim()) return;
    setInviting(true);
    try {
      const collab = await inviteCollaborator(projectId, email.trim(), role);
      setCollaborators((prev) => [...prev, collab]);
      setEmail("");
      toast.success("Invited", `${email} has been added as a collaborator`);
    } catch (error: any) {
      toast.error("Invite failed", error.message);
    } finally {
      setInviting(false);
    }
  }, [projectId, email, role, toast]);

  const handleRemove = useCallback(async (collaboratorId: string) => {
    if (!projectId) return;
    try {
      await removeCollaborator(projectId, collaboratorId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorId));
      toast.success("Removed", "Collaborator removed");
    } catch (error: any) {
      toast.error("Failed", error.message);
    }
  }, [projectId, toast]);

  const handleCopyLink = useCallback(() => {
    if (!shareLink) return;
    const url = `${window.location.origin}/editor?share=${shareLink}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied", "Share link copied to clipboard");
  }, [shareLink, toast]);

  if (!projectId) return null;

  const fullShareLink = shareLink ? `${window.location.origin}/editor?share=${shareLink}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-md mx-4 p-5 border border-border-subtle" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-neon-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">Share Project</h3>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Share Toggle */}
        <div className="flex items-center justify-between mb-4 glass rounded-xl px-3 py-2.5">
          <div>
            <p className="text-[11px] text-text-primary font-medium">Anyone with the link</p>
            <p className="text-[9px] text-text-tertiary">Allow anyone with the link to view this project</p>
          </div>
          <button onClick={handleToggleShare}
            className={`w-10 h-5 rounded-full transition-all ${isShared ? "bg-neon-cyan" : "bg-surface-tertiary"}`}>
            <div className={`size-4 rounded-full bg-white shadow transition-transform ${isShared ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Share Link */}
        {isShared && shareLink && (
          <div className="mb-4">
            <label className="text-[9px] text-text-tertiary block mb-1">Share Link</label>
            <div className="flex gap-1">
              <input value={fullShareLink} readOnly
                className="flex-1 glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-secondary font-mono border border-border-subtle" />
              <button onClick={handleCopyLink}
                className="size-8 glass rounded-lg flex items-center justify-center text-text-secondary hover:text-neon-cyan transition-colors">
                {copied ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}

        {/* Invite Collaborator */}
        <div className="mb-4">
          <label className="text-[9px] text-text-tertiary block mb-1">Invite by Email</label>
          <div className="flex gap-1">
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@email.com"
              type="email"
              className="flex-1 glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50" />
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="glass rounded-lg px-2 py-1.5 text-[9px] text-text-secondary border border-border-subtle appearance-none">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button onClick={handleInvite} disabled={inviting || !email.trim()}
              className="size-8 glass rounded-lg flex items-center justify-center text-text-secondary hover:text-neon-cyan transition-colors disabled:opacity-50">
              <UserPlus size={12} />
            </button>
          </div>
        </div>

        {/* Collaborators List */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={12} className="text-text-tertiary" />
            <span className="text-[9px] text-text-tertiary font-medium">Collaborators ({collaborators.length})</span>
          </div>
          {loading ? (
            <p className="text-[9px] text-text-tertiary animate-pulse">Loading...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-[9px] text-text-tertiary">No collaborators yet</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {collaborators.map((c) => (
                <div key={c.userId} className="flex items-center gap-2 glass rounded-lg px-2.5 py-1.5">
                  <div className="size-6 rounded-full bg-neon-cyan/20 flex items-center justify-center text-[9px] text-neon-cyan font-bold shrink-0">
                    {c.user.name?.[0] || c.user.email?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-text-primary truncate">{c.user.name || c.user.email}</p>
                    <p className="text-[8px] text-text-tertiary">{c.role}</p>
                  </div>
                  <button onClick={() => handleRemove(c.userId)}
                    className="text-text-tertiary hover:text-red-400 transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
