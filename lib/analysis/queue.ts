import { db } from "@/lib/db/prisma";
import { analyzeGame } from "@/lib/analysis/game-analyzer";

export const ANALYSIS_PROFILES = {
  quick: { depth: 10, moveTimeMs: 150, label: "Quick" },
  standard: { depth: 14, moveTimeMs: 400, label: "Standard" },
  deep: { depth: 18, moveTimeMs: 900, label: "Deep" },
} as const;

export type AnalysisProfile = keyof typeof ANALYSIS_PROFILES;
export type QueueSnapshot = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  profile: string; depth: number; requested: number; completed: number; failed: number; remaining: number;
  currentGameId: string | null; cancelRequested: boolean; lastError: string | null;
  createdAt: string; startedAt: string | null; completedAt: string | null;
};

type JobRow = Omit<QueueSnapshot, "createdAt" | "startedAt" | "completedAt"> & { createdAt: Date; startedAt: Date | null; completedAt: Date | null };
function snapshot(job: JobRow): QueueSnapshot { return { ...job, createdAt: job.createdAt.toISOString(), startedAt: job.startedAt?.toISOString() ?? null, completedAt: job.completedAt?.toISOString() ?? null }; }
export function isAnalysisProfile(value: unknown): value is AnalysisProfile { return typeof value === "string" && value in ANALYSIS_PROFILES; }

async function playerFor(username: string) {
  return db.player.findFirst({ where: { platform: "chess.com", username: { equals: username.trim(), mode: "insensitive" } } });
}

/** Recover stale claims after a deploy/crash. Completed analysis is never touched. */
export async function recoverStaleAnalysisWork(staleAfterMs = Number(process.env.ANALYSIS_STALE_AFTER_MS || 5 * 60 * 1000)) {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const stale = await db.analysisJobItem.findMany({ where: { status: "RUNNING", startedAt: { lt: cutoff } }, select: { id: true, gameId: true, jobId: true, attempts: true } });
  if (!stale.length) return 0;
  await db.$transaction([
    db.analysisJobItem.updateMany({ where: { id: { in: stale.map(x => x.id) }, status: "RUNNING" }, data: { status: "QUEUED", startedAt: null, error: "Recovered after stale worker claim" } }),
    db.game.updateMany({ where: { id: { in: stale.map(x => x.gameId) }, analysisStatus: "ANALYZING" }, data: { analysisStatus: "QUEUED" } }),
    db.analysisJob.updateMany({ where: { id: { in: [...new Set(stale.map(x => x.jobId))] }, status: "RUNNING" }, data: { status: "QUEUED", currentGameId: null } }),
  ]);
  return stale.length;
}

export async function createAnalysisJob(username: string, profile: AnalysisProfile, limit: number): Promise<QueueSnapshot> {
  const player = await playerFor(username);
  if (!player) throw new Error("Player not found. Sync games first.");
  await recoverStaleAnalysisWork();

  // One active job per player. Never replace a RUNNING job: doing so could race
  // against an engine process that is currently writing results.
  const existing = await db.analysisJob.findFirst({
    where: { playerId: player.id, status: { in: ["QUEUED", "RUNNING"] }, cancelRequested: false },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return snapshot(existing);


  const games = await db.game.findMany({ where: { playerId: player.id, analysisStatus: { in: ["NOT_ANALYZED", "FAILED"] } }, orderBy: { playedAt: "desc" }, take: limit, select: { id: true } });
  const now = new Date();
  const job = await db.$transaction(async tx => {
    if (games.length) await tx.game.updateMany({ where: { id: { in: games.map(g => g.id) } }, data: { analysisStatus: "QUEUED" } });
    const created = await tx.analysisJob.create({ data: { playerId: player.id, profile, depth: ANALYSIS_PROFILES[profile].depth, requested: games.length, remaining: games.length, status: games.length ? "QUEUED" : "COMPLETED", completedAt: games.length ? null : now } });
    if (games.length) await tx.analysisJobItem.createMany({ data: games.map(g => ({ jobId: created.id, gameId: g.id, status: "QUEUED" })) });
    return created;
  });
  return snapshot(job);
}

export async function getLatestAnalysisJob(username: string): Promise<QueueSnapshot | null> {
  const player = await playerFor(username); if (!player) return null;
  const job = await db.analysisJob.findFirst({ where: { playerId: player.id }, orderBy: { createdAt: "desc" } });
  return job ? snapshot(job) : null;
}

async function finalize(jobId: string): Promise<QueueSnapshot> {
  const fresh = await db.analysisJob.findUniqueOrThrow({ where: { id: jobId } });
  const terminal = fresh.remaining <= 0 || fresh.cancelRequested;
  const status = fresh.cancelRequested ? "CANCELLED" : (fresh.remaining <= 0 ? (fresh.completed === 0 && fresh.failed > 0 ? "FAILED" : "COMPLETED") : "QUEUED");
  const updated = await db.analysisJob.update({ where: { id: jobId }, data: { status, currentGameId: null, completedAt: terminal ? new Date() : null } });
  return snapshot(updated);
}

/** Process exactly one claimed item. Safe to call from multiple workers. */
export async function processAnalysisJob(jobId: string): Promise<QueueSnapshot> {
  await recoverStaleAnalysisWork();
  const job = await db.analysisJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Analysis job not found.");
  if (["COMPLETED", "CANCELLED", "FAILED"].includes(job.status)) return snapshot(job);
  if (job.cancelRequested) return finalize(jobId);

  const candidate = await db.analysisJobItem.findFirst({ where: { jobId, status: "QUEUED" }, orderBy: { id: "asc" }, select: { id: true, gameId: true } });
  if (!candidate) return finalize(jobId);

  // Atomic claim prevents two concurrent requests from analyzing the same game.
  const claim = await db.analysisJobItem.updateMany({ where: { id: candidate.id, status: "QUEUED" }, data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } } });
  if (claim.count === 0) return snapshot((await db.analysisJob.findUniqueOrThrow({ where: { id: jobId } })));

  await db.$transaction([
    db.analysisJob.update({ where: { id: jobId }, data: { status: "RUNNING", startedAt: job.startedAt ?? new Date(), currentGameId: candidate.gameId } }),
    db.game.update({ where: { id: candidate.gameId }, data: { analysisStatus: "ANALYZING" } }),
  ]);

  let succeeded = false; let message: string | null = null;
  try {
    const profile = Object.values(ANALYSIS_PROFILES).find(p => p.depth === job.depth);
    await analyzeGame(candidate.gameId, { depth: job.depth, moveTimeMs: profile?.moveTimeMs });
    succeeded = true;
  }
  catch (error) { message = error instanceof Error ? error.message : "Unknown analysis error"; }

  const now = new Date();
  await db.$transaction(async tx => {
    await tx.analysisJobItem.update({ where: { id: candidate.id }, data: { status: succeeded ? "COMPLETED" : "FAILED", error: message, completedAt: now } });
    const fresh = await tx.analysisJob.findUniqueOrThrow({ where: { id: jobId } });
    await tx.analysisJob.update({ where: { id: jobId }, data: { completed: fresh.completed + (succeeded ? 1 : 0), failed: fresh.failed + (succeeded ? 0 : 1), remaining: Math.max(0, fresh.remaining - 1), currentGameId: null, lastError: message, status: fresh.cancelRequested ? "CANCELLED" : "QUEUED" } });
  });
  return finalize(jobId);
}

/** Worker helper: find one active job and process one item. */
export async function processNextAnalysisJob(): Promise<QueueSnapshot | null> {
  await recoverStaleAnalysisWork();
  const job = await db.analysisJob.findFirst({ where: { status: { in: ["QUEUED", "RUNNING"] }, cancelRequested: false, remaining: { gt: 0 } }, orderBy: { createdAt: "asc" } });
  return job ? processAnalysisJob(job.id) : null;
}

export async function getAnalysisQueueDiagnostics(username: string) {
  const player = await playerFor(username); if (!player) return null;
  const job = await db.analysisJob.findFirst({ where: { playerId: player.id }, orderBy: { createdAt: "desc" }, include: { items: { orderBy: { id: "asc" } } } });
  if (!job) return { job: null, items: [], workerConfigured: Boolean(process.env.ANALYSIS_WORKER_TOKEN && process.env.ANALYSIS_WORKER_ENABLED !== "false") };
  return { job: snapshot(job), workerConfigured: Boolean(process.env.ANALYSIS_WORKER_TOKEN && process.env.ANALYSIS_WORKER_ENABLED !== "false"), items: job.items.map(i => ({ id:i.id, gameId:i.gameId, status:i.status, attempts:i.attempts, error:i.error, startedAt:i.startedAt?.toISOString()??null, completedAt:i.completedAt?.toISOString()??null })) };
}

export async function cancelAnalysisJob(jobId: string): Promise<QueueSnapshot> {
  const job = await db.analysisJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Analysis job not found.");
  if (["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) return snapshot(job);
  const queued = await db.analysisJobItem.findMany({ where: { jobId, status: "QUEUED" }, select: { gameId: true } });
  await db.$transaction([
    db.analysisJob.update({ where: { id: jobId }, data: { cancelRequested: true, status: "CANCELLED", currentGameId: null, completedAt: new Date() } }),
    db.analysisJobItem.updateMany({ where: { jobId, status: "QUEUED" }, data: { status: "CANCELLED", completedAt: new Date() } }),
    db.game.updateMany({ where: { id: { in: queued.map(x => x.gameId) }, analysisStatus: "QUEUED" }, data: { analysisStatus: "NOT_ANALYZED" } }),
  ]);
  return snapshot(await db.analysisJob.findUniqueOrThrow({ where: { id: jobId } }));
}
