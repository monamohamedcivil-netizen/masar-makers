import { createClient } from "@/lib/supabase/server";

export type AdminCourseSurvey = {
  id: string;

  userId: string | null;

  studentName: string;

  studentEmail: string;

  courseId: string;

  rating: number;

  comment: string | null;

  submittedAt: string | null;

  generalSurveyCompleted: boolean;

  generalSurveyCompletedAt: string | null;

  detailedSurveyCompleted: boolean;

  detailedSurveyCompletedAt: string | null;

  showOnHome: boolean;

  showOnCourse: boolean;

  source: string;

  sourceReference: string | null;

  status: string;

  editedByStudent: boolean;

  studentLastEditAt: string | null;
};

export async function getCourseSurveys(courseId: string) {
  const supabase = await createClient();

  const { data: surveys, error } = await supabase
    .from("student_surveys")
   .select(`
      id,
      user_id,
      student_name,
      student_email,
      course_id,

      rating,
      comment,
      submitted_at,

      general_survey_completed,
      general_survey_completed_at,

      detailed_survey_completed,
      detailed_survey_completed_at,

      show_on_home,
      show_on_course,

      source,
      source_reference,
      status,

      edited_by_student,
      student_last_edit_at
    `)
    .eq("course_id", courseId)
    .order("submitted_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const userIds = [...new Set((surveys ?? []).map((s) => s.user_id))];

  const { data: profiles } =
    userIds.length === 0
      ? { data: [] }
      : await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return (surveys ?? []).map((survey) => {
    const profile = profileMap.get(survey.user_id);

    return {
      id: survey.id,
      userId: survey.user_id,

   studentName:
  profile?.full_name ||
  survey.student_name ||
  "بدون اسم",

studentEmail:
  profile?.email ||
  survey.student_email ||
  "",

      courseId: survey.course_id,

      rating: Number(survey.rating ?? 0),

      comment: survey.comment,

      submittedAt: survey.submitted_at,
generalSurveyCompleted:
  survey.general_survey_completed ?? false,

generalSurveyCompletedAt:
  survey.general_survey_completed_at,
      detailedSurveyCompleted:
        survey.detailed_survey_completed ?? false,

      detailedSurveyCompletedAt:
        survey.detailed_survey_completed_at,

      showOnHome:
        survey.show_on_home ?? false,

      showOnCourse:
        survey.show_on_course ?? false,

        source:
  survey.source,

sourceReference:
  survey.source_reference,

status:
  survey.status,

editedByStudent:
  survey.edited_by_student ?? false,

studentLastEditAt:
  survey.student_last_edit_at,
    };
  }) satisfies AdminCourseSurvey[];
}