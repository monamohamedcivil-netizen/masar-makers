"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  Award,
  Eye,
  LoaderCircle,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";

import {
  getCourseStudentsForCertificates,
  issueCourseCertificate,
  reissueCourseCertificate,
  type CourseCertificateStudent,
} from "@/lib/actions/admin/course-certificates";

type CourseCertificateStudentsTableProps = {
  courseId: string;
  searchQuery: string;
  hasSavedTemplate: boolean;
};

type CertificateStatusView = {
  label: string;
  className: string;
};

const JOURNEY_LABELS: Record<string, string> = {
  fundamental: "الأساسيات",
  advanced: "المتقدم",
  integrated: "المتكامل",
};

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

function getJourneyLabel(student: CourseCertificateStudent) {
  return (
    student.actionTitle?.trim() ||
    student.journeyTitle?.trim() ||
    JOURNEY_LABELS[student.journeyType] ||
    student.journeyType
  );
}

function getCertificateStatusView(
  status: string | null,
  certificateId: string | null,
): CertificateStatusView {
  const normalizedStatus = status?.trim().toLowerCase();

  if (certificateId || normalizedStatus === "issued") {
    return {
      label: "صدرت",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (normalizedStatus === "ready") {
    return {
      label: "جاهزة للإصدار",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  return {
    label: "لم تصدر",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function formatIssuedDate(value: string | null) {
  if (!value) return null;

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export default function CourseCertificateStudentsTable({
  courseId,
  searchQuery,
  hasSavedTemplate,
}: CourseCertificateStudentsTableProps) {
  const [students, setStudents] = useState<
    CourseCertificateStudent[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const [issuingEnrollmentId, setIssuingEnrollmentId] =
    useState<string | null>(null);

  function handleIssueCertificate(
    student: CourseCertificateStudent,
  ) {
  if (!hasSavedTemplate) {
    alert("يجب حفظ قالب الشهادة أولًا.");
    return;
  }

  setIssuingEnrollmentId(student.enrollmentId);

   startTransition(async () => {
  const result = await issueCourseCertificate({
    enrollmentId: student.enrollmentId,
    certificateType: student.journeyType as
      | "fundamental"
      | "advanced",
  });

  if (!result.success) {
    alert(result.message || "تعذر إصدار الشهادة.");
    setIssuingEnrollmentId(null);
    return;
  }

  setStudents((currentStudents) =>
    currentStudents.map((currentStudent) =>
      currentStudent.enrollmentId === student.enrollmentId
        ? {
            ...currentStudent,
            certificateId:
              result.data?.certificateId ??
              currentStudent.certificateId,
            certificateStatus: "issued",
            certificateIssuedAt:
              result.data?.issuedAt ??
              new Date().toISOString(),
          }
        : currentStudent,
    ),
  );

  alert("تم إصدار الشهادة بنجاح.");
  setIssuingEnrollmentId(null);
});
  }

  function handleReissueCertificate(
  student: CourseCertificateStudent,
) {
  setIssuingEnrollmentId(student.enrollmentId);

  startTransition(async () => {
    const result = await reissueCourseCertificate({
  enrollmentId: student.enrollmentId,
  certificateType: student.journeyType,
});

    if (!result.success) {
      alert(result.message || "تعذر إعادة إصدار الشهادة.");
      setIssuingEnrollmentId(null);
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.enrollmentId === student.enrollmentId
          ? {
              ...currentStudent,
              certificateIssuedAt:
                result.data?.issuedAt ??
                new Date().toISOString(),
            }
          : currentStudent,
      ),
    );

    alert("تمت إعادة إصدار الشهادة بنجاح.");
    setIssuingEnrollmentId(null);
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      setIsLoading(true);
      setLoadError(null);

      const result = await getCourseStudentsForCertificates(courseId);

      if (!isMounted) return;

      if (result.success) {
        setStudents(result.data ?? []);
      } else {
        setStudents([]);
        setLoadError(result.message);
      }

      setIsLoading(false);
    }

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);

    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        student.studentName,
        student.studentEmail,
        student.courseTitle,
        student.journeyTitle,
        student.actionTitle,
        student.journeyType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ar");

      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, students]);

  if (isLoading) {
    return (
      <div className="mt-5 flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#F7B548]" />
          <p className="mt-3 text-sm font-bold text-slate-500">
            جارٍ تحميل طلاب الكورس...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
        <p className="font-black text-red-700">
          تعذر تحميل قائمة الطلاب
        </p>
        <p className="mt-2 text-sm leading-6 text-red-600">
          {loadError}
        </p>
      </div>
    );
  }

  if (students.length == 0) {
    return (
      <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <UserRound className="h-10 w-10 text-slate-400" />
        <h3 className="mt-3 font-black text-[#07152E]">
          لا يوجد طلاب مؤهلون حاليًا
        </h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
          ستظهر هنا الاشتراكات النشطة من أنواع الأساسيات والمتقدم
          والمتكامل عند إضافتها لهذا الكورس.
        </p>
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    return (
      <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <UserRound className="h-9 w-9 text-slate-400" />
        <h3 className="mt-3 font-black text-[#07152E]">
          لا توجد نتائج مطابقة
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          جرّبي البحث باسم آخر أو بالبريد الإلكتروني.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-black text-[#07152E]">
          عدد النتائج: {filteredStudents.length}
        </p>

        {!hasSavedTemplate ? (
          <p className="text-xs font-bold text-amber-700">
            احفظي قالب الشهادة قبل تفعيل الإصدار.
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-right">
          <thead className="bg-white">
            <tr className="border-b border-slate-200 text-xs font-black text-slate-500">
              <th className="px-4 py-3">الطالب</th>
              <th className="px-4 py-3">الرحلة</th>
              <th className="px-4 py-3">نوع الشهادة</th>
              <th className="px-4 py-3">التقدم</th>
              <th className="px-4 py-3">حالة الشهادة</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredStudents.map((student) => {
              const statusView = getCertificateStatusView(
                student.certificateStatus,
                student.certificateId,
              );
              const certificateWasIssued =
                Boolean(student.certificateId) ||
                student.certificateStatus?.toLowerCase() ===
                  "issued";
              const issuedDate = formatIssuedDate(
                student.certificateIssuedAt,
              );
              const progressPercent = Math.max(
                0,
                Math.min(100, student.progressPercent),
              );
const isIssuing =
  isPending &&
  issuingEnrollmentId === student.enrollmentId;
              return (
                <tr
                  key={student.enrollmentId}
                  className="align-middle transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07152E]/8 text-[#07152E]">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-56 truncate text-sm font-black text-[#07152E]">
                          {student.studentName}
                        </p>
                        <p className="mt-1 max-w-64 truncate text-xs text-slate-500">
                          {student.studentEmail || "بدون بريد إلكتروني"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-[#07152E]">
                      {getJourneyLabel(student)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {JOURNEY_LABELS[student.journeyType] ||
                        student.journeyType}
                    </p>
                  </td>
<td className="px-4 py-4">
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
      student.journeyType === "fundamental"
        ? "bg-sky-50 text-sky-700 border border-sky-200"
        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
    }`}
  >
    {student.journeyType === "fundamental"
      ? "Fundamentals (F)"
      : "Advanced (A)"}
  </span>
</td>
                  <td className="px-4 py-4">
                    <div className="w-40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#07152E]">
                          {progressPercent}%
                        </span>
                        <span className="text-slate-500">
                          {student.completedLessons}/{student.totalLessons}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#F7B548] transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusView.className}`}
                    >
                      {statusView.label}
                    </span>
                    {issuedDate ? (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {issuedDate}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {certificateWasIssued ? (
                        <>
                          <a
                            href={`/certificates/${student.certificateId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-[#07152E] transition hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            عرض
                          </a>

                          <button
                            type="button"
                            onClick={() => handleReissueCertificate(student)}
                            disabled={isPending}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isIssuing ? (
                              <>
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                جارٍ إعادة الإصدار...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3.5 w-3.5" />
                                إعادة إصدار
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                      <button
  type="button"
  onClick={() => handleIssueCertificate(student)}
  disabled={!hasSavedTemplate || isPending}
  title={
    !hasSavedTemplate
      ? "احفظي قالب الشهادة أولًا"
      : isIssuing
        ? "جارٍ إصدار الشهادة"
        : "إصدار شهادة الطالب"
  }
  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-xs font-black text-white transition hover:bg-[#10284d] disabled:cursor-not-allowed disabled:opacity-50"
>
  {isIssuing ? (
    <>
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      جارٍ الإصدار...
    </>
  ) : (
    <>
      {student.certificateStatus === "ready" ? (
        <Award className="h-3.5 w-3.5" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      إصدار
    </>
  )}
</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}