/*
 * Student pricing rules (chat + enrollment requests + payments).
 *
 * Egyptian-pound LIST prices are for students living in Egypt
 *   (country = Egypt AND the phone is not clearly a foreign number)
 * and for students from Libya, Yemen, Sudan, Iraq and Jordan.
 * Everyone else (Saudi Arabia, the Gulf and the rest) who pays in pounds gets:
 *   riyal price × SAR rate (finance_exchange_rates), rounded to the nearest 50 pounds.
 * Plain module (no "use server"), safe to import from the server and the browser.
 */

const EGYPT_NAMES = ["egypt", "مصر", "جمهورية مصر العربية"];

/** Calling codes that make a phone clearly non-Egyptian. */
const FOREIGN_CODES = [
  "966", "971", "965", "974", "973", "968", "964", "962", "961", "963", "967", "970", "972",
  "218", "249", "212", "213", "216", "222", "252", "253", "211", "234", "233", "254", "255",
  "90", "91", "92", "44", "49", "33", "39", "34", "31", "7", "86",
];

export function isEgyptCountry(country: unknown) {
  return EGYPT_NAMES.includes(String(country ?? "").trim().toLowerCase());
}

/**
 * Phone "near" an Egyptian number (typos and missing digits are fine).
 * Only a clear foreign number counts against it: a foreign calling code (+966 …)
 * or a local number that is not 01… / 02… (e.g. 05… Gulf mobiles).
 */
export function isEgyptianLikePhone(phone: unknown) {
  const raw = String(phone ?? "").trim();
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return true; // no phone → decided by the country
  const international = raw.startsWith("+") || digits.startsWith("00");
  const d = digits.replace(/^00/, "");
  if (d.startsWith("20") || d.startsWith("020")) return true;
  if (international) return !FOREIGN_CODES.some((code) => d.startsWith(code));
  if (d.startsWith("0")) return /^0[12]/.test(d);
  if (d.startsWith("1")) return true; // 10xxxxxxxx (leading 0 missing)
  return !FOREIGN_CODES.some((code) => d.startsWith(code));
}

/** Countries that also see the regular Egyptian-pound list (not the riyal-converted pound). */
const EGP_LIST_COUNTRIES = [
  "libya", "ليبيا", "ly",
  "yemen", "اليمن", "ye",
  "sudan", "السودان", "sd",
  "iraq", "العراق", "iq",
  "jordan", "الأردن", "الاردن", "jo",
];
/** Calling codes of those countries (used only when the country is blank). */
const EGP_LIST_PHONE_CODES = ["218", "967", "249", "964", "962"];

export function isEgpListCountry(country: unknown) {
  return EGP_LIST_COUNTRIES.includes(String(country ?? "").trim().toLowerCase());
}

function hasEgpListPhoneCode(phone: unknown) {
  const raw = String(phone ?? "").trim();
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits || !(raw.startsWith("+") || digits.startsWith("00"))) return false;
  const d = digits.replace(/^00/, "");
  return EGP_LIST_PHONE_CODES.some((code) => d.startsWith(code));
}

/**
 * Sees the regular Egyptian-pound price list: lives in Egypt, or comes from Libya / Yemen /
 * Sudan / Iraq / Jordan. (Name kept: it is used by the chat, list prices and the students table.)
 */
export function isEgyptResident(country: unknown, phone: unknown) {
  if (isEgpListCountry(country)) return true;
  if (!String(country ?? "").trim() && hasEgpListPhoneCode(phone)) return true;
  return isEgyptCountry(country) && isEgyptianLikePhone(phone);
}

/** Riyal amount shown in pounds: × rate, rounded to the nearest 50. */
export function egpFromSar(amount: number, rate: number) {
  return Math.round((amount * rate) / 50) * 50;
}

export const STUDENT_CURRENCIES = ["EGP", "SAR", "USD"] as const;
export const CURRENCY_NAME_AR: Record<string, string> = { EGP: "جنيه مصري", SAR: "ريال سعودي", USD: "دولار" };
