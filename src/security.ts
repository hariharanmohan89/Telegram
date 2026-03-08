export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export function verifyTelegramSecret(expectedSecret: string, incomingSecret: string | null): boolean {
  if (!incomingSecret) {
    return false;
  }
  return constantTimeEqual(expectedSecret, incomingSecret);
}

export function normalizeUserText(input: string, maxLength: number): string {
  const compact = input.replace(/\s+/g, " ").trim();
  return compact.slice(0, maxLength);
}
