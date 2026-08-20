"use server";

import { randomInt } from "crypto";

import { createAdminClient } from "@/lib/supabase/server";
import {
  getMasarPassport,
  getMasarPassportForRegistry,
} from "@/lib/dashboard/masar-passport";

const DRAW_SPIN_SECONDS = 10;

const DEFAULT_MONTHLY_DRAW_TITLE =
  "سحب مكافآت Masar Makers الشهري";

const DEFAULT_MONTHLY_PRIZE_TITLE =
  "رحلة يوم واحد مجانية من اختيار الفائز";

type PublicDrawStatus =
  | "countdown"
  | "running"
  | "completed";

export type PublicMonthlyDrawParticipant = {
  userId: string;
  studentName: string;
  entriesCount: number;
};

export type PublicMonthlyDrawState = {
  drawId: string;
  monthKey: string;
  title: string;
  prizeTitle: string | null;
  prizeDescription: string | null;
  prizeImageUrl: string | null;

  phase: PublicDrawStatus;

  scheduledAt: string;
  countdownEndsAt: string | null;
  countdownSeconds: number;
  runningEndsAt: string | null;

  totalParticipants: number;
  totalEntries: number;
  participants: PublicMonthlyDrawParticipant[];

  winnerName: string | null;
  winningTicket: number | null;
  completedAt: string | null;

  resultPopupActive: boolean;
  nextDrawAt: string;
  nextPrizeTitle: string;
};

type SettingsRow = {
  draw_day: number;
  draw_hour: number;
  timezone: string;

  points_per_entry: number;
  countdown_seconds: number;
  result_popup_days: number;
  is_enabled: boolean;
};

type DrawRow = {
  id: string;
  month_key: string;
  title: string;
  prize_title: string | null;
  prize_description: string | null;
  prize_image_url: string | null;
  scheduled_at: string;
  status: string;
  winner_mode: "random" | "manual";
  preset_winner_user_id: string | null;
  preset_winner_registry_id: string | null;
  winner_user_id: string | null;
  winner_registry_id: string | null;
  winner_name: string | null;
  winning_ticket: number | null;
  total_participants: number | null;
  total_entries: number | null;
  countdown_started_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  result_visible_until: string | null;
  is_published: boolean;
};

type EntryRow = {
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
};

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

async function getSettings(): Promise<SettingsRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("monthly_draw_settings")
    .select(
  "draw_day,draw_hour,timezone,points_per_entry,countdown_seconds,result_popup_days,is_enabled",
)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "PUBLIC MONTHLY DRAW SETTINGS ERROR:",
      error.message,
    );
    return null;
  }

  return (data as SettingsRow | null) ?? null;
}

async function getEntries(
  drawId: string,
): Promise<EntryRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("monthly_draw_entries")
    .select(
      "id,draw_id,user_id,registry_id,masar_id,student_email,student_name,points_snapshot,entries_count,ticket_start,ticket_end",
    )
    .eq("draw_id", drawId)
    .order("ticket_start", { ascending: true });

  if (error) {
    console.error(
      "PUBLIC MONTHLY DRAW ENTRIES ERROR:",
      error.message,
    );
    return [];
  }

  return (data ?? []) as EntryRow[];
}

/*
 * Automatic preparation is intentionally idempotent:
 * if this draw already has a snapshot, we keep it frozen.
 * This preserves a previously prepared participant list and any
 * preset winner selected from that same snapshot.
 */
async function ensureParticipantSnapshot(
  draw: DrawRow,
  settings: SettingsRow,
): Promise<EntryRow[]> {
  const existingEntries = await getEntries(draw.id);

  if (existingEntries.length > 0) {
    return existingEntries;
  }

  const supabase = createAdminClient();

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
    throw new Error(
      completedWinnerRowsError.message,
    );
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
      .select(
        "id,full_name,full_name_en,role,is_active",
      )
      .eq("is_active", true)
      .order("id", { ascending: true });

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const eligibleProfiles = (profiles ?? []).filter(
    (profile) => {
      const role = String(
        profile.role ?? "",
      )
        .trim()
        .toLowerCase();

      return ![
        "admin",
        "super_admin",
      ].includes(role);
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
      ? await supabase
          .from("student_registry")
          .select(
            "id,user_id,masar_id",
          )
          .in(
            "user_id",
            eligibleUserIds,
          )
      : {
          data: [],
          error: null,
        };

  if (linkedRegistryError) {
    throw new Error(
      linkedRegistryError.message,
    );
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

  const rows: Array<{
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
      const passport =
        await getMasarPassport(profile.id);

      const points = Math.max(
        0,
        Math.floor(
          Number(
            passport.totalPoints ?? 0,
          ),
        ),
      );

      const baseEntries = Math.max(
        0,
        Math.floor(
          Number(
            passport.drawEntries ??
              0,
          ),
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

      rows.push({
        draw_id: draw.id,
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

      nextTicket =
        ticketEnd + 1;
    } catch (error) {
      console.error(
        `AUTO PREPARE MONTHLY DRAW PARTICIPANT ${profile.id} ERROR:`,
        error,
      );
    }
  }

  /*
   * أضف الطلاب المستوردين الذين لم يسجلوا بعد.
   * أي Registry أصبح مرتبطًا بـ user_id مستبعد هنا لأنه
   * دخل بالفعل من profiles أعلاه.
   */
  const {
    data: importedRegistryRows,
    error: importedRegistryError,
  } = await supabase
    .from("student_registry")
    .select(
      "id,masar_id,student_name,email,normalized_email,user_id",
    )
    .is("user_id", null)
    .order("masar_id", {
      ascending: true,
    });

  if (importedRegistryError) {
    throw new Error(
      importedRegistryError.message,
    );
  }

  for (
    const registry of
      importedRegistryRows ?? []
  ) {
    try {
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
      } = await supabase
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
        Math.floor(
          Number(
            passport.totalPoints ??
              0,
          ),
        ),
      );

      const baseEntries = Math.max(
        0,
        Math.floor(
          Number(
            passport.drawEntries ??
              0,
          ),
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

      rows.push({
        draw_id: draw.id,
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
        `AUTO PREPARE IMPORTED MONTHLY DRAW PARTICIPANT ${registry.id} ERROR:`,
        error,
      );
    }
  }

  if (rows.length > 0) {
    /*
     * HomeMonthlyDrawStatus and MonthlyDrawOverlay can request the
     * public draw state at the same time. Both may reach this function
     * before either request has finished inserting the snapshot.
     *
     * The table already has a unique constraint on
     * (draw_id, user_id), so use an idempotent upsert and ignore the
     * duplicate row from the second concurrent request.
     */
    /*
     * لا نستخدم upsert على (draw_id,user_id) لكل الصفوف لأن
     * user_id = null عند الطالب المستورد. نعتمد على الـ unique
     * indexes الخاصة بـ user_id وregistry_id، ومع التزامن قد تصل
     * محاولة ثانية لنفس Snapshot؛ عندها نتجاهل duplicate key.
     */
    const { error: insertError } =
      await supabase
        .from("monthly_draw_entries")
        .insert(rows);

    if (
      insertError &&
      insertError.code !== "23505"
    ) {
      throw new Error(
        insertError.message,
      );
    }
  }

  const totalEntries = rows.reduce(
    (sum, row) =>
      sum + row.entries_count,
    0,
  );

  const { error: updateError } =
    await supabase
      .from("monthly_draws")
      .update({
        total_participants:
          rows.length,
        total_entries:
          totalEntries,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", draw.id);

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }

  return getEntries(draw.id);
}

function findParticipantByTicket(
  entries: EntryRow[],
  ticket: number,
) {
  return (
    entries.find((entry) => {
      const start =
        Number(
          entry.ticket_start ?? 0,
        );

      const end =
        Number(
          entry.ticket_end ?? 0,
        );

      return (
        ticket >= start &&
        ticket <= end
      );
    }) ?? null
  );
}

async function completeDraw(
  draw: DrawRow,
  settings: SettingsRow,
): Promise<DrawRow> {
  const supabase = createAdminClient();

  const latestResult =
    await supabase
      .from("monthly_draws")
      .select("*")
      .eq("id", draw.id)
      .maybeSingle();

  if (
    latestResult.error ||
    !latestResult.data
  ) {
    throw new Error(
      latestResult.error?.message ||
        "السحب غير موجود.",
    );
  }

  const latest =
    latestResult.data as DrawRow;

  if (
    latest.status ===
      "completed" &&
    latest.winner_name
  ) {
    return latest;
  }

  const entries =
    await ensureParticipantSnapshot(
      latest,
      settings,
    );

  const totalEntries = entries.reduce(
    (sum, entry) =>
      sum +
      Math.max(
        0,
        Number(
          entry.entries_count ?? 0,
        ),
      ),
    0,
  );

  if (
    entries.length === 0 ||
    totalEntries < 1
  ) {
    /*
     * Keep the draw available rather than fabricating a winner.
     * The admin can add eligible students/points and re-prepare it.
     */
    return latest;
  }

  let winnerEntry: EntryRow | null =
    null;

  let winningTicket = 0;

  if (
    latest.winner_mode ===
    "manual"
  ) {
    if (
      latest.preset_winner_registry_id
    ) {
      winnerEntry =
        entries.find(
          (entry) =>
            entry.registry_id ===
            latest.preset_winner_registry_id,
        ) ?? null;
    }

    if (
      !winnerEntry &&
      latest.preset_winner_user_id
    ) {
      winnerEntry =
        entries.find(
          (entry) =>
            entry.user_id ===
            latest.preset_winner_user_id,
        ) ?? null;
    }

    if (winnerEntry) {
      const start = Math.max(
        1,
        Number(
          winnerEntry.ticket_start ??
            1,
        ),
      );

      const end = Math.max(
        start,
        Number(
          winnerEntry.ticket_end ??
            start,
        ),
      );

      winningTicket =
        randomInt(
          start,
          end + 1,
        );
    }
  }

  /*
   * If no preset winner exists in the frozen snapshot,
   * fall back to the real weighted random draw.
   */
  if (!winnerEntry) {
    winningTicket =
      randomInt(
        1,
        totalEntries + 1,
      );

    winnerEntry =
      findParticipantByTicket(
        entries,
        winningTicket,
      );
  }

  if (!winnerEntry) {
    return latest;
  }

  const now =
    new Date();

  const resultVisibleUntil =
    new Date(
      getMonthEndIso(
        latest.month_key,
      ),
    );

  /*
   * The conditional update prevents two simultaneous visitors
   * from overwriting each other's result.
   */
  const { error: updateError } =
    await supabase
      .from("monthly_draws")
      .update({
        status: "completed",
        winner_user_id:
          winnerEntry.user_id,
        winner_registry_id:
          winnerEntry.registry_id,
        winner_name:
          winnerEntry.student_name,
        winning_ticket:
          winningTicket,
        started_at:
          latest.started_at ??
          now.toISOString(),
        completed_at:
          now.toISOString(),
        result_visible_until:
          resultVisibleUntil.toISOString(),
        updated_at:
          now.toISOString(),
      })
      .eq("id", latest.id)
      .neq("status", "completed");

  if (updateError) {
    console.error(
      "COMPLETE MONTHLY DRAW ERROR:",
      updateError.message,
    );
  }

  const { data: completed } =
    await supabase
      .from("monthly_draws")
      .select("*")
      .eq("id", latest.id)
      .maybeSingle();

  return (
    (completed as DrawRow | null) ??
    latest
  );
}

async function advanceDueDraw(
  draw: DrawRow,
  settings: SettingsRow,
): Promise<DrawRow> {
  const now = new Date();

  const scheduledAt =
    new Date(draw.scheduled_at);

  if (
    Number.isNaN(
      scheduledAt.getTime(),
    ) ||
    now < scheduledAt
  ) {
    return draw;
  }

  const supabase =
    createAdminClient();

  const countdownSeconds =
    Math.max(
      1,
      Number(
        settings.countdown_seconds ??
          10,
      ),
    );

  let current = draw;

  async function reloadCurrent() {
    const { data, error } =
      await supabase
        .from("monthly_draws")
        .select("*")
        .eq("id", draw.id)
        .maybeSingle();

    if (error || !data) {
      throw new Error(
        error?.message ||
          "تعذر قراءة حالة السحب.",
      );
    }

    return data as DrawRow;
  }

  /*
   * 1) scheduled/draft -> countdown
   *
   * Start the visible 10-second countdown from the moment the platform
   * first detects that the draw is due, not retroactively from
   * scheduled_at. This guarantees the visitor actually sees 10..1 even
   * if the browser/server reaches the scheduled time a few seconds late.
   */
  if (
    current.status === "scheduled" ||
    current.status === "draft"
  ) {
    await ensureParticipantSnapshot(
      current,
      settings,
    );

    const countdownStartedAt =
      new Date();

    const { data, error } =
      await supabase
        .from("monthly_draws")
        .update({
          status: "countdown",
          countdown_started_at:
            countdownStartedAt.toISOString(),
          started_at: null,
          completed_at: null,
          updated_at:
            countdownStartedAt.toISOString(),
        })
        .eq("id", current.id)
        .in("status", [
          "scheduled",
          "draft",
        ])
        .select("*")
        .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    current = data
      ? (data as DrawRow)
      : await reloadCurrent();
  }

  /*
   * 2) countdown -> running
   *
   * Use countdown_started_at as the source of truth.
   */
  if (
    current.status === "countdown"
  ) {
    const countdownStartedAt =
      current.countdown_started_at
        ? new Date(
            current.countdown_started_at,
          )
        : now;

    const countdownEndsAt =
      new Date(
        countdownStartedAt.getTime() +
          countdownSeconds * 1000,
      );

    if (now >= countdownEndsAt) {
      const runningStartedAt =
        new Date();

      const { data, error } =
        await supabase
          .from("monthly_draws")
          .update({
            status: "running",
            started_at:
              runningStartedAt.toISOString(),
            updated_at:
              runningStartedAt.toISOString(),
          })
          .eq("id", current.id)
          .eq("status", "countdown")
          .select("*")
          .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      current = data
        ? (data as DrawRow)
        : await reloadCurrent();
    }
  }

  /*
   * 3) running -> completed
   *
   * Give the wheel a real visible running window.
   */
  if (
    current.status === "running"
  ) {
    const runningStartedAt =
      current.started_at
        ? new Date(
            current.started_at,
          )
        : now;

    const runningEndsAt =
      new Date(
        runningStartedAt.getTime() +
          DRAW_SPIN_SECONDS * 1000,
      );

    if (now >= runningEndsAt) {
      current =
        await completeDraw(
          current,
          settings,
        );
    }
  }

  return current;
}


function getMonthKeyInRiyadh(
  date = new Date(),
): string {
  /*
   * Riyadh is UTC+03 all year (no DST).
   */
  const local =
    new Date(
      date.getTime() +
        3 * 60 * 60 * 1000,
    );

  return `${local.getUTCFullYear()}-${String(
    local.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

function getScheduledAtForMonth(
  monthKey: string,
  settings: SettingsRow,
): Date {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthKey,
    );

  if (!match) {
    return new Date();
  }

  const year =
    Number(match[1]);

  const monthIndex =
    Number(match[2]) - 1;

  const day =
    Math.max(
      1,
      Math.min(
        28,
        Number(
          settings.draw_day ?? 1,
        ),
      ),
    );

  const hour =
    Math.max(
      0,
      Math.min(
        23,
        Number(
          settings.draw_hour ?? 20,
        ),
      ),
    );

  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      hour,
      0,
      0,
    ) -
      3 * 60 * 60 * 1000,
  );
}

/*
 * Automatic monthly draw:
 * - If the administrator created a row for this month, we respect it.
 * - If no row exists and the configured monthly draw time has arrived,
 *   create a published random draw automatically.
 * - The admin can therefore override the next month simply by creating
 *   or editing that month's row before its scheduled time.
 */
async function ensureAutomaticDueDraw(
  settings: SettingsRow,
): Promise<void> {
  const now =
    new Date();

  const monthKey =
    getMonthKeyInRiyadh(now);

  const scheduledAt =
    getScheduledAtForMonth(
      monthKey,
      settings,
    );

  if (
    Number.isNaN(
      scheduledAt.getTime(),
    ) ||
    now < scheduledAt
  ) {
    return;
  }

  const supabase =
    createAdminClient();

  const existing =
    await supabase
      .from("monthly_draws")
      .select("id")
      .eq("month_key", monthKey)
      .limit(1)
      .maybeSingle();

  if (existing.error) {
    throw new Error(
      existing.error.message,
    );
  }

  /*
   * Any row for the month is considered an admin override,
   * even if it is unpublished/cancelled.
   */
  if (existing.data) {
    return;
  }

  const nowIso =
    now.toISOString();

  const { error } =
    await supabase
      .from("monthly_draws")
      .insert({
        month_key:
          monthKey,
        title:
          DEFAULT_MONTHLY_DRAW_TITLE,
        prize_title:
          DEFAULT_MONTHLY_PRIZE_TITLE,
        prize_description:
          "الفائز يختار رحلة واحدة من رحلات اليوم الواحد المتاحة على منصة Masar Makers.",
        scheduled_at:
          scheduledAt.toISOString(),
        status:
          "scheduled",
        winner_mode:
          "random",
        is_published:
          true,
        total_participants:
          0,
        total_entries:
          0,
        created_at:
          nowIso,
        updated_at:
          nowIso,
      });

  /*
   * Two simultaneous visitors may both try to create the automatic row.
   * If a unique month_key constraint rejects the second insert, ignore it.
   */
  if (
    error &&
    error.code !== "23505"
  ) {
    throw new Error(
      error.message,
    );
  }
}

function getMonthEndIso(
  monthKey: string,
): string {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthKey,
    );

  if (!match) {
    return new Date(
      Date.now() +
        31 *
          24 *
          60 *
          60 *
          1000,
    ).toISOString();
  }

  const year =
    Number(match[1]);
  const monthIndex =
    Number(match[2]) - 1;

  /*
   * End of the draw month in Saudi time (+03:00).
   * Asia/Riyadh has no DST, so the fixed offset is safe here.
   */
  const nextMonthStart =
    new Date(
      Date.UTC(
        year,
        monthIndex + 1,
        1,
        0,
        0,
        0,
      ) -
        3 *
          60 *
          60 *
          1000,
    );

  return new Date(
    nextMonthStart.getTime() - 1,
  ).toISOString();
}

function getDerivedNextDrawAt(
  monthKey: string,
  settings: SettingsRow,
): string {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthKey,
    );

  const base = match
    ? {
        year: Number(match[1]),
        monthIndex:
          Number(match[2]) - 1,
      }
    : (() => {
        const now =
          new Date();

        return {
          year:
            now.getUTCFullYear(),
          monthIndex:
            now.getUTCMonth(),
        };
      })();

  const day = Math.max(
    1,
    Math.min(
      28,
      Number(
        settings.draw_day ?? 1,
      ),
    ),
  );

  const hour = Math.max(
    0,
    Math.min(
      23,
      Number(
        settings.draw_hour ?? 20,
      ),
    ),
  );

  /*
   * First draw time of the following month in Saudi time.
   * Example: 2026-10-01 20:00 +03:00.
   */
  const nextLocal =
    new Date(
      Date.UTC(
        base.year,
        base.monthIndex + 1,
        day,
        hour,
        0,
        0,
      ) -
        3 *
          60 *
          60 *
          1000,
    );

  return nextLocal.toISOString();
}
async function getCurrentWinnerName(
  draw: DrawRow,
): Promise<string | null> {
  if (!draw.winner_user_id) {
    return draw.winner_name;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,full_name_en")
    .eq("id", draw.winner_user_id)
    .maybeSingle();

  if (error) {
    console.error(
      "PUBLIC MONTHLY DRAW WINNER PROFILE ERROR:",
      error.message,
    );

    return draw.winner_name;
  }

  const currentName =
    data?.full_name?.trim() ||
    data?.full_name_en?.trim() ||
    null;

  return currentName || draw.winner_name;
}

function toPublicState(
  draw: DrawRow,
  settings: SettingsRow,
  entries: EntryRow[],
  nextDrawAt?: string,
  nextPrizeTitle?: string | null,
  currentWinnerName?: string | null,
): PublicMonthlyDrawState {
  const scheduledAt =
    new Date(draw.scheduled_at);

  const countdownStartedAt =
    draw.countdown_started_at
      ? new Date(
          draw.countdown_started_at,
        )
      : scheduledAt;

  const countdownEndsAt =
    new Date(
      countdownStartedAt.getTime() +
        Math.max(
          1,
          Number(
            settings.countdown_seconds ??
              10,
          ),
        ) *
          1000,
    );

  const runningStartedAt =
    draw.started_at
      ? new Date(draw.started_at)
      : countdownEndsAt;

  const runningEndsAt =
    new Date(
      runningStartedAt.getTime() +
        DRAW_SPIN_SECONDS * 1000,
    );

  /*
   * The monthly winner result stays active through the end
   * of the draw month, not only for result_popup_days.
   */
  const monthEnd =
    new Date(
      getMonthEndIso(
        draw.month_key,
      ),
    );

  const resultPopupActive =
    draw.status === "completed" &&
    monthEnd.getTime() >=
      Date.now();

  const phase: PublicDrawStatus =
    draw.status === "completed"
      ? "completed"
      : draw.status === "running"
        ? "running"
        : "countdown";

  return {
    drawId: draw.id,
    monthKey: draw.month_key,
    title: draw.title,
    prizeTitle:
      draw.prize_title,
    prizeDescription:
      draw.prize_description,
    prizeImageUrl:
      draw.prize_image_url,

    phase,

    scheduledAt:
      draw.scheduled_at,

    countdownEndsAt:
      phase === "countdown"
        ? countdownEndsAt.toISOString()
        : null,

    countdownSeconds:
      Math.max(
        1,
        Number(
          settings.countdown_seconds ??
            10,
        ),
      ),

    runningEndsAt:
      phase === "running"
        ? runningEndsAt.toISOString()
        : null,

    totalParticipants:
      Number(
        draw.total_participants ??
          entries.length,
      ),

    totalEntries:
      Number(
        draw.total_entries ??
          entries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.entries_count ??
                  0,
              ),
            0,
          ),
      ),

    participants:
      entries.map((entry) => ({
        userId:
          entry.user_id ??
          entry.registry_id ??
          entry.id,
        studentName:
          entry.student_name,
        entriesCount:
          Math.max(
            1,
            Number(
              entry.entries_count ??
                1,
            ),
          ),
      })),

    winnerName:
  phase === "completed"
    ? currentWinnerName ||
      draw.winner_name
    : null,

    winningTicket:
      phase === "completed"
        ? draw.winning_ticket
        : null,

    completedAt:
      phase === "completed"
        ? draw.completed_at
        : null,

    resultPopupActive,

    nextDrawAt:
      nextDrawAt ??
      getDerivedNextDrawAt(
        draw.month_key,
        settings,
      ),

    nextPrizeTitle:
      nextPrizeTitle?.trim() ||
      draw.prize_title?.trim() ||
      DEFAULT_MONTHLY_PRIZE_TITLE,
  };
}

export async function getPublicMonthlyDrawState(): Promise<
  PublicMonthlyDrawState | null
> {
  const settings =
    await getSettings();

  if (
    !settings ||
    !settings.is_enabled
  ) {
    return null;
  }

  try {
    await ensureAutomaticDueDraw(
      settings,
    );
  } catch (error) {
    console.error(
      "AUTO MONTHLY DRAW CREATE ERROR:",
      error,
    );
  }

  const supabase =
    createAdminClient();

  const { data, error } =
    await supabase
      .from("monthly_draws")
      .select("*")
      .eq("is_published", true)
      .neq("status", "cancelled")
      .order("scheduled_at", {
        ascending: false,
      })
      .limit(12);

  if (error) {
    console.error(
      "PUBLIC MONTHLY DRAWS ERROR:",
      error.message,
    );
    return null;
  }

  const draws =
    (data ?? []) as DrawRow[];

  if (draws.length === 0) {
    return null;
  }

  const now = Date.now();

  const nextUpcomingDraw =
    [...draws]
      .filter((draw) => {
        if (
          draw.status ===
            "completed" ||
          draw.status ===
            "cancelled"
        ) {
          return false;
        }

        const scheduled =
          new Date(
            draw.scheduled_at,
          ).getTime();

        return (
          Number.isFinite(
            scheduled,
          ) &&
          scheduled > now
        );
      })
      .sort(
        (a, b) =>
          new Date(
            a.scheduled_at,
          ).getTime() -
          new Date(
            b.scheduled_at,
          ).getTime(),
      )[0] ?? null;

  /*
   * First priority: a draw whose scheduled time has arrived
   * and which is not completed yet.
   */
  const dueDraw =
    draws.find((draw) => {
      if (
        draw.status ===
          "completed" ||
        draw.status ===
          "cancelled"
      ) {
        return false;
      }

      const scheduled =
        new Date(
          draw.scheduled_at,
        ).getTime();

      return (
        Number.isFinite(
          scheduled,
        ) &&
        scheduled <= now
      );
    }) ?? null;

  if (dueDraw) {
    const advanced =
      await advanceDueDraw(
        dueDraw,
        settings,
      );

    const entries =
      await getEntries(
        advanced.id,
      );

    const currentWinnerName =
      await getCurrentWinnerName(
        advanced,
      );

    return toPublicState(
      advanced,
      settings,
      entries,
      nextUpcomingDraw?.scheduled_at,
      nextUpcomingDraw?.prize_title ??
        dueDraw.prize_title ??
        DEFAULT_MONTHLY_PRIZE_TITLE,
      currentWinnerName,
    );
  }

  /*
   * Otherwise expose the latest completed result.
   * The popup itself auto-opens only during result_popup_days,
   * while the homepage result button can remain available until
   * the next draw becomes due.
   */
  const latestCompleted =
    draws.find(
      (draw) =>
        draw.status ===
          "completed" &&
        Boolean(
          draw.winner_name,
        ),
    ) ?? null;

  if (!latestCompleted) {
    return null;
  }

  const entries =
    await getEntries(
      latestCompleted.id,
    );

  const currentWinnerName =
    await getCurrentWinnerName(
      latestCompleted,
    );

  return toPublicState(
    latestCompleted,
    settings,
    entries,
    nextUpcomingDraw?.scheduled_at,
    nextUpcomingDraw?.prize_title ??
      latestCompleted.prize_title ??
      DEFAULT_MONTHLY_PRIZE_TITLE,
    currentWinnerName,
  );
}