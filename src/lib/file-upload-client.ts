"use client";

/**
 * Uploads a file directly to R2 via presigned URL (zero bytes through Vercel)
 * and returns the storage key and public URL.
 *
 * Usage: uploadToR2(file, userId).then(({ key, url }) => ...)
 */
export async function uploadToR2(
  file: File | Blob,
  userId: string,
  fileName?: string,
): Promise<{ key: string; url: string; id: string }> {
  const name = fileName || (file instanceof File ? file.name : "file.bin");

  // Step 1: Get presigned URL (metadata only via Vercel)
  const res = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      userId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to get upload URL" }));
    throw new Error(err.error || `Upload preparation failed (HTTP ${res.status})`);
  }

  const { uploadUrl, id, key, publicUrl } = await res.json();

  // Step 2: Upload file directly to R2 (zero bytes through Vercel)
  const xhr = new XMLHttpRequest();
  await new Promise<void>((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during R2 upload"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });

  return { key, url: publicUrl || uploadUrl.split("?")[0], id };
}
