import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { getStudentRegistrationInfo } from "@/lib/students/registration-info";
import type { PathSlug, Review } from "@/data/types";

type CourseReviewRow = {
  id: string;
  user_id: string | null;
  rating: number | string | null;
  comment: string | null;
  submitted_at: string | null;

  student_name: string | null;
  student_job_title: string | null;
  student_country: string | null;
};

type CourseReviewProfileRow = {
  id: string;
  full_name: string | null;
  country: string | null;
};

export async function loadPublishedCourseReviews(
  courseId: string,
  pathSlug: PathSlug,
  courseSlug: string,
): Promise<Review[]> {
  const supabase = createAdminClient();

  /*
   * أولًا:
   * قراءة التقييمات المنشورة لهذا الكورس.
   *
   * لا نستخدم profiles(...) هنا لأن student_surveys.user_id
   * ليس Foreign Key مباشرًا إلى profiles.id.
   */
  const { data, error } = await supabase
    .from("student_surveys")
    .select(`
      id,
      user_id,
      rating,
      comment,
      submitted_at,
      student_name,
      student_job_title,
      student_country
    `)
    .eq("course_id", courseId)
    .eq("show_on_course", true)
    .eq("status", "approved")
    .order("submitted_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load published course reviews:",
      error.message,
    );

    return [];
  }

  const rows =
    (data ?? []) as CourseReviewRow[];

  /*
   * ثانيًا:
   * نجمع الحسابات المسجلة المرتبطة بالتقييمات.
   */
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter(
          (id): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    ),
  );

  let profileRows: CourseReviewProfileRow[] = [];

  if (userIds.length > 0) {
    const {
      data: profilesData,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select(`
  id,
  full_name,
  country
`)
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Failed to load review profiles:",
        profilesError.message,
      );
    } else {
      profileRows =
        (profilesData ?? []) as CourseReviewProfileRow[];
    }
  }

  const profilesMap = new Map(
    profileRows.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  /*
   * ثالثًا:
   * إذا كان التقييم مربوطًا بحساب حقيقي،
   * نعطي بيانات الحساب الأولوية.
   *
   * وإذا كان الطالب مستوردًا ولم يسجل بعد،
   * نستخدم البيانات المحفوظة في student_surveys.
   */
  const registrationInfo =
    await getStudentRegistrationInfo(userIds);

  return rows
    .filter(
      (row) =>
        Number(row.rating ?? 0) > 0,
    )
    .map((row, index) => {
      const profile = row.user_id
        ? profilesMap.get(row.user_id)
        : undefined;

      return {
        id: index + 1,

        studentName:
          profile?.full_name?.trim() ||
          row.student_name?.trim() ||
          "أحد متدربي Masar Makers",

        studentNameEn: row.user_id
          ? registrationInfo.get(row.user_id)?.nameEn || ""
          : "",

        studentRole:
  row.student_job_title?.trim() ||
  (row.user_id
    ? registrationInfo.get(row.user_id)?.jobTitle
    : "") ||
  "",

        country:
          profile?.country?.trim() ||
          row.student_country?.trim() ||
          "",

        pathSlug,
        courseSlug,

        rating: Math.max(
          1,
          Math.min(
            5,
            Math.round(
              Number(row.rating ?? 0),
            ),
          ),
        ),

        review:
          row.comment?.trim() || "",

        approved: true,
        featured: false,

        createdAt:
          row.submitted_at ??
          new Date().toISOString(),
      };
    });
}

