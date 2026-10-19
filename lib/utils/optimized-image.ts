/*
 * تحويل رابط صورة عامة من Supabase Storage إلى رابط يمر عبر مُحسِّن الصور
 * في Next.js (/_next/image).
 *
 * الفائدة: سيرفر المنصة يحمّل الصورة من Supabase مرة واحدة فقط، يصغّرها
 * ويحوّلها إلى WebP، ثم يحتفظ بنسخة جاهزة ويقدّمها لكل الزوار.
 * فلا تعود Supabase تُحسب عليها حركة (Egress) مع كل زيارة.
 *
 * أي رابط ليس من Supabase العام (أو GIF/SVG) يرجع كما هو بدون تغيير.
 */

const SUPABASE_HOST = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    ).host;
  } catch {
    return "";
  }
})();

export function getOptimizedImageSrc(
  src: string,
  width = 1200,
): string {
  if (!src || !SUPABASE_HOST) {
    return src;
  }

  try {
    const url = new URL(src);

    const isSupabasePublicImage =
      url.host === SUPABASE_HOST &&
      url.pathname.startsWith("/storage/v1/object/public/") &&
      !/\.(gif|svg)$/i.test(url.pathname);

    if (!isSupabasePublicImage) {
      return src;
    }

    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  } catch {
    return src;
  }
}
