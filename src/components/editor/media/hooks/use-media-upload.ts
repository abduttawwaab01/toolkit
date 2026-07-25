"use client";

import { useState, useCallback, useRef } from "react";
import type { UploadProgress } from "@/types/media";

/**
 * Handles file upload to the ToolKit API.
 * Manages progress tracking, multiple concurrent uploads,
 * and error handling.
 */
export function useMediaUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const activeRef = useRef<Map<string, AbortController>>(new Map());

  const uploadFile = useCallback(
    async (file: File, userId?: string): Promise<UploadProgress> => {
      const fileId = crypto.randomUUID();
      const entry: UploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      };
      setUploads((prev) => [...prev, entry]);

      const controller = new AbortController();
      activeRef.current.set(fileId, controller);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (userId) formData.append("userId", userId);

        const xhr = new XMLHttpRequest();

        const result = await new Promise<{ id: string; url: string }>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((u) => (u.fileId === fileId ? { ...u, progress: pct } : u)),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.error || "Upload failed"));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload cancelled"));

          xhr.open("POST", "/api/media/upload");
          controller.signal.addEventListener("abort", () => xhr.abort());
          xhr.send(formData);
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId
              ? { ...u, progress: 100, status: "complete" as const }
              : u,
          ),
        );

        // Remove from active after short delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
          activeRef.current.delete(fileId);
        }, 4000);

        return { ...entry, progress: 100, status: "complete" };
      } catch (err: any) {
        const errorEntry: UploadProgress = {
          ...entry,
          status: "error",
          error: err.message || "Upload failed",
        };
        setUploads((prev) => prev.map((u) => (u.fileId === fileId ? errorEntry : u)));
        activeRef.current.delete(fileId);
        return errorEntry;
      }
    },
    [],
  );

  const cancelUpload = useCallback((fileId: string) => {
    const controller = activeRef.current.get(fileId);
    controller?.abort();
    setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
    activeRef.current.delete(fileId);
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading"));
  }, []);

  return { uploads, uploadFile, cancelUpload, clearCompleted };
}
