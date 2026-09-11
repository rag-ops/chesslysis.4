'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api/fetch-json';
import AppShell from '@/components/layout/AppShell';

type Opening = { key:string; opening:string; eco:string|null; side:'White'|'Black'; games:number; wins:number; draws:number; losses:number; winRate:number; averageAccuracy:number|null; averageACPL:number|null; blundersPerGame:number|null; confidence:'low'|'medium'|'high' };
type Recommendation = { type:'strength'|'risk'|'coverage'; title:string; detail:string };
type Data = { username:string; gamesImported:number; gamesAnalyzed:number; openings:Opening[]; strongest:Opening|null; weakest:Opening|null; recommendations:Recommendation[]; note:string };

export default function OpeningIntelligenceClient({ username }: { username:string }) {
  const [data,setData] = useState<Data|null>(null); const [error,setError] = useState<string|null>(null);
  useEffect(() => { const c=new AbortController(); fetchJson<Data>(`/api/players/${encodeURIComponent(username)}/openings`, { signal:c.signal }).then(setData).catch((e:unknown)=>{ if(e instanceof Error&&e.name!=='AbortError') setError(e.message); }); return()=>c.abort(); },[username]);
  return <AppShell username={username}><main className="ch-page">
    <header className="ch-page-header"><div><p className="ch-eyebrow">Repertoire intelligence</p><h1 className="mt-2 text-3xl font-bold">Opening performance</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Compare recurring openings by color, sample size, results and engine-backed decision quality. Low-sample signals stay explicitly qualified.</p></div><div className="ch-card px-4 py-3 text-right"><div className="ch-eyebrow">Player</div><div className="mt-1 ch-mono text-sm">{username}</div></div></header>
    {error&&<div className="mt-6 border border-[var(--danger)]/30 bg-[var(--surface-strong)] p-5 text-sm text-[var(--danger)]">{error}</div>}
    {!data&&!error&&<div className="ch-card mt-6 animate-pulse p-8 text-sm text-[var(--muted)]">Loading opening performance…</div>}
    {data&&<>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><Card label="Games imported" value={String(data.gamesImported)} sub={`${data.gamesAnalyzed} engine-analyzed`} /><Card label="Strongest signal" value={data.strongest?.opening??'Pending'} sub={data.strongest?`${data.strongest.averageAccuracy}% accuracy · ${data.strongest.games} games`:'Analyze recurring openings'} /><Card label="Openings observed" value={String(data.openings.length)} sub="Separated by playing color" /></div>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">{data.recommendations.map((r,i)=><article key={`${r.title}-${i}`} className="ch-card p-5"><p className="ch-eyebrow">{r.type}</p><h2 className="mt-2 font-semibold">{r.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{r.detail}</p></article>)}</section>
      <section className="ch-card mt-6 overflow-hidden"><div className="border-b border-[var(--line)] p-5"><h2 className="font-semibold">Repertoire table</h2><p className="mt-1 text-xs text-[var(--muted)]">{data.note}</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[var(--surface)] text-[10px] uppercase tracking-[.14em] text-[var(--muted)]"><tr>{['Opening','Side','Games','W-D-L','Win rate','Accuracy','ACPL','Blunders/game','Confidence'].map(h=><th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.openings.map(o=><tr key={o.key} className="border-t border-[var(--line)]"><td className="px-5 py-4"><div className="font-semibold">{o.opening}</div>{o.eco && !/^https?:\/\//i.test(o.eco) && <div className="mt-1 ch-mono text-[10px] text-[var(--muted)]">{o.eco}</div>}</td><td className="px-5 py-4">{o.side}</td><td className="px-5 py-4">{o.games}</td><td className="px-5 py-4 text-[var(--muted)]">{o.wins}-{o.draws}-{o.losses}</td><td className="px-5 py-4">{o.winRate}%</td><td className="px-5 py-4">{o.averageAccuracy==null?'Pending':`${o.averageAccuracy}%`}</td><td className="px-5 py-4">{o.averageACPL==null?'Pending':o.averageACPL}</td><td className="px-5 py-4">{o.blundersPerGame==null?'Pending':o.blundersPerGame}</td><td className="px-5 py-4"><span className="border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">{o.confidence}</span></td></tr>)}{!data.openings.length&&<tr><td colSpan={9} className="px-5 py-10 text-center text-[var(--muted)]">No imported games yet. Sync a public Chess.com username from the dashboard.</td></tr>}</tbody></table></div></section>
    </>}
  </main></AppShell>;
}
function Card({label,value,sub}:{label:string;value:string;sub:string}){return <div className="ch-card p-5"><p className="ch-eyebrow">{label}</p><p className="mt-3 truncate text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{sub}</p></div>}
