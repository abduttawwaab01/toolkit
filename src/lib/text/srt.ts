import type { Subtitle } from "@/types/editor";

const uuid = () => crypto.randomUUID();

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function parseSrtTime(timeStr: string): number {
  const parts = timeStr.replace(",", ".").split(":");
  if (parts.length !== 3) return 0;
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
}

export function parseSrt(content: string): Subtitle[] {
  const blocks = content.trim().replace(/\r\n/g, "\n").split(/\n\n+/);
  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    // Parse index
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    // Parse time
    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/,
    );
    if (!timeMatch) continue;

    const start = parseSrtTime(timeMatch[1]);
    const end = parseSrtTime(timeMatch[2]);
    const text = lines.slice(2).join("\n").replace(/<[^>]*>/g, "").trim();

    if (text) {
      subtitles.push({ id: uuid(), index, start, end, text });
    }
  }

  return subtitles;
}

export function generateSrt(subtitles: Subtitle[]): string {
  return subtitles
    .map((sub, i) => {
      const index = i + 1;
      const start = formatSrtTime(sub.start);
      const end = formatSrtTime(sub.end);
      return `${index}\n${start} --> ${end}\n${sub.text}\n`;
    })
    .join("\n");
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(Math.floor(s)).padStart(2, "0")}.${String(Math.floor((s % 1) * 100)).padStart(2, "0")}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }
  return 0;
}
