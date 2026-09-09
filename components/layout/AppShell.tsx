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

export default function AppShell({
  username, children, playerNav = username
}: {
  username: string; children: ReactNode; playerNav?: string | null;
}) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chesslysis-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("chesslysis-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const links: Record<string, string> = useMemo(() => {
    const target = playerNav ? encodeURIComponent(playerNav) : null;
    return {
      dashboard: target ? `/dashboard/${target}` : "/",
      insights: target ? `/insights/${target}` : "/",
      training: target ? `/training/${target}` : "/",
      openings: target ? `/openings/${target}` : "/",
      mistakes: target ? `/mistakes/${target}` : "/",
      games: target ? `/inspector/${target}` : "/",
      dna: target ? `/dna/${target}` : "/",
      performance: target ? `/performance/${target}` : "/",
      time: target ? `/time/${target}` : "/",
      "data-health": target ? `/data-health/${target}` : "/",
    };
  }, [playerNav]);

  const active = (key: string) =>
    key === "analyze" ? pathname.startsWith("/analyze") :
    key === "dashboard" ? pathname.startsWith("/dashboard") :
    pathname.includes(`/${key}/`);

  const section =
    pathname.startsWith("/dashboard") ? "PLAYER" :
    pathname.startsWith("/analyze") ? "ANALYSIS" :
    pathname.startsWith("/games/") ? "GAME REVIEW" : "INTELLIGENCE";

  return (
    <div className="ch-shell">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[var(--sidebar)] text-[#d9d5cd] lg:flex">
        <Link href="/" className="flex h-[106px] flex-col justify-center border-b border-[var(--sidebar-line)] px-6">
          <span className="mb-2 text-xl leading-none text-[var(--accent)]">♞</span>
          <span className="text-[13px] font-black tracking-[.15em] text-[#f6f2ea]">CHESSLYSIS</span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-5">
          {nav.map((item, i) => (
            <div key={item.key}>
              {item.group && (
                <div className={`mb-2 px-6 text-[9px] font-bold uppercase tracking-[.2em] text-[#858078] ${i ? "mt-6" : ""}`}>
                  {item.group}
                </div>
              )}
              <Link
                href={item.href ?? links[item.key]}
                aria-current={active(item.key) ? "page" : undefined}
                className={`relative flex h-11 items-center gap-3 px-6 text-[13px] transition ${
                  active(item.key)
                    ? "bg-[#334238] text-[#fffdf7]"
                    : "text-[#bcb7ae] hover:bg-white/[.06] hover:text-white"
                }`}
              >
                {active(item.key) && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]" />}
                <span className={`w-4 text-center ${active(item.key) ? "text-[var(--accent)]" : "text-[#8c887f]"}`}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="ml-auto bg-[var(--accent)] px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[#fff]">{item.badge}</span>}
              </Link>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--sidebar-line)] p-4">
          <Link href="/" className="mb-2 block px-1 py-2 text-[11px] text-[#aaa49b] hover:text-white">⌕ Search player</Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 border border-[var(--sidebar-line)] px-3 py-2.5 text-left text-[10px] tracking-wide text-[#aaa49b] hover:text-white"
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
          >
            <span>{dark ? "☾" : "☀"}</span>
            <span>{dark ? "Dark Mode" : "Light Mode"}</span>
            <span className="ml-auto h-1.5 w-1.5 bg-[var(--accent)]" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="ch-eyebrow flex-1 text-[9px]">
            CHESSLYSIS <span className="mx-2 text-[var(--muted)]">›</span> {section}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/analyze" className="ch-btn-secondary hidden px-3 py-1.5 text-[11px] sm:block">↥ Import PGN</Link>
            <Link href="/" className="ch-btn-secondary hidden px-3 py-1.5 text-[11px] sm:block">⌕ Search Player</Link>
            <button type="button" onClick={toggleTheme} className="ch-btn-secondary grid h-8 w-8 place-items-center text-xs lg:hidden" aria-label="Toggle theme">
              {dark ? "☾" : "☀"}
            </button>
            <div className="grid h-8 w-8 place-items-center bg-[var(--accent)] text-[9px] font-bold text-white">
              {username.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="min-h-[calc(100vh-56px)]">{children}</div>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur lg:hidden">
          {[
            ["/analyze", "▦", "Analyze"],
            [links.dashboard, "▰", "Analysis"],
            [links.insights, "⌁", "Insights"],
            [links.training, "♞", "Train"],
            ["/", "⌕", "Search"],
          ].map(([href, icon, label]) => (
            <Link
              key={label}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] text-[var(--muted)]"
            >
              <span className="text-sm">{icon}</span><span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
