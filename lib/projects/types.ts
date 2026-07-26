export type ProjectStatus =
  | "pending"
  | "approved"
  | "rejected";

export type StudentProject = {
  id: string;

  userId: string;

  enrollmentId: string | null;

  courseId: string;

  courseTitle: string | null;

  studentName: string | null;

  studentEmail: string | null;

  projectTitle: string;

  projectDescription: string | null;

  projectLink: string | null;

  status: ProjectStatus;

  adminNotes: string | null;

  submittedAt: string;

  reviewedAt: string | null;

  reviewedBy: string | null;

  createdAt: string;

  updatedAt: string;

  images: StudentProjectImage[];
};

export type StudentProjectImage = {
  id: string;

  projectId: string;

  imageUrl: string;

  storagePath: string | null;

  isCover: boolean;

  showInCourse: boolean;

  sortOrder: number;
};