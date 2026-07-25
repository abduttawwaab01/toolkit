"use client";

import { useState } from "react";
import { EmojiPicker } from "./emoji-picker";
import { OverlayPanel } from "./overlay-panel";
import { BackgroundRemovalPanel } from "../background/background-removal-panel";
import { Sticker, Image, Pipette } from "lucide-react";

export function ElementsPanel() {
  const [tab, setTab] = useState<"overlay" | "emoji" | "background">("overlay");

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-3 pt-2 pb-1 shrink-0">
        <button onClick={() => setTab("overlay")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${
            tab === "overlay" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}>
          <Image size={10} /> Overlay
        </button>
        <button onClick={() => setTab("emoji")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${
            tab === "emoji" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}>
          <Sticker size={10} /> Emoji
        </button>
        <button onClick={() => setTab("background")}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 ${
            tab === "background" ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "glass border border-border-subtle text-text-tertiary"
          }`}>
          <Pipette size={10} /> BG
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {tab === "overlay" && <OverlayPanel />}
        {tab === "emoji" && <EmojiPicker />}
        {tab === "background" && <BackgroundRemovalPanel />}
      </div>
    </div>
  );
}
