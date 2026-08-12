"use server";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

export type AdminProjectImage = {
  id: string;
  imageUrl: string;
  storagePath: string | null;
  publicPath: string | null;
  isImported: boolean;
  isCover: boolean;
  showInCourse: boolean;
  sortOrder: number;
};

export type AdminCourseProject = {
  id: string;
  userId: string | null;
  courseId: string;
  studentName: string | null;
  studentEmail: string | null;
  projectTitle: string;
  projectDescription: string | null;
  projectLink: string | null;
  status: string;
  showOnCourse: boolean;
  showOnHome: boolean;
  featured: boolean;
  coverImage: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  images: AdminProjectImage[];
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !["admin", "super_admin"].includes(
      String(profile.role),
    )
  ) {
    throw new Error("ليس لديك صلاحية.");
  }

  return {
    supabase,
    user,
  };
}

async function createProjectImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string | null,
  imageUrl: string | null,
) {
  if (storagePath) {
    const { data } = await supabase.storage
      .from("student-projects")
      .createSignedUrl(storagePath, 60 * 60);

    if (data?.signedUrl) {
      return data.signedUrl;
    }
  }

  return imageUrl?.trim() || "";
}

export async function getAdminCourseProjects(
  courseId: string,
): Promise<{
  success: boolean;
  message: string;
  data: AdminCourseProject[];
}> {
  try {
    const normalizedCourseId = courseId?.trim();

    if (!normalizedCourseId) {
      return {
        success: false,
        message: "رقم الكورس غير موجود.",
        data: [],
      };
    }

    await requireAdmin();

const supabase = createAdminClient();

    const { data: projectsData, error: projectsError } =
      await supabase
        .from("student_projects")
        .select(`
  id,
  user_id,
  course_id,
  student_name,
  student_email,
  project_title,
  project_description,
  project_link,
  project_images,
  cover_image,
  status,
  show_on_course,
  show_on_home,
  featured,
  submitted_at,
  reviewed_at,
  admin_notes
`)
        .eq("course_id", normalizedCourseId)
        .order("submitted_at", {
          ascending: false,
        });

    if (projectsError) {
      return {
        success: false,
        message: projectsError.message,
        data: [],
      };
    }

    const projectRows = projectsData ?? [];

    if (projectRows.length === 0) {
      return {
        success: true,
        message: "لا توجد مشاريع لهذا الكورس.",
        data: [],
      };
    }

    const projectIds = projectRows.map(
      (project) => project.id,
    );

    const { data: imagesData, error: imagesError } =
      await supabase
        .from("student_project_images")
        .select(`
          id,
          project_id,
          image_url,
          storage_path,
          is_cover,
          show_in_course,
          sort_order
        `)
        .in("project_id", projectIds)
        .order("sort_order", {
          ascending: true,
        });

    if (imagesError) {
      return {
        success: false,
        message: imagesError.message,
        data: [],
      };
    }

    const imagesByProjectId = new Map<
      string,
      AdminProjectImage[]
    >();

    for (const image of imagesData ?? []) {
      const imageUrl = await createProjectImageUrl(
        supabase,
        image.storage_path,
        image.image_url,
      );

      const mappedImage: AdminProjectImage = {
  id: image.id,
  imageUrl,
  storagePath: image.storage_path,
  publicPath: null,
  isImported: false,
  isCover: Boolean(image.is_cover),
  showInCourse: Boolean(
    image.show_in_course,
  ),
  sortOrder: Number(image.sort_order ?? 0),
};

      const projectImages =
        imagesByProjectId.get(image.project_id) ?? [];

      projectImages.push(mappedImage);

      imagesByProjectId.set(
        image.project_id,
        projectImages,
      );
    }
function normalizeImportedImages(
  value: unknown,
): string[] {
  let values: unknown[] = [];

  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);

      values = Array.isArray(parsedValue)
        ? parsedValue
        : trimmedValue.split(",");
    } catch {
      values = trimmedValue.split(",");
    }
  }

  return values
    .filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0,
    )
    .map((item) => {
      const path = item.trim().replace(/\\/g, "/");

      if (
        path.startsWith("http://") ||
        path.startsWith("https://") ||
        path.startsWith("/")
      ) {
        return path;
      }

      return `/images/student-projects/${path}`;
    });
}
    const projects: AdminCourseProject[] =
  projectRows.map((project) => {
    const uploadedImages =
      imagesByProjectId.get(project.id) ?? [];

    const importedPaths =
      normalizeImportedImages(
        project.project_images,
      );

    if (
      importedPaths.length === 0 &&
      uploadedImages.length === 0 &&
      project.cover_image?.trim()
    ) {
      importedPaths.push(
        project.cover_image.trim(),
      );
    }

    const normalizedCoverImage =
  project.cover_image?.trim().replace(/\\/g, "/") ||
  null;

const importedImages: AdminProjectImage[] =
  importedPaths.map((publicPath, index) => ({
    id: `imported:${project.id}:${index}`,
    imageUrl: publicPath,
    storagePath: null,
    publicPath,
    isImported: true,
    isCover:
      publicPath === normalizedCoverImage ||
      (index === 0 &&
        uploadedImages.length === 0),
    showInCourse: true,
    sortOrder:
      uploadedImages.length + index,
  }));
    return {
      id: project.id,
      userId: project.user_id,
      courseId: project.course_id,
      studentName: project.student_name,
      studentEmail: project.student_email,
      projectTitle: project.project_title,
      projectDescription:
        project.project_description,
      projectLink: project.project_link,
      status: project.status,
      showOnCourse: Boolean(
        project.show_on_course,
      ),
      showOnHome: Boolean(
        project.show_on_home,
      ),
      featured: Boolean(project.featured),
      coverImage: project.cover_image,
      submittedAt: project.submitted_at,
      reviewedAt: project.reviewed_at,
      adminNotes: project.admin_notes,
      images: [
        ...uploadedImages,
        ...importedImages,
      ],
    };
  });

return {
  success: true,
  message: "تم تحميل المشاريع.",
  data: projects,
};
} catch (error) {
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "تعذر تحميل المشاريع.",
    data: [],
  };
}
}
export async function updateCourseProject(
  projectId: string,
  values: {
  status?: string;
  showOnCourse?: boolean;
  showOnHome?: boolean;
  featured?: boolean;
  coverImageId?: string;
  coverImagePath?: string;
},
) {
  try {
    const normalizedProjectId = projectId.trim();

   const { user } = await requireAdmin();

const supabase = createAdminClient();
    const updateData: Record<string, unknown> = {
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    if (values.status !== undefined) {
      updateData.status = values.status;
    }

    if (values.showOnCourse !== undefined) {
      updateData.show_on_course =
        values.showOnCourse;
    }

    if (values.showOnHome !== undefined) {
      updateData.show_on_home =
        values.showOnHome;
    }

    if (values.featured !== undefined) {
      updateData.featured =
        values.featured;
    }

    await supabase
      .from("student_projects")
      .update(updateData)
      .eq("id", normalizedProjectId);

    if (values.coverImageId) {
      await supabase
        .from("student_project_images")
        .update({
          is_cover: false,
        })
        .eq(
          "project_id",
          normalizedProjectId,
        );

      await supabase
        .from("student_project_images")
        .update({
          is_cover: true,
          show_in_course: true,
        })
        .eq("id", values.coverImageId);

      const { data: cover } =
        await supabase
          .from("student_project_images")
          .select("storage_path")
          .eq("id", values.coverImageId)
          .single();

      await supabase
        .from("student_projects")
        .update({
          cover_image:
            cover?.storage_path ?? null,
        })
        .eq("id", normalizedProjectId);
    }
if (values.coverImagePath) {
  await supabase
    .from("student_project_images")
    .update({
      is_cover: false,
    })
    .eq(
      "project_id",
      normalizedProjectId,
    );

  await supabase
    .from("student_projects")
    .update({
      cover_image:
        values.coverImagePath,
    })
    .eq("id", normalizedProjectId);
}
    return {
      success: true,
      message: "تم حفظ المشروع.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر الحفظ.",
    };
  }
}