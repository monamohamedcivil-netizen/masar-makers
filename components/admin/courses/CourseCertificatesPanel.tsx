"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Award,
  CheckCircle2,
  FileImage,
  FileText,
  LoaderCircle,
  Mail,
  Search,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  deleteCertificateTemplate,
  getCertificateSettings,
  saveCertificateTemplate,
  type CertificateTemplateData,
} from "@/lib/actions/admin/certificate-templates";

import CourseCertificateStudentsTable from "./CourseCertificateStudentsTable";

type CourseCertificatesPanelProps = {
  courseId: string;
  courseTitle: string;
};

type SelectedTemplateFile = {
  file: File;
  previewUrl: string | null;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} كيلوبايت`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} ميجابايت`;
}

function isPdfMimeType(mimeType: string | null | undefined) {
  return mimeType === "application/pdf";
}

export default function CourseCertificatesPanel({
  courseId,
  courseTitle,
}: CourseCertificatesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<SelectedTemplateFile | null>(null);
  const [savedTemplate, setSavedTemplate] =
    useState<CertificateTemplateData | null>(null);
  const [certificateTitle, setCertificateTitle] = useState(
    `شهادة إتمام ${courseTitle}`,
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const selectedFileIsPdf = useMemo(
    () => isPdfMimeType(selectedFile?.file.type),
    [selectedFile],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoadingSettings(true);

      const result = await getCertificateSettings(courseId);

      if (!isMounted) return;

      if (result.success && result.data) {
        setSavedTemplate(result.data.template);

        if (result.data.displayTitle) {
          setCertificateTitle(result.data.displayTitle);
        }
      } else if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });
      }

      setIsLoadingSettings(false);
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (selectedFile?.previewUrl) {
        URL.revokeObjectURL(selectedFile.previewUrl);
      }
    };
  }, [selectedFile]);

  function handleTemplateChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isSupported =
      file.type === "application/pdf" ||
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/webp";

    if (!isSupported) {
      event.target.value = "";
      setFeedback({
        type: "error",
        message:
          "صيغة الملف غير مدعومة. استخدمي PDF أو PNG أو JPG أو WEBP.",
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      event.target.value = "";
      setFeedback({
        type: "error",
        message: "حجم الملف يجب ألا يتجاوز 15 ميجابايت.",
      });
      return;
    }

    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;

    setSelectedFile({
      file,
      previewUrl,
    });
    setFeedback(null);
  }

  function handleSave() {
    if (!selectedFile?.file) {
      setFeedback({
        type: "error",
        message: "اختاري ملف قالب الشهادة أولاً.",
      });
      return;
    }

    if (!certificateTitle.trim()) {
      setFeedback({
        type: "error",
        message: "عنوان الشهادة مطلوب.",
      });
      return;
    }

    const fileToUpload = selectedFile.file;
    const previewUrl = selectedFile.previewUrl;

    setFeedback({
      type: "success",
      message: "جارٍ رفع قالب الشهادة وحفظه...",
    });

    startSaving(async () => {
      try {
        const formData = new FormData();
        formData.set("courseId", courseId);
        formData.set("title", certificateTitle.trim());
        formData.set("templateFile", fileToUpload);

        const result = await saveCertificateTemplate(formData);

        if (!result.success) {
          setFeedback({
            type: "error",
            message: result.message,
          });
          return;
        }

        const refreshed = await getCertificateSettings(courseId);

        if (!refreshed.success || !refreshed.data?.template) {
          setFeedback({
            type: "error",
            message:
              refreshed.message ||
              "تم رفع الملف، ولكن تعذر إعادة تحميل بيانات القالب.",
          });
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setSavedTemplate(refreshed.data.template);

        if (refreshed.data.displayTitle) {
          setCertificateTitle(refreshed.data.displayTitle);
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setFeedback({
          type: "success",
          message: "تم حفظ قالب الشهادة بنجاح.",
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "حدث خطأ غير متوقع أثناء حفظ القالب.",
        });
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "هل أنتِ متأكدة من حذف قالب شهادة هذا الكورس؟",
    );

    if (!confirmed) return;

    startDeleting(async () => {
      const result = await deleteCertificateTemplate(courseId);

      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });

      if (result.success) {
        setSavedTemplate(null);
        setSelectedFile(null);
        setCertificateTitle(`شهادة إتمام ${courseTitle}`);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  }

  return (
    <section dir="rtl" className="space-y-6">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7B548]/15 text-[#07152E]">
                <UploadCloud className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#07152E]">
                  قالب شهادة الكورس
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  ارفعي نموذج الشهادة الخاص بهذا الكورس بصيغة صورة أو PDF.
                  سيتم استخدامه لاحقًا عند إصدار شهادة لأي طالب.
                </p>
              </div>
            </div>

            {isLoadingSettings ? (
              <div className="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <LoaderCircle className="h-7 w-7 animate-spin text-[#F7B548]" />
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-[#07152E]">
                    عنوان الشهادة
                  </label>

                  <input
                    value={certificateTitle}
                    onChange={(event) =>
                      setCertificateTitle(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#F7B548]"
                    placeholder="مثال: شهادة إتمام أساسيات برنامج CSD"
                  />
                </div>

                <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-[#F7B548] hover:bg-amber-50/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="sr-only"
                    onChange={handleTemplateChange}
                  />

                  <UploadCloud className="h-9 w-9 text-slate-400" />

                  <span className="mt-3 text-sm font-black text-[#07152E]">
                    {savedTemplate
                      ? "اختاري ملفًا لاستبدال القالب الحالي"
                      : "اختاري نموذج الشهادة"}
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    PDF أو PNG أو JPG أو WEBP — بحد أقصى 15MB
                  </span>
                </label>

                {selectedFile ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between gap-4 bg-slate-50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#07152E] shadow-sm">
                          {selectedFileIsPdf ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <FileImage className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#07152E]">
                            {selectedFile.file.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatFileSize(selectedFile.file.size)}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        <UploadCloud className="h-3.5 w-3.5" />
                        بانتظار الحفظ
                      </span>
                    </div>

                    {selectedFile.previewUrl ? (
                      <div className="flex min-h-64 items-center justify-center bg-slate-100 p-4">
                        <img
                          src={selectedFile.previewUrl}
                          alt="معاينة قالب الشهادة الجديد"
                          className="max-h-[420px] max-w-full rounded-lg object-contain shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-44 flex-col items-center justify-center bg-slate-100 p-6 text-center">
                        <FileText className="h-10 w-10 text-slate-400" />
                        <p className="mt-3 text-sm font-bold text-slate-600">
                          تم اختيار ملف PDF
                        </p>
                      </div>
                    )}
                  </div>
                ) : savedTemplate ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-50 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                          {isPdfMimeType(savedTemplate.mimeType) ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <FileImage className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#07152E]">
                            {savedTemplate.fileName ||
                              savedTemplate.name}
                          </p>

                          <p className="mt-0.5 text-xs text-emerald-700">
                            القالب محفوظ ومفعّل
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        محفوظ
                      </span>
                    </div>

                    {savedTemplate.signedUrl ? (
                      isPdfMimeType(savedTemplate.mimeType) ? (
                        <iframe
                          src={savedTemplate.signedUrl}
                          title="قالب شهادة الكورس"
                          className="h-[420px] w-full border-0 bg-slate-100"
                        />
                      ) : (
                        <div className="flex min-h-64 items-center justify-center bg-slate-100 p-4">
                          <img
                            src={savedTemplate.signedUrl}
                            alt="قالب شهادة الكورس"
                            className="max-h-[420px] max-w-full rounded-lg object-contain shadow-sm"
                          />
                        </div>
                      )
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  {savedTemplate ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || isSaving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      حذف القالب
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      !selectedFile ||
                      !certificateTitle.trim() ||
                      isSaving ||
                      isDeleting
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07152E] px-5 text-sm font-black text-white transition hover:bg-[#10274c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    {savedTemplate
                      ? "حفظ القالب الجديد"
                      : "حفظ قالب الشهادة"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
                <Award className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#07152E]">
                  إصدار الشهادات للطلاب
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  سيظهر هنا طلاب الكورس الذين يمكن إصدار الشهادة لهم، مع
                  إرسال إشعار داخل المنصة ورسالة بريد إلكتروني.
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={studentSearch}
                onChange={(event) =>
                  setStudentSearch(event.target.value)
                }
                placeholder="ابحثي باسم الطالب أو البريد الإلكتروني..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition focus:border-[#F7B548] focus:bg-white"
              />
            </div>

            <CourseCertificateStudentsTable
              courseId={courseId}
              searchQuery={studentSearch}
              hasSavedTemplate={Boolean(savedTemplate)}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-[#07152E] p-5 text-white">
            <Award className="h-8 w-8 text-[#F7B548]" />

            <h2 className="mt-4 text-lg font-black">{courseTitle}</h2>

            <p className="mt-2 text-sm leading-6 text-white/65">
              رقم الكورس:
            </p>

            <p className="mt-1 break-all font-mono text-xs text-white/80">
              {courseId}
            </p>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm text-white/65">حالة القالب</p>
              <p className="mt-1 font-black">
                {savedTemplate ? "محفوظ ومفعّل" : "لم يُحفظ بعد"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-black text-[#07152E]">
              عند إصدار الشهادة
            </h3>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-[#F7B548]" />
                <p className="text-sm leading-6 text-slate-600">
                  تُنشأ شهادة مرتبطة بالطالب والكورس.
                </p>
              </div>

              <div className="flex gap-3">
                <Send className="mt-0.5 h-5 w-5 shrink-0 text-[#F7B548]" />
                <p className="text-sm leading-6 text-slate-600">
                  يصل إشعار جديد إلى صفحة الطالب.
                </p>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#F7B548]" />
                <p className="text-sm leading-6 text-slate-600">
                  تُرسل رسالة بريد تحتوي على رابط شاشة شهاداتي.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}