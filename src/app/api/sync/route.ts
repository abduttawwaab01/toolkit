import { withApiAuth } from "@/lib/api-auth";
import { saveProjectSnapshot, getLatestSnapshot, getCollaborationPresence } from "@/lib/sync";

export const POST = withApiAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { projectId, tracks, clips, playhead, version } = body;

    const result = await saveProjectSnapshot({
      projectId,
      userId: auth.userId,
      tracks: tracks || [],
      clips: clips || [],
      playhead: playhead || 0,
      version: version || 0,
    });

    const presence = await getCollaborationPresence(projectId, auth.userId);

    return new Response(JSON.stringify({ version: result.version, collaborators: presence }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ version: 0, collaborators: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const GET = withApiAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return new Response(JSON.stringify({ error: "projectId required" }), { status: 400 });

    const snapshot = await getLatestSnapshot(projectId);
    const presence = await getCollaborationPresence(projectId, auth.userId);

    return new Response(JSON.stringify({ data: snapshot, collaborators: presence }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ data: null, collaborators: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
