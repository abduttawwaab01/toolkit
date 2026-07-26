"use client";

import { useState, useCallback, useRef } from "react";
import type { UploadProgress } from "@/types/media";

export function useMediaUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const activeRef = useRef<Map<string, AbortController>>(new Map());

  const uploadFile = useCallback(
    async (file: File, userId?: string, isGuest?: boolean): Promise<UploadProgress> => {
      const fileId = crypto.randomUUID();
      const entry: UploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      };
      setUploads((prev) => [...prev, entry]);

      if (isGuest) {
        return new Promise<UploadProgress>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const blobUrl = URL.createObjectURL(file);
            const complete: UploadProgress = {
              ...entry,
              progress: 100,
              status: "complete",
              localUrl: dataUrl,
              blobUrl,
              file,
            };
            setUploads((prev) => prev.map((u) => (u.fileId === fileId ? complete : u)));
            setTimeout(() => {
              setUploads((prev) => prev.filter((u) => u.fileId !== fileId));
            }, 4000);
            resolve(complete);
          };
          reader.onerror = () => {
            const err: UploadProgress = { ...entry, status: "error", error: "Failed to read file" };
            setUploads((prev) => prev.map((u) => (u.fileId === fileId ? err : u)));
            resolve(err);
          };
          reader.readAsDataURL(file);
        });
      }

      const controller = new AbortController();
      activeRef.current.set(fileId, controller);

      try {
        // For files over 50MB, use presigned upload URL to bypass server body size limit
        const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;
        let result: { id: string; url: string };

        if (file.size > LARGE_FILE_THRESHOLD) {
          // Step 1: Get presigned upload URL
          const urlRes = await fetch("/api/media/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              projectId: userId,
            }),
          });
          if (!urlRes.ok) {
            const errData = await urlRes.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to get upload URL");
          }
          const { uploadUrl, id } = await urlRes.json();

          // Step 2: Upload directly to R2 with XHR for progress tracking
          const xhr = new XMLHttpRequest();
          await new Promise<void>((resolve, reject) => {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploads((prev) =>
                  prev.map((u) => (u.fileId === fileId ? { ...u, progress: pct } : u)),
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Direct upload failed with status ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error("Network error during direct upload"));
            xhr.onabort = () => reject(new Error("Upload cancelled"));
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            controller.signal.addEventListener("abort", () => xhr.abort());
            xhr.send(file);
          });

          result = { id, url: (await urlRes.json()).publicUrl || uploadUrl.split("?")[0] };
        } else {
          // Small files: upload through server as before
          const formData = new FormData();
          formData.append("file", file);
          if (userId) formData.append("userId", userId);

          const xhr = new XMLHttpRequest();

          result = await new Promise<{ id: string; url: string }>((resolve, reject) => {
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
        }

        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId
              ? { ...u, progress: 100, status: "complete" as const }
              : u,
          ),
        );

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
