import { z } from "zod";

const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative(),
  message: z
    .object({
      message_id: z.number().int().nonnegative(),
      chat: z.object({
        id: z.number()
      }),
      text: z.string().min(1)
    })
    .optional(),
  edited_message: z
    .object({
      message_id: z.number().int().nonnegative(),
      chat: z.object({
        id: z.number()
      }),
      text: z.string().min(1)
    })
    .optional()
});

export const telegramWebhookSchema = telegramUpdateSchema.refine(
  (data) => {
    const msg = data.message ?? data.edited_message;
    return Boolean(msg?.text);
  },
  {
    message: "No processable text message in update"
  }
);

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
