import { z } from "zod";

const telegramMessageSchema = z.object({
  message_id: z.number().int().nonnegative(),
  chat: z.object({
    id: z.number()
  }),
  text: z.string().min(1)
});

export const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative(),
  message: telegramMessageSchema.optional(),
  edited_message: telegramMessageSchema.optional()
});

export function extractTextPayload(input: unknown):
  | { updateId: number; chatId: number; text: string }
  | null {
  const parsed = telegramUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const msg = parsed.data.message ?? parsed.data.edited_message;
  if (!msg?.text) {
    return null;
  }

  return {
    updateId: parsed.data.update_id,
    chatId: msg.chat.id,
    text: msg.text
  };
}
