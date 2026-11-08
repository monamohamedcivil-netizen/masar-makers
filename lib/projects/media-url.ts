/*
 * رابط ثابت لصور مشاريع الطلاب.
 *
 * بدل الرابط الموقّع من Supabase (يتغيّر في كل زيارة فيعيد المتصفح التحميل كل مرة)،
 * نعرض الصورة من مسار داخل المنصة يعطي نفس الرابط دائمًا، ويطلب من المتصفح حفظ الصورة
 * سنة كاملة. أسماء ملفات Storage فريدة، فالصورة الجديدة تأخذ رابطًا جديدًا تلقائيًا.
 */
export function projectMediaUrl(
  storagePath: string,
): string {
  return `/api/project-media?p=${encodeURIComponent(
    storagePath,
  )}`;
}
