"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/types/media";

interface UseMediaLibraryOptions {
  userId?: string;
  type?: "video" | "audio" | "image";
}

/**
 * Fetches media files from the API and provides
 * refresh, filter, and delete capabilities.
 */
export function useMediaLibrary({ userId, type }: UseMediaLibraryOptions = {}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId });
      if (type) params.set("type", type);
      if (search) params.set("search", search);

      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error("Failed to fetch media");

      const data = await res.json();
      setItems(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, type, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(
    async (id: string) => {
      const res = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: id, userId }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [userId],
  );

  return { items, loading, error, search, setSearch, refresh: fetchItems, deleteItem };
}
