type Point = { date: string; accuracy: number };
export default function AccuracyTrend({ points }: { points: Point[] }) {
  if (!points.length) return <div className="rounded-2xl border border-white/10 bg-[#111722] p-5 text-sm text-slate-400">No analyzed games yet.</div>;
  const width=900,height=240;
  const d=points.map((p,i)=>{const x=points.length===1?width/2:(i/(points.length-1))*width;const y=height-12-(Math.max(0,Math.min(100,p.accuracy))/100)*(height-24);return `${i?"L":"M"} ${x.toFixed(1)} ${y.toFixed(1)}`}).join(" ");
  return <div className="rounded-2xl border border-white/10 bg-[#111722] p-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]"><div className="mb-3 flex justify-between"><h2 className="font-semibold text-white">Accuracy trend</h2><span className="text-xs text-slate-500">Most recent analyzed games</span></div><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full text-cyan-300" role="img" aria-label="Accuracy trend"><line x1="0" x2={width} y1={height/2} y2={height/2} stroke="currentColor" opacity=".12"/><path d={d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></div>;
}
