import { db } from "./db";

interface SyncPayload {
  projectId: string;
  userId: string;
  tracks: any[];
  clips: any[];
  playhead: number;
  version: number;
}

export async function saveProjectSnapshot(payload: SyncPayload): Promise<{ version: number }> {
  const existing = await db.projectActivity.findFirst({
    where: { projectId: payload.projectId, action: "snapshot" },
    orderBy: { createdAt: "desc" },
  });

  const newVersion = existing ? (existing as any).version + 1 : 1;

  await db.projectActivity.create({
    data: {
      projectId: payload.projectId,
      userId: payload.userId,
      action: "snapshot",
      entity: "project",
      details: { tracks: payload.tracks, clips: payload.clips, playhead: payload.playhead, version: newVersion },
    },
  });

  await db.userPresence.upsert({
    where: { userId: payload.userId },
    update: { projectId: payload.projectId, lastActive: new Date(), cursorPos: { playhead: payload.playhead } },
    create: { userId: payload.userId, projectId: payload.projectId, lastActive: new Date(), cursorPos: { playhead: payload.playhead } },
  });

  return { version: newVersion };
}

export async function getLatestSnapshot(projectId: string): Promise<SyncPayload | null> {
  const snapshot = await db.projectActivity.findFirst({
    where: { projectId, action: "snapshot" },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) return null;

  const details = snapshot.details as any;
  return {
    projectId,
    userId: snapshot.userId,
    tracks: details.tracks || [],
    clips: details.clips || [],
    playhead: details.playhead || 0,
    version: details.version || 0,
  };
}

export async function getProjectCollaborators(projectId: string): Promise<Array<{ userId: string; name: string | null; role: string; lastActive: Date | null }>> {
  const presences = await db.userPresence.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true } } },
  });

  return presences.map((p) => ({
    userId: p.userId,
    name: p.user.name,
    role: "editor",
    lastActive: p.lastActive,
  }));
}

export async function getCollaborationPresence(projectId: string, currentUserId: string): Promise<Array<{ userId: string; name: string | null; playhead: number }>> {
  const activeTimeout = new Date(Date.now() - 30000);
  const presences = await db.userPresence.findMany({
    where: { projectId, lastActive: { gte: activeTimeout }, userId: { not: currentUserId } },
    include: { user: { select: { id: true, name: true } } },
  });

  return presences.map((p) => {
    const cursor = p.cursorPos as any;
    return {
      userId: p.userId,
      name: p.user.name,
      playhead: cursor?.playhead || 0,
    };
  });
}
