/** Countries in the registration / profile list. Any other value = a country the student typed ("Other"). */
export const KNOWN_COUNTRIES = [
  "Saudi Arabia",
  "Egypt",
  "United Arab Emirates",
  "Oman",
  "Iraq",
  "Libya",
  "Sudan",
  "Syria",
  "Nigeria",
];

/** Value for the country <select>: a known country, "Other" for a typed one, or "". */
export function countrySelectValue(country: string) {
  if (!country) return "";
  return KNOWN_COUNTRIES.includes(country) ? country : "Other";
}

/** Text in the "write your country" box (empty while only "Other" is chosen). */
export function typedCountry(country: string) {
  return country && country !== "Other" && !KNOWN_COUNTRIES.includes(country) ? country : "";
}
