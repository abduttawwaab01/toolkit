import { useEditorStore } from "@/lib/editor-store";

export interface EditorAction {
  action: string;
  params: Record<string, unknown>;
  description: string;
}

export const AVAILABLE_ACTIONS = [
  {
    name: "set_clip_speed",
    description: "Change the playback speed of a clip",
    params: { clipId: "string (optional, uses selected if omitted)", speed: "number (0.1 to 4.0)" },
  },
  {
    name: "add_effect",
    description: "Add a visual effect to a clip",
    params: { clipId: "string (optional)", effectType: "string (brightness|contrast|saturate|blur|grayscale|sepia|cinematic|vintage)" },
  },
  {
    name: "remove_effect",
    description: "Remove a visual effect from a clip",
    params: { clipId: "string (optional)", effectType: "string" },
  },
  {
    name: "set_clip_volume",
    description: "Change the volume of a clip",
    params: { clipId: "string (optional)", volume: "number (0 to 2)" },
  },
  {
    name: "split_clip",
    description: "Split a clip at the current playhead position",
    params: { clipId: "string (optional)" },
  },
  {
    name: "set_clip_opacity",
    description: "Change the opacity of a clip",
    params: { clipId: "string (optional)", opacity: "number (0 to 1)" },
  },
  {
    name: "trim_clip",
    description: "Trim the start or end of a clip",
    params: { clipId: "string (optional)", edge: "string (start|end)", duration: "number (new duration in seconds)" },
  },
  {
    name: "move_clip",
    description: "Move a clip to a new position on the timeline",
    params: { clipId: "string (optional)", startTime: "number (new start time in seconds)" },
  },
  {
    name: "add_transition",
    description: "Add a transition between two clips",
    params: { clipInId: "string", clipOutId: "string", type: "string (crossfade|fade-to-black|fade-to-white|slide-left|slide-right|wipe-left|wipe-right|zoom-in|zoom-out)", duration: "number (seconds)" },
  },
  {
    name: "set_master_volume",
    description: "Change the master volume of the project",
    params: { volume: "number (0 to 2)" },
  },
  {
    name: "seek",
    description: "Move the playhead to a specific time",
    params: { time: "number (seconds)" },
  },
  {
    name: "add_text_clip",
    description: "Add a text overlay to the timeline",
    params: { text: "string", duration: "number (seconds, default 5)", position: "string (center|top|bottom)", fontSize: "number (default 48)" },
  },
];

export const SYSTEM_PROMPT = `You are ToolKit AI, an intelligent video editing assistant built into a browser-based video editor.

You can help users edit their videos by answering questions, giving advice, AND executing editing actions directly.

When the user asks you to perform a specific editing action, respond with a JSON object containing the action and parameters. Wrap the JSON in \`\`\`json code blocks.

Available actions:
${AVAILABLE_ACTIONS.map((a) => `- \`${a.name}\`: ${a.description}. Params: ${JSON.stringify(a.params)}`).join("\n")}

Examples:
User: "Make clip 1 50% slower"
Assistant: \`\`\`json
{"action": "set_clip_speed", "params": {"clipId": "clip-1", "speed": 0.5}, "description": "Slow down selected clip to 50% speed"}
\`\`\`

User: "Add cinematic color to this clip"
Assistant: \`\`\`json
{"action": "add_effect", "params": {"effectType": "cinematic"}, "description": "Add cinematic color grading effect"}
\`\`\`

User: "Split at current position"
Assistant: \`\`\`json
{"action": "split_clip", "params": {}, "description": "Split clip at playhead position"}
\`\`\`

If the user just asks a question, respond naturally without JSON. Only use JSON when executing editing actions.

Keep responses concise and practical.`;

export function parseEditorAction(response: string): EditorAction | null {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)```/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed && parsed.action) {
      return { action: parsed.action, params: parsed.params || {}, description: parsed.description || "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function executeEditorAction(action: EditorAction): { success: boolean; message: string } {
  const store = useEditorStore.getState();
  const clipId = (action.params.clipId as string) || store.selectedClipId;

  try {
    switch (action.action) {
      case "set_clip_speed": {
        const speed = action.params.speed as number;
        if (!clipId) return { success: false, message: "No clip selected" };
        store.pushHistory();
        store.updateClip(clipId, { speed: Math.max(0.1, Math.min(4, speed)) });
        return { success: true, message: `Speed set to ${speed}x` };
      }
      case "add_effect": {
        const effectType = action.params.effectType as string;
        if (!clipId) return { success: false, message: "No clip selected" };
        store.addEffectToClip(clipId, effectType);
        return { success: true, message: `${effectType} effect added` };
      }
      case "remove_effect": {
        const rmEffectType = action.params.effectType as string;
        if (!clipId) return { success: false, message: "No clip selected" };
        const clip = store.clips.find((c: any) => c.id === clipId);
        if (!clip) return { success: false, message: "Clip not found" };
        const effect = clip.effects.find((e: any) => e.type === rmEffectType);
        if (effect) store.removeEffectFromClip(clipId, effect.id);
        return { success: true, message: `${rmEffectType} effect removed` };
      }
      case "set_clip_volume": {
        const volume = action.params.volume as number;
        if (!clipId) return { success: false, message: "No clip selected" };
        store.updateClip(clipId, { volume: Math.max(0, Math.min(2, volume)) });
        return { success: true, message: `Volume set to ${volume}` };
      }
      case "split_clip": {
        if (!clipId) return { success: false, message: "No clip selected" };
        const playhead = store.playhead;
        store.splitClip(clipId, playhead);
        return { success: true, message: "Clip split at playhead position" };
      }
      case "set_clip_opacity": {
        const opacity = action.params.opacity as number;
        if (!clipId) return { success: false, message: "No clip selected" };
        store.updateClip(clipId, { opacity: Math.max(0, Math.min(1, opacity)) });
        return { success: true, message: `Opacity set to ${opacity}` };
      }
      case "trim_clip": {
        const edge = action.params.edge as string;
        const duration = action.params.duration as number;
        if (!clipId) return { success: false, message: "No clip selected" };
        const clip = store.clips.find((c: any) => c.id === clipId);
        if (!clip) return { success: false, message: "Clip not found" };
        if (edge === "start") {
          store.trimClip(clipId, "start", clip.startTime + (clip.duration - duration), duration, clip.trimStart + (clip.duration - duration), clip.trimEnd);
        } else {
          store.trimClip(clipId, "end", clip.startTime, duration, clip.trimStart, clip.trimEnd - (clip.duration - duration));
        }
        return { success: true, message: `Clip trimmed to ${duration}s` };
      }
      case "move_clip": {
        const startTime = action.params.startTime as number;
        if (!clipId) return { success: false, message: "No clip selected" };
        store.moveClip(clipId, startTime);
        return { success: true, message: `Clip moved to ${startTime}s` };
      }
      case "add_transition": {
        const clipInId = action.params.clipInId as string;
        const clipOutId = action.params.clipOutId as string;
        const transitionType = (action.params.type as string) || "crossfade";
        const transitionDuration = (action.params.duration as number) || 0.5;
        const trackId = store.clips.find((c: any) => c.id === clipInId)?.trackId;
        if (trackId) {
          store.addTransition(clipInId, clipOutId, trackId, transitionType as any, transitionDuration);
        }
        return { success: true, message: `${transitionType} transition added` };
      }
      case "set_master_volume": {
        const mv = action.params.volume as number;
        store.setMasterVolume(Math.max(0, Math.min(2, mv)));
        return { success: true, message: `Master volume set to ${mv}` };
      }
      case "seek": {
        const time = action.params.time as number;
        store.setPlayhead(Math.max(0, time));
        return { success: true, message: `Playhead moved to ${time}s` };
      }
      case "add_text_clip": {
        const text = action.params.text as string;
        const textDuration = (action.params.duration as number) || 5;
        const position = action.params.position as string || "center";
        const fontSize = (action.params.fontSize as number) || 48;
        const textTrack = store.tracks.find((t: any) => t.type === "text");
        if (!textTrack) return { success: false, message: "No text track available" };
        const posX = position === "center" ? 960 : position === "top" ? 960 : 960;
        const posY = position === "center" ? 540 : position === "top" ? 150 : 900;
        store.addClip({
          trackId: textTrack.id,
          type: "text",
          name: text.slice(0, 30),
          src: null,
          thumbnail: null,
          startTime: store.playhead,
          duration: textDuration,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          volume: 1,
          effects: [],
          opacity: 1,
          scale: 1,
          rotation: 0,
          positionX: posX,
          positionY: posY,
          textContent: text,
          textStyle: { fontFamily: "Inter, sans-serif", fontSize, color: "#ffffff", alignment: "center", bold: false, italic: false, underline: false, uppercase: false, lineHeight: 1.5, letterSpacing: 0, background: "#000000", backgroundOpacity: 0.4, strokeColor: "#000000", strokeWidth: 0, shadowColor: "#000000", shadowBlur: 4, shadowOffsetX: 2, shadowOffsetY: 2, borderRadius: 8, paddingX: 16, paddingY: 8 },
          textAnimation: { type: "fade", duration: 0.5, delay: 0, stagger: 0 },
        } as any);
        return { success: true, message: `Text clip "${text.slice(0, 30)}..." added` };
      }
      default:
        return { success: false, message: `Unknown action: ${action.action}` };
    }
  } catch (err: any) {
    return { success: false, message: `Error executing action: ${err.message}` };
  }
}
