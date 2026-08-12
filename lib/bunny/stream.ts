import "server-only";
import { createHash } from "node:crypto";

export type BunnyVideo = {
  guid: string;
  title: string;
  status: number;
  encodeProgress: number;
  length: number;
  storageSize: number;
  availableResolutions?: string | null;
  thumbnailFileName?: string | null;
  dateUploaded?: string | null;
};

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name}_MISSING`);
  }

  return value;
}

export function getBunnyConfig() {
  return {
    libraryId: required("BUNNY_STREAM_LIBRARY_ID"),
    apiKey: required("BUNNY_STREAM_API_KEY"),
    tokenKey: required("BUNNY_STREAM_TOKEN_KEY"),
    cdnHostname:
      process.env.BUNNY_STREAM_CDN_HOSTNAME?.trim() || "",
  };
}

async function bunnyFetch(
  path: string,
  init: RequestInit = {},
) {
  const { libraryId, apiKey } = getBunnyConfig();

  const response = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}${path}`,
    {
      ...init,
      headers: {
        Accept: "application/json",
        AccessKey: apiKey,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `BUNNY_${response.status}: ${body || response.statusText}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

export async function createBunnyVideo(
  title: string,
): Promise<BunnyVideo> {
  return bunnyFetch("/videos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
    }),
  });
}

export async function getBunnyVideo(
  videoId: string,
): Promise<BunnyVideo> {
  return bunnyFetch(`/videos/${videoId}`, {
    method: "GET",
  });
}

export async function listBunnyVideos(
  page = 1,
  itemsPerPage = 100,
): Promise<BunnyVideo[]> {
  const result = await bunnyFetch(
    `/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
    { method: "GET" },
  );

  return Array.isArray(result?.items) ? result.items : [];
}

export async function deleteBunnyVideo(
  videoId: string,
) {
  await bunnyFetch(`/videos/${videoId}`, {
    method: "DELETE",
  });
}

export function createBunnyTusCredentials(
  videoId: string,
) {
  const { libraryId, apiKey } = getBunnyConfig();

  const expirationTime =
    Math.floor(Date.now() / 1000) + 24 * 60 * 60;

  const signature = createHash("sha256")
    .update(
      `${libraryId}${apiKey}${expirationTime}${videoId}`,
    )
    .digest("hex");

  return {
    videoId,
    libraryId,
    expirationTime,
    signature,
    endpoint: "https://video.bunnycdn.com/tusupload",
  };
}

export function createBunnyEmbedUrl(
  videoId: string,
  lifetimeSeconds = 10 * 60,
) {
  const { libraryId, tokenKey } = getBunnyConfig();

  const expires =
    Math.floor(Date.now() / 1000) + lifetimeSeconds;

  const token = createHash("sha256")
    .update(`${tokenKey}${videoId}${expires}`)
    .digest("hex");

  return {
    url:
      `https://player.mediadelivery.net/embed/` +
      `${libraryId}/${videoId}` +
      `?token=${token}&expires=${expires}`,
    expires,
  };
}

export function bunnyStatusLabel(status: number) {
  switch (status) {
    case 0:
      return "queued";
    case 1:
      return "processing";
    case 2:
      return "encoding";
    case 3:
      return "ready";
    case 4:
      return "playable";
    case 5:
      return "failed";
    case 6:
      return "uploading";
    case 7:
      return "uploaded";
    case 8:
      return "upload_failed";
    default:
      return "unknown";
  }
}

export function getBunnyThumbnailUrl(
  videoId: string,
  thumbnailFileName?: string | null,
) {
  const { cdnHostname } = getBunnyConfig();

  if (!cdnHostname) return null;

  const fileName =
    thumbnailFileName?.trim() || "thumbnail.jpg";

  return `https://${cdnHostname}/${videoId}/${fileName}`;
}