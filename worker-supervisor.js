const { spawn } = require('node:child_process');

const restartDelayMs = Math.max(1000, Number(process.env.ANALYSIS_WORKER_RESTART_DELAY_MS || 5000));
let stopping = false;
let child = null;
let restartTimer = null;

function log(message) {
  console.log(`${new Date().toISOString()} ${message}`);
}

function start() {
  if (stopping || child) return;
  log('[worker-supervisor] starting analysis worker');
  child = spawn(process.execPath, ['worker.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  child.once('error', (error) => {
    log(`[worker-supervisor] child error: ${error.message}`);
  });

  child.once('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    log(`[worker-supervisor] worker exited (code=${code ?? 'null'}, signal=${signal ?? 'none'}); restarting in ${restartDelayMs}ms`);
    restartTimer = setTimeout(() => {
      restartTimer = null;
      start();
    }, restartDelayMs);
  });
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  log(`[worker-supervisor] received ${signal}; shutting down`);
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = null;
  if (child) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1500).unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
start();
