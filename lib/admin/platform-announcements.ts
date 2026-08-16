"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PlatformAnnouncementType =
  | "offer"
  | "course"
  | "news"
  | "achievement"
  | "alert";

export type PlatformAnnouncement = {
  id: string;
  type: PlatformAnnouncementType;
  title: string;
  description: string | null;
  button_text: string;
  href: string;
  is_active: boolean;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementActionResult = {
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

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  const role = String(profile?.role ?? "").toLowerCase();

  if (
    profileError ||
    !["admin", "super_admin"].includes(role)
  ) {
    throw new Error(
      "ليس لديك صلاحية لإدارة الإعلانات.",
    );
  }

  return supabase;
}

function normalizeNullableDate(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function getAdminPlatformAnnouncements(): Promise<
  PlatformAnnouncement[]
> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PlatformAnnouncement[];
}

export async function createPlatformAnnouncement(input: {
  type: PlatformAnnouncementType;
  title: string;
  description?: string;
  buttonText?: string;
  href?: string;
  isActive?: boolean;
  displayOrder?: number;
  startsAt?: string;
  endsAt?: string;
}): Promise<AnnouncementActionResult> {
  const supabase = await requireAdmin();

  const title = input.title.trim();

  if (!title) {
    return {
      success: false,
      message: "عنوان الإعلان مطلوب.",
    };
  }

  const startsAt = normalizeNullableDate(input.startsAt);
  const endsAt = normalizeNullableDate(input.endsAt);

  if (
    startsAt &&
    endsAt &&
    new Date(endsAt) <= new Date(startsAt)
  ) {
    return {
      success: false,
      message: "تاريخ انتهاء الإعلان يجب أن يكون بعد تاريخ البداية.",
    };
  }

  const { error } = await supabase
    .from("platform_announcements")
    .insert({
      type: input.type,
      title,
      description: input.description?.trim() || null,
      button_text: input.buttonText?.trim() || "التفاصيل",
      href: input.href?.trim() || "#",
      is_active: input.isActive ?? true,
      display_order: Number(input.displayOrder ?? 0),
      starts_at: startsAt,
      ends_at: endsAt,
    });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/content/announcements");
  revalidatePath("/");

  return {
    success: true,
    message: "تم إنشاء الإعلان بنجاح.",
  };
}

export async function updatePlatformAnnouncement(
  id: string,
  input: {
    type: PlatformAnnouncementType;
    title: string;
    description?: string;
    buttonText?: string;
    href?: string;
    isActive?: boolean;
    displayOrder?: number;
    startsAt?: string;
    endsAt?: string;
  },
): Promise<AnnouncementActionResult> {
  const supabase = await requireAdmin();

  if (!id) {
    return {
      success: false,
      message: "رقم الإعلان غير موجود.",
    };
  }

  const title = input.title.trim();

  if (!title) {
    return {
      success: false,
      message: "عنوان الإعلان مطلوب.",
    };
  }

  const startsAt = normalizeNullableDate(input.startsAt);
  const endsAt = normalizeNullableDate(input.endsAt);

  if (
    startsAt &&
    endsAt &&
    new Date(endsAt) <= new Date(startsAt)
  ) {
    return {
      success: false,
      message: "تاريخ انتهاء الإعلان يجب أن يكون بعد تاريخ البداية.",
    };
  }

  const { error } = await supabase
    .from("platform_announcements")
    .update({
      type: input.type,
      title,
      description: input.description?.trim() || null,
      button_text: input.buttonText?.trim() || "التفاصيل",
      href: input.href?.trim() || "#",
      is_active: input.isActive ?? true,
      display_order: Number(input.displayOrder ?? 0),
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/content/announcements");
  revalidatePath("/");

  return {
    success: true,
    message: "تم حفظ تعديلات الإعلان.",
  };
}

export async function togglePlatformAnnouncement(
  id: string,
  isActive: boolean,
): Promise<AnnouncementActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("platform_announcements")
    .update({
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/content/announcements");
  revalidatePath("/");

  return {
    success: true,
    message: isActive
      ? "تم تفعيل الإعلان."
      : "تم إيقاف الإعلان.",
  };
}

export async function deletePlatformAnnouncement(
  id: string,
): Promise<AnnouncementActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("platform_announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/content/announcements");
  revalidatePath("/");

  return {
    success: true,
    message: "تم حذف الإعلان.",
  };
}