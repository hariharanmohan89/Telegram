import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.x-telegram-bot-api-secret-token",
      "response.config.headers.Authorization",
      "response.config.headers.authorization",
      "access_token",
      "telegram_bot_token",
      "openai_api_key",
      "*.token",
      "*.secret"
    ],
    censor: "[REDACTED]"
  }
});
