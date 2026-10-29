/** Course logo (public/images/courses/icons) by course code. */
const ICONS: Record<string, string> = {
  C3D: "civil3d",
  CSD: "csd",
  SPD: "spd",
  VT: "vehicle-tracking",
  BIM: "bim-roads",
  CUBE: "cube",
  SID: "sidra",
  SIDRA: "sidra",
  SYN: "synchro",
  VIS: "vissim",
  VISSIM: "vissim",
  VISUM: "visum",
};

export function courseIcon(code: string | null | undefined) {
  const file = ICONS[String(code ?? "").trim().toUpperCase()];
  return file ? `/images/courses/icons/${file}.png` : null;
}
