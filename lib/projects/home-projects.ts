"use server";

import {
  createAdminClient,
} from "@/lib/supabase/server";

export type HomeProjectCategory =
  | "Civil 3D"
  | "CSD"
  | "Deliverables"
  | "Vehicle Tracking"
  | "BIM";

export type HomeProject = {
  id: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  category: HomeProjectCategory;
  student: string;
  country: string;
  software: string;
  featured: boolean;
  video: boolean;
  projectLink: string | null;
};

type ProjectImageRow = {
  image_url: string | null;
  storage_path: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type ProjectRow = {
  user_id: string | null;
  id: string;
  project_title: string;
  project_description: string | null;
  project_link: string | null;
  student_name: string | null;
  student_country: string | null;
  featured: boolean | null;
  cover_image: string | null;
  project_images: unknown;
  course_title: string | null;
  course_id: string;
  student_project_images: ProjectImageRow[] | null;
};

function getProjectCategory(
  courseCode: string | null,
  courseTitle: string | null,
): HomeProjectCategory {
  const value = `${courseCode ?? ""} ${
    courseTitle ?? ""
  }`.toLowerCase();

  if (
    value.includes("csd") ||
    value.includes("civil site")
  ) {
    return "CSD";
  }

  if (
    value.includes("bim") ||
    value.includes("navisworks")
  ) {
    return "BIM";
  }

  if (
    value.includes("vehicle") ||
    value.includes("tracking")
  ) {
    return "Vehicle Tracking";
  }

  if (
    value.includes("deliver") ||
    value.includes("sheet") ||
    value.includes("spd")
  ) {
    return "Deliverables";
  }

  return "Civil 3D";
}

async function getProjectImageUrl(
  storagePath: string | null,
  imageUrl: string | null,
) {
  const normalizedStoragePath =
    storagePath?.trim() || "";

  const normalizedImageUrl =
    imageUrl?.trim() || "";

  if (
    normalizedStoragePath.startsWith("/") ||
    normalizedStoragePath.startsWith("http://") ||
    normalizedStoragePath.startsWith("https://")
  ) {
    return normalizedStoragePath;
  }

  if (
    normalizedImageUrl.startsWith("/") ||
    normalizedImageUrl.startsWith("http://") ||
    normalizedImageUrl.startsWith("https://")
  ) {
    return normalizedImageUrl;
  }

  if (!normalizedStoragePath) {
    return normalizedImageUrl;
  }

 const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("student-projects")
    .createSignedUrl(
      normalizedStoragePath,
      60 * 60,
    );

  if (error) {
    console.error(
      "PROJECT IMAGE SIGNED URL ERROR:",
      error.message,
    );

    return normalizedImageUrl;
  }

  return data?.signedUrl ?? normalizedImageUrl;
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

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);

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
    return normalizedValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function getHomeProjects(): Promise<
  HomeProject[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("student_projects")
    .select(`
      user_id,
      id,
      project_title,
      project_description,
      project_link,
      student_name,
      student_country,
      featured,
      cover_image,
      project_images,
      course_id,
course_title,
student_project_images(
        image_url,
        storage_path,
        is_cover,
        sort_order
      )
    `)
    .eq("status", "approved")
    .eq("show_on_home", true)
    .order("featured", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(12);

  if (error) {
    console.error(
      "GET HOME PROJECTS ERROR:",
      error.message,
    );

    return [];
  }
console.log(
  "HOME PROJECTS RAW DATA:",
  JSON.stringify(data, null, 2),
);
const courseIds = Array.from(
  new Set(
    (data ?? [])
      .map((row) => String(row.course_id ?? ""))
      .filter(Boolean),
  ),
);

const { data: courseRows, error: coursesError } =
  courseIds.length > 0
    ? await supabase
        .from("courses")
        .select("id,course_code,title")
        .in("id", courseIds)
    : {
        data: [],
        error: null,
      };

if (coursesError) {
  console.error(
    "GET HOME PROJECT COURSES ERROR:",
    coursesError.message,
  );
}

const courseById = new Map(
  (courseRows ?? []).map((course) => [
    String(course.id),
    {
      courseCode:
        typeof course.course_code === "string"
          ? course.course_code
          : null,
      courseTitle:
        typeof course.title === "string"
          ? course.title
          : null,
    },
  ]),
);
const userIds = Array.from(
  new Set(
    (data ?? [])
      .map((row) => row.user_id)
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
  const projects: HomeProject[] = [];

  for (const rawRow of data ?? []) {
    const row = rawRow as ProjectRow;

    const uploadedImages = [
  ...(row.student_project_images ?? []),
].sort(
  (first, second) =>
    (first.sort_order ?? 0) -
    (second.sort_order ?? 0),
);

const uploadedCoverImage =
  uploadedImages.find(
    (image) => image.is_cover,
  ) ??
  uploadedImages[0] ??
  null;

const importedImages =
  normalizeImportedProjectImages(
    row.project_images,
  );
const uploadedImageUrls = (
  await Promise.all(
    uploadedImages.map((uploadedImage) =>
      getProjectImageUrl(
        uploadedImage.storage_path,
        uploadedImage.image_url,
      ),
    ),
  )
).filter(Boolean);

const allProjectImages = Array.from(
  new Set([
    ...uploadedImageUrls,
    ...importedImages,
  ]),
);
const importedCoverImage =
  row.cover_image?.trim() ||
  importedImages[0] ||
  null;

const selectedStoragePath =
  uploadedCoverImage?.storage_path ?? null;

const selectedPublicImage =
  uploadedCoverImage?.image_url ??
  importedCoverImage;

const image = await getProjectImageUrl(
  selectedStoragePath,
  selectedPublicImage,
);

    if (!image) {
      continue;
    }
    const courseData =
  courseById.get(String(row.course_id)) ??
  null;

const courseCode =
  courseData?.courseCode?.trim() ?? null;

const courseTitle =
  courseData?.courseTitle?.trim() ||
  row.course_title?.trim() ||
  null;

    const category = getProjectCategory(
      courseCode,
      courseTitle,
    );

    projects.push({
      id: row.id,
      title: row.project_title,
      description:
        row.project_description?.trim() ||
        "مشروع تطبيقي من تنفيذ أحد طلاب Masar Makers.",
      image,
      images:
  allProjectImages.length > 0
    ? allProjectImages
    : [image],
      category,
      student:
        row.student_name?.trim() ||
        "أحد طلاب Masar Makers",
      country:
  countryByUserId.get(
    String(row.user_id ?? ""),
  )?.trim() ||
  (
    row.student_country?.trim() &&
    row.student_country
      .trim()
      .toLowerCase() !== "masar makers"
      ? row.student_country.trim()
      : ""
  ),
      software:
        courseTitle ||
        courseCode ||
        category,
      featured: Boolean(row.featured),
      video: false,
      projectLink: row.project_link,
    });
  }
console.log(
  "HOME PROJECTS FINAL DATA:",
  JSON.stringify(projects, null, 2),
);
  return projects;
}