"use client";

import {
  Download,
  LoaderCircle,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { downloadCertificateAsPdf } from "@/lib/certificates/download-certificate-pdf";

const CERTIFICATE_WIDTH = 1123;
const CERTIFICATE_HEIGHT = 794;

type CertificateClientProps = {
  certificateId: string;
  certificateNumber: string;
  lang?: "ar" | "en";
};

export function CertificateDownloadButton({
  certificateId,
  certificateNumber,
  lang = "ar",
}: CertificateClientProps) {
  const [downloading, setDownloading] =
    useState(false);

  async function handleDownload() {
    if (downloading) return;

    setDownloading(true);

    try {
      const iframe =
        document.querySelector<HTMLIFrameElement>(
          `iframe[data-public-certificate-id="${certificateId}"]`,
        );

      if (!iframe) {
        throw new Error(
          "تعذر العثور على معاينة الشهادة.",
        );
      }

      await downloadCertificateAsPdf(
        iframe,
        certificateNumber,
      );
    } catch (error) {
      console.error(
        "DOWNLOAD CERTIFICATE PDF ERROR",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "تعذر تحميل الشهادة.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0D2347] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {downloading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}

      {downloading
        ? lang === "ar"
          ? "جاري تجهيز PDF..."
          : "Preparing PDF..."
        : lang === "ar"
          ? "تحميل PDF"
          : "Download PDF"}
    </button>
  );
}

export function CertificateResponsivePreview({
  certificateId,
  verificationCode,
}: {
  certificateId: string;
  verificationCode?: string;
}) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const [scale, setScale] =
    useState(1);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) return;

    function updateScale() {
      const currentContainer =
        containerRef.current;

      if (!currentContainer) {
        return;
      }

      const availableWidth =
        currentContainer.clientWidth;

      setScale(
        Math.min(
          1,
          availableWidth /
            CERTIFICATE_WIDTH,
        ),
      );
    }

    updateScale();

    const observer =
      new ResizeObserver(updateScale);

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const scaledHeight =
    CERTIFICATE_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-white shadow-2xl"
      style={{
        height: `${scaledHeight}px`,
      }}
    >
      <iframe
        src={
          verificationCode
            ? `/certificates/${encodeURIComponent(
                certificateId,
              )}/print?verify=${encodeURIComponent(
                verificationCode,
              )}`
            : `/certificates/${encodeURIComponent(
                certificateId,
              )}/print`
        }
        data-public-certificate-id={certificateId}
        title="Certificate Preview"
        className="absolute left-1/2 top-0 border-0 bg-white"
        style={{
          width: `${CERTIFICATE_WIDTH}px`,
          height: `${CERTIFICATE_HEIGHT}px`,
          transform:
            `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      />
    </div>
  );
}