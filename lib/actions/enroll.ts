"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EnrollmentStatus =
  | "pending"
  | "active"
  | "rejected"
  | "expired"
  | "suspended";

type EnrollmentContactData = {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  whatsappNumber: string;
};

export async function getEnrollment(courseSlug: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (!course) return null;

  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  return data;
}

export async function requestEnrollment(
  courseSlug: string,
  stationId: string,
  journeyType: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false as const,
      message: "LOGIN_REQUIRED",
    };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, whatsapp_number")
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course) {
    return {
      success: false as const,
      message: "لم يتم العثور على الكورس في قاعدة البيانات.",
    };
  }

  const studentName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "طالب جديد";

  const studentEmail = user.email || "غير مسجل";
  const courseTitle = course.title || courseSlug;

  // الرقم الموجود داخل الكورس له الأولوية، ثم رقم عام من ملف البيئة.
  const whatsappNumber =
    course.whatsapp_number || process.env.WHATSAPP_NUMBER || "";

  const contactData: EnrollmentContactData = {
    studentName,
    studentEmail,
    courseTitle,
    whatsappNumber,
  };

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("station_id", stationId)
    .eq("course_id", course.id)
    .eq("journey_type", journeyType)
    .maybeSingle();

  if (existing) {
    return {
      success: true as const,
      enrollment: existing,
      ...contactData,
    };
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      station_id: stationId,
      course_id: course.id,
      journey_type: journeyType,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return {
      success: false as const,
      message: error.message,
    };
  }

  revalidatePath(`/course/${courseSlug}`);

  return {
    success: true as const,
    enrollment: data,
    ...contactData,
  };
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

export async function cancelEnrollment(courseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  revalidatePath(`/course/${courseId}`);
}