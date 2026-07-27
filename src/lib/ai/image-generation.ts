/**
 * Client-side AI image generation service.
 * Uses Stable Diffusion XL via Replicate.
 */

export interface ImageGenerationResult {
  image: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  guidanceScale?: number;
  steps?: number;
  seed?: number;
  model?: string;
  onProgress?: (progress: number) => void;
}

const PRESET_STYLES = [
  { id: "photorealistic", prompt: "photorealistic, high detail, 8k, sharp focus", negative: "cartoon, anime, drawing, painting" },
  { id: "cinematic", prompt: "cinematic still, film grain, dramatic lighting, 35mm", negative: "flat lighting, overexposed" },
  { id: "anime", prompt: "anime style, vibrant colors, detailed, studio ghibli", negative: "photorealistic, 3d render" },
  { id: "digital-art", prompt: "digital art, concept art, trending on artstation", negative: "photo, blurry" },
  { id: "oil-painting", prompt: "oil painting, classical art, detailed brushstrokes", negative: "digital, photo, modern" },
  { id: "watercolor", prompt: "watercolor painting, soft colors, artistic", negative: "sharp, digital, photo" },
  { id: "3d-render", prompt: "3d render, octane render, unreal engine 5, detailed", negative: "2d, flat, drawing" },
  { id: "minimalist", prompt: "minimalist design, clean, simple, white background", negative: "cluttered, complex, busy" },
  { id: "cyberpunk", prompt: "cyberpunk, neon lights, futuristic city, night", negative: "daylight, rural, simple" },
  { id: "fantasy", prompt: "fantasy art, magical, ethereal, glowing, mystical", negative: "modern, urban, realistic" },
  { id: "product-photo", prompt: "product photography, studio lighting, white background, commercial", negative: "artistic, abstract, blurry" },
  { id: "portrait", prompt: "portrait photography, soft lighting, bokeh, 85mm lens", negative: "wide angle, distorted, flat" },
];

export const IMAGE_STYLE_PRESETS = PRESET_STYLES;

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const { onProgress, ...body } = options;

  onProgress?.(5);

  const response = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Image generation failed: ${response.status}`);
  }

  onProgress?.(95);
  const result = await response.json();
  onProgress?.(100);

  return result.data as ImageGenerationResult;
}
