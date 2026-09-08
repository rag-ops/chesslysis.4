import { NextResponse } from "next/server";
import { processNextAnalysisJob } from "@/lib/analysis/queue";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request) {
  const token = process.env.ANALYSIS_WORKER_TOKEN;
  // Production deployments normally use a generated secret. If it is absent,
  // permit only the in-container loopback worker so jobs cannot get stuck in
  // QUEUED state because a hosting dashboard omitted one optional variable.
  if (token) return request.headers.get("x-analysis-worker-token") === token;
  const host = new URL(request.url).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authorization required" }, { status: 401 });
  try {
    const job = await processNextAnalysisJob();
    return NextResponse.json({ processed: !!job, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker failed";
    console.error("[analysis-worker-route]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
