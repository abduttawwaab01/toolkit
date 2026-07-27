"use client";

import { useState, useCallback, useRef } from "react";
import type { UploadProgress } from "@/types/media";

/**
 * Upload hook — always uses presigned R2 URLs for direct upload,
 * so zero bytes pass through Vercel's servers.
 *
 * Guest users get client-side blob URLs only (no server storage).
 */
export function useMediaUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const activeRef = useRef<Map<string, AbortController>>(new Map());

  const updateProgress = useCallback((fileId: string, patch: Partial<UploadProgress>) => {
    setUploads((prev) => prev.map((u) => (u.fileId === fileId ? { ...u, ...patch } : u)));
  }, []);

  const uploadFile = useCallback(
    async (file: File, userId?: string, isGuest?: boolean): Promise<UploadProgress> => {
      const fileId = crypto.randomUUID();
      const entry: UploadProgress = { fileId, fileName: file.name, progress: 0, status: "uploading" };
      setUploads((prev) => [...prev, entry]);

      // ─── Guest path: client-only blob URL, zero server traffic ───
      if (isGuest) {
        const blobUrl = URL.createObjectURL(file);
        updateProgress(fileId, { progress: 100, status: "complete", localUrl: blobUrl, blobUrl, file });
        setTimeout(() => setUploads((prev) => prev.filter((u) => u.fileId !== fileId)), 4000);
        return { ...entry, progress: 100, status: "complete", localUrl: blobUrl, blobUrl, file };
      }

      const controller = new AbortController();
      activeRef.current.set(fileId, controller);

      try {
        // ─── Step 1: Get presigned upload URL from R2 (metadata only via Vercel) ───
        const urlRes = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            contentType: file.type,
            size: file.size,
            userId,
          }),
        });
        if (!urlRes.ok) {
          const errData = await urlRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get upload URL");
        }
        const { uploadUrl, id, publicUrl } = await urlRes.json();

        // ─── Step 2: Upload file directly to R2 (zero bytes through Vercel) ───
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              updateProgress(fileId, { progress: Math.round((e.loaded / e.total) * 100) });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload cancelled"));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          controller.signal.addEventListener("abort", () => xhr.abort());
          xhr.send(file);
        });

        const result = { id, url: publicUrl || uploadUrl.split("?")[0] };

        updateProgress(fileId, { progress: 100, status: "complete", localUrl: result.url, blobUrl: result.url, file });
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
          activeRef.current.delete(fileId);
        }, 4000);
        return { ...entry, progress: 100, status: "complete", localUrl: result.url, blobUrl: result.url, file };
      } catch (err: any) {
        updateProgress(fileId, { status: "error", error: err.message || "Upload failed" });
        activeRef.current.delete(fileId);
        return { ...entry, status: "error", error: err.message || "Upload failed" };
      }
    },
    [updateProgress],
  );

  const cancelUpload = useCallback((fileId: string) => {
    activeRef.current.get(fileId)?.abort();
    setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
    activeRef.current.delete(fileId);
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading"));
  }, []);

  return { uploads, uploadFile, cancelUpload, clearCompleted };
}
