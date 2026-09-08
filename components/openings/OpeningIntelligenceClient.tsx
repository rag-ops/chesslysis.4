"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api/fetch-json";
import AppShell from "@/components/layout/AppShell";

type Opening = { key:string; opening:string; eco:string|null; side:"White"|"Black"; games:number; wins:number; draws:number; losses:number; winRate:number; averageAccuracy:number|null; averageACPL:number|null; blundersPerGame:number|null; confidence:"low"|"medium"|"high" };
type Recommendation = { type:"strength"|"risk"|"coverage"; title:string; detail:string };
type Data = { username:string; gamesImported:number; gamesAnalyzed:number; openings:Opening[]; strongest:Opening|null; weakest:Opening|null; recommendations:Recommendation[]; note:string };

export default function OpeningIntelligenceClient({ username }: { username: string }) {
  const [data,setData] = useState<Data|null>(null); const [error,setError] = useState<string|null>(null);
  useEffect(() => { const c=new AbortController(); fetchJson<Data>(`/api/players/${encodeURIComponent(username)}/openings`, { signal: c.signal })
      .then((payload) => setData(payload))
      .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); }); return()=>c.abort(); },[username]);
  return <AppShell username={username}><main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Phase 2.8 · Repertoire intelligence</p>
    <h1 className="mt-2 text-3xl font-bold">Opening Intelligence</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-400">Compare your real repertoire by color, sample size, results and engine-backed decision quality—without pretending a tiny sample proves an opening is objectively bad.</p>
    {error && <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200">{error}</div>}
    {!data&&!error&&<div className="mt-6 animate-pulse rounded-2xl border border-white/10 bg-white/[.03] p-8 text-slate-400">Loading repertoire intelligence…</div>}
    {data&&<>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><Card label="Games imported" value={String(data.gamesImported)} sub={`${data.gamesAnalyzed} engine-analyzed`} /><Card label="Strongest signal" value={data.strongest?.opening??"Pending"} sub={data.strongest?`${data.strongest.averageAccuracy}% accuracy · ${data.strongest.games} games`:"Analyze recurring openings"}/><Card label="Openings observed" value={String(data.openings.length)} sub="Separated by playing color"/></div>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">{data.recommendations.map((r,i)=><article key={`${r.title}-${i}`} className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><p className="text-xs uppercase tracking-wide text-cyan-300">{r.type}</p><h2 className="mt-2 font-semibold">{r.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{r.detail}</p></article>)}</section>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1320]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Repertoire table</h2><p className="mt-1 text-xs text-slate-500">{data.note}</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wide text-slate-500"><tr>{["Opening","Side","Games","W-D-L","Win rate","Accuracy","ACPL","Blunders/game","Confidence"].map(h=><th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.openings.map(o=><tr key={o.key} className="border-t border-white/5"><td className="px-5 py-4"><div className="font-semibold text-cyan-100">{o.opening}</div>{o.eco&&<div className="mt-1 text-xs text-slate-500">{o.eco}</div>}</td><td className="px-5 py-4">{o.side}</td><td className="px-5 py-4">{o.games}</td><td className="px-5 py-4 text-slate-400">{o.wins}-{o.draws}-{o.losses}</td><td className="px-5 py-4">{o.winRate}%</td><td className="px-5 py-4">{o.averageAccuracy==null?"Pending":`${o.averageAccuracy}%`}</td><td className="px-5 py-4">{o.averageACPL??"Pending"}</td><td className="px-5 py-4">{o.blundersPerGame??"Pending"}</td><td className="px-5 py-4"><span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">{o.confidence}</span></td></tr>)}{!data.openings.length&&<tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">No imported games yet. Sync a public Chess.com username from the dashboard.</td></tr>}</tbody></table></div></section>
    </>}
  </main></AppShell>;
}
function Card({label,value,sub}:{label:string;value:string;sub:string}){return <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 truncate text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-500">{sub}</p></div>}
