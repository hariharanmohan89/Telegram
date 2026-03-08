# Telegram Secure Agent (Cloudflare Workers)

Secure Telegram webhook service on Cloudflare Workers that validates webhook secrets, validates payloads, and calls OpenAI to generate replies.

## Security controls included

- Strict runtime environment validation (`zod`).
- Secret header validation (`X-Telegram-Bot-Api-Secret-Token`) using constant-time compare.
- Unpredictable webhook path token (`/webhook/<token>`).
- Input length limits and normalization before model calls.
- Basic replay/idempotency protection for duplicate Telegram update IDs.
- Payload size guard (rejects payloads over 1MB).

## Prerequisites

- Cloudflare account (free tier is fine)
- Telegram bot token from `@BotFather`
- OpenAI API key
- Node.js 20+

## Setup

```bash
cp .dev.vars.example .dev.vars
npm install
npm run dev
```

Generate secrets:

```bash
./scripts_generate_secret.sh
```

Use different generated values for:

- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_WEBHOOK_PATH_TOKEN`

## Deploy to Cloudflare Workers

1. Log in to Cloudflare from terminal:

```bash
npx wrangler login
```

2. Set production secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TELEGRAM_WEBHOOK_PATH_TOKEN
npx wrangler secret put OPENAI_API_KEY
```

3. Deploy:

```bash
npm run deploy
```

4. Get your Worker URL from deploy output (for example `https://telegram-secure-agent.<subdomain>.workers.dev`).

## Register Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://<worker-domain>/webhook/<TELEGRAM_WEBHOOK_PATH_TOKEN>",
    "secret_token":"<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates":["message","edited_message"],
    "drop_pending_updates":true
  }'
```

Verify:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## Scripts

```bash
npm run dev
npm run deploy
npm run lint
npm run test
npm run typecheck
npm run check
```

## Notes

- In-memory idempotency cache is per Worker isolate. For strict cross-instance dedupe, add KV or Durable Objects.
- Keep bot token and OpenAI key only in Worker secrets, never in source control.
