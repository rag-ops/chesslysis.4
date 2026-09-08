"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import AppShell from "@/components/layout/AppShell";
import { fetchJson } from "@/lib/api/fetch-json";

const example = `[Event "Rated Blitz Game"]\n[Site "Chess.com"]\n[Date "2024.01.15"]\n[Round "-"]\n[White "Magnus_Fan"]\n[Black "Tactic_Wolf"]\n[Result "1-0"]\n[WhiteElo "2104"]\n[BlackElo "2087"]\n[TimeControl "600+0"]\n[ECO "B90"]\n[Opening "Sicilian Defense, Najdorf"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 1-0`;

function headers(pgn: string) {
  const o: Record<string, string> = {};
  [...pgn.matchAll(/^\[([^\s]+)\s+"([^"]*)"\]$/gm)].forEach((m) => { o[m[1]] = m[2]; });
  return o;
}

function MiniBoard({ fen }: { fen: string }) {
  const c = useMemo(() => { const x = new Chess(); try { x.load(fen); } catch {} return x; }, [fen]);
  const b = c.board();
  const glyph: Record<string, string> = { wp:"♙",wr:"♖",wn:"♘",wb:"♗",wq:"♕",wk:"♔",bp:"♟",br:"♜",bn:"♞",bb:"♝",bq:"♛",bk:"♚" };
  return <div className="grid w-[142px] grid-cols-8 border border-[var(--line)]">{b.flatMap((r,ri)=>r.map((p,ci)=><div key={`${ri}-${ci}`} className={`grid aspect-square place-items-center text-[14px] ${(ri+ci)%2?"bg-[var(--board-dark)]":"bg-[var(--board-light)]"}`}>{p?glyph[p.color+p.type]:""}</div>))}</div>;
}

export default function AnalyzeGameClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"paste"|"upload"|"example">("paste");
  const [pgn, setPgn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const parsed = useMemo(() => {
    if (!pgn.trim()) return null;
    try { const c = new Chess(); c.loadPgn(pgn); const moves = c.history(); if (!moves.length) return null; return { c, moves, h: headers(pgn) }; }
    catch { return null; }
  }, [pgn]);
  const h = parsed?.h || {};
  const moveCount = parsed?.moves.length || 0;
  const valid = !!parsed;

  const loadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 250_000) { setError("PGN file is too large. Keep it under 250 KB."); return; }
    f.text().then((t) => { setPgn(t); setTab("paste"); setError(null); });
  };

  const analyzeGame = async () => {
    if (!valid || busy) return;
    setBusy(true); setError(null); setStage("Saving the game…");
    try {
      const created = await fetchJson<{ gameId: string }>("/api/games/from-pgn", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pgn }),
      });
      setStage("Stockfish is analyzing the game…");
      await fetchJson(`/api/games/${encodeURIComponent(created.gameId)}/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ depth: 12 }),
      });
      router.push(`/games/${encodeURIComponent(created.gameId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to analyze this game.");
      setStage(""); setBusy(false);
    }
  };

  return <AppShell username="PGN"><main className="ch-canvas min-h-[calc(100vh-51px)] px-5 py-10 lg:px-[68px]"><div className="mx-auto max-w-[1200px]">
    <div className="mb-7"><div className="mb-4 flex items-center gap-3"><span className="h-px w-4 bg-[var(--accent)]"/><span className="ch-eyebrow">ANALYZE GAME</span></div><h1 className="ch-title text-4xl font-black md:text-[42px]">Import Your Game</h1><p className="ch-muted mt-3 max-w-[600px] text-[15px] leading-6">Paste a PGN or upload a file. Chesslysis will save the game, run Stockfish, and open the complete move-by-move review.</p></div>
    {error&&<div className="mb-5 border border-[var(--danger)]/40 bg-[var(--surface)] p-4 text-sm text-[var(--danger)]">{error}</div>}
    {stage&&<div className="mb-5 border border-[var(--accent)]/40 bg-[var(--surface)] p-4 text-sm text-[var(--accent)]">{stage}</div>}
    <div className="grid gap-7 lg:grid-cols-[1.45fr_.92fr]">
      <section className="ch-panel"><div className="flex flex-col border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center"><span className="ch-eyebrow flex-1 text-[8px] text-[var(--muted)]">PGN INPUT</span><div className="mt-3 flex gap-5 text-[11px] sm:mt-0"><button type="button" onClick={()=>setTab("paste")} className={tab==="paste"?"border-b-2 border-[var(--accent)] pb-2 text-[var(--accent)]":"pb-2 text-[var(--muted)]"}>Paste Text</button><button type="button" onClick={()=>setTab("upload")} className={tab==="upload"?"border-b-2 border-[var(--accent)] pb-2 text-[var(--accent)]":"pb-2 text-[var(--muted)]"}>Upload File</button><button type="button" onClick={()=>{setPgn(example);setTab("example");setError(null)}} className={tab==="example"?"border-b-2 border-[var(--accent)] pb-2 text-[var(--accent)]":"pb-2 text-[var(--muted)]"}>Example Game</button></div></div>
        <div className="p-5">{tab==="upload"?<label className="flex h-[265px] cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--line)] bg-[var(--bg)]"><span className="text-2xl">↥</span><span className="mt-3 text-sm font-semibold">Choose a .pgn file</span><span className="mt-1 text-xs text-[var(--muted)]">Maximum 250 KB</span><input type="file" accept=".pgn,.txt" onChange={loadFile} className="hidden"/></label>:<textarea value={pgn} onChange={e=>{setPgn(e.target.value);setError(null)}} disabled={busy} placeholder={'[Event "Rated Game"]\n[White "Player"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 ...'} className="ch-mono h-[265px] w-full resize-none border border-[var(--line)] bg-transparent p-4 text-[12px] leading-6 outline-none focus:border-[var(--accent)]"/>}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 text-[11px]">{pgn.trim()?valid?<span className="font-semibold text-[var(--accent)]">● &nbsp; Valid PGN detected — {Math.ceil(moveCount/2)} moves</span>:<span className="font-semibold text-[var(--warning)]">● &nbsp; PGN could not be parsed yet</span>:<span className="text-[var(--muted)]">○ &nbsp; Awaiting input…</span>}<span className="ch-mono text-[10px] text-[var(--muted)]">{valid?`${h.ECO||"—"} · ${h.Opening||"Opening unknown"} · 2 players`:""}</span></div>
        <div className="flex gap-3 border-t border-[var(--line)] p-5"><button type="button" disabled={!valid||busy} onClick={analyzeGame} className="ch-btn-primary flex-1 px-5 py-3 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-35">{busy?"Analyzing…":"Analyze Game →"}</button><button type="button" disabled={busy} onClick={()=>setPgn("")} className="ch-btn-secondary px-5 py-3 text-[12px]">Clear</button></div>
      </section>
      <aside className="ch-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><span className="ch-eyebrow text-[8px] text-[var(--muted)]">GAME PREVIEW</span><span className="ch-mono text-[9px] text-[var(--muted)]">{h.ECO||"—"}</span></div>{valid?<><div className="px-5 py-5"><div className="flex items-start justify-between"><div><div className="ch-eyebrow text-[8px] text-[var(--muted)]">WHITE</div><div className="mt-1 text-xl font-bold">{h.White||"White"}</div><div className="my-3 h-px w-full bg-[var(--line)]"/><div className="ch-eyebrow text-[8px] text-[var(--muted)]">BLACK</div><div className="mt-1 text-xl font-bold">{h.Black||"Black"}</div></div><span className="border border-[var(--ink)] px-2 py-1 text-sm font-bold">{h.Result||"*"}</span></div></div><div className="grid grid-cols-2 border-y border-[var(--line)] text-[11px]">{[["DATE",h.Date||"—"],["MOVES",String(Math.ceil(moveCount/2))],["OPENING",h.Opening||"Unknown"],["TIME CONTROL",h.TimeControl||"—"],["PLATFORM",h.Site?.includes("Chess.com")?"Chess.com":h.Site||"—"],["RATINGS",`${h.WhiteElo||"—"} / ${h.BlackElo||"—"}`]].map(([a,b])=><div key={a} className="min-h-[55px] border-b border-r border-[var(--line)] p-3"><div className="ch-eyebrow text-[7px] text-[var(--muted)]">{a}</div><div className="mt-1 font-semibold">{b}</div></div>)}</div><div className="p-5"><div className="ch-eyebrow mb-3 text-[8px] text-[var(--muted)]">FINAL POSITION</div><MiniBoard fen={parsed.c.fen()}/></div><button type="button" disabled={busy} onClick={analyzeGame} className="mx-5 mb-5 w-[calc(100%-40px)] bg-[var(--accent)] px-4 py-3 text-[12px] font-bold text-white disabled:opacity-50">{busy?"Analyzing…":"Analyze This Game →"}</button></>:<div className="flex min-h-[440px] items-center justify-center p-8 text-center text-sm text-[var(--muted)]">Paste a complete PGN to preview players, opening, metadata, and the final position.</div>}</aside>
    </div>
    <div className="mt-12 flex items-center gap-3"><span className="h-px w-5 bg-[var(--line)]"/><span className="ch-eyebrow text-[8px]">RECENTLY ANALYZED</span><a href="/analyze" className="ml-auto text-[11px] text-[var(--accent)]">Start another analysis →</a></div>
  </div></main></AppShell>;
}
