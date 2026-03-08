import { parseEnv } from "./env.js";
import { verifyTelegramSecret } from "./security.js";
import { extractTextPayload } from "./types.js";
import { hasSeenUpdate, markSeenUpdate } from "./store.js";
import { generateReply } from "./ai.js";
import { sendTelegramText } from "./telegram.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function tooLarge(request: Request): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return false;
  }
  const parsed = Number(contentLength);
  return Number.isFinite(parsed) && parsed > 1024 * 1024;
}

export default {
  async fetch(request: Request, bindings: Record<string, unknown>): Promise<Response> {
    const env = parseEnv(bindings);
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    const webhookPath = `/webhook/${env.TELEGRAM_WEBHOOK_PATH_TOKEN}`;
    if (request.method !== "POST" || url.pathname !== webhookPath) {
      return new Response("Not found", { status: 404 });
    }

    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    if (!verifyTelegramSecret(env.TELEGRAM_WEBHOOK_SECRET, secretHeader)) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (tooLarge(request)) {
      return new Response("Payload too large", { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const payload = extractTextPayload(body);
    if (!payload) {
      return new Response("OK", { status: 200 });
    }

    const idempotencyKey = String(payload.updateId);
    if (hasSeenUpdate(idempotencyKey)) {
      return new Response("OK", { status: 200 });
    }

    markSeenUpdate(idempotencyKey);

    try {
      const reply = await generateReply(payload.text, env);
      await sendTelegramText(payload.chatId, reply, env);
    } catch (error) {
      console.error("failed to process update", {
        updateId: payload.updateId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return new Response("OK", { status: 200 });
  }
};
