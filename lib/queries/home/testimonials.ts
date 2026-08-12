import { createAdminClient } from "@/lib/supabase/server";

export type HomeTestimonial = {
  id: string;
  studentName: string;
  jobTitle: string | null;
  country: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  rating: number;
  review: string;
  initials: string;
};

type SurveyRow = {
  id: string;
  user_id: string | null;
  student_name: string | null;
  student_job_title: string | null;
  student_country: string | null;
  rating: number | null;
  comment: string | null;
  course_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  slug: string | null;
};

export async function getHomeTestimonials(): Promise<
  HomeTestimonial[]
> {
  const supabase = createAdminClient();

  const { data: surveysData, error: surveysError } =
  await supabase
    .from("student_surveys")
    .select(`
      id,
      user_id,
      student_name,
      student_job_title,
      student_country,
      rating,
      comment,
      course_id
    `)
    // تفعيل الظهور من لوحة التحكم هو الموافقة النهائية للعرض،
    // سواء كان التقييم مرسلاً من المنصة أو مضافًا بالاستيراد.
    .eq("show_on_home", true)
    .not("comment", "is", null)
    .order("submitted_at", {
      ascending: false,
    });

  if (surveysError) {
    throw new Error(
      `student_surveys: ${surveysError.message}`
    );
  }

  const surveys = ((surveysData ?? []) as SurveyRow[]).filter(
    (survey) => Boolean(survey.comment?.trim())
  );

  if (surveys.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(
      surveys
        .map((survey) => survey.user_id)
        .filter(
          (userId): userId is string =>
            Boolean(userId)
        )
    )
  );

  const courseIds = Array.from(
    new Set(
      surveys
        .map((survey) => survey.course_id)
        .filter(Boolean)
    )
  );

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const {
      data: profilesData,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(
        `profiles: ${profilesError.message}`
      );
    }

    profiles =
      (profilesData ?? []) as ProfileRow[];
  }

  let courses: CourseRow[] = [];

  if (courseIds.length > 0) {
    const {
      data: coursesData,
      error: coursesError,
    } = await supabase
      .from("courses")
      .select("id, title, slug")
      .in("id", courseIds);

    if (coursesError) {
      throw new Error(
        `courses: ${coursesError.message}`
      );
    }

    courses =
      (coursesData ?? []) as CourseRow[];
  }

  const profileMap = new Map<
    string,
    ProfileRow
  >(
    profiles.map((profile) => [
      profile.id,
      profile,
    ])
  );

  const courseMap = new Map<string, CourseRow>(
    courses.map((course) => [
      course.id,
      course,
    ])
  );

  return surveys.map((survey) => {
    const profile = survey.user_id
      ? profileMap.get(survey.user_id)
      : undefined;

    const course = courseMap.get(
      survey.course_id
    );

    const name =
      profile?.full_name?.trim() ||
      survey.student_name?.trim() ||
      "متدرب في صناع المسار";

    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part.charAt(0))
        .join("") || "م";

   return {
      id: survey.id,
      studentName: name,
      jobTitle: survey.student_job_title,
      country: survey.student_country,
      courseId: survey.course_id,
      courseTitle: course?.title ?? "",
      courseSlug: course?.slug ?? "",
      rating: Number(survey.rating ?? 0),
      review: survey.comment ?? "",
      initials,
    };
  });
}