export function normalizeChessComUsername(value: string): string {
  return value.trim();
}

export function isValidChessComUsername(value: string): boolean {
  return /^[A-Za-z0-9_-]{3,25}$/.test(normalizeChessComUsername(value));
}

export function assertValidChessComUsername(value: string): string {
  const normalized = normalizeChessComUsername(value);
  if (!isValidChessComUsername(normalized)) {
    throw new Error("Invalid Chess.com username format.");
  }
  return normalized;
}
