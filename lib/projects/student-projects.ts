"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import type {
  StudentProject,
  StudentProjectImage,
  ProjectStatus,
} from "./types";

type ProjectRow = {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  course_id: string;
  course_title: string | null;
  student_name: string | null;
  student_email: string | null;
  project_title: string;
  project_description: string | null;
  project_link: string | null;
  status: ProjectStatus;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string |null;
  created_at: string;
  updated_at: string;
};

type ImageRow = {
  id: string;
  project_id: string;
  image_url: string;
  storage_path: string | null;
  is_cover: boolean;
  show_in_course: boolean;
  sort_order: number;
};

async function mapImage(
  row: ImageRow,
): Promise<StudentProjectImage> {
  const signedUrl =
    await getSignedImageUrl(
      row.storage_path,
    );

  return {
    id: row.id,

    projectId: row.project_id,

    imageUrl:
      signedUrl ?? "",

    storagePath:
      row.storage_path,

    isCover:
      row.is_cover,

    showInCourse:
      row.show_in_course,

    sortOrder:
      row.sort_order,
  };
}

function mapProject(
  row: ProjectRow,
  images: StudentProjectImage[],
): StudentProject {
  return {
    id: row.id,

    userId: row.user_id,

    enrollmentId: row.enrollment_id,

    courseId: row.course_id,

    courseTitle: row.course_title,

    studentName: row.student_name,

    studentEmail: row.student_email,

    projectTitle: row.project_title,

    projectDescription: row.project_description,

    projectLink: row.project_link,

    status: row.status,

    adminNotes: row.admin_notes,

    submittedAt: row.submitted_at,

    reviewedAt: row.reviewed_at,

    reviewedBy: row.reviewed_by,

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    images,
  };
}
async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    supabase,
    user,
  };
}
async function getSignedImageUrl(
  storagePath: string | null,
) {
  if (!storagePath) return null;

  const supabase = await createClient();

  const { data, error } =
    await supabase.storage
      .from("student-projects")
      .createSignedUrl(
        storagePath,
        60 * 60,
      );

  if (error) {
    return null;
  }

  return data.signedUrl;
}
export async function getStudentProjects() {
  const { supabase, user } = await requireUser();

  const { data: projects } = await supabase
    .from("student_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (!projects) return [];

  const result: StudentProject[] = [];

  for (const row of projects as ProjectRow[]) {
    const { data: images } = await supabase
      .from("student_project_images")
      .select("*")
      .eq("project_id", row.id)
      .order("sort_order");

   const mappedImages = await Promise.all(
  (images ?? []).map((image) =>
    mapImage(image as ImageRow),
  ),
);

result.push(
  mapProject(
    row,
    mappedImages,
  ),
);
  }

  return result;
}
export async function deleteProject(
  projectId: string,
) {
  const { supabase, user } =
    await requireUser();

  await supabase
    .from("student_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
export async function getCourseProjects(
  courseId: string,
) {
  const { supabase } =
    await requireUser();

  const { data: projects } =
    await supabase
      .from("student_projects")
      .select("*")
      .eq("course_id", courseId)
      .eq("status", "approved");

  return projects ?? [];
}