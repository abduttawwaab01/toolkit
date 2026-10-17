/**
 * Client-side AI video upscaling service.
 * Uses Real-ESRGAN via Replicate.
 */

export interface VideoUpscaleResult {
  video: string; // base64 data URI
  scale: number;
}

export interface VideoUpscaleOptions {
  scale?: 2 | 4;
  onProgress?: (progress: number) => void;
}

/**
 * Upscale a video using AI (Real-ESRGAN).
 */
export async function upscaleVideoAI(
  videoFile: File,
  userId: string | undefined,
  options: VideoUpscaleOptions = {},
): Promise<VideoUpscaleResult> {
  const { scale = 4, onProgress } = options;

  onProgress?.(5);

  let response: Response;

  if (userId) {
    const { uploadToR2 } = await import("@/lib/file-upload-client");
    const { key } = await uploadToR2(videoFile, userId);
    onProgress?.(10);
    response = await fetch("/api/ai/upscale-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key: key, scale: String(scale) }),
    });
  } else {
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("scale", String(scale));
    onProgress?.(10);
    response = await fetch("/api/ai/upscale-video", {
      method: "POST",
      body: formData,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Video upscaling failed: ${response.status}`);
  }

  onProgress?.(95);
  const result = await response.json();
  onProgress?.(100);

  return result.data as VideoUpscaleResult;
}
