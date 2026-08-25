"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Link2,
  Pause,
  Play,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type CourseRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  title_en: string | null;
  slug: string | null;
  course_code: string | null;
  icon_url: string | null;
  is_active: boolean | null;
  career_path_id: string | null;
  station_id: string | null;
  display_order: number | null;
};

type PromoRow = {
  id: string;
  course_id: string;
  video_source: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CareerPathRow = {
  id: string;
  title: string | null;
  title_ar: string | null;
  short_title: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

type StationRow = {
  id: string;
  career_path_id: string | null;
  title: string | null;
  short_title: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

function normalizeYoutubeUrl(value: string) {
  return value.trim();
}

function extractYoutubeVideoId(value: string): string | null {
  const input = normalizeYoutubeUrl(value);

  if (!input) return null;

  // Allow pasting a bare 11-character YouTube ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(
      input.startsWith("http://") || input.startsWith("https://")
        ? input
        : `https://${input}`,
    );

    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const watchId = url.searchParams.get("v");
      if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
        return watchId;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      const markerIndex = parts.findIndex((part) =>
        ["embed", "shorts", "live"].includes(part),
      );

      if (markerIndex >= 0) {
        const id = parts[markerIndex + 1];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getYoutubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function getYoutubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export default function LandingPromosManager({
  initialCourses,
  initialPromos,
  careerPaths,
  stations,
}: {
  initialCourses: CourseRow[];
  initialPromos: PromoRow[];
  careerPaths: CareerPathRow[];
  stations: StationRow[];
}) {
  const [promos, setPromos] = useState<PromoRow[]>(initialPromos);
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    for (const promo of initialPromos) {
      initial[promo.course_id] = promo.youtube_url ?? "";
    }

    return initial;
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);

  const [openPaths, setOpenPaths] = useState<Set<string>>(
    () => new Set(careerPaths.map((path) => path.id)),
  );

  const [openStations, setOpenStations] = useState<Set<string>>(
    () => new Set(),
  );

  const promosByCourse = useMemo(
    () => new Map(promos.map((promo) => [promo.course_id, promo])),
    [promos],
  );

  const grouped = useMemo(() => {
    return careerPaths.map((path) => {
      const pathStations = stations
        .filter((station) => station.career_path_id === path.id)
        .sort(
          (a, b) =>
            Number(a.display_order ?? 9999) -
            Number(b.display_order ?? 9999),
        )
        .map((station) => {
          const course = initialCourses.find(
            (item) => item.station_id === station.id,
          );

          return {
            station,
            course,
          };
        })
        .filter((item) => Boolean(item.course));

      return {
        path,
        stations: pathStations,
      };
    });
  }, [careerPaths, stations, initialCourses]);

  const savedCount = initialCourses.filter((course) =>
    promosByCourse.has(course.id),
  ).length;

  const activeCount = initialCourses.filter(
    (course) => promosByCourse.get(course.id)?.is_active,
  ).length;

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const togglePath = (id: string) => {
    setOpenPaths((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const toggleStation = (id: string) => {
    setOpenStations((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const handleSave = async (course: CourseRow) => {
    clearFeedback();

    const youtubeUrl = normalizeYoutubeUrl(draftUrls[course.id] ?? "");
    const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

    if (!youtubeUrl || !youtubeVideoId) {
      setError(
        "أدخلي رابط YouTube صحيحًا، مثل https://youtu.be/VIDEO_ID أو https://www.youtube.com/watch?v=VIDEO_ID.",
      );
      return;
    }

    setBusyCourseId(course.id);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data, error: saveError } = await supabase
        .from("landing_course_promos")
        .upsert(
          {
            course_id: course.id,
            video_source: "youtube",
            youtube_url: youtubeUrl,
            youtube_video_id: youtubeVideoId,
            storage_path: null,
            file_name: null,
            file_size: null,
            mime_type: null,
            is_active: true,
            updated_at: now,
          },
          {
            onConflict: "course_id",
          },
        )
        .select(
          "id,course_id,video_source,youtube_url,youtube_video_id,is_active,created_at,updated_at",
        )
        .single();

      if (saveError || !data) {
        throw new Error(
          saveError?.message || "تعذر حفظ رابط YouTube.",
        );
      }

      setPromos((current) => [
        ...current.filter((item) => item.course_id !== course.id),
        data as PromoRow,
      ]);

      setDraftUrls((current) => ({
        ...current,
        [course.id]: youtubeUrl,
      }));

      setMessage(
        `تم حفظ إعلان ${
          course.title_ar ||
          course.title ||
          course.course_code ||
          "الكورس"
        } بنجاح.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر حفظ رابط YouTube.",
      );
    } finally {
      setBusyCourseId(null);
    }
  };

  const handleToggleActive = async (promo: PromoRow) => {
    clearFeedback();
    setBusyCourseId(promo.course_id);

    try {
      const supabase = createClient();
      const nextValue = !promo.is_active;

      const { data, error: updateError } = await supabase
        .from("landing_course_promos")
        .update({
          is_active: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", promo.id)
        .select(
          "id,course_id,video_source,youtube_url,youtube_video_id,is_active,created_at,updated_at",
        )
        .single();

      if (updateError || !data) {
        throw new Error(
          updateError?.message || "تعذر تحديث حالة الإعلان.",
        );
      }

      setPromos((current) =>
        current.map((item) =>
          item.id === promo.id ? (data as PromoRow) : item,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تحديث حالة الإعلان.",
      );
    } finally {
      setBusyCourseId(null);
    }
  };

  const handleDelete = async (
    promo: PromoRow,
    courseName: string,
  ) => {
    clearFeedback();

    if (!window.confirm(`هل تريدين حذف إعلان ${courseName}؟`)) {
      return;
    }

    setBusyCourseId(promo.course_id);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("landing_course_promos")
        .delete()
        .eq("id", promo.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setPromos((current) =>
        current.filter((item) => item.id !== promo.id),
      );

      setDraftUrls((current) => ({
        ...current,
        [promo.course_id]: "",
      }));

      setMessage(`تم حذف إعلان ${courseName}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر حذف الإعلان.",
      );
    } finally {
      setBusyCourseId(null);
    }
  };

  return (
    <div dir="rtl" className="space-y-5">
      {(message || error) && (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error || message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-black text-[#07152E]">
                روابط YouTube لإعلانات المحطات
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              افتحي المسار ثم المحطة، الصقي رابط فيديو YouTube واحفظيه. يفضل رفع الفيديو على YouTube كـ Unlisted.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
              {initialCourses.length} محطة
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              {savedCount} رابط محفوظ
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
              {activeCount} إعلان نشط
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {grouped.map(({ path, stations: pathStations }) => {
          const pathOpen = openPaths.has(path.id);
          const pathSaved = pathStations.filter(
            ({ course }) =>
              course && promosByCourse.has(course.id),
          ).length;

          return (
            <section
              key={path.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => togglePath(path.id)}
                className="flex w-full items-center justify-between gap-4 bg-[#07152E] px-5 py-5 text-right text-white"
              >
                <div>
                  <p className="text-[10px] font-black text-[#F7B548]">
                    المسار المهني
                  </p>
                  <h3 className="mt-1 text-lg font-black">
                    {path.title_ar ||
                      path.title ||
                      path.short_title ||
                      "مسار"}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                    {pathSaved}/{pathStations.length} إعلان
                  </span>

                  {pathOpen ? (
                    <ChevronDown className="h-5 w-5 text-[#F7B548]" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-[#F7B548]" />
                  )}
                </div>
              </button>

              {pathOpen && (
                <div className="space-y-3 p-4">
                  {pathStations.map(({ station, course }) => {
                    if (!course) return null;

                    const promo = promosByCourse.get(course.id);
                    const stationOpen = openStations.has(station.id);
                    const isBusy = busyCourseId === course.id;

                    const courseName =
                      course.title_ar ||
                      course.title ||
                      course.title_en ||
                      course.course_code ||
                      "كورس";

                    const stationName =
                      station.short_title ||
                      station.title ||
                      courseName;

                    const draftUrl =
                      draftUrls[course.id] ??
                      promo?.youtube_url ??
                      "";

                    const previewVideoId =
                      extractYoutubeVideoId(draftUrl) ||
                      promo?.youtube_video_id ||
                      null;

                    return (
                      <div
                        key={station.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStation(station.id)}
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-right"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400">
                              المحطة
                            </p>

                            <h4 className="mt-0.5 truncate font-black text-[#07152E]">
                              {stationName}
                            </h4>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {courseName}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {promo ? (
                              <span
                                className={[
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
                                  promo.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-200 text-slate-600",
                                ].join(" ")}
                              >
                                {promo.is_active && (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {promo.is_active ? "محفوظ ونشط" : "محفوظ ومتوقف"}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                                بدون إعلان
                              </span>
                            )}

                            {stationOpen ? (
                              <ChevronDown className="h-4 w-4 text-[#F7B548]" />
                            ) : (
                              <ChevronLeft className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {stationOpen && (
                          <div className="border-t border-slate-200 bg-white p-4">
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                              <div className="space-y-4">
                                <div>
                                  <label className="mb-2 block text-sm font-black text-[#07152E]">
                                    رابط فيديو YouTube
                                  </label>

                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <div className="relative min-w-0 flex-1">
                                      <Link2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                      <input
                                        type="url"
                                        value={draftUrl}
                                        onChange={(event) =>
                                          setDraftUrls((current) => ({
                                            ...current,
                                            [course.id]: event.target.value,
                                          }))
                                        }
                                        placeholder="https://youtu.be/..."
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-sm text-[#07152E] outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleSave(course)}
                                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 text-sm font-black text-[#07152E] transition hover:bg-[#f6aa27] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Save className="h-4 w-4" />
                                      {promo ? "حفظ التعديل" : "حفظ الرابط"}
                                    </button>
                                  </div>

                                  <p className="mt-2 text-xs leading-5 text-slate-400">
                                    يقبل روابط youtube.com و youtu.be و Shorts و Live، أو Video ID مباشرة.
                                  </p>
                                </div>

                                {previewVideoId ? (
                                  <div className="overflow-hidden rounded-xl bg-black">
                                    <iframe
                                      src={getYoutubeEmbedUrl(previewVideoId)}
                                      title={`معاينة ${courseName}`}
                                      className="aspect-video w-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : (
                                  <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                                    <div className="text-center text-slate-400">
                                      <Video className="mx-auto h-10 w-10" />
                                      <p className="mt-2 text-sm font-bold">
                                        الصقي رابط YouTube لعرض المعاينة
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h5 className="font-black text-[#07152E]">
                                  حالة الإعلان
                                </h5>

                                <div className="mt-4 space-y-3 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">المصدر</span>
                                    <span className="font-black text-red-600">
                                      YouTube
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">Video ID</span>
                                    <span className="max-w-[160px] truncate font-mono text-xs font-bold text-slate-700">
                                      {promo?.youtube_video_id || previewVideoId || "—"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-500">الحالة</span>
                                    <span
                                      className={[
                                        "font-black",
                                        promo?.is_active
                                          ? "text-emerald-700"
                                          : "text-slate-500",
                                      ].join(" ")}
                                    >
                                      {promo
                                        ? promo.is_active
                                          ? "نشط"
                                          : "متوقف"
                                        : "غير محفوظ"}
                                    </span>
                                  </div>
                                </div>

                                {promo && (
                                  <div className="mt-5 grid gap-2">
                                    <a
                                      href={getYoutubeWatchUrl(
                                        promo.youtube_video_id ||
                                          previewVideoId ||
                                          "",
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      فتح على YouTube
                                    </a>

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        void handleToggleActive(promo)
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                                    >
                                      {promo.is_active ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                      {promo.is_active ? "إيقاف الإعلان" : "تفعيل الإعلان"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() =>
                                        void handleDelete(promo, courseName)
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      حذف الرابط
                                    </button>
                                  </div>
                                )}
                              </aside>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}