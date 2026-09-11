import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';

export type UciInfo = { depth?: number; scoreCp?: number; scoreMate?: number; pv?: string[] };
export type StockfishAnalysisResult = {
  depth: number;
  /** White-perspective evaluation in pawns. Mate positions are represented by a finite ±MATE_EVALUATION. */
  evaluation: number;
  /** White-perspective mate score. Positive = White mates in N, negative = Black mates in N. */
  mate: number | null;
  bestMove: string | null;
  principalVariation: string[];
};

export const MATE_EVALUATION = 10;

function parseInfo(line: string): UciInfo | null {
  if (!line.startsWith('info ')) return null;
  const tokens = line.trim().split(/\s+/);
  const info: UciInfo = {};
  const depthIndex = tokens.indexOf('depth');
  if (depthIndex >= 0) {
    const depth = Number(tokens[depthIndex + 1]);
    if (Number.isFinite(depth)) info.depth = depth;
  }
  const scoreIndex = tokens.indexOf('score');
  if (scoreIndex >= 0) {
    const kind = tokens[scoreIndex + 1];
    const value = Number(tokens[scoreIndex + 2]);
    if (kind === 'cp' && Number.isFinite(value)) info.scoreCp = value;
    if (kind === 'mate' && Number.isFinite(value)) info.scoreMate = value;
  }
  const pvIndex = tokens.indexOf('pv');
  if (pvIndex >= 0) info.pv = tokens.slice(pvIndex + 1);
  return info;
}

export function parseUciBestMove(line: string) {
  return /^bestmove\s+(\S+)/.exec(line.trim())?.[1] ?? null;
}

/**
 * Stockfish reports score from the side-to-move's perspective. Convert it once
 * at the engine boundary so every downstream metric uses the same White view.
 */
export function parseUciScore(i: UciInfo, sideToMove: 'white' | 'black' = 'white') {
  const sign = sideToMove === 'white' ? 1 : -1;
  if (typeof i.scoreMate === 'number') {
    const mate = i.scoreMate === 0 ? 0 : i.scoreMate * sign;
    return {
      evaluation: mate === 0 ? 0 : Math.sign(mate) * MATE_EVALUATION,
      mate,
    };
  }
  const rawCp = i.scoreCp ?? 0;
  return { evaluation: (rawCp / 100) * sign, mate: null };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sideToMoveFromFen(fen: string): 'white' | 'black' {
  const side = fen.trim().split(/\s+/)[1];
  return side === 'b' ? 'black' : 'white';
}

export class StockfishUciEngine {
  private process: ChildProcessWithoutNullStreams | null = null;
  private buffer = '';
  private lines: string[] = [];

  constructor(private readonly executablePath: string) {}

  private reset() {
    this.process?.kill('SIGKILL');
    this.process = null;
    this.buffer = '';
    this.lines = [];
  }

  private send(command: string) {
    if (!this.process || this.process.stdin.destroyed) throw new Error('Stockfish process is not running');
    this.process.stdin.write(command + '\n');
  }

  private async waitFor(expected: string, timeoutMs = 10_000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const index = this.lines.findIndex((line) => line.trim() === expected);
      if (index >= 0) return this.lines.splice(0, index + 1);
      if (this.process?.exitCode != null) throw new Error(`Stockfish exited before ${expected} (code ${this.process.exitCode})`);
      await sleep(5);
    }
    throw new Error(`Stockfish timeout waiting for ${expected}`);
  }

  private async start() {
    if (this.process) return;
    const child = spawn(this.executablePath, [], { stdio: 'pipe' });
    this.process = child;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      const parts = this.buffer.split(/\r?\n/);
      this.buffer = parts.pop() ?? '';
      this.lines.push(...parts);
    });
    child.stderr.setEncoding('utf8');
    let spawnError: Error | undefined;
    child.once('error', (error) => { spawnError = error; });

    try {
      this.send('uci');
      await this.waitFor('uciok');
      if (spawnError) throw spawnError;
      this.lines = [];
      this.send('isready');
      await this.waitFor('readyok');
    } catch (error) {
      this.reset();
      throw new Error(`Unable to initialize Stockfish at ${this.executablePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async analyze(fen: string, depth = 18, options: { moveTimeMs?: number } = {}): Promise<StockfishAnalysisResult> {
    await this.start();
    this.lines = [];
    this.send(`position fen ${fen}`);
    const budget = Math.max(80, Math.min(options.moveTimeMs ?? 1000, 10_000));
    this.send(`go movetime ${budget}`);
    let lines: string[];
    try {
      lines = await this.waitForBestMove(Math.max(3000, budget * 8));
    } catch (error) {
      this.reset();
      throw error;
    }

    let latest: UciInfo = {};
    for (const line of lines) {
      const parsed = parseInfo(line);
      if (parsed && typeof parsed.depth === 'number') latest = parsed;
    }
    const score = parseUciScore(latest, sideToMoveFromFen(fen));
    return {
      depth: latest.depth ?? depth,
      evaluation: score.evaluation,
      mate: score.mate,
      bestMove: lines.map(parseUciBestMove).find(Boolean) ?? null,
      principalVariation: latest.pv ?? [],
    };
  }

  private async waitForBestMove(timeoutMs: number) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const index = this.lines.findIndex((line) => line.startsWith('bestmove '));
      if (index >= 0) return this.lines.splice(0, index + 1);
      if (this.process?.exitCode != null) throw new Error(`Stockfish exited during analysis (code ${this.process.exitCode})`);
      await sleep(5);
    }
    throw new Error('Stockfish analysis timed out');
  }

  async close() {
    if (!this.process) return;
    try {
      this.send('quit');
      await Promise.race([once(this.process, 'exit'), sleep(1000)]);
    } finally {
      if (this.process?.exitCode == null) this.process?.kill('SIGKILL');
      this.process = null;
    }
  }
}
