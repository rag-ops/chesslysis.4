"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

const nav = [
  { label:"Analyze Game", icon:"▦", key:"analyze", group:"ANALYSIS", badge:"NEW", href:"/analyze" },
  { label:"My Analysis", icon:"▰", key:"dashboard", group:"" },
  { label:"Insights", icon:"⌁", key:"insights", group:"" },
  { label:"Training", icon:"♞", key:"training", group:"IMPROVE" },
  { label:"Openings", icon:"▤", key:"openings", group:"" },
  { label:"Tactics", icon:"◎", key:"mistakes", group:"" },
  { label:"Game Library", icon:"▱", key:"games", group:"STUDY" },
  { label:"Player DNA", icon:"✦", key:"dna", group:"" },
  { label:"Performance", icon:"↗", key:"performance", group:"" },
  { label:"Time Controls", icon:"◷", key:"time", group:"" },
  { label:"Data Health", icon:"◌", key:"data-health", group:"" },
];

export default function AppShell({username,children,playerNav=username}:{username:string;children:ReactNode;playerNav?:string|null}) {
  const pathname=usePathname();
  const [dark,setDark]=useState(false);
  useEffect(()=>{const saved=localStorage.getItem("chesslysis-theme");const initial=saved==="dark";setDark(initial);document.documentElement.classList.toggle("dark",initial)},[]);
  const toggleTheme=()=>{const next=!dark;setDark(next);document.documentElement.classList.toggle("dark",next);localStorage.setItem("chesslysis-theme",next?"dark":"light")};
  const links:Record<string,string>=useMemo(()=>{const target=playerNav?encodeURIComponent(playerNav):null;return {dashboard:target?`/dashboard/${target}`:"/",insights:target?`/insights/${target}`:"/",training:target?`/training/${target}`:"/",openings:target?`/openings/${target}`:"/",mistakes:target?`/mistakes/${target}`:"/",games:target?`/inspector/${target}`:"/",dna:target?`/dna/${target}`:"/",performance:target?`/performance/${target}`:"/",time:target?`/time/${target}`:"/","data-health":target?`/data-health/${target}`:"/"}},[playerNav]);
  const active=(key:string)=>key==="analyze"?pathname.startsWith("/analyze"):key==="dashboard"?pathname.startsWith("/dashboard"):key==="games"?pathname.startsWith("/inspector")||pathname.startsWith("/games"):pathname.startsWith(`/${key}/`);
  const section=pathname.startsWith("/dashboard")?"PLAYER":pathname.startsWith("/analyze")?"ANALYSIS":pathname.startsWith("/inspector")?"GAME LIBRARY":"INTELLIGENCE";
  return <div className="ch-shell min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[var(--sidebar)] text-[#d9d5cd] lg:flex">
      <Link href="/" className="flex h-[106px] flex-col justify-center border-b border-[var(--sidebar-line)] px-6" aria-label="Chesslysis home">
        <span className="mb-2 text-xl leading-none text-[#b9d6c5]">♞</span><span className="text-[13px] font-black tracking-[.15em] text-[#f6f2ea]">CHESSLYSIS</span><span className="mt-1 text-[8px] uppercase tracking-[.18em] text-[#858078]">Chess intelligence</span>
      </Link>
      <nav className="flex-1 overflow-y-auto py-5" aria-label="Primary navigation">{nav.map((item,i)=>{const isActive=active(item.key);return <div key={item.key}>
        {item.group&&<div className={`mb-2 px-6 text-[9px] font-bold uppercase tracking-[.2em] text-[#858078] ${i?"mt-6":""}`}>{item.group}</div>}
        <Link href={item.href??links[item.key]} aria-current={isActive?"page":undefined} className={`relative flex h-11 items-center gap-3 px-6 text-[13px] transition ${isActive?"bg-[#334238] text-[#fffdf7]":"text-[#bcb7ae] hover:bg-white/[.06] hover:text-white"}`}>
          {isActive&&<span className="absolute inset-y-0 left-0 w-[3px] bg-[#b9d6c5]"/>}<span className={`w-4 text-center ${isActive?"text-[#b9d6c5]":"text-[#8c887f]"}`}>{item.icon}</span><span>{item.label}</span>{item.badge&&<span className="ml-auto bg-[#b9d6c5] px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[#1a1917]">{item.badge}</span>}
        </Link>
      </div>})}</nav>
      <div className="border-t border-[var(--sidebar-line)] p-5"><Link href="/" className="mb-3 block text-[11px] text-[#aaa49b] hover:text-white">⌕ Search player</Link><button onClick={toggleTheme} className="flex w-full items-center justify-between border border-[var(--sidebar-line)] px-3 py-2 text-left text-[10px] tracking-wide text-[#aaa49b] hover:border-[#777168] hover:text-white"><span>{dark?"☾ Dark editorial":"☀ Light editorial"}</span><span>{dark?"ON":"OFF"}</span></button></div>
    </aside>
    <div className="lg:pl-[220px]">
      <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-4 backdrop-blur sm:px-6 lg:px-10">
        <div className="ch-eyebrow flex-1 text-[9px]">CHESSLYSIS <span className="mx-2 text-[var(--muted)]">›</span> {section}</div>
        <div className="flex items-center gap-2 sm:gap-3"><Link href="/analyze" className="ch-btn-secondary px-3 py-1.5 text-[11px]">↥ Import PGN</Link><Link href="/" className="ch-btn-secondary hidden px-3 py-1.5 text-[11px] sm:inline-block">⌕ Search Player</Link><button onClick={toggleTheme} className="ch-btn-secondary px-2.5 py-1.5 text-[11px]" aria-label="Toggle theme">{dark?"☾":"☀"}</button><div className="grid h-7 w-7 place-items-center bg-[var(--accent)] text-[9px] font-bold text-white">{username.slice(0,2).toUpperCase()}</div></div>
      </header>
      <div className="pb-16 lg:pb-0">{children}</div>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur lg:hidden" aria-label="Mobile navigation">
      {[nav[0],nav[1],nav[2],nav[3],nav[4]].map(item=>{const isActive=active(item.key);return <Link key={item.key} href={item.href??links[item.key]} aria-current={isActive?"page":undefined} className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] ${isActive?"text-[var(--accent)]":"text-[var(--muted)]"}`}><span className="text-base">{item.icon}</span><span>{item.label.replace(" Game","")}</span></Link>})}
    </nav>
  </div>;
}
