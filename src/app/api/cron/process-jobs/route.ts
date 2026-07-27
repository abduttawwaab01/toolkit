import { processPendingJobs } from "@/lib/job-queue";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const processed = await processPendingJobs();
    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
