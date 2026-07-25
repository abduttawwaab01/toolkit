"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Grid, List, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { MediaItem } from "./media-item";
import { MediaUpload } from "./media-upload";
import { useMediaLibrary } from "./hooks/use-media-library";
import { useMediaUpload } from "./hooks/use-media-upload";
import type { MediaItem as MediaItemType } from "@/types/media";

interface MediaGridProps {
  userId?: string;
  onAddToTimeline?: (item: MediaItemType) => void;
}

/**
 * Media Library — the main asset browser.
 * Supports:
 * - Grid / list toggle
 * - Search & type filter
 * - Drag-and-drop upload with progress
 * - Delete items
 * - Drag items to timeline
 */
export function MediaGrid({ userId, onAddToTimeline }: MediaGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { items, loading, error, search, setSearch, refresh, deleteItem } = useMediaLibrary({
    userId,
    type: typeFilter === "all" ? undefined : (typeFilter as any),
  });
  const { uploads, uploadFile, cancelUpload } = useMediaUpload();
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);

  const handleUpload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        await uploadFile(file, userId);
      }
      refresh();
    },
    [userId, uploadFile, refresh],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteItem(id);
      if (selectedItem?.id === id) setSelectedItem(null);
    },
    [deleteItem, selectedItem],
  );

  const filteredItems = items;

  return (
    <div className="flex flex-col h-full">
      {/* Upload area */}
      <div className="p-3 shrink-0">
        <MediaUpload onUpload={handleUpload} uploads={uploads} onCancelUpload={cancelUpload} />
      </div>

      {/* Search + filters */}
      <div className="px-3 pb-2 shrink-0 space-y-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-neon-cyan/30"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {["all", "video", "audio", "image"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                  typeFilter === t
                    ? "bg-neon-cyan/10 text-neon-cyan"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "text-neon-cyan" : "text-text-tertiary"}`}
            >
              <Grid size={12} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "text-neon-cyan" : "text-text-tertiary"}`}
            >
              <List size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="text-neon-cyan animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={24} className="text-neon-pink mb-2" />
            <p className="text-xs text-text-secondary">{error}</p>
            <button onClick={refresh} className="text-[11px] text-neon-cyan hover:underline mt-2">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen size={28} className="text-text-tertiary mb-2" />
            <p className="text-xs text-text-tertiary">No media yet</p>
            <p className="text-[10px] text-text-tertiary mt-1">Upload video, audio, or images above</p>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-2"
                : "space-y-1"
            }
          >
            {filteredItems.map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onSelect={setSelectedItem}
                onAddToTimeline={onAddToTimeline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
