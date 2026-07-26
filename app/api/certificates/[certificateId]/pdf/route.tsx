import { chromium } from "playwright";

import { getCertificate } from "@/lib/certificates/get-certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{
    certificateId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  let browser: Awaited<
    ReturnType<typeof chromium.launch>
  > | null = null;

  try {
    const { certificateId } = await context.params;

    const certificate =
      await getCertificate(certificateId);

    if (!certificate) {
      return Response.json(
        {
          success: false,
          message: "Certificate not found.",
        },
        {
          status: 404,
        },
      );
    }

    const requestUrl = new URL(request.url);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      requestUrl.origin;

    const printPageUrl =
      `${appUrl}/certificates/${certificateId}/print`;

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: {
        width: 1123,
        height: 794,
      },
      deviceScaleFactor: 1,
    });

    await page.goto(printPageUrl, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });

    const certificateElement =
      page.locator("#certificate-pdf-content");

    await certificateElement.waitFor({
      state: "visible",
      timeout: 30_000,
    });

    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });

    await page.emulateMedia({
      media: "screen",
    });

    const pdfBuffer = await page.pdf({
      width: "1123px",
      height: "794px",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    const safeCertificateNumber =
      certificate.certificateNumber.replace(
        /[^a-zA-Z0-9-_]/g,
        "-",
      );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="Masar-Makers-${safeCertificateNumber}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "GENERATE CERTIFICATE PDF ERROR",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate certificate PDF.",
      },
      {
        status: 500,
      },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}