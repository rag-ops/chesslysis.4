import { NextResponse } from "next/server";
import { processAnalysisJob } from "@/lib/analysis/queue";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try { return NextResponse.json({ job: await processAnalysisJob(jobId) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process analysis job." }, { status: 500 }); }
}
