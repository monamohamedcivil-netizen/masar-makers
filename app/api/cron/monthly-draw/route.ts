import { NextResponse } from "next/server";

import { runMonthlyDrawTick } from "@/lib/public/monthly-draws";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
 * تشغيل السحب الشهري في موعده بالظبط بدون الاعتماد على وجود زوار.
 * تستدعيه جدولة Supabase (pg_cron + pg_net) كل دقيقة، وفقط عند وجود سحب مستحق.
 *
 * لا يحتاج سرًّا: هو يفعل ما يفعله أي زائر يفتح الموقع (نفس المنطق، حالات السحب
 * تتغير بشروط فلا يتكرر شيء)، ولا يقبل أي مدخلات.
 *
 * العدّ التنازلي (10ث) والدوران (10ث) يستغرقان نحو 25 ثانية، فنكرر الخطوة كل ثانيتين
 * حتى يُعلن الفائز أو ينتهي الحد الأقصى؛ وإن لم يكتمل تكمله الدقيقة التالية.
 */
const STEP_MS = 2000;
const MAX_MS = 50_000;

async function run() {
  const startedAt = Date.now();
  let phase: string | null = null;

  try {
    while (Date.now() - startedAt < MAX_MS) {
      const result = await runMonthlyDrawTick();
      phase = result.phase;

      // لا سحب حيّ، أو السحب اكتمل: لا حاجة للتكرار.
      if (phase !== "countdown" && phase !== "running") break;

      await new Promise((resolve) => setTimeout(resolve, STEP_MS));
    }
  } catch (error) {
    console.error("MONTHLY DRAW TICK ERROR:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phase });
}

export async function POST() {
  return run();
}
