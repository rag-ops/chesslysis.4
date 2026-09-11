"use client";

export function LoadingState({ title = "Loading..." }: { title?: string }) {
  return <main className="mx-auto max-w-7xl px-4 py-12"><div className="rounded-2xl border border-white/10 bg-[#0d1320] p-8 shadow-2xl shadow-black/20"><div className="h-5 w-44 animate-pulse rounded bg-white/10"/><div className="mt-4 h-10 max-w-md animate-pulse rounded bg-white/[.06]"/><p className="mt-5 text-sm text-slate-400">{title}</p></div></main>;
}
export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void; }) {
  return <main className="mx-auto max-w-3xl px-4 py-16"><div className="rounded-2xl border border-rose-400/20 bg-[#120f16] p-8 shadow-2xl shadow-black/20"><p className="text-sm font-semibold uppercase tracking-wider text-rose-300">Data unavailable</p><h1 className="mt-2 text-2xl font-bold text-white">{title}</h1><p className="mt-3 text-slate-400">{message}</p>{onRetry&&<button onClick={onRetry} className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Try again</button>}</div></main>;
}
export function EmptyState({ title, message }: { title: string; message: string; }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-10 text-center"><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{message}</p></div>;
}
