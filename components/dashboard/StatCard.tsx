type Props = { label: string; value: string; detail?: string };
export default function StatCard({ label, value, detail }: Props) {
  return <div className="rounded-2xl border border-white/10 bg-[#111722] p-5 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</div>
    {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
  </div>;
}
