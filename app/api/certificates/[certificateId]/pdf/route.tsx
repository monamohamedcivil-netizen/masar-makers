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

    /*
     * نستخدم نفس أصل الطلب الحالي.
     * أثناء التطوير سيكون localhost:3000،
     * وعند النشر سيكون دومين المنصة تلقائيًا.
     */
    const appUrl = requestUrl.origin;

    const printPageUrl =
      `${appUrl}/certificates/${certificateId}/print`;

    /*
     * صفحة الطباعة تحتاج جلسة المستخدم الحالية.
     * Playwright يفتح متصفحًا منفصلًا، لذلك ننقل Cookies الطلب إليه.
     */
    const cookieHeader =
      request.headers.get("cookie") ?? "";

    browser = await chromium.launch({
      headless: true,
    });

    const browserContext =
      await browser.newContext({
        viewport: {
          width: 1123,
          height: 794,
        },
        deviceScaleFactor: 1,
        extraHTTPHeaders: cookieHeader
          ? {
              cookie: cookieHeader,
            }
          : undefined,
      });

    const page = await browserContext.newPage();

    const response = await page.goto(printPageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
await page.waitForTimeout(1500);
    if (!response) {
      throw new Error(
        "Print page did not return a response.",
      );
    }

    if (!response.ok()) {
      throw new Error(
        `Print page failed with status ${response.status()} at ${response.url()}`,
      );
    }

    await page.waitForLoadState("networkidle", {
      timeout: 45_000,
    });

    await page.waitForSelector(
      "#certificate-pdf-content",
      {
        state: "attached",
        timeout: 30_000,
      },
    );

    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const images = Array.from(
        document.images,
      );

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            image.addEventListener(
              "load",
              () => resolve(),
              { once: true },
            );

            image.addEventListener(
              "error",
              () => resolve(),
              { once: true },
            );
          });
        }),
      );

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
    });

    await page.emulateMedia({
      media: "screen",
    });
await page.evaluate(async () => {
  // انتظار تحميل الخطوط
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  // انتظار تحميل الصور
  await Promise.all(
    Array.from(document.images).map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }),
  );

  // انتظار رسم React
  await new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve),
    ),
  );
});
    const pdfBuffer = await page.pdf({
        
  width: "1123px",
  height: "794px",

  printBackground: true,

  preferCSSPageSize: false,

  landscape: true,

  margin: {
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  },
});
    
    await browserContext.close();

    const safeCertificateNumber =
      certificate.certificateNumber.replace(
        /[^a-zA-Z0-9-_]/g,
        "-",
      );

    return new Response(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            `attachment; filename="Masar-Makers-${safeCertificateNumber}.pdf"`,
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
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