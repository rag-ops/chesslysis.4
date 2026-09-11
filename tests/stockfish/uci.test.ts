import { describe, expect, it } from 'vitest';
import { MATE_EVALUATION, parseUciBestMove, parseUciScore } from '../../lib/stockfish/uci';

describe('UCI parsing', () => {
  it('parses bestmove', () => {
    expect(parseUciBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
  });

  it('normalizes centipawn scores to White perspective', () => {
    expect(parseUciScore({ scoreCp: 137 }, 'white')).toEqual({ evaluation: 1.37, mate: null });
    expect(parseUciScore({ scoreCp: 137 }, 'black')).toEqual({ evaluation: -1.37, mate: null });
  });

  it('keeps mate finite and preserves its White-perspective distance', () => {
    expect(parseUciScore({ scoreMate: 1 }, 'white')).toEqual({ evaluation: MATE_EVALUATION, mate: 1 });
    expect(parseUciScore({ scoreMate: -1 }, 'black')).toEqual({ evaluation: MATE_EVALUATION, mate: 1 });
    expect(parseUciScore({ scoreMate: 1 }, 'black')).toEqual({ evaluation: -MATE_EVALUATION, mate: -1 });
  });
});
