"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Eye, Loader2, Mail, PauseCircle, PlayCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  reactivateEnrollment,
  suspendEnrollment,
  type AdminEnrollmentRequest,
} from "@/lib/actions/admin/enrollments";

type Mode = "active" | "suspended";

interface Props {
  enrollments: AdminEnrollmentRequest[];
  mode: Mode;
}

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف",
  career: "رحلة احتراف",
  professional: "رحلة احتراف",
  integrated: "رحلة احتراف",
  fundamental: "رحلة احتراف",
  fundamentals: "رحلة احتراف",
  advanced: "رحلة احتراف",
  workshop: "رحلة يوم واحد",
  one_day: "رحلة يوم واحد",
  one_day_journey: "رحلة يوم واحد",
  one_day_workshop: "رحلة يوم واحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
  free_journey: "رحلة مجانية",
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function EnrollmentStatusStudentsTable({
  enrollments,
  mode,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return enrollments;

    return enrollments.filter((item) =>
      [
        item.student.name,
        item.student.email,
        item.student.phone,
        item.course.title,
        item.station.title,
        item.journeyType,
        item.actionTitle,
        item.actionKey,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [enrollments, searchTerm]);

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ابحث باسم الطالب أو البريد أو الكورس..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
          />
        </div>

        <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#07152E]">
          {filtered.length} اشتراك
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[340px] items-center justify-center p-6">
          <div className="text-center">
            <p className="font-black text-[#07152E]">
              {mode === "active"
                ? "لا توجد اشتراكات نشطة"
                : "لا توجد اشتراكات موقوفة"}
            </p>

            <p className="mt-2 text-sm font-bold text-slate-400">
              {mode === "active"
                ? "ستظهر هنا الرحلات التي يملك الطلاب وصولًا نشطًا إليها."
                : "عند إيقاف أي اشتراك سيظهر هنا تلقائيًا."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] text-right">
            <thead className="bg-slate-50">
              <tr>
                <TableHead>الطالب</TableHead>
                <TableHead>الكورس</TableHead>
                <TableHead>المحطة</TableHead>
                <TableHead>نوع الرحلة</TableHead>
                <TableHead>العنصر / القسم</TableHead>
                <TableHead>نوع الاشتراك</TableHead>
                <TableHead>
                  {mode === "active"
                    ? "تاريخ التفعيل"
                    : "آخر تحديث"}
                </TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إدارة الاشتراك</TableHead>
                <TableHead>الطالب</TableHead>
              </tr>
            </thead>

            <tbody>
              {filtered.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <StudentIdentity enrollment={enrollment} />
                  </td>

                  <TableCell>
                    <div>
                      <p className="font-black text-[#07152E]">
                        {enrollment.course.title || "—"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {enrollment.station.title || "—"}
                  </TableCell>

                  <TableCell>
                    {journeyLabels[
                      enrollment.journeyType
                        .trim()
                        .toLowerCase()
                        .replaceAll("-", "_")
                    ] ?? enrollment.journeyType}
                  </TableCell>

                  <TableCell>
                    <div className="max-w-[260px]">
                      <p className="font-black text-[#07152E]">
                        {enrollment.actionTitle ||
                          enrollment.course.title ||
                          "—"}
                      </p>

                      {enrollment.actionKey ? (
                        <p
                          title={enrollment.actionKey}
                          className="mt-1 truncate font-mono text-[10px] text-slate-400"
                        >
                          {enrollment.actionKey}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        enrollment.enrollmentSource === "reward"
                          ? "bg-[#FFF5DD] text-[#B8790B]"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {enrollment.enrollmentSource === "reward"
                        ? "مكافأة"
                        : "مدفوع"}
                    </span>
                  </TableCell>

                  <TableCell>
                    {formatDate(
                      enrollment.updatedAt ||
                        enrollment.createdAt,
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        mode === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {mode === "active" ? "نشط" : "موقوف"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <EnrollmentStatusAction
                      enrollmentId={enrollment.id}
                      mode={mode}
                    />
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/students/${enrollment.userId}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0B2146]"
                    >
                      <Eye size={15} />
                      عرض
                    </Link>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EnrollmentStatusAction({
  enrollmentId,
  mode,
}: {
  enrollmentId: string;
  mode: Mode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleClick = () => {
    const message =
      mode === "active"
        ? "هل تريد إيقاف هذا الاشتراك؟ سيُمنع الطالب من الوصول لهذه الرحلة فقط، ولن تُحذف بياناته أو تقدمه."
        : "هل تريد إعادة تفعيل هذا الاشتراك؟ سيستعيد الطالب الوصول إلى الرحلة.";

    if (!window.confirm(message)) return;

    setError("");

    startTransition(async () => {
      const result =
        mode === "active"
          ? await suspendEnrollment(enrollmentId)
          : await reactivateEnrollment(enrollmentId);

      if (!result.success) {
        setError(
          result.message ||
            "تعذر تحديث حالة الاشتراك.",
        );
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="min-w-[150px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-60 ${
          mode === "active"
            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "active" ? (
          <PauseCircle className="h-4 w-4" />
        ) : (
          <PlayCircle className="h-4 w-4" />
        )}

        {mode === "active"
          ? "إيقاف الاشتراك"
          : "إعادة التفعيل"}
      </button>

      {error ? (
        <p className="mt-2 max-w-[220px] text-[10px] font-bold leading-4 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StudentIdentity({
  enrollment,
}: {
  enrollment: AdminEnrollmentRequest;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-base font-black text-[#F7B548]">
        {enrollment.student.name
          .trim()
          .charAt(0) || "؟"}
      </div>

      <div className="min-w-0">
        <div className="max-w-[250px] truncate font-black text-[#07152E]">
          {enrollment.student.name}
        </div>

        <div className="mt-1 flex max-w-[270px] items-center gap-1 truncate text-xs font-bold text-slate-500">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {enrollment.student.email || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-black text-[#07152E]">
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