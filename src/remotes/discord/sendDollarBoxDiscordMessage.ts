import { sendDiscordMessage } from "./sendDiscordMessage";

export const sendDevMessage = async (message: string) => {
  return sendDiscordMessage(
    message,
    "https://discord.com/api/webhooks/1355914913477955786/A1hhqeaVsdpLf6e21GjFjWvhS9ItacSpeUPbX7a6HaXFh7J1LYofYUA82K7_nttjVk06",
  );
};
