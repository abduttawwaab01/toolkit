"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileVideo, FileAudio, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadProgress } from "@/types/media";

interface MediaUploadProps {
  onUpload: (files: File[]) => void;
  uploads: UploadProgress[];
  onCancelUpload: (fileId: string) => void;
}

export function MediaUpload({ onUpload, uploads, onCancelUpload }: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const valid = Array.from(files).filter(
        (f) => f.type.startsWith("video/") || f.type.startsWith("audio/") || f.type.startsWith("image/"),
      );
      if (valid.length > 0) onUpload(valid);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const fileIcon = (name: string) => {
    if (name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return <FileVideo size={16} />;
    if (name.match(/\.(mp3|wav|flac|aac|ogg)$/i)) return <FileAudio size={16} />;
    if (name.match(/\.(png|jpg|jpeg|webp|svg)$/i)) return <FileImage size={16} />;
    return <FileVideo size={16} />;
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "glass rounded-xl p-4 text-center cursor-pointer transition-all duration-200 border-2 border-dashed",
          dragOver
            ? "border-neon-cyan bg-neon-cyan/5 scale-[1.02]"
            : "border-border-subtle hover:border-neon-cyan/30",
        )}
      >
        <input ref={inputRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <Upload size={20} className={cn("mx-auto mb-2 transition-colors", dragOver ? "text-neon-cyan" : "text-text-tertiary")} />
        <p className="text-[11px] text-text-tertiary">{dragOver ? "Drop to upload" : "Drop files or click"}</p>
        <p className="text-[9px] text-text-tertiary mt-0.5">Video · Audio · Image</p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {uploads.map((u) => (
            <div key={u.fileId} className={cn("glass rounded-lg px-2.5 py-1.5 flex items-center gap-2", u.status === "error" && "border border-neon-pink/30")}>
              {u.status === "uploading" && <Loader2 size={12} className="text-neon-cyan animate-spin shrink-0" />}
              {u.status === "complete" && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
              {u.status === "error" && <AlertCircle size={12} className="text-neon-pink shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {fileIcon(u.fileName)}
                  <span className="text-[10px] text-text-secondary truncate">{u.fileName}</span>
                </div>
                {u.status === "uploading" && (
                  <div className="mt-0.5 h-1 glass rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
                {u.status === "error" && <span className="text-[9px] text-neon-pink">{u.error}</span>}
              </div>
              {u.status === "uploading" && (
                <button onClick={() => onCancelUpload(u.fileId)} className="p-0.5 text-text-tertiary hover:text-neon-pink"><X size={10} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
