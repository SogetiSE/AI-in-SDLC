/**
 * One-line JSON log events, greppable by `event`. Never pass passwords or tokens.
 */
export function logEvent(event: string, fields: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ event, ...fields }));
}

export function logError(event: string, fields: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ event, ...fields }));
}
