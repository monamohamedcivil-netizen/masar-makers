"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  updateCourse,
  type CourseStatus,
} from "@/lib/actions/admin/courses";

export interface CourseOverviewData {
  id: string;
  title: string;
  slug: string;
  level?: "single" | "split" | null;
  difficulty_level?: "fundamentals" | "advanced" | null;
  description?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  duration_hours?: number | null;
  price?: number | null;
  currency?: string | null;
   status?: CourseStatus | null;
 
  course_code?: string | null;
  display_order?: number | null;

}

interface CourseOverviewFormProps {
  course: CourseOverviewData;
}

export default function CourseOverviewForm({
  course,
}: CourseOverviewFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(course.title ?? "");
  const [slug, setSlug] = useState(course.slug ?? "");
  const [description, setDescription] = useState(
    course.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(
    course.image_url ?? "",
  );
  const [iconUrl, setIconUrl] = useState(
    course.icon_url ?? "",
  );
  const [duration, setDuration] = useState(
    course.duration_hours ?? 0,
  );
  const [price, setPrice] = useState(course.price ?? 0);
  const [currency, setCurrency] = useState(
    course.currency ?? "SAR",
  );
 
  const [status, setStatus] = useState<CourseStatus>(
    course.status ?? "draft",
  );

const [displayOrder, setDisplayOrder] = useState(
  course.display_order ?? 1,
);
const [courseCode, setCourseCode] = useState(
  course.course_code ?? "",
);
const [courseLevel, setCourseLevel] = useState<
  "single" | "split"
>(course.level === "split" ? "split" : "single");

const [difficultyLevel, setDifficultyLevel] = useState<
  "fundamentals" | "advanced"
>(
  course.difficulty_level === "fundamentals"
    ? "fundamentals"
    : "advanced",
);

  const submit = () => {
    setMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateCourse(course.id, {
  title: title.trim(),
  slug: slug.trim(),
  description: description.trim(),
  image_url: imageUrl.trim(),
  icon_url: iconUrl.trim(),
  duration_hours: duration,
  display_order: displayOrder,
  price,
  currency,
 
  status,

  course_code: courseCode.trim().toUpperCase(),
  level: courseLevel,
  difficulty_level: difficultyLevel,
});

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setMessage("تم حفظ بيانات الكورس بنجاح.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {(message || errorMessage) && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
            errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message && <CheckCircle2 className="h-5 w-5" />}
          <span>{errorMessage ?? message}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6">
              <h2 className="text-lg font-black text-[#07152E]">
                البيانات الأساسية
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                عدّلي معلومات الكورس التي تظهر داخل لوحة التحكم وصفحات المنصة.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="اسم الكورس"
                value={title}
                onChange={setTitle}
              />

              <Field
                label="Slug"
                value={slug}
                onChange={setSlug}
                dir="ltr"
              />

              <Field
                label="مدة الكورس (ساعة)"
                type="number"
                value={duration}
                onChange={(value) =>
                  setDuration(Number(value))
                }
              />
              <Field
  label="Course Code"
  value={courseCode}
  onChange={(value) =>
    setCourseCode(value.toUpperCase())
  }
  dir="ltr"
/>
<div>
  <Label>تقسيم الكورس</Label>

  <select
    value={courseLevel}
    onChange={(event) =>
      setCourseLevel(
        event.target.value as "single" | "split",
      )
    }
    className={inputClassName}
  >
    <option value="single">
      كورس واحد — شهادة Advanced
    </option>

    <option value="split">
      أساسيات + متقدم — شهادتان F و A
    </option>
  </select>
</div>

<div>
  <Label>مستوى الكورس</Label>

  <select
    value={difficultyLevel}
    onChange={(event) =>
      setDifficultyLevel(
        event.target.value as "fundamentals" | "advanced",
      )
    }
    className={inputClassName}
  >
    <option value="fundamentals">
      Fundamentals — أساسيات
    </option>

    <option value="advanced">
      Advanced — احترافي
    </option>
  </select>
</div>

<Field
  label="ترتيب الكورس على المسار"
  type="number"
  value={displayOrder}
  onChange={(value) =>
    setDisplayOrder(Number(value))
  }
/>
              <Field
                label="السعر"
                type="number"
                value={price}
                onChange={(value) => setPrice(Number(value))}
              />

              <div>
                <Label>العملة</Label>
                <select
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="SAR">ريال سعودي — SAR</option>
                  <option value="EGP">جنيه مصري — EGP</option>
                  <option value="USD">دولار أمريكي — USD</option>
                </select>
              </div>

         

            

              <div>
                <Label>حالة الكورس</Label>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as CourseStatus,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <Label>وصف الكورس</Label>
              <textarea
                rows={7}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 p-4 leading-7 outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6">
              <h2 className="text-lg font-black text-[#07152E]">
                الصور
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                في المرحلة الحالية نستخدم روابط الصور، وسنضيف الرفع المباشر إلى Storage لاحقًا.
              </p>
            </div>

            <div className="grid gap-5">
              <Field
                label="رابط صورة الكورس"
                value={imageUrl}
                onChange={setImageUrl}
                dir="ltr"
              />

              <Field
                label="رابط أيقونة الكورس"
                value={iconUrl}
                onChange={setIconUrl}
                dir="ltr"
              />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <PreviewCard
            title="معاينة صورة الكورس"
            imageUrl={imageUrl}
            fallbackText="لم تتم إضافة صورة للكورس"
            ratio="aspect-video"
          />

          <PreviewCard
            title="معاينة الأيقونة"
            imageUrl={iconUrl}
            fallbackText="لم تتم إضافة أيقونة"
            ratio="aspect-square"
            compact
          />

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F7B548] px-6 py-4 font-black text-[#07152E] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </aside>
      </div>
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block font-bold text-[#07152E]">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  dir,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        type={type}
        dir={dir}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </div>
  );
}

function PreviewCard({
  title,
  imageUrl,
  fallbackText,
  ratio,
  compact = false,
}: {
  title: string;
  imageUrl: string;
  fallbackText: string;
  ratio: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        className={`${ratio} ${
          compact ? "mx-auto max-w-[190px]" : ""
        } flex items-center justify-center bg-slate-100`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-4 text-center text-sm font-bold text-slate-400">
            {fallbackText}
          </span>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        <p className="text-sm font-black text-[#07152E]">
          {title}
        </p>
      </div>
    </div>
  );
}