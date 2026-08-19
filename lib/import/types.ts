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

  /*
   * Progress imported from Excel.
   *
   * - progress: Single / normal course progress.
   * - fundamentalsProgress / advancedProgress:
   *   independent progress for Split courses.
   *
   * null means the Excel cell was left blank.
   */
  progress: number | null;
  fundamentalsProgress: number | null;
  advancedProgress: number | null;

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