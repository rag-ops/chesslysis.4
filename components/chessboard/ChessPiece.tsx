"use client";

import React from "react";

type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

const labels: Record<PieceType, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

export default function ChessPiece({ color, type }: { color: "w" | "b"; type: PieceType }) {
  const fill = color === "w" ? "#f8f4ea" : "#22241f";
  const stroke = color === "w" ? "#5e5b54" : "#0f100f";
  const common = { fill, stroke, strokeWidth: 1.8, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%] drop-shadow-[0_2px_1px_rgba(0,0,0,.18)]" role="img" aria-label={`${color === "w" ? "white" : "black"} ${labels[type]}`}>
      {type === "p" && <g {...common}><circle cx="32" cy="17" r="8"/><path d="M25 29c1-5 13-5 14 0l2 16H23z"/><path d="M20 48h24l3 6H17z"/></g>}
      {type === "n" && <g {...common}><path d="M20 53h26l-2-5c-2-4-6-7-10-9 2-5 4-9 2-15-2-7-7-10-14-11 2 4 2 7 0 10-3 4-5 8-4 14 1 4 4 7 8 8-3 1-5 4-6 8z"/><circle cx="30" cy="19" r="1.8" fill={stroke} stroke="none"/></g>}
      {type === "b" && <g {...common}><path d="M32 9c-6 6-8 11-5 17-6 6-8 12-5 19h20c3-7 1-13-5-19 3-6 1-11-5-17z"/><path d="M25 25h14M22 45h20" fill="none" stroke={stroke} strokeWidth="2"/><path d="M18 49h28l3 6H15z"/></g>}
      {type === "r" && <g {...common}><path d="M18 11h8v7h12v-7h8v14l-5 4v15H23V29l-5-4z"/><path d="M20 45h24M17 50h30l2 5H15z"/></g>}
      {type === "q" && <g {...common}><path d="M15 16l8 6 9-11 9 11 8-6-4 27H19z"/><circle cx="15" cy="15" r="3"/><circle cx="32" cy="9" r="3"/><circle cx="49" cy="15" r="3"/><path d="M18 48h28l3 7H15z"/></g>}
      {type === "k" && <g {...common}><path d="M28 8h8v8h8v7h-8v5c7 4 10 8 9 17H19c-1-9 2-13 9-17v-5h-8v-7h8z"/><path d="M17 49h30l3 6H14z"/></g>}
    </svg>
  );
}
