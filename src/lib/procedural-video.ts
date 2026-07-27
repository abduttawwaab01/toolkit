"use client";

export interface ProceduralBackground {
  id: string;
  name: string;
  type: "gradient" | "particles" | "aurora" | "geometric" | "waves";
  duration: number;
  blob: Blob | null;
  url: string | null;
}

const BACKGROUND_TYPES = [
  { id: "gradient-sunset", name: "Sunset Gradient", type: "gradient" as const, colors: ["#ff6b35", "#f7c59f", "#004e89"] },
  { id: "gradient-ocean", name: "Ocean Deep", type: "gradient" as const, colors: ["#0077b6", "#00b4d8", "#90e0ef"] },
  { id: "gradient-forest", name: "Forest Mist", type: "gradient" as const, colors: ["#2d6a4f", "#52b788", "#d8f3dc"] },
  { id: "gradient-neon", name: "Neon Nights", type: "gradient" as const, colors: ["#7209b7", "#f72585", "#4cc9f0"] },
  { id: "particles-stars", name: "Star Field", type: "particles" as const, colors: ["#0a0a2e", "#1a1a4e", "#ffffff"] },
  { id: "aurora-borealis", name: "Aurora Borealis", type: "aurora" as const, colors: ["#0a1628", "#00ff88", "#00aaff", "#ff44aa"] },
  { id: "geometric-circles", name: "Geometric Circles", type: "geometric" as const, colors: ["#1a1a2e", "#16213e", "#0f3460"] },
  { id: "waves-gradient", name: "Smooth Waves", type: "waves" as const, colors: ["#667eea", "#764ba2", "#f093fb"] },
];

export async function generateProceduralBackgrounds(): Promise<ProceduralBackground[]> {
  const results: ProceduralBackground[] = [];

  for (const bg of BACKGROUND_TYPES) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d")!;
      const duration = 10;
      const fps = 30;
      const totalFrames = duration * fps;

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 2_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.start();

      for (let frame = 0; frame < totalFrames; frame++) {
        const t = frame / fps;
        ctx.clearRect(0, 0, 1920, 1080);

        switch (bg.type) {
          case "gradient":
            renderGradient(ctx, bg.colors, t, duration, 1920, 1080);
            break;
          case "particles":
            renderParticles(ctx, bg.colors, t, duration, 1920, 1080);
            break;
          case "aurora":
            renderAurora(ctx, bg.colors, t, duration, 1920, 1080);
            break;
          case "geometric":
            renderGeometric(ctx, bg.colors, t, duration, 1920, 1080);
            break;
          case "waves":
            renderWaves(ctx, bg.colors, t, duration, 1920, 1080);
            break;
        }

        await new Promise((r) => setTimeout(r, 0));
      }

      recorder.stop();
      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      });
      const url = URL.createObjectURL(blob);
      results.push({ id: bg.id, name: bg.name, type: bg.type, duration, blob, url });
    } catch {
      results.push({ id: bg.id, name: bg.name, type: bg.type, duration: 0, blob: null, url: null });
    }
  }

  return results;
}

function renderGradient(ctx: CanvasRenderingContext2D, colors: string[], t: number, duration: number, w: number, h: number) {
  const phase = (t / duration) * Math.PI * 2;
  const gradient = ctx.createLinearGradient(
    w * 0.5 + Math.sin(phase) * w * 0.3,
    0,
    w * 0.5 + Math.cos(phase) * w * 0.3,
    h,
  );
  colors.forEach((c, i) => {
    gradient.addColorStop(i / (colors.length - 1), c);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Moving highlight
  const highlight = ctx.createRadialGradient(
    w * 0.5 + Math.sin(phase * 0.5) * w * 0.2,
    h * 0.3 + Math.cos(phase * 0.7) * h * 0.2,
    0,
    w * 0.5 + Math.sin(phase * 0.5) * w * 0.2,
    h * 0.3 + Math.cos(phase * 0.7) * h * 0.2,
    w * 0.4,
  );
  highlight.addColorStop(0, "rgba(255,255,255,0.15)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, w, h);
}

function renderParticles(ctx: CanvasRenderingContext2D, colors: string[], t: number, duration: number, w: number, h: number) {
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const particleCount = 120;
  const seed = 42;

  for (let i = 0; i < particleCount; i++) {
    const px = ((seed * (i + 1) * 13) % w);
    const py = ((seed * (i + 1) * 17 + t * 20 * ((i % 3) + 1)) % h);
    const size = 1 + ((seed * (i + 1) * 7) % 4);
    const alpha = 0.3 + ((seed * (i + 1) * 11) % 70) / 100;

    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (0.5 + Math.sin(t * 2 + i) * 0.5)})`;
    ctx.fill();
  }
}

function renderAurora(ctx: CanvasRenderingContext2D, colors: string[], t: number, duration: number, w: number, h: number) {
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const phase = t * 0.3;

  for (let layer = 0; layer < 3; layer++) {
    const color = colors[layer + 1] || colors[colors.length - 1];
    ctx.save();

    const yOffset = h * 0.2 + layer * h * 0.08;
    const amplitude = h * 0.05 + layer * h * 0.02;

    ctx.globalAlpha = 0.15 + layer * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let x = 0; x <= w; x += 4) {
      const y = yOffset +
        Math.sin(x * 0.002 + phase + layer) * amplitude +
        Math.sin(x * 0.005 + phase * 1.5 + layer * 2) * amplitude * 0.5;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, yOffset + amplitude);
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = (i * 137.5) % w;
    const sy = (i * 97.3) % h;
    const brightness = 0.3 + Math.sin(t + i * 1.7) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
}

function renderGeometric(ctx: CanvasRenderingContext2D, colors: string[], t: number, duration: number, w: number, h: number) {
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);

  const phase = t * 0.4;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + phase;
    const radius = 100 + Math.sin(phase + i * 1.3) * 50;
    const cx = w / 2 + Math.cos(angle) * w * 0.25;
    const cy = h / 2 + Math.sin(angle) * h * 0.25;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(phase + i);
    ctx.globalAlpha = 0.15 + Math.sin(phase + i * 0.5) * 0.1;

    ctx.strokeStyle = colors[i % (colors.length - 1) + 1] || colors[colors.length - 1];
    ctx.lineWidth = 2;

    const sides = 6 + (i % 3);
    ctx.beginPath();
    for (let s = 0; s <= sides; s++) {
      const sa = (s / sides) * Math.PI * 2;
      const sr = radius + Math.sin(sa * 3 + phase) * 15;
      const sx = Math.cos(sa) * sr;
      const sy = Math.sin(sa) * sr;
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function renderWaves(ctx: CanvasRenderingContext2D, colors: string[], t: number, duration: number, w: number, h: number) {
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, w, h);

  const phase = t * 0.5;

  for (let wave = 0; wave < 5; wave++) {
    ctx.save();
    ctx.globalAlpha = 0.12;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    colors.forEach((c, i) => {
      gradient.addColorStop(i / (colors.length - 1), c);
    });

    ctx.beginPath();
    const baseY = h * (0.3 + wave * 0.12);

    for (let x = 0; x <= w; x += 2) {
      const y = baseY +
        Math.sin(x * 0.003 + phase + wave * 1.5) * 30 +
        Math.sin(x * 0.007 + phase * 2 + wave) * 15 +
        Math.sin(x * 0.001 + phase * 0.5 + wave * 3) * 40;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h + 50);
    ctx.lineTo(0, h + 50);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }
}
