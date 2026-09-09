"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import ChessPiece from "@/components/chessboard/ChessPiece";

type Move = { ply:number; moveNumber:number; color:"w"|"b"; san:string; uci:string; fenAfter:string };
type Analysis = { evaluationAfter:number|null; bestMove:string|null; principalVariation:string[]; evaluationLoss:number; classification:string };

function tone(c?: string) {
  if (!c) return "border-[var(--line)] text-[var(--muted)]";
  if (c.includes("BLUNDER")) return "border-[var(--danger)] bg-[var(--danger)] text-white";
  if (c.includes("MISTAKE")) return "border-[var(--warning)]/60 text-[var(--warning)]";
  if (c.includes("INACCURACY")) return "border-[#b89358] text-[#9b773f]";
  return "border-[var(--accent)] text-[var(--accent)]";
}
function formatEval(v:number){ return `${v>=0?"+":""}${v.toFixed(1)}`; }

export default function GameReviewBoard({moves,analyses={}}:{moves:Move[];analyses?:Record<number,Analysis>}) {
  const [index,setIndex]=useState(-1);
  const current=index>=0?moves[index]:undefined;
  const fen=index<0?new Chess().fen():(current?.fenAfter??new Chess().fen());
  const chess=useMemo(()=>{const c=new Chess(); try{c.load(fen);}catch{} return c;},[fen]);
  const board=chess.board();
  const a=current?analyses[current.ply]:undefined;
  const evals=moves.map(m=>analyses[m.ply]?.evaluationAfter??0);
  const max=Math.max(2,...evals.map(v=>Math.abs(v)));
  const before=index>0?(analyses[moves[index-1].ply]?.evaluationAfter??0):0;
  const after=a?.evaluationAfter??0;
  const lastFrom=current?.uci?.slice(0,2), lastTo=current?.uci?.slice(2,4);

  return <div className="grid min-h-[760px] border-y border-[var(--line)] bg-[var(--surface)] lg:grid-cols-[280px_minmax(440px,1fr)_330px]">
    <aside className="order-2 flex min-h-0 flex-col border-r border-[var(--line)] lg:order-1">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4"><span className="ch-eyebrow">Moves</span><span className="ch-mono text-[9px] text-[var(--muted)]">{moves.length} total</span></div>
      <div className="flex-1 overflow-y-auto">
        {moves.map((m,i)=>{const c=analyses[m.ply]?.classification;return <button key={m.ply} onClick={()=>setIndex(i)} className={`flex w-full items-center gap-3 border-b border-[var(--line)] px-4 py-2.5 text-left text-[12px] transition ${i===index?"border-l-2 border-l-[var(--accent)] bg-[var(--surface-strong)]":"hover:bg-[var(--surface-strong)]"}`}><span className="ch-mono w-8 text-[10px] opacity-50">{m.color==="w"?`${m.moveNumber}.`:""}</span><span className="ch-mono flex-1">{m.san}</span><span className={`border px-1 py-0.5 text-[8px] font-bold ${tone(c)}`}>{(c||"UNANALYZED").replace("INACCURACY","INAC").replace("BLUNDER","BLNDR")}</span></button>})}
      </div>
      <div className="flex gap-1 border-t border-[var(--line)] p-3"><button onClick={()=>setIndex(-1)} className="ch-btn-secondary px-3 py-2 text-xs">|◀</button><button onClick={()=>setIndex(Math.max(-1,index-1))} className="ch-btn-secondary px-3 py-2 text-xs">◀</button><button onClick={()=>setIndex(Math.min(moves.length-1,index+1))} className="ch-btn-secondary px-3 py-2 text-xs">▶</button><button onClick={()=>setIndex(moves.length-1)} className="ch-btn-secondary px-3 py-2 text-xs">▶|</button></div>
    </aside>

    <section className="order-1 flex min-w-0 flex-col lg:order-2">
      <div className="flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-10">
        <div className="flex w-full max-w-[620px] items-stretch justify-center">
          <div className="mr-3 hidden w-4 flex-none overflow-hidden border border-[var(--line)] bg-[var(--board-light)] sm:block"><div className="w-full bg-[var(--board-dark)]" style={{height:`${Math.max(6,Math.min(94,50+(after/max)*45))}%`}}/></div>
          <div className="w-full max-w-[560px] aspect-square border border-[var(--line)] shadow-[0_18px_40px_rgba(31,29,24,.18)]">
            <div className="grid h-full w-full grid-cols-8">
              {board.flatMap((row,r)=>row.map((piece,c)=>{const sq=`abcdefgh`[c]+(8-r);const active=sq===lastFrom||sq===lastTo;return <div key={sq} className={`relative flex aspect-square items-center justify-center ${((r+c)%2===0)?"bg-[var(--board-light)]":"bg-[var(--board-dark)]"} ${active?"after:absolute after:inset-0 after:bg-[color-mix(in_srgb,var(--accent)_28%,transparent)]":""}`}><div className="relative z-10 grid h-full w-full place-items-center p-1 sm:p-1.5">{piece&&<ChessPiece color={piece.color as "w"|"b"} type={piece.type as any}/>}</div>{c===0&&<span className="absolute left-1 top-1 z-20 text-[8px] font-semibold opacity-50">{8-r}</span>}{r===7&&<span className="absolute bottom-1 right-1 z-20 text-[8px] font-semibold opacity-50">{`abcdefgh`[c]}</span>}</div>}))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] bg-[var(--surface-strong)] p-4"><div className="relative h-[78px]"><svg viewBox="0 0 900 100" preserveAspectRatio="none" className="h-full w-full"><path d={`M0,50 ${evals.map((v,i)=>{const x=evals.length<2?0:i/(evals.length-1)*900;const y=50-Math.max(-max,Math.min(max,v))/max*38;return `L${x.toFixed(1)},${y.toFixed(1)}`}).join(" ")} L900,100 L0,100 Z`} fill="var(--ink)" opacity=".08"/><line x1="0" x2="900" y1="50" y2="50" stroke="var(--line)"/>{index>=0&&<line x1={`${index/Math.max(1,moves.length-1)*900}`} x2={`${index/Math.max(1,moves.length-1)*900}`} y1="0" y2="100" stroke="var(--accent)" strokeWidth="4"/>}</svg></div></div>
    </section>

    <aside className="order-3 border-l border-[var(--line)] bg-[var(--surface-strong)]"><div className="flex justify-between border-b border-[var(--line)] px-5 py-4"><span className="ch-eyebrow">Analysis</span><span className="ch-mono text-[9px] text-[var(--muted)]">Move {current?.moveNumber??"—"}</span></div><div className="divide-y divide-[var(--line)]">
      <div className="p-5"><div className="flex justify-between"><span className="ch-eyebrow">Engine</span><span className="ch-mono text-[9px] text-[var(--accent)]">STOCKFISH</span></div><div className="ch-mono mt-4 text-[11px] leading-6 text-[var(--muted)]">{a?.principalVariation?.slice(0,7).join(" ")||"Select a move to inspect the engine line."}</div><div className="mt-4 text-3xl font-black text-[var(--accent)]">{a?.evaluationAfter==null?"—":formatEval(after)}</div></div>
      <div className="p-5"><div className="ch-eyebrow">Move verdict</div><div className={`mt-2 text-xl font-black ${((a?.classification||"").includes("BLUNDER"))?"text-[var(--danger)]":((a?.classification||"").includes("MISTAKE"))?"text-[var(--warning)]":"text-[var(--accent)]"}`}>{(a?.classification||"UNANALYZED").replaceAll("_"," ")}</div><p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">{a?.evaluationLoss!=null?`Evaluation change: ${a.evaluationLoss.toFixed(2)} pawns from the player's perspective.`:"Engine analysis will describe the consequence of this move once available."}</p><div className="ch-mono mt-4 inline-flex border border-[var(--line)] px-2 py-1 text-[10px]"><span className="text-[var(--accent)]">{formatEval(before)}</span><span className="mx-2">→</span><span>{formatEval(after)}</span></div></div>
      <div className="p-5"><div className="ch-eyebrow">Best alternative</div><div className="ch-mono mt-3 text-sm font-bold text-[var(--accent)]">{a?.bestMove||"—"}</div><p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">The engine's preferred continuation from this position.</p></div>
      <div className="p-5"><div className="border-l-2 border-[var(--warning)] bg-[var(--bg)] p-3"><div className="ch-eyebrow text-[var(--warning)]">Patterns</div><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{a?.classification?"See the move verdict and engine line above for the evidence-backed consequence.":"No move selected."}</p></div></div>
    </div></aside>
  </div>;
}
