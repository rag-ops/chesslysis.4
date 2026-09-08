import { NextResponse } from "next/server";
import { ANALYSIS_PROFILES, createAnalysisJob, getLatestAnalysisJob, isAnalysisProfile } from "@/lib/analysis/queue";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const job = await getLatestAnalysisJob(username);
  return NextResponse.json({ job });
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const input = body && typeof body === "object" ? body as { profile?: unknown; limit?: unknown } : {};
  const profile = isAnalysisProfile(input.profile) ? input.profile : "quick";
  const raw = typeof input.limit === "number" ? input.limit : Number(input.limit);
  const limit = Number.isFinite(raw) ? Math.max(1, Math.min(25, Math.trunc(raw))) : 5;
  try {
    const job = await createAnalysisJob(username, profile, limit);
    return NextResponse.json({ job, profiles: ANALYSIS_PROFILES });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create analysis job." }, { status: 500 });
  }
}
