"use client";

import { useState, useMemo } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { EMOJIS, EMOJI_CATEGORIES, type EmojiItem } from "@/lib/emoji/index";
import { Search, Plus } from "lucide-react";

export function EmojiPicker() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("faces");

  const filtered = useMemo(() => {
    let emojis = EMOJIS;
    if (search) {
      const q = search.toLowerCase();
      emojis = emojis.filter((e) => e.name.toLowerCase().includes(q) || e.emoji.includes(q));
    } else {
      emojis = emojis.filter((e) => e.category === category);
    }
    return emojis;
  }, [search, category]);

  const handleAddEmoji = (emoji: EmojiItem) => {
    const store = useEditorStore.getState();
    let overlayTrack = store.tracks.find((t) => t.type === "overlay");
    if (!overlayTrack) {
      store.addTrack("overlay");
      const updated = useEditorStore.getState().tracks;
      overlayTrack = updated[updated.length - 1];
      if (overlayTrack) store.updateTrack(overlayTrack.id, { name: "Overlays", color: "#a29bfe" });
      if (!overlayTrack) { toast.error("Error", "Could not create overlay track"); return; }
    }

    store.addClip({
      trackId: overlayTrack.id,
      type: "overlay",
      name: `Emoji: ${emoji.emoji}`,
      src: null,
      thumbnail: null,
      startTime: store.playhead,
      duration: 3,
      trimStart: 0, trimEnd: 0,
      speed: 1, volume: 1,
      volumeKeyframes: [],
      effects: [],
      opacity: 1, scale: 1, rotation: 0, positionX: 0, positionY: 0,
    });

    toast.success("Emoji added", `${emoji.emoji} added at playhead position`);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full glass rounded-lg pl-6 pr-2 py-1.5 text-[10px] text-text-primary border border-border-subtle focus:outline-none focus:border-neon-cyan/50"
        />
      </div>

      {!search && (
        <div className="flex gap-1 flex-wrap">
          {EMOJI_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-2 py-0.5 rounded-lg text-[8px] font-medium capitalize transition-all ${
                category === cat ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass text-text-tertiary hover:text-text-primary border border-border-subtle"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {filtered.map((emoji, i) => (
          <button key={`${emoji.emoji}-${i}`}
            onClick={() => handleAddEmoji(emoji)}
            title={emoji.name}
            className="aspect-square glass rounded-lg flex items-center justify-center text-lg hover:bg-glass-medium hover:scale-110 transition-all active:scale-95">
            {emoji.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
