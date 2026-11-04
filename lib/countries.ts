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
  "Lebanon",
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

/** Job titles in the registration / profile list. Any other value = a job the student typed ("Other"). */
export const KNOWN_JOBS = ["Student", "Engineer", "Consultant", "Project Manager", "Trainer"];

/** Value for the job <select>: a known job, "Other" for a typed one, or "". */
export function jobSelectValue(job: string) {
  if (!job) return "";
  return KNOWN_JOBS.includes(job) ? job : "Other";
}

/** Text in the "write your job" box (empty while only "Other" is chosen). */
export function typedJob(job: string) {
  return job && job !== "Other" && !KNOWN_JOBS.includes(job) ? job : "";
}
