import type { StockfishAnalysisResult } from './uci';
import { StockfishUciEngine } from './uci';

export type EngineAnalysisResult = StockfishAnalysisResult;

export interface ChessEngine {
  analyze(fen: string, depth?: number, options?: { moveTimeMs?: number }): Promise<EngineAnalysisResult>;
}

/**
 * Resolve Stockfish in a production-friendly order. Render's Debian image
 * installs the package at /usr/games/stockfish, while local installations may
 * expose it on PATH as `stockfish`.
 */
export function resolveStockfishPath(): string {
  const configured = process.env.STOCKFISH_PATH?.trim();
  if (configured) return configured;
  if (process.platform === 'win32') return 'stockfish.exe';
  return '/usr/games/stockfish';
}

export function createStockfishEngine(): ChessEngine {
  return new StockfishUciEngine(resolveStockfishPath());
}
