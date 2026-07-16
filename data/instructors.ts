import type {
  Instructor,
} from "@/data/types";

export type {
  Instructor,
} from "@/data/types";

export const instructors: Instructor[] = [
  {
    id: "mona-abdallah",

    name: "م. منى عبدالله",
    title: "مهندسة طرق ومدربة متخصصة",

    bio:
      "مهندسة طرق ومدربة متخصصة في تصميم الطرق، Civil 3D، Civil Site Design، إخراج المشاريع وBIM للطرق.",

    image:
      "/images/instructors/mona-abdallah.jpg",

    specialties: [
      "Civil 3D",
      "Civil Site Design",
      "Project Deliverables",
      "Vehicle Tracking",
      "BIM for Roads",
    ],

    countries: [
      "السعودية",
      "مصر",
    ],

    active: true,
  },
];

export function getInstructorById(
  id: string
) {
  return instructors.find(
    (instructor) =>
      instructor.id === id &&
      instructor.active
  );
}