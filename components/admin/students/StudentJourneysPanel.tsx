"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getStudentJourneys,
  type StudentJourneyRow,
  type StudentJourneysResult,
} from "@/lib/actions/admin/student-journeys";

interface StudentJourneysPanelProps {
  userId: string;
}

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف",
  career: "رحلة احتراف",
  professional: "رحلة احتراف",
  integrated: "رحلة احتراف متكاملة",
  fundamental: "أساسيات",
  fundamentals: "أساسيات",
  advanced: "متقدم",
  workshop: "رحلة يوم واحد",
  one_day: "رحلة يوم واحد",
  one_day_journey: "رحلة يوم واحد",
  one_day_workshop: "رحلة يوم واحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
  free_journey: "رحلة مجانية",
};

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  active: "نشط",
  enrolled: "نشط",
  confirmed: "نشط",
  completed: "مكتمل",
  rejected: "مرفوض",
  suspended: "موقوف",
  expired: "منتهي",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusClass(status: string) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    ["active", "approved", "enrolled", "confirmed"].includes(
      status,
    )
  ) {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getEnrollmentSourceLabel(
  source: StudentJourneyRow["enrollmentSource"],
) {
  if (source === "reward") {
    return "مكافأة";
  }

  if (source === "free") {
    return "مجاني";
  }

  return "مدفوع";
}

function getEnrollmentSourceClass(
  source: StudentJourneyRow["enrollmentSource"],
) {
  if (source === "reward") {
    return "bg-[#FFF1C7] text-[#B8790B]";
  }

  if (source === "free") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-sky-100 text-sky-700";
}

export default function StudentJourneysPanel({
  userId,
}: StudentJourneysPanelProps) {
  const [result, setResult] =
    useState<StudentJourneysResult | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadJourneys() {
      setIsLoading(true);
      setError("");

      const response =
        await getStudentJourneys(
          userId,
        );

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(
          response.message ||
            "تعذر تحميل رحلات الطالب.",
        );
      }

      setResult(response);
      setIsLoading(false);
    }

    void loadJourneys();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const journeys =
    useMemo<StudentJourneyRow[]>(
      () => result?.journeys ?? [],
      [result],
    );

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm font-black text-slate-500">
        جاري تحميل رحلات الطالب...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm font-black text-red-700">
        {error}
      </div>
    );
  }

  const statistics =
    result?.statistics ?? {
      total: 0,
      paid: 0,
      reward: 0,
      active: 0,
      completed: 0,
      pending: 0,
      professional: 0,
      oneDay: 0,
      free: 0,
      averageProgress: 0,
    };

  return (
    <div
      dir="rtl"
      className="space-y-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الرحلات"
          value={statistics.total}
        />

        <StatCard
          label="رحلات الاحتراف"
          value={statistics.professional}
        />

        <StatCard
          label="رحلات اليوم الواحد"
          value={statistics.oneDay}
        />

        <StatCard
          label="الرحلات المجانية"
          value={statistics.free}
        />

        <StatCard
          label="الرحلات النشطة"
          value={statistics.active}
        />

        <StatCard
          label="متوسط التقدم"
          value={`${statistics.averageProgress}%`}
        />

        <StatCard
          label="الرحلات المكتملة"
          value={statistics.completed}
        />

        <StatCard
          label="بانتظار الاعتماد"
          value={statistics.pending}
          highlighted
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="اشتراكات مدفوعة"
          value={statistics.paid}
        />

        <StatCard
          label="رحلات كمكافأة"
          value={statistics.reward}
          highlighted
        />
      </div>

      {journeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-sm font-black text-slate-500">
          لا توجد رحلات مسجلة لهذا الطالب.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-right">
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>
                    الكورس
                  </TableHead>

                  <TableHead>
                    المحطة
                  </TableHead>

                  <TableHead>
                    نوع الرحلة
                  </TableHead>

                  <TableHead>
                    نوع الاشتراك
                  </TableHead>

                  <TableHead>
                    الحالة
                  </TableHead>

                  <TableHead>
                    التقدم الحقيقي
                  </TableHead>

                  <TableHead>
                    التقدم المستورد
                  </TableHead>

                  <TableHead>
                    التقدم النهائي
                  </TableHead>

                  <TableHead>
                    تاريخ الاشتراك
                  </TableHead>

                  <TableHead>
                    آخر تحديث
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {journeys.map(
                  (journey) => (
                    <tr
                      key={journey.id}
                      className={`border-t border-slate-100 ${
                        journey.enrollmentSource ===
                        "reward"
                          ? "bg-[#FFFDF5]"
                          : "bg-white"
                      }`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-black text-[#07152E]">
                            {
                              journey.courseTitle
                            }
                          </p>

                          {journey.courseCode ? (
                            <p className="mt-1 text-[10px] font-black text-[#C88712]">
                              {
                                journey.courseCode
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        {journey.stationTitle ??
                          "—"}
                      </TableCell>

                      <TableCell>
                        {journeyLabels[
                          journey.journeyType.toLowerCase()
                        ] ??
                          journey.journeyType}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getEnrollmentSourceClass(
                            journey.enrollmentSource,
                          )}`}
                        >
                          {getEnrollmentSourceLabel(
                            journey.enrollmentSource,
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            journey.status,
                          )}`}
                        >
                          {statusLabels[
                            journey.status
                          ] ??
                            journey.status}
                        </span>
                      </TableCell>

                      <ProgressCell
                        value={
                          journey.realProgressPercent
                        }
                        tone="real"
                      />

                      <ProgressCell
                        value={
                          journey.importedProgressPercent
                        }
                        tone="imported"
                      />

                      <ProgressCell
                        value={
                          journey.progressPercent
                        }
                        tone="final"
                      />

                      <TableCell>
                        {formatDate(
                          journey.enrolledAt,
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          journey.updatedAt,
                        )}
                      </TableCell>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number | string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        highlighted
          ? "border-[#F7B548]/50 bg-[#FFF8E9]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-2xl font-black text-[#07152E]">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-black text-slate-500">
        {label}
      </p>
    </div>
  );
}

function ProgressCell({
  value,
  tone,
}: {
  value: number;
  tone:
    | "real"
    | "imported"
    | "final";
}) {
  const safeValue = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(value ?? 0),
      ),
    ),
  );

  const barClass =
    tone === "final"
      ? "bg-[#F7B548]"
      : tone === "imported"
        ? "bg-violet-500"
        : "bg-sky-500";

  const labelClass =
    tone === "final"
      ? "text-[#B8790B]"
      : tone === "imported"
        ? "text-violet-700"
        : "text-sky-700";

  return (
    <TableCell>
      <div className="min-w-[135px]">
        <div
          className={`mb-1 text-center text-xs font-black ${labelClass}`}
        >
          {safeValue}%
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full ${barClass}`}
            style={{
              width: `${safeValue}%`,
            }}
          />
        </div>
      </div>
    </TableCell>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-black text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold text-slate-600">
      {children}
    </td>
  );
}