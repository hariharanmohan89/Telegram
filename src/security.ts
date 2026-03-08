import crypto from "node:crypto";

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function verifyTelegramSecret(expectedSecret: string, incomingSecret?: string): boolean {
  if (!incomingSecret) {
    return false;
  }

  return safeEqual(Buffer.from(expectedSecret, "utf8"), Buffer.from(incomingSecret, "utf8"));
}

export function normalizeUserText(input: string, maxLength: number): string {
  const compact = input.replace(/\s+/g, " ").trim();
  return compact.slice(0, maxLength);
}
