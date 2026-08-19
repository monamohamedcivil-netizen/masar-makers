"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";
import {
  getMasarPassport,
  getMasarPassportForRegistry,
} from "@/lib/dashboard/masar-passport";
export type MonthlyDrawStatus =
  | "draft"
  | "scheduled"
  | "countdown"
  | "running"
  | "completed"
  | "cancelled";

export type MonthlyDrawWinnerMode =
  | "random"
  | "manual";

export type MonthlyDraw = {
  id: string;
  month_key: string;
  title: string;

  prize_title: string | null;
  prize_description: string | null;
  prize_image_url: string | null;

  scheduled_at: string;
  status: MonthlyDrawStatus;

  winner_mode: MonthlyDrawWinnerMode;

  preset_winner_user_id: string | null;
  preset_winner_registry_id: string | null;
  preset_winner_name: string | null;
  winner_selection_note: string | null;

  winner_user_id: string | null;
  winner_registry_id: string | null;
  winner_name: string | null;
  winning_ticket: number | null;

  total_participants: number;
  total_entries: number;

  countdown_started_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  result_visible_until: string | null;

  is_published: boolean;

  created_at: string;
  updated_at: string;
};

export type MonthlyDrawSettings = {
  id: number;
  draw_day: number;
  draw_hour: number;
  timezone: string;
  points_per_entry: number;
  countdown_seconds: number;
  result_popup_days: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type MonthlyDrawParticipant = {
  id: string;
  draw_id: string;
  user_id: string | null;
  registry_id: string | null;
  masar_id: number | null;
  student_email: string | null;
  student_name: string;
  points_snapshot: number;
  entries_count: number;
  ticket_start: number | null;
  ticket_end: number | null;
  created_at: string;
};

export type MonthlyDrawActionResult = {
  success: boolean;
  message: string;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(
    profile?.role ?? "",
  ).toLowerCase();

  if (
    profileError ||
    !["admin", "super_admin"].includes(role)
  ) {
    throw new Error(
      "ليس لديك صلاحية لإدارة السحب الشهري.",
    );
  }

  return supabase;
}

function buildWinnerCountMaps(
  rows: Array<{
    winner_user_id: string | null;
    winner_registry_id: string | null;
  }>,
) {
  const winsByUserId =
    new Map<string, number>();

  const winsByRegistryId =
    new Map<string, number>();

  for (const row of rows) {
    if (row.winner_registry_id) {
      winsByRegistryId.set(
        row.winner_registry_id,
        (winsByRegistryId.get(
          row.winner_registry_id,
        ) ?? 0) + 1,
      );
      continue;
    }

    if (row.winner_user_id) {
      winsByUserId.set(
        row.winner_user_id,
        (winsByUserId.get(
          row.winner_user_id,
        ) ?? 0) + 1,
      );
    }
  }

  return {
    winsByUserId,
    winsByRegistryId,
  };
}

/* =========================================================
   READ
========================================================= */

export async function getAdminMonthlyDraws(): Promise<
  MonthlyDraw[]
> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("monthly_draws")
    .select("*")
    .order("scheduled_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MonthlyDraw[];
}

export async function getMonthlyDrawSettings(): Promise<
  MonthlyDrawSettings | null
> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("monthly_draw_settings")
    .select("*")
    .order("id", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MonthlyDrawSettings | null;
}

export async function getMonthlyDrawParticipants(
  drawId: string,
): Promise<MonthlyDrawParticipant[]> {
  const supabase = await requireAdmin();

  if (!drawId) {
    return [];
  }

  const { data, error } = await supabase
    .from("monthly_draw_entries")
    .select("*")
    .eq("draw_id", drawId)
    .order("entries_count", {
      ascending: false,
    })
    .order("student_name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? []
  ) as MonthlyDrawParticipant[];
}

/* =========================================================
   SETTINGS
========================================================= */

export async function updateMonthlyDrawSettings(
  input: {
    pointsPerEntry: number;
    countdownSeconds: number;
    resultPopupDays: number;
    isEnabled: boolean;
  },
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  const pointsPerEntry = Math.max(
    1,
    Math.floor(
      Number(input.pointsPerEntry),
    ),
  );

  const countdownSeconds = Math.max(
    1,
    Math.floor(
      Number(input.countdownSeconds),
    ),
  );

  const resultPopupDays = Math.max(
    1,
    Math.floor(
      Number(input.resultPopupDays),
    ),
  );

  const { data: settings, error: readError } =
    await supabase
      .from("monthly_draw_settings")
      .select("id")
      .order("id", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

  if (readError) {
    return {
      success: false,
      message: readError.message,
    };
  }

  if (!settings) {
    return {
      success: false,
      message:
        "إعدادات السحب الشهري غير موجودة.",
    };
  }

  const { error } = await supabase
    .from("monthly_draw_settings")
    .update({
      points_per_entry:
        pointsPerEntry,
      countdown_seconds:
        countdownSeconds,
      result_popup_days:
        resultPopupDays,
      is_enabled:
        input.isEnabled,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", settings.id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message:
      "تم حفظ إعدادات السحب الشهري.",
  };
}

/* =========================================================
   CREATE DRAW
========================================================= */

export async function createMonthlyDraw(
  input: {
    monthKey: string;
    title?: string;
    prizeTitle: string;
    prizeDescription?: string;
    prizeImageUrl?: string;
    scheduledAt: string;
    winnerMode: MonthlyDrawWinnerMode;
    presetWinnerUserId?: string;
    presetWinnerRegistryId?: string;
    presetWinnerName?: string;
    winnerSelectionNote?: string;
    isPublished?: boolean;
  },
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  const monthKey =
    input.monthKey.trim();

  const prizeTitle =
    input.prizeTitle.trim();

  if (!monthKey) {
    return {
      success: false,
      message: "شهر السحب مطلوب.",
    };
  }

  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return {
      success: false,
      message:
        "صيغة شهر السحب غير صحيحة.",
    };
  }

  if (!prizeTitle) {
    return {
      success: false,
      message: "جائزة الشهر مطلوبة.",
    };
  }

  const scheduledDate =
    new Date(input.scheduledAt);

  if (
    Number.isNaN(
      scheduledDate.getTime(),
    )
  ) {
    return {
      success: false,
      message:
        "موعد السحب غير صحيح.",
    };
  }

  const { error } = await supabase
    .from("monthly_draws")
    .insert({
      month_key: monthKey,

      title:
        input.title?.trim() ||
        "سحب مكافآت Masar Makers الشهري",

      prize_title: prizeTitle,

      prize_description:
        input.prizeDescription?.trim() ||
        null,

      prize_image_url:
        input.prizeImageUrl?.trim() ||
        null,

      scheduled_at:
        scheduledDate.toISOString(),

      status: "scheduled",

      winner_mode:
        input.winnerMode,

      preset_winner_user_id:
        input.winnerMode === "manual"
          ? input.presetWinnerUserId ||
            null
          : null,

      preset_winner_registry_id:
        input.winnerMode === "manual"
          ? input.presetWinnerRegistryId ||
            null
          : null,

      preset_winner_name:
        input.winnerMode === "manual"
          ? input.presetWinnerName?.trim() ||
            null
          : null,

      winner_selection_note:
        input.winnerMode === "manual"
          ? input.winnerSelectionNote?.trim() ||
            null
          : null,

      is_published:
        input.isPublished ?? false,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message:
      "تم إنشاء سحب الشهر بنجاح.",
  };
}

/* =========================================================
   UPDATE DRAW
========================================================= */

export async function updateMonthlyDraw(
  id: string,
  input: {
    title?: string;
    prizeTitle: string;
    prizeDescription?: string;
    prizeImageUrl?: string;
    scheduledAt: string;
    winnerMode: MonthlyDrawWinnerMode;
    presetWinnerUserId?: string;
    presetWinnerRegistryId?: string;
    presetWinnerName?: string;
    winnerSelectionNote?: string;
    isPublished?: boolean;
  },
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  if (!id) {
    return {
      success: false,
      message: "رقم السحب غير موجود.",
    };
  }

  const prizeTitle =
    input.prizeTitle.trim();

  if (!prizeTitle) {
    return {
      success: false,
      message: "جائزة الشهر مطلوبة.",
    };
  }

  const scheduledDate =
    new Date(input.scheduledAt);

  if (
    Number.isNaN(
      scheduledDate.getTime(),
    )
  ) {
    return {
      success: false,
      message:
        "موعد السحب غير صحيح.",
    };
  }

  const { data: existing, error: existingError } =
    await supabase
      .from("monthly_draws")
      .select("status")
      .eq("id", id)
      .maybeSingle();

  if (existingError) {
    return {
      success: false,
      message: existingError.message,
    };
  }

  if (!existing) {
    return {
      success: false,
      message: "السحب غير موجود.",
    };
  }

  if (
    ["running", "completed"].includes(
      existing.status,
    )
  ) {
    return {
      success: false,
      message:
        "لا يمكن تعديل بيانات السحب بعد بدء السحب الرسمي.",
    };
  }

  const { error } = await supabase
    .from("monthly_draws")
    .update({
      title:
        input.title?.trim() ||
        "سحب مكافآت Masar Makers الشهري",

      prize_title: prizeTitle,

      prize_description:
        input.prizeDescription?.trim() ||
        null,

      prize_image_url:
        input.prizeImageUrl?.trim() ||
        null,

      scheduled_at:
        scheduledDate.toISOString(),

      winner_mode:
        input.winnerMode,

      preset_winner_user_id:
        input.winnerMode === "manual"
          ? input.presetWinnerUserId ||
            null
          : null,

      preset_winner_registry_id:
        input.winnerMode === "manual"
          ? input.presetWinnerRegistryId ||
            null
          : null,

      preset_winner_name:
        input.winnerMode === "manual"
          ? input.presetWinnerName?.trim() ||
            null
          : null,

      winner_selection_note:
        input.winnerMode === "manual"
          ? input.winnerSelectionNote?.trim() ||
            null
          : null,

      is_published:
        input.isPublished ?? false,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message:
      "تم حفظ تعديلات السحب.",
  };
}

/* =========================================================
   PUBLISH / UNPUBLISH
========================================================= */

export async function toggleMonthlyDrawPublished(
  id: string,
  isPublished: boolean,
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("monthly_draws")
    .update({
      is_published: isPublished,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message: isPublished
      ? "تم نشر السحب."
      : "تم إخفاء السحب من المنصة.",
  };
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteMonthlyDraw(
  id: string,
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  const { data: draw, error: readError } =
    await supabase
      .from("monthly_draws")
      .select("status")
      .eq("id", id)
      .maybeSingle();

  if (readError) {
    return {
      success: false,
      message: readError.message,
    };
  }

  if (!draw) {
    return {
      success: false,
      message: "السحب غير موجود.",
    };
  }

  if (
    ["running", "completed"].includes(
      draw.status,
    )
  ) {
    return {
      success: false,
      message:
        "لا يمكن حذف سحب بدأ أو انتهى بالفعل.",
    };
  }

  const { error } = await supabase
    .from("monthly_draws")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message: "تم حذف السحب.",
  };
}
/* =========================================================
   PREPARE DRAW PARTICIPANTS
========================================================= */

export async function prepareMonthlyDrawParticipants(
  drawId: string,
): Promise<MonthlyDrawActionResult> {
  const supabase = await requireAdmin();

  if (!drawId) {
    return {
      success: false,
      message: "رقم السحب غير موجود.",
    };
  }

  const { data: draw, error: drawError } = await supabase
    .from("monthly_draws")
    .select("id,status")
    .eq("id", drawId)
    .maybeSingle();

  if (drawError) {
    return {
      success: false,
      message: drawError.message,
    };
  }

  if (!draw) {
    return {
      success: false,
      message: "السحب غير موجود.",
    };
  }

  if (
    ["running", "completed"].includes(
      String(draw.status),
    )
  ) {
    return {
      success: false,
      message:
        "لا يمكن إعادة تجهيز المشاركين بعد بدء السحب.",
    };
  }

  const {
    data: completedWinnerRows,
    error: completedWinnerRowsError,
  } = await supabase
    .from("monthly_draws")
    .select(
      "winner_user_id,winner_registry_id",
    )
    .eq("status", "completed");

  if (completedWinnerRowsError) {
    return {
      success: false,
      message:
        completedWinnerRowsError.message,
    };
  }

  const {
    winsByUserId,
    winsByRegistryId,
  } = buildWinnerCountMaps(
    completedWinnerRows ?? [],
  );

  const { data: profiles, error: profilesError } =
    await supabase
      .from("profiles")
      .select("id,full_name,full_name_en,role,is_active")
      .eq("is_active", true);

  if (profilesError) {
    return {
      success: false,
      message: profilesError.message,
    };
  }

  const eligibleProfiles = (profiles ?? []).filter(
    (profile) => {
      const role = String(
        profile.role ?? "",
      ).toLowerCase();

      return !["admin", "super_admin"].includes(role);
    },
  );

  const eligibleUserIds =
    eligibleProfiles.map(
      (profile) => profile.id,
    );

  const {
    data: linkedRegistryRows,
    error: linkedRegistryError,
  } =
    eligibleUserIds.length > 0
      ? await createAdminClient()
          .from("student_registry")
          .select("id,user_id,masar_id")
          .in(
            "user_id",
            eligibleUserIds,
          )
      : {
          data: [],
          error: null,
        };

  if (linkedRegistryError) {
    return {
      success: false,
      message:
        linkedRegistryError.message,
    };
  }

  const registryByUserId =
    new Map(
      (linkedRegistryRows ?? [])
        .filter(
          (row) => row.user_id,
        )
        .map((row) => [
          row.user_id as string,
          row,
        ]),
    );

  const participants: Array<{
    draw_id: string;
    user_id: string | null;
    registry_id: string | null;
    masar_id: number | null;
    student_email: string | null;
    student_name: string;
    points_snapshot: number;
    entries_count: number;
    ticket_start: number;
    ticket_end: number;
  }> = [];

  let nextTicket = 1;

  for (const profile of eligibleProfiles) {
    try {
      const passport = await getMasarPassport(profile.id);

      const points = Math.max(
        0,
        Number(passport.totalPoints ?? 0),
      );

      const baseEntries = Math.max(
        0,
        Number(
          passport.drawEntries ?? 0,
        ),
      );

      const linkedRegistry =
        registryByUserId.get(
          profile.id,
        ) ?? null;

      const previousWins =
        (
          linkedRegistry
            ? winsByRegistryId.get(
                linkedRegistry.id,
              ) ?? 0
            : 0
        ) +
        (
          winsByUserId.get(
            profile.id,
          ) ?? 0
        );

      const entries = Math.max(
        0,
        baseEntries -
          previousWins,
      );

      if (entries < 1) {
        continue;
      }

      const ticketStart = nextTicket;
      const ticketEnd =
        ticketStart + entries - 1;

      participants.push({
        draw_id: drawId,
        user_id: profile.id,
        registry_id:
          linkedRegistry?.id ??
          null,
        masar_id:
          Number(
            linkedRegistry?.masar_id ??
              0,
          ) || null,
        student_email: null,

        student_name:
          profile.full_name?.trim() ||
          profile.full_name_en?.trim() ||
          "طالب Masar Makers",

        points_snapshot: points,
        entries_count: entries,

        ticket_start: ticketStart,
        ticket_end: ticketEnd,
      });

      nextTicket = ticketEnd + 1;
    } catch (error) {
      console.error(
        `Failed to prepare draw participant ${profile.id}:`,
        error,
      );
    }
  }

  /*
   * الطلاب المستوردون الذين لم ينشئوا حسابًا بعد.
   *
   * نستبعد أي Registry مرتبط بـ user_id لأن هذا الطالب
   * تم احتسابه بالفعل من profiles أعلاه.
   */
  const admin = createAdminClient();

  const {
    data: importedRegistryRows,
    error: importedRegistryError,
  } = await admin
    .from("student_registry")
    .select(
      "id,masar_id,student_name,email,normalized_email,user_id",
    )
    .is("user_id", null)
    .order("masar_id", {
      ascending: true,
    });

  if (importedRegistryError) {
    return {
      success: false,
      message:
        importedRegistryError.message,
    };
  }

  for (
    const registry of
      importedRegistryRows ?? []
  ) {
    try {
      /*
       * لا ندخل Registry فارغًا لا يملك بيانات استيراد.
       * مصدر وجود الطالب المستورد الفعلي هو enrollment
       * القادم من admin_import.
       */
      const email = String(
        registry.normalized_email ??
          registry.email ??
          "",
      )
        .trim()
        .toLowerCase();

      if (!email) {
        continue;
      }

      const {
        count: importedEnrollmentCount,
        error: importedEnrollmentError,
      } = await admin
        .from("enrollments")
        .select("id", {
          count: "exact",
          head: true,
        })
        .ilike(
          "student_email",
          email,
        )
        .eq(
          "source",
          "admin_import",
        );

      if (importedEnrollmentError) {
        throw new Error(
          importedEnrollmentError.message,
        );
      }

      if (
        !importedEnrollmentCount ||
        importedEnrollmentCount < 1
      ) {
        continue;
      }

      const passport =
        await getMasarPassportForRegistry(
          registry.id,
        );

      const points = Math.max(
        0,
        Number(
          passport.totalPoints ?? 0,
        ),
      );

      const baseEntries = Math.max(
        0,
        Number(
          passport.drawEntries ?? 0,
        ),
      );

      const previousWins =
        winsByRegistryId.get(
          registry.id,
        ) ?? 0;

      const entries = Math.max(
        0,
        baseEntries -
          previousWins,
      );

      if (entries < 1) {
        continue;
      }

      const ticketStart =
        nextTicket;

      const ticketEnd =
        ticketStart +
        entries -
        1;

      participants.push({
        draw_id: drawId,
        user_id: null,
        registry_id:
          registry.id,
        masar_id:
          Number(
            registry.masar_id ??
              0,
          ) || null,
        student_email:
          email,
        student_name:
          String(
            registry.student_name ??
              "",
          ).trim() ||
          email.split("@")[0] ||
          "طالب Masar Makers",

        points_snapshot:
          points,
        entries_count:
          entries,
        ticket_start:
          ticketStart,
        ticket_end:
          ticketEnd,
      });

      nextTicket =
        ticketEnd + 1;
    } catch (error) {
      console.error(
        `Failed to prepare imported draw participant ${registry.id}:`,
        error,
      );
    }
  }

  // حذف الـ Snapshot القديم قبل إنشاء الجديد
  const { error: deleteError } = await supabase
    .from("monthly_draw_entries")
    .delete()
    .eq("draw_id", drawId);

  if (deleteError) {
    return {
      success: false,
      message: deleteError.message,
    };
  }

  if (participants.length > 0) {
    const { error: insertError } = await supabase
      .from("monthly_draw_entries")
      .insert(participants);

    if (insertError) {
      return {
        success: false,
        message: insertError.message,
      };
    }
  }

  const totalEntries = participants.reduce(
    (sum, participant) =>
      sum + participant.entries_count,
    0,
  );

  const { error: updateError } = await supabase
    .from("monthly_draws")
    .update({
      total_participants: participants.length,
      total_entries: totalEntries,
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  revalidateDrawPages();

  return {
    success: true,
    message:
      participants.length > 0
        ? `تم تجهيز ${participants.length} مشارك بإجمالي ${totalEntries} فرصة للسحب.`
        : "تم التجهيز، ولكن لا يوجد طلاب لديهم فرص سحب حاليًا.",
  };
}
/* =========================================================
   REVALIDATE
========================================================= */

function revalidateDrawPages() {
  revalidatePath(
    "/admin/content/monthly-draw",
  );

  revalidatePath("/");
  revalidatePath("/student");
}