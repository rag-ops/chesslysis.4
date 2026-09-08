"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

const nav = [
  { label: "Analyze Game", icon: "▦", key: "analyze", group: "ANALYSIS", badge: "NEW", href: "/analyze" },
  { label: "My Analysis", icon: "▰", key: "dashboard", group: "" },
  { label: "Insights", icon: "⌁", key: "insights", group: "" },
  { label: "Training", icon: "♞", key: "training", group: "IMPROVE" },
  { label: "Openings", icon: "▤", key: "openings", group: "" },
  { label: "Tactics", icon: "◎", key: "mistakes", group: "" },
  { label: "Game Library", icon: "▱", key: "games", group: "STUDY" },
  { label: "Player DNA", icon: "✦", key: "dna", group: "" },
  { label: "Performance", icon: "↗", key: "performance", group: "" },
  { label: "Time Controls", icon: "◷", key: "time", group: "" },
  { label: "Data Health", icon: "◌", key: "data-health", group: "" },
];

export default function AppShell({ username, children, playerNav = username }: { username: string; children: ReactNode; playerNav?: string | null }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("chesslysis-theme"); const enabled = saved !== "light"; setDark(enabled); document.documentElement.classList.toggle("dark", enabled); }, []);
  const toggle = () => { const next = !dark; setDark(next); localStorage.setItem("chesslysis-theme", next ? "dark" : "light"); document.documentElement.classList.toggle("dark", next); };
  const links: Record<string,string> = useMemo(() => { const target = playerNav ? encodeURIComponent(playerNav) : null; return { dashboard: target ? `/dashboard/${target}` : "/", insights: target ? `/insights/${target}` : "/", training: target ? `/training/${target}` : "/", openings: target ? `/openings/${target}` : "/", mistakes: target ? `/mistakes/${target}` : "/", games: target ? `/inspector/${target}` : "/", dna: target ? `/dna/${target}` : "/", performance: target ? `/performance/${target}` : "/", time: target ? `/time/${target}` : "/", "data-health": target ? `/data-health/${target}` : "/" }; },[playerNav]);
  const active = (key:string) => key==="analyze" ? pathname.startsWith("/analyze") : key==="dashboard" ? pathname.startsWith("/dashboard") : pathname.includes(`/${key}/`);
  return <div className="ch-shell min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[var(--sidebar)] text-[#c9c8c2] lg:flex">
      <Link href="/" className="flex h-[106px] flex-col justify-center border-b border-[var(--sidebar-line)] px-6"><span className="mb-2 text-xl leading-none text-[var(--accent)]">♞</span><span className="text-[13px] font-black tracking-[.15em] text-[#ece9e1]">CHESSLYSIS</span></Link>
      <nav className="flex-1 overflow-y-auto py-5">{nav.map((item,i)=><div key={item.key}>{item.group&&<div className={`mb-2 px-6 text-[9px] font-bold uppercase tracking-[.2em] text-[#646660] ${i?"mt-6":""}`}>{item.group}</div>}<Link href={item.href??links[item.key]} className={`relative flex h-11 items-center gap-3 px-6 text-[13px] transition ${active(item.key)?"bg-[#183127] text-[#f4f1ea]":"text-[#a6a49d] hover:bg-white/[.035] hover:text-white"}`}>{active(item.key)&&<span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]"/>}<span className={`w-4 text-center ${active(item.key)?"text-[var(--accent)]":"text-[#777873]"}`}>{item.icon}</span><span>{item.label}</span>{item.badge&&<span className="ml-auto bg-[var(--accent)] px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-white">{item.badge}</span>}</Link></div>)}</nav>
      <div className="border-t border-[var(--sidebar-line)] p-5"><Link href={"/"} className="mb-3 block text-[11px] text-[#8c8b85]">⌕ Search player</Link><button type="button" onClick={toggle} className="flex w-full items-center justify-between border border-[var(--sidebar-line)] px-3 py-2 text-[10px] tracking-wide text-[#aaa9a4]"><span>{dark?"☾  Dark Mode":"☀  Light Mode"}</span><span className="text-[var(--accent)]">■</span></button></div>
    </aside>
    <div className="lg:pl-[220px]">
      <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-4 backdrop-blur sm:px-6 lg:px-10"><div className="ch-eyebrow flex-1 text-[9px]">CHESSLYSIS <span className="mx-2 text-[var(--muted)]">›</span> {pathname.startsWith("/dashboard")?"PLAYER":pathname.startsWith("/analyze")?"ANALYSIS":"INTELLIGENCE"}</div><div className="hidden items-center gap-3 sm:flex"><Link href="/analyze" className="ch-btn-secondary px-3 py-1.5 text-[11px]">↥ Import PGN</Link><Link href="/" className="ch-btn-secondary px-3 py-1.5 text-[11px]">⌕ Search Player</Link><div className="grid h-7 w-7 place-items-center bg-[var(--accent)] text-[9px] font-bold text-white">{username.slice(0,2).toUpperCase()}</div></div></header>
      {children}
    </div>
  </div>;
}
