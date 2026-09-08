"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { fetchJson } from "@/lib/api/fetch-json";

type HealthData = {
  username: string; gamesImported: number; gamesAnalyzed: number; pendingAnalysis: number;
  analysisCoverage: number; oldestGameAt: string | null; latestGameAt: string | null;
  playerUpdatedAt: string; latestGameAgeHours: number | null; status: "empty" | "imported" | "partial" | "complete";
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function DataHealthClient({ username }: { username: string }) {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchJson<HealthData>(`/api/players/${encodeURIComponent(username)}/data-health`, { signal: controller.signal })
      .then((payload) => setData(payload))
      .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [username]);

  return <AppShell username={username}><main className="mx-auto max-w-[1500px] px-4 py-7 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Phase 3.3 · Data reliability</p>
    <h1 className="mt-2 text-3xl font-bold">Data Health Center</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-400">See exactly how much real Chess.com data is imported and engine-analyzed. Chesslysis exposes coverage instead of silently filling gaps with estimates.</p>
    {error && <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200">{error}</div>}
    {!data && !error && <div className="mt-6 animate-pulse rounded-2xl border border-white/10 bg-white/[.03] p-8 text-slate-400">Checking data coverage…</div>}
    {data && <>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card label="Imported games" value={String(data.gamesImported)} />
        <Card label="Engine analyzed" value={String(data.gamesAnalyzed)} />
        <Card label="Analysis coverage" value={`${data.analysisCoverage}%`} />
        <Card label="Pending analysis" value={String(data.pendingAnalysis)} />
      </div>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><h2 className="font-semibold">Dataset window</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Oldest imported game" value={formatDate(data.oldestGameAt)} /><Row label="Latest imported game" value={formatDate(data.latestGameAt)} /><Row label="Profile data updated" value={formatDate(data.playerUpdatedAt)} /></dl></article>
        <article className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><h2 className="font-semibold">Reliability status</h2><p className="mt-3 text-2xl font-bold capitalize text-cyan-200">{data.status}</p><p className="mt-3 text-sm leading-6 text-slate-400">{data.status === "complete" ? "Every imported game currently has completed engine analysis." : data.status === "partial" ? "Some games still need analysis, so engine-backed metrics may use a smaller sample." : data.status === "imported" ? "Games are imported, but engine-backed metrics will remain pending until analysis runs." : "No games are stored for this profile yet."}</p></article>
      </section>
    </>}
  </main></AppShell>;
}
function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-5"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="text-right text-slate-200">{value}</dd></div>; }
