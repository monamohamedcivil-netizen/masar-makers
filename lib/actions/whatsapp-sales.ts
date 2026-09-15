"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const PAGE =
  "/admin/whatsapp-sales";

async function adminClient() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("غير مصرح.");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profile?.role !== "admin") {
    throw new Error(
      "هذه العملية للإدارة فقط.",
    );
  }

  return supabase;
}

function text(
  formData: FormData,
  key: string,
) {
  return String(
    formData.get(key) ?? "",
  ).trim();
}

function nullable(
  formData: FormData,
  key: string,
) {
  const value = text(
    formData,
    key,
  );

  return value || null;
}

function checked(
  formData: FormData,
  key: string,
) {
  return (
    formData.get(key) === "on"
  );
}

function number(
  formData: FormData,
  key: string,
  fallback = 0,
) {
  const value = Number(
    formData.get(key),
  );

  return Number.isFinite(value)
    ? value
    : fallback;
}

function refresh() {
  revalidatePath(PAGE);
}

/* =========================
   SETTINGS
========================= */

export async function updateBotSettings(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from(
        "whatsapp_bot_settings",
      )
      .update({
        bot_enabled:
          checked(
            formData,
            "bot_enabled",
          ),

        greeting_text:
          text(
            formData,
            "greeting_text",
          ),

        human_mode_hours:
          number(
            formData,
            "human_mode_hours",
            24,
          ),

        unknown_message_behavior:
          text(
            formData,
            "unknown_message_behavior",
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", 1);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

/* =========================
   COURSES
========================= */

export async function createCourse(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const courseKey =
    text(
      formData,
      "course_key",
    );

  const title =
    text(
      formData,
      "title",
    );

  const whatsappLabel =
    text(
      formData,
      "whatsapp_label",
    ) || title;

  if (
    whatsappLabel.length > 24
  ) {
    throw new Error(
      "اسم الكورس الظاهر في قائمة WhatsApp يجب ألا يتجاوز 24 حرفًا.",
    );
  }

  const {
    data: course,
    error,
  } = await supabase
    .from("whatsapp_courses")
    .insert({
      course_key: courseKey,
      title,

      whatsapp_label:
        whatsappLabel,

      track:
        nullable(
          formData,
          "track",
        ),

      short_description:
        nullable(
          formData,
          "short_description",
        ),

      details:
        nullable(
          formData,
          "details",
        ),

      intro_video_url:
        nullable(
          formData,
          "intro_video_url",
        ),

      course_url:
        nullable(
          formData,
          "course_url",
        ),

      has_variants:
        checked(
          formData,
          "has_variants",
        ),

      variants_prompt:
        text(
          formData,
          "variants_prompt",
        ) ||
        "أنواع الكورس",

      sort_order:
        number(
          formData,
          "sort_order",
          100,
        ),

      is_active: true,
      whatsapp_visible: true,
    })
    .select("id")
    .single();

  if (error || !course) {
    throw new Error(
      error?.message ??
        "تعذر إنشاء الكورس.",
    );
  }

  
  }

  refresh();


export async function updateCourse(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const id =
    text(
      formData,
      "id",
    );

  const title =
    text(
      formData,
      "title",
    );

  const whatsappLabel =
    text(
      formData,
      "whatsapp_label",
    ) || title;

  if (
    whatsappLabel.length > 24
  ) {
    throw new Error(
      "اسم WhatsApp يجب ألا يتجاوز 24 حرفًا.",
    );
  }

  const visible =
    checked(
      formData,
      "whatsapp_visible",
    );

  const active =
    checked(
      formData,
      "is_active",
    );

  const sortOrder =
    number(
      formData,
      "sort_order",
    );

  const { error } =
    await supabase
      .from("whatsapp_courses")
      .update({
        title,
        whatsapp_label:
          whatsappLabel,

        track:
          nullable(
            formData,
            "track",
          ),

        short_description:
          nullable(
            formData,
            "short_description",
          ),

        details:
          nullable(
            formData,
            "details",
          ),

        intro_video_url:
          nullable(
            formData,
            "intro_video_url",
          ),

        course_url:
          nullable(
            formData,
            "course_url",
          ),

        has_variants:
          checked(
            formData,
            "has_variants",
          ),

        variants_prompt:
          text(
            formData,
            "variants_prompt",
          ) ||
          "أنواع الكورس",

        sort_order:
          sortOrder,

        is_active:
          active,

        whatsapp_visible:
          visible,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  await supabase
    .from(
      "whatsapp_menu_items",
    )
    .update({
      label:
        whatsappLabel,

      sort_order:
        sortOrder,

      is_active:
        active &&
        visible,

      updated_at:
        new Date().toISOString(),
    })
    .eq("course_id", id)
    .eq(
      "action_type",
      "open_course",
    );

  refresh();
}

/* =========================
   VARIANTS
========================= */

export async function createCourseVariant(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from(
        "whatsapp_course_variants",
      )
      .insert({
        course_id:
          text(
            formData,
            "course_id",
          ),

        variant_key:
          text(
            formData,
            "variant_key",
          ),

        title:
          text(
            formData,
            "title",
          ),

        short_description:
          nullable(
            formData,
            "short_description",
          ),

        details:
          nullable(
            formData,
            "details",
          ),

        intro_video_url:
          nullable(
            formData,
            "intro_video_url",
          ),

        course_url:
          nullable(
            formData,
            "course_url",
          ),

        sort_order:
          number(
            formData,
            "sort_order",
            100,
          ),

        is_active: true,
        whatsapp_visible: true,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function updateCourseVariant(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from(
        "whatsapp_course_variants",
      )
      .update({
        title:
          text(
            formData,
            "title",
          ),

        short_description:
          nullable(
            formData,
            "short_description",
          ),

        details:
          nullable(
            formData,
            "details",
          ),

        intro_video_url:
          nullable(
            formData,
            "intro_video_url",
          ),

        course_url:
          nullable(
            formData,
            "course_url",
          ),

        sort_order:
          number(
            formData,
            "sort_order",
          ),

        is_active:
          checked(
            formData,
            "is_active",
          ),

        whatsapp_visible:
          checked(
            formData,
            "whatsapp_visible",
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        text(
          formData,
          "id",
        ),
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

/* =========================
   PRICES
========================= */

export async function savePrice(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const courseId =
    text(
      formData,
      "course_id",
    );

  const variantId =
    nullable(
      formData,
      "variant_id",
    );

  const currencyCode =
    text(
      formData,
      "currency_code",
    ).toUpperCase();

  let existingQuery =
    supabase
      .from(
        "whatsapp_course_prices",
      )
      .select("id")
      .eq(
        "course_id",
        courseId,
      )
      .eq(
        "currency_code",
        currencyCode,
      );

  existingQuery =
    variantId
      ? existingQuery.eq(
          "variant_id",
          variantId,
        )
      : existingQuery.is(
          "variant_id",
          null,
        );

  const {
    data: existing,
    error: lookupError,
  } =
    await existingQuery.maybeSingle();

  if (lookupError) {
    throw new Error(
      lookupError.message,
    );
  }

  const originalText =
    text(
      formData,
      "original_price",
    );

  const offerStart =
    text(
      formData,
      "offer_start",
    );

  const offerEnd =
    text(
      formData,
      "offer_end",
    );

  const payload = {
    course_id:
      courseId,

    variant_id:
      variantId,

    currency_code:
      currencyCode,

    currency_label:
      text(
        formData,
        "currency_label",
      ),

    current_price:
      number(
        formData,
        "current_price",
      ),

    original_price:
      originalText
        ? Number(
            originalText,
          )
        : null,

    offer_label:
      nullable(
        formData,
        "offer_label",
      ),

    offer_active:
      checked(
        formData,
        "offer_active",
      ),

    offer_start:
      offerStart
        ? new Date(
            offerStart,
          ).toISOString()
        : null,

    offer_end:
      offerEnd
        ? new Date(
            offerEnd,
          ).toISOString()
        : null,

    is_active:
      checked(
        formData,
        "is_active",
      ),

    sort_order:
      number(
        formData,
        "sort_order",
        100,
      ),

    updated_at:
      new Date().toISOString(),
  };

  const result =
    existing
      ? await supabase
          .from(
            "whatsapp_course_prices",
          )
          .update(payload)
          .eq(
            "id",
            existing.id,
          )
      : await supabase
          .from(
            "whatsapp_course_prices",
          )
          .insert(payload);

  if (result.error) {
    throw new Error(
      result.error.message,
    );
  }

  refresh();
}

/* =========================
   ANSWERS
========================= */

export async function createAnswer(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from("whatsapp_answers")
      .insert({
        answer_key:
          text(
            formData,
            "answer_key",
          ),

        admin_name:
          text(
            formData,
            "admin_name",
          ),

        message_text:
          text(
            formData,
            "message_text",
          ),

        is_active: true,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function updateAnswer(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from("whatsapp_answers")
      .update({
        admin_name:
          text(
            formData,
            "admin_name",
          ),

        message_text:
          text(
            formData,
            "message_text",
          ),

        is_active:
          checked(
            formData,
            "is_active",
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        text(
          formData,
          "id",
        ),
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

/* =========================
   MENUS
========================= */

async function menuLimits(
  menuId: string,
) {
  const supabase =
    await adminClient();

  const { data, error } =
    await supabase
      .from("whatsapp_menus")
      .select(
        "interaction_type",
      )
      .eq("id", menuId)
      .single();

  if (error || !data) {
    throw new Error(
      "القائمة غير موجودة.",
    );
  }

  return {
    max:
      data.interaction_type ===
      "buttons"
        ? 3
        : 10,

    titleMax:
      data.interaction_type ===
      "buttons"
        ? 20
        : 24,
  };
}

export async function createMenu(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const type =
    text(
      formData,
      "interaction_type",
    );

  const { error } =
    await supabase
      .from("whatsapp_menus")
      .insert({
        menu_key:
          text(
            formData,
            "menu_key",
          ),

        admin_name:
          text(
            formData,
            "admin_name",
          ),

        interaction_type:
          type,

        header_text:
          nullable(
            formData,
            "header_text",
          ),

        body_text:
          text(
            formData,
            "body_text",
          ),

        footer_text:
          nullable(
            formData,
            "footer_text",
          ),

        open_button_text:
          type === "list"
            ? nullable(
                formData,
                "open_button_text",
              )
            : null,

        sort_order:
          number(
            formData,
            "sort_order",
            100,
          ),

        is_active: true,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function updateMenu(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const type =
    text(
      formData,
      "interaction_type",
    );

  const { error } =
    await supabase
      .from("whatsapp_menus")
      .update({
        admin_name:
          text(
            formData,
            "admin_name",
          ),

        interaction_type:
          type,

        header_text:
          nullable(
            formData,
            "header_text",
          ),

        body_text:
          text(
            formData,
            "body_text",
          ),

        footer_text:
          nullable(
            formData,
            "footer_text",
          ),

        open_button_text:
          type === "list"
            ? nullable(
                formData,
                "open_button_text",
              )
            : null,

        sort_order:
          number(
            formData,
            "sort_order",
          ),

        is_active:
          checked(
            formData,
            "is_active",
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        text(
          formData,
          "id",
        ),
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function createMenuItem(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const menuId =
    text(
      formData,
      "menu_id",
    );

  const limits =
    await menuLimits(
      menuId,
    );

  const label =
    text(
      formData,
      "label",
    );

  if (
    label.length >
    limits.titleMax
  ) {
    throw new Error(
      `النص يتجاوز ${limits.titleMax} حرفًا.`,
    );
  }

  const { count } =
    await supabase
      .from(
        "whatsapp_menu_items",
      )
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "menu_id",
        menuId,
      )
      .eq(
        "is_active",
        true,
      );

  if (
    (count ?? 0) >=
    limits.max
  ) {
    throw new Error(
      `وصلت القائمة إلى الحد الأقصى ${limits.max}.`,
    );
  }

  const { error } =
    await supabase
      .from(
        "whatsapp_menu_items",
      )
      .insert({
        menu_id:
          menuId,

        item_key:
          text(
            formData,
            "item_key",
          ),

        label,

        description:
          nullable(
            formData,
            "description",
          ),

        action_type:
          text(
            formData,
            "action_type",
          ),

        target_menu_id:
          nullable(
            formData,
            "target_menu_id",
          ),

        answer_id:
          nullable(
            formData,
            "answer_id",
          ),

        course_id:
          nullable(
            formData,
            "course_id",
          ),

        action_value:
          nullable(
            formData,
            "action_value",
          ),

        url:
          nullable(
            formData,
            "url",
          ),

        sort_order:
          number(
            formData,
            "sort_order",
            100,
          ),

        is_active: true,
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function updateMenuItem(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const menuId =
    text(
      formData,
      "menu_id",
    );

  const limits =
    await menuLimits(
      menuId,
    );

  const label =
    text(
      formData,
      "label",
    );

  if (
    label.length >
    limits.titleMax
  ) {
    throw new Error(
      `النص يتجاوز ${limits.titleMax} حرفًا.`,
    );
  }

  const { error } =
    await supabase
      .from(
        "whatsapp_menu_items",
      )
      .update({
        label,

        description:
          nullable(
            formData,
            "description",
          ),

        action_type:
          text(
            formData,
            "action_type",
          ),

        target_menu_id:
          nullable(
            formData,
            "target_menu_id",
          ),

        answer_id:
          nullable(
            formData,
            "answer_id",
          ),

        course_id:
          nullable(
            formData,
            "course_id",
          ),

        action_value:
          nullable(
            formData,
            "action_value",
          ),

        url:
          nullable(
            formData,
            "url",
          ),

        sort_order:
          number(
            formData,
            "sort_order",
          ),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        text(
          formData,
          "id",
        ),
      );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

export async function toggleMenuItem(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const id =
    text(
      formData,
      "id",
    );

  const menuId =
    text(
      formData,
      "menu_id",
    );

  const current =
    text(
      formData,
      "current_active",
    ) === "true";

  if (!current) {
    const limits =
      await menuLimits(
        menuId,
      );

    const { count } =
      await supabase
        .from(
          "whatsapp_menu_items",
        )
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "menu_id",
          menuId,
        )
        .eq(
          "is_active",
          true,
        );

    if (
      (count ?? 0) >=
      limits.max
    ) {
      throw new Error(
        "لا توجد مساحة لتفعيل هذا الاختيار.",
      );
    }
  }

  const { error } =
    await supabase
      .from(
        "whatsapp_menu_items",
      )
      .update({
        is_active:
          !current,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}

/* =========================
   HUMAN SUPPORT
========================= */

export async function returnCustomerToBot(
  formData: FormData,
) {
  const supabase =
    await adminClient();

  const { error } =
    await supabase
      .from(
        "whatsapp_bot_sessions",
      )
      .upsert({
        phone:
          text(
            formData,
            "phone",
          ),

        mode: "bot",

        human_mode_until:
          null,

        updated_at:
          new Date().toISOString(),
      });

  if (error) {
    throw new Error(
      error.message,
    );
  }

  refresh();
}