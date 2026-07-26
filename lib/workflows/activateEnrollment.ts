import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/actions/enroll";

type WorkflowSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type EnrollmentRecord = {
  id: string;
  user_id: string;
  course_id: string;
  journey_type: string | null;
  action_title: string | null;
  journey_title: string | null;
  course_title: string | null;
  station_title: string | null;
  station_slug: string | null;
  status: EnrollmentStatus;
};

export interface ActivateEnrollmentWorkflowResult {
  success: boolean;
  message?: string;
  warning?: string;
}

/**
 * Notification creation is handled inside Supabase by the database trigger
 * public.notify_enrollment_activated().
 *
 * Keeping notification creation in the database guarantees that every real
 * transition to "active" creates the student notification, regardless of
 * which admin screen or server action approved the enrollment.
 */
export async function activateEnrollmentWorkflow(
  supabase: WorkflowSupabaseClient,
  enrollmentId: string,
): Promise<ActivateEnrollmentWorkflowResult> {
  if (!enrollmentId) {
    return {
      success: false,
      message: "رقم طلب الاشتراك غير موجود.",
    };
  }

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id,user_id,course_id,journey_type,journey_title,course_title,station_title,station_slug,action_title,status")
    .eq("id", enrollmentId)
    .single();

  if (enrollmentError || !enrollmentData) {
    return {
      success: false,
      message:
        enrollmentError?.message ?? "تعذر العثور على طلب الاشتراك.",
    };
  }

  const enrollment = enrollmentData as EnrollmentRecord;

  if (enrollment.status === "active") {
    return {
      success: true,
      message: "طلب الاشتراك معتمد بالفعل.",
    };
  }

  const { error: updateError } = await supabase
    .from("enrollments")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  return {
    success: true,
    message: "تم اعتماد طلب الاشتراك بنجاح.",
  };
}