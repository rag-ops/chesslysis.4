/** Persisted metric guardrails. Raw engine mate sentinels must never become player aggregates. */
export function safeAccuracy(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function safeACPL(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000 ? value : null;
}


export function safeEvaluationLoss(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10 ? value : null;
}
