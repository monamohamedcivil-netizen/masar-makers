"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateCertificateNumber } from "@/lib/certificates";
import { sendCertificateEmail } from "@/lib/email/send-certificate-email";
const CERTIFICATE_JOURNEY_TYPES = [
  "fundamental",
  "advanced",
  "integrated",
] as const;

export type CertificateJourneyType =
  (typeof CERTIFICATE_JOURNEY_TYPES)[number];

export type CourseCertificateStudent = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  journeyId: string | null;
  journeyType: CertificateJourneyType;
  journeyTitle: string | null;
  actionKey: string | null;
  actionTitle: string | null;
  certificateStatus: string | null;
  certificateIssuedAt: string | null;
  certificateReadyAt: string | null;
  certificateId: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string | null;
};

export type GetCourseCertificateStudentsResult = {
  success: boolean;
  message: string;
  data?: CourseCertificateStudent[];
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  student_name: string | null;
  student_email: string | null;
  course_id: string;
  course_title: string | null;
  journey_id: string | null;
  journey_type: string | null;
  journey_title: string | null;
  action_key: string | null;
  action_title: string | null;
  certificate_status: string | null;
  certificate_issued_at: string | null;
  certificate_ready_at: string | null;
  certificate_id: string | null;
  progress_percent: number | string | null;
  completed_lessons: number | string | null;
  total_lessons: number | string | null;
  created_at: string | null;
};

/**
 * يتحقق من تسجيل دخول المستخدم ومن امتلاكه صلاحية الإدارة.
 */
async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    throw new Error("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  }

  return {
    supabase,
    user,
  };
}

/**
 * يتحقق من أن نوع الرحلة مؤهل للحصول على شهادة.
 *
 * الرحلات المؤهلة:
 * - fundamental
 * - advanced
 * - integrated
 *
 * الرحلات غير المؤهلة:
 * - workshop
 * - free
 */
function isCertificateJourneyType(
  value: string | null | undefined,
): value is CertificateJourneyType {
  return CERTIFICATE_JOURNEY_TYPES.includes(
    value as CertificateJourneyType,
  );
}

/**
 * يحول القيم الرقمية القادمة من Supabase إلى رقم آمن.
 */
function toSafeNumber(
  value: number | string | null | undefined,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

/**
 * يعيد اسمًا مناسبًا للطالب حتى لو كانت بيانات الاسم غير مكتملة.
 */
function getStudentDisplayName(row: EnrollmentRow): string {
  const studentName = row.student_name?.trim();

  if (studentName) {
    return studentName;
  }

  const studentEmail = row.student_email?.trim();

  if (studentEmail) {
    return studentEmail.split("@")[0] || "طالب";
  }

  return "طالب بدون اسم";
}

/**
 * يعيد البريد الإلكتروني بعد تنظيفه.
 */
function getStudentEmail(row: EnrollmentRow): string {
  return row.student_email?.trim() ?? "";
}

/**
 * يحول سجل الاشتراك إلى الشكل المطلوب في واجهة الشهادات.
 */
function mapEnrollmentToCertificateStudent(
  row: EnrollmentRow,
): CourseCertificateStudent | null {
  if (!isCertificateJourneyType(row.journey_type)) {
    return null;
  }

  return {
    enrollmentId: row.id,
    studentId: row.user_id,
    studentName: getStudentDisplayName(row),
    studentEmail: getStudentEmail(row),
    courseId: row.course_id,
    courseTitle: row.course_title?.trim() || "كورس بدون عنوان",
    journeyId: row.journey_id,
    journeyType: row.journey_type,
    journeyTitle: row.journey_title?.trim() || null,
    actionKey: row.action_key?.trim() || null,
    actionTitle: row.action_title?.trim() || null,
    certificateStatus: row.certificate_status,
    certificateIssuedAt: row.certificate_issued_at,
    certificateReadyAt: row.certificate_ready_at,
    certificateId: row.certificate_id,
    progressPercent: toSafeNumber(row.progress_percent),
    completedLessons: toSafeNumber(row.completed_lessons),
    totalLessons: toSafeNumber(row.total_lessons),
    enrolledAt: row.created_at,
  };
}

/**
 * يرتب الطلاب حسب الاسم، ثم نوع الرحلة، ثم تاريخ الاشتراك.
 *
 * لا نحذف الصفوف المتكررة بناءً على user_id + course_id،
 * لأن الطالب قد يمتلك اشتراك fundamental واشتراك advanced
 * لنفس الكورس، ولكل اشتراك شهادة مستقلة.
 */
function sortCertificateStudents(
  students: CourseCertificateStudent[],
): CourseCertificateStudent[] {
  const journeyOrder: Record<CertificateJourneyType, number> = {
    fundamental: 1,
    advanced: 2,
    integrated: 3,
  };

  return [...students].sort((first, second) => {
    const nameComparison = first.studentName.localeCompare(
      second.studentName,
      "ar",
      {
        sensitivity: "base",
      },
    );

    if (nameComparison !== 0) {
      return nameComparison;
    }

    const journeyComparison =
      journeyOrder[first.journeyType] -
      journeyOrder[second.journeyType];

    if (journeyComparison !== 0) {
      return journeyComparison;
    }

    const firstDate = first.enrolledAt
      ? new Date(first.enrolledAt).getTime()
      : 0;

    const secondDate = second.enrolledAt
      ? new Date(second.enrolledAt).getTime()
      : 0;

    return firstDate - secondDate;
  });
}

/**
 * يجلب الطلاب المشتركين اشتراكًا نشطًا في الكورس
 * والمؤهلين للحصول على شهادة.
 *
 * تعتمد الدالة على جدول enrollments لأنه يحتوي على:
 * - بيانات الطالب.
 * - بيانات الكورس.
 * - نوع الرحلة.
 * - حالة الشهادة.
 * - بيانات التقدم.
 *
 * كل صف في النتيجة يمثل اشتراكًا واحدًا وليس طالبًا واحدًا فقط.
 * لذلك يمكن أن يظهر الطالب مرتين بصورة صحيحة عندما يكون لديه:
 * - اشتراك fundamental.
 * - اشتراك advanced.
 */
export async function getCourseStudentsForCertificates(
  courseId: string,
): Promise<GetCourseCertificateStudentsResult> {
  try {
    const normalizedCourseId = courseId?.trim();

    if (!normalizedCourseId) {
      return {
        success: false,
        message: "رقم الكورس غير موجود.",
      };
    }

    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        user_id,
        student_name,
        student_email,
        course_id,
        course_title,
        journey_id,
        journey_type,
        journey_title,
        action_key,
        action_title,
        certificate_status,
        certificate_issued_at,
        certificate_ready_at,
        certificate_id,
        progress_percent,
        completed_lessons,
        total_lessons,
        created_at
      `)
      .eq("course_id", normalizedCourseId)
      .eq("status", "active")
      .in("journey_type", [...CERTIFICATE_JOURNEY_TYPES])
      .order("student_name", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "GET COURSE CERTIFICATE STUDENTS ERROR",
        error,
      );

      return {
        success: false,
        message: `تعذر تحميل طلاب الكورس: ${error.message}`,
      };
    }

    const rows = (data as EnrollmentRow[] | null) ?? [];

    const students = rows
      .map(mapEnrollmentToCertificateStudent)
      .filter(
        (
          student,
        ): student is CourseCertificateStudent =>
          student !== null,
      );

    const sortedStudents = sortCertificateStudents(students);

    return {
      success: true,
      message:
        sortedStudents.length > 0
          ? "تم تحميل طلاب الكورس بنجاح."
          : "لا يوجد طلاب مؤهلون لإصدار الشهادات في هذا الكورس.",
      data: sortedStudents,
    };
  } catch (error) {
    console.error(
      "GET COURSE CERTIFICATE STUDENTS UNEXPECTED ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء تحميل الطلاب.",
    };
  }
}

export type IssueCourseCertificateInput = {
  enrollmentId: string;
};

export type IssuedCourseCertificate = {
  certificateId: string;
  certificateNumber: string;
  issuedAt: string;
};

export type IssueCourseCertificateResult = {
  success: boolean;
  message: string;
  data?: IssuedCourseCertificate;
  warning?: string;
};

type IssueEnrollmentRow = EnrollmentRow & {
  status: string | null;
  student_name_en: string | null;
};

type CertificateSettingsRow = {
  certificate_enabled: boolean | null;
  template_id: string | null;
  display_title: string | null;
  training_hours: number | string | null;
  primary_color: string | null;
  secondary_color: string | null;
  course_logo_url: string | null;
  sponsor_logos: unknown;
};

type ExistingCertificateRow = {
  id: string;
  certificate_number: string;
  issued_at: string;
  status: string | null;
};

function createCertificateNumber(): string {
  const year = new Date().getUTCFullYear();
  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();

  return `MM-${year}-${randomPart}`;
}

async function createCertificateNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  courseTitle: string,
): Promise<string | null> {
  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .insert({
      title: "تم إصدار شهادتك",
      body: `تم إصدار شهادة ${courseTitle}. يمكنك الآن عرضها من شاشة شهاداتي.`,
      type: "achievement",
      action_url: "/dashboard?section=certificates",
    })
    .select("id")
    .single();

  if (notificationError || !notification?.id) {
    return (
      notificationError?.message ??
      "تعذر إنشاء إشعار إصدار الشهادة."
    );
  }

  const { error: recipientError } = await supabase
    .from("notification_recipients")
    .insert({
      notification_id: notification.id,
      user_id: studentId,
      is_read: false,
    });

  if (recipientError) {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id);

    return recipientError.message;
  }

  return null;
}

/**
 * يصدر شهادة لاشتراك محدد.
 *
 * التقدم الدراسي معلوماتي فقط ولا يمنع الإصدار اليدوي.
 * لا يتم إرسال البريد الإلكتروني في هذه المرحلة.
 */
export async function issueCourseCertificate(
  input: IssueCourseCertificateInput,
): Promise<IssueCourseCertificateResult> {
  try {
    const enrollmentId = input.enrollmentId?.trim();

    if (!enrollmentId) {
      return {
        success: false,
        message: "رقم اشتراك الطالب غير موجود.",
      };
    }

    const { supabase, user } = await requireAdmin();

    const { data: enrollmentData, error: enrollmentError } =
      await supabase
        .from("enrollments")
        .select(`
          id,
          user_id,
          student_name,
          student_name_en,
          student_email,
          course_id,
          course_title,
          journey_id,
          journey_type,
          journey_title,
          action_key,
          action_title,
          certificate_status,
          certificate_issued_at,
          certificate_ready_at,
          certificate_id,
          progress_percent,
          completed_lessons,
          total_lessons,
          created_at,
          status
        `)
        .eq("id", enrollmentId)
        .maybeSingle();

    if (enrollmentError) {
      return {
        success: false,
        message: `تعذر تحميل بيانات الاشتراك: ${enrollmentError.message}`,
      };
    }

    if (!enrollmentData) {
      return {
        success: false,
        message: "تعذر العثور على اشتراك الطالب.",
      };
    }

    const enrollment = enrollmentData as IssueEnrollmentRow;

    if (enrollment.status !== "active") {
      return {
        success: false,
        message: "لا يمكن إصدار شهادة لاشتراك غير نشط.",
      };
    }

    if (!isCertificateJourneyType(enrollment.journey_type)) {
      return {
        success: false,
        message: "نوع هذه الرحلة غير مؤهل للحصول على شهادة.",
      };
    }

    if (enrollment.certificate_id) {
      const { data: currentCertificate } = await supabase
        .from("certificates")
        .select("id,certificate_number,issued_at,status")
        .eq("id", enrollment.certificate_id)
        .maybeSingle();

      if (
        currentCertificate &&
        currentCertificate.status === "issued"
      ) {
        return {
          success: true,
          message: "الشهادة صادرة بالفعل لهذا الاشتراك.",
          data: {
            certificateId: currentCertificate.id,
            certificateNumber:
              currentCertificate.certificate_number,
            issuedAt: currentCertificate.issued_at,
          },
        };
      }
    }

    const { data: settingsData, error: settingsError } =
      await supabase
        .from("course_certificate_settings")
        .select(`
          certificate_enabled,
          template_id,
          display_title,
          training_hours,
          primary_color,
          secondary_color,
          course_logo_url,
          sponsor_logos
        `)
        .eq("course_id", enrollment.course_id)
        .maybeSingle();

    if (settingsError) {
      return {
        success: false,
        message: `تعذر تحميل إعدادات الشهادة: ${settingsError.message}`,
      };
    }

    const settings =
      (settingsData as CertificateSettingsRow | null) ?? null;

    if (
      !settings?.certificate_enabled ||
      !settings.template_id
    ) {
      return {
        success: false,
        message:
          "لا يوجد قالب شهادة محفوظ ومفعّل لهذا الكورس.",
      };
    }

    const studentName =
      enrollment.student_name_en?.trim() ||
      enrollment.student_name?.trim() ||
      enrollment.student_email?.split("@")[0] ||
      "Student";

    const courseTitle =
      settings.display_title?.trim() ||
      enrollment.action_title?.trim() ||
      enrollment.journey_title?.trim() ||
      enrollment.course_title?.trim() ||
      "Course Certificate";

    const issuedAt = new Date().toISOString();
   const { data: memberProfile, error: memberProfileError } = await supabase
  .from("member_profiles")
  .select("masar_id")
  .eq("user_id", enrollment.user_id)
  .single();

if (memberProfileError || !memberProfile) {
  return {
    success: false,
    message:
      "تعذر العثور على رقم العضوية (Masar ID) الخاص بالطالب.",
  };
} 
const certificateNumber = generateCertificateNumber({
 courseTitle,

  journeyType: enrollment.journey_type,

  year: new Date(issuedAt).getFullYear(),

  masarId: memberProfile.masar_id,

  trackNumber: 1,

  stationNumber: 2,

  journeyNumber:
    enrollment.journey_type === "fundamental"
      ? 1
      : enrollment.journey_type === "advanced"
        ? 2
        : 3,
});

const verificationCode = crypto.randomUUID();



   const certificatePayload = {
  user_id: enrollment.user_id,
  enrollment_id: enrollment.id,

  course_id: enrollment.course_id,

  template_id: settings.template_id,

  certificate_number: certificateNumber,

  student_name:
    enrollment.student_name?.trim() ?? "",

  student_name_en:
    enrollment.student_name_en?.trim() ??
    enrollment.student_name?.trim() ??
    "",

  course_title:
    enrollment.course_title?.trim() ?? "",

  course_title_en: courseTitle,

  certificate_type: enrollment.journey_type,

  issued_at: issuedAt,
  issue_date: issuedAt,

  status: "issued",

  issued_by: user.id,
verification_code: verificationCode,
  pdf_url: null,
 preview_url: null,

  pdf_storage_path: null,
  preview_storage_path: null,

  notification_status: "pending",
  email_status: "pending",

  metadata: {},
};

    const { data: certificateData, error: certificateError } =
      await supabase
        .from("certificates")
        .insert(certificatePayload)
        .select("id,certificate_number,issued_at,status")
        .single();

    if (certificateError || !certificateData) {
      const duplicateCertificate =
        certificateError?.code === "23505";

      return {
        success: false,
        message: duplicateCertificate
          ? "توجد شهادة صادرة بالفعل لهذا الطالب في هذا الكورس."
          : `تعذر إنشاء الشهادة: ${
              certificateError?.message ??
              "لم تُرجع قاعدة البيانات سجل الشهادة."
            }`,
      };
    }

    const certificate =
      certificateData as ExistingCertificateRow;

    const { error: updateEnrollmentError } = await supabase
      .from("enrollments")
      .update({
        certificate_status: "issued",
        certificate_id: certificate.id,
        certificate_issued_at: issuedAt,
        updated_at: issuedAt,
      })
      .eq("id", enrollment.id);

    if (updateEnrollmentError) {
      await supabase
        .from("certificates")
        .delete()
        .eq("id", certificate.id);

      return {
        success: false,
        message: `تعذر ربط الشهادة بالاشتراك: ${updateEnrollmentError.message}`,
      };
    }

    const notificationWarning =
      await createCertificateNotification(
        supabase,
        enrollment.user_id,
        courseTitle,
      );
let emailWarning: string | undefined;

try {

  await sendCertificateEmail({

    studentName:
      enrollment.student_name ??
      "Student",

    email:
      enrollment.student_email ?? "",

    certificateId:
      certificate.id,

    courseTitle,

  });

  await supabase

    .from("certificates")

    .update({

      email_status: "sent",

    })

    .eq("id", certificate.id);

} catch (error) {

  emailWarning =
    error instanceof Error
      ? error.message
      : "Email إرسال البريد فشل";

  await supabase

    .from("certificates")

    .update({

      email_status: "failed",

    })

    .eq("id", certificate.id);

}

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return {

  success: true,

  message:
    "تم إصدار الشهادة بنجاح.",

  warning:
    notificationWarning ??
    emailWarning,

  data: {

    certificateId:
      certificate.id,

    certificateNumber:
      certificate.certificate_number,

    issuedAt:
      certificate.issued_at,

  },

};
  } catch (error) {
    console.error("ISSUE COURSE CERTIFICATE ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إصدار الشهادة.",
    };
  }
}
