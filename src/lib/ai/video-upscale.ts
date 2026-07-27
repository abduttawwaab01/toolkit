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
  options: VideoUpscaleOptions = {},
): Promise<VideoUpscaleResult> {
  const { scale = 4, onProgress } = options;

  onProgress?.(5);

  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("scale", String(scale));

  onProgress?.(10);

  const response = await fetch("/api/ai/upscale-video", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Video upscaling failed: ${response.status}`);
  }

  onProgress?.(95);
  const result = await response.json();
  onProgress?.(100);

  return result.data as VideoUpscaleResult;
}
