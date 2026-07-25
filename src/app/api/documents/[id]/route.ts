import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/json";
import { z } from "zod";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { userId: (session.user as any).id as string, role: (session.user as any).role as string };
}

const updateBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  format: z.enum(["rich", "markdown", "text", "html"]).optional(),
  tags: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    include: {
      versions: { take: 10, orderBy: { version: "desc" } },
    },
  });

  if (!document) return jsonResponse({ error: "Document not found" }, { status: 404 });
  if (document.userId !== auth.userId && auth.role !== "ADMIN") {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  await db.document.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  });

  return jsonResponse(document);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const document = await db.document.findUnique({ where: { id } });
  if (!document) return jsonResponse({ error: "Document not found" }, { status: 404 });
  if (document.userId !== auth.userId && auth.role !== "ADMIN") {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  const { title, description, content, format, tags, isArchived } = parsed.data;

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;
  if (format !== undefined) {
    updateData.format = format;
    const FORMAT_MAP: Record<string, { mimeType: string; extension: string }> = {
      rich: { mimeType: "application/json", extension: "json" },
      markdown: { mimeType: "text/markdown", extension: "md" },
      text: { mimeType: "text/plain", extension: "txt" },
      html: { mimeType: "text/html", extension: "html" },
    };
    const { mimeType, extension } = FORMAT_MAP[format];
    updateData.mimeType = mimeType;
    updateData.extension = extension;
  }
  if (tags !== undefined) updateData.tags = tags;
  if (isArchived !== undefined) updateData.isArchived = isArchived;

  let newVersion = false;
  if (content !== undefined) {
    updateData.content = content;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    updateData.size = BigInt(Buffer.byteLength(contentStr, "utf-8"));
    updateData.wordCount = contentStr.trim() ? contentStr.trim().split(/\s+/).length : 0;
    newVersion = true;
  }

  const updated = await db.document.update({
    where: { id },
    data: updateData,
  });

  if (newVersion) {
    const latestVersion = await db.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    await db.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        content: updateData.content,
        title: updated.title,
        size: updated.size,
        wordCount: updated.wordCount,
      },
    });
  }

  return jsonResponse(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const document = await db.document.findUnique({ where: { id } });
  if (!document) return jsonResponse({ error: "Document not found" }, { status: 404 });
  if (document.userId !== auth.userId && auth.role !== "ADMIN") {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  await db.document.delete({ where: { id } });

  return jsonResponse({ ok: true });
}
