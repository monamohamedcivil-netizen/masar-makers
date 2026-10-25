/**
 * Link checkers / crawlers (Meta ad review, link previews, search bots) open ad links
 * like real visitors. They must not start a chat (no session, no admin notification).
 */
const BOT_UA =
  /meta-externalads|meta-externalagent|facebookexternalhit|facebookcatalog|facebot|googlebot|adsbot|bingbot|yandexbot|duckduckbot|baiduspider|applebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|petalbot|ahrefsbot|semrushbot|bytespider|whatsapp\/|crawler|spider|headlesschrome|lighthouse|python-requests|curl\/|\+https?:\/\//i;

export function isBotUserAgent(userAgent: string | null | undefined) {
  return BOT_UA.test(String(userAgent ?? ""));
}
