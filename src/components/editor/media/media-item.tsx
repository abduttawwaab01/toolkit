"use client";

import { useCallback, useRef, useState } from "react";
import { FileVideo, FileAudio, FileImage, Clock, Trash2, Play } from "lucide-react";
import { cn, formatBytes, formatDuration } from "@/lib/utils";
import type { MediaItem as MediaItemType } from "@/types/media";

interface MediaItemProps {
  item: MediaItemType;
  onDelete?: (id: string) => void;
  onSelect?: (item: MediaItemType) => void;
  onAddToTimeline?: (item: MediaItemType) => void;
  onEditImage?: (url: string) => void;
  onSeparate?: (item: MediaItemType) => void;
}

/**
 * Single media item card in the library grid.
 * Thumbnail (or type icon), filename, duration/size.
 * Drag-to-timeline: sets drag data with the item JSON.
 * Right-click context menu via buttons (mobile-friendly).
 */
export function MediaItem({ item, onDelete, onSelect, onAddToTimeline, onEditImage, onSeparate }: MediaItemProps) {
  const [imgError, setImgError] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("application/json", JSON.stringify(item));
      e.dataTransfer.effectAllowed = "copy";
      if (dragRef.current) {
        dragRef.current.style.opacity = "0.5";
      }
    },
    [item],
  );

  const handleDragEnd = useCallback(() => {
    if (dragRef.current) dragRef.current.style.opacity = "1";
  }, []);

  const handleClick = useCallback(() => {
    onSelect?.(item);
  }, [item, onSelect]);

  const handleDoubleClick = useCallback(() => {
    onAddToTimeline?.(item);
  }, [item, onAddToTimeline]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <FileVideo size={14} className="text-blue-400" />;
      case "audio": return <FileAudio size={14} className="text-emerald-400" />;
      case "image": return <FileImage size={14} className="text-amber-400" />;
      default: return <FileVideo size={14} />;
    }
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "glass rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 group",
        "hover:border-neon-cyan/30 hover:shadow-lg hover:shadow-neon-cyan/5",
      )}
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-surface-secondary relative overflow-hidden flex items-center justify-center">
        {item.thumbnailUrl && !imgError ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : item.type === "audio" ? (
          <div className="flex flex-col items-center gap-1 text-text-tertiary">
            <FileAudio size={28} className="text-emerald-400/50" />
            <span className="text-[9px]">Audio</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-text-tertiary">
            {typeIcon(item.type)}
            <span className="text-[9px] capitalize">{item.type}</span>
          </div>
        )}

        {/* Duration overlay */}
        {item.duration && (
          <div className="absolute bottom-1.5 right-1.5 glass rounded-md px-1.5 py-0.5">
            <span className="text-[9px] font-mono text-text-primary flex items-center gap-1">
              <Play size={8} fill="currentColor" />
              {formatDuration(item.duration)}
            </span>
          </div>
        )}

        {/* Type badge top-left */}
        <div className="absolute top-1.5 left-1.5 glass rounded-md px-1.5 py-0.5">
          <span className="text-[9px] text-text-tertiary uppercase">{item.type}</span>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToTimeline?.(item); }}
            className="glass rounded-lg px-2 py-1.5 text-[10px] text-text-primary hover:bg-glass-heavy transition-colors"
          >
            + Timeline
          </button>
          {item.type === "image" && onEditImage && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditImage(item.url); }}
              className="glass rounded-lg px-2 py-1.5 text-[10px] text-neon-cyan hover:bg-glass-heavy transition-colors"
            >
              Edit
            </button>
          )}
          {item.type === "audio" && onSeparate && (
            <button
              onClick={(e) => { e.stopPropagation(); onSeparate(item); }}
              className="glass rounded-lg px-2 py-1.5 text-[10px] text-neon-purple hover:bg-glass-heavy transition-colors"
            >
              Separate
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
            className="glass rounded-lg p-1.5 text-neon-pink hover:bg-glass-heavy transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="text-[11px] text-text-primary truncate">{item.name}</p>
        <p className="text-[9px] text-text-tertiary mt-0.5">{formatBytes(item.size)}</p>
      </div>
    </div>
  );
}
