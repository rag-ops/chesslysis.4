 "use client";

export default function EvaluationGraph({points}:{points:{ply:number; evaluation:number|null}[]}) {
  const vals = points.map(p => p.evaluation ?? 0);
  const max = Math.max(2, ...vals.map(v => Math.abs(v)));
  const width = 800, height = 220;
  const d = vals.map((v,i) => {
    const x = vals.length < 2 ? 0 : i/(vals.length-1)*width;
    const y = height/2 - Math.max(-max,Math.min(max,v))/max*(height/2-10);
    return `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return <div className="rounded-xl border border-white/10 bg-[#0d1320] p-4 shadow-2xl shadow-black/20">
    <div className="mb-2 flex justify-between text-sm">
      <span className="font-semibold">Evaluation graph</span>
      <span className="text-slate-400">White perspective</span>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label="Evaluation graph">
      <line x1="0" x2={width} y1={height/2} y2={height/2} stroke="currentColor" opacity=".15"/>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </div>;
}
