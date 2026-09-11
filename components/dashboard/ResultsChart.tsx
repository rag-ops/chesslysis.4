type Game = { result: "win" | "loss" | "draw"; date: string };
export default function ResultsChart({ games }: { games: Game[] }) {
  const counts = { wins: games.filter(g=>g.result==="win").length, draws: games.filter(g=>g.result==="draw").length, losses: games.filter(g=>g.result==="loss").length };
  const max = Math.max(1, counts.wins, counts.draws, counts.losses);
  const rows = [["Wins", counts.wins, "bg-emerald-400"], ["Draws", counts.draws, "bg-amber-300"], ["Losses", counts.losses, "bg-rose-400"]] as const;
  return <div className="rounded-2xl border border-white/10 bg-[#111722] p-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
    <h2 className="font-semibold text-white">Results</h2><div className="mt-5 space-y-4">
    {rows.map(([label,value,color])=><div key={label}><div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">{label}</span><span className="font-semibold text-slate-200">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full ${color}`} style={{width:`${(value/max)*100}%`}}/></div></div>)}
    </div></div>;
}
