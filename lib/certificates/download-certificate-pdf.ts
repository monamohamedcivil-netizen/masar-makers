import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function downloadCertificateAsPdf(
  certificateId: string,
  certificateNumber: string,
) {
  const iframe = document.querySelector<HTMLIFrameElement>(
    `iframe[data-certificate-id="${certificateId}"]`,
  );

  if (!iframe) {
    throw new Error("تعذر العثور على معاينة الشهادة.");
  }

  const iframeDocument =
    iframe.contentDocument ??
    iframe.contentWindow?.document;

  if (!iframeDocument) {
    throw new Error("تعذر قراءة محتوى معاينة الشهادة.");
  }

  const certificateElement =
    iframeDocument.getElementById(
      "certificate-pdf-content",
    );

  if (!certificateElement) {
    throw new Error(
      "تعذر العثور على نموذج الشهادة داخل المعاينة.",
    );
  }

  if ("fonts" in iframeDocument) {
    await iframeDocument.fonts.ready;
  }

  const images = Array.from(
    certificateElement.querySelectorAll("img"),
  );

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const width = certificateElement.offsetWidth;
  const height = certificateElement.offsetHeight;

  if (width <= 0 || height <= 0) {
    throw new Error("مقاس نموذج الشهادة غير صحيح.");
  }

  const imageData = await toPng(
    certificateElement,
    {
      cacheBust: true,
      pixelRatio: 4,
      backgroundColor: "#ffffff",
      width,
      height,
    },
  );

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling"],
  });

  pdf.addImage(
    imageData,
    "PNG",
    0,
    0,
    width,
    height,
    undefined,
    "FAST",
  );

  pdf.save(
  `Masar-Makers-Certificate-${certificateNumber}.pdf`,
);
}