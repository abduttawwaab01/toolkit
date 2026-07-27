"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { useToast } from "@/components/ui/toast/toast";
import { cloneVoice, listVoices, playVoicePreview } from "@/lib/ai/voice-clone";
import { Mic, Upload, Play, Trash2, Check } from "lucide-react";

export function VoiceClonePanel() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const audioFiles = selected.filter((f) => f.type.startsWith("audio/"));
    if (audioFiles.length < selected.length) {
      toast.warning("Skipped files", "Only audio files are accepted");
    }
    setFiles((prev) => [...prev, ...audioFiles].slice(0, 10));
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClone = useCallback(async () => {
    if (!name.trim()) { toast.error("Name required", "Enter a name for your voice"); return; }
    if (files.length === 0) { toast.error("Audio required", "Upload at least one audio sample"); return; }

    setProcessing(true);
    setProgress(0);
    try {
      const result = await cloneVoice({
        name: name.trim(),
        description: description.trim() || undefined,
        audioFiles: files,
        onProgress: setProgress,
      });
      setClonedVoiceId(result.voice_id);
      toast.success("Voice cloned", `"${result.name}" is ready to use`);
      setName("");
      setDescription("");
      setFiles([]);
    } catch (error: any) {
      toast.error("Cloning failed", error.message || "Could not clone voice");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [name, description, files, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Mic size={12} className="text-neon-purple" />
        <span className="text-[10px] font-medium text-text-primary">AI Voice Cloning</span>
      </div>

      <p className="text-[8px] text-text-tertiary leading-relaxed">
        Clone any voice from audio samples. Upload 1-10 clear audio recordings of the same person speaking.
      </p>

      {/* Name */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Voice Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Voice"
          className="w-full glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50" />
      </div>

      {/* Description */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Description (optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Professional narrator voice"
          className="w-full glass rounded-lg px-2.5 py-1.5 text-[10px] text-text-primary border border-border-subtle placeholder:text-text-tertiary/50" />
      </div>

      {/* Audio Samples */}
      <div>
        <label className="text-[9px] text-text-tertiary block mb-1">Audio Samples ({files.length}/10)</label>
        <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFiles} className="hidden" />

        <button onClick={() => fileInputRef.current?.click()} disabled={processing || files.length >= 10}
          className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50">
          <Upload size={12} className="text-text-secondary" />
          <span className="text-[10px] text-text-secondary">Upload Audio Samples</span>
        </button>

        {files.length > 0 && (
          <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 glass rounded-lg px-2 py-1">
                <Mic size={10} className="text-text-tertiary shrink-0" />
                <span className="text-[9px] text-text-primary truncate flex-1">{file.name}</span>
                <span className="text-[8px] text-text-tertiary">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                <button onClick={() => removeFile(i)} className="text-text-tertiary hover:text-red-400 transition-colors">
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="glass rounded-lg px-2.5 py-2 space-y-1">
        <p className="text-[8px] text-neon-purple font-medium">Tips for best results:</p>
        <ul className="text-[8px] text-text-tertiary space-y-0.5">
          <li>- Use 1-3 minutes of clear speech</li>
          <li>- No background music or noise</li>
          <li>- Consistent recording environment</li>
          <li>- Natural, conversational tone</li>
        </ul>
      </div>

      {/* Clone Button */}
      <button onClick={handleClone} disabled={processing || !name.trim() || files.length === 0}
        className="w-full glass rounded-xl px-3 py-2 flex items-center justify-center gap-2 hover:bg-glass-medium transition-all disabled:opacity-50">
        {processing ? (
          <>
            <span className="size-3 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
            <span className="text-[10px] text-neon-purple">Cloning... {progress}%</span>
          </>
        ) : (
          <>
            <Mic size={12} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary font-medium">Clone Voice</span>
          </>
        )}
      </button>

      {processing && (
        <div className="glass rounded-lg h-1.5 overflow-hidden">
          <div className="h-full bg-neon-purple transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Result */}
      {clonedVoiceId && (
        <div className="glass rounded-xl px-3 py-2 border border-neon-green/20">
          <div className="flex items-center gap-2">
            <Check size={12} className="text-neon-green" />
            <span className="text-[10px] text-neon-green font-medium">Voice cloned successfully!</span>
          </div>
          <p className="text-[8px] text-text-tertiary mt-1">
            Voice ID: <span className="text-text-primary font-mono">{clonedVoiceId}</span>
          </p>
          <p className="text-[8px] text-text-tertiary">Use this voice in the TTS panel to generate speech.</p>
        </div>
      )}
    </div>
  );
}
