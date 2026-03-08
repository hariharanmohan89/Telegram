import type { WorkerEnv } from "./env.js";

export async function sendTelegramText(chatId: number, body: string, env: WorkerEnv): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: body.slice(0, 4096),
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${text}`);
  }
}
