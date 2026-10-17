/**
 * Client-side AI object removal service.
 * Uses LaMa inpainting via Replicate — user paints a mask over objects to remove.
 */

export interface ObjectRemovalResult {
  image: string; // base64 data URI of the result
  format: string;
}

export interface ObjectRemovalOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Remove objects from an image using AI inpainting.
 * Requires both the original image and a mask (white = remove, black = keep).
 */
export async function removeObjectAI(
  imageFile: File,
  maskBlob: Blob,
  userId: string | undefined,
  options: ObjectRemovalOptions = {},
): Promise<ObjectRemovalResult> {
  const { onProgress } = options;

  onProgress?.(5);

  let response: Response;

  if (userId) {
    const { uploadToR2 } = await import("@/lib/file-upload-client");
    const [imageKey, maskKey] = await Promise.all([
      uploadToR2(imageFile, userId),
      uploadToR2(new File([maskBlob], "mask.png", { type: "image/png" }), userId),
    ]);
    onProgress?.(10);
    response = await fetch("/api/ai/remove-object", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key: imageKey.key, maskR2Key: maskKey.key }),
    });
  } else {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("mask", maskBlob, "mask.png");
    onProgress?.(10);
    response = await fetch("/api/ai/remove-object", {
      method: "POST",
      body: formData,
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Object removal failed: ${response.status}`);
  }

  onProgress?.(95);
  const result = await response.json();
  onProgress?.(100);

  return result.data as ObjectRemovalResult;
}

/**
 * Create a mask Blob from canvas pixel data.
 * The mask canvas should have white (#fff) where objects are marked for removal.
 */
export function maskCanvasToBlob(maskCanvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    maskCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create mask blob"));
    }, "image/png");
  });
}
