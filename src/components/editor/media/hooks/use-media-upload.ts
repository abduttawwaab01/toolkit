"use client";

import { useState, useCallback, useRef } from "react";
import type { UploadProgress } from "@/types/media";

const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;

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

      // ─── Guest path: client-only, no server upload ───
      if (isGuest) {
        const blobUrl = URL.createObjectURL(file);
        const complete: UploadProgress = {
          ...entry, progress: 100, status: "complete",
          localUrl: blobUrl, blobUrl, file,
        };
        updateProgress(fileId, { progress: 100, status: "complete", localUrl: blobUrl, blobUrl, file });
        setTimeout(() => setUploads((prev) => prev.filter((u) => u.fileId !== fileId)), 4000);
        return complete;
      }

      const controller = new AbortController();
      activeRef.current.set(fileId, controller);

      try {
        let result: { id: string; url: string };

        if (file.size > LARGE_FILE_THRESHOLD) {
          // ─── Presigned URL path (large files) ───
          const urlRes = await fetch("/api/media/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              userId,
            }),
          });
          if (!urlRes.ok) {
            const errData = await urlRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to get upload URL");
          }
          const { uploadUrl, id, publicUrl } = await urlRes.json();

          // Upload directly to R2 via XHR with progress
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateProgress(fileId, { progress: Math.round((e.loaded / e.total) * 100) });
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Direct upload failed (HTTP ${xhr.status})`));
            };
            xhr.onerror = () => reject(new Error("Network error during direct upload"));
            xhr.onabort = () => reject(new Error("Upload cancelled"));
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.setRequestHeader("Content-Length", String(file.size));
            controller.signal.addEventListener("abort", () => xhr.abort());
            xhr.send(file);
          });

          result = { id, url: publicUrl || uploadUrl.split("?")[0] };
        } else {
          // ─── Server proxy path (small files) ───
          const formData = new FormData();
          formData.append("file", file);
          if (userId) formData.append("userId", userId);

          result = await new Promise<{ id: string; url: string }>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateProgress(fileId, { progress: Math.round((e.loaded / e.total) * 100) });
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                if (data.error) reject(new Error(data.error));
                else resolve(data);
              } else {
                try { reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed")); }
                catch { reject(new Error(`Upload failed (HTTP ${xhr.status})`)); }
              }
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.onabort = () => reject(new Error("Upload cancelled"));
            xhr.open("POST", "/api/media/upload");
            controller.signal.addEventListener("abort", () => xhr.abort());
            xhr.send(formData);
          });
        }

        const complete: UploadProgress = {
          ...entry, progress: 100, status: "complete",
          localUrl: result.url, blobUrl: result.url, file,
        };
        updateProgress(fileId, { progress: 100, status: "complete", localUrl: result.url, blobUrl: result.url, file });
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
          activeRef.current.delete(fileId);
        }, 4000);
        return complete;
      } catch (err: any) {
        const errorEntry: UploadProgress = {
          ...entry, status: "error", error: err.message || "Upload failed",
        };
        updateProgress(fileId, { status: "error", error: err.message || "Upload failed" });
        activeRef.current.delete(fileId);
        return errorEntry;
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
