"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createCourse,
  updateCourse,
  type CourseStatus,
} from "@/lib/actions/admin/courses";

interface CourseFormInitialData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  duration_hours?: number | null;
  price?: number | null;
  journey_type?: string | null;
  status?: CourseStatus | null;
  whatsapp_number?: string | null;
}

interface CourseFormProps {
  initialData?: CourseFormInitialData;
}

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
}

export default function CourseForm({
  initialData,
}: CourseFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.image_url ?? "",
  );
  const [iconUrl, setIconUrl] = useState(
    initialData?.icon_url ?? "",
  );
  const [duration, setDuration] = useState(
    initialData?.duration_hours ?? 0,
  );
  const [price, setPrice] = useState(
    initialData?.price ?? 0,
  );
  const [journeyType, setJourneyType] = useState(
    initialData?.journey_type ?? "career_path",
  );
  const [status, setStatus] = useState<CourseStatus>(
    initialData?.status ?? "draft",
  );
  const [whatsapp, setWhatsapp] = useState(
    initialData?.whatsapp_number ?? "",
  );

  const submit = () => {
    startTransition(async () => {
      const payload = {
        title,
        slug,
        description,
        image_url: imageUrl,
        icon_url: iconUrl,
        duration_hours: duration,
        price,
        journey_type: journeyType,
        status,
        whatsapp_number: whatsapp,
      };

      const result =
        isEditing && initialData
          ? await updateCourse(initialData.id, payload)
          : await createCourse(payload);

      if (!result.success) {
        alert(result.message);
        return;
      }

      router.push("/admin/learning/courses");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="اسم الكورس"
          value={title}
          onChange={setTitle}
        />

        <Field
          label="Slug"
          value={slug}
          onChange={setSlug}
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
          label="السعر"
          type="number"
          value={price}
          onChange={(value) =>
            setPrice(Number(value))
          }
        />

        <Field
          label="رابط صورة الكورس"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <Field
          label="رابط الأيقونة"
          value={iconUrl}
          onChange={setIconUrl}
        />

        <Field
          label="رقم الواتساب"
          value={whatsapp}
          onChange={setWhatsapp}
        />

        <div>
          <label className="mb-2 block font-bold text-[#07152E]">
            نوع الرحلة
          </label>

          <select
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-[#F7B548]"
            value={journeyType}
            onChange={(event) =>
              setJourneyType(event.target.value)
            }
          >
            <option value="career_path">
              رحلة احتراف متكاملة
            </option>

            <option value="workshop">
              رحلة اليوم الواحد
            </option>

            <option value="free">
              رحلة مجانية
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-bold text-[#07152E]">
            الحالة
          </label>

          <select
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-[#F7B548]"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as CourseStatus)
            }
          >
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-2 block font-bold text-[#07152E]">
          الوصف
        </label>

        <textarea
          rows={6}
          className="w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-[#F7B548]"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/learning/courses")
          }
          disabled={pending}
          className="rounded-xl border border-slate-200 px-8 py-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          إلغاء
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-xl bg-[#F7B548] px-8 py-3 font-black text-[#07152E] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "جاري الحفظ..."
            : isEditing
              ? "حفظ التعديلات"
              : "حفظ الكورس"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#07152E]">
        {label}
      </label>

      <input
        className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#F7B548]"
        value={value}
        type={type}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </div>
  );
}