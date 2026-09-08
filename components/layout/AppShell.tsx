"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const nav = [
  { label: "Analyze Game", icon: "▦", key: "analyze", href: "/analyze", group: "ANALYSIS", badge: "NEW" },
  { label: "My Analysis", icon: "▰", key: "dashboard", group: "" },
  { label: "Insights", icon: "⌁", key: "insights", group: "" },
  { label: "Training", icon: "♞", key: "training", group: "IMPROVE" },
  { label: "Openings", icon: "▤", key: "openings", group: "" },
  { label: "Tactics", icon: "◎", key: "mistakes", group: "" },
  { label: "Game Library", icon: "▱", key: "games", group: "STUDY" },
  { label: "Masters DB", icon: "✦", key: "dna", group: "" },
  { label: "Performance", icon: "↗", key: "performance", group: "" },
  { label: "Time", icon: "◷", key: "time", group: "" },
  { label: "Data Health", icon: "◌", key: "data-health", group: "" },
];

export default function AppShell({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("chesslysis-theme"); const enabled = saved !== "light"; setDark(enabled); document.documentElement.classList.toggle("dark", enabled); }, []);
  const toggle = () => { const next = !dark; setDark(next); localStorage.setItem("chesslysis-theme", next ? "dark" : "light"); document.documentElement.classList.toggle("dark", next); };
  const links: Record<string, string> = {
    dashboard: `/dashboard/${encodeURIComponent(username)}`, insights: `/insights/${encodeURIComponent(username)}`,
    openings: `/openings/${encodeURIComponent(username)}`, mistakes: `/mistakes/${encodeURIComponent(username)}`,
    training: `/training/${encodeURIComponent(username)}`, games: `/inspector/${encodeURIComponent(username)}`,
    dna: `/dna/${encodeURIComponent(username)}`, time: `/time/${encodeURIComponent(username)}`,
    performance: `/performance/${encodeURIComponent(username)}`, "data-health": `/data-health/${encodeURIComponent(username)}`,
  };
  const isActive = (key: string) => key === "analyze" ? pathname.startsWith("/analyze") : pathname.includes(`/${key}/`) || (key === "dashboard" && pathname.startsWith("/dashboard"));
  return <div className="ch-shell min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[196px] flex-col bg-[var(--sidebar)] text-[#c9c8c2] lg:flex">
      <Link href="/" className="flex h-[106px] items-center gap-3 border-b border-[var(--sidebar-line)] px-5"><span className="text-lg text-[var(--accent)]">♞</span><span className="text-[11px] font-black tracking-[.22em] text-[#e4e2dc]">CHESSLYSIS</span></Link>
      <nav className="flex-1 py-7">
        {nav.map((item, i) => <div key={item.key}>{item.group && <div className={`px-5 ${i ? "mt-7" : ""} mb-3 text-[8px] font-bold tracking-[.22em] text-[#666762]`}>{item.group}</div>}
          <Link href={item.href ?? links[item.key]} className={`relative flex items-center gap-3 px-5 py-3 text-[13px] transition ${isActive(item.key) ? "bg-[#183127] text-[#f1efe9]" : "text-[#aaa9a4] hover:bg-white/[.035] hover:text-white"}`}>
            {isActive(item.key) && <span className="absolute left-0 top-0 h-full w-[3px] bg-[var(--accent)]" />}<span className={`w-3 ${isActive(item.key) ? "text-[var(--accent)]" : "text-[#777873]"}`}>{item.icon}</span><span>{item.label}</span>{item.badge && <span className="ml-auto bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">{item.badge}</span>}
          </Link></div>)}
      </nav>
      <div className="border-t border-[var(--sidebar-line)] p-4 text-[12px] text-[#8d8d88]">
        <div className="mb-3 flex items-center gap-3 px-1"><span>⚙</span><span>Settings</span></div><div className="mb-4 flex items-center gap-3 px-1"><span>?</span><span>Help</span></div>
        <button onClick={toggle} className="flex w-full items-center justify-between border border-[var(--sidebar-line)] px-3 py-2 text-[10px] tracking-wide"><span>{dark ? "☾  Dark Mode" : "☀  Light Mode"}</span><span className="text-[var(--accent)]">■</span></button>
      </div>
    </aside>
    <div className="lg:pl-[196px]">
      <header className="sticky top-0 z-20 flex h-[51px] items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-5 backdrop-blur lg:px-8">
        <div className="ch-eyebrow flex-1 text-[9px] text-[var(--muted)]">CHESSLYSIS <span className="mx-2">›</span> ANALYSIS</div>
        <div className="flex items-center gap-3"><Link href="/analyze" className="ch-btn-secondary hidden px-3 py-1.5 text-[11px] font-semibold sm:block">↥ Import PGN</Link><Link href="/" className="ch-btn-secondary hidden px-3 py-1.5 text-[11px] font-semibold md:block">⌕ Search Player</Link><div className="grid h-6 w-6 place-items-center bg-[var(--accent)] text-[9px] font-bold text-white">{username.slice(0,2).toUpperCase()}</div></div>
      </header>
      {children}
    </div>
  </div>;
}
