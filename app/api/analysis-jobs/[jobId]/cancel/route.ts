import { NextResponse } from "next/server";
import { cancelAnalysisJob } from "@/lib/analysis/queue";
export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try { return NextResponse.json({ job: await cancelAnalysisJob(jobId) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to cancel analysis job." }, { status: 500 }); }
}
