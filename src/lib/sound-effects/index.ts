"use client";

export interface SoundEffectPreset {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  duration: number;
}

export const SOUND_EFFECT_CATEGORIES = [
  "transitions", "impacts", "whooshes", "ambient", "ui", "musical", "nature", "comedy",
];

export const SOUND_EFFECT_PRESETS: SoundEffectPreset[] = [
  // Transitions
  { id: "sfx-swoosh-1", name: "Quick Swoosh", category: "transitions", icon: "💨", description: "Fast transition swoosh", duration: 0.5 },
  { id: "sfx-swoosh-2", name: "Slow Swoosh", category: "transitions", icon: "🌀", description: "Slow dramatic swoosh", duration: 1.0 },
  { id: "sfx-swoosh-3", name: "Digital Whoosh", category: "transitions", icon: "⚡", description: "Digital scan whoosh", duration: 0.6 },
  { id: "sfx-page-turn", name: "Page Turn", category: "transitions", icon: "📄", description: "Paper page flip", duration: 0.4 },
  { id: "sfx-glitch", name: "Glitch", category: "transitions", icon: "📺", description: "Digital glitch transition", duration: 0.3 },
  // Impacts
  { id: "sfx-impact-1", name: "Hard Hit", category: "impacts", icon: "💥", description: "Powerful impact", duration: 0.5 },
  { id: "sfx-impact-2", name: "Soft Thud", category: "impacts", icon: "🫨", description: "Muffled thud", duration: 0.4 },
  { id: "sfx-impact-3", name: "Metallic Clang", category: "impacts", icon: "🔔", description: "Metal on metal", duration: 0.6 },
  { id: "sfx-impact-4", name: "Glass Break", category: "impacts", icon: "🪟", description: "Shattering glass", duration: 0.8 },
  { id: "sfx-impact-5", name: "Boom", category: "impacts", icon: "💣", description: "Deep explosion boom", duration: 1.2 },
  { id: "sfx-impact-6", name: "Punch", category: "impacts", icon: "👊", description: "Fist impact", duration: 0.3 },
  // Whooshes
  { id: "sfx-whoosh-1", name: "Fast Whoosh", category: "whooshes", icon: "🌬️", description: "Quick air whoosh", duration: 0.4 },
  { id: "sfx-whoosh-2", name: "Slow Whoosh", category: "whooshes", icon: "💨", description: "Long air sweep", duration: 0.8 },
  { id: "sfx-whoosh-3", name: "Rising Whoosh", category: "whooshes", icon: "📈", description: "Ascending air rush", duration: 1.0 },
  { id: "sfx-whoosh-4", name: "Wind Gust", category: "whooshes", icon: "🌪️", description: "Strong wind gust", duration: 0.6 },
  // Ambient
  { id: "sfx-ambient-rain", name: "Rain", category: "ambient", icon: "🌧️", description: "Light rainfall", duration: 3.0 },
  { id: "sfx-ambient-wind", name: "Wind", category: "ambient", icon: "🌬️", description: "Wind blowing", duration: 3.0 },
  { id: "sfx-ambient-city", name: "City Traffic", category: "ambient", icon: "🏙️", description: "Urban traffic hum", duration: 3.0 },
  { id: "sfx-ambient-cafe", name: "Coffee Shop", category: "ambient", icon: "☕", description: "Cafe ambiance", duration: 3.0 },
  { id: "sfx-ambient-forest", name: "Forest", category: "ambient", icon: "🌲", description: "Forest atmosphere", duration: 3.0 },
  // UI
  { id: "sfx-ui-click", name: "Click", category: "ui", icon: "🖱️", description: "Button click", duration: 0.15 },
  { id: "sfx-ui-pop", name: "Pop", category: "ui", icon: "🫧", description: "Bubble pop", duration: 0.2 },
  { id: "sfx-ui-notify", name: "Notification", category: "ui", icon: "🔔", description: "Alert chime", duration: 0.3 },
  { id: "sfx-ui-success", name: "Success", category: "ui", icon: "✅", description: "Success jingle", duration: 0.5 },
  { id: "sfx-ui-error", name: "Error", category: "ui", icon: "❌", description: "Error buzz", duration: 0.4 },
  { id: "sfx-ui-woosh", name: "UI Whoosh", category: "ui", icon: "🔄", description: "Interface whoosh", duration: 0.3 },
  // Musical
  { id: "sfx-music-bell", name: "Bell Tone", category: "musical", icon: "🔔", description: "Clear bell note", duration: 1.0 },
  { id: "sfx-music-chime", name: "Chime", category: "musical", icon: "🎐", description: "Wind chime", duration: 1.5 },
  { id: "sfx-music-drum", name: "Drum Hit", category: "musical", icon: "🥁", description: "Bass drum hit", duration: 0.5 },
  { id: "sfx-music-harp", name: "Harp Gliss", category: "musical", icon: "🎶", description: "Harp arpeggio", duration: 1.0 },
  { id: "sfx-music-piano", name: "Piano Note", category: "musical", icon: "🎹", description: "Single piano key", duration: 0.8 },
  // Nature
  { id: "sfx-nature-bird", name: "Bird Chirp", category: "nature", icon: "🐦", description: "Bird singing", duration: 0.6 },
  { id: "sfx-nature-thunder", name: "Thunder", category: "nature", icon: "⛈️", description: "Distant thunder", duration: 1.5 },
  { id: "sfx-nature-water", name: "Water Splash", category: "nature", icon: "💧", description: "Water drop/splash", duration: 0.5 },
  { id: "sfx-nature-fire", name: "Fire Crackle", category: "nature", icon: "🔥", description: "Campfire crackling", duration: 2.0 },
  { id: "sfx-nature-waves", name: "Ocean Waves", category: "nature", icon: "🌊", description: "Gentle waves", duration: 3.0 },
  // Comedy
  { id: "sfx-comedy-boing", name: "Boing", category: "comedy", icon: "🩼", description: "Spring boing", duration: 0.4 },
  { id: "sfx-comedy-fart", name: "Fart", category: "comedy", icon: "💨", description: "Flatulence", duration: 0.5 },
  { id: "sfx-comedy-drum-rim", name: "Rimshot", category: "comedy", icon: "🥁", description: "Comedy rimshot", duration: 0.6 },
  { id: "sfx-comedy-ah", name: "Aww Yeah", category: "comedy", icon: "😎", description: "Funny approval", duration: 0.8 },
  { id: "sfx-comedy-oops", name: "Oops", category: "comedy", icon: "😅", description: "Silly mistake sound", duration: 0.5 },
];

export function generateSoundEffect(preset: SoundEffectPreset, sampleRate = 44100): Promise<Blob> {
  return new Promise((resolve) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = preset.duration;
    const length = Math.ceil(sampleRate * duration);
    const numChannels = 2;

    const buffer = ctx.createBuffer(numChannels, length, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const data = buffer.getChannelData(ch);
      const envelope = (t: number, d: number) => {
        const attack = Math.min(0.05, d * 0.1);
        const release = Math.min(0.1, d * 0.2);
        if (t < attack) return t / attack;
        if (t > d - release) return (d - t) / release;
        return 1;
      };

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        let sample = 0;

        switch (preset.id) {
          case "sfx-swoosh-1":
          case "sfx-swoosh-2":
          case "sfx-swoosh-3": {
            const freq = 200 + progress * 3000;
            sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
            sample += (Math.random() * 2 - 1) * 0.2 * (1 - progress);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-whoosh-1":
          case "sfx-whoosh-2":
          case "sfx-whoosh-3":
          case "sfx-whoosh-4": {
            const wfreq = 100 + progress * 2000;
            sample = (Math.random() * 2 - 1) * 0.4 * (1 - progress * 0.5);
            sample += Math.sin(2 * Math.PI * wfreq * t) * 0.1;
            sample *= envelope(t, duration);
            // Bandpass feel via noise shaping
            break;
          }
          case "sfx-page-turn": {
            sample = (Math.random() * 2 - 1) * 0.3 * (1 + Math.sin(2 * Math.PI * 80 * t));
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-glitch": {
            const glitchFreq = 50 + Math.random() * 200;
            sample = Math.sin(2 * Math.PI * glitchFreq * t) * 0.3;
            if (Math.random() < 0.1) sample *= 2;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-impact-1":
          case "sfx-impact-2":
          case "sfx-impact-5": {
            const ifreq = 60 + (1 - progress) * 500;
            sample = Math.sin(2 * Math.PI * ifreq * t) * 0.5;
            sample += (Math.random() * 2 - 1) * 0.3 * (1 - progress);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-impact-3": {
            sample = Math.sin(2 * Math.PI * 800 * t) * 0.4 * (1 - progress);
            sample += Math.sin(2 * Math.PI * 1200 * t) * 0.3 * (1 - progress);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-impact-4": {
            sample = (Math.random() * 2 - 1) * 0.6 * (1 - progress);
            sample += Math.sin(2 * Math.PI * 3000 * t) * 0.2 * (1 - progress);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-impact-6": {
            sample = Math.sin(2 * Math.PI * 100 * t) * 0.6 * (1 - progress * 2);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-ui-click": {
            sample = Math.sin(2 * Math.PI * 1000 * t) * 0.3 * (1 - progress * 5);
            sample += (Math.random() * 2 - 1) * 0.1;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-ui-pop": {
            sample = Math.sin(2 * Math.PI * 600 * t) * 0.4 * (1 - progress * 4);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-ui-notify": {
            const nfreq = 800 + Math.sin(2 * Math.PI * 4 * t) * 200;
            sample = Math.sin(2 * Math.PI * nfreq * t) * 0.3;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-ui-success": {
            const sa = Math.sin(2 * Math.PI * 523 * t) * 0.2;
            const sb = Math.sin(2 * Math.PI * 659 * t) * 0.2;
            const sc = Math.sin(2 * Math.PI * 784 * t) * 0.2;
            sample = (sa + sb + sc) * envelope(t, duration);
            break;
          }
          case "sfx-ui-error": {
            sample = Math.sin(2 * Math.PI * 200 * t) * 0.3;
            sample += Math.sin(2 * Math.PI * 180 * t) * 0.3;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-ui-woosh":
          case "sfx-swoosh-3": {
            const ufreq = 300 + progress * 1500;
            sample = Math.sin(2 * Math.PI * ufreq * t) * 0.25;
            sample += (Math.random() * 2 - 1) * 0.15;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-music-bell": {
            for (let h = 1; h <= 6; h++) {
              sample += Math.sin(2 * Math.PI * 440 * h * t) * (0.3 / h) * (1 - progress * h * 0.3);
            }
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-music-chime": {
            for (let h = 1; h <= 4; h++) {
              sample += Math.sin(2 * Math.PI * 660 * h * t) * (0.25 / h) * (1 - progress * h * 0.5);
            }
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-music-drum": {
            sample = Math.sin(2 * Math.PI * 80 * t) * 0.6 * (1 - progress * 3);
            sample += (Math.random() * 2 - 1) * 0.2 * (1 - progress);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-music-harp": {
            const harpFreq = 300 + progress * 1200;
            sample = Math.sin(2 * Math.PI * harpFreq * t) * 0.25;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-music-piano": {
            sample = Math.sin(2 * Math.PI * 440 * t) * 0.3 * (1 - progress * 0.5);
            for (let h = 2; h <= 4; h++) {
              sample += Math.sin(2 * Math.PI * 440 * h * t) * (0.1 / h) * (1 - progress);
            }
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-nature-bird": {
            const bfreq = 2000 + Math.sin(2 * Math.PI * 30 * t) * 500;
            sample = Math.sin(2 * Math.PI * bfreq * t) * 0.2;
            sample *= envelope(t, duration);
            if (t < 0.1 || (t > 0.25 && t < 0.35)) sample *= 0.3;
            break;
          }
          case "sfx-nature-thunder": {
            sample = (Math.random() * 2 - 1) * 0.5;
            const lowRumble = Math.sin(2 * Math.PI * 30 * t) * 0.3;
            sample = sample * 0.4 + lowRumble;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-nature-water": {
            sample = Math.sin(2 * Math.PI * 400 * t) * 0.2 * (1 - progress * 3);
            sample += (Math.random() * 2 - 1) * 0.15;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-nature-fire": {
            sample = (Math.random() * 2 - 1) * 0.25;
            sample += Math.sin(2 * Math.PI * 120 * t) * 0.1;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-nature-waves": {
            const wprogress = (i % Math.floor(sampleRate * 2)) / (sampleRate * 2);
            sample = Math.sin(2 * Math.PI * 80 * t) * 0.15 * wprogress;
            sample += (Math.random() * 2 - 1) * 0.05;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-comedy-boing": {
            const bFreq = 200 + (1 - progress) * 600;
            sample = Math.sin(2 * Math.PI * bFreq * t) * 0.3 * (1 - progress * 0.5);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-comedy-fart": {
            const ffreq = 80 + Math.random() * 40;
            sample = Math.sin(2 * Math.PI * ffreq * t) * 0.3;
            sample += (Math.random() * 2 - 1) * 0.2 * (1 - progress);
            if (progress > 0.7) sample *= 0.5;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-comedy-drum-rim": {
            sample = Math.sin(2 * Math.PI * 400 * t) * 0.2 * (1 - progress * 4);
            sample += Math.sin(2 * Math.PI * 600 * t) * 0.15 * (1 - progress * 3);
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-comedy-ah": {
            const vFreq = 300 + Math.sin(2 * Math.PI * 3 * t) * 100;
            sample = Math.sin(2 * Math.PI * vFreq * t) * 0.2;
            sample += Math.sin(2 * Math.PI * vFreq * 1.5 * t) * 0.1;
            sample *= envelope(t, duration);
            break;
          }
          case "sfx-comedy-oops": {
            const oFreq = 400 + (1 - progress) * 200;
            sample = Math.sin(2 * Math.PI * oFreq * t) * 0.3;
            sample *= envelope(t, duration);
            if (progress > 0.6) sample *= 0.5;
            break;
          }
          case "sfx-ambient-rain":
          case "sfx-ambient-wind":
          case "sfx-ambient-city":
          case "sfx-ambient-cafe":
          case "sfx-ambient-forest":
          default: {
            if (preset.category === "ambient") {
              sample = (Math.random() * 2 - 1) * 0.15;
              sample += Math.sin(2 * Math.PI * 100 * t) * 0.05;
              sample *= envelope(t, duration);
            } else {
              sample = Math.sin(2 * Math.PI * 440 * t) * 0.2;
              sample *= envelope(t, duration);
            }
          }
        }

        data[i] = Math.max(-1, Math.min(1, sample));
      }
    }

    const wavBlob = audioBufferToWavBlob(buffer);
    ctx.close();
    resolve(wavBlob);
  });
}

export async function preloadSoundEffects(): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  for (const preset of SOUND_EFFECT_PRESETS) {
    try {
      const blob = await generateSoundEffect(preset);
      urls[preset.id] = URL.createObjectURL(blob);
    } catch {
      // skip failed presets
    }
  }
  return urls;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const w = (offset: number, string: string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
  w(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}
