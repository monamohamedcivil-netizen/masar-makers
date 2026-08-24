"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateCertificateNumber } from "@/lib/certificates";
import { sendCertificateEmail } from "@/lib/email/send-certificate-email";
const CERTIFICATE_TYPES = [
  "fundamental",
  "advanced",
] as const;

export type CertificateType =
  (typeof CERTIFICATE_TYPES)[number];

export type CourseCertificateStudent = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  journeyId: string | null;
  certificateType: CertificateType;
  journeyType: CertificateType;
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

type StudentProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function applyProfileToEnrollment(
  row: EnrollmentRow,
  profile: StudentProfileRow | undefined,
): EnrollmentRow {
  return {
    ...row,
    student_name:
      profile?.full_name?.trim() ||
      row.student_name,
    student_email:
      profile?.email?.trim() ||
      row.student_email,
  };
}

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
const ELIGIBLE_ENROLLMENT_JOURNEY_TYPES = [
  "fundamental",
  "advanced",
  "integrated",
] as const;

type EligibleEnrollmentJourneyType =
  (typeof ELIGIBLE_ENROLLMENT_JOURNEY_TYPES)[number];

function isEligibleEnrollmentJourneyType(
  value: string | null | undefined,
): value is EligibleEnrollmentJourneyType {
  return ELIGIBLE_ENROLLMENT_JOURNEY_TYPES.includes(
    value as EligibleEnrollmentJourneyType,
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
function mapEnrollmentToCertificateStudents(
  row: EnrollmentRow,
  courseLevel: "single" | "split",
): CourseCertificateStudent[] {
  if (!isEligibleEnrollmentJourneyType(row.journey_type)) {
    return [];
  }

  let certificateTypes: CertificateType[];

  if (courseLevel === "single") {
    certificateTypes = ["advanced"];
  } else if (row.journey_type === "integrated") {
    certificateTypes = ["fundamental", "advanced"];
  } else {
    certificateTypes = [row.journey_type];
  }

  return certificateTypes.map((certificateType) => ({
    enrollmentId: row.id,
    studentId: row.user_id,
    studentName: getStudentDisplayName(row),
    studentEmail: getStudentEmail(row),
    courseId: row.course_id,
    courseTitle:
      row.course_title?.trim() || "كورس بدون عنوان",
    journeyId: row.journey_id,

    certificateType,
    journeyType: certificateType,

    journeyTitle: row.journey_title?.trim() || null,
    actionKey: row.action_key?.trim() || null,
    actionTitle: row.action_title?.trim() || null,

    certificateStatus: null,
    certificateIssuedAt: null,
    certificateReadyAt: row.certificate_ready_at,
    certificateId: null,

    progressPercent: toSafeNumber(row.progress_percent),
    completedLessons: toSafeNumber(row.completed_lessons),
    totalLessons: toSafeNumber(row.total_lessons),
    enrolledAt: row.created_at,
  }));
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
const certificateOrder: Record<CertificateType, number> = {
  fundamental: 1,
  advanced: 2,
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
      certificateOrder[first.certificateType] -
      certificateOrder[second.certificateType];

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
const { data: courseData, error: courseError } =
  await supabase
    .from("courses")
    .select("level")
    .eq("id", normalizedCourseId)
    .maybeSingle();

if (courseError || !courseData) {
  return {
    success: false,
    message: courseError
      ? `تعذر تحميل تقسيم الكورس: ${courseError.message}`
      : "تعذر العثور على بيانات الكورس.",
  };
}

const courseLevel: "single" | "split" =
  courseData.level === "split" ? "split" : "single";
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
      .in("journey_type", [
  "fundamental",
  "advanced",
  "integrated",
])
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

   const rawRows = (data as EnrollmentRow[] | null) ?? [];

const userIds = Array.from(
  new Set(
    rawRows
      .map((row) => row.user_id)
      .filter(
        (id): id is string =>
          typeof id === "string" &&
          id.trim().length > 0,
      ),
  ),
);

const profilesByUserId = new Map<
  string,
  StudentProfileRow
>();

if (userIds.length > 0) {
  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("id", userIds);

  if (profileError) {
    return {
      success: false,
      message:
        `تعذر تحميل بيانات الطلاب الحالية: ${profileError.message}`,
    };
  }

  for (const profile of
    (profileData ?? []) as StudentProfileRow[]) {
    profilesByUserId.set(
      profile.id,
      profile,
    );
  }
}

const rows = rawRows.map((row) =>
  applyProfileToEnrollment(
    row,
    profilesByUserId.get(row.user_id),
  ),
);

const enrollmentIds = rows.map((row) => row.id);

const certificateMap = new Map<
  string,
  CourseCertificateLookupRow
>();

if (enrollmentIds.length > 0) {
  const {
    data: certificateRowsData,
    error: certificateRowsError,
  } = await supabase
    .from("certificates")
    .select(`
      id,
      enrollment_id,
      certificate_type,
      status,
      issued_at
    `)
    .in("enrollment_id", enrollmentIds)
    .in("certificate_type", [
      "fundamental",
      "advanced",
    ]);

  if (certificateRowsError) {
    return {
      success: false,
      message:
        `تعذر تحميل شهادات الطلاب: ${certificateRowsError.message}`,
    };
  }

  const certificateRows =
    (certificateRowsData ??
      []) as CourseCertificateLookupRow[];

  for (const certificate of certificateRows) {
    certificateMap.set(
      `${certificate.enrollment_id}:${certificate.certificate_type}`,
      certificate,
    );
  }
}

const students = rows
  .flatMap((row) =>
  mapEnrollmentToCertificateStudents(
    row,
    courseLevel,
  ),
)
  .map((student) => {
    const certificate = certificateMap.get(
      `${student.enrollmentId}:${student.certificateType}`,
    );

    return {
      ...student,

      certificateId:
        certificate?.id ?? null,

      certificateStatus:
        certificate?.status ?? null,

      certificateIssuedAt:
        certificate?.issued_at ?? null,
    };
  });
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
  certificateType: "fundamental" | "advanced";
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
type CourseCertificateLookupRow = {
  id: string;
  enrollment_id: string;
  certificate_type: CertificateType;
  status: string | null;
  issued_at: string | null;
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
  const { data, error } = await supabase.rpc(
    "admin_create_notification",
    {
      p_user_id: studentId,
      p_title: "تم إصدار شهادتك",
      p_body: `تم إصدار شهادتك الخاصة بكورس ${courseTitle}. يمكنك الآن عرضها وتحميلها من شاشة شهاداتي.`,
      p_type: "certificate_issued",
      p_action_url: "/dashboard?panel=certificates",
    },
  );

  if (error) {
    console.error(
      "CREATE CERTIFICATE NOTIFICATION ERROR",
      error,
    );

    return error.message;
  }

  if (!data) {
    return "لم يتم إنشاء إشعار إصدار الشهادة.";
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
const certificateType = input.certificateType;
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

    const {
      data: linkedProfileData,
      error: linkedProfileError,
    } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", enrollment.user_id)
      .maybeSingle();

    if (linkedProfileError) {
      return {
        success: false,
        message:
          `تعذر تحميل بيانات الطالب الحالية: ${linkedProfileError.message}`,
      };
    }

    const linkedProfile =
      (linkedProfileData as StudentProfileRow | null) ??
      null;

    const resolvedStudentName =
      linkedProfile?.full_name?.trim() ||
      enrollment.student_name?.trim() ||
      enrollment.student_email?.split("@")[0] ||
      "Student";

    const resolvedStudentEmail =
      linkedProfile?.email?.trim() ||
      enrollment.student_email?.trim() ||
      "";

    if (enrollment.status !== "active") {
      return {
        success: false,
        message: "لا يمكن إصدار شهادة لاشتراك غير نشط.",
      };
    }

    const { data: currentCertificate } = await supabase
  .from("certificates")
  .select("id,certificate_number,issued_at,status")
  .eq("enrollment_id", enrollment.id)
  .eq("certificate_type", certificateType)
  .maybeSingle();

if (
  currentCertificate &&
  currentCertificate.status === "issued"
) {
  return {
    success: true,
    message: "الشهادة صادرة بالفعل.",
    data: {
      certificateId: currentCertificate.id,
      certificateNumber:
        currentCertificate.certificate_number,
      issuedAt: currentCertificate.issued_at,
    },
  };
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

    if (!settings?.certificate_enabled) {
      return {
        success: false,
        message:
          "الشهادات غير مفعلة لهذا الكورس.",
      };
    }

    const studentName =
      enrollment.student_name_en?.trim() ||
      resolvedStudentName;

    const courseTitle =
      settings.display_title?.trim() ||
      enrollment.action_title?.trim() ||
      enrollment.journey_title?.trim() ||
      enrollment.course_title?.trim() ||
      "Course Certificate";

   const issuedAt = new Date().toISOString();

/*
 * قراءة بيانات الكورس الأساسية.
 * نستخدم title للحصول على رمز المحطة من COURSE_CODES.
 * ونستخدم علاقات الكورس لقراءة رقم المسار ورقم المحطة.
 */
const { data: courseData, error: courseDataError } =
  await supabase
    .from("courses")
    .select(`
  title,
  course_code,
  level,
  career_path_id,
  station_id
`)
    .eq("id", enrollment.course_id)
    .maybeSingle();

if (courseDataError || !courseData) {
  return {
    success: false,
    message:
      courseDataError?.message
        ? `تعذر تحميل بيانات الكورس: ${courseDataError.message}`
        : "تعذر العثور على بيانات الكورس.",
  };
}

if (!courseData.career_path_id) {
  return {
    success: false,
    message: "الكورس غير مرتبط بمسار مهني.",
  };
}

if (!courseData.station_id) {
  return {
    success: false,
    message: "الكورس غير مرتبط بمحطة داخل المسار.",
  };
}

/*
 * رقم المسار:
 * career_paths.display_order
 */
const { data: careerPathData, error: careerPathError } =
  await supabase
    .from("career_paths")
    .select("display_order")
    .eq("id", courseData.career_path_id)
    .maybeSingle();

if (careerPathError || !careerPathData) {
  return {
    success: false,
    message:
      careerPathError?.message
        ? `تعذر تحميل رقم المسار: ${careerPathError.message}`
        : "تعذر العثور على رقم المسار.",
  };
}

/*
 * رقم المحطة:
 * course_stations.display_order
 */
const { data: stationData, error: stationError } =
  await supabase
    .from("course_stations")
    .select("display_order")
    .eq("id", courseData.station_id)
    .maybeSingle();

if (stationError || !stationData) {
  return {
    success: false,
    message:
      stationError?.message
        ? `تعذر تحميل رقم المحطة: ${stationError.message}`
        : "تعذر العثور على رقم المحطة.",
  };
}
const courseLevel: "single" | "split" =
  courseData.level === "split" ? "split" : "single";

if (
  courseLevel === "single" &&
  certificateType === "fundamental"
) {
  return {
    success: false,
    message:
      "هذا الكورس مكوّن من مستوى واحد، وشهادته من نوع Advanced فقط.",
  };
}
/*
 * رقم الطالب الثابت في المنصة.
 */
const normalizedEmail =
  resolvedStudentEmail.toLowerCase();

if (!normalizedEmail) {
  return {
    success: false,
    message: "البريد الإلكتروني للطالب غير موجود.",
  };
}

const { data: studentRegistry, error: registryError } =
  await supabase
    .from("student_registry")
    .select("masar_id,user_id")
    .eq("normalized_email", normalizedEmail)
    .maybeSingle();

if (registryError) {
  return {
    success: false,
    message: `تعذر تحميل رقم العضوية: ${registryError.message}`,
  };
}

if (!studentRegistry) {
  return {
    success: false,
    message:
      "لا يوجد Masar ID لهذا الطالب. يرجى إعادة استيراده أو تسجيله أولًا.",
  };
}

const baseCourseTitle =
  courseData.title?.trim() ||
  enrollment.course_title?.trim() ||
  "";

const courseCode =
  courseData.course_code?.trim() || "GEN";

if (!baseCourseTitle) {
  return {
    success: false,
    message: "اسم الكورس الأساسي غير موجود.",
  };
}

const trackNumber = toSafeNumber(
  careerPathData.display_order,
);

const stationNumber = toSafeNumber(
  stationData.display_order,
);

if (trackNumber <= 0) {
  return {
    success: false,
    message: "ترتيب المسار غير صحيح في قاعدة البيانات.",
  };
}

if (stationNumber <= 0) {
  return {
    success: false,
    message: "ترتيب المحطة غير صحيح في قاعدة البيانات.",
  };
}

const journeyNumber =
  certificateType === "fundamental"
    ? 1
    : 2;

const certificateNumber = generateCertificateNumber({
  courseCode,
 journeyType: certificateType,
  year: new Date(issuedAt).getFullYear(),
  masarId: toSafeNumber(studentRegistry.masar_id),
  trackNumber,
  stationNumber,
  journeyNumber,
});

const verificationCode = crypto.randomUUID();



   const certificatePayload = {
  user_id: enrollment.user_id,
  enrollment_id: enrollment.id,

  course_id: enrollment.course_id,

  template_id:null,

  certificate_number: certificateNumber,

  student_name:
    resolvedStudentName,

  student_name_en:
    enrollment.student_name_en?.trim() ??
    resolvedStudentName,

student_email:
  resolvedStudentEmail,
  course_title:
    enrollment.course_title?.trim() ?? "",

  course_title_en: courseTitle,

  certificate_type: certificateType,

  issued_at: issuedAt,
  issue_date: issuedAt,

  status: "issued", 
  is_new: true,

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
    ? `تعذر إصدار الشهادة بسبب تكرار في قاعدة البيانات: ${
        certificateError?.message ?? "قيد غير معروف"
      }`
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
      resolvedStudentName,

    email:
      resolvedStudentEmail,

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

  message: notificationWarning
    ? "تم إصدار الشهادة، لكن تعذر إرسال الإشعار للطالب."
    : "تم إصدار الشهادة وإرسال إشعار للطالب بنجاح.",

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

export async function reissueCourseCertificate(
  input: IssueCourseCertificateInput,
): Promise<IssueCourseCertificateResult> {
  try {
    const enrollmentId = input.enrollmentId?.trim();

    if (!enrollmentId) {
      return {
        success: false,
        message: "رقم الاشتراك غير موجود.",
      };
    }

    const { supabase } = await requireAdmin();

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(`
        id,
        user_id,
        student_name,
        student_email,
        course_title
`)
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError) {
      return {
        success: false,
        message: `تعذر تحميل بيانات الاشتراك: ${enrollmentError.message}`,
      };
    }
if (!enrollment) {
  return {
    success: false,
    message: "تعذر العثور على بيانات الاشتراك.",
  };
}

    const {
      data: linkedProfileData,
      error: linkedProfileError,
    } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", enrollment.user_id)
      .maybeSingle();

    if (linkedProfileError) {
      return {
        success: false,
        message:
          `تعذر تحميل بيانات الطالب الحالية: ${linkedProfileError.message}`,
      };
    }

    const linkedProfile =
      (linkedProfileData as StudentProfileRow | null) ??
      null;

    const resolvedStudentName =
      linkedProfile?.full_name?.trim() ||
      enrollment.student_name?.trim() ||
      enrollment.student_email?.split("@")[0] ||
      "Student";

    const resolvedStudentEmail =
      linkedProfile?.email?.trim() ||
      enrollment.student_email?.trim() ||
      "";

    const { data: currentCertificate, error: certificateError } =
  await supabase
    .from("certificates")
    .select("id,certificate_number,verification_code")
    .eq("enrollment_id", enrollmentId)
    .eq("certificate_type", input.certificateType)
    .maybeSingle();

if (certificateError || !currentCertificate) {
  return {
    success: false,
    message: "تعذر العثور على الشهادة الحالية.",
  };
}

      const issuedAt = new Date().toISOString();

    const { error: updateCertificateError } = await supabase
      .from("certificates")
      .update({
        student_name: resolvedStudentName,
        student_email: resolvedStudentEmail,
        issued_at: issuedAt,
        issue_date: issuedAt,
        is_new: true,
        email_status: "pending",
        notification_status: "pending",
      })
      .eq("id", currentCertificate.id);

    if (updateCertificateError) {
      return {
        success: false,
        message: `تعذر تحديث الشهادة: ${updateCertificateError.message}`,
      };
    }

    const { error: updateEnrollmentError } = await supabase
      .from("enrollments")
      .update({
        certificate_status: "issued",
        certificate_issued_at: issuedAt,
        updated_at: issuedAt,
      })
      .eq("id", enrollmentId);

    if (updateEnrollmentError) {
      return {
        success: false,
        message: `تم تحديث الشهادة، لكن تعذر تحديث الاشتراك: ${updateEnrollmentError.message}`,
      };
    }

    const courseTitle =
      enrollment.course_title?.trim() || "Course Certificate";

    const notificationWarning = await createCertificateNotification(
      supabase,
      enrollment.user_id,
      courseTitle,
    );

    await supabase
      .from("certificates")
      .update({
        notification_status: notificationWarning ? "failed" : "sent",
      })
      .eq("id", currentCertificate.id);

    let emailWarning: string | undefined;

    if (resolvedStudentEmail) {
      try {
        await sendCertificateEmail({
          studentName: resolvedStudentName,
          email: resolvedStudentEmail,
          certificateId: currentCertificate.id,
          courseTitle,
        });

        await supabase
          .from("certificates")
          .update({
            email_status: "sent",
          })
          .eq("id", currentCertificate.id);
      } catch (error) {
        emailWarning =
          error instanceof Error
            ? error.message
            : "تعذر إرسال البريد الإلكتروني.";

        await supabase
          .from("certificates")
          .update({
            email_status: "failed",
          })
          .eq("id", currentCertificate.id);
      }
    } else {
      emailWarning = "لا يوجد بريد إلكتروني مسجل للطالب.";

      await supabase
        .from("certificates")
        .update({
          email_status: "failed",
        })
        .eq("id", currentCertificate.id);
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath(`/certificates/${currentCertificate.id}`);
    revalidatePath(`/certificates/${currentCertificate.id}/print`);

    return {
      success: true,
      message:
        notificationWarning || emailWarning
          ? "تمت إعادة إصدار الشهادة، مع وجود تنبيه في الإشعار أو البريد الإلكتروني."
          : "تمت إعادة إصدار الشهادة وإرسال الإشعار والبريد الإلكتروني بنجاح.",
      warning: notificationWarning ?? emailWarning,
      data: {
        certificateId: currentCertificate.id,
        certificateNumber: currentCertificate.certificate_number,
        issuedAt,
      },
    };
  } catch (error) {
    console.error("REISSUE COURSE CERTIFICATE ERROR", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إعادة إصدار الشهادة.",
    };
  }
}