const fs = require('node:fs');
const base = `http://127.0.0.1:${process.env.PORT || 10000}`;
const token = process.env.ANALYSIS_WORKER_TOKEN || '';
const idleMs = Number(process.env.ANALYSIS_WORKER_IDLE_MS || 2000);
const busyMs = Number(process.env.ANALYSIS_WORKER_BUSY_MS || 250);
const timeoutMs = Number(process.env.ANALYSIS_WORKER_REQUEST_TIMEOUT_MS || 10 * 60 * 1000);
const heartbeatFile = process.env.ANALYSIS_WORKER_HEARTBEAT_FILE || '/tmp/chesslysis-worker-heartbeat.json';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let consecutiveFailures = 0;

function heartbeat(extra = {}) {
  try {
    fs.writeFileSync(heartbeatFile, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), failures: consecutiveFailures, ...extra }));
  } catch (error) {
    console.error('[analysis-worker] heartbeat write failed:', error.message);
  }
}

async function tick() {
  heartbeat({ state: 'polling' });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const headers = token ? { 'x-analysis-worker-token': token } : {};
    const response = await fetch(`${base}/api/internal/analysis-worker`, { method: 'POST', headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`worker endpoint ${response.status}: ${await response.text()}`);
    const data = await response.json();
    consecutiveFailures = 0;
    heartbeat({ state: data.processed ? 'processing' : 'idle', jobId: data.job?.id ?? null, jobStatus: data.job?.status ?? null });
    if (data.processed) console.log(`[analysis-worker] processed job ${data.job?.id ?? 'unknown'} (${data.job?.completed ?? 0} complete, ${data.job?.remaining ?? 0} remaining)`);
    return Boolean(data.processed);
  } catch (error) {
    consecutiveFailures++;
    const backoff = Math.min(30000, idleMs * Math.max(1, consecutiveFailures));
    const message = error instanceof Error ? error.message : String(error);
    heartbeat({ state: 'error', error: message });
    console.error(`[analysis-worker] tick failed (${consecutiveFailures}), retrying in ${backoff}ms: ${message}`);
    await sleep(backoff);
    return false;
  }
}

(async () => {
  heartbeat({ state: 'starting' });
  console.log(`[analysis-worker] started; target=${base}; auth=${token ? 'token' : 'loopback-only'}`);
  while (true) await sleep((await tick()) ? busyMs : idleMs);
})().catch(error => {
  heartbeat({ state: 'fatal', error: error.message });
  console.error('[analysis-worker] fatal', error);
  process.exit(1);
});
