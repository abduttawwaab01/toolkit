import { maybeRunCleanup } from "@/lib/cleanup";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await maybeRunCleanup();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
