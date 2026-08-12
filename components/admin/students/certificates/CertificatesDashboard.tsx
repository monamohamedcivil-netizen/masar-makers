"use client";

import Link from "next/link";
import {
  Award,
  Download,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  issueCourseCertificate,
  reissueCourseCertificate,
} from "@/lib/actions/admin/course-certificates";

import type {
  CertificatesDashboardData,
  CertificatesDashboardRow,
} from "@/lib/actions/admin/certificates-dashboard";

type TabId = "pending" | "issued";

interface CertificatesDashboardProps {
  initialData: CertificatesDashboardData;
}

const CERTIFICATE_LABELS: Record<string, string> = {
  fundamental: "Fundamentals",
  advanced: "Advanced",
};

const JOURNEY_LABELS: Record<string, string> = {
  fundamental: "الأساسيات",
  advanced: "المتقدم",
  integrated: "المتكامل",
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("ar") ?? "";
}

function isIssued(row: CertificatesDashboardRow) {
  return (
    Boolean(row.certificateId) ||
    normalize(row.certificateStatus) === "issued"
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getJourneyLabel(row: CertificatesDashboardRow) {
  return (
    row.actionTitle?.trim() ||
    row.journeyTitle?.trim() ||
    JOURNEY_LABELS[row.journeyType] ||
    row.journeyType
  );
}

function getCertificateLabel(row: CertificatesDashboardRow) {
  return (
    CERTIFICATE_LABELS[row.certificateType] ||
    row.certificateType
  );
}

export default function CertificatesDashboard({
  initialData,
}: CertificatesDashboardProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<TabId>("pending");

  const [pathFilter, setPathFilter] =
    useState("all");

  const [search, setSearch] = useState("");

  const [
    processingKey,
    setProcessingKey,
  ] = useState<string | null>(null);

  const [
    bulkReport,
    setBulkReport,
  ] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const visibleRows = useMemo(() => {
    const normalizedSearch = normalize(search);

    return initialData.rows.filter((row) => {
      const matchesTab =
        activeTab === "issued"
          ? isIssued(row)
          : !isIssued(row);

      const matchesPath =
        pathFilter === "all" ||
        (row.pathId ?? "unassigned") === pathFilter;

      const searchValue = normalize(
        [
          row.studentName,
          row.studentEmail,
          row.pathTitle,
          row.courseTitle,
          row.courseCode,
          row.journeyTitle,
          row.actionTitle,
          row.certificateNumber,
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSearch =
        !normalizedSearch ||
        searchValue.includes(normalizedSearch);

      return (
        matchesTab &&
        matchesPath &&
        matchesSearch
      );
    });
  }, [
    activeTab,
    initialData.rows,
    pathFilter,
    search,
  ]);

  const pendingFilteredRows = useMemo(
    () =>
      visibleRows.filter(
        (row) => !isIssued(row),
      ),
    [visibleRows],
  );

  function handleIssue(
    row: CertificatesDashboardRow,
  ) {
    const key =
      `${row.enrollmentId}:${row.certificateType}`;

    setProcessingKey(key);
    setBulkReport(null);

    startTransition(async () => {
      const result =
        await issueCourseCertificate({
          enrollmentId: row.enrollmentId,
          certificateType: row.certificateType,
        });

      setProcessingKey(null);

      window.alert(
        result.success
          ? result.warning
            ? `${result.message}\n${result.warning}`
            : result.message
          : result.message,
      );

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleReissue(
    row: CertificatesDashboardRow,
  ) {
    const confirmed = window.confirm(
      `هل تريدين إعادة إصدار شهادة ${row.studentName}؟`,
    );

    if (!confirmed) return;

    const key =
      `${row.enrollmentId}:${row.certificateType}`;

    setProcessingKey(key);
    setBulkReport(null);

    startTransition(async () => {
      const result =
        await reissueCourseCertificate({
          enrollmentId: row.enrollmentId,
          certificateType: row.certificateType,
        });

      setProcessingKey(null);

      window.alert(
        result.success
          ? result.warning
            ? `${result.message}\n${result.warning}`
            : result.message
          : result.message,
      );

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleIssueAll() {
    if (pendingFilteredRows.length === 0) {
      window.alert(
        "لا توجد شهادات مستحقة ضمن الفلتر الحالي.",
      );
      return;
    }

    const confirmed = window.confirm(
      `سيتم إصدار ${pendingFilteredRows.length} شهادة بالتتابع. هل تريدين المتابعة؟`,
    );

    if (!confirmed) return;

    setBulkReport(null);
    setProcessingKey("bulk");

    startTransition(async () => {
      let success = 0;
      let failed = 0;

      for (const row of pendingFilteredRows) {
        const result =
          await issueCourseCertificate({
            enrollmentId: row.enrollmentId,
            certificateType: row.certificateType,
          });

        if (result.success) {
          success += 1;
        } else {
          failed += 1;
          console.error(
            "BULK CERTIFICATE ISSUE FAILED",
            row,
            result.message,
          );
        }
      }

      setProcessingKey(null);
      setBulkReport({
        success,
        failed,
      });

      router.refresh();
    });
  }

  return (
    <section dir="rtl" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="الشهادات المستحقة"
          value={initialData.statistics.pending}
        />

        <SummaryCard
          label="الشهادات الصادرة"
          value={initialData.statistics.issued}
        />

        <SummaryCard
          label="صادرة هذا الشهر"
          value={initialData.statistics.issuedThisMonth}
        />

        <SummaryCard
          label="كورسات بها شهادات مستحقة"
          value={initialData.statistics.pendingCourses}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            active={pathFilter === "all"}
            onClick={() => setPathFilter("all")}
          >
            الكل ({initialData.rows.length})
          </FilterButton>

          {initialData.paths.map((path) => (
            <FilterButton
              key={path.id}
              active={pathFilter === path.id}
              onClick={() =>
                setPathFilter(path.id)
              }
            >
              {path.title} ({path.count})
            </FilterButton>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() =>
                setActiveTab("pending")
              }
              className={`px-5 py-3 text-sm font-black transition ${
                activeTab === "pending"
                  ? "bg-[#07152E] text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              مستحقة للإصدار
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("issued")
              }
              className={`px-5 py-3 text-sm font-black transition ${
                activeTab === "issued"
                  ? "bg-[#07152E] text-white"
                  : "bg-white text-slate-500"
              }`}
            >
              الشهادات الصادرة
            </button>
          </div>

          <div className="flex flex-1 flex-wrap justify-end gap-3">
            <label className="flex min-w-[280px] max-w-xl flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="بحث باسم الطالب أو الكورس أو كود الكورس..."
                className="h-11 w-full bg-transparent px-3 text-sm font-bold text-[#07152E] outline-none"
              />
            </label>

            {activeTab === "pending" ? (
              <button
                type="button"
                onClick={handleIssueAll}
                disabled={
                  isPending ||
                  pendingFilteredRows.length === 0
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 text-sm font-black text-[#07152E] transition hover:bg-[#FFC966] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingKey === "bulk" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                إصدار جميع المستحقة
              </button>
            ) : null}
          </div>
        </div>

        {bulkReport ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700">
            نجح: {bulkReport.success} — فشل:{" "}
            {bulkReport.failed}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visibleRows.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center p-6 text-center font-bold text-slate-500">
            لا توجد شهادات مطابقة.
          </div>
        ) : activeTab === "pending" ? (
          <PendingTable
            rows={visibleRows}
            processingKey={processingKey}
            onIssue={handleIssue}
          />
        ) : (
          <IssuedTable
            rows={visibleRows}
            processingKey={processingKey}
            onReissue={handleReissue}
          />
        )}
      </div>
    </section>
  );
}

function PendingTable({
  rows,
  processingKey,
  onIssue,
}: {
  rows: CertificatesDashboardRow[];
  processingKey: string | null;
  onIssue: (
    row: CertificatesDashboardRow,
  ) => void;
}) {
  return (
    <TableShell
      headers={[
        "الطالب",
        "المسار",
        "الكورس",
        "كود الكورس",
        "نوع الرحلة",
        "نوع الشهادة",
        "حالة الاستحقاق",
        "التقدم",
        "الإجراءات",
      ]}
    >
      {rows.map((row) => {
        const key =
          `${row.enrollmentId}:${row.certificateType}`;

        return (
          <tr
            key={key}
            className="border-t border-slate-100"
          >
            <StudentCell row={row} />

            <Cell>{row.pathTitle}</Cell>

            <Cell>{row.courseTitle}</Cell>

            <Cell>
              <CodeBadge value={row.courseCode} />
            </Cell>

            <Cell>{getJourneyLabel(row)}</Cell>

            <Cell>
              {getCertificateLabel(row)}
            </Cell>

            <Cell>
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                جاهزة للإصدار
              </span>
            </Cell>

            <Cell>{row.progressPercent}%</Cell>

            <Cell>
              <button
                type="button"
                onClick={() => onIssue(row)}
                disabled={
                  processingKey === key ||
                  processingKey === "bulk"
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#07152E] px-4 text-xs font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E] disabled:opacity-50"
              >
                {processingKey === key ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Award className="h-4 w-4" />
                )}

                إصدار
              </button>
            </Cell>
          </tr>
        );
      })}
    </TableShell>
  );
}

function IssuedTable({
  rows,
  processingKey,
  onReissue,
}: {
  rows: CertificatesDashboardRow[];
  processingKey: string | null;
  onReissue: (
    row: CertificatesDashboardRow,
  ) => void;
}) {
  return (
    <TableShell
      headers={[
        "الطالب",
        "المسار",
        "الكورس",
        "كود الكورس",
        "نوع الشهادة",
        "تاريخ الإصدار",
        "رقم الشهادة",
        "الإجراءات",
      ]}
    >
      {rows.map((row) => {
        const key =
          `${row.enrollmentId}:${row.certificateType}`;

        return (
          <tr
            key={key}
            className="border-t border-slate-100"
          >
            <StudentCell row={row} />

            <Cell>{row.pathTitle}</Cell>

            <Cell>{row.courseTitle}</Cell>

            <Cell>
              <CodeBadge value={row.courseCode} />
            </Cell>

            <Cell>
              {getCertificateLabel(row)}
            </Cell>

            <Cell>
              {formatDate(
                row.certificateIssuedAt,
              )}
            </Cell>

            <Cell>
              <span className="font-black text-[#07152E]">
                {row.certificateNumber ?? "—"}
              </span>
            </Cell>

            <Cell>
              <div className="flex items-center justify-center gap-2">
                {row.certificateId ? (
                  <>
                    <Link
                      href={`/certificates/${row.certificateId}`}
                      target="_blank"
                      title="عرض"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    <a
                      href={`/api/certificates/${row.certificateId}/pdf`}
                      title="تحميل"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    onReissue(row)
                  }
                  disabled={
                    processingKey === key
                  }
                  title="إعادة إصدار"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {processingKey === key ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  إعادة إصدار
                </button>
              </div>
            </Cell>
          </tr>
        );
      })}
    </TableShell>
  );
}

function StudentCell({
  row,
}: {
  row: CertificatesDashboardRow;
}) {
  return (
    <td className="px-4 py-4">
      <div className="min-w-[190px] text-right">
        <Link
          href={`/admin/students/${row.studentId}`}
          className="font-black text-[#07152E] hover:text-[#C88712]"
        >
          {row.studentName}
        </Link>

        <p className="mt-1 text-[10px] font-bold text-slate-400">
          {row.studentEmail || "—"}
        </p>
      </div>
    </td>
  );
}

function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1250px] text-center">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-4 py-4 text-xs font-black text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-600">
      {children}
    </td>
  );
}

function CodeBadge({
  value,
}: {
  value: string | null;
}) {
  return (
    <span className="inline-flex rounded-lg bg-[#FFF5DD] px-3 py-1 text-xs font-black text-[#C88712]">
      {value || "—"}
    </span>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-[#07152E] text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#07152E]">
        {value}
      </p>
    </div>
  );
}