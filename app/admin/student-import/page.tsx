"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  GraduationCap,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  readImportExcel,
} from "@/lib/import/readExcel";

import type {
  StudentImportRow,
} from "@/lib/import/types";

import {
  deleteImportedStudent,
  getImportedStudents,
  importStudentRows,
} from "@/lib/actions/admin/student-import";

import type {
  ImportedStudentListItem,
  StudentImportResult,
} from "@/lib/actions/admin/student-import";

interface PreviewRow extends StudentImportRow {
  rowNumber: number;
  errors: string[];
}

function validateRow(
  row: StudentImportRow,
  rowNumber: number,
): PreviewRow {
  const errors: string[] = [];

  if (!row.studentName) {
    errors.push("اسم الطالب مطلوب");
  }

  if (!row.studentEmail) {
    errors.push(
      "البريد الإلكتروني مطلوب",
    );
  }

  if (
    row.studentEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      row.studentEmail,
    )
  ) {
    errors.push(
      "البريد الإلكتروني غير صحيح",
    );
  }

  if (!row.courseCode) {
    errors.push("كود الكورس مطلوب");
  }

  if (!row.journeyType) {
    errors.push("نوع الرحلة مطلوب");
  }

  if (
    row.rating &&
    (row.rating < 1 || row.rating > 5)
  ) {
    errors.push(
      "التقييم يجب أن يكون من 1 إلى 5",
    );
  }

  return {
    ...row,
    rowNumber,
    errors,
  };
}

export default function StudentImportPage() {
  const [fileName, setFileName] =
    useState("");

  const [rows, setRows] =
    useState<PreviewRow[]>([]);

  const [isReading, setIsReading] =
    useState(false);

  const [fileError, setFileError] =
    useState("");

  const [importResult, setImportResult] =
    useState<StudentImportResult | null>(
      null,
    );

  const [importedStudents, setImportedStudents] =
    useState<ImportedStudentListItem[]>([]);

  const [
    isLoadingImportedStudents,
    setIsLoadingImportedStudents,
  ] = useState(false);

  const [
    importedStudentsError,
    setImportedStudentsError,
  ] = useState("");

  const [
    isImporting,
    startImportTransition,
  ] = useTransition();

  async function loadImportedStudents() {
    setIsLoadingImportedStudents(true);
    setImportedStudentsError("");

    try {
      const data =
        await getImportedStudents();

      setImportedStudents(data);
    } catch (error) {
      setImportedStudents([]);

      setImportedStudentsError(
        error instanceof Error
          ? error.message
          : "تعذر تحميل سجل بيانات الاستيراد.",
      );
    } finally {
      setIsLoadingImportedStudents(false);
    }
  }

  useEffect(() => {
    void loadImportedStudents();
  }, []);

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setFileError("");
    setRows([]);
    setImportResult(null);

    if (
      !file.name
        .toLowerCase()
        .endsWith(".xlsx")
    ) {
      setFileName("");

      setFileError(
        "يرجى اختيار ملف Excel بصيغة XLSX",
      );

      return;
    }

    try {
      setIsReading(true);
      setFileName(file.name);

      const importedRows =
        await readImportExcel(file);

      const previewRows =
        importedRows.map(
          (row, index) =>
            validateRow(
              row,
              index + 2,
            ),
        );

      setRows(previewRows);
    } catch {
      setFileName("");
      setRows([]);

      setFileError(
        "تعذر قراءة ملف Excel",
      );
    } finally {
      setIsReading(false);
    }
  }

  const statistics = useMemo(() => {
    const students = new Set(
      rows
        .map(
          (row) =>
            row.studentEmail,
        )
        .filter(Boolean),
    ).size;

    const certificates =
      rows.filter(
        (row) =>
          row.certificateType,
      ).length;

    const reviews =
      rows.filter(
        (row) =>
          row.rating > 0 ||
          row.generalReview ||
          row.detailedSurveyCompleted,
      ).length;

    const projects =
      rows.filter(
        (row) =>
          row.projectTitle ||
          row.projectDescription ||
          row.projectImages.length >
            0,
      ).length;

    const validRows =
      rows.filter(
        (row) =>
          row.errors.length === 0,
      ).length;

    const invalidRows =
      rows.length - validRows;

    return {
      students,
      certificates,
      reviews,
      projects,
      validRows,
      invalidRows,
    };
  }, [rows]);

  const canImport =
    rows.length > 0 &&
    statistics.invalidRows === 0 &&
    !isImporting;

  function handleImport() {
    if (!canImport) return;

    setImportResult(null);

    startImportTransition(
      async () => {
        try {
          const cleanRows =
            rows.map(
              ({
                rowNumber: _rowNumber,
                errors: _errors,
                ...row
              }) => row,
            );

          const result =
            await importStudentRows(
              cleanRows,
            );

          setImportResult(result);

          if (result.imported > 0) {
            await loadImportedStudents();
          }
        } catch (error) {
          setImportResult({
            success: false,

            message:
              error instanceof Error
                ? error.message
                : "حدث خطأ غير متوقع أثناء الاستيراد.",

            imported: 0,

            failed: rows.length,

            results: [],
          });
        }
      },
    );
  }

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-black text-[#07152E]">
          استيراد البيانات
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          استيراد بيانات الطلاب
          والاشتراكات والشهادات
          والتقييمات والمشاريع من ملف
          Excel.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#07152E]">
              <FileSpreadsheet className="h-5 w-5 text-[#F7B548]" />

              ملف Excel
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              اختر ملف الاستيراد بصيغة
              XLSX.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2349]">
            {isReading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}

            {isReading
              ? "جاري قراءة الملف..."
              : "اختيار ملف Excel"}

            <input
              type="file"
              accept=".xlsx"
              onChange={handleFile}
              disabled={
                isReading ||
                isImporting
              }
              className="hidden"
            />
          </label>
        </div>

        {fileName && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />

            {fileName}
          </div>
        )}

        {fileError && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <XCircle className="h-5 w-5" />

            {fileError}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="الطلاب"
          value={
            statistics.students
          }
          icon={GraduationCap}
        />

        <StatCard
          title="الشهادات"
          value={
            statistics.certificates
          }
          icon={Award}
        />

        <StatCard
          title="التقييمات"
          value={
            statistics.reviews
          }
          icon={ClipboardCheck}
        />

        <StatCard
          title="المشاريع"
          value={
            statistics.projects
          }
          icon={FolderOpen}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#07152E]">
              معاينة البيانات
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              عدد الصفوف:{" "}
              {rows.length}
            </p>
          </div>

          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">
                صالح:{" "}
                {
                  statistics.validRows
                }
              </span>

              <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-700">
                به أخطاء:{" "}
                {
                  statistics.invalidRows
                }
              </span>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <FileSpreadsheet className="h-12 w-12 text-slate-300" />

            <p className="mt-4 font-bold text-slate-600">
              لم يتم رفع ملف حتى الآن
            </p>

            <p className="mt-1 text-sm text-slate-400">
              اختر ملف Excel لعرض
              البيانات هنا.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-sm">
              <thead className="bg-[#07152E] text-white">
                <tr>
                  <th className="px-4 py-4 text-right">
                    الصف
                  </th>

                  <th className="px-4 py-4 text-right">
                    الطالب
                  </th>

                  <th className="px-4 py-4 text-right">
                    البريد
                  </th>

                  <th className="px-4 py-4 text-right">
                    الكورس
                  </th>

                  <th className="px-4 py-4 text-center">
                    نوع الرحلة
                  </th>

                  <th className="px-4 py-4 text-center">
                    شهادة
                  </th>

                  <th className="px-4 py-4 text-center">
                    تقييم
                  </th>

                  <th className="px-4 py-4 text-center">
                    الاستبيان
                  </th>

                  <th className="px-4 py-4 text-center">
                    مشروع
                  </th>

                  <th className="px-4 py-4 text-center">
                    العملية
                  </th>

                  <th className="px-4 py-4 text-center">
                    الحالة
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const hasCertificate =
                    Boolean(
                      row.certificateType,
                    );

                  const hasReview =
                    row.rating > 0 ||
                    Boolean(
                      row.generalReview,
                    );

                  const hasProject =
                    Boolean(
                      row.projectTitle,
                    ) ||
                    Boolean(
                      row.projectDescription,
                    ) ||
                    row.projectImages
                      .length > 0;

                  return (
                    <tr
                      key={`${row.studentEmail}-${row.rowNumber}`}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-500">
                        {
                          row.rowNumber
                        }
                      </td>

                      <td className="px-4 py-4 font-bold text-[#07152E]">
                        {row.studentName ||
                          "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {row.studentEmail ||
                          "—"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {row.courseCode ||
                          "—"}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {
                            row.journeyType
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <BooleanBadge
                          value={
                            hasCertificate
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <BooleanBadge
                          value={
                            hasReview
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <BooleanBadge
                          value={
                            row.detailedSurveyCompleted
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <BooleanBadge
                          value={
                            hasProject
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {
                            row.operation
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {row.errors
                          .length ===
                        0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />

                            جاهز
                          </span>
                        ) : (
                          <div className="group relative inline-block">
                            <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                              <XCircle className="h-4 w-4" />

                              خطأ
                            </span>

                            <div className="invisible absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl bg-[#07152E] p-3 text-right text-xs leading-6 text-white opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                              {row.errors.map(
                                (
                                  error,
                                ) => (
                                  <div
                                    key={
                                      error
                                    }
                                  >
                                    •{" "}
                                    {
                                      error
                                    }
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canImport}
          onClick={handleImport}
          className="flex items-center gap-2 rounded-xl bg-[#F7B548] px-6 py-3 font-black text-[#07152E] transition hover:bg-[#f9c56c] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isImporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}

          {isImporting
            ? "جاري الاستيراد..."
            : "بدء الاستيراد"}
        </button>
      </div>

      {importResult && (
        <ImportReport
          result={importResult}
        />
      )}

      <ImportedStudentsSection
        students={importedStudents}
        loading={isLoadingImportedStudents}
        error={importedStudentsError}
        onRefresh={() =>
          void loadImportedStudents()
        }
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;

  icon: React.ComponentType<{
    className?: string;
  }>;
}

function StatCard({
  title,
  value,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-[#07152E]">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7B548]/20 text-[#07152E]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function BooleanBadge({
  value,
}: {
  value: boolean;
}) {
  return value ? (
    <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
  ) : (
    <span className="text-slate-300">
      —
    </span>
  );
}

function ImportReport({
  result,
}: {
  result: StudentImportResult;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-[#07152E]">
          تقرير الاستيراد
        </h2>

        <p
          className={`mt-2 text-sm font-semibold ${
            result.failed === 0
              ? "text-emerald-700"
              : "text-amber-700"
          }`}
        >
          {result.message}
        </p>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">
            إجمالي الصفوف
          </p>

          <p className="mt-2 text-3xl font-black text-[#07152E]">
            {result.imported +
              result.failed}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            تم استيراده
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-700">
            {result.imported}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            فشل
          </p>

          <p className="mt-2 text-3xl font-black text-red-700">
            {result.failed}
          </p>
        </div>
      </div>

      {result.results.length > 0 && (
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-100 text-[#07152E]">
              <tr>
                <th className="px-4 py-4 text-right">
                  الصف
                </th>

                <th className="px-4 py-4 text-right">
                  البريد الإلكتروني
                </th>

                <th className="px-4 py-4 text-center">
                  الحالة
                </th>

                <th className="px-4 py-4 text-right">
                  النتيجة
                </th>
              </tr>
            </thead>

            <tbody>
              {result.results.map(
                (rowResult) => (
                  <tr
                    key={`${rowResult.studentEmail}-${rowResult.rowNumber}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-500">
                      {
                        rowResult.rowNumber
                      }
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {
                        rowResult.studentEmail
                      }
                    </td>

                    <td className="px-4 py-4 text-center">
                      {rowResult.success ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />

                          نجح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          <XCircle className="h-4 w-4" />

                          فشل
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div
                        className={`flex items-start gap-2 ${
                          rowResult.success
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {rowResult.success ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}

                        <span>
                          {
                            rowResult.message
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ImportedStudentsSection({
  students,
  loading,
  error,
  onRefresh,
}: {
  students: ImportedStudentListItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const [
    deletingRegistryId,
    setDeletingRegistryId,
  ] = useState<string | null>(null);

  async function handleDeleteStudent(
    student: ImportedStudentListItem,
  ) {
    if (student.isLinkedToAccount) {
      window.alert(
        "هذا الطالب مرتبط بحساب حقيقي ولا يمكن حذفه من سجل الاستيراد.",
      );
      return;
    }

    const confirmed = window.confirm(
      `هل أنتِ متأكدة من حذف جميع البيانات المستوردة للطالب "${student.studentName}"؟\n\nسيتم حذف الرحلات والشهادات والمشاريع والاستبيانات المستوردة لهذا الطالب.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRegistryId(
        student.registryId,
      );

      const result =
        await deleteImportedStudent(
          student.registryId,
        );

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert(result.message);
      onRefresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "تعذر حذف بيانات الطالب.",
      );
    } finally {
      setDeletingRegistryId(null);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#07152E]">
            سجل بيانات الاستيراد
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            جميع الطلاب الذين لديهم بيانات تم إدخالها من ملفات الاستيراد.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#07152E]">
            {students.length} طالب
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#07152E] transition hover:border-[#F7B548] disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </button>
        </div>
      </div>

      {error ? (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#C88712]" />
            جاري تحميل بيانات الاستيراد...
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
          <UserRound className="h-12 w-12 text-slate-300" />
          <p className="mt-4 font-black text-[#07152E]">
            لا توجد بيانات استيراد
          </p>
          <p className="mt-1 text-sm text-slate-400">
            ستظهر هنا بيانات الطلاب بعد تنفيذ أول عملية استيراد.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-[#07152E] text-white">
              <tr>
                <th className="px-4 py-4 text-center">Masar ID</th>
                <th className="px-4 py-4 text-right">الطالب</th>
                <th className="px-4 py-4 text-right">البريد</th>
                <th className="px-4 py-4 text-center">حالة الحساب</th>
                <th className="px-4 py-4 text-center">الرحلات</th>
                <th className="px-4 py-4 text-center">الشهادات</th>
                <th className="px-4 py-4 text-center">الاستبيانات</th>
                <th className="px-4 py-4 text-center">المشاريع</th>
                <th className="px-4 py-4 text-center">تاريخ الإضافة</th>
                <th className="px-4 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr
                  key={student.registryId}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 text-center font-black text-[#C88712]">
                    {student.masarId}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-black text-[#07152E]">
                      {student.studentName}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {student.email}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {student.isLinkedToAccount ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                        مرتبط بحساب
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#FFF5DD] px-3 py-1 text-xs font-black text-[#B8790B]">
                        بانتظار التسجيل
                      </span>
                    )}
                  </td>

                  <MetricValue value={student.enrollmentsCount} />
                  <MetricValue value={student.certificatesCount} />
                  <MetricValue value={student.surveysCount} />
                  <MetricValue value={student.projectsCount} />

                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">
                    {formatDate(student.createdAt)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href =
                            student.userId
                              ? `/admin/students/${student.userId}`
                              : `/admin/student-import/${student.registryId}`;
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0B2146]"
                      >
                        <Eye className="h-4 w-4" />
                        عرض
                      </button>

                      {!student.isLinkedToAccount ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteStudent(
                              student,
                            )
                          }
                          disabled={
                            deletingRegistryId ===
                            student.registryId
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingRegistryId ===
                          student.registryId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}

                          {deletingRegistryId ===
                          student.registryId
                            ? "جاري الحذف..."
                            : "حذف"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MetricValue({
  value,
}: {
  value: number;
}) {
  return (
    <td className="px-4 py-4 text-center">
      <span className="font-black text-[#07152E]">
        {value}
      </span>
    </td>
  );
}