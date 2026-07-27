"use client";

export const MUSIC_GENRES = [
  { id: "ambient", name: "Ambient", bpm: 70, description: "Calm, atmospheric pads" },
  { id: "lo-fi", name: "Lo-Fi", bpm: 85, description: "Chill, relaxed beats" },
  { id: "electronic", name: "Electronic", bpm: 120, description: "Modern electronic groove" },
  { id: "cinematic", name: "Cinematic", bpm: 90, description: "Epic, orchestral feel" },
  { id: "acoustic", name: "Acoustic", bpm: 95, description: "Warm, organic tones" },
  { id: "hip-hop", name: "Hip Hop", bpm: 105, description: "Urban beat with bass" },
  { id: "jazz", name: "Jazz", bpm: 80, description: "Smooth, classic feel" },
  { id: "synthwave", name: "Synthwave", bpm: 110, description: "Retro 80s inspired" },
];

interface GeneratedTrack {
  blob: Blob;
  duration: number;
  url: string;
}

export async function generateBackgroundMusic(
  genreId: string,
  duration: number = 30,
): Promise<GeneratedTrack> {
  const audioCtx = new AudioContext();
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = Math.floor(sampleRate * duration);
  const channelCount = 2;

  const offlineCtx = new OfflineAudioContext(channelCount, totalSamples, sampleRate);
  const genre = MUSIC_GENRES.find((g) => g.id === genreId) || MUSIC_GENRES[0];
  const bpm = genre.bpm;

  const beatDuration = 60 / bpm;
  const beatsPerBar = 4;
  const barDuration = beatDuration * beatsPerBar;

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(offlineCtx.destination);

  const chordProgression = getChordsForGenre(genreId);
  const numBars = Math.ceil(duration / barDuration);

  for (let bar = 0; bar < numBars; bar++) {
    const barStart = bar * barDuration;
    const chord = chordProgression[bar % chordProgression.length];

    // Pad
    createPad(offlineCtx, masterGain, chord, barStart, barDuration, genreId);
    // Bass
    createBass(offlineCtx, masterGain, chord, barStart, beatDuration, genreId);
    // Drums (every 2 bars for variety)
    if (bar % 2 === 0) {
      createDrums(offlineCtx, masterGain, barStart, beatDuration, barDuration, genreId);
    }
    // Arpeggio (every 4 bars)
    if (bar % 4 === 0) {
      createArpeggio(offlineCtx, masterGain, chord, barStart, barDuration, genreId);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  audioCtx.close();

  const wavBlob = audioBufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  return { blob: wavBlob, duration, url };
}

function getChordsForGenre(genreId: string): string[][] {
  const chords: Record<string, string[][]> = {
    ambient: [["C4", "E4", "G4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]],
    "lo-fi": [["Am3", "C4", "E4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"], ["E3", "G3", "B3"]],
    electronic: [["C3", "E3", "G3", "B3"], ["A2", "C3", "E3", "G3"], ["F2", "A2", "C3", "E3"], ["G2", "B2", "D3", "F3"]],
    cinematic: [["C3", "E3", "G3", "B3"], ["A2", "C3", "E3", "G3"], ["F2", "A2", "C3"], ["G2", "B2", "D3"]],
    acoustic: [["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]],
    "hip-hop": [["D3", "F3", "A3"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["C3", "E3", "G3"]],
    jazz: [["C4", "E4", "G4", "B4"], ["A3", "C4", "E4", "G4"], ["D3", "F3", "A3", "C4"], ["G3", "B3", "D4", "F4"]],
    synthwave: [["Am3", "C4", "E4"], ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["G3", "B3", "D4"]],
  };
  return chords[genreId] || chords.ambient;
}

function noteToFrequency(note: string): number {
  const noteMap: Record<string, number> = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const semitone = noteMap[match[1]] || 0;
  const octave = parseInt(match[2]);
  return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
}

function createPad(ctx: OfflineAudioContext, output: AudioNode, chord: string[], startTime: number, duration: number, genreId: string) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.08, startTime + 0.5);
  gain.gain.setValueAtTime(0.08, startTime + duration - 0.5);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  gain.connect(output);

  for (const note of chord) {
    const osc = ctx.createOscillator();
    const freq = noteToFrequency(note);
    osc.type = genreId === "cinematic" ? "sawtooth" : genreId === "electronic" ? "square" : "sine";
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = genreId === "cinematic" ? 3000 : 2000;
    filter.Q.value = 1;

    osc.connect(filter);
    filter.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

function createBass(ctx: OfflineAudioContext, output: AudioNode, chord: string[], startTime: number, beatDuration: number, genreId: string) {
  const root = chord[0];
  const freq = noteToFrequency(root) / 2;

  const gain = ctx.createGain();
  gain.gain.value = genreId === "hip-hop" || genreId === "electronic" ? 0.15 : 0.1;
  gain.connect(output);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;
  osc.connect(filter);
  filter.connect(gain);

  osc.start(startTime);
  osc.stop(startTime + chord.length * beatDuration);
}

function createDrums(ctx: OfflineAudioContext, output: AudioNode, startTime: number, beatDuration: number, barDuration: number, genreId: string) {
  const beatsPerBar = 4;

  for (let beat = 0; beat < beatsPerBar; beat++) {
    const beatTime = startTime + beat * beatDuration;

    // Kick on 1 and 3
    if (beat === 0 || beat === 2) {
      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0.3, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);
      kickGain.connect(output);

      const kickOsc = ctx.createOscillator();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(150, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.2);
      kickOsc.connect(kickGain);
      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.3);
    }

    // Snare on 2 and 4 (not for ambient/lo-fi)
    if ((beat === 1 || beat === 3) && !["ambient", "lo-fi", "cinematic"].includes(genreId)) {
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, beatTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.15);
      noiseGain.connect(output);

      const bufferSize = Math.floor(ctx.sampleRate * 0.1);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.connect(noiseGain);
      noise.start(beatTime);
    }

    // Hi-hat on every 8th note
    if (!["ambient", "cinematic"].includes(genreId)) {
      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(0.05, beatTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.05);
      hatGain.connect(output);

      const hatBufferSize = Math.floor(ctx.sampleRate * 0.05);
      const hatBuffer = ctx.createBuffer(1, hatBufferSize, ctx.sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatBufferSize; i++) {
        hatData[i] = Math.random() * 2 - 1;
      }
      const hatFilter = ctx.createBiquadFilter();
      hatFilter.type = "highpass";
      hatFilter.frequency.value = 10000;
      const hat = ctx.createBufferSource();
      hat.buffer = hatBuffer;
      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hat.start(beatTime + beatDuration / 2);

      if (beat > 0) {
        const hat2 = ctx.createBufferSource();
        hat2.buffer = hatBuffer;
        hat2.connect(hatFilter);
        hat2.start(beatTime + beatDuration * 0.75);
      }
    }
  }
}

function createArpeggio(ctx: OfflineAudioContext, output: AudioNode, chord: string[], startTime: number, barDuration: number, genreId: string) {
  if (["ambient"].includes(genreId)) return;

  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  gain.connect(output);

  const noteDuration = 0.125;
  const totalNotes = Math.min(chord.length * 4, Math.floor(barDuration / noteDuration));

  for (let i = 0; i < totalNotes; i++) {
    const noteIdx = i % chord.length;
    const note = chord[noteIdx];
    const noteTime = startTime + i * noteDuration;
    const freq = noteToFrequency(note) * 2;

    const osc = ctx.createOscillator();
    osc.type = genreId === "synthwave" ? "sawtooth" : "sine";
    osc.frequency.value = freq;

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, noteTime);
    noteGain.gain.linearRampToValueAtTime(0.04, noteTime + 0.01);
    noteGain.gain.setValueAtTime(0.04, noteTime + noteDuration * 0.7);
    noteGain.gain.linearRampToValueAtTime(0, noteTime + noteDuration);

    osc.connect(noteGain);
    noteGain.connect(gain);
    osc.start(noteTime);
    osc.stop(noteTime + noteDuration);
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
