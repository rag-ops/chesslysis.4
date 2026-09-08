"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import AppShell from "@/components/layout/AppShell";

type Control = { bucket:string; label:string; games:number; wins:number; draws:number; losses:number; winRate:number; averageAccuracy:number|null; averageACPL:number|null; blundersPerGame:number|null };
type Data = { username:string; gamesImported:number; gamesAnalyzed:number; confidence:string; note:string; summary:string; bestControl:Control|null; weakestControl:Control|null; controls:Control[]; controlsByTime:Control[] };

export default function TimeManagementClient({ username }: { username: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchJson<Data>(`/api/players/${encodeURIComponent(username)}/time`, { signal: controller.signal })
      .then((payload) => setData(payload))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [username]);

  return <AppShell username={username}><main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Phase 2.7 · Performance intelligence</p>
    <h1 className="mt-2 text-3xl font-bold">Time Management Intelligence</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-400">Compare decision quality across bullet, blitz, rapid and daily chess without inventing clock data that does not exist.</p>
    {error && <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200">{error}</div>}
    {!data && !error && <div className="mt-6 animate-pulse rounded-2xl border border-white/10 bg-white/[.03] p-8 text-slate-400">Loading real time-control performance…</div>}
    {data && <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card label="Games imported" value={String(data.gamesImported)} sub={`${data.gamesAnalyzed} engine-analyzed`} />
        <Card label="Best analyzed control" value={data.bestControl?.label ?? "Pending"} sub={data.bestControl ? `${data.bestControl.averageAccuracy}% accuracy` : "Analyze games to compare"} />
        <Card label="Confidence" value={data.confidence.toUpperCase()} sub={`${data.controls.length} time-control groups`} />
      </div>
      <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1320] p-5"><h2 className="font-semibold">What the data says</h2><p className="mt-2 text-sm leading-6 text-slate-400">{data.summary}</p><p className="mt-4 text-xs text-slate-600">{data.note}</p></section>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1320]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Performance by category</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wide text-slate-500"><tr>{["Control","Games","W-D-L","Win rate","Accuracy","ACPL","Blunders/game"].map(h=><th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.controls.map(c=><tr key={c.bucket} className="border-t border-white/5"><td className="px-5 py-4 font-semibold text-cyan-200">{c.label}</td><td className="px-5 py-4">{c.games}</td><td className="px-5 py-4 text-slate-400">{c.wins}-{c.draws}-{c.losses}</td><td className="px-5 py-4">{c.winRate}%</td><td className="px-5 py-4">{c.averageAccuracy == null ? "Pending" : `${c.averageAccuracy}%`}</td><td className="px-5 py-4">{c.averageACPL == null ? "Pending" : c.averageACPL}</td><td className="px-5 py-4">{c.blundersPerGame == null ? "Pending" : c.blundersPerGame}</td></tr>)}{!data.controls.length && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No imported games yet. Sync a Chess.com username from the dashboard.</td></tr>}</tbody></table></div></section>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1320]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Exact time controls</h2><p className="mt-1 text-xs text-slate-500">Rapid, blitz and bullet are split into the actual controls you play: 10 min, 15 min, 3+2, 2+1, and more.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wide text-slate-500"><tr>{["Category","Control","Games","W-D-L","Win rate","Accuracy"].map(h=><th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.controlsByTime.map(c=><tr key={`${c.bucket}-${c.label}`} className="border-t border-white/5"><td className="px-5 py-4 capitalize text-slate-400">{c.bucket}</td><td className="px-5 py-4 font-semibold text-cyan-200">{c.label}</td><td className="px-5 py-4">{c.games}</td><td className="px-5 py-4 text-slate-400">{c.wins}-{c.draws}-{c.losses}</td><td className="px-5 py-4">{c.winRate}%</td><td className="px-5 py-4">{c.averageAccuracy==null?"Pending":`${c.averageAccuracy}%`}</td></tr>)}</tbody></table></div></section>
    </>}
  </main></AppShell>;
}
function Card({label,value,sub}:{label:string;value:string;sub:string}){return <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-500">{sub}</p></div>}
