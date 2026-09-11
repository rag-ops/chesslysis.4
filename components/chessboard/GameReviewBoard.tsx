'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import ChessPiece from '@/components/chessboard/ChessPiece';

type Move = { ply: number; moveNumber: number; color: 'w' | 'b'; san: string; uci: string; fenBefore: string; fenAfter: string };
type Analysis = { evaluationAfter: number | null; mate: number | null; bestMove: string | null; bestMoveSan: string | null; principalVariation: string[]; evaluationLoss: number | null; classification: string };

function tone(c?: string) {
  if (!c) return 'border-[var(--line)] text-[var(--muted)]';
  if (c.includes('BLUNDER')) return 'border-[var(--danger)] bg-[var(--danger)] text-white';
  if (c.includes('MISTAKE')) return 'border-[var(--warning)]/60 text-[var(--warning)]';
  if (c.includes('INACCURACY')) return 'border-[#b89358] text-[#9b773f]';
  return 'border-[var(--accent)] text-[var(--accent)]';
}

function formatEval(v: number | null, mate: number | null) {
  if (mate != null && mate !== 0) return mate > 0 ? `M${Math.abs(mate)}` : `−M${Math.abs(mate)}`;
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
}

function clampEval(v: number) {
  return Math.max(-10, Math.min(10, Number.isFinite(v) ? v : 0));
}

export default function GameReviewBoard({ moves, analyses = {} }: { moves: Move[]; analyses?: Record<number, Analysis> }) {
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? moves[index] : undefined;
  const fen = index < 0 ? new Chess().fen() : (current?.fenAfter ?? new Chess().fen());
  const chess = useMemo(() => {
    const c = new Chess();
    try { c.load(fen); } catch { /* keep start position as a safe fallback */ }
    return c;
  }, [fen]);
  const board = chess.board();
  const a = current ? analyses[current.ply] : undefined;
  const evals = moves.map((m) => clampEval(analyses[m.ply]?.evaluationAfter ?? 0));
  const max = Math.max(2, ...evals.map((v) => Math.abs(v)));
  const before = index > 0 ? analyses[moves[index - 1].ply]?.evaluationAfter ?? 0 : 0;
  const after = a?.evaluationAfter ?? 0;
  const lastFrom = current?.uci?.slice(0, 2), lastTo = current?.uci?.slice(2, 4);

  const select = (next: number) => setIndex(Math.max(-1, Math.min(moves.length - 1, next)));
  const verdictText = a?.mate && Math.abs(a.mate) === 1 && ((a.mate > 0 && current?.color === 'w') || (a.mate < 0 && current?.color === 'b'))
    ? 'Checkmate. The move ends the game immediately.'
    : a?.evaluationLoss != null
      ? `Evaluation change: ${a.evaluationLoss.toFixed(2)} pawns from the player's perspective.`
      : 'Engine analysis will describe the consequence of this move once available.';
  const evidenceText = a?.classification === 'BEST'
    ? 'The played move matches the engine’s selected continuation.'
    : a?.classification
      ? 'Verdict is based on the bounded engine evaluation change and the selected legal continuation.'
      : 'No move selected.';

  return <div className="border-y border-[var(--line)] bg-[var(--surface)]">
    {/* The compact navigator stays close to the board instead of making users
        travel to the bottom of a long move list. */}
    <div className="sticky top-[56px] z-40 border-b border-[var(--line)] bg-[var(--surface-strong)]/95 px-3 py-2 backdrop-blur sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2">
        <span className="ch-eyebrow hidden sm:inline">MOVE</span>
        <span className="ch-mono min-w-16 text-[11px] font-bold">{current ? `${current.moveNumber}${current.color === 'b' ? '…' : '.'} ${current.san}` : 'Start position'}</span>
        <div className="ml-auto flex gap-1">
          <button aria-label="First move" onClick={() => select(-1)} className="ch-btn-secondary h-8 w-8 p-0 text-xs">|◀</button>
          <button aria-label="Previous move" onClick={() => select(index - 1)} className="ch-btn-secondary h-8 w-8 p-0 text-xs">◀</button>
          <button aria-label="Next move" onClick={() => select(index + 1)} className="ch-btn-secondary h-8 w-8 p-0 text-xs">▶</button>
          <button aria-label="Last move" onClick={() => select(moves.length - 1)} className="ch-btn-secondary h-8 w-8 p-0 text-xs">▶|</button>
        </div>
        <span className="ch-mono hidden text-[9px] text-[var(--muted)] sm:inline">{index < 0 ? 0 : index + 1}/{moves.length}</span>
      </div>
    </div>

    <div className="grid lg:grid-cols-[280px_minmax(440px,1fr)_330px]">
      <aside className="order-2 flex min-h-0 flex-col border-r border-[var(--line)] lg:order-1 lg:h-[calc(100vh-145px)] lg:sticky lg:top-[105px]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3"><span className="ch-eyebrow">Moves</span><span className="ch-mono text-[9px] text-[var(--muted)]">{moves.length} total</span></div>
        <div className="max-h-[48vh] flex-1 overflow-y-auto lg:max-h-none">
          {moves.map((m, i) => {
            const c = analyses[m.ply]?.classification;
            return <button key={m.ply} onClick={() => setIndex(i)} className={`flex w-full items-center gap-3 border-b border-[var(--line)] px-4 py-2.5 text-left text-[12px] transition ${i === index ? 'border-l-2 border-l-[var(--accent)] bg-[var(--surface-strong)]' : 'hover:bg-[var(--surface-strong)]'}`}>
              <span className="ch-mono w-8 text-[10px] opacity-50">{m.color === 'w' ? `${m.moveNumber}.` : ''}</span>
              <span className="ch-mono flex-1">{m.san}</span>
              <span className={`border px-1 py-0.5 text-[8px] font-bold ${tone(c)}`}>{(c || 'UNANALYZED').replace('INACCURACY', 'INAC').replace('BLUNDER', 'BLNDR')}</span>
            </button>;
          })}
        </div>
      </aside>

      <section className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-[105px] lg:h-[calc(100vh-145px)] lg:self-start">
        <div className="border-b border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden border border-[var(--line)] bg-[var(--board-light)]">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${Math.max(3, Math.min(97, 50 + (clampEval(after) / max) * 45))}%` }} />
            </div>
            <span className="ch-mono w-14 text-right text-[11px] font-bold">{formatEval(after, a?.mate ?? null)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[8px] uppercase tracking-[.16em] text-[var(--muted)]"><span>Black</span><span>White</span></div>
        </div>

        <div className="flex min-h-[min(74vw,620px)] items-center justify-center p-4 sm:p-8 lg:min-h-0 lg:h-[calc(100vh-285px)] lg:p-8">
          <div className="w-full max-w-[620px]">
            <div className="aspect-square w-full border border-[var(--line)] shadow-[0_18px_40px_rgba(31,29,24,.18)]">
              <div className="grid h-full w-full grid-cols-8">
                {board.flatMap((row, r) => row.map((piece, c) => {
                  const sq = 'abcdefgh'[c] + (8 - r);
                  const active = sq === lastFrom || sq === lastTo;
                  return <div key={sq} className={`relative flex aspect-square items-center justify-center ${((r + c) % 2 === 0) ? 'bg-[var(--board-light)]' : 'bg-[var(--board-dark)]'} ${active ? 'after:absolute after:inset-0 after:bg-[color-mix(in_srgb,var(--accent)_28%,transparent)]' : ''}`}>
                    <div className="relative z-10 grid h-full w-full place-items-center p-1 sm:p-1.5">{piece && <ChessPiece color={piece.color as 'w' | 'b'} type={piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k'} />}</div>
                    {c === 0 && <span className="absolute left-1 top-1 z-20 text-[8px] font-semibold opacity-50">{8 - r}</span>}
                    {r === 7 && <span className="absolute bottom-1 right-1 z-20 text-[8px] font-semibold opacity-50">{'abcdefgh'[c]}</span>}
                  </div>;
                }))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
          <div className="relative h-14"><svg viewBox="0 0 900 100" preserveAspectRatio="none" className="h-full w-full" aria-label="Move evaluation timeline">
            <path d={`M0,50 ${evals.map((v, i) => { const x = evals.length < 2 ? 0 : i / (evals.length - 1) * 900; const y = 50 - v / max * 38; return `L${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')} L900,100 L0,100 Z`} fill="var(--ink)" opacity=".08" />
            <line x1="0" x2="900" y1="50" y2="50" stroke="var(--line)" />
            {index >= 0 && <line x1={`${index / Math.max(1, moves.length - 1) * 900}`} x2={`${index / Math.max(1, moves.length - 1) * 900}`} y1="0" y2="100" stroke="var(--accent)" strokeWidth="4" />}
          </svg></div>
        </div>
      </section>

      <aside className="order-3 border-l border-[var(--line)] bg-[var(--surface-strong)] lg:sticky lg:top-[105px] lg:h-[calc(100vh-145px)] lg:self-start lg:overflow-y-auto">
        <div className="flex justify-between border-b border-[var(--line)] px-5 py-3"><span className="ch-eyebrow">Analysis</span><span className="ch-mono text-[9px] text-[var(--muted)]">Move {current?.moveNumber ?? '—'}</span></div>
        <div className="divide-y divide-[var(--line)]">
          <div className="p-5"><div className="flex justify-between"><span className="ch-eyebrow">Engine</span><span className="ch-mono text-[9px] text-[var(--accent)]">STOCKFISH</span></div><div className="ch-mono mt-4 text-[11px] leading-6 text-[var(--muted)]">{a?.principalVariation?.slice(0, 7).join(' ') || 'Select a move to inspect the engine line.'}</div><div className="mt-4 text-3xl font-black text-[var(--accent)]">{formatEval(a?.evaluationAfter ?? null, a?.mate ?? null)}</div></div>
          <div className="p-5"><div className="ch-eyebrow">Move verdict</div><div className={`mt-2 text-xl font-black ${((a?.classification || '').includes('BLUNDER')) ? 'text-[var(--danger)]' : ((a?.classification || '').includes('MISTAKE')) ? 'text-[var(--warning)]' : 'text-[var(--accent)]'}`}>{(a?.classification || 'UNANALYZED').replaceAll('_', ' ')}</div><p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">{verdictText}</p><div className="ch-mono mt-4 inline-flex border border-[var(--line)] px-2 py-1 text-[10px]"><span className="text-[var(--accent)]">{formatEval(before, null)}</span><span className="mx-2">→</span><span>{formatEval(after, a?.mate ?? null)}</span></div></div>
          <div className="p-5"><div className="ch-eyebrow">Best continuation</div><div className="ch-mono mt-3 text-sm font-bold text-[var(--accent)]">{a?.bestMoveSan || a?.bestMove || '—'}</div>{a?.bestMoveSan && a?.bestMove && <p className="mt-1 ch-mono text-[9px] text-[var(--muted)]">UCI {a.bestMove}</p>}<p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">The engine's preferred legal move from the position before the selected move.</p></div>
          <div className="p-5"><div className="border-l-2 border-[var(--warning)] bg-[var(--bg)] p-3"><div className="ch-eyebrow text-[var(--warning)]">Evidence</div><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{evidenceText}</p></div></div>
        </div>
      </aside>
    </div>
  </div>;
}
