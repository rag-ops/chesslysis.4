import { describe, expect, it } from 'vitest';
import { parseUciBestMove, parseUciScore } from '../../lib/stockfish/uci';

describe('UCI parsing', () => {
  it('parses bestmove', () => {
    expect(parseUciBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
  });

  it('parses centipawn score', () => {
    expect(parseUciScore({ scoreCp: 137 })).toEqual({ evaluation: 1.37, mate: null });
  });

  it('parses mate score', () => {
    expect(parseUciScore({ scoreMate: 3 })).toEqual({ evaluation: 100000, mate: 3 });
  });
});
