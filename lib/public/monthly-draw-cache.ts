/*
 * ذاكرة مؤقتة لحالة السحب الشهري العامة (نفس النتيجة لكل الزوار).
 * طوال الشهر الحالة ثابتة، فلا داعي لقراءة قاعدة البيانات مع كل صفحة:
 * تُحفظ النتيجة حتى ساعة، ولا تتجاوز أبدًا موعد السحب التالي،
 * ولا تُحفظ أثناء السحب المباشر. أي تعديل من الإدارة يمسحها فورًا.
 *
 * ملف عادي (ليس "use server").
 */

const MAX_TTL_MS = 60 * 60 * 1000;
const SAFETY_MS = 2 * 60 * 1000;

type Entry<T> = { value: T; until: number };

let entry: Entry<unknown> | null = null;

export function readPublicDrawCache<T>(): T | undefined {
  if (entry && Date.now() < entry.until) {
    return entry.value as T;
  }
  entry = null;
  return undefined;
}

/** Store only a calm state (no live draw); never past the next check moment. */
export function writePublicDrawCache<T>(
  value: T,
  options: { live: boolean; nextCheckAt: string | null | undefined },
) {
  if (options.live) {
    entry = null;
    return;
  }

  const now = Date.now();
  let until = now + MAX_TTL_MS;

  if (options.nextCheckAt) {
    const t = new Date(options.nextCheckAt).getTime();
    if (Number.isFinite(t)) until = Math.min(until, t - SAFETY_MS);
  }

  entry = until > now ? { value, until } : null;
}

export function clearPublicDrawCache() {
  entry = null;
}
