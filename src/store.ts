const seenUpdateIds = new Map<string, number>();
const RETAIN_MS = 24 * 60 * 60 * 1000;

export function hasSeenUpdate(updateId: string): boolean {
  purgeExpired();
  return seenUpdateIds.has(updateId);
}

export function markSeenUpdate(updateId: string): void {
  purgeExpired();
  seenUpdateIds.set(updateId, Date.now());
}

function purgeExpired(): void {
  const cutoff = Date.now() - RETAIN_MS;
  for (const [id, seenAt] of seenUpdateIds.entries()) {
    if (seenAt < cutoff) {
      seenUpdateIds.delete(id);
    }
  }
}
