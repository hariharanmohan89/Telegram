import { describe, expect, it } from "vitest";
import { normalizeUserText, verifyTelegramSecret } from "../src/security.js";

describe("verifyTelegramSecret", () => {
  it("accepts valid secret", () => {
    const secret = "test-telegram-secret-0123456789";
    expect(verifyTelegramSecret(secret, secret)).toBe(true);
  });

  it("rejects invalid secret", () => {
    const secret = "test-telegram-secret-0123456789";
    expect(verifyTelegramSecret(secret, "wrong-secret")).toBe(false);
  });
});

describe("normalizeUserText", () => {
  it("normalizes whitespace and truncates", () => {
    const value = normalizeUserText("  hello\n\nworld   ", 7);
    expect(value).toBe("hello w");
  });
});
