"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerSearch() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = username.trim();
    if (value) router.push(`/dashboard/${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={submit} className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Enter a Chess.com username"
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 text-white outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring-2"
        aria-label="Chess.com username"
      />
      <button className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
        Open dashboard
      </button>
    </form>
  );
}
