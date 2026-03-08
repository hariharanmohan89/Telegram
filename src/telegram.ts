import axios from "axios";
import { config } from "./config.js";

export async function sendTelegramText(chatId: number, body: string): Promise<void> {
  await axios.post(
    `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: body.slice(0, 4096),
      disable_web_page_preview: true
    },
    {
      timeout: 8000,
      headers: { "Content-Type": "application/json" }
    }
  );
}
