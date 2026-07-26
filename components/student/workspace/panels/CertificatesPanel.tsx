"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  Download,
  Eye,
  FileText,
  X,
} from "lucide-react";

import type { StudentCertificate } from "@/lib/queries/student-dashboard";

type CertificatesPanelProps = {
  certificates: StudentCertificate[];
};

function formatIssueDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function isPdfUrl(url: string | null | undefined) {
  if (!url) return false;

  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";
  return cleanUrl.endsWith(".pdf");
}

function getCertificateViewUrl(certificate: StudentCertificate) {
  return certificate.previewUrl ?? certificate.pdfUrl ?? null;
}

function getCertificateDownloadUrl(certificate: StudentCertificate) {
  return certificate.pdfUrl ?? certificate.previewUrl ?? null;
}

function CertificateVisual({
  certificate,
  compact = false,
}: {
  certificate: StudentCertificate;
  compact?: boolean;
}) {
  const viewUrl = getCertificateViewUrl(certificate);

  if (viewUrl && !isPdfUrl(viewUrl)) {
    return (
      <img
        src={viewUrl}
        alt={`شهادة ${certificate.courseTitle}`}
        className="h-full w-full object-contain"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 text-center"
      style={{
        background: `linear-gradient(145deg, ${certificate.secondaryColor}, #0f2548)`,
      }}
    >
      <div
        className={
          compact
            ? "flex h-12 w-12 items-center justify-center rounded-full"
            : "flex h-16 w-16 items-center justify-center rounded-full"
        }
        style={{
          backgroundColor: `${certificate.primaryColor}22`,
          border: `1px solid ${certificate.primaryColor}66`,
          color: certificate.primaryColor,
        }}
      >
        <Award className={compact ? "h-6 w-6" : "h-8 w-8"} />
      </div>

      <div>
        <p
          className={
            compact
              ? "text-sm font-bold text-white"
              : "text-lg font-bold text-white"
          }
        >
          شهادة إتمام
        </p>

        <p
          className={
            compact
              ? "mt-1 line-clamp-2 text-xs text-white/75"
              : "mt-2 max-w-md text-sm text-white/75"
          }
        >
          {certificate.courseTitle}
        </p>
      </div>

      {viewUrl && isPdfUrl(viewUrl) ? (
        <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
          <FileText className="h-4 w-4" />
          ملف PDF
        </div>
      ) : null}
    </div>
  );
}

export default function CertificatesPanel({
  certificates,
}: CertificatesPanelProps) {
  const [selectedCertificate, setSelectedCertificate] =
    useState<StudentCertificate | null>(null);

  const sortedCertificates = useMemo(
    () =>
      [...certificates].sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() -
          new Date(a.issuedAt).getTime(),
      ),
    [certificates],
  );

  useEffect(() => {
    if (!selectedCertificate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCertificate(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCertificate]);

  if (sortedCertificates.length === 0) {
    return (
      <section
        dir="rtl"
        className="flex min-h-[430px] items-center justify-center rounded-[28px] border border-slate-200 bg-white px-6 py-12 shadow-sm"
      >
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#F7B548]/30 bg-[#F7B548]/10 text-[#F7B548]">
            <Award className="h-10 w-10" />
          </div>

          <h2 className="mt-6 text-2xl font-black text-[#07152E]">
            لا توجد شهادات حتى الآن
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            بعد إتمام أحد الكورسات وإصدار الشهادة من الإدارة، ستظهر
            شهادتك هنا تلقائيًا لتتمكني من معاينتها وتحميلها.
          </p>
        </div>
      </section>
    );
  }

  const hasSingleCertificate = sortedCertificates.length === 1;

  return (
    <>
      <section dir="rtl" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#F7B548]">
              إنجازاتك المعتمدة
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#07152E]">
              شهاداتي
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              جميع الشهادات التي أُصدرت لك من منصة Masar Makers.
            </p>
          </div>

          <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#07152E] shadow-sm">
            {sortedCertificates.length}{" "}
            {sortedCertificates.length === 1 ? "شهادة" : "شهادات"}
          </div>
        </div>

        <div
          className={
            hasSingleCertificate
              ? "mx-auto max-w-4xl"
              : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {sortedCertificates.map((certificate) => {
            const downloadUrl =
              getCertificateDownloadUrl(certificate);

            return (
              <article
                key={certificate.id}
                className={`group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  hasSingleCertificate ? "p-5 sm:p-7" : "p-4"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCertificate(certificate)
                  }
                  className={`relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-right focus:outline-none focus:ring-2 focus:ring-[#F7B548]/60 ${
                    hasSingleCertificate
                      ? "aspect-[1.414/1]"
                      : "aspect-[1.414/1]"
                  }`}
                  aria-label={`معاينة شهادة ${certificate.courseTitle}`}
                >
                  <CertificateVisual
                    certificate={certificate}
                    compact={!hasSingleCertificate}
                  />

                  <span className="absolute inset-0 flex items-center justify-center bg-[#07152E]/0 opacity-0 transition group-hover:bg-[#07152E]/45 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07152E] shadow-lg">
                      <Eye className="h-4 w-4" />
                      عرض الشهادة
                    </span>
                  </span>

                  {certificate.isNew ? (
                    <span className="absolute right-3 top-3 rounded-full bg-[#F7B548] px-3 py-1 text-xs font-black text-[#07152E] shadow">
                      جديدة
                    </span>
                  ) : null}
                </button>

                <div
                  className={
                    hasSingleCertificate
                      ? "mt-6 text-center"
                      : "mt-4"
                  }
                >
                  <h3
                    className={`font-black text-[#07152E] ${
                      hasSingleCertificate
                        ? "text-xl sm:text-2xl"
                        : "line-clamp-2 text-base"
                    }`}
                  >
                    {certificate.courseTitle}
                  </h3>

                  <div
                    className={`mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 ${
                      hasSingleCertificate
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatIssueDate(certificate.issuedAt)}
                    </span>

                    <span className="text-slate-300">•</span>

                    <span>
                      رقم الشهادة:{" "}
                      <strong className="text-slate-700">
                        {certificate.certificateNumber}
                      </strong>
                    </span>
                  </div>

                  <div
                    className={`mt-5 flex flex-wrap gap-3 ${
                      hasSingleCertificate
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCertificate(certificate)
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-bold text-white transition hover:bg-[#10274c]"
                    >
                      <Eye className="h-4 w-4" />
                      عرض
                    </button>

                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#F7B548] bg-[#F7B548] px-5 text-sm font-black text-[#07152E] transition hover:brightness-95"
                      >
                        <Download className="h-4 w-4" />
                        تحميل
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-bold text-slate-400"
                      >
                        <Download className="h-4 w-4" />
                        التحميل غير متاح
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedCertificate ? (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`معاينة شهادة ${selectedCertificate.courseTitle}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSelectedCertificate(null);
            }
          }}
        >
          <div className="flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-[#07152E] sm:text-lg">
                  {selectedCertificate.courseTitle}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  رقم الشهادة:{" "}
                  {selectedCertificate.certificateNumber}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {getCertificateDownloadUrl(
                  selectedCertificate,
                ) ? (
                  <a
                    href={
                      getCertificateDownloadUrl(
                        selectedCertificate,
                      ) ?? undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-4 text-sm font-black text-[#07152E]"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">تحميل</span>
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCertificate(null)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                  aria-label="إغلاق المعاينة"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 bg-slate-100 p-3 sm:p-5">
              {getCertificateViewUrl(selectedCertificate) ? (
                isPdfUrl(
                  getCertificateViewUrl(selectedCertificate),
                ) ? (
                  <iframe
                    src={
                      getCertificateViewUrl(
                        selectedCertificate,
                      ) ?? undefined
                    }
                    title={`شهادة ${selectedCertificate.courseTitle}`}
                    className="h-full min-h-[70vh] w-full rounded-xl border-0 bg-white"
                  />
                ) : (
                  <div className="flex h-full min-h-[70vh] items-center justify-center overflow-auto rounded-xl bg-white p-2 sm:p-4">
                    <img
                      src={
                        getCertificateViewUrl(
                          selectedCertificate,
                        ) ?? undefined
                      }
                      alt={`شهادة ${selectedCertificate.courseTitle}`}
                      className="max-h-full max-w-full object-contain shadow-lg"
                    />
                  </div>
                )
              ) : (
                <div className="h-full min-h-[70vh] overflow-hidden rounded-xl">
                  <CertificateVisual
                    certificate={selectedCertificate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}