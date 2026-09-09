import { NextResponse } from "next/server";
import { processNextAnalysisJob } from "@/lib/analysis/queue";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
function authorized(request: Request) {
  const token = (process.env.ANALYSIS_WORKER_TOKEN || "").trim();
  if (token && request.headers.get("x-analysis-worker-token") === token) return true;
  const host = new URL(request.url).hostname;
  return host === "127.0.0.1" || host === "localhost" ? request.headers.get("x-analysis-worker-loopback") === "true" : false;
}
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authorization required" }, { status: 401 });
  try { const job = await processNextAnalysisJob(); return NextResponse.json({ processed: !!job, job }); }
  catch (error) { console.error("Analysis worker error", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Worker failed" }, { status: 500 }); }
}
