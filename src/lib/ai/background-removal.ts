/**
 * Client-side AI background removal service.
 * Calls the server-side API route that uses local @imgly/background-removal.
 */

export interface BackgroundRemovalResult {
  image: string; // base64 data URI of the image with transparent background
  format: string;
}

export interface BackgroundRemovalOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Remove background from an image using AI.
 * Returns a base64 data URI of the result with transparent background.
 */
export async function removeBackgroundAI(
  imageFile: File,
  options: BackgroundRemovalOptions = {},
): Promise<BackgroundRemovalResult> {
  const { onProgress } = options;

  onProgress?.(5);

  const formData = new FormData();
  formData.append("image", imageFile);

  onProgress?.(10);

  const response = await fetch("/api/ai/remove-background", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Background removal failed: ${response.status}`);
  }

  onProgress?.(95);

  const result = await response.json();

  onProgress?.(100);

  return result.data as BackgroundRemovalResult;
}

/**
 * Convert a base64 data URI to a File object.
 */
export function dataUriToFile(dataUri: string, filename: string): File {
  const [header, data] = dataUri.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Convert a base64 data URI to an HTMLImageElement.
 */
export function dataUriToImage(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUri;
  });
}
