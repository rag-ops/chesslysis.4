type Row = { name: string; games: number; winRate: number; accuracy: number };
export default function InsightTable({ title, rows }: { title: string; rows: Row[] }) {
  return <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1320] shadow-2xl shadow-black/20">
    <div className="border-b border-white/10 p-4"><h2 className="font-semibold text-white">{title}</h2></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-white/[.04] text-left text-slate-400"><tr><th className="p-3">Category</th><th>Games</th><th>Win rate</th><th>Accuracy</th></tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={row.name} className="border-t border-white/10 text-slate-200"><td className="p-3">{row.name}</td><td>{row.games}</td><td>{row.winRate.toFixed(1)}%</td><td>{row.accuracy.toFixed(1)}%</td></tr>) : <tr><td className="p-4 text-slate-400" colSpan={4}>No analyzed games yet.</td></tr>}</tbody></table></div>
  </section>;
}
