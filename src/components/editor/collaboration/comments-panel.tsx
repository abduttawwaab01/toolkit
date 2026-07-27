"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import {
  listComments,
  addComment,
  resolveComment,
  deleteComment,
  Comment,
} from "@/lib/ai/collaboration";
import { MessageSquare, Send, Check, Trash2, Clock, ChevronDown, ChevronRight } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTimeCode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CommentsPanel() {
  const toast = useToast();
  const { project, playhead } = useEditorStore();
  const projectId = project?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [includeTimecode, setIncludeTimecode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;
    listComments(projectId).then((c) => {
      setComments(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  // Poll for new comments every 5s
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(() => {
      listComments(projectId).then(setComments).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleAddComment = useCallback(async () => {
    if (!projectId || !newComment.trim()) return;
    try {
      const comment = await addComment(projectId, newComment.trim(), includeTimecode ? playhead : undefined);
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      toast.success("Comment added", includeTimecode ? `at ${formatTimeCode(playhead)}` : "");
    } catch (error: any) {
      toast.error("Failed", error.message);
    }
  }, [projectId, newComment, includeTimecode, playhead, toast]);

  const handleResolve = useCallback(async (commentId: string, resolved: boolean) => {
    try {
      await resolveComment(commentId, !resolved);
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, resolved: !resolved } : c));
    } catch (error: any) {
      toast.error("Failed", error.message);
    }
  }, [toast]);

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Deleted", "Comment removed");
    } catch (error: any) {
      toast.error("Failed", error.message);
    }
  }, [toast]);

  const unresolved = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 shrink-0">
        <MessageSquare size={12} className="text-neon-cyan" />
        <span className="text-[10px] font-medium text-text-primary">Comments</span>
        <span className="text-[9px] text-text-tertiary ml-auto">{unresolved.length} open</span>
      </div>

      {/* Comments List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-2 space-y-2">
        {loading ? (
          <p className="text-[9px] text-text-tertiary animate-pulse text-center py-4">Loading comments...</p>
        ) : unresolved.length === 0 && resolved.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare size={20} className="text-text-tertiary mx-auto mb-2" />
            <p className="text-[9px] text-text-tertiary">No comments yet</p>
          </div>
        ) : (
          <>
            {unresolved.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onResolve={() => handleResolve(comment.id, comment.resolved)}
                onDelete={() => handleDelete(comment.id)}
                onTimestampClick={(time) => useEditorStore.getState().setPlayhead(time)}
              />
            ))}
            {resolved.length > 0 && (
              <div>
                <button onClick={() => setShowResolved(!showResolved)}
                  className="flex items-center gap-1 text-[9px] text-text-tertiary hover:text-text-primary transition-colors mb-1">
                  {showResolved ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  Resolved ({resolved.length})
                </button>
                {showResolved && resolved.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onResolve={() => handleResolve(comment.id, comment.resolved)}
                    onDelete={() => handleDelete(comment.id)}
                    onTimestampClick={(time) => useEditorStore.getState().setPlayhead(time)}
                    resolved
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Comment Input */}
      <div className="px-3 pb-3 pt-1 shrink-0 border-t border-border-subtle">
        <div className="flex items-center gap-1 mb-1.5">
          <button onClick={() => setIncludeTimecode(!includeTimecode)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] transition-colors ${
              includeTimecode ? "bg-neon-cyan/15 text-neon-cyan" : "text-text-tertiary hover:text-text-primary"
            }`}>
            <Clock size={8} />
            {includeTimecode ? formatTimeCode(playhead) : "Add timecode"}
          </button>
        </div>
        <div className="flex gap-1">
          <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Add a comment..."
            className="flex-1 glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50" />
          <button onClick={handleAddComment} disabled={!newComment.trim()}
            className="size-8 glass rounded-lg flex items-center justify-center text-text-secondary hover:text-neon-cyan transition-colors disabled:opacity-50">
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onResolve,
  onDelete,
  onTimestampClick,
  resolved = false,
}: {
  comment: Comment;
  onResolve: () => void;
  onDelete: () => void;
  onTimestampClick: (time: number) => void;
  resolved?: boolean;
}) {
  return (
    <div className={`glass rounded-xl px-2.5 py-2 ${resolved ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="size-5 rounded-full bg-neon-cyan/20 flex items-center justify-center text-[8px] text-neon-cyan font-bold shrink-0 mt-0.5">
          {comment.user.name?.[0] || comment.user.email?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-text-primary font-medium">{comment.user.name || comment.user.email}</span>
            <span className="text-[8px] text-text-tertiary">{formatTimeAgo(comment.createdAt)}</span>
            {comment.timeCode != null && (
              <button onClick={() => onTimestampClick(comment.timeCode!)}
                className="flex items-center gap-0.5 text-[8px] text-neon-cyan hover:underline">
                <Clock size={7} /> {formatTimeCode(comment.timeCode)}
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onResolve}
            className={`transition-colors ${comment.resolved ? "text-neon-green" : "text-text-tertiary hover:text-neon-green"}`}>
            <Check size={10} />
          </button>
          <button onClick={onDelete} className="text-text-tertiary hover:text-red-400 transition-colors">
            <Trash2 size={9} />
          </button>
        </div>
      </div>
    </div>
  );
}
