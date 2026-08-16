"use server";

import { revalidatePath } from "next/cache";
import type {
  StudentProject,
  StudentProjectImage,
  ProjectStatus,
} from "./types";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";
type ProjectRow = {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  course_id: string;
  course_title: string | null;
  student_name: string | null;
  student_country: string | null;
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
studentCountry: row.student_country,
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
const userIds = Array.from(
  new Set(
    projects
      .map((project) => project.user_id)
      .filter(
        (userId): userId is string =>
          typeof userId === "string" &&
          userId.length > 0,
      ),
  ),
);

const { data: profileRows } =
  userIds.length > 0
    ? await supabase
        .from("member_profiles")
        .select("user_id,country")
        .in("user_id", userIds)
    : {
        data: [],
      };

const countryByUserId = new Map(
  (profileRows ?? []).map((profile) => [
    String(profile.user_id),
    typeof profile.country === "string"
      ? profile.country.trim()
      : "",
  ]),
);
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
export async function getStudentProjectsByUserId(
  userId: string,
): Promise<StudentProject[]> {
  const supabase = createAdminClient();

  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return [];
  }

  const { data: projects, error } =
    await supabase
      .from("student_projects")
      .select("*")
      .eq("user_id", normalizedUserId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "GET ADMIN STUDENT PROJECTS ERROR:",
      error.message,
    );

    return [];
  }

  if (!projects?.length) {
    return [];
  }

  const result: StudentProject[] = [];

  for (const row of projects as ProjectRow[]) {
    const { data: images, error: imagesError } =
      await supabase
        .from("student_project_images")
        .select("*")
        .eq("project_id", row.id)
        .order("sort_order");

    if (imagesError) {
      console.error(
        "GET ADMIN STUDENT PROJECT IMAGES ERROR:",
        imagesError.message,
      );
    }

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
  courseIds: string[],
): Promise<StudentProject[]> {
  const supabase = createAdminClient();

  const { data: projects, error } =
    await supabase
      .from("student_projects")
      .select(`
        *,
        student_project_images(
          id,
          project_id,
          image_url,
          storage_path,
          is_cover,
          show_in_course,
          sort_order
        )
      `)
     .in("course_id", courseIds)
      .eq("status", "approved")
      .eq("show_on_course", true)
      .order("featured", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

  if (error || !projects) {
    if (error) {
      console.error(
        "GET COURSE PROJECTS ERROR:",
        error.message,
      );
    }

    return [];
  }
const userIds = Array.from(
  new Set(
    projects
      .map((project) => project.user_id)
      .filter(
        (userId): userId is string =>
          typeof userId === "string" &&
          userId.trim().length > 0,
      ),
  ),
);

const { data: profileRows, error: profilesError } =
  userIds.length > 0
    ? await supabase
        .from("member_profiles")
        .select("user_id,country")
        .in("user_id", userIds)
    : {
        data: [],
        error: null,
      };

if (profilesError) {
  console.error(
    "GET PROJECT STUDENT COUNTRIES ERROR:",
    profilesError.message,
  );
}

const countryByUserId = new Map<string, string>(
  (profileRows ?? []).map((profile) => [
    String(profile.user_id),
    typeof profile.country === "string"
      ? profile.country.trim()
      : "",
  ]),
);
  const result: StudentProject[] = [];

  for (const project of projects) {
    const uploadedImages = await Promise.all(
      (
        project.student_project_images ?? []
      ).map((image: ImageRow) =>
        mapImage(image),
      ),
    );

    const importedImages =
      normalizeImportedProjectImages(
        project.project_images,
      ).map((imageUrl, index) => ({
        id: `imported:${project.id}:${index}`,
        projectId: project.id,
        imageUrl,
        storagePath: null,
        isCover:
          imageUrl === project.cover_image ||
          (index === 0 &&
            uploadedImages.length === 0),
        showInCourse: true,
        sortOrder:
          uploadedImages.length + index,
      }));
const profileCountry =
  countryByUserId.get(
    String(project.user_id ?? ""),
  )?.trim() || "";

const storedProjectCountry =
  typeof project.student_country === "string"
    ? project.student_country.trim()
    : "";

const resolvedStudentCountry =
  profileCountry ||
  (
    storedProjectCountry &&
    storedProjectCountry.toLowerCase() !==
      "masar makers"
      ? storedProjectCountry
      : ""
  ) ||
  null;
    result.push(
      mapProject(
        {
  ...project,
  student_country: resolvedStudentCountry,
} as ProjectRow,
        [
          ...uploadedImages,
          ...importedImages,
        ],
      ),
    );
  }

  return result;
}
function normalizeImportedProjectImages(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0,
      )
      .map((item) => item.trim());
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0,
        )
        .map((item) => item.trim());
    }
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}