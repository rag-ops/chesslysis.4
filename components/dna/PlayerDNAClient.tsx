"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AsyncState";

type Dimension = { key: string; label: string; score: number; evidence: string };
type DNA = { username: string; gamesAnalyzed: number; confidence: string; archetype: string; summary: string; dimensions: Dimension[] };

export default function PlayerDNAClient({ username }: { username: string }) {
  const [data, setData] = useState<DNA | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(username)}/dna`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to load Player DNA");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load Player DNA"); }
  }, [username]);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorState title="Could not build Player DNA" message={error} onRetry={load} />;
  if (!data) return <LoadingState title="Building your player fingerprint from real analyzed games..." />;
  return <AppShell username={data.username}><main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
    <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-[#101724] to-cyan-500/10 p-6 md:p-9">
      <div className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Phase 2.6 · Player DNA</div>
      <h1 className="mt-3 text-3xl font-bold md:text-5xl">{data.archetype}</h1>
      <p className="mt-3 max-w-3xl text-slate-400">{data.summary}</p>
      <div className="mt-5 flex gap-3 text-xs"><Badge>{data.gamesAnalyzed} analyzed games</Badge><Badge>{data.confidence} confidence</Badge><Badge>Real engine evidence</Badge></div>
    </header>
    {data.gamesAnalyzed === 0 ? <EmptyState title="Player DNA needs analyzed games" message="Import and analyze games first. DNA deliberately avoids inventing a playing style from raw profile data." /> : <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.dimensions.map((d) => <div key={d.label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">{d.label}</h2><span className="text-2xl font-bold text-cyan-300">{d.score}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${d.score}%` }} /></div>
        <p className="mt-4 text-sm leading-6 text-slate-400">{d.evidence}</p>
      </div>)}</section>
      <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="font-semibold">How to read this fingerprint</h2><p className="mt-2 text-sm leading-6 text-slate-400">These scores are transparent heuristics derived from your own analyzed moves and classifications. They are descriptive signals, not an official rating or psychological assessment. More analyzed games increase reliability.</p></section>
    </>}
  </main></AppShell>;
}
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300">{children}</span>; }
