"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ImagePlus,
  Link2,
  Loader2,
  Star,
  Upload,
  Video,
  X,
} from "lucide-react";

import { createProject } from "@/lib/projects/create-project";
import { updateProject } from "@/lib/projects/update-project";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

import type {
  StudentCareerPathProgress,
} from "@/lib/queries/student-dashboard";

import type {
  StudentProject,
} from "@/lib/projects/types";

type Props = {
  open: boolean;
  onClose: () => void;
  paths: StudentCareerPathProgress[];
  initialCourseId?: string;
  mode?: "create" | "edit";
  project?: StudentProject | null;
};

type ProjectCourseOption = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  journeyTitle: string;
};

type ExistingProjectImage =
  StudentProject["images"][number];

type NewProjectImage = {
  clientId: string;
  file: File;
};

type ImageOrderItem =
  | {
      kind: "existing";
      id: string;
    }
  | {
      kind: "new";
      clientId: string;
    };

const MAX_IMAGES = 10;

export default function ProjectDialog({
  open,
  onClose,
  paths,
  initialCourseId = "",
  mode = "create",
  project = null,
}: Props) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const isArabic = locale === "ar";

  useEffect(() => {
    const readLocale = () => {
      const saved = window.localStorage.getItem("masar-locale");
      setLocale(saved === "en" ? "en" : "ar");
    };

    readLocale();

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: "ar" | "en" }>;
      if (customEvent.detail?.locale === "ar" || customEvent.detail?.locale === "en") {
        setLocale(customEvent.detail.locale);
        return;
      }
      readLocale();
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);
    window.addEventListener("storage", readLocale);
    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
      window.removeEventListener("storage", readLocale);
    };
  }, []);

  const courses = useMemo<
    ProjectCourseOption[]
  >(() => {
    return paths.flatMap((path) =>
      path.stations
        .filter(
          (station) =>
            station.isEnrolled &&
            station.status !== "pending" &&
            Boolean(station.courseId) &&
            Boolean(station.enrollmentId),
        )
        .map((station) => ({
          enrollmentId:
            station.enrollmentId,
          courseId: station.courseId,
          courseTitle:
            station.shortTitle ||
            station.title,
          journeyTitle: path.title,
        })),
    );
  }, [paths]);

  const [courseId, setCourseId] =
    useState("");

  const [projectTitle, setProjectTitle] =
    useState("");

  const [
    projectDescription,
    setProjectDescription,
  ] = useState("");

  const [projectLink, setProjectLink] =
    useState("");

  const [newVideo, setNewVideo] =
    useState<File | null>(null);
  const [removeExistingVideo, setRemoveExistingVideo] =
    useState(false);

  const [
    existingImages,
    setExistingImages,
  ] = useState<ExistingProjectImage[]>([]);

  const [newImages, setNewImages] =
    useState<NewProjectImage[]>([]);

  const [coverKey, setCoverKey] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const newVideoPreview = useMemo(
    () => newVideo ? URL.createObjectURL(newVideo) : "",
    [newVideo],
  );

  useEffect(() => {
    return () => {
      if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    };
  }, [newVideoPreview]);

  const newImagePreviews = useMemo(
    () =>
      newImages.map((image) => ({
        ...image,
        url: URL.createObjectURL(
          image.file,
        ),
      })),
    [newImages],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview.url,
          );
        },
      );
    };
  }, [newImagePreviews]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setNewImages([]);
    setNewVideo(null);
    setRemoveExistingVideo(false);

    if (
      mode === "edit" &&
      project
    ) {
      const sortedImages = [
        ...project.images,
      ].sort((a, b) => {
        if (a.isCover) return -1;
        if (b.isCover) return 1;
        return 0;
      });

      setCourseId(project.courseId);
      setProjectTitle(
        project.projectTitle,
      );
      setProjectDescription(
        project.projectDescription ?? "",
      );
      setProjectLink(
        project.projectLink ?? "",
      );
      setExistingImages(sortedImages);

      const currentCover =
        sortedImages.find(
          (image) => image.isCover,
        ) ?? sortedImages[0];

      setCoverKey(
        currentCover
          ? `existing:${currentCover.id}`
          : "",
      );

      return;
    }

    setProjectTitle("");
    setProjectDescription("");
    setProjectLink("");
    setExistingImages([]);
    setCoverKey("");

    const initialCourseExists =
      courses.some(
        (course) =>
          course.courseId ===
          initialCourseId,
      );

    if (initialCourseExists) {
      setCourseId(initialCourseId);
      return;
    }

    if (courses.length === 1) {
      setCourseId(
        courses[0].courseId,
      );
      return;
    }

    setCourseId("");
  }, [
    open,
    mode,
    project,
    courses,
    initialCourseId,
  ]);

  const totalImagesCount =
    existingImages.length +
    newImages.length;

  function resetForm() {
    setProjectTitle("");
    setProjectDescription("");
    setProjectLink("");
    setExistingImages([]);
    setNewImages([]);
    setNewVideo(null);
    setRemoveExistingVideo(false);
    setCoverKey("");
    setErrorMessage("");
    setSuccessMessage("");

    setCourseId(
      courses.length === 1
        ? courses[0].courseId
        : "",
    );
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  }

  function handleVideo(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setErrorMessage(isArabic ? "نوع الفيديو غير مدعوم. استخدمي MP4 أو WEBM." : "Unsupported video format. Please use MP4 or WEBM.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(isArabic ? "حجم الفيديو أكبر من 50 MB." : "The video size exceeds 50 MB.");
      return;
    }

    setNewVideo(file);
    setRemoveExistingVideo(Boolean(project?.videoUrl));
    setErrorMessage("");
  }

  function handleImages(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const availableSlots =
      MAX_IMAGES - totalImagesCount;

    if (availableSlots <= 0) {
      setErrorMessage(
        isArabic ? `يمكن رفع ${MAX_IMAGES} صور كحد أقصى.` : `You can upload up to ${MAX_IMAGES} images.`,
      );

      event.target.value = "";
      return;
    }

    const selectedFiles = Array.from(
      event.target.files ?? [],
    ).filter((file) =>
      [
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type),
    );

    const acceptedFiles =
      selectedFiles.slice(
        0,
        availableSlots,
      );

    const addedImages =
      acceptedFiles.map((file) => ({
        clientId:
          crypto.randomUUID(),
        file,
      }));

    setNewImages(
      (currentImages) => [
        ...currentImages,
        ...addedImages,
      ],
    );

    if (
      !coverKey &&
      addedImages.length > 0
    ) {
      setCoverKey(
        `new:${addedImages[0].clientId}`,
      );
    }

    if (
      selectedFiles.length >
      availableSlots
    ) {
      setErrorMessage(
        isArabic ? `تم قبول ${availableSlots} صور فقط لأن الحد الأقصى هو ${MAX_IMAGES}.` : `Only ${availableSlots} images were accepted because the maximum is ${MAX_IMAGES}.`,
      );
    } else {
      setErrorMessage("");
    }

    event.target.value = "";
  }

  function removeExistingImage(
    imageId: string,
  ) {
    const removedKey =
      `existing:${imageId}`;

    const remainingImages =
      existingImages.filter(
        (image) =>
          image.id !== imageId,
      );

    setExistingImages(
      remainingImages,
    );

    if (coverKey === removedKey) {
      const nextExisting =
        remainingImages[0];

      const nextNew =
        newImages[0];

      setCoverKey(
        nextExisting
          ? `existing:${nextExisting.id}`
          : nextNew
            ? `new:${nextNew.clientId}`
            : "",
      );
    }

    setErrorMessage("");
  }

  function removeNewImage(
    clientId: string,
  ) {
    const removedKey =
      `new:${clientId}`;

    const remainingImages =
      newImages.filter(
        (image) =>
          image.clientId !==
          clientId,
      );

    setNewImages(remainingImages);

    if (coverKey === removedKey) {
      const nextExisting =
        existingImages[0];

      const nextNew =
        remainingImages[0];

      setCoverKey(
        nextExisting
          ? `existing:${nextExisting.id}`
          : nextNew
            ? `new:${nextNew.clientId}`
            : "",
      );
    }

    setErrorMessage("");
  }

  function buildImageOrder() {
    const allItems: ImageOrderItem[] = [
      ...existingImages.map(
        (image) => ({
          kind: "existing" as const,
          id: image.id,
        }),
      ),

      ...newImages.map(
        (image) => ({
          kind: "new" as const,
          clientId:
            image.clientId,
        }),
      ),
    ];

    return [...allItems].sort(
      (firstItem) => {
        const itemKey =
          firstItem.kind ===
          "existing"
            ? `existing:${firstItem.id}`
            : `new:${firstItem.clientId}`;

        return itemKey === coverKey
          ? -1
          : 0;
      },
    );
  }


  function localizeResultMessage(message: string) {
    if (isArabic) return message;

    const messages: Record<string, string> = {
      "يرجى اختيار الكورس المرتبط بالمشروع.": "Please select the course related to this project.",
      "يرجى كتابة عنوان المشروع.": "Please enter the project title.",
      "عنوان المشروع طويل جدًا.": "The project title is too long.",
      "وصف المشروع طويل جدًا.": "The project description is too long.",
      "يجب اختيار صورة واحدة على الأقل.": "Please select at least one image.",
      "يجب أن يحتوي المشروع على صورة واحدة على الأقل.": "The project must include at least one image.",
      "نوع الفيديو غير مدعوم. استخدمي MP4 أو WEBM.": "Unsupported video format. Please use MP4 or WEBM.",
      "حجم الفيديو أكبر من 50 MB.": "The video size exceeds 50 MB.",
      "تم رفع المشروع بنجاح.": "Project uploaded successfully.",
      "تم تحديث المشروع بنجاح.": "Project updated successfully.",
      "تعذر حفظ المشروع.": "Unable to save the project.",
    };

    return messages[message] ?? message;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const selectedCourse =
      courses.find(
        (course) =>
          course.courseId === courseId,
      );

    if (!selectedCourse) {
      setErrorMessage(
        isArabic ? "يرجى اختيار الكورس المرتبط بالمشروع." : "Please select the course related to this project.",
      );
      return;
    }

    if (!projectTitle.trim()) {
      setErrorMessage(
        isArabic ? "يرجى كتابة عنوان المشروع." : "Please enter the project title.",
      );
      return;
    }

    if (totalImagesCount === 0) {
      setErrorMessage(
        isArabic ? "يجب أن يحتوي المشروع على صورة واحدة على الأقل." : "The project must include at least one image.",
      );
      return;
    }

    if (
      totalImagesCount >
      MAX_IMAGES
    ) {
      setErrorMessage(
        isArabic ? `يمكن رفع ${MAX_IMAGES} صور كحد أقصى.` : `You can upload up to ${MAX_IMAGES} images.`,
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData =
        new FormData();

      formData.append(
        "enrollmentId",
        selectedCourse.enrollmentId,
      );

      formData.append(
        "courseId",
        selectedCourse.courseId,
      );

      formData.append(
        "projectTitle",
        projectTitle.trim(),
      );

      formData.append(
        "projectDescription",
        projectDescription.trim(),
      );

      formData.append(
        "projectLink",
        projectLink.trim(),
      );

      // Keep video bytes out of the Server Action request.
      // The video is uploaded directly from the browser to Supabase Storage
      // after the project record/images are saved successfully.
      if (mode === "edit" && project) {
        formData.append(
          "removeVideo",
          String(removeExistingVideo && !newVideo),
        );
      }

      const imageOrder =
        buildImageOrder();

      const orderedNewImages =
        imageOrder
          .filter(
            (
              item,
            ): item is Extract<
              ImageOrderItem,
              { kind: "new" }
            > =>
              item.kind === "new",
          )
          .map((item) =>
            newImages.find(
              (image) =>
                image.clientId ===
                item.clientId,
            ),
          )
          .filter(
            (
              image,
            ): image is NewProjectImage =>
              Boolean(image),
          );

      orderedNewImages.forEach(
        (image) => {
          formData.append(
            "images",
            image.file,
          );
        },
      );

      if (
        mode === "edit" &&
        project
      ) {
        formData.append(
          "projectId",
          project.id,
        );

        formData.append(
          "keptImageIds",
          JSON.stringify(
            existingImages.map(
              (image) => image.id,
            ),
          ),
        );

        formData.append(
          "imageOrder",
          JSON.stringify(
            imageOrder,
          ),
        );

        formData.append(
          "newImageClientIds",
          JSON.stringify(
            orderedNewImages.map(
              (image) =>
                image.clientId,
            ),
          ),
        );
      }

      const result =
        mode === "create"
          ? await createProject(
              formData,
            )
          : await updateProject(
              formData,
            );

      if (!result.success) {
        setErrorMessage(
          result.message
            ? localizeResultMessage(result.message)
            : isArabic
              ? "تعذر حفظ المشروع."
              : "Unable to save the project.",
        );
        return;
      }

      if (newVideo) {
        const savedProjectId =
          result.projectId ??
          (mode === "edit" ? project?.id : null);

        if (!savedProjectId) {
          throw new Error(
            isArabic
              ? "تعذر تحديد معرّف المشروع لرفع الفيديو."
              : "Unable to determine the project ID for the video upload.",
          );
        }

        const supabase =
          createBrowserSupabaseClient();

        const videoExtension =
          newVideo.type === "video/webm"
            ? "webm"
            : "mp4";

        const videoStoragePath = [
          savedProjectId,
          "video",
          `${crypto.randomUUID()}.${videoExtension}`,
        ];

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw (
            userError ??
            new Error(
              isArabic
                ? "يجب تسجيل الدخول لرفع الفيديو."
                : "You must be signed in to upload the video.",
            )
          );
        }

        const fullVideoStoragePath = [
          user.id,
          ...videoStoragePath,
        ].join("/");

        const { error: uploadVideoError } =
          await supabase.storage
            .from("student-projects")
            .upload(
              fullVideoStoragePath,
              newVideo,
              {
                contentType: newVideo.type,
                upsert: false,
              },
            );

        if (uploadVideoError) {
          throw uploadVideoError;
        }

        const { error: linkVideoError } =
          await supabase
            .from("student_projects")
            .update({
              video_storage_path:
                fullVideoStoragePath,
              video_url: null,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", savedProjectId)
            .eq("user_id", user.id);

        if (linkVideoError) {
          await supabase.storage
            .from("student-projects")
            .remove([fullVideoStoragePath]);

          throw linkVideoError;
        }

        const previousVideoPath =
          mode === "edit"
            ? project?.videoStoragePath
            : null;

        if (
          previousVideoPath &&
          previousVideoPath !==
            fullVideoStoragePath
        ) {
          await supabase.storage
            .from("student-projects")
            .remove([previousVideoPath]);
        }
      }

      setSuccessMessage(
        (result.message ? localizeResultMessage(result.message) : "") ||
          (mode === "create"
            ? isArabic ? "تم رفع المشروع بنجاح." : "Project uploaded successfully."
            : isArabic ? "تم تحديث المشروع بنجاح." : "Project updated successfully."),
      );

      window.setTimeout(() => {
        setSubmitting(false);
        onClose();
      }, 900);
    } catch (error) {
      console.error(
        "Failed to save project:",
        error,
      );

      setErrorMessage(
        isArabic ? "حدث خطأ غير متوقع أثناء حفظ المشروع." : "An unexpected error occurred while saving the project.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      dir={isArabic ? "rtl" : "ltr"}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#07152E]">
              {mode === "create"
                ? (isArabic ? "إضافة مشروع" : "Add Project")
                : (isArabic ? "تعديل المشروع" : "Edit Project")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? (isArabic ? "أضف صور المشروع واربطه بالكورس الصحيح." : "Add your project images and link the project to the correct course.")
                : (isArabic ? "عدّل بيانات المشروع وصوره ثم احفظ التغييرات." : "Update the project details and media, then save your changes.")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="project-course"
              className="block text-sm font-semibold text-[#07152E]"
            >
              {isArabic ? "الكورس المرتبط بالمشروع" : "Related Course"}
            </label>

            {courses.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {isArabic ? "لا توجد لديك اشتراكات مقبولة في كورسات متاحة لرفع المشاريع." : "You do not have any accepted enrollments in courses available for project submission."}
              </div>
            ) : courses.length === 1 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[#07152E]">
                  {courses[0].courseTitle}
                </p>

                {courses[0].journeyTitle && (
                  <p className="mt-1 text-xs text-slate-500">
                    {courses[0].journeyTitle}
                  </p>
                )}
              </div>
            ) : (
              <select
                id="project-course"
                value={courseId}
                onChange={(event) => {
                  setCourseId(
                    event.target.value,
                  );
                  setErrorMessage("");
                }}
                required
                disabled={submitting}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#07152E] outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {isArabic ? "اختر الكورس" : "Select a course"}
                </option>

                {courses.map(
                  (course) => (
                    <option
                      key={
                        course.enrollmentId
                      }
                      value={
                        course.courseId
                      }
                    >
                      {
                        course.courseTitle
                      }
                    </option>
                  ),
                )}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-title"
              className="block text-sm font-semibold text-[#07152E]"
            >
              {isArabic ? "عنوان المشروع" : "Project Title"}
            </label>

            <input
              id="project-title"
              type="text"
              value={projectTitle}
              onChange={(event) => {
                setProjectTitle(
                  event.target.value,
                );
                setErrorMessage("");
              }}
              required
              disabled={submitting}
              maxLength={150}
              placeholder={isArabic ? "مثال: تصميم شبكة طرق لمشروع سكني" : "Example: Road network design for a residential project"}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-description"
              className="block text-sm font-semibold text-[#07152E]"
            >
              {isArabic ? "وصف المشروع" : "Project Description"}
            </label>

            <textarea
              id="project-description"
              value={projectDescription}
              onChange={(event) =>
                setProjectDescription(
                  event.target.value,
                )
              }
              rows={4}
              disabled={submitting}
              maxLength={1500}
              placeholder={isArabic ? "اكتب وصفًا مختصرًا للمشروع والأعمال التي قمت بتنفيذها." : "Write a brief description of the project and the work you completed."}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-link"
              className="block text-sm font-semibold text-[#07152E]"
            >
              {isArabic ? "رابط المشروع" : "Project Link"}
              <span className={isArabic ? "mr-1 font-normal text-slate-400" : "ml-1 font-normal text-slate-400"}>
                {isArabic ? "(اختياري)" : "(Optional)"}
              </span>
            </label>

            <div className="relative">
              <Link2 className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isArabic ? "right-4" : "left-4"}`} />

              <input
                id="project-link"
                type="url"
                value={projectLink}
                onChange={(event) =>
                  setProjectLink(
                    event.target.value,
                  )
                }
                disabled={submitting}
                placeholder="https://"
                className={`h-12 w-full rounded-xl border border-slate-200 py-2 text-left text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100 ${isArabic ? "pr-11 pl-4" : "pl-11 pr-4"}`}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#07152E]">
                {isArabic ? "فيديو قصير للمشروع" : "Short Project Video"} <span className="font-normal text-slate-400">{isArabic ? "(اختياري)" : "(Optional)"}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isArabic ? "فيديو واحد بصيغة MP4 أو WEBM وبحد أقصى 50 MB." : "One MP4 or WEBM video, up to 50 MB."}
              </p>
            </div>

            {newVideoPreview ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <video src={newVideoPreview} controls preload="metadata" className="max-h-[320px] w-full" />
                <div className="flex items-center justify-between gap-3 bg-white p-3">
                  <span className="truncate text-xs font-semibold text-slate-600">{newVideo?.name}</span>
                  <button type="button" onClick={() => { setNewVideo(null); setRemoveExistingVideo(false); }} disabled={submitting} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">{isArabic ? "حذف الفيديو" : "Remove Video"}</button>
                </div>
              </div>
            ) : project?.videoUrl && !removeExistingVideo ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                <video src={project.videoUrl} controls preload="metadata" className="max-h-[320px] w-full" />
                <div className="flex justify-end bg-white p-3">
                  <button type="button" onClick={() => setRemoveExistingVideo(true)} disabled={submitting} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">{isArabic ? "حذف الفيديو الحالي" : "Remove Current Video"}</button>
                </div>
              </div>
            ) : (
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-7 text-center transition hover:border-[#F7B548] hover:bg-amber-50/40 ${submitting ? "pointer-events-none opacity-60" : ""}`}>
                <input type="file" accept="video/mp4,video/webm" onChange={handleVideo} disabled={submitting} className="hidden" />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Video className="h-7 w-7 text-slate-500" />
                </div>
                <p className="mt-3 font-semibold text-[#07152E]">{isArabic ? "إضافة فيديو قصير" : "Add Short Video"}</p>
                <p className="mt-1 text-xs text-slate-500">{isArabic ? "MP4 أو WEBM — حتى 50 MB" : "MP4 or WEBM — up to 50 MB"}</p>
              </label>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#07152E]">
                {isArabic ? "صور المشروع" : "Project Images"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isArabic ? "يمكنك الاحتفاظ أو حذف الصور الحالية وإضافة صور جديدة، ثم اختيار صورة الغلاف." : "Keep or remove current images, add new ones, then choose the cover image."}
              </p>
            </div>

            {existingImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">
                  {isArabic ? "الصور الحالية" : "Current Images"}
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {existingImages.map(
                    (image) => {
                      const imageKey =
                        `existing:${image.id}`;

                      const isCover =
                        coverKey ===
                        imageKey;

                      return (
                        <div
                          key={image.id}
                          className={`relative overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                            isCover
                              ? "border-[#F7B548]"
                              : "border-slate-200"
                          }`}
                        >
                          {image.imageUrl ? (
                            <img
                              src={
                                image.imageUrl
                              }
                              alt={isArabic ? "صورة المشروع" : "Project image"}
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center bg-slate-100">
                              <ImagePlus className="h-8 w-8 text-slate-300" />
                            </div>
                          )}

                          {isCover && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#F7B548] px-2 py-1 text-[10px] font-bold text-[#07152E]">
                              <Check className="h-3 w-3" />
                              {isArabic ? "الغلاف" : "Cover"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeExistingImage(
                                image.id,
                              )
                            }
                            disabled={
                              submitting
                            }
                            className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={isArabic ? "حذف الصورة الحالية" : "Remove current image"}
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {!isCover && (
                            <button
                              type="button"
                              onClick={() =>
                                setCoverKey(
                                  imageKey,
                                )
                              }
                              disabled={
                                submitting
                              }
                              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-[#07152E] shadow-sm transition hover:bg-[#F7B548]"
                            >
                              <Star className="h-3 w-3" />
                              {isArabic ? "اجعلها الغلاف" : "Set as Cover"}
                            </button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            <label
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-8 text-center transition ${
                submitting ||
                totalImagesCount >=
                  MAX_IMAGES
                  ? "cursor-not-allowed bg-slate-100 opacity-60"
                  : "cursor-pointer hover:border-[#F7B548] hover:bg-amber-50/40"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  submitting ||
                  totalImagesCount >=
                    MAX_IMAGES
                }
                onChange={handleImages}
                className="hidden"
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <ImagePlus className="h-7 w-7 text-slate-500" />
              </div>

              <p className="mt-4 font-semibold text-[#07152E]">
                {isArabic ? "إضافة صور جديدة" : "Add New Images"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isArabic ? "JPG أو PNG أو WEBP — المتبقي" : "JPG, PNG or WEBP — remaining"}{" "}
                {Math.max(
                  0,
                  MAX_IMAGES -
                    totalImagesCount,
                )}{" "}
                {isArabic ? "صور" : "images"}
              </p>
            </label>

            {newImagePreviews.length >
              0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">
                  {isArabic ? "الصور الجديدة" : "New Images"}
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {newImagePreviews.map(
                    (preview) => {
                      const imageKey =
                        `new:${preview.clientId}`;

                      const isCover =
                        coverKey ===
                        imageKey;

                      return (
                        <div
                          key={
                            preview.clientId
                          }
                          className={`relative overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                            isCover
                              ? "border-[#F7B548]"
                              : "border-slate-200"
                          }`}
                        >
                          <img
                            src={preview.url}
                            alt={isArabic ? "صورة جديدة للمشروع" : "New project image"}
                            className="aspect-square w-full object-cover"
                          />

                          {isCover && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#F7B548] px-2 py-1 text-[10px] font-bold text-[#07152E]">
                              <Check className="h-3 w-3" />
                              {isArabic ? "الغلاف" : "Cover"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeNewImage(
                                preview.clientId,
                              )
                            }
                            disabled={
                              submitting
                            }
                            className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={isArabic ? "حذف الصورة الجديدة" : "Remove new image"}
                          >
                            <X className="h-4 w-4" />
                          </button>

                          {!isCover && (
                            <button
                              type="button"
                              onClick={() =>
                                setCoverKey(
                                  imageKey,
                                )
                              }
                              disabled={
                                submitting
                              }
                              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-[#07152E] shadow-sm transition hover:bg-[#F7B548]"
                            >
                              <Star className="h-3 w-3" />
                              {isArabic ? "اجعلها الغلاف" : "Set as Cover"}
                            </button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                courses.length === 0 ||
                !courseId ||
                !projectTitle.trim() ||
                totalImagesCount === 0
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-6 text-sm font-semibold text-white transition hover:bg-[#0B2148] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create"
                    ? (isArabic ? "جاري رفع المشروع..." : "Uploading Project...")
                    : (isArabic ? "جاري حفظ التعديلات..." : "Saving Changes...")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {mode === "create"
                    ? (isArabic ? "رفع المشروع" : "Upload Project")
                    : (isArabic ? "حفظ التعديلات" : "Save Changes")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}