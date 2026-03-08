import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { verifyTelegramSecret } from "./security.js";
import { telegramWebhookSchema } from "./types.js";
import { hasSeenMessage, markSeenMessage } from "./store.js";
import { generateReply } from "./ai.js";
import { sendTelegramText } from "./telegram.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger
  })
);
app.use(helmet());
app.use(
  cors({
    origin: false
  })
);

const limiter = rateLimit({
  windowMs: config.REQUEST_WINDOW_MS,
  limit: config.REQUEST_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post(
  `/webhook/${config.TELEGRAM_WEBHOOK_PATH_TOKEN}`,
  limiter,
  express.json({ limit: "1mb" }),
  async (req, res): Promise<void> => {
    const incomingSecret = req.header("x-telegram-bot-api-secret-token");

    if (!verifyTelegramSecret(config.TELEGRAM_WEBHOOK_SECRET, incomingSecret)) {
      req.log.warn("invalid telegram webhook secret");
      res.sendStatus(401);
      return;
    }

    const parsed = telegramWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ issues: parsed.error.issues }, "invalid webhook payload");
      res.sendStatus(200);
      return;
    }

    const message = parsed.data.message ?? parsed.data.edited_message;
    if (!message?.text) {
      res.sendStatus(200);
      return;
    }

    const idempotencyKey = String(parsed.data.update_id);
    if (hasSeenMessage(idempotencyKey)) {
      res.sendStatus(200);
      return;
    }

    markSeenMessage(idempotencyKey);

    try {
      const reply = await generateReply(message.text);
      await sendTelegramText(message.chat.id, reply);
    } catch (error) {
      req.log.error({ err: error, updateId: parsed.data.update_id }, "failed to handle incoming message");
    }

    res.sendStatus(200);
  }
);

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "service listening");
});
