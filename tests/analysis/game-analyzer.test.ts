import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { evaluationFromPlayerPerspective, evaluationLoss } from '@/lib/chess/evaluation';
import { classifyEvaluationLoss } from '@/lib/analysis/classifier';
import { moveDeliversCheckmate, uciToSan } from '@/lib/analysis/game-analyzer';

describe('move analysis primitives', () => {
  it('normalizes black evaluation to the player perspective', () => {
    expect(evaluationFromPlayerPerspective(1.25, 'black')).toBe(-1.25);
  });

  it('never reports negative evaluation loss and bounds mate-scale values', () => {
    expect(evaluationLoss(0.5, 0.8)).toBe(0);
    expect(evaluationLoss(0.8, 0.2)).toBeCloseTo(0.6, 10);
    expect(evaluationLoss(100000, -100000)).toBe(10);
  });

  it('classifies progressively larger losses', () => {
    expect(classifyEvaluationLoss(0.02)).toBe('BEST');
    expect(classifyEvaluationLoss(0.35)).toBe('GOOD');
    expect(classifyEvaluationLoss(1.2)).toBe('MISTAKE');
    expect(classifyEvaluationLoss(3)).toBe('BLUNDER');
  });

  it('does not treat the side that gets mated as the checkmating player', () => {
    const position = new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');
    expect(position.isCheckmate()).toBe(true);
    expect(position.turn()).toBe('b');
  });

  it('recognizes a real checkmate from the resulting position and assigns it to the mover', () => {
    const fenAfter = '1R4k1/5ppp/8/8/8/8/8/6K1 b - - 0 1';
    expect(moveDeliversCheckmate(fenAfter, 'white')).toBe(true);
    expect(moveDeliversCheckmate(fenAfter, 'black')).toBe(false);
  });

  it('converts an engine UCI move into the exact SAN used in the position', () => {
    const fen = '6k1/5ppp/8/8/8/8/1R6/6K1 w - - 0 1';
    expect(uciToSan(fen, 'b2b8')).toBe('Rb8#');
  });

  it('returns null for an invalid engine move instead of inventing SAN', () => {
    const fen = '6k1/5ppp/8/8/8/8/1R6/6K1 w - - 0 1';
    expect(uciToSan(fen, 'a1a8')).toBeNull();
    expect(uciToSan(fen, '0000')).toBeNull();
  });
});
