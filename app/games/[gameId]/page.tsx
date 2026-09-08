import { notFound } from "next/navigation";
import GameReviewBoard from "@/components/chessboard/GameReviewBoard";
import { getGameReview } from "@/lib/db/review";
import AppShell from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function GameReviewPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await getGameReview(gameId);
  if (!game) notFound();

  return (
    <AppShell username={game.playerUsername}>
      <main>
        <header className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3 lg:px-8">
          <div className="min-w-[250px] flex-1">
            <div className="text-sm font-bold">
              {game.white} <span className="text-[var(--muted)]">vs.</span> {game.black}
            </div>
            <div className="mt-1 flex gap-3 text-[10px] text-[var(--muted)]">
              <span>{game.date}</span>
              <span>{game.timeControl}</span>
            </div>
          </div>
          <span className="border border-[var(--ink)] px-2 py-1 text-sm font-bold">{game.result}</span>
          <span className="text-[11px] text-[var(--muted)]">{game.moves.length} moves</span>
          {game.playerAccuracy != null && (
            <span className="text-[11px] text-[var(--muted)]">
              {game.playerAccuracy.toFixed(1)}% accuracy
            </span>
          )}
          {game.playerACPL != null && (
            <span className="text-[11px] text-[var(--muted)]">
              {game.playerACPL.toFixed(1)} ACPL
            </span>
          )}
          <button type="button" className="ch-btn-secondary px-3 py-2 text-[11px]">⌄ Export PGN</button>
          <a href={`/report/${gameId}`} className="ch-btn-secondary px-3 py-2 text-[11px]">Game Report</a>
          <button type="button" className="ch-btn-secondary px-3 py-2 text-[11px]">↗ Share</button>
          <a href="/analyze" className="ch-btn-primary px-3 py-2 text-[11px] font-bold">＋ New Analysis</a>
        </header>
        <GameReviewBoard moves={game.moves} analyses={game.analyses} />
      </main>
    </AppShell>
  );
}
