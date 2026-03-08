import { parseEnv } from "./env.js";
import { verifyTelegramSecret } from "./security.js";
import { extractTextPayload } from "./types.js";
import { hasSeenUpdate, markSeenUpdate } from "./store.js";
import { generateReply } from "./ai.js";
import { sendTelegramText } from "./telegram.js";

const debugState: {
  bootedAt: string;
  lastWebhookAt: string | null;
  lastAuthorizedWebhookAt: string | null;
  lastUnauthorizedWebhookAt: string | null;
  lastUpdateId: number | null;
  lastMessagePreview: string | null;
  lastOpenAiError: string | null;
  lastTelegramSendError: string | null;
  lastSuccessAt: string | null;
} = {
  bootedAt: new Date().toISOString(),
  lastWebhookAt: null,
  lastAuthorizedWebhookAt: null,
  lastUnauthorizedWebhookAt: null,
  lastUpdateId: null,
  lastMessagePreview: null,
  lastOpenAiError: null,
  lastTelegramSendError: null,
  lastSuccessAt: null
};

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

    const debugPath = `/debug/status/${env.TELEGRAM_WEBHOOK_PATH_TOKEN}`;
    if (env.DEBUG_MODE && request.method === "GET" && url.pathname === debugPath) {
      return jsonResponse({ status: "ok", debug: debugState });
    }

    const webhookPath = `/webhook/${env.TELEGRAM_WEBHOOK_PATH_TOKEN}`;
    if (request.method !== "POST" || url.pathname !== webhookPath) {
      return new Response("Not found", { status: 404 });
    }

    debugState.lastWebhookAt = new Date().toISOString();

    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    if (!verifyTelegramSecret(env.TELEGRAM_WEBHOOK_SECRET, secretHeader)) {
      debugState.lastUnauthorizedWebhookAt = new Date().toISOString();
      return new Response("Unauthorized", { status: 401 });
    }
    debugState.lastAuthorizedWebhookAt = new Date().toISOString();

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

    debugState.lastUpdateId = payload.updateId;
    debugState.lastMessagePreview = payload.text.slice(0, 120);

    const idempotencyKey = String(payload.updateId);
    if (hasSeenUpdate(idempotencyKey)) {
      return new Response("OK", { status: 200 });
    }

    markSeenUpdate(idempotencyKey);

    try {
      const reply = await generateReply(payload.text, env);
      await sendTelegramText(payload.chatId, reply, env);
      debugState.lastOpenAiError = null;
      debugState.lastTelegramSendError = null;
      debugState.lastSuccessAt = new Date().toISOString();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("failed to process update", {
        updateId: payload.updateId,
        error: message
      });

      if (message.toLowerCase().includes("telegram")) {
        debugState.lastTelegramSendError = message;
      } else {
        debugState.lastOpenAiError = message;
      }
    }

    return new Response("OK", { status: 200 });
  }
};
