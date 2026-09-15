import {
  NextRequest,
  NextResponse,
} from "next/server";

/* =========================================================
   GET
   Meta Webhook Verification
========================================================= */

export async function GET(
  request: NextRequest,
) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get(
      "hub.mode",
    );

  const token =
    searchParams.get(
      "hub.verify_token",
    );

  const challenge =
    searchParams.get(
      "hub.challenge",
    );

  const verifyToken =
    process.env
      .WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error(
      "WHATSAPP_VERIFY_TOKEN is missing.",
    );

    return new NextResponse(
      "Webhook verify token is not configured.",
      {
        status: 500,
      },
    );
  }

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    console.log(
      "WhatsApp webhook verified successfully.",
    );

    return new NextResponse(
      challenge,
      {
        status: 200,
      },
    );
  }

  console.warn(
    "WhatsApp webhook verification failed.",
  );

  return new NextResponse(
    "Forbidden",
    {
      status: 403,
    },
  );
}

/* =========================================================
   POST
   Receive WhatsApp events
========================================================= */

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(
        body,
        null,
        2,
      ),
    );

    /*
     * في الخطوة التالية سنضع هنا:
     *
     * 1. استخراج رقم العميل
     * 2. قراءة الرسالة
     * 3. فحص Human Mode
     * 4. قراءة القوائم من Supabase
     * 5. إرسال القائمة الرئيسية
     * 6. اختيار المسار
     * 7. عرض كورسات المسار
     * 8. تفاصيل / سعر / محاضرة / اشتراك
     */

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "WhatsApp webhook error:",
      error,
    );

    /*
     * نرجع 200 حتى لا تستمر Meta
     * في إعادة إرسال نفس الحدث
     * بسبب خطأ parsing داخلي.
     */
    return NextResponse.json({
      received: true,
    });
  }
}