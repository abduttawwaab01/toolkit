const PIXELS_PER_SECOND_DEFAULT = 100;
const MIN_ZOOM = 10;
const MAX_ZOOM = 500;
const TRACK_HEIGHT = 60;
const TRACK_LABEL_WIDTH = 160;
const SNAP_THRESHOLD = 8; // pixels

/** Convert timeline time (seconds) to x position (pixels) */
export function timeToPixel(time: number, zoom: number, scrollLeft: number): number {
  return time * zoom - scrollLeft;
}

/** Convert x position (pixels) to timeline time (seconds) */
export function pixelToTime(pixel: number, zoom: number, scrollLeft: number): number {
  return (pixel + scrollLeft) / zoom;
}

/** Snap a time value to the nearest frame */
export function snapToFrame(time: number, fps: number): number {
  const frameDuration = 1 / fps;
  return Math.round(time / frameDuration) * frameDuration;
}

/** Get the pixel width of a clip */
export function clipWidth(clip: { duration: number; speed: number }, zoom: number): number {
  return (clip.duration / clip.speed) * zoom;
}

/** Get the pixel x position of a clip on the timeline */
export function clipLeft(clip: { startTime: number }, zoom: number, scrollLeft: number): number {
  return clip.startTime * zoom - scrollLeft;
}

/** Check if a point is within a clip's bounds */
export function isPointInClip(
  px: number,
  py: number,
  clip: { startTime: number; duration: number; speed: number },
  trackIndex: number,
  zoom: number,
  scrollLeft: number,
  trackHeight: number,
): { hit: boolean; edge: "start" | "end" | "middle" | null } {
  const left = clipLeft(clip, zoom, scrollLeft);
  const width = clipWidth(clip, zoom);
  const top = trackIndex * trackHeight;
  const bottom = top + trackHeight;

  if (px < left - 5 || px > left + width + 5 || py < top || py > bottom) {
    return { hit: false, edge: null };
  }

  // Check trim edges (first/last 8px of clip)
  if (px >= left - 5 && px <= left + 8) return { hit: true, edge: "start" };
  if (px >= left + width - 8 && px <= left + width + 5) return { hit: true, edge: "end" };
  return { hit: true, edge: "middle" };
}

/** Find snap points for a clip being dragged */
export function findSnapPoint(
  draggingClip: { id: string; startTime: number; duration: number; speed: number },
  allClips: Array<{ id: string; startTime: number; duration: number; speed: number }>,
  playheadTime: number,
  zoom: number,
): number | null {
  const dragEnd = draggingClip.startTime + draggingClip.duration / draggingClip.speed;
  const threshold = SNAP_THRESHOLD / zoom;

  // Snap to playhead
  if (Math.abs(draggingClip.startTime - playheadTime) < threshold) return playheadTime;
  if (Math.abs(dragEnd - playheadTime) < threshold) return playheadTime - draggingClip.duration / draggingClip.speed;

  // Snap to other clip edges
  for (const clip of allClips) {
    if (clip.id === draggingClip.id) continue;
    const clipEnd = clip.startTime + clip.duration / clip.speed;

    if (Math.abs(draggingClip.startTime - clip.startTime) < threshold) return clip.startTime;
    if (Math.abs(draggingClip.startTime - clipEnd) < threshold) return clipEnd;
    if (Math.abs(dragEnd - clip.startTime) < threshold) return clip.startTime - draggingClip.duration / draggingClip.speed;
    if (Math.abs(dragEnd - clipEnd) < threshold) return clipEnd - draggingClip.duration / draggingClip.speed;
  }

  return null;
}

/** Generate time ruler markers */
export function generateRulerMarkers(duration: number, zoom: number): TimeRulerMarker[] {
  const markers: TimeRulerMarker[] = [];
  const pxPerSecond = zoom;

  // Determine interval based on zoom level
  let interval = 1;
  if (pxPerSecond > 200) interval = 0.5;
  else if (pxPerSecond > 100) interval = 1;
  else if (pxPerSecond > 40) interval = 2;
  else if (pxPerSecond > 20) interval = 5;
  else interval = 10;

  const majorInterval = interval * 5;

  for (let t = 0; t <= duration; t += interval) {
    const isMajor = t % majorInterval < 0.001 || Math.abs(t % majorInterval - majorInterval) < 0.001;
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(1);
    markers.push({
      time: t,
      label: isMajor ? `${mins}:${String(Math.floor(Number(secs))).padStart(2, "0")}` : "",
      type: isMajor ? "major" : "minor",
    });
  }
  return markers;
}

/** Find snap points for a trim edge */
export function findTrimSnapPoint(
  edgeTime: number,
  draggingClipId: string,
  allClips: Array<{ id: string; startTime: number; duration: number; speed: number }>,
  playheadTime: number,
  zoom: number,
): number | null {
  const threshold = SNAP_THRESHOLD / zoom;

  // Snap to playhead
  if (Math.abs(edgeTime - playheadTime) < threshold) return playheadTime;

  // Snap to other clip edges
  for (const clip of allClips) {
    if (clip.id === draggingClipId) continue;
    const clipEnd = clip.startTime + clip.duration / clip.speed;
    if (Math.abs(edgeTime - clip.startTime) < threshold) return clip.startTime;
    if (Math.abs(edgeTime - clipEnd) < threshold) return clipEnd;
  }

  return null;
}

/** Check if a given time range overlaps with any clip on the same track (excluding the given clip) */
export function hasOverlap(
  clipId: string,
  trackId: string,
  newStartTime: number,
  newDuration: number,
  allClips: Array<{ id: string; trackId: string; startTime: number; duration: number; speed: number }>,
): boolean {
  const newEnd = newStartTime + newDuration;
  for (const clip of allClips) {
    if (clip.id === clipId || clip.trackId !== trackId) continue;
    const clipEnd = clip.startTime + clip.duration / clip.speed;
    if (newStartTime < clipEnd && newEnd > clip.startTime) return true;
  }
  return false;
}

/** Clamp zoom level */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

const TIME_MARKERS = [
  { threshold: 200, interval: 0.5, labelInterval: 5 },
  { threshold: 100, interval: 1, labelInterval: 5 },
  { threshold: 40, interval: 2, labelInterval: 5 },
  { threshold: 20, interval: 5, labelInterval: 2 },
  { threshold: 10, interval: 10, labelInterval: 2 },
  { threshold: 0, interval: 30, labelInterval: 2 },
];

export function getTimeInterval(zoom: number): { interval: number; labelEvery: number } {
  for (const t of TIME_MARKERS) {
    if (zoom >= t.threshold) return { interval: t.interval, labelEvery: t.labelInterval };
  }
  return { interval: 30, labelEvery: 2 };
}

import type { TimeRulerMarker } from "@/types/editor";
