"use client";

import { useSiteLocale } from "@/lib/i18n/use-site-locale";
import {
  localizeCountry,
  localizeJobTitle,
  localizeStudentName,
} from "@/lib/i18n/student-display";

/* اسم الطالب حسب لغة الموقع (الإنجليزية: الاسم المخصص للشهادة، أول 3 كلمات) */
export function LocalizedStudentName({
  name,
  nameEn,
  fallback = "",
}: {
  name?: string | null;
  nameEn?: string | null;
  fallback?: string;
}) {
  const locale = useSiteLocale();
  const value = localizeStudentName(locale, name ?? "", nameEn ?? "");
  return <>{value || fallback}</>;
}

/* المهنة — البلد حسب لغة الموقع */
export function LocalizedStudentMeta({
  job,
  country,
  separator = "—",
}: {
  job?: string | null;
  country?: string | null;
  separator?: string;
}) {
  const locale = useSiteLocale();
  const j = job ? localizeJobTitle(locale, job) : "";
  const c = country ? localizeCountry(locale, country) : "";
  return <>{[j, c].filter(Boolean).join(` ${separator} `)}</>;
}
