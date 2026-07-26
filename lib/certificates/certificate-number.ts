import { COURSE_CODES } from "./course-codes";
import { JOURNEY_CODES } from "./journey-codes";

type Input = {
  courseTitle: string;

  journeyType: string;

  year: number;

  masarId: number;

  trackNumber: number;

  stationNumber: number;

  journeyNumber: number;
};

export function generateCertificateNumber({
  courseTitle,
  journeyType,
  year,
  masarId,
  trackNumber,
  stationNumber,
  journeyNumber,
}: Input) {
  const courseCode =
    COURSE_CODES[courseTitle] ?? "GEN";

  const journeyCode =
    JOURNEY_CODES[
      journeyType.toLowerCase() as keyof typeof JOURNEY_CODES
    ] ?? "X";

  return [
    "MM",

    courseCode,

    journeyCode,

    year,

    masarId.toString().padStart(6, "0") +

      trackNumber.toString().padStart(2, "0") +

      stationNumber.toString().padStart(2, "0") +

      journeyNumber.toString().padStart(2, "0"),
  ].join("-");
}