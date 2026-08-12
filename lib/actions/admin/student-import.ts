"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

import type {
  StudentImportRow,
} from "@/lib/import/types";

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
  station_id: string | null;
  level: "single" | "split" | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
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
 .select("id,title,slug,station_id,level")
  .ilike("slug", normalizedCode)
  .maybeSingle();

if (error) {
  throw new Error(error.message);
}

return (data as CourseRow | null) ?? null;
  
}
function resolveCertificateType(
  row: StudentImportRow,
  course: CourseRow,
): "fundamental" | "advanced" {
  if (course.level !== "split") {
    return "advanced";
  }

  const importedType = String(
    row.certificateType ?? "",
  )
    .trim()
    .toLowerCase();

  return importedType === "fundamental" ||
    importedType === "fundamentals"
    ? "fundamental"
    : "advanced";
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
const certificateType =
  resolveCertificateType(row, course);
  const { data: existing, error: existingError } =
    await admin
      .from("enrollments")
      .select("id")
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
   action_title: certificateType,

    status: "active",
    progress_percent: 0,

    source: "admin_import",
    source_reference: sourceReference,

    updated_at: now,
  };

  if (existing) {
    const { data, error } = await admin
      .from("enrollments")
      .update(payload)
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
}: {
  row: StudentImportRow;
  userId: string | null;
  enrollmentId: string;
  course: CourseRow;
  sourceReference: string;
  issuedBy: string;
}) {

if (
  course.level === "split" &&
  !row.certificateType
) {
  return;
}

  const admin = createAdminClient();
  const email = normalizeEmail(row.studentEmail);
  const now = new Date().toISOString();
const certificateType =
  resolveCertificateType(row, course);
 const { data: existing } = await admin
  .from("certificates")
  .select("id")
  .eq("enrollment_id", enrollmentId)
  .eq("certificate_type", certificateType)
  .maybeSingle();

  if (existing) return;

  const certificateNumber = [
    "MM",
    "IMPORT",
    new Date().getUTCFullYear(),
    crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase(),
  ].join("-");

  const verificationCode =
    crypto.randomUUID();

  const { data: certificate, error } =
    await admin
      .from("certificates")
      .insert({
        user_id: userId,
        enrollment_id: enrollmentId,

        course_id: course.id,
issued_by: issuedBy,
        certificate_number:
          certificateNumber,

        student_name: row.studentName,
        student_name_en:
          row.studentNameEn ||
          row.studentName,

        student_name_on_certificate:
          row.studentNameEn ||
          row.studentName,

        student_email: email,

        course_title:
          course.title?.trim() ||
          row.courseCode,

        course_title_en:
          course.title?.trim() ||
          row.courseCode,

       certificate_type: certificateType,

        issued_at: now,
        issue_date: now,

        status: "issued",
        is_new: true,

        verification_code:
          verificationCode,

        preview_url: null,
        pdf_url: null,

        notification_status:
          userId ? "pending" : "waiting_account",

        email_status: "pending",

        source: "admin_import",
        source_reference:
          sourceReference,

        metadata: {
          imported: true,
        },
      })
      .select("id")
      .single();

  if (error || !certificate) {
    throw new Error(
      error?.message ||
        "تعذر إنشاء الشهادة.",
    );
  }

  const { error: enrollmentError } =
    await admin
      .from("enrollments")
      .update({
        certificate_status: "issued",
        certificate_id: certificate.id,
        certificate_issued_at: now,
        updated_at: now,
      })
      .eq("id", enrollmentId);

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