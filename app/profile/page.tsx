"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";
import { createClient } from "@/lib/supabase/client";

type ProfileForm = {
  fullName: string;
  fullNameEn: string;
  email: string;
  phone: string;
  country: string;
  jobTitle: string;
  experienceLevel: string;
  specialty: string;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  fullNameEn: "",
  email: "",
  phone: "",
  country: "",
  jobTitle: "",
  experienceLevel: "",
  specialty: "",
};

const INPUT =
  "h-[46px] w-full rounded-[14px] border border-[#D8DEE7] bg-[#F8FAFC] px-4 text-[12px] font-semibold text-[#07152E] outline-none transition focus:border-[#F7B548] focus:bg-white focus:ring-4 focus:ring-[#F7B548]/10";

export default function ProfilePage() {
  const router = useRouter();

  const [form, setForm] =
    useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");
  const [profileColumns, setProfileColumns] =
    useState<string[]>([]);

  const initials = useMemo(() => {
    const sourceName =
      form.fullName.trim() ||
      form.fullNameEn.trim();

    const parts = sourceName
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return "MM";

    const containsArabic =
      /[\u0600-\u06FF]/.test(sourceName);

    const firstLetter =
      parts[0]?.charAt(0) ?? "";

    const secondLetter =
      parts.length > 1
        ? parts[1]?.charAt(0) ?? ""
        : parts[0]?.charAt(1) ?? "";

    if (containsArabic) {
      return [firstLetter, secondLetter]
        .filter(Boolean)
        .join(" ");
    }

    return `${firstLetter}${secondLetter}`.toUpperCase();
  }, [form.fullName, form.fullNameEn]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Profile query error:",
            profileError,
          );
        }

        if (cancelled) return;

        const row =
          (profile ?? {}) as Record<
            string,
            unknown
          >;

        setProfileColumns(
          Object.keys(row),
        );

        const metadata =
          (user.user_metadata ??
            {}) as Record<
            string,
            unknown
          >;

        const readText = (
          ...values: unknown[]
        ) => {
          for (const value of values) {
            if (
              typeof value === "string" &&
              value.trim()
            ) {
              return value;
            }
          }

          return "";
        };

        setForm({
          fullName: readText(
            row.full_name,
            row.name,
            row.display_name,
            metadata.full_name,
            metadata.name,
            user.email?.split("@")[0],
          ),
          fullNameEn: readText(
            row.full_name_en,
            metadata.full_name_en,
          ),
          email: readText(
            user.email,
            row.email,
            metadata.email,
          ),
          phone: readText(
            row.phone,
            row.phone_number,
            row.whatsapp,
            metadata.phone,
          ),
          country: readText(
            row.country,
            metadata.country,
          ),
          jobTitle: readText(
            row.job_title,
            row.jobTitle,
            metadata.job_title,
          ),
          experienceLevel: readText(
            row.experience_level,
            row.experience,
            metadata.experience_level,
          ),
          specialty: readText(
            row.specialty,
            row.specialization,
            metadata.specialty,
          ),
        });
      } catch (caughtError) {
        console.error(
          "Failed to load profile:",
          caughtError,
        );

        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? `تعذر تحميل بيانات الحساب: ${caughtError.message}`
              : "تعذر تحميل بيانات الحساب حاليًا. حاولي مرة أخرى.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = form.fullName.trim();
    const fullNameEn =
      form.fullNameEn.trim();
    const phone = form.phone.trim();
    const country = form.country.trim();

    if (!fullName) {
      setError("يرجى إدخال الاسم الكامل.");
      return;
    }

    if (!fullNameEn) {
      setError(
        "يرجى إدخال الاسم باللغة الإنجليزية كما ترغب أن يظهر في الشهادة.",
      );
      return;
    }

    if (
      !/^[A-Za-z][A-Za-z .'-]*$/.test(
        fullNameEn,
      )
    ) {
      setError(
        "يرجى كتابة الاسم الإنجليزي باستخدام الحروف الإنجليزية فقط.",
      );
      return;
    }

    if (!phone) {
      setError("يرجى إدخال رقم الهاتف.");
      return;
    }

    if (!country) {
      setError("يرجى اختيار الدولة.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        router.replace("/login");
        return;
      }

      const profileCompleted = Boolean(
        fullName &&
          fullNameEn &&
          phone &&
          country,
      );

      const availableColumns =
        new Set(profileColumns);

      const profilePayload: Record<
        string,
        unknown
      > = {};

      if (availableColumns.has("full_name")) {
        profilePayload.full_name =
          fullName;
      }

      if (
        availableColumns.has(
          "full_name_en",
        )
      ) {
        profilePayload.full_name_en =
          fullNameEn;
      }

      if (availableColumns.has("phone")) {
        profilePayload.phone = phone;
      } else if (
        availableColumns.has(
          "phone_number",
        )
      ) {
        profilePayload.phone_number =
          phone;
      }

      if (availableColumns.has("country")) {
        profilePayload.country =
          country;
      }

      if (
        availableColumns.has("job_title")
      ) {
        profilePayload.job_title =
          form.jobTitle || null;
      }

      if (
        availableColumns.has(
          "experience_level",
        )
      ) {
        profilePayload.experience_level =
          form.experienceLevel || null;
      } else if (
        availableColumns.has("experience")
      ) {
        profilePayload.experience =
          form.experienceLevel || null;
      }

      if (
        availableColumns.has("specialty")
      ) {
        profilePayload.specialty =
          form.specialty || null;
      } else if (
        availableColumns.has(
          "specialization",
        )
      ) {
        profilePayload.specialization =
          form.specialty || null;
      }

      if (
        availableColumns.has(
          "profile_completed",
        )
      ) {
        profilePayload.profile_completed =
          profileCompleted;
      }

      if (
        Object.keys(profilePayload).length
      ) {
        const {
          error: updateProfileError,
        } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", user.id);

        if (updateProfileError) {
          console.error(
            "PROFILE UPDATE ERROR:",
            updateProfileError,
          );

          throw new Error(
            [
              updateProfileError.message,
              updateProfileError.details,
              updateProfileError.hint,
              updateProfileError.code
                ? `Code: ${updateProfileError.code}`
                : "",
            ]
              .filter(Boolean)
              .join(" — "),
          );
        }
      }

      const {
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: fullName,
          full_name_en: fullNameEn,
          phone,
          country,
          job_title:
            form.jobTitle || null,
          experience_level:
            form.experienceLevel || null,
          specialty:
            form.specialty || null,
        },
      });

      if (metadataError) {
        console.error(
          "Profile metadata sync error:",
          metadataError,
        );
      }

      setForm((current) => ({
        ...current,
        fullName,
        fullNameEn,
        phone,
        country,
      }));

      setSuccess(
        "تم حفظ بياناتك بنجاح.",
      );

      router.refresh();
    } catch (caughtError) {
      console.error(
        "Failed to save profile:",
        caughtError,
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر حفظ البيانات. حاولي مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F5F7FA] pt-[55px]">
        <AnnouncementBar />

        <section
          dir="rtl"
          className="border-b border-[#DCE2EA] bg-[#07152E]"
        >
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-5 sm:px-7 lg:px-10">
            <div>
              <p className="text-[13px] font-black text-[#F7B548]">
                حسابي
              </p>

              <h1 className="mt-0.5 text-[25px] font-black text-white">
                بياناتي
              </h1>

              <p className="mt-1 text-[13px] font-semibold text-white/60">
                حدّث بياناتك الشخصية والمهنية المستخدمة داخل المنصة والشهادات.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#F7B548] bg-white text-[14px] font-black text-[#07152E] shadow-lg">
              {initials}
            </div>
          </div>
        </section>

        <section
          dir="rtl"
          className="mx-auto max-w-[1100px] px-5 py-6 sm:px-7 lg:px-10"
        >
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-[#DCE2EA] bg-white">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F7B548]" />
                <p className="mt-3 text-[13px] font-bold text-slate-500">
                  جاري تحميل بياناتك...
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-[24px] border border-[#DCE2EA] bg-white shadow-[0_14px_38px_rgba(7,21,46,0.07)]"
            >
              <header className="flex items-center justify-between gap-4 border-b border-[#E5EAF0] bg-[#F9FAFC] px-5 py-3.5">
                <div>
                  <h2 className="text-[20px] font-black text-[#07152E]">
                    المعلومات الأساسية
                  </h2>

                  <p className="mt-0.5 text-[13px] font-semibold text-slate-500">
                    يمكنك تعديل بياناتك وحفظها في أي وقت.
                  </p>
                </div>

                <ShieldCheck
                  size={21}
                  className="text-[#C88712]"
                />
              </header>

              <div className="grid gap-x-5 gap-y-4 p-5 md:grid-cols-2">
                <Field
                  label="الاسم الكامل"
                  icon={UserRound}
                >
                  <input
                    value={form.fullName}
                    onChange={(event) =>
                      updateField(
                        "fullName",
                        event.target.value,
                      )
                    }
                    className={INPUT}
                    placeholder="الاسم الكامل"
                  />
                </Field>

                <Field
                  label="الاسم باللغة الإنجليزية"
                  hint="يظهر بهذا الشكل في الشهادات الجديدة."
                  icon={GraduationCap}
                >
                  <input
                    value={form.fullNameEn}
                    onChange={(event) =>
                      updateField(
                        "fullNameEn",
                        event.target.value,
                      )
                    }
                    dir="ltr"
                    className={`${INPUT} text-left`}
                    placeholder="Mona Abdallah Mohamed"
                  />
                </Field>

                <Field
                  label="البريد الإلكتروني"
                  hint="لتغيير البريد سنستخدم إجراء تأكيد منفصل لاحقًا."
                  icon={Mail}
                >
                  <input
                    value={form.email}
                    readOnly
                    dir="ltr"
                    className={`${INPUT} cursor-not-allowed bg-slate-100 text-left text-slate-500`}
                  />
                </Field>

                <Field
                  label="رقم الهاتف مع كود الدولة"
                  icon={Phone}
                >
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value,
                      )
                    }
                    dir="ltr"
                    className={`${INPUT} text-left`}
                    placeholder="+966 5X XXX XXXX"
                  />
                </Field>

                <Field
                  label="الدولة"
                  icon={Globe2}
                >
                  <select
                    value={form.country}
                    onChange={(event) =>
                      updateField(
                        "country",
                        event.target.value,
                      )
                    }
                    className={INPUT}
                  >
                    <option value="">
                      اختر الدولة
                    </option>
                    <option value="Saudi Arabia">
                      السعودية
                    </option>
                    <option value="Egypt">
                      مصر
                    </option>
                    <option value="United Arab Emirates">
                      الإمارات
                    </option>
                    <option value="Oman">
                      عُمان
                    </option>
                    <option value="Iraq">
                      العراق
                    </option>
                    <option value="Libya">
                      ليبيا
                    </option>
                    <option value="Sudan">
                      السودان
                    </option>
                    <option value="Syria">
                      سوريا
                    </option>
                    <option value="Nigeria">
                      نيجيريا
                    </option>
                    <option value="Other">
                      دولة أخرى
                    </option>
                  </select>
                </Field>

                <Field
                  label="المسمى الوظيفي"
                  icon={BriefcaseBusiness}
                >
                  <select
                    value={form.jobTitle}
                    onChange={(event) =>
                      updateField(
                        "jobTitle",
                        event.target.value,
                      )
                    }
                    className={INPUT}
                  >
                    <option value="">
                      اختر المسمى الوظيفي
                    </option>
                    <option value="Student">
                      طالب
                    </option>
                    <option value="Engineer">
                      مهندس
                    </option>
                    <option value="Consultant">
                      استشاري
                    </option>
                    <option value="Project Manager">
                      مدير مشروع
                    </option>
                    <option value="Trainer">
                      مدرب
                    </option>
                    <option value="Other">
                      أخرى
                    </option>
                  </select>
                </Field>

                <Field
                  label="سنوات الخبرة"
                  icon={CheckCircle2}
                >
                  <select
                    value={
                      form.experienceLevel
                    }
                    onChange={(event) =>
                      updateField(
                        "experienceLevel",
                        event.target.value,
                      )
                    }
                    className={INPUT}
                  >
                    <option value="">
                      اختر سنوات الخبرة
                    </option>
                    <option value="0-2">
                      أقل من سنتين
                    </option>
                    <option value="2-5">
                      من سنتين إلى 5 سنوات
                    </option>
                    <option value="5-10">
                      من 5 إلى 10 سنوات
                    </option>
                    <option value="10+">
                      أكثر من 10 سنوات
                    </option>
                  </select>
                </Field>

                <Field
                  label="التخصص"
                  icon={GraduationCap}
                >
                  <select
                    value={form.specialty}
                    onChange={(event) =>
                      updateField(
                        "specialty",
                        event.target.value,
                      )
                    }
                    className={INPUT}
                  >
                    <option value="">
                      اختر التخصص
                    </option>
                    <option value="Road Design">
                      تصميم الطرق
                    </option>
                    <option value="Traffic Engineering">
                      هندسة المرور
                    </option>
                    <option value="Civil Engineering">
                      الهندسة المدنية
                    </option>
                    <option value="Surveying">
                      المساحة
                    </option>
                    <option value="BIM">
                      BIM
                    </option>
                    <option value="Other">
                      أخرى
                    </option>
                  </select>
                </Field>
              </div>

              {(error || success) && (
                <div className="px-5 pb-4">
                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-600">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
                      {success}
                    </div>
                  ) : null}
                </div>
              )}

              <footer className="flex flex-col gap-3 border-t border-[#E5EAF0] bg-[#F9FAFC] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] font-semibold text-slate-500">
                  الاسم الإنجليزي المحدّث سيُستخدم في الشهادات التي تصدر بعد التعديل.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 text-[13px] font-black text-[#07152E] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      حفظ التعديلات
                    </>
                  )}
                </button>
              </footer>
            </form>
          )}
        </section>
      </main>
    </>
  );
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon
          size={14}
          className="text-[#C88712]"
        />

        <label className="text-[13px] font-black text-[#07152E]">
          {label}
        </label>
      </div>

      {children}

      {hint ? (
        <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}