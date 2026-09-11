import { notFound } from 'next/navigation';
import GameReviewBoard from '@/components/chessboard/GameReviewBoard';
import EvaluationGraph from '@/components/evaluation/EvaluationGraph';
import { getGameReview } from '@/lib/db/review';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function GameReviewPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await getGameReview(gameId);
  if (!game) notFound();

  return <AppShell username={game.playerUsername}>
    <main>
      <header className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur sm:px-5 lg:px-8">
        <div className="min-w-[220px] flex-1"><div className="text-sm font-bold">{game.white} <span className="text-[var(--muted)]">vs.</span> {game.black}</div><div className="mt-1 flex gap-3 text-[10px] text-[var(--muted)]"><span>{game.date}</span><span>{game.timeControl}</span></div></div>
        <span className="border border-[var(--ink)] px-2 py-1 text-sm font-bold">{game.result}</span>
        <span className="ch-mono text-[10px] text-[var(--muted)]">{game.moves.length} plies</span>
        {game.playerAccuracy != null && <span className="ch-mono text-[10px] text-[var(--muted)]">{game.playerAccuracy.toFixed(1)}% accuracy</span>}
        {game.playerACPL != null && <span className="ch-mono text-[10px] text-[var(--muted)]">{game.playerACPL.toFixed(1)} ACPL</span>}
        <a href="/analyze" className="ch-btn-primary px-3 py-2 text-[11px] font-bold">＋ New Analysis</a>
      </header>
      <GameReviewBoard moves={game.moves} analyses={game.analyses} />
      <div className="px-4 py-6 sm:px-6 lg:px-10"><EvaluationGraph points={game.moves.map((m) => ({ ply: m.ply, evaluation: game.analyses[m.ply]?.evaluationAfter ?? null, mate: game.analyses[m.ply]?.mate ?? null }))} /></div>
    </main>
  </AppShell>;
}
