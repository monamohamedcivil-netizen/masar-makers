"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  bunnyStatusLabel,
  createBunnyEmbedUrl,
  createBunnyTusCredentials,
  createBunnyVideo,
  deleteBunnyVideo,
  getBunnyThumbnailUrl,
  getBunnyVideo,
  listBunnyVideos,
} from "@/lib/bunny/stream";

type Result<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; message: string };

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(
      String(profile.role),
    ) ||
    profile.is_active === false
  ) {
    throw new Error("ليس لديك صلاحية لإدارة الفيديوهات.");
  }

  return supabase;
}

export type BunnyUploadSession = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
  endpoint: string;
  previousVideoId: string | null;
};


export type BunnyLibraryVideo = {
  videoId: string;
  title: string;
  status: string;
  durationSeconds: number;
  storageSize: number;
  thumbnailUrl: string | null;
  dateUploaded: string | null;
};

export async function getBunnyLibraryVideos(): Promise<
  Result<BunnyLibraryVideo[]>
> {
  try {
    await requireAdmin();

    const videos = await listBunnyVideos(1, 100);

    return {
      success: true,
      data: videos.map((video) => ({
        videoId: video.guid,
        title: video.title,
        status: bunnyStatusLabel(video.status),
        durationSeconds: Number(video.length ?? 0),
        storageSize: Number(video.storageSize ?? 0),
        thumbnailUrl: getBunnyThumbnailUrl(
          video.guid,
          video.thumbnailFileName,
        ),
        dateUploaded: video.dateUploaded ?? null,
      })),
      message: "تم تحميل مكتبة Bunny.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحميل مكتبة Bunny.",
    };
  }
}

export async function attachExistingBunnyVideo(
  lessonId: string,
  videoId: string,
): Promise<
  Result<{
    videoId: string;
    status: string;
    durationSeconds: number;
  }>
> {
  try {
    const supabase = await requireAdmin();
    const video = await getBunnyVideo(videoId);
    const status = bunnyStatusLabel(video.status);
    const thumbnailUrl = getBunnyThumbnailUrl(
      video.guid,
      video.thumbnailFileName,
    );

    const { error } = await supabase
      .from("lessons")
      .update({
        video_provider: "bunny",
        video_asset_id: video.guid,
        video_url: null,
        video_status: status,
        video_duration_seconds: Number(video.length ?? 0),
        video_size_bytes: Number(video.storageSize ?? 0),
        video_thumbnail_url: thumbnailUrl,
        video_updated_at: new Date().toISOString(),
        duration_minutes:
          video.length > 0
            ? Math.max(1, Math.ceil(video.length / 60))
            : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      data: {
        videoId: video.guid,
        status,
        durationSeconds: Number(video.length ?? 0),
      },
      message: "تم ربط الفيديو الموجود بالدرس.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر ربط الفيديو بالدرس.",
    };
  }
}

export async function createBunnyUploadSession(
  lessonId: string,
  title: string,
): Promise<Result<BunnyUploadSession>> {
  try {
    const normalizedLessonId = lessonId?.trim();
    const normalizedTitle = title?.trim();

    if (!normalizedLessonId || !normalizedTitle) {
      return {
        success: false,
        message: "رقم الدرس واسم الفيديو مطلوبان.",
      };
    }

    const supabase = await requireAdmin();

    const { data: lesson, error: lessonError } =
      await supabase
        .from("lessons")
        .select("id,video_provider,video_asset_id")
        .eq("id", normalizedLessonId)
        .maybeSingle();

    if (lessonError) {
      return {
        success: false,
        message: lessonError.message,
      };
    }

    if (!lesson) {
      return {
        success: false,
        message: "الدرس غير موجود.",
      };
    }

    const bunnyVideo =
      await createBunnyVideo(normalizedTitle);

    const credentials =
      createBunnyTusCredentials(bunnyVideo.guid);

    return {
      success: true,
      data: {
        ...credentials,
        previousVideoId:
          lesson.video_provider === "bunny"
            ? lesson.video_asset_id ?? null
            : null,
      },
      message: "تم تجهيز جلسة رفع الفيديو.",
    };
  } catch (error) {
    console.error(
      "CREATE BUNNY UPLOAD SESSION ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تجهيز رفع الفيديو.",
    };
  }
}

export async function finalizeBunnyVideoUpload(
  lessonId: string,
  videoId: string,
  previousVideoId?: string | null,
): Promise<Result<{
  videoId: string;
  status: string;
  durationSeconds: number;
}>> {
  try {
    const supabase = await requireAdmin();

    const video = await getBunnyVideo(videoId);
    const status = bunnyStatusLabel(video.status);
    const thumbnailUrl = getBunnyThumbnailUrl(
      videoId,
      video.thumbnailFileName,
    );

    const { error } = await supabase
      .from("lessons")
      .update({
        video_provider: "bunny",
        video_asset_id: videoId,
        video_url: null,
        video_status: status,
        video_duration_seconds:
          Number(video.length ?? 0),
        video_size_bytes:
          Number(video.storageSize ?? 0),
        video_thumbnail_url: thumbnailUrl,
        video_updated_at:
          new Date().toISOString(),
        duration_minutes:
          video.length > 0
            ? Math.max(
                1,
                Math.ceil(video.length / 60),
              )
            : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    // Do not delete the previous Bunny asset here.
    // A Bunny video may be shared by more than one lesson.

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      data: {
        videoId,
        status,
        durationSeconds:
          Number(video.length ?? 0),
      },
      message:
        "تم رفع الفيديو وربطه بالدرس بنجاح.",
    };
  } catch (error) {
    console.error(
      "FINALIZE BUNNY VIDEO ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر ربط الفيديو بالدرس.",
    };
  }
}

export async function syncBunnyVideoMetadata(
  lessonId: string,
): Promise<Result<{
  status: string;
  encodeProgress: number;
  durationSeconds: number;
  storageSize: number;
  thumbnailUrl: string | null;
}>> {
  try {
    const supabase = await requireAdmin();

    const { data: lesson, error: lessonError } =
      await supabase
        .from("lessons")
        .select("video_provider,video_asset_id")
        .eq("id", lessonId)
        .maybeSingle();

    if (lessonError) {
      return {
        success: false,
        message: lessonError.message,
      };
    }

    if (
      !lesson ||
      lesson.video_provider !== "bunny" ||
      !lesson.video_asset_id
    ) {
      return {
        success: false,
        message: "لا يوجد فيديو Bunny مرتبط بهذا الدرس.",
      };
    }

    const video = await getBunnyVideo(
      lesson.video_asset_id,
    );

    const status = bunnyStatusLabel(video.status);
    const thumbnailUrl = getBunnyThumbnailUrl(
      video.guid,
      video.thumbnailFileName,
    );

    const updatePayload: Record<string, unknown> = {
      video_status: status,
      video_duration_seconds:
        Number(video.length ?? 0),
      video_size_bytes:
        Number(video.storageSize ?? 0),
      video_thumbnail_url: thumbnailUrl,
      video_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (video.length > 0) {
      updatePayload.duration_minutes =
        Math.max(
          1,
          Math.ceil(video.length / 60),
        );
    }

    const { error: updateError } = await supabase
      .from("lessons")
      .update(updatePayload)
      .eq("id", lessonId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      data: {
        status,
        encodeProgress:
          Number(video.encodeProgress ?? 0),
        durationSeconds:
          Number(video.length ?? 0),
        storageSize:
          Number(video.storageSize ?? 0),
        thumbnailUrl,
      },
      message: "تم تحديث حالة الفيديو.",
    };
  } catch (error) {
    console.error(
      "SYNC BUNNY VIDEO ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحديث حالة الفيديو.",
    };
  }
}

export async function removeLessonBunnyVideo(
  lessonId: string,
): Promise<Result<{ removed: true }>> {
  try {
    const supabase = await requireAdmin();

    const { data: lesson, error: lessonError } =
      await supabase
        .from("lessons")
        .select("video_provider,video_asset_id")
        .eq("id", lessonId)
        .maybeSingle();

    if (lessonError) {
      return {
        success: false,
        message: lessonError.message,
      };
    }

    if (!lesson) {
      return {
        success: false,
        message: "الدرس غير موجود.",
      };
    }

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        video_asset_id: null,
        video_url: null,
        video_status: null,
        video_duration_seconds: null,
        duration_minutes: 0,
        video_size_bytes: null,
        video_thumbnail_url: null,
        video_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    revalidatePath("/admin/learning/lessons");

    return {
      success: true,
      data: { removed: true },
      message: "تم فك ربط الفيديو من الدرس، وبقي الفيديو محفوظًا في مكتبة Bunny.",
    };
  } catch (error) {
    console.error(
      "REMOVE BUNNY VIDEO ERROR",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حذف الفيديو.",
    };
  }
}


export async function getAdminBunnyEmbedUrl(
  lessonId: string,
): Promise<Result<{ url: string }>> {
  try {
    const supabase = await requireAdmin();

    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("video_provider,video_asset_id")
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (
      !lesson ||
      lesson.video_provider !== "bunny" ||
      !lesson.video_asset_id
    ) {
      return {
        success: false,
        message: "لا يوجد فيديو Bunny مرتبط بهذا الدرس.",
      };
    }

    const embed = createBunnyEmbedUrl(
      lesson.video_asset_id,
      15 * 60,
    );

    return {
      success: true,
      data: { url: embed.url },
      message: "تم إنشاء رابط المعاينة.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر فتح معاينة الفيديو.",
    };
  }
}