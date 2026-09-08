/** Conservative tactical-pattern detector based on the position after a move.
 * Tags are geometry hints, never claimed as proof of a winning tactic. */
import { Chess } from "chess.js";

type Piece = { type: string; color: "w" | "b" };
type Board = (Piece | null)[][];
const files = "abcdefgh";
const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
function coords(square: string) { return [files.indexOf(square[0]), 8 - Number(square[1])] as const; }
function square(file: number, rank: number) { return `${files[file]}${8 - rank}`; }
function inside(file: number, rank: number) { return file >= 0 && file < 8 && rank >= 0 && rank < 8; }
function parseBoard(fen: string): Board | null {
  const rows = fen.trim().split(/\s+/)[0]?.split("/");
  if (!rows || rows.length !== 8) return null;
  const board: Board = [];
  for (const row of rows) {
    const out: (Piece | null)[] = [];
    for (const char of row) {
      if (/^[1-8]$/.test(char)) for (let i = 0; i < Number(char); i++) out.push(null);
      else if (/^[prnbqkPRNBQK]$/.test(char)) out.push({ type: char.toLowerCase(), color: char === char.toUpperCase() ? "w" : "b" });
      else return null;
    }
    if (out.length !== 8) return null;
    board.push(out);
  }
  return board;
}
function attackedSquares(board: Board, from: string, piece: Piece): string[] {
  const [file, rank] = coords(from);
  if (!inside(file, rank)) return [];
  const out: string[] = [];
  const add = (f: number, r: number) => { if (inside(f, r)) out.push(square(f, r)); };
  if (piece.type === "n") {
    for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) add(file + df, rank + dr);
    return out;
  }
  if (piece.type === "k") {
    for (const df of [-1, 0, 1]) for (const dr of [-1, 0, 1]) if (df || dr) add(file + df, rank + dr);
    return out;
  }
  if (piece.type === "p") {
    const direction = piece.color === "w" ? -1 : 1;
    add(file - 1, rank + direction); add(file + 1, rank + direction);
    return out;
  }
  const directions = piece.type === "b"
    ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    : piece.type === "r"
      ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
      : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [df, dr] of directions) {
    let f = file + df, r = rank + dr;
    while (inside(f, r)) {
      out.push(square(f, r));
      if (board[r][f]) break;
      f += df; r += dr;
    }
  }
  return out;
}

export function detectTacticalPatterns(fenAfter: string, uci: string): string[] {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return [];
  const board = parseBoard(fenAfter);
  if (!board) return [];
  const destination = uci.slice(2, 4);
  const [file, rank] = coords(destination);
  const moved = inside(file, rank) ? board[rank][file] : null;
  if (!moved) return [];
  const enemy = moved.color === "w" ? "b" : "w";
  const targets = attackedSquares(board, destination, moved)
    .map(s => { const [f, r] = coords(s); return { square: s, piece: board[r]?.[f] ?? null }; })
    .filter((target): target is { square: string; piece: Piece } => Boolean(target.piece && target.piece.color === enemy));
  const tags: string[] = [];
  // A fork requires two independently valuable enemy targets. This intentionally
  // catches the canonical knight/rook/queen fork geometry without inventing it.
  if (targets.filter(target => values[target.piece.type] >= 3).length >= 2) tags.push("fork");
  if (["b", "r", "q"].includes(moved.type)) {
    // A pinned/skewered piece is never the king itself, so `first` excludes it here.
    for (const first of targets) {
      if (values[first.piece.type] < 3 || first.piece.type === "k") continue;
      const [ff, fr] = coords(first.square);
      const df = Math.sign(ff - file), dr = Math.sign(fr - rank);
      let f = ff + df, r = fr + dr;
      while (inside(f, r)) {
        const behind = board[r][f];
        if (behind) {
          if (behind.color === enemy) {
            // Pin: the piece behind `first` on this ray is worth more (or is the king) —
            // `first` can't safely move without exposing it.
            if (behind.type === "k" || values[behind.type] > values[first.piece.type]) tags.push("pin");
            // Skewer: `first` itself is the more valuable piece — when it moves (often forced,
            // e.g. to escape check), the less valuable piece behind it becomes capturable.
            else if (values[first.piece.type] > values[behind.type]) tags.push("skewer");
          }
          break;
        }
        f += df; r += dr;
      }
    }
  }
  if (!tags.length && targets.some(target => values[target.piece.type] >= 5)) tags.push("piece attack");

  // Mate-in-1 threat: delegate to chess.js's own (well-tested) move generator and
  // checkmate detector rather than hand-rolling check/mate logic here.
  if (allowsMateInOne(fenAfter)) tags.unshift("allows mate in 1");

  return [...new Set(tags)].slice(0, 3);
}

/** True if the side to move in `fen` has at least one legal move that delivers checkmate. */
function allowsMateInOne(fen: string): boolean {
  let position: Chess;
  try {
    position = new Chess(fen);
  } catch {
    return false;
  }
  if (position.isGameOver()) return false;
  for (const move of position.moves()) {
    const trial = new Chess(fen);
    try {
      trial.move(move);
    } catch {
      continue;
    }
    if (trial.isCheckmate()) return true;
  }
  return false;
}
