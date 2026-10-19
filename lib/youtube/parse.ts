/*
 * استخراج معرّف فيديو YouTube (11 حرفًا) من أي رابط شائع.
 * نخزّن المعرّف فقط في قاعدة البيانات، ولا نخزّن الرابط كما هو،
 * حتى لا يمكن إدخال روابط غريبة داخل المشغّل.
 */

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

export function extractYouTubeVideoId(
  input: unknown,
): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  if (!value) {
    return null;
  }

  // المعرّف وحده.
  if (YOUTUBE_ID_PATTERN.test(value)) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(
      /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`,
    );
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else {
    const [, first, second] = url.pathname.split("/");

    if (first === "watch") {
      candidate = url.searchParams.get("v");
    } else if (
      first === "embed" ||
      first === "shorts" ||
      first === "live" ||
      first === "v"
    ) {
      candidate = second ?? null;
    }
  }

  return candidate && YOUTUBE_ID_PATTERN.test(candidate)
    ? candidate
    : null;
}

export function getYouTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(
    videoId,
  )}`;
}
