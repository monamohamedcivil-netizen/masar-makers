
import { JOURNEY_CODES } from "./journey-codes";

type Input = {
  courseCode: string;
  journeyType: string;
  year: number;
  masarId: number;
  trackNumber: number;
  stationNumber: number;
  journeyNumber: number;
};

export function generateCertificateNumber({
  courseCode,
  journeyType,
  year,
  masarId,
  trackNumber,
  stationNumber,
  journeyNumber,
}: Input) {
 

  const journeyCode =
    JOURNEY_CODES[
      journeyType.toLowerCase() as keyof typeof JOURNEY_CODES
    ] ?? "X";

  const numericCode =
  masarId.toString().padStart(5, "0") +
    trackNumber.toString().padStart(2, "0") +
    stationNumber.toString().padStart(2, "0") +
    journeyNumber.toString().padStart(2, "0");

  return [
    "MM",
    courseCode,
    journeyCode,
    year,
    numericCode,
  ].join("-");
}