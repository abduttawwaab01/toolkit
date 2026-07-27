/**
 * Client-side service for ElevenLabs Voice Cloning.
 */

export interface VoiceCloneResult {
  voice_id: string;
  name: string;
  category: string;
}

export interface VoiceCloneOptions {
  name: string;
  description?: string;
  audioFiles: File[];
  onProgress?: (progress: number) => void;
}

export async function cloneVoice(options: VoiceCloneOptions): Promise<VoiceCloneResult> {
  const formData = new FormData();
  formData.append("name", options.name);
  if (options.description) formData.append("description", options.description);
  options.audioFiles.forEach((file) => formData.append("files", file));

  options.onProgress?.(10);

  const res = await fetch("/api/ai/voice-clone", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Voice cloning failed" }));
    throw new Error(err.error || "Voice cloning failed");
  }

  const result = await res.json();
  options.onProgress?.(100);
  return result.data;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url?: string;
}

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const res = await fetch("/api/ai/voice-clone");
  if (!res.ok) throw new Error("Failed to list voices");
  const data = await res.json();
  return data.voices || [];
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const res = await fetch(`/api/ai/voice-clone?voiceId=${voiceId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete voice");
}

export async function playVoicePreview(previewUrl: string): Promise<HTMLAudioElement> {
  const audio = new Audio(previewUrl);
  await audio.play();
  return audio;
}
