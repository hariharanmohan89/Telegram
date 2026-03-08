type SeenRecord = {
  seenAt: number;
};

const seenMessageIds = new Map<string, SeenRecord>();
const RETAIN_MS = 24 * 60 * 60 * 1000;

export function hasSeenMessage(messageId: string): boolean {
  purgeExpired();
  return seenMessageIds.has(messageId);
}

export function markSeenMessage(messageId: string): void {
  purgeExpired();
  seenMessageIds.set(messageId, { seenAt: Date.now() });
}

function purgeExpired(): void {
  const cutoff = Date.now() - RETAIN_MS;
  for (const [id, record] of seenMessageIds.entries()) {
    if (record.seenAt < cutoff) {
      seenMessageIds.delete(id);
    }
  }
}
