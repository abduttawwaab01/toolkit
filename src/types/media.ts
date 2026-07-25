export interface MediaItem {
  id: string;
  name: string;
  type: "video" | "audio" | "image";
  mimeType: string;
  size: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
  autoDeleteAt: string | null;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
}
