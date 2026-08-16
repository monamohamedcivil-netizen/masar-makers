"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Award,
  CalendarDays,
  Download,
  Eye,
  X,
} from "lucide-react";

import type { StudentCertificate } from "@/lib/queries/student-dashboard";
import { downloadCertificateAsPdf } from "@/lib/certificates/download-certificate-pdf";
import { markCertificateAsViewed } from "@/lib/actions/student/certificates";

type CertificatesPanelProps = {
  certificates: StudentCertificate[];
  mode?: "student" | "admin";
};

const CERTIFICATE_WIDTH = 1123;
const CERTIFICATE_HEIGHT = 794;

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

function getCertificatePreviewUrl(
  certificate: StudentCertificate,
) {
  const version = encodeURIComponent(certificate.issuedAt);

  return `/certificates/${certificate.id}/print?v=${version}`;
}

function CertificatePreview({
  certificate,
  interactive = false,
}: {
  certificate: StudentCertificate;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    function updateScale() {
      const availableWidth =
        container?.clientWidth ?? CERTIFICATE_WIDTH;

      const nextScale = Math.min(
        1,
        availableWidth / CERTIFICATE_WIDTH,
      );

      setScale(nextScale);
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const scaledHeight = CERTIFICATE_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-white"
      style={{
        height: `${scaledHeight}px`,
      }}
    >
     <iframe
  src={getCertificatePreviewUrl(certificate)}
  title={`شهادة ${certificate.courseTitle}`}
  loading="lazy"
  tabIndex={interactive ? 0 : -1}
  data-certificate-id={certificate.id}
  className={
    interactive
      ? "absolute left-1/2 top-0 border-0 bg-white"
      : "pointer-events-none absolute left-1/2 top-0 border-0 bg-white"
  }
  style={{
    width: `${CERTIFICATE_WIDTH}px`,
    height: `${CERTIFICATE_HEIGHT}px`,
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: "top center",
  }}
/>
    </div>
  );
}

export default function CertificatesPanel({
  certificates,
  mode = "student",
}: CertificatesPanelProps) {
  const [selectedCertificate, setSelectedCertificate] =
    useState<StudentCertificate | null>(null);
const [openedCertificates, setOpenedCertificates] =
  useState<Set<string>>(new Set());
  async function openCertificate(
  certificate: StudentCertificate,
) {
  setOpenedCertificates((previous) => {
    const next = new Set(previous);
    next.add(certificate.id);
    return next;
  });

  setSelectedCertificate(certificate);

  if (
  mode === "admin" ||
  !certificate.isNew
) {
  return;
}

  const result = await markCertificateAsViewed(
    certificate.id,
  );

  if (!result.success) {
    console.error(
      "MARK CERTIFICATE AS VIEWED ERROR",
      result.message,
    );
  }
}
  const sortedCertificates = useMemo(
    () =>
      [...certificates].sort(
        (first, second) =>
          new Date(second.issuedAt).getTime() -
          new Date(first.issuedAt).getTime(),
      ),
    [certificates],
  );

  useEffect(() => {
    if (!selectedCertificate) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCertificate(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
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
            بعد إتمام أحد الكورسات وإصدار الشهادة من الإدارة،
            ستظهر شهادتك هنا تلقائيًا لتتمكني من معاينتها
            وتحميلها.
          </p>
        </div>
      </section>
    );
  }

  const hasSingleCertificate =
    sortedCertificates.length === 1;

  return (
    <>
      <section dir="rtl" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#F7B548]">
              إنجازاتك المعتمدة
            </p>

            <h2 className="mt-0 text-2xl font-black text-[#07152E]">
              شهاداتي
            </h2>

            <p className="mt-0 text-sm text-slate-500">
              جميع الشهادات التي أُصدرت لك من منصة Masar Makers.
            </p>
          </div>

          <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#07152E] shadow-sm">
            {sortedCertificates.length}{" "}
            {sortedCertificates.length === 1
              ? "شهادة"
              : "شهادات"}
          </div>
        </div>

        <div
          className={
            hasSingleCertificate
              ? "mx-auto max-w-4xl"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {sortedCertificates.map((certificate) => {
            

            return (
              <article
  key={certificate.id}
  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
>
  {/* صورة الشهادة */}
  <button
    type="button"
    onClick={() =>
      openCertificate(certificate)
    }
    className="relative block w-full overflow-hidden bg-white text-right focus:outline-none focus:ring-2 focus:ring-[#F7B548]/60"
    aria-label={`معاينة شهادة ${certificate.courseTitle}`}
  >
    <CertificatePreview
      certificate={certificate}
    />

    {/* Hover */}
    <span className="absolute inset-0 flex items-center justify-center bg-[#07152E]/0 opacity-0 transition duration-300 group-hover:bg-[#07152E]/35 group-hover:opacity-100">
      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#07152E] shadow-lg">
        <Eye className="h-3.5 w-3.5" />
        عرض الشهادة
      </span>
    </span>

    {certificate.isNew &&
    !openedCertificates.has(
      certificate.id,
    ) ? (
      <span className="absolute right-2 top-2 rounded-full bg-[#F7B548] px-2.5 py-1 text-[9px] font-black text-[#07152E] shadow">
        جديدة
      </span>
    ) : null}
  </button>

  {/* البيانات المضغوطة */}
  <div className="border-t border-slate-100 px-3 py-2.5">

    {/* اسم الكورس */}
    <h3 className="truncate text-[14px] font-black text-[#07152E]">
      {certificate.courseTitle}
    </h3>

    {/* التاريخ + رقم الشهادة */}
    <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[9px] font-semibold text-slate-500">
      <span className="flex shrink-0 items-center gap-1">
        <CalendarDays className="h-3 w-3" />

        {formatIssueDate(
          certificate.issuedAt,
        )}
      </span>

      <span className="text-slate-300">
        •
      </span>

      <span
        className="min-w-0 truncate"
        title={
          certificate.certificateNumber
        }
      >
        رقم الشهادة:{" "}
        <strong className="font-bold text-slate-600">
          {
            certificate.certificateNumber
          }
        </strong>
      </span>
    </div>

    {/* الأزرار */}
    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={() =>
          openCertificate(certificate)
        }
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white transition hover:bg-[#10274c]"
      >
        <Eye className="h-3.5 w-3.5" />
        عرض
      </button>

      <button
        type="button"
        onClick={async () => {
          try {
            await downloadCertificateAsPdf(
              certificate.id,
              certificate.certificateNumber,
            );
          } catch (error) {
            console.error(
              "DOWNLOAD CERTIFICATE PDF ERROR",
              error,
            );
          }
        }}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#F7B548] px-3 text-[10px] font-black text-[#07152E] transition hover:brightness-95"
      >
        <Download className="h-3.5 w-3.5" />
        تحميل PDF
      </button>
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
            if (
              event.currentTarget === event.target
            ) {
              setSelectedCertificate(null);
            }
          }}
        >
          <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-[#07152E] sm:text-lg">
                  {
                    selectedCertificate.courseTitle
                  }
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  رقم الشهادة:{" "}
                  {
                    selectedCertificate.certificateNumber
                  }
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
  type="button"
  onClick={async () => {
    try {
      await downloadCertificateAsPdf(
        selectedCertificate.id,
        selectedCertificate.certificateNumber,
      );
    } catch (error) {
      console.error(
        "DOWNLOAD CERTIFICATE PDF ERROR",
        error,
      );
    }
  }}
  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-4 text-sm font-black text-[#07152E]"
>
  <Download className="h-4 w-4" />

  <span className="hidden sm:inline">
    تحميل PDF
  </span>
</button>

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

            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
              <div className="mx-auto w-full max-w-[1123px] overflow-hidden rounded-xl bg-white shadow-xl">
                <CertificatePreview
                  certificate={
                    selectedCertificate
                  }
                  interactive
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}