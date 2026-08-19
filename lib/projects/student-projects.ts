"use server";

import { revalidatePath } from "next/cache";

import type {
  ProjectStatus,
  StudentProject,
  StudentProjectImage,
} from "./types";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  user_id: string | null;
  enrollment_id: string | null;
  course_id: string;
  course_title: string | null;

  student_name: string | null;
  student_country: string | null;
  student_email: string | null;

  project_title: string;
  project_description: string | null;
  project_link: string | null;

  project_images?: unknown;
  cover_image?: string | null;

  status: ProjectStatus;
  admin_notes: string | null;

  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;

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

type ProfileRow = {
  id: string;
  full_name: string | null;
  country: string | null;
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

    /*
     * إذا كانت الصورة داخل Storage نستخدم signed URL.
     * وإذا كان السجل يحتوي image_url مباشرًا نستخدمه كـ fallback.
     */
    imageUrl:
      signedUrl ??
      row.image_url ??
      "",

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

    /*
     * StudentProject الحالي يتوقع string.
     * المشروع المستورد غير المرتبط قد تكون user_id = null،
     * لذلك نرجع نصًا فارغًا بدل كسر النوع.
     */
    userId:
      row.user_id ?? "",

    enrollmentId:
      row.enrollment_id,

    courseId:
      row.course_id,

    courseTitle:
      row.course_title,

    studentName:
      row.student_name,

    studentCountry:
      row.student_country,

    studentEmail:
      row.student_email,

    projectTitle:
      row.project_title,

    projectDescription:
      row.project_description,

    projectLink:
      row.project_link,

    status:
      row.status,

    adminNotes:
      row.admin_notes,

    submittedAt:
      row.submitted_at,

    reviewedAt:
      row.reviewed_at,

    reviewedBy:
      row.reviewed_by,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    images,
  };
}

async function requireUser() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized",
    );
  }

  return {
    supabase,
    user,
  };
}

async function getSignedImageUrl(
  storagePath: string | null,
) {
  if (!storagePath) {
    return null;
  }

  const supabase =
    await createClient();

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
      .map((item) =>
        item.trim(),
      );
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0,
        )
        .map((item) =>
          item.trim(),
        );
    }
  } catch {
    return value
      .split(",")
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);
  }

  return [];
}

function buildImportedProjectImages(
  project: {
    id: string;
    project_images?: unknown;
    cover_image?: string | null;
  },
  uploadedImages: StudentProjectImage[],
): StudentProjectImage[] {
  return normalizeImportedProjectImages(
    project.project_images,
  ).map((imageUrl, index) => ({
    id: `imported:${project.id}:${index}`,

    projectId:
      project.id,

    imageUrl,

    storagePath:
      null,

    isCover:
      imageUrl ===
        project.cover_image ||
      (
        index === 0 &&
        uploadedImages.length === 0
      ),

    showInCourse:
      true,

    sortOrder:
      uploadedImages.length +
      index,
  }));
}

function resolveProjectOwner(
  project: ProjectRow,
  profile?: ProfileRow,
) {
  const storedName =
    typeof project.student_name ===
    "string"
      ? project.student_name.trim()
      : "";

  const storedCountry =
    typeof project.student_country ===
    "string"
      ? project.student_country.trim()
      : "";

  return {
    studentName:
      profile?.full_name?.trim() ||
      storedName ||
      null,

    studentCountry:
      profile?.country?.trim() ||
      (
        storedCountry &&
        storedCountry.toLowerCase() !==
          "masar makers"
          ? storedCountry
          : ""
      ) ||
      null,
  };
}

/* ==================================================
   Student's own projects
================================================== */

export async function getStudentProjects(): Promise<
  StudentProject[]
> {
  const {
    supabase,
    user,
  } = await requireUser();

  const {
    data: projects,
    error,
  } = await supabase
    .from("student_projects")
    .select("*")
    .eq("user_id", user.id)
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    console.error(
      "GET STUDENT PROJECTS ERROR:",
      error.message,
    );

    return [];
  }

  if (!projects?.length) {
    return [];
  }

  /*
   * عند وجود حساب حقيقي، بيانات profiles
   * هي المصدر الأول للاسم والدولة.
   */
  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id,full_name,country",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "GET STUDENT PROJECT PROFILE ERROR:",
      profileError.message,
    );
  }

  const profile =
    (profileData ??
      null) as ProfileRow | null;

  const result: StudentProject[] =
    [];

  for (
    const rawProject of projects
  ) {
    const project =
      rawProject as ProjectRow;

    const {
      data: imageRows,
      error: imagesError,
    } = await supabase
      .from(
        "student_project_images",
      )
      .select("*")
      .eq(
        "project_id",
        project.id,
      )
      .order("sort_order");

    if (imagesError) {
      console.error(
        "GET STUDENT PROJECT IMAGES ERROR:",
        imagesError.message,
      );
    }

    const uploadedImages =
      await Promise.all(
        (imageRows ?? []).map(
          (image) =>
            mapImage(
              image as ImageRow,
            ),
        ),
      );

    /*
     * الاستيراد القديم/Excel يخزن روابط الصور
     * داخل student_projects.project_images،
     * وليس بالضرورة داخل student_project_images.
     */
    const importedImages =
      buildImportedProjectImages(
        project,
        uploadedImages,
      );

    const {
      studentName,
      studentCountry,
    } = resolveProjectOwner(
      project,
      profile ?? undefined,
    );

    result.push(
      mapProject(
        {
          ...project,
          student_name:
            studentName,
          student_country:
            studentCountry,
        },
        [
          ...uploadedImages,
          ...importedImages,
        ],
      ),
    );
  }

  return result;
}

/* ==================================================
   Admin: projects for a registered student
================================================== */

export async function getStudentProjectsByUserId(
  userId: string,
): Promise<StudentProject[]> {
  const supabase =
    createAdminClient();

  const normalizedUserId =
    userId.trim();

  if (!normalizedUserId) {
    return [];
  }

  const {
    data: projects,
    error,
  } = await supabase
    .from("student_projects")
    .select("*")
    .eq(
      "user_id",
      normalizedUserId,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

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

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id,full_name,country",
    )
    .eq(
      "id",
      normalizedUserId,
    )
    .maybeSingle();

  if (profileError) {
    console.error(
      "GET ADMIN PROJECT PROFILE ERROR:",
      profileError.message,
    );
  }

  const profile =
    (profileData ??
      null) as ProfileRow | null;

  const result: StudentProject[] =
    [];

  for (
    const rawProject of projects
  ) {
    const project =
      rawProject as ProjectRow;

    const {
      data: imageRows,
      error: imagesError,
    } = await supabase
      .from(
        "student_project_images",
      )
      .select("*")
      .eq(
        "project_id",
        project.id,
      )
      .order("sort_order");

    if (imagesError) {
      console.error(
        "GET ADMIN STUDENT PROJECT IMAGES ERROR:",
        imagesError.message,
      );
    }

    const uploadedImages =
      await Promise.all(
        (imageRows ?? []).map(
          (image) =>
            mapImage(
              image as ImageRow,
            ),
        ),
      );

    const importedImages =
      buildImportedProjectImages(
        project,
        uploadedImages,
      );

    const {
      studentName,
      studentCountry,
    } = resolveProjectOwner(
      project,
      profile ?? undefined,
    );

    result.push(
      mapProject(
        {
          ...project,
          student_name:
            studentName,
          student_country:
            studentCountry,
        },
        [
          ...uploadedImages,
          ...importedImages,
        ],
      ),
    );
  }

  return result;
}

/* ==================================================
   Delete own project
================================================== */

export async function deleteProject(
  projectId: string,
) {
  const {
    supabase,
    user,
  } = await requireUser();

  await supabase
    .from("student_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath(
    "/dashboard",
  );
}

/* ==================================================
   Public/course projects
================================================== */

export async function getCourseProjects(
  courseIds: string[],
): Promise<StudentProject[]> {
  const supabase =
    createAdminClient();

  if (!courseIds.length) {
    return [];
  }

  const {
    data: projects,
    error,
  } = await supabase
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
    .in(
      "course_id",
      courseIds,
    )
    .eq(
      "status",
      "approved",
    )
    .eq(
      "show_on_course",
      true,
    )
    .order(
      "featured",
      {
        ascending: false,
      },
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error || !projects) {
    if (error) {
      console.error(
        "GET COURSE PROJECTS ERROR:",
        error.message,
      );
    }

    return [];
  }

  /*
   * نفس منطق التقييمات:
   * نقرأ profiles باستعلام مستقل،
   * ثم نعطي الاسم والدولة الحقيقيين الأولوية.
   */
  const userIds =
    Array.from(
      new Set(
        projects
          .map(
            (project) =>
              project.user_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                "string" &&
              value.trim().length >
                0,
          ),
      ),
    );

  const {
    data: profileRows,
    error: profilesError,
  } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select(
            "id,full_name,country",
          )
          .in(
            "id",
            userIds,
          )
      : {
          data: [],
          error: null,
        };

  if (profilesError) {
    console.error(
      "GET COURSE PROJECT PROFILES ERROR:",
      profilesError.message,
    );
  }

  const profilesByUserId =
    new Map<string, ProfileRow>(
      (
        (profileRows ??
          []) as ProfileRow[]
      ).map(
        (profile) => [
          profile.id,
          profile,
        ],
      ),
    );

  const result: StudentProject[] =
    [];

  for (
    const rawProject of projects
  ) {
    const project =
      rawProject as ProjectRow & {
        student_project_images?: ImageRow[];
      };

    const uploadedImages =
      await Promise.all(
        (
          project.student_project_images ??
          []
        ).map((image) =>
          mapImage(image),
        ),
      );

    const importedImages =
      buildImportedProjectImages(
        project,
        uploadedImages,
      );

    const profile =
      project.user_id
        ? profilesByUserId.get(
            project.user_id,
          )
        : undefined;

    const {
      studentName,
      studentCountry,
    } = resolveProjectOwner(
      project,
      profile,
    );

    result.push(
      mapProject(
        {
          ...project,
          student_name:
            studentName,
          student_country:
            studentCountry,
        },
        [
          ...uploadedImages,
          ...importedImages,
        ],
      ),
    );
  }

  return result;
}