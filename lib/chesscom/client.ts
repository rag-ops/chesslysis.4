import { assertValidChessComUsername } from "@/lib/chesscom/username";

const API_BASE = "https://api.chess.com/pub";

export type ChessComArchive = { url: string; year: number; month: number };
export type ChessComProfile = { username: string; url?: string; avatar?: string; title?: string; followers?: number; joined?: number; status?: string };
export type ChessComGame = {
  url: string; uuid?: string; pgn?: string; time_control?: string; end_time?: number;
  rated?: boolean; time_class?: string; rules?: string; eco?: string;
  white: { username: string; rating?: number; result?: string };
  black: { username: string; rating?: number; result?: string };
};
export type ImportOptions = { from?: Date; to?: Date; timeClasses?: string[]; maxGames?: number };
const userAgent = process.env.CHESSCOM_USER_AGENT || "Chesslysis/1.0 (+https://github.com/)";
const TIMEOUT_MS = 15_000;

async function chessComFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": userAgent }, cache: "no-store", signal: controller.signal });
    if (response.status === 404) throw new Error("Chess.com profile or game archive was not found.");
    if (response.status === 429) throw new Error("Chess.com is rate-limiting requests. Please wait a moment and try again.");
    if (!response.ok) throw new Error(`Chess.com API returned HTTP ${response.status}.`);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Chess.com API request timed out. Please try again.");
    throw error;
  } finally { clearTimeout(timer); }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) throw new Error("Chess.com API returned an empty response.");
  try { return JSON.parse(text) as T; }
  catch { throw new Error("Chess.com API returned invalid JSON."); }
}

export async function getPlayerProfile(username: string): Promise<ChessComProfile> {
  const normalized = assertValidChessComUsername(username);
  const safeUsername = encodeURIComponent(normalized);
  const profile = await readJson<ChessComProfile>(await chessComFetch(`${API_BASE}/player/${safeUsername}`));
  if (!profile || typeof profile.username !== "string" || !profile.username.trim()) {
    throw new Error("Chess.com API returned an invalid player profile.");
  }
  return profile;
}

export async function getArchives(username: string): Promise<ChessComArchive[]> {
  const safeUsername = encodeURIComponent(assertValidChessComUsername(username));
  const data = await readJson<{ archives?: string[] }>(await chessComFetch(`${API_BASE}/player/${safeUsername}/games/archives`));
  return (data.archives ?? []).flatMap((url) => {
    const match = url.match(/games\/(\d{4})\/(\d{2})$/);
    return match ? [{ url, year: Number(match[1]), month: Number(match[2]) }] : [];
  });
}

export async function getArchiveGames(archive: ChessComArchive): Promise<ChessComGame[]> {
  const data = await readJson<{ games?: ChessComGame[] }>(await chessComFetch(archive.url));
  return Array.isArray(data.games) ? data.games : [];
}
function inDateRange(game: ChessComGame, from?: Date, to?: Date) {
  if (!game.end_time) return true;
  const playedAt = new Date(game.end_time * 1000);
  return (!from || playedAt >= from) && (!to || playedAt <= to);
}

export async function importGamesFromChessCom(username: string, options: ImportOptions = {}): Promise<ChessComGame[]> {
  const normalized = assertValidChessComUsername(username);
  const maxGames = Math.min(Math.max(options.maxGames ?? 100, 1), 1000);
  const timeClasses = options.timeClasses?.length ? new Set(options.timeClasses) : undefined;
  const archives = await getArchives(normalized);
  archives.sort((a,b) => b.year-a.year || b.month-a.month);
  const games: ChessComGame[] = [];
  for (const archive of archives) {
    const archiveGames = await getArchiveGames(archive);
    for (const game of archiveGames) {
      if (!game.pgn || game.rules !== "chess" || !inDateRange(game, options.from, options.to)) continue;
      if (timeClasses && (!game.time_class || !timeClasses.has(game.time_class))) continue;
      games.push(game);
    }
    if (games.length >= maxGames) break;
  }
  return games.sort((a,b) => (b.end_time ?? 0) - (a.end_time ?? 0)).slice(0,maxGames);
}
