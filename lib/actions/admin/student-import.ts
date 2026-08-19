"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

import type {
  StudentImportRow,
} from "@/lib/import/types";

import {
  generateCertificateNumber,
} from "@/lib/certificates";

import {
  getMasarPassportForRegistry,
} from "@/lib/dashboard/masar-passport";

export interface StudentImportRowResult {
  rowNumber: number;
  studentEmail: string;
  success: boolean;
  message: string;
}

export interface StudentImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  results: StudentImportRowResult[];
}

type CourseRow = {
  id: string;
  title: string | null;
  slug: string | null;
  course_code: string | null;
  career_path_id: string | null;
  station_id: string | null;
  level: "single" | "split" | null;
};

type CertificateType =
  | "fundamental"
  | "advanced";

type LinkedProfileRow = {
  full_name: string | null;
  full_name_en: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateImportedProgress(
  value: number | null,
  label: string,
) {
  if (value === null) {
    return null;
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `${label} يجب أن تكون من 0 إلى 100.`,
    );
  }

  return Math.round(value);
}

function resolveImportedProgress(
  row: StudentImportRow,
  course: CourseRow,
) {
  const progress =
    validateImportedProgress(
      row.progress,
      "Progress",
    );

  const fundamentalsProgress =
    validateImportedProgress(
      row.fundamentalsProgress,
      "Fundamentals Progress",
    );

  const advancedProgress =
    validateImportedProgress(
      row.advancedProgress,
      "Advanced Progress",
    );

  if (course.level !== "split") {
    return {
      hasImportedProgress:
        progress !== null,
      progressPercent:
        progress ?? 0,
      splitProgress: null as
        | Record<string, number>
        | null,
    };
  }

  const journeyType =
    String(
      row.journeyType ?? "",
    )
      .trim()
      .toLowerCase();

  const isIntegrated =
    journeyType.includes(
      "integrated",
    ) ||
    journeyType.includes(
      "متكامل",
    );

  const isFundamentals =
    journeyType.includes(
      "fundamental",
    ) ||
    journeyType.includes(
      "foundation",
    ) ||
    journeyType.includes(
      "basic",
    ) ||
    journeyType.includes(
      "أساسيات",
    );

  const isAdvanced =
    journeyType.includes(
      "advanced",
    ) ||
    journeyType.includes(
      "متقدم",
    );

  if (isIntegrated) {
    const fundamentals =
      fundamentalsProgress ??
      progress ??
      0;

    const advanced =
      advancedProgress ??
      progress ??
      0;

    return {
      hasImportedProgress:
        progress !== null ||
        fundamentalsProgress !==
          null ||
        advancedProgress !== null,

      progressPercent:
        Math.round(
          (
            fundamentals +
            advanced
          ) / 2,
        ),

      splitProgress: {
        fundamentals,
        advanced,
      },
    };
  }

  if (isFundamentals) {
    const fundamentals =
      fundamentalsProgress ??
      progress ??
      0;

    return {
      hasImportedProgress:
        progress !== null ||
        fundamentalsProgress !==
          null,

      progressPercent:
        fundamentals,

      splitProgress: {
        fundamentals,
      },
    };
  }

  if (isAdvanced) {
    const advanced =
      advancedProgress ??
      progress ??
      0;

    return {
      hasImportedProgress:
        progress !== null ||
        advancedProgress !==
          null,

      progressPercent:
        advanced,

      splitProgress: {
        advanced,
      },
    };
  }

  return {
    hasImportedProgress:
      progress !== null,
    progressPercent:
      progress ?? 0,
    splitProgress: null as
      | Record<string, number>
      | null,
  };
}

function createSourceReference(
  row: StudentImportRow,
) {
  const source =
    row.importSource.trim() || "admin_import";

  return [
    source,
    normalizeEmail(row.studentEmail),
    row.courseCode.trim().toLowerCase(),
    row.journeyType.trim().toLowerCase(),
  ].join(":");
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(
      String(profile.role),
    )
  ) {
    throw new Error(
      "ليس لديك صلاحية لتنفيذ الاستيراد.",
    );
  }

  return user;
}
  
async function findUserIdByEmail(
  email: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  return data?.id ?? null;
}
async function ensureStudentRegistry({
  email,
  studentName,
  userId,
}: {
  email: string;
  studentName: string;
  userId: string | null;
}) {
  const admin = createAdminClient();

  const normalizedEmail = normalizeEmail(email);

  const { data: existing, error: existingError } =
    await admin
      .from("student_registry")
      .select("id, masar_id, user_id")
      .eq("normalized_email", normalizedEmail)
      .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    if (!existing.user_id && userId) {
      await admin
        .from("student_registry")
        .update({
          user_id: userId,
          student_name: studentName,
          source: "registered",
        })
        .eq("id", existing.id);
    }

    return existing.masar_id;
  }

  const { data, error } = await admin
    .from("student_registry")
    .insert({
      email: normalizedEmail,
      normalized_email: normalizedEmail,
      student_name: studentName,
      user_id: userId,
      source: userId
        ? "registered"
        : "imported",
    })
    .select("masar_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.masar_id;
}
async function findCourse(
  courseCode: string,
): Promise<CourseRow | null> {
 const admin = createAdminClient();

const normalizedCode = courseCode.trim().toLowerCase();

const { data, error } = await admin
  .from("courses")
 .select("id,title,slug,course_code,career_path_id,station_id,level")
  .ilike("slug", normalizedCode)
  .maybeSingle();

if (error) {
  throw new Error(error.message);
}

return (data as CourseRow | null) ?? null;
  
}
function normalizeCertificateTypeValue(
  value: unknown,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function hasImportedCertificate(
  row: StudentImportRow,
) {
  const importedType =
    normalizeCertificateTypeValue(
      row.certificateType,
    );

  return ![
    "",
    "none",
    "no",
    "null",
  ].includes(importedType);
}

function resolveCertificateTypes(
  row: StudentImportRow,
  course: CourseRow,
): CertificateType[] {
  if (!hasImportedCertificate(row)) {
    return [];
  }

  /*
   * الكورس Single له شهادة واحدة فقط من نوع Advanced.
   */
  if (course.level !== "split") {
    return ["advanced"];
  }

  const importedType =
    normalizeCertificateTypeValue(
      row.certificateType,
    );

  if (
    importedType === "fundamental" ||
    importedType === "fundamentals"
  ) {
    return ["fundamental"];
  }

  if (importedType === "integrated") {
    /*
     * نفس قاعدة نظام الشهادات الأساسي:
     * Integrated في الكورس المقسّم
     * = شهادة Fundamentals + شهادة Advanced.
     */
    return [
      "fundamental",
      "advanced",
    ];
  }

  return ["advanced"];
}

async function getLinkedProfile(
  userId: string | null,
): Promise<LinkedProfileRow | null> {
  if (!userId) {
    return null;
  }

  const admin = createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("profiles")
    .select(
      "full_name,full_name_en",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    data as LinkedProfileRow | null
  ) ?? null;
}

function resolveCertificateStudentNames({
  row,
  profile,
}: {
  row: StudentImportRow;
  profile: LinkedProfileRow | null;
}) {
  const englishName =
    profile?.full_name_en?.trim() ||
    row.studentNameEn?.trim() ||
    profile?.full_name?.trim() ||
    row.studentName?.trim() ||
    "Student";

  const displayName =
    profile?.full_name?.trim() ||
    row.studentName?.trim() ||
    englishName;

  return {
    displayName,
    englishName,
  };
}

async function getCertificateNumberContext(
  course: CourseRow,
) {
  if (!course.career_path_id) {
    throw new Error(
      "الكورس غير مرتبط بمسار مهني.",
    );
  }

  if (!course.station_id) {
    throw new Error(
      "الكورس غير مرتبط بمحطة داخل المسار.",
    );
  }

  const admin =
    createAdminClient();

  const [
    careerPathResult,
    stationResult,
  ] = await Promise.all([
    admin
      .from("career_paths")
      .select("display_order")
      .eq(
        "id",
        course.career_path_id,
      )
      .maybeSingle(),

    admin
      .from("course_stations")
      .select("display_order")
      .eq(
        "id",
        course.station_id,
      )
      .maybeSingle(),
  ]);

  if (
    careerPathResult.error ||
    !careerPathResult.data
  ) {
    throw new Error(
      careerPathResult.error?.message ||
        "تعذر العثور على ترتيب المسار.",
    );
  }

  if (
    stationResult.error ||
    !stationResult.data
  ) {
    throw new Error(
      stationResult.error?.message ||
        "تعذر العثور على ترتيب المحطة.",
    );
  }

  const trackNumber = Number(
    careerPathResult.data.display_order ??
      0,
  );

  const stationNumber = Number(
    stationResult.data.display_order ??
      0,
  );

  if (
    !Number.isFinite(trackNumber) ||
    trackNumber <= 0
  ) {
    throw new Error(
      "ترتيب المسار غير صحيح في قاعدة البيانات.",
    );
  }

  if (
    !Number.isFinite(stationNumber) ||
    stationNumber <= 0
  ) {
    throw new Error(
      "ترتيب المحطة غير صحيح في قاعدة البيانات.",
    );
  }

  return {
    trackNumber,
    stationNumber,
  };
}

async function upsertEnrollment({
  row,
  userId,
  course,
  sourceReference,
}: {
  row: StudentImportRow;
  userId: string | null;
  course: CourseRow;
  sourceReference: string;
}) {
  const admin = createAdminClient();
  const email = normalizeEmail(row.studentEmail);
  const now = new Date().toISOString();
const certificateTypes =
  resolveCertificateTypes(
    row,
    course,
  );

const primaryCertificateType =
  certificateTypes[0] ?? null;

const importedProgress =
  resolveImportedProgress(
    row,
    course,
  );

  const { data: existing, error: existingError } =
    await admin
      .from("enrollments")
      .select(
        "id,progress_percent,split_progress",
      )
      .eq("course_id", course.id)
      .eq("journey_type", row.journeyType)
      .ilike("student_email", email)
      .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    user_id: userId,
    student_name: row.studentName,
    student_name_en: row.studentNameEn || null,
    student_email: email,

    course_id: course.id,
    course_title:
      course.title?.trim() || row.courseCode,

    journey_type: row.journeyType,
    journey_title: null,

    action_key: row.journeyType,
   action_title:
      primaryCertificateType ??
      row.journeyType,

    status: "active",

    source: "admin_import",
    source_reference: sourceReference,

    updated_at: now,
  };

  if (existing) {
    const updatePayload: Record<
      string,
      unknown
    > = {
      ...payload,
    };

    /*
     * إذا كانت خلايا التقدم في Excel فارغة،
     * لا نمسح تقدمًا موجودًا بالفعل.
     */
    if (
      importedProgress.hasImportedProgress
    ) {
      updatePayload.progress_percent =
        importedProgress.progressPercent;

      if (
        importedProgress.splitProgress
      ) {
        updatePayload.split_progress =
          importedProgress.splitProgress;
      }
    }

    const { data, error } = await admin
      .from("enrollments")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id as string;
  }

  const { data, error } = await admin
    .from("enrollments")
    .insert({
      ...payload,

      progress_percent:
        importedProgress.progressPercent,

      split_progress:
        importedProgress.splitProgress ??
        {},

      created_at: now,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

async function upsertSurvey({
  row,
  userId,
  course,
  sourceReference,
}: {
  row: StudentImportRow;
  userId: string | null;
  course: CourseRow;
  sourceReference: string;
}) {
  const hasSurvey =
    row.rating > 0 ||
    Boolean(row.generalReview) ||
    row.detailedSurveyCompleted;

  if (!hasSurvey) return;

  const admin = createAdminClient();
  const email = normalizeEmail(row.studentEmail);
  const now = new Date().toISOString();

  const payload = {
    user_id: userId,
    student_name: row.studentName,
    student_email: email,
    student_job_title: row.jobTitle || null,
    student_country: row.country || null,

    course_id: course.id,

    rating: row.rating || null,
    comment: row.generalReview || null,

    submitted_at: now,

    general_survey_completed:
      Boolean(row.generalReview) || row.rating > 0,

    general_survey_completed_at:
      Boolean(row.generalReview) || row.rating > 0
        ? now
        : null,

    detailed_survey_completed:
      row.detailedSurveyCompleted,

    detailed_survey_completed_at:
      row.detailedSurveyCompleted ? now : null,

    show_on_home: row.showReviewHome,
    show_on_course: row.showReviewCourse,

    previous_show_on_home:
      row.showReviewHome,

    previous_show_on_course:
      row.showReviewCourse,

    source: "admin_import",
    source_reference: sourceReference,

    status: "approved",
    edited_by_student: false,
  };

  const { data: existing } = await admin
    .from("student_surveys")
    .select("id")
    .eq("course_id", course.id)
    .ilike("student_email", email)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("student_surveys")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await admin
    .from("student_surveys")
    .insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertProject({
  row,
  userId,
  enrollmentId,
  course,
  sourceReference,
}: {
  row: StudentImportRow;
  userId: string | null;
  enrollmentId: string;
  course: CourseRow;
  sourceReference: string;
}) {
  const hasProject =
    Boolean(row.projectTitle) ||
    Boolean(row.projectDescription) ||
    row.projectImages.length > 0;

  if (!hasProject) return;

  const admin = createAdminClient();
  const email = normalizeEmail(row.studentEmail);
  const now = new Date().toISOString();

  const images = row.projectImages.map(
    (fileName) =>
      `/images/student-projects/${fileName}`,
  );

  const payload = {
    user_id: userId,
    enrollment_id: enrollmentId,

    course_id: course.id,
    course_title:
      course.title?.trim() || row.courseCode,

    student_name: row.studentName,
    student_email: email,
    student_job_title: row.jobTitle || null,
    student_country: row.country || null,

    project_title:
      row.projectTitle || "مشروع الطالب",

    project_description:
      row.projectDescription || null,

    project_images: images,
    cover_image: images[0] ?? null,

    status: "approved",

    show_on_home: row.showProjectHome,
    show_on_course: row.showProjectCourse,

    previous_show_on_home:
      row.showProjectHome,

    previous_show_on_course:
      row.showProjectCourse,

    edited_by_student: false,

    source: "admin_import",
    source_reference: sourceReference,

    reviewed_at: now,
    submitted_at: now,
    updated_at: now,
  };

  const { data: existing } = await admin
    .from("student_projects")
    .select("id")
    .eq("course_id", course.id)
    .ilike("student_email", email)
    .eq(
      "project_title",
      row.projectTitle || "مشروع الطالب",
    )
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("student_projects")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await admin
    .from("student_projects")
    .insert({
      ...payload,
      created_at: now,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertCertificate({
  row,
  userId,
  enrollmentId,
  course,
  sourceReference,
  issuedBy,
  masarId,
}: {
  row: StudentImportRow;
  userId: string | null;
  enrollmentId: string;
  course: CourseRow;
  sourceReference: string;
  issuedBy: string;
  masarId: number;
}) {
  const certificateTypes =
    resolveCertificateTypes(
      row,
      course,
    );

  if (
    certificateTypes.length === 0
  ) {
    return;
  }

  const admin =
    createAdminClient();

  const email =
    normalizeEmail(
      row.studentEmail,
    );

  const now =
    new Date().toISOString();

  const profile =
    await getLinkedProfile(
      userId,
    );

  const {
    displayName,
    englishName,
  } =
    resolveCertificateStudentNames({
      row,
      profile,
    });

  const {
    trackNumber,
    stationNumber,
  } =
    await getCertificateNumberContext(
      course,
    );

  const courseCode =
    course.course_code?.trim() ||
    "GEN";

  const issuedCertificateIds:
    string[] = [];

  for (
    const certificateType of
      certificateTypes
  ) {
    const journeyNumber =
      certificateType ===
      "fundamental"
        ? 1
        : 2;

    const certificateNumber =
      generateCertificateNumber({
        courseCode,
        journeyType:
          certificateType,
        year:
          new Date(
            now,
          ).getFullYear(),
        masarId:
          Number(masarId),
        trackNumber,
        stationNumber,
        journeyNumber,
      });

    const verificationCode =
      crypto.randomUUID();

    const {
      data: existing,
      error: existingError,
    } = await admin
      .from("certificates")
      .select(
        "id,source,certificate_number,status",
      )
      .eq(
        "enrollment_id",
        enrollmentId,
      )
      .eq(
        "certificate_type",
        certificateType,
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        existingError.message,
      );
    }

    if (existing) {
      /*
       * لا نلمس شهادة يدوية/عادية صدرت من النظام الأساسي.
       * نحدّث فقط الشهادة القادمة من الاستيراد،
       * وهذا يسمح بتصحيح MM-IMPORT القديم
       * والاسم الإنجليزي عند إعادة استيراد نفس الطالب.
       */
      if (
        existing.source ===
        "admin_import"
      ) {
        const {
          error: updateError,
        } = await admin
          .from("certificates")
          .update({
            user_id: userId,

            certificate_number:
              certificateNumber,

            student_name:
              displayName,

            student_name_en:
              englishName,

            student_name_on_certificate:
              englishName,

            student_email:
              email,

            course_title:
              course.title?.trim() ||
              row.courseCode,

            course_title_en:
              course.title?.trim() ||
              row.courseCode,

            issued_by:
              issuedBy,

            issued_at:
              now,

            issue_date:
              now,

            status:
              "issued",

            is_new:
              true,

            notification_status:
              userId
                ? "pending"
                : "waiting_account",

            email_status:
              "pending",

            source_reference:
              sourceReference,

            metadata: {
              imported: true,
              migratedToFinalNumber:
                true,
            },
          })
          .eq(
            "id",
            existing.id,
          );

        if (updateError) {
          throw new Error(
            updateError.message,
          );
        }

        issuedCertificateIds.push(
          existing.id,
        );
      }

      continue;
    }

    const {
      data: certificate,
      error,
    } = await admin
      .from("certificates")
      .insert({
        user_id:
          userId,

        enrollment_id:
          enrollmentId,

        course_id:
          course.id,

        issued_by:
          issuedBy,

        certificate_number:
          certificateNumber,

        /*
         * student_name يحتفظ باسم العرض الحالي،
         * وstudent_name_en / student_name_on_certificate
         * هما المصدر المستخدم في الشهادة.
         */
        student_name:
          displayName,

        student_name_en:
          englishName,

        student_name_on_certificate:
          englishName,

        student_email:
          email,

        course_title:
          course.title?.trim() ||
          row.courseCode,

        course_title_en:
          course.title?.trim() ||
          row.courseCode,

        certificate_type:
          certificateType,

        issued_at:
          now,

        issue_date:
          now,

        status:
          "issued",

        is_new:
          true,

        verification_code:
          verificationCode,

        preview_url:
          null,

        pdf_url:
          null,

        notification_status:
          userId
            ? "pending"
            : "waiting_account",

        email_status:
          "pending",

        source:
          "admin_import",

        source_reference:
          sourceReference,

        metadata: {
          imported: true,
        },
      })
      .select("id")
      .single();

    if (
      error ||
      !certificate
    ) {
      throw new Error(
        error?.message ||
          "تعذر إنشاء الشهادة.",
      );
    }

    issuedCertificateIds.push(
      certificate.id,
    );
  }

  if (
    issuedCertificateIds.length ===
    0
  ) {
    return;
  }

  /*
   * enrollments يحتوي certificate_id واحدًا فقط.
   * في حالة Integrated نربطه بآخر شهادة تم إنشاؤها
   * (Advanced)، بينما المصدر الحقيقي لكل الشهادات
   * يظل جدول certificates المرتبط بـ enrollment_id.
   */
  const certificateId =
    issuedCertificateIds[
      issuedCertificateIds.length -
        1
    ];

  const {
    error: enrollmentError,
  } = await admin
    .from("enrollments")
    .update({
      certificate_status:
        "issued",

      certificate_id:
        certificateId,

      certificate_issued_at:
        now,

      updated_at:
        now,
    })
    .eq(
      "id",
      enrollmentId,
    );

  if (enrollmentError) {
    throw new Error(
      enrollmentError.message,
    );
  }
}

export async function importStudentRows(
  rows: StudentImportRow[],
): Promise<StudentImportResult> {
 const adminUser = await requireAdmin();

  const results: StudentImportRowResult[] =
    [];

  for (
    let index = 0;
    index < rows.length;
    index += 1
  ) {
    const row = rows[index];
    const rowNumber = index + 2;
    const email = normalizeEmail(
      row.studentEmail,
    );

    try {
      if (!row.studentName) {
        throw new Error(
          "اسم الطالب مطلوب.",
        );
      }

      if (!email) {
        throw new Error(
          "البريد الإلكتروني مطلوب.",
        );
      }

      if (!row.courseCode) {
        throw new Error(
          "كود الكورس مطلوب.",
        );
      }

      const course = await findCourse(
        row.courseCode,
      );

      if (!course) {
        throw new Error(
          `لم يتم العثور على كورس بالكود: ${row.courseCode}`,
        );
      }

      const userId =
        await findUserIdByEmail(email);
const masarId =
  await ensureStudentRegistry({
    email,
    studentName: row.studentName,
    userId,
  });
      const sourceReference =
       createSourceReference(row);
      const enrollmentId =
        await upsertEnrollment({
          row,
          userId,
          course,
          sourceReference,
        });

      await upsertSurvey({
        row,
        userId,
        course,
        sourceReference,
      });

      await upsertProject({
        row,
        userId,
        enrollmentId,
        course,
        sourceReference,
      });

    await upsertCertificate({
  row,
  userId,
  enrollmentId,
  course,
  sourceReference,
  issuedBy: adminUser.id,
  masarId: Number(masarId),
});

      results.push({
        rowNumber,
        studentEmail: email,
        success: true,
        message: "تم الاستيراد بنجاح.",
      });
    } catch (error) {
      results.push({
        rowNumber,
        studentEmail: email,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      });
    }
  }

  const imported = results.filter(
    (result) => result.success,
  ).length;

  const failed =
    results.length - imported;

  revalidatePath("/admin");
  revalidatePath("/admin/student-import");
  revalidatePath("/dashboard");
  revalidatePath("/courses");

  return {
    success: failed === 0,
    message:
      failed === 0
        ? "تم استيراد جميع الصفوف بنجاح."
        : `تم استيراد ${imported} صف، وفشل ${failed} صف.`,

    imported,
    failed,
    results,
  };
}
export interface ImportedStudentListItem {
  registryId: string;
  masarId: number;
  studentName: string;
  email: string;
  userId: string | null;
  registrySource: string;
  isLinkedToAccount: boolean;
  createdAt: string;
  updatedAt: string;

  enrollmentsCount: number;
  certificatesCount: number;
  surveysCount: number;
  projectsCount: number;

  totalPoints: number;
  drawEntries: number;
}

export async function getImportedStudents(): Promise<
  ImportedStudentListItem[]
> {
  await requireAdmin();

  const admin = createAdminClient();

  /*
   * مصدر الحقيقة لوجود استيراد هو enrollments.source = admin_import.
   *
   * بهذا يظهر:
   * - الطالب المستورد الذي لم يسجل بعد.
   * - الطالب الذي كان لديه حساب أصلًا وتم دمج الاستيراد معه.
   * - الطالب الذي سجل لاحقًا وتحولت بيانات Registry الخاصة به إلى registered.
   */
  const {
    data: importedEnrollments,
    error: importedEnrollmentsError,
  } = await admin
    .from("enrollments")
    .select("student_email")
    .eq("source", "admin_import");

  if (importedEnrollmentsError) {
    throw new Error(
      importedEnrollmentsError.message,
    );
  }

  const importedEmails = [
    ...new Set(
      (importedEnrollments ?? [])
        .map((item) =>
          normalizeEmail(
            String(
              item.student_email ?? "",
            ),
          ),
        )
        .filter(Boolean),
    ),
  ];

  if (importedEmails.length === 0) {
    return [];
  }

  const {
    data: registryRows,
    error: registryError,
  } = await admin
    .from("student_registry")
    .select(
      `
        id,
        masar_id,
        email,
        normalized_email,
        user_id,
        student_name,
        source,
        created_at,
        updated_at
      `,
    )
    .in(
      "normalized_email",
      importedEmails,
    )
    .order("masar_id", {
      ascending: false,
    });

  if (registryError) {
    throw new Error(
      registryError.message,
    );
  }

  const results =
    await Promise.all(
      (registryRows ?? []).map(
        async (student) => {
          const email =
            normalizeEmail(
              student.email,
            );

          const [
            passport,
            certificatesResult,
            surveysResult,
            projectsResult,
            freeEnrollmentsResult,
          ] = await Promise.all([
            getMasarPassportForRegistry(
              student.id,
            ),

            admin
              .from("certificates")
              .select("id", {
                count: "exact",
                head: true,
              })
              .ilike(
                "student_email",
                email,
              )
              .eq(
                "source",
                "admin_import",
              ),

            admin
              .from("student_surveys")
              .select("id", {
                count: "exact",
                head: true,
              })
              .ilike(
                "student_email",
                email,
              )
              .eq(
                "source",
                "admin_import",
              ),

            admin
              .from("student_projects")
              .select("id", {
                count: "exact",
                head: true,
              })
              .ilike(
                "student_email",
                email,
              )
              .eq(
                "source",
                "admin_import",
              ),

            /*
             * Passport يحسب الرحلات الاحترافية واليوم الواحد منطقيًا.
             * الرحلات المجانية غير المشاهدة لا تدخل في viewedFreeJourneys،
             * لذلك نعدّ سجلات Free المستوردة الخام حتى لا تختفي من "عدد الرحلات".
             */
            admin
              .from("enrollments")
              .select("id,journey_type")
              .ilike(
                "student_email",
                email,
              )
              .eq(
                "source",
                "admin_import",
              ),
          ]);

          /*
           * إذا كان الطالب أصبح لديه Profile حقيقي،
           * نظهر الاسم الحقيقي الحالي وليس الاسم القديم الموجود في Excel.
           */
          let displayName =
            student.student_name ||
            "بدون اسم";

          if (student.user_id) {
            const {
              data: profile,
            } = await admin
              .from("profiles")
              .select("full_name")
              .eq(
                "id",
                student.user_id,
              )
              .maybeSingle();

            if (
              profile?.full_name?.trim()
            ) {
              displayName =
                profile.full_name.trim();
            }
          }

          const rawFreeEnrollmentsCount =
            (
              freeEnrollmentsResult.data ??
              []
            ).filter((enrollment) => {
              const type = String(
                enrollment.journey_type ??
                  "",
              )
                .trim()
                .toLowerCase()
                .replaceAll("-", "_");

              return [
                "free",
                "free_session",
                "free_journey",
              ].includes(type);
            }).length;

          const logicalJourneysCount =
            Math.max(
              0,
              Number(
                passport.professionalEnrollments ??
                  0,
              ),
            ) +
            Math.max(
              0,
              Number(
                passport.oneDayEnrollments ??
                  0,
              ),
            ) +
            rawFreeEnrollmentsCount;

          return {
            registryId:
              student.id,

            masarId:
              Number(
                student.masar_id,
              ),

            studentName:
              displayName,

            email,

            userId:
              student.user_id ??
              null,

            registrySource:
              student.source,

            isLinkedToAccount:
              Boolean(
                student.user_id,
              ),

            createdAt:
              student.created_at,

            updatedAt:
              student.updated_at,

            /*
             * عدد الرحلات هنا ليس عدد صفوف enrollments.
             * Split + Integrated يحسب رحلتين بنفس منطق Passport.
             */
            enrollmentsCount:
              logicalJourneysCount,

            certificatesCount:
              certificatesResult.count ??
              0,

            surveysCount:
              surveysResult.count ??
              0,

            projectsCount:
              projectsResult.count ??
              0,

            totalPoints:
              Math.max(
                0,
                Number(
                  passport.totalPoints ??
                    0,
                ),
              ),

            drawEntries:
              Math.max(
                0,
                Number(
                  passport.drawEntries ??
                    0,
                ),
              ),
          };
        },
      ),
    );

  return results;
}

export interface ImportedStudentPreviewJourney {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string | null;
  stationTitle: string | null;
  journeyType: string;
  enrollmentSource: "paid" | "reward";
  status: string;
  progressPercent: number;
  journeyCount: number;
  journeyPart:
    | "single"
    | "fundamentals"
    | "advanced";
  journeyPartLabel: string | null;
  enrolledAt: string;
  updatedAt: string | null;
}

export interface ImportedStudentPreviewCertificate {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  previewUrl: string | null;
  pdfUrl: string | null;
  isNew: boolean;
}

export interface ImportedStudentPreviewSurvey {
  id: string;
  courseId: string;
  rating: number;
  comment: string | null;
  submittedAt: string | null;
  showOnHome: boolean;
  showOnCourse: boolean;
}

export interface ImportedStudentPreviewProject {
  id: string;
  courseTitle: string;
  projectTitle: string;
  projectDescription: string | null;
  images: string[];
  coverImage: string | null;
  createdAt: string | null;
}

export interface ImportedStudentPreview {
  registryId: string;
  masarId: number;
  studentName: string;
  studentEmail: string;
  userId: string | null;
  isLinkedToAccount: boolean;
  createdAt: string;
  updatedAt: string;

  journeys: ImportedStudentPreviewJourney[];
  certificates: ImportedStudentPreviewCertificate[];
  surveys: ImportedStudentPreviewSurvey[];
  projects: ImportedStudentPreviewProject[];

  passport: Awaited<
    ReturnType<
      typeof getMasarPassportForRegistry
    >
  >;
}

export async function getImportedStudentPreview(
  registryId: string,
): Promise<ImportedStudentPreview> {
  await requireAdmin();

  if (!registryId?.trim()) {
    throw new Error("معرّف سجل الاستيراد غير موجود.");
  }

  const admin = createAdminClient();

  const {
    data: registry,
    error: registryError,
  } = await admin
    .from("student_registry")
    .select(
      "id,masar_id,email,normalized_email,user_id,student_name,created_at,updated_at",
    )
    .eq("id", registryId)
    .maybeSingle();

  if (registryError) {
    throw new Error(registryError.message);
  }

  if (!registry) {
    throw new Error("لم يتم العثور على الطالب المستورد.");
  }

  const email = normalizeEmail(
    String(
      registry.email ??
        registry.normalized_email ??
        "",
    ),
  );

  if (!email) {
    throw new Error(
      "بريد الطالب المستورد غير موجود.",
    );
  }

  const [
    enrollmentResult,
    certificatesResult,
    surveysResult,
    projectsResult,
  ] = await Promise.all([
    admin
      .from("enrollments")
      .select(
        "id,course_id,journey_type,enrollment_source,status,progress_percent,split_progress,created_at,updated_at",
      )
      .ilike("student_email", email)
      .eq("source", "admin_import")
      .order("created_at", {
        ascending: false,
      }),

    admin
      .from("certificates")
      .select(
        "id,certificate_number,course_title,issued_at,preview_url,pdf_url,file_url,is_new",
      )
      .ilike("student_email", email)
      .eq("source", "admin_import")
      .eq("status", "issued")
      .order("issued_at", {
        ascending: false,
      }),

    admin
      .from("student_surveys")
      .select(
        "id,course_id,rating,comment,submitted_at,show_on_home,show_on_course",
      )
      .ilike("student_email", email)
      .eq("source", "admin_import")
      .order("submitted_at", {
        ascending: false,
      }),

    admin
      .from("student_projects")
      .select(
        "id,course_title,project_title,project_description,project_images,cover_image,created_at",
      )
      .ilike("student_email", email)
      .eq("source", "admin_import")
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (enrollmentResult.error) {
    throw new Error(
      enrollmentResult.error.message,
    );
  }

  if (certificatesResult.error) {
    throw new Error(
      certificatesResult.error.message,
    );
  }

  if (surveysResult.error) {
    throw new Error(
      surveysResult.error.message,
    );
  }

  if (projectsResult.error) {
    throw new Error(
      projectsResult.error.message,
    );
  }

  const enrollments =
    enrollmentResult.data ?? [];

  const courseIds = [
    ...new Set(
      enrollments
        .map((item) =>
          String(item.course_id ?? ""),
        )
        .filter(Boolean),
    ),
  ];

  const {
    data: courses,
    error: coursesError,
  } = courseIds.length
    ? await admin
        .from("courses")
        .select(
          "id,title,title_ar,course_code,station_id,level",
        )
        .in("id", courseIds)
    : { data: [], error: null };

  if (coursesError) {
    throw new Error(
      coursesError.message,
    );
  }

  

  const courseMap = new Map(
    (courses ?? []).map((course) => [
      course.id,
      course,
    ]),
  );


  const journeys: ImportedStudentPreviewJourney[] =
    enrollments.flatMap<ImportedStudentPreviewJourney>((enrollment) => {
      const course = courseMap.get(
        enrollment.course_id,
      );

      const courseTitle =
        course?.title_ar?.trim() ||
        course?.title?.trim() ||
        "كورس غير معروف";

      const rawBaseProgress = Number(
        enrollment.progress_percent ?? 0,
      );

      const baseProgress =
        Number.isFinite(rawBaseProgress)
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  rawBaseProgress,
                ),
              ),
            )
          : 0;

      const rawSplitProgress =
        enrollment.split_progress &&
        typeof enrollment.split_progress ===
          "object" &&
        !Array.isArray(
          enrollment.split_progress,
        )
          ? (enrollment.split_progress as Record<
              string,
              unknown
            >)
          : {};

      const getSplitProgress = (
        part:
          | "fundamentals"
          | "advanced",
      ) => {
        const rawValue =
          rawSplitProgress[part] ??
          (
            part ===
            "fundamentals"
              ? rawSplitProgress[
                  "fundamental"
                ]
              : undefined
          );

        /*
         * دعم البيانات الحالية:
         * قبل إضافة split_progress كان CSD Integrated
         * يستخدم progress_percent واحدًا. إذا لم توجد
         * قيمة مستقلة بعد، نبدأ من القيمة القديمة حتى
         * لا نفقد التقدم الذي تم إدخاله سابقًا.
         */
        if (
          rawValue === undefined ||
          rawValue === null
        ) {
          return baseProgress;
        }

        const numericValue =
          Number(rawValue);

        return Number.isFinite(
          numericValue,
        )
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  numericValue,
                ),
              ),
            )
          : baseProgress;
      };

      const journeyType = String(
        enrollment.journey_type ??
          "integrated",
      )
        .trim()
        .toLowerCase();

      const isSplitCourse =
        String(
          course?.level ?? "",
        )
          .trim()
          .toLowerCase() ===
        "split";

      const isIntegrated =
        journeyType.includes(
          "integrated",
        ) ||
        journeyType.includes(
          "متكامل",
        );

      const isFundamentals =
        journeyType.includes(
          "fundamental",
        ) ||
        journeyType.includes(
          "foundation",
        ) ||
        journeyType.includes(
          "basic",
        ) ||
        journeyType.includes(
          "أساسيات",
        );

      const isAdvanced =
        journeyType.includes(
          "advanced",
        ) ||
        journeyType.includes(
          "متقدم",
        );

      const common = {
        enrollmentSource:
          enrollment.enrollment_source ===
          "reward"
            ? ("reward" as const)
            : ("paid" as const),

        status: String(
          enrollment.status ??
            "active",
        )
          .trim()
          .toLowerCase(),

        enrolledAt:
          enrollment.created_at,

        updatedAt:
          enrollment.updated_at ??
          null,

        courseId:
          enrollment.course_id,

        courseTitle,

        courseCode:
          course?.course_code?.trim() ||
          null,

        stationTitle:
          null,
      };

      /*
       * Split + Integrated يظهر كسطرين فعليين:
       * Fundamentals و Advanced.
       * لا ننشئ Enrollment إضافيًا في قاعدة البيانات.
       */
      if (
        isSplitCourse &&
        isIntegrated
      ) {
        return [
          {
            ...common,
            id:
              `${enrollment.id}:fundamentals`,
            journeyType:
              "fundamentals",
            progressPercent:
              getSplitProgress(
                "fundamentals",
              ),
            journeyCount: 1,
            journeyPart:
              "fundamentals" as const,
            journeyPartLabel:
              "الأساسيات",
          },
          {
            ...common,
            id:
              `${enrollment.id}:advanced`,
            journeyType:
              "advanced",
            progressPercent:
              getSplitProgress(
                "advanced",
              ),
            journeyCount: 1,
            journeyPart:
              "advanced" as const,
            journeyPartLabel:
              "المتقدم",
          },
        ];
      }

      if (
        isSplitCourse &&
        isFundamentals
      ) {
        return [
          {
            ...common,
            id:
              `${enrollment.id}:fundamentals`,
            journeyType:
              "fundamentals",
            progressPercent:
              getSplitProgress(
                "fundamentals",
              ),
            journeyCount: 1,
            journeyPart:
              "fundamentals" as const,
            journeyPartLabel:
              "الأساسيات",
          },
        ];
      }

      if (
        isSplitCourse &&
        isAdvanced
      ) {
        return [
          {
            ...common,
            id:
              `${enrollment.id}:advanced`,
            journeyType:
              "advanced",
            progressPercent:
              getSplitProgress(
                "advanced",
              ),
            journeyCount: 1,
            journeyPart:
              "advanced" as const,
            journeyPartLabel:
              "المتقدم",
          },
        ];
      }

      return [
        {
          ...common,
          id: enrollment.id,
          journeyType: String(
            enrollment.journey_type ??
              "integrated",
          ).trim(),
          progressPercent:
            baseProgress,
          journeyCount: 1,
          journeyPart:
            "single" as const,
          journeyPartLabel:
            null,
        },
      ];
    });

  const certificates: ImportedStudentPreviewCertificate[] =
    (
      certificatesResult.data ?? []
    ).map((certificate) => ({
      id: certificate.id,
      certificateNumber:
        certificate.certificate_number,
      courseTitle:
        certificate.course_title,
      issuedAt:
        certificate.issued_at,
      previewUrl:
        certificate.preview_url ??
        certificate.file_url ??
        null,
      pdfUrl:
        certificate.pdf_url ??
        certificate.file_url ??
        `/api/certificates/${certificate.id}/pdf`,
      isNew:
        Boolean(
          certificate.is_new,
        ),
    }));

  const surveys: ImportedStudentPreviewSurvey[] =
    (surveysResult.data ?? []).map(
      (survey) => ({
        id: survey.id,
        courseId:
          survey.course_id,
        rating: Math.max(
          0,
          Math.min(
            5,
            Number(
              survey.rating ?? 0,
            ),
          ),
        ),
        comment:
          survey.comment ?? null,
        submittedAt:
          survey.submitted_at ??
          null,
        showOnHome:
          Boolean(
            survey.show_on_home,
          ),
        showOnCourse:
          Boolean(
            survey.show_on_course,
          ),
      }),
    );

  const projects: ImportedStudentPreviewProject[] =
    (projectsResult.data ?? []).map(
      (project) => {
        const images = Array.isArray(
          project.project_images,
        )
          ? project.project_images
              .map((item) =>
                String(
                  item ?? "",
                ).trim(),
              )
              .filter(Boolean)
          : [];

        return {
          id: project.id,
          courseTitle:
            project.course_title?.trim() ||
            "—",
          projectTitle:
            project.project_title?.trim() ||
            "مشروع الطالب",
          projectDescription:
            project.project_description ??
            null,
          images,
          coverImage:
            project.cover_image ??
            images[0] ??
            null,
          createdAt:
            project.created_at ??
            null,
        };
      },
    );

  const passport =
    await getMasarPassportForRegistry(
      registry.id,
    );

  return {
    registryId: registry.id,
    masarId: Number(
      registry.masar_id,
    ),
    studentName:
      registry.student_name?.trim() ||
      "طالب مستورد",
    studentEmail: email,
    userId:
      registry.user_id ?? null,
    isLinkedToAccount:
      Boolean(
        registry.user_id,
      ),
    createdAt:
      registry.created_at,
    updatedAt:
      registry.updated_at,
    journeys,
    certificates,
    surveys,
    projects,
    passport,
  };
}

/* =========================================================
   UPDATE IMPORTED STUDENT JOURNEY PROGRESS
========================================================= */

export async function updateImportedStudentJourneyProgress(
  enrollmentId: string,
  journeyPart:
    | "single"
    | "fundamentals"
    | "advanced",
  progressPercent: number,
): Promise<{
  success: boolean;
  message: string;
}> {
  await requireAdmin();

  const normalizedEnrollmentId =
    enrollmentId?.trim();

  if (!normalizedEnrollmentId) {
    return {
      success: false,
      message:
        "معرّف الرحلة غير موجود.",
    };
  }

  if (
    ![
      "single",
      "fundamentals",
      "advanced",
    ].includes(
      journeyPart,
    )
  ) {
    return {
      success: false,
      message:
        "جزء الرحلة غير صحيح.",
    };
  }

  const numericProgress =
    Math.round(
      Number(progressPercent),
    );

  if (
    !Number.isFinite(
      numericProgress,
    ) ||
    numericProgress < 0 ||
    numericProgress > 100
  ) {
    return {
      success: false,
      message:
        "نسبة التقدم يجب أن تكون من 0 إلى 100.",
    };
  }

  const admin =
    createAdminClient();

  const {
    data: enrollment,
    error: enrollmentError,
  } = await admin
    .from("enrollments")
    .select(
      `
        id,
        student_email,
        user_id,
        source,
        progress_percent,
        split_progress,
        journey_type,
        courses (
          level
        )
      `,
    )
    .eq(
      "id",
      normalizedEnrollmentId,
    )
    .maybeSingle();

  if (enrollmentError) {
    return {
      success: false,
      message:
        enrollmentError.message,
    };
  }

  if (!enrollment) {
    return {
      success: false,
      message:
        "تعذر العثور على الرحلة.",
    };
  }

  if (
    String(
      enrollment.source ?? "",
    )
      .trim()
      .toLowerCase() !==
    "admin_import"
  ) {
    return {
      success: false,
      message:
        "يمكن تعديل تقدم الرحلات المستوردة فقط من هذه الشاشة.",
    };
  }

  /*
   * بعد ارتباط الطالب بحساب فعلي يصبح تقدم المنصة الحقيقي
   * (lesson_progress / student_course_progress) هو مصدر الحقيقة.
   */
  if (enrollment.user_id) {
    return {
      success: false,
      message:
        "الطالب أصبح مرتبطًا بحساب حقيقي. يتم احتساب تقدمه من المنصة ولا يمكن تعديله من شاشة الاستيراد.",
    };
  }

  const courseValue =
    Array.isArray(
      enrollment.courses,
    )
      ? enrollment.courses[0]
      : enrollment.courses;

  const isSplitCourse =
    String(
      courseValue?.level ?? "",
    )
      .trim()
      .toLowerCase() ===
    "split";

  const now =
    new Date().toISOString();

  let updatePayload:
    Record<
      string,
      unknown
    >;

  if (
    isSplitCourse &&
    journeyPart !== "single"
  ) {
    const existingSplit =
      enrollment.split_progress &&
      typeof enrollment.split_progress ===
        "object" &&
      !Array.isArray(
        enrollment.split_progress,
      )
        ? {
            ...(enrollment.split_progress as Record<
              string,
              unknown
            >),
          }
        : {};

    const baseProgress =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            enrollment.progress_percent ??
              0,
          ),
        ),
      );

    const fundamentalsBefore =
      Number(
        existingSplit.fundamentals ??
          existingSplit.fundamental ??
          baseProgress,
      );

    const advancedBefore =
      Number(
        existingSplit.advanced ??
          baseProgress,
      );

    existingSplit[
      journeyPart
    ] = numericProgress;

    /*
     * نحافظ أيضًا على progress_percent كملخص للكورس
     * حتى لا تتأثر أي شاشة قديمة ما زالت تقرأه.
     */
    const fundamentalsAfter =
      journeyPart ===
      "fundamentals"
        ? numericProgress
        : fundamentalsBefore;

    const advancedAfter =
      journeyPart ===
      "advanced"
        ? numericProgress
        : advancedBefore;

    const summaryProgress =
      Math.round(
        (
          Math.max(
            0,
            Math.min(
              100,
              fundamentalsAfter,
            ),
          ) +
          Math.max(
            0,
            Math.min(
              100,
              advancedAfter,
            ),
          )
        ) / 2,
      );

    updatePayload = {
      split_progress:
        existingSplit,
      progress_percent:
        summaryProgress,
      updated_at: now,
    };
  } else {
    updatePayload = {
      progress_percent:
        numericProgress,
      updated_at: now,
    };
  }

  const {
    error: updateError,
  } = await admin
    .from("enrollments")
    .update(
      updatePayload,
    )
    .eq(
      "id",
      normalizedEnrollmentId,
    )
    .eq(
      "source",
      "admin_import",
    );

  if (updateError) {
    return {
      success: false,
      message:
        updateError.message,
    };
  }

  const email =
    normalizeEmail(
      String(
        enrollment.student_email ??
          "",
      ),
    );

  let registryId:
    string | null = null;

  if (email) {
    const {
      data: registry,
    } = await admin
      .from(
        "student_registry",
      )
      .select("id")
      .eq(
        "normalized_email",
        email,
      )
      .maybeSingle();

    registryId =
      registry?.id ?? null;
  }

  revalidatePath(
    "/admin/student-import",
  );

  if (registryId) {
    revalidatePath(
      `/admin/student-import/${registryId}`,
    );
  }

  revalidatePath(
    "/admin/content/monthly-draw",
  );

  return {
    success: true,
    message:
      `تم تحديث نسبة التقدم إلى ${numericProgress}%.`,
  };
}

export async function deleteImportedStudent(
  registryId: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  await requireAdmin();

  if (!registryId?.trim()) {
    return {
      success: false,
      message: "معرّف الطالب غير موجود.",
    };
  }

  const admin = createAdminClient();

  const {
    data: registry,
    error: registryError,
  } = await admin
    .from("student_registry")
    .select(
      "id,email,normalized_email,user_id",
    )
    .eq("id", registryId)
    .maybeSingle();

  if (registryError) {
    return {
      success: false,
      message: registryError.message,
    };
  }

  if (!registry) {
    return {
      success: false,
      message: "لم يتم العثور على الطالب.",
    };
  }

  /*
   * لا نسمح من شاشة الاستيراد بحذف طالب
   * أصبح مرتبطًا بحساب حقيقي.
   */
  if (registry.user_id) {
    return {
      success: false,
      message:
        "لا يمكن حذف هذا الطالب من سجل الاستيراد لأنه أصبح مرتبطًا بحساب حقيقي.",
    };
  }

  const email = normalizeEmail(
    String(
      registry.email ??
        registry.normalized_email ??
        "",
    ),
  );

  if (!email) {
    return {
      success: false,
      message:
        "البريد الإلكتروني للطالب غير موجود.",
    };
  }

  /*
   * نحذف فقط البيانات التي مصدرها
   * admin_import.
   */

  const {
    error: certificatesError,
  } = await admin
    .from("certificates")
    .delete()
    .ilike("student_email", email)
    .eq("source", "admin_import");

  if (certificatesError) {
    return {
      success: false,
      message:
        certificatesError.message,
    };
  }

  const {
    error: projectsError,
  } = await admin
    .from("student_projects")
    .delete()
    .ilike("student_email", email)
    .eq("source", "admin_import");

  if (projectsError) {
    return {
      success: false,
      message:
        projectsError.message,
    };
  }

  const {
    error: surveysError,
  } = await admin
    .from("student_surveys")
    .delete()
    .ilike("student_email", email)
    .eq("source", "admin_import");

  if (surveysError) {
    return {
      success: false,
      message:
        surveysError.message,
    };
  }

  /*
   * enrollments نحذفه بعد الشهادات والمشاريع
   * لأن الجداول الأخرى قد تكون مرتبطة به.
   */
  const {
    error: enrollmentsError,
  } = await admin
    .from("enrollments")
    .delete()
    .ilike("student_email", email)
    .eq("source", "admin_import");

  if (enrollmentsError) {
    return {
      success: false,
      message:
        enrollmentsError.message,
    };
  }

  const {
    error: registryDeleteError,
  } = await admin
    .from("student_registry")
    .delete()
    .eq("id", registryId)
    .is("user_id", null);

  if (registryDeleteError) {
    return {
      success: false,
      message:
        registryDeleteError.message,
    };
  }

  revalidatePath(
    "/admin/student-import",
  );

  return {
    success: true,
    message:
      "تم حذف بيانات الطالب المستوردة بنجاح.",
  };
}