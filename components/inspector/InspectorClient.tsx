"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import GameReviewBoard from "@/components/chessboard/GameReviewBoard";
import { analysisCoverage } from "@/lib/inspector/coverage";
import { fetchJson } from "@/lib/api/fetch-json";

type GameSummary = {
  id: string; whiteUsername: string; blackUsername: string; result: string;
  timeControl: string | null; playedAt: string | null; analysisStatus: string;
};
type Review = {
  id: string; white: string; black: string; result: string; timeControl: string; date: string;
  moves: { ply:number; moveNumber:number; color:"w"|"b"; san:string; fenAfter:string }[];
  analyses: Record<number, { evaluationAfter:number|null; bestMove:string|null; principalVariation:string[]; evaluationLoss:number; classification:string }>;
};

export default function InspectorClient({ username }: { username: string }) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const body = await fetchJson<{games: GameSummary[]}>(`/api/players/${encodeURIComponent(username)}/games`, { cache: "no-store" });
      const items = body.games;
      setGames(items);
      if (items[0]) setSelected(items[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load games.");
    } finally { setLoading(false); }
  }, [username]);

  useEffect(() => { void loadGames(); }, [loadGames]);

  useEffect(() => {
    if (!selected) { setReview(null); return; }
    let cancelled = false;
    async function loadReview() {
      setReviewLoading(true);
      try {
        const body = await fetchJson<Review>(`/api/games/${selected}/review`, { cache: "no-store" });
        if (!cancelled) setReview(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load game.");
      } finally { if (!cancelled) setReviewLoading(false); }
    }
    void loadReview();
    return () => { cancelled = true; };
  }, [selected]);

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-8 text-slate-400">Loading your real imported games…</main>;
  if (error && games.length === 0) return <main className="mx-auto max-w-7xl px-4 py-8"><div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200"><h1 className="font-bold">Game Inspector unavailable</h1><p className="mt-2 text-sm">{error}</p><div className="mt-4 flex gap-3"><button onClick={() => void loadGames()} className="rounded-lg bg-white/10 px-3 py-2 text-sm">Retry</button><Link href={`/dashboard/${encodeURIComponent(username)}`} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950">Open dashboard</Link></div></div></main>;

  return <main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">
    <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Real game analysis</p><h1 className="mt-2 text-3xl font-bold">Game Inspector</h1><p className="mt-2 text-sm text-slate-400">Select an imported game and inspect its real moves and stored engine analysis.</p></div>
      <Link href={`/dashboard/${encodeURIComponent(username)}`} className="text-sm text-cyan-300 hover:text-cyan-200">← Dashboard</Link>
    </div>

    {games.length === 0 ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-6 text-slate-300"><h2 className="font-semibold">No imported games yet</h2><p className="mt-2 text-sm text-slate-400">Open the dashboard for this username to import public Chess.com games first.</p></div> :
    <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="max-h-[760px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1320] p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Recent games</p>
        <div className="space-y-2">{games.map((game) => <button key={game.id} onClick={() => setSelected(game.id)}
          className={`w-full rounded-xl p-3 text-left transition ${selected === game.id ? "bg-cyan-400/10 ring-1 ring-cyan-400/30" : "hover:bg-white/[.04]"}`}>
          <div className="truncate text-sm font-medium">{game.whiteUsername} vs {game.blackUsername}</div>
          <div className="mt-1 text-xs text-slate-500">{game.result} · {game.timeControl ?? "Unknown"}</div>
          <div className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] ${game.analysisStatus === "COMPLETED" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{game.analysisStatus === "COMPLETED" ? "ANALYZED" : "NOT ANALYZED"}</div>
        </button>)}</div>
      </aside>
      <section className="min-w-0">
        {reviewLoading ? <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-8 text-slate-400">Loading selected game…</div> :
        review ? <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-5 text-slate-100"><div className="mb-5 text-slate-100"><h2 className="text-xl font-bold">{review.white} vs {review.black}</h2><p className="text-sm text-slate-400">{review.result} · {review.timeControl} · {new Date(review.date).toLocaleDateString()}</p></div>
          <GameReviewBoard moves={review.moves} analyses={review.analyses} />
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4 text-slate-300"><h3 className="font-semibold">Analysis coverage</h3><p className="mt-1 text-sm text-slate-400">{Object.values(review.analyses).filter(a => a.classification !== "UNANALYZED").length} of {review.moves.length} moves have stored engine classifications ({analysisCoverage(review.moves.length, Object.values(review.analyses).filter(a => a.classification !== "UNANALYZED").length)}%). Unanalyzed games remain fully reviewable and can be analyzed from the dashboard.</p></div>
        </div> : null}
      </section>
    </div>}
  </main>;
}
