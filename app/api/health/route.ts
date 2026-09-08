import { NextResponse } from "next/server";
import { accessSync, constants, readFileSync } from "node:fs";
import { resolveStockfishPath } from "@/lib/stockfish/engine";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
function workerHeartbeat() {
  try {
    const value = JSON.parse(readFileSync(process.env.ANALYSIS_WORKER_HEARTBEAT_FILE || "/tmp/chesslysis-worker-heartbeat.json", "utf8")) as { at?: string; state?: string; failures?: number; error?: string };
    const ageMs = value.at ? Date.now() - Date.parse(value.at) : Number.POSITIVE_INFINITY;
    return { configured: Boolean(process.env.ANALYSIS_WORKER_ENABLED !== "false"), alive: ageMs < 15_000, ageMs: Number.isFinite(ageMs) ? ageMs : null, ...value };
  } catch { return { configured: Boolean(process.env.ANALYSIS_WORKER_ENABLED !== "false"), alive: false, ageMs: null, state: "no-heartbeat" }; }
}
export async function GET() {
  const enginePath = resolveStockfishPath(); let stockfishAvailable = false;
  try { accessSync(enginePath, constants.X_OK); stockfishAvailable = true; } catch { /* checked below */ }
  return NextResponse.json({ status: "ok", service: "chesslysis", timestamp: new Date().toISOString(), stockfish: { path: enginePath, available: stockfishAvailable }, worker: workerHeartbeat() });
}
