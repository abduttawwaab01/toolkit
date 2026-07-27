/**
 * Client-side service for AI Music Generation (MusicGen via Replicate).
 */

export interface MusicGenerationResult {
  audio: string;
  prompt: string;
  duration: number;
}

export interface MusicGenerationOptions {
  prompt: string;
  duration?: number;
  temperature?: number;
  topP?: number;
  classifierFreeGuidance?: number;
  outputFormat?: "mp3" | "wav";
  onProgress?: (progress: number) => void;
}

export async function generateMusic(options: MusicGenerationOptions): Promise<MusicGenerationResult> {
  options.onProgress?.(10);

  const res = await fetch("/api/ai/music-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      duration: options.duration || 8,
      temperature: options.temperature,
      topP: options.topP,
      classifierFreeGuidance: options.classifierFreeGuidance,
      outputFormat: options.outputFormat || "mp3",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Music generation failed" }));
    throw new Error(err.error || "Music generation failed");
  }

  options.onProgress?.(90);

  const result = await res.json();
  options.onProgress?.(100);
  return result.data;
}

export async function playGeneratedMusic(audioDataUri: string): Promise<HTMLAudioElement> {
  const audio = new Audio(audioDataUri);
  await audio.play();
  return audio;
}

export const MUSIC_GEN_PRESETS = [
  { id: "cinematic", label: "Cinematic", prompt: "Cinematic orchestral film score, dramatic, epic" },
  { id: "electronic", label: "Electronic", prompt: "Electronic dance music, synth, upbeat, 128 BPM" },
  { id: "lofi", label: "Lo-Fi", prompt: "Lo-fi hip hop, chill, relaxing, vinyl crackle" },
  { id: "jazz", label: "Jazz", prompt: "Smooth jazz, saxophone, piano, warm" },
  { id: "rock", label: "Rock", prompt: "Energetic rock, electric guitar, drums, powerful" },
  { id: "ambient", label: "Ambient", prompt: "Ambient soundscape, atmospheric, ethereal, calm" },
  { id: "hiphop", label: "Hip Hop", prompt: "Hip hop beat, boom bap, bass, groovy" },
  { id: "classical", label: "Classical", prompt: "Classical music, string quartet, elegant" },
  { id: "pop", label: "Pop", prompt: "Catchy pop song, upbeat, bright, radio-friendly" },
  { id: "funk", label: "Funk", prompt: "Funky groove, bass guitar, wah-wah, danceable" },
] as const;
