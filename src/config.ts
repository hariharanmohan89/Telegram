import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  TELEGRAM_BOT_TOKEN: z.string().min(20),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(20),
  TELEGRAM_WEBHOOK_PATH_TOKEN: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  MAX_INPUT_CHARS: z.coerce.number().int().positive().max(10000).default(2000),
  REQUEST_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  REQUEST_LIMIT: z.coerce.number().int().positive().default(120)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const config = parsed.data;
