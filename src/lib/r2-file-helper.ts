import { downloadFromR2 } from "./r2";

const MIME_MAP: Record<string, string> = {
  wav: "audio/wav", mp3: "audio/mpeg", m4a: "audio/mp4",
  ogg: "audio/ogg", flac: "audio/flac", opus: "audio/opus",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp",
};

function inferMime(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() || "bin";
  return MIME_MAP[ext] || "application/octet-stream";
}

export interface FileResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

export async function resolveFile(
  req: Request,
  formFieldName: string,
): Promise<{ file: FileResult | null; fields: Record<string, any> }> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const body = await req.json();
    const r2Key = body.r2Key as string | undefined;
    if (!r2Key) return { file: null, fields: body };
    const buffer = await downloadFromR2(r2Key);
    const fileName = r2Key.split("/").pop() || "file";
    const file: FileResult = { buffer, mimeType: inferMime(r2Key), fileName };
    const { r2Key: _, ...fields } = body;
    return { file, fields };
  }

  const formData = await req.formData();
  const file = formData.get(formFieldName) as File | null;
  const fields: Record<string, any> = {};
  for (const [k, v] of formData.entries()) {
    if (k !== formFieldName) fields[k] = v;
  }
  if (!file) return { file: null, fields };
  const arrayBuffer = await file.arrayBuffer();
  return {
    file: { buffer: Buffer.from(arrayBuffer), mimeType: file.type, fileName: file.name },
    fields,
  };
}

export async function resolveMultipleFiles(
  req: Request,
  fieldNames: string[],
): Promise<{ files: Record<string, FileResult | null>; fields: Record<string, any> }> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const body = await req.json();
    const files: Record<string, FileResult | null> = {};
    for (const field of fieldNames) {
      const key = body[field] as string | undefined;
      if (!key) { files[field] = null; continue; }
      const buffer = await downloadFromR2(key);
      const fileName = key.split("/").pop() || "file";
      files[field] = { buffer, mimeType: inferMime(key), fileName };
    }
    const keys = new Set(fieldNames);
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!keys.has(k)) fields[k] = v;
    }
    return { files, fields };
  }

  const formData = await req.formData();
  const files: Record<string, FileResult | null> = {};
  for (const field of fieldNames) {
    const file = formData.get(field) as File | null;
    if (!file) { files[field] = null; continue; }
    const arrayBuffer = await file.arrayBuffer();
    files[field] = { buffer: Buffer.from(arrayBuffer), mimeType: file.type, fileName: file.name };
  }
  const fields: Record<string, any> = {};
  for (const [k, v] of formData.entries()) {
    if (!fieldNames.includes(k)) fields[k] = v;
  }
  return { files, fields };
}

export function isBodyTooLarge(req: Request, maxBytes = 4 * 1024 * 1024): boolean {
  const len = parseInt(req.headers.get("content-length") || "0", 10);
  return len > maxBytes;
}
