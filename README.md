# Telegram Secure Agent

Production-focused Telegram webhook service that validates webhook secrets, rate-limits requests, validates payloads, and calls OpenAI to generate responses.

## Security controls included

- Strict environment validation at startup (`zod`).
- `X-Telegram-Bot-Api-Secret-Token` validation using constant-time comparison.
- Request rate limiting on webhook routes.
- Secure HTTP headers via `helmet`.
- Structured logging with token/signature redaction (`pino`).
- Input length limits and normalization before model calls.
- Basic replay/idempotency protection for duplicate update IDs.

## Prerequisites

- Node.js 20+
- A Telegram bot token (from BotFather)
- OpenAI API key

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Generate secure random tokens:

```bash
./scripts_generate_secret.sh
```

Use one generated value for `TELEGRAM_WEBHOOK_SECRET` and another for `TELEGRAM_WEBHOOK_PATH_TOKEN`.

## Telegram webhook configuration

Set webhook after deployment:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://<your-domain>/webhook/<TELEGRAM_WEBHOOK_PATH_TOKEN>",
    "secret_token":"<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates":["message","edited_message"],
    "drop_pending_updates":true
  }'
```

## Credential checklist (Step 1)

Set each variable in `.env`:

- `TELEGRAM_BOT_TOKEN`: from BotFather when bot is created.
- `TELEGRAM_WEBHOOK_SECRET`: random secret string, sent by Telegram in webhook header.
- `TELEGRAM_WEBHOOK_PATH_TOKEN`: random URL path token for webhook endpoint hardening.
- `OPENAI_API_KEY`: API key from your OpenAI project.
- `OPENAI_MODEL`: keep `gpt-4.1-mini` unless you need a different model.

## Production deployment notes

- Terminate TLS at the edge (load balancer / reverse proxy).
- Put the service behind an IP allowlist/WAF where possible.
- Rotate `TELEGRAM_BOT_TOKEN` and `OPENAI_API_KEY` regularly.
- Move idempotency state from in-memory map to Redis for multi-instance deployments.
- Add outbound timeout/retry strategy using a queue for higher reliability.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run check
```
