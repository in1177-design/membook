const BOT_UA_PATTERN =
  /bot|crawl|spider|preview|whatsapp|facebookexternalhit|slackbot|telegrambot|linkedinbot|twitterbot|discordbot|embed|headless/i;

const MOBILE_UA_PATTERN = /Mobi|Android|iPhone|iPad/i;

export function detectIsBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERN.test(userAgent);
}

export function detectDeviceType(userAgent: string | null): "MOBILE" | "DESKTOP" | "UNKNOWN" {
  if (!userAgent) return "UNKNOWN";
  return MOBILE_UA_PATTERN.test(userAgent) ? "MOBILE" : "DESKTOP";
}
