export type StudentImportOperation =
  | "Insert"
  | "Update";

export interface StudentImportRow {
  studentName: string;
  studentNameEn: string;
  studentEmail: string;

  jobTitle: string;
  country: string;

  courseCode: string;
  journeyType: string;

  certificateType: string;

  rating: number;
  generalReview: string;

  detailedSurveyCompleted: boolean;

  showReviewHome: boolean;
  showReviewCourse: boolean;

  projectTitle: string;
  projectDescription: string;
  projectImages: string[];

  showProjectHome: boolean;
  showProjectCourse: boolean;

  importSource: string;

  operation: StudentImportOperation;
}