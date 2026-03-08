import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(20),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(20),
  TELEGRAM_WEBHOOK_PATH_TOKEN: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  MAX_INPUT_CHARS: z.coerce.number().int().positive().max(10000).default(2000),
  DEBUG_MODE: z.coerce.boolean().default(false)
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function parseEnv(bindings: Record<string, unknown>): WorkerEnv {
  const parsed = envSchema.safeParse(bindings);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid worker environment: ${issues}`);
  }
  return parsed.data;
}
