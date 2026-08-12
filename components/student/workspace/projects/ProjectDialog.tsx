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
  X,
} from "lucide-react";

import { createProject } from "@/lib/projects/create-project";
import { updateProject } from "@/lib/projects/update-project";

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

  function handleImages(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const availableSlots =
      MAX_IMAGES - totalImagesCount;

    if (availableSlots <= 0) {
      setErrorMessage(
        `يمكن رفع ${MAX_IMAGES} صور كحد أقصى.`,
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
        `تم قبول ${availableSlots} صور فقط لأن الحد الأقصى هو ${MAX_IMAGES}.`,
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
        "يرجى اختيار الكورس المرتبط بالمشروع.",
      );
      return;
    }

    if (!projectTitle.trim()) {
      setErrorMessage(
        "يرجى كتابة عنوان المشروع.",
      );
      return;
    }

    if (totalImagesCount === 0) {
      setErrorMessage(
        "يجب أن يحتوي المشروع على صورة واحدة على الأقل.",
      );
      return;
    }

    if (
      totalImagesCount >
      MAX_IMAGES
    ) {
      setErrorMessage(
        `يمكن رفع ${MAX_IMAGES} صور كحد أقصى.`,
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
          result.message ||
            "تعذر حفظ المشروع.",
        );
        return;
      }

      setSuccessMessage(
        result.message ||
          (mode === "create"
            ? "تم رفع المشروع بنجاح."
            : "تم تحديث المشروع بنجاح."),
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
        "حدث خطأ غير متوقع أثناء حفظ المشروع.",
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
      dir="rtl"
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
                ? "إضافة مشروع"
                : "تعديل المشروع"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "أضف صور المشروع واربطه بالكورس الصحيح."
                : "عدّل بيانات المشروع وصوره ثم احفظ التغييرات."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="إغلاق"
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
              الكورس المرتبط بالمشروع
            </label>

            {courses.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                لا توجد لديك اشتراكات مقبولة في كورسات متاحة لرفع المشاريع.
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
                  اختر الكورس
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
              عنوان المشروع
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
              placeholder="مثال: تصميم شبكة طرق لمشروع سكني"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-description"
              className="block text-sm font-semibold text-[#07152E]"
            >
              وصف المشروع
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
              placeholder="اكتب وصفًا مختصرًا للمشروع والأعمال التي قمت بتنفيذها."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="project-link"
              className="block text-sm font-semibold text-[#07152E]"
            >
              رابط المشروع
              <span className="mr-1 font-normal text-slate-400">
                (اختياري)
              </span>
            </label>

            <div className="relative">
              <Link2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                className="h-12 w-full rounded-xl border border-slate-200 py-2 pr-11 pl-4 text-left text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#07152E]">
                صور المشروع
              </p>

              <p className="mt-1 text-xs text-slate-500">
                يمكنك الاحتفاظ أو حذف الصور الحالية وإضافة صور جديدة، ثم اختيار صورة الغلاف.
              </p>
            </div>

            {existingImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">
                  الصور الحالية
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
                              alt="صورة المشروع"
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
                              الغلاف
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
                            aria-label="حذف الصورة الحالية"
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
                              اجعلها الغلاف
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
                إضافة صور جديدة
              </p>

              <p className="mt-1 text-xs text-slate-500">
                JPG أو PNG أو WEBP — المتبقي{" "}
                {Math.max(
                  0,
                  MAX_IMAGES -
                    totalImagesCount,
                )}{" "}
                صور
              </p>
            </label>

            {newImagePreviews.length >
              0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">
                  الصور الجديدة
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
                            alt="صورة جديدة للمشروع"
                            className="aspect-square w-full object-cover"
                          />

                          {isCover && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#F7B548] px-2 py-1 text-[10px] font-bold text-[#07152E]">
                              <Check className="h-3 w-3" />
                              الغلاف
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
                            aria-label="حذف الصورة الجديدة"
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
                              اجعلها الغلاف
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
              إلغاء
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
                    ? "جاري رفع المشروع..."
                    : "جاري حفظ التعديلات..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {mode === "create"
                    ? "رفع المشروع"
                    : "حفظ التعديلات"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}