"use client";

import { useState, useTransition } from "react";
import {
  Eye,
  FolderKanban,
  ImageIcon,
  Save,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import CertificatesPanel from "@/components/student/workspace/panels/CertificatesPanel";

import {
  updateImportedStudentJourneyProgress,
} from "@/lib/actions/admin/student-import";

import type {
  ImportedStudentPreview,
  ImportedStudentPreviewProject,
} from "@/lib/actions/admin/student-import";

type TabId =
  | "profile"
  | "journeys"
  | "passport"
  | "certificates"
  | "projects"
  | "surveys"
  | "notifications";

const tabs: {
  id: TabId;
  label: string;
}[] = [
  { id: "profile", label: "البيانات الأساسية" },
  { id: "journeys", label: "الرحلات" },
  { id: "passport", label: "Masar Passport" },
  { id: "certificates", label: "الشهادات" },
  { id: "projects", label: "المشاريع" },
  { id: "surveys", label: "الاستبيانات" },
  { id: "notifications", label: "الإشعارات" },
];

const journeyLabels: Record<string, string> = {
  integrated: "رحلة احتراف",
  fundamental: "رحلة احتراف",
  fundamentals: "رحلة احتراف",
  advanced: "رحلة احتراف",
  career_path: "رحلة احتراف",
  career: "رحلة احتراف",
  professional: "رحلة احتراف",
  workshop: "رحلة يوم واحد",
  one_day: "رحلة يوم واحد",
  one_day_journey: "رحلة يوم واحد",
  one_day_workshop: "رحلة يوم واحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
  free_journey: "رحلة مجانية",
};

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  active: "نشط",
  enrolled: "نشط",
  confirmed: "نشط",
  completed: "مكتمل",
  rejected: "مرفوض",
  suspended: "موقوف",
  expired: "منتهي",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function getStatusClass(status: string) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    ["active", "approved", "enrolled", "confirmed"].includes(
      status,
    )
  ) {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function ImportedStudentAdminWorkspace({
  data,
}: {
  data: ImportedStudentPreview;
}) {
  const [activeTab, setActiveTab] =
    useState<TabId>("profile");

  const [viewedProject, setViewedProject] =
    useState<ImportedStudentPreviewProject | null>(
      null,
    );

  const professionalJourneys =
    data.passport
      .professionalEnrollments;

  const totalJourneys =
    data.journeys.reduce(
      (total, journey) =>
        total +
        journey.journeyCount,
      0,
    );

  return (
    <div dir="rtl">
      <div className="mb-4 rounded-2xl border border-[#F7B548]/40 bg-[#FFF8E9] px-5 py-4">
        <p className="text-sm font-black text-[#07152E]">
          معاينة بيانات طالب مستورد
        </p>

        <p className="mt-1 text-xs font-bold leading-6 text-slate-600">
          هذه معاينة للبيانات المحفوظة قبل تسجيل الطالب. عند التسجيل بنفس البريد سيتم ربطها بحسابه الحقيقي.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي النقاط"
          value={
            data.passport.totalPoints
          }
        />

        <SummaryCard
          label="الرحلات الاحترافية"
          value={professionalJourneys}
        />

        <SummaryCard
          label="الشهادات"
          value={data.certificates.length}
        />

        <SummaryCard
          label="فرص السحب"
          value={
            data.passport.drawEntries
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-black transition ${
                  activeTab === tab.id
                    ? "border-[#F7B548] text-[#07152E]"
                    : "border-transparent text-slate-500 hover:text-[#07152E]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAFC] p-4 sm:p-6">
          {activeTab === "profile" ? (
            <section className="grid gap-4 md:grid-cols-2">
              <ProfileField
                label="اسم الطالب"
                value={data.studentName}
              />

              <ProfileField
                label="البريد الإلكتروني"
                value={data.studentEmail}
              />

              <ProfileField
                label="Masar ID"
                value={String(
                  data.masarId,
                )}
              />

              <ProfileField
                label="حالة الحساب"
                value={
                  data.isLinkedToAccount
                    ? "مرتبط بحساب"
                    : "بانتظار التسجيل"
                }
              />
            </section>
          ) : null}

          {activeTab === "journeys" ? (
            <ImportedJourneysPanel
              journeys={data.journeys}
              totalJourneys={
                totalJourneys
              }
              isLinkedToAccount={
                data.isLinkedToAccount
              }
            />
          ) : null}

          {activeTab === "passport" ? (
            <ImportedPassportPanel
              passport={
                data.passport
              }
            />
          ) : null}

          {activeTab === "certificates" ? (
            <CertificatesPanel
              certificates={data.certificates.map(
                (certificate) => ({
                  id:
                    certificate.id,
                  certificateNumber:
                    certificate.certificateNumber,
                  courseTitle:
                    certificate.courseTitle,
                  issuedAt:
                    certificate.issuedAt,
                  previewUrl:
                    certificate.previewUrl,
                  pdfUrl:
                    certificate.pdfUrl,
                  primaryColor:
                    "#F7B548",
                  secondaryColor:
                    "#07152E",
                  isNew:
                    certificate.isNew,
                }),
              )}
              mode="admin"
            />
          ) : null}

          {activeTab === "projects" ? (
            <ImportedProjectsPanel
              projects={data.projects}
              onView={
                setViewedProject
              }
            />
          ) : null}

          {activeTab === "surveys" ? (
            <section className="space-y-3">
              {data.surveys.length === 0 ? (
                <EmptyState text="لا توجد تقييمات لهذا الطالب." />
              ) : (
                data.surveys.map(
                  (survey) => (
                    <article
                      key={
                        survey.id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-black text-[#07152E]">
                          التقييم العام
                        </span>

                        <span className="font-black text-[#C88712]">
                          {
                            survey.rating
                          }
                          /5
                        </span>
                      </div>

                      {survey.comment ? (
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {
                            survey.comment
                          }
                        </p>
                      ) : null}
                    </article>
                  ),
                )
              )}
            </section>
          ) : null}

          {activeTab === "notifications" ? (
            <EmptyState text="الإشعارات تبدأ بعد تسجيل الطالب وربط حسابه بالبيانات المستوردة." />
          ) : null}
        </div>
      </div>

      {viewedProject ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewedProject(
                null,
              );
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-[#07152E]">
                  {
                    viewedProject.projectTitle
                  }
                </h2>

                <p className="mt-1 text-xs font-bold text-slate-500">
                  {
                    viewedProject.images
                      .length
                  }{" "}
                  صور
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewedProject(
                    null,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {viewedProject.images.map(
                (
                  image,
                  index,
                ) => (
                  <div
                    key={`${viewedProject.id}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={image}
                      alt={
                        viewedProject.projectTitle
                      }
                      className="aspect-video h-full w-full object-contain"
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImportedJourneysPanel({
  journeys,
  totalJourneys,
  isLinkedToAccount,
}: {
  journeys: ImportedStudentPreview["journeys"];
  totalJourneys: number;
  isLinkedToAccount: boolean;
}) {
  const paid = journeys.reduce(
    (total, journey) =>
      total +
      (journey.enrollmentSource ===
      "paid"
        ? journey.journeyCount
        : 0),
    0,
  );

  const reward = journeys.reduce(
    (total, journey) =>
      total +
      (journey.enrollmentSource ===
      "reward"
        ? journey.journeyCount
        : 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="إجمالي الرحلات"
          value={totalJourneys}
        />

        <StatCard
          label="اشتراكات مدفوعة"
          value={paid}
        />

        <StatCard
          label="رحلات كمكافأة"
          value={reward}
          highlighted
        />
      </div>

      {journeys.length === 0 ? (
        <EmptyState text="لا توجد رحلات مسجلة لهذا الطالب." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right">
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>
                    الكورس
                  </TableHead>

                  <TableHead>
                    المحطة
                  </TableHead>

                  <TableHead>
                    نوع الرحلة
                  </TableHead>

                  <TableHead>
                    نوع الاشتراك
                  </TableHead>

                  <TableHead>
                    الحالة
                  </TableHead>

                  <TableHead>
                    التقدم
                  </TableHead>

                  <TableHead>
                    تاريخ الاشتراك
                  </TableHead>

                  <TableHead>
                    آخر تحديث
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {journeys.map(
                  (journey) => (
                    <tr
                      key={
                        journey.id
                      }
                      className="border-t border-slate-100 bg-white"
                    >
                      <TableCell>
                        <div>
                          <p className="font-black text-[#07152E]">
                            {
                              journey.courseTitle
                            }
                          </p>

                          {journey.courseCode ? (
                            <p className="mt-1 text-[10px] font-black text-[#C88712]">
                              {
                                journey.courseCode
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        {journey.stationTitle ??
                          "—"}
                      </TableCell>

                      <TableCell>
                        <div>
                          <span>
                            {journeyLabels[
                              journey.journeyType.toLowerCase()
                            ] ??
                              journey.journeyType}
                          </span>

                          {journey.journeyPartLabel ? (
                            <p className="mt-1 text-[10px] font-black text-[#C88712]">
                              {
                                journey.journeyPartLabel
                              }
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            journey.enrollmentSource ===
                            "reward"
                              ? "bg-[#FFF1C7] text-[#B8790B]"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {journey.enrollmentSource ===
                          "reward"
                            ? "مكافأة"
                            : "مدفوع"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            journey.status,
                          )}`}
                        >
                          {statusLabels[
                            journey.status
                          ] ??
                            journey.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        <ImportedProgressEditor
                          enrollmentId={
                            journey.id.split(
                              ":",
                            )[0]
                          }
                          journeyPart={
                            journey.journeyPart
                          }
                          progress={
                            journey.progressPercent
                          }
                          disabled={
                            isLinkedToAccount
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          journey.enrolledAt,
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(
                          journey.updatedAt,
                        )}
                      </TableCell>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportedProgressEditor({
  enrollmentId,
  journeyPart,
  progress,
  disabled,
}: {
  enrollmentId: string;
  journeyPart:
    | "single"
    | "fundamentals"
    | "advanced";
  progress: number;
  disabled: boolean;
}) {
  const router =
    useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [value, setValue] =
    useState(
      String(progress),
    );

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  function saveProgress() {
    const numericValue =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(value),
          ),
        ),
      );

    if (
      !Number.isFinite(
        numericValue,
      )
    ) {
      setMessage(
        "أدخل نسبة صحيحة.",
      );
      return;
    }

    startTransition(
      async () => {
        const result =
          await updateImportedStudentJourneyProgress(
            enrollmentId,
            journeyPart,
            numericValue,
          );

        setMessage(
          result.message,
        );

        if (result.success) {
          setValue(
            String(
              numericValue,
            ),
          );

          router.refresh();
        }
      },
    );
  }

  return (
    <div className="min-w-[190px]">
      <div className="mb-2 flex items-center justify-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          disabled={
            disabled ||
            isPending
          }
          onChange={(event) =>
            setValue(
              event.target.value,
            )
          }
          className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-black text-[#07152E] outline-none focus:border-[#F7B548] disabled:bg-slate-100 disabled:text-slate-400"
        />

        <span className="text-xs font-black text-slate-500">
          %
        </span>

        <button
          type="button"
          onClick={
            saveProgress
          }
          disabled={
            disabled ||
            isPending
          }
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#07152E] px-2.5 text-[10px] font-black text-white transition hover:bg-[#0B2146] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save
            size={12}
          />
          {isPending
            ? "حفظ..."
            : "حفظ"}
        </button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#F7B548]"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {disabled ? (
        <p className="mt-1 text-[9px] font-bold text-slate-400">
          التقدم مرتبط بالحساب الحقيقي
        </p>
      ) : message ? (
        <p className="mt-1 whitespace-normal text-[9px] font-bold text-slate-500">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function ImportedPassportPanel({
  passport,
}: {
  passport: ImportedStudentPreview["passport"];
}) {
  const breakdown = [
    {
      label:
        "الاشتراك في رحلات الاحتراف",
      count:
        passport.professionalEnrollments,
      points:
        passport.professionalEnrollmentPoints,
    },
    {
      label:
        "إكمال رحلات الاحتراف",
      count:
        passport.professionalCompletions,
      points:
        passport.professionalCompletionPoints,
    },
    {
      label:
        "رحلات اليوم الواحد",
      count:
        passport.oneDayEnrollments,
      points:
        passport.oneDayEnrollmentPoints,
    },
    {
      label:
        "الرحلات المجانية المشاهدة",
      count:
        passport.viewedFreeJourneys,
      points:
        passport.freeJourneyPoints,
    },
    {
      label:
        "الاستبيانات",
      count:
        passport.surveyCount,
      points:
        passport.surveyPoints,
    },
    {
      label:
        "المشاريع المعتمدة",
      count:
        passport.projectCount,
      points:
        passport.projectPoints,
    },
    {
      label:
        "مشاريع منشورة",
      count:
        passport.featuredProjectCount,
      points:
        passport.featuredProjectPoints,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <StatCard
    label="إجمالي النقاط"
    value={
      passport.totalPoints
    }
    highlighted
  />

  <StatCard
    label="إجمالي فرص السحب"
    value={
      passport.drawEntries
    }
  />

  <StatCard
    label="مرات الفوز"
    value={
      passport.drawWins
    }
  />

  <StatCard
    label="الفرص المتبقية"
    value={
      passport.availableDrawEntries
    }
  />
</div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[#07152E]">
              Masar Engineering Passport
            </h3>

            <p className="mt-1 text-xs font-bold text-slate-500">
              يتم احتساب النقاط للطالب المستورد قبل التسجيل بنفس قواعد الطالب المسجل.
            </p>
          </div>

          {passport.nextLevel ? (
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400">
                المتبقي للمستوى التالي
              </p>

              <p className="mt-1 font-black text-[#C88712]">
                {
                  passport.pointsToNextLevel
                }{" "}
                نقطة
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#F7B548]"
            style={{
              width:
                `${Math.max(
                  0,
                  Math.min(
                    100,
                    passport.progressPercent,
                  ),
                )}%`,
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h4 className="font-black text-[#07152E]">
            تفاصيل النقاط
          </h4>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-3">
          {breakdown.map(
            (item) => (
              <div
                key={item.label}
                className="bg-white p-4"
              >
                <p className="text-xs font-bold text-slate-500">
                  {item.label}
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <span className="text-xl font-black text-[#07152E]">
                    {
                      item.points
                    }{" "}
                    نقطة
                  </span>

                  <span className="text-[10px] font-black text-[#C88712]">
                    العدد:{" "}
                    {
                      item.count
                    }
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ImportedProjectsPanel({
  projects,
  onView,
}: {
  projects: ImportedStudentPreviewProject[];
  onView: (
    project: ImportedStudentPreviewProject,
  ) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <FolderKanban className="h-10 w-10 text-[#F7B548]" />

        <p className="mt-4 font-black text-[#07152E]">
          لا توجد مشاريع لهذا الطالب.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-black text-[#07152E]">
          مشاريع الطالب
        </h3>

        <p className="mt-1 text-xs font-bold text-slate-500">
          إجمالي المشاريع:{" "}
          {projects.length}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {projects.map(
          (project) => (
            <article
              key={
                project.id
              }
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex min-h-[160px] items-center justify-center bg-slate-50">
                  {project.coverImage ? (
                    <img
                      src={
                        project.coverImage
                      }
                      alt={
                        project.projectTitle
                      }
                      className="h-full max-h-[180px] w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-9 w-9 text-slate-300" />
                  )}
                </div>

                <div className="flex flex-col justify-between p-4">
                  <div>
                    <h4 className="font-black text-[#07152E]">
                      {
                        project.projectTitle
                      }
                    </h4>

                    <p className="mt-1 text-xs font-bold text-[#C88712]">
                      {
                        project.courseTitle
                      }
                    </p>

                    {project.projectDescription ? (
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-6 text-slate-500">
                        {
                          project.projectDescription
                        }
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onView(
                          project,
                        )
                      }
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-xs font-black text-white"
                    >
                      <Eye
                        size={14}
                      />
                      عرض
                    </button>

                    <span className="mr-auto text-[10px] font-bold text-slate-400">
                      {
                        project.images
                          .length
                      }{" "}
                      صور
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#07152E]">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number | string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        highlighted
          ? "border-[#F7B548]/50 bg-[#FFF8E9]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-2xl font-black text-[#07152E]">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-black text-slate-500">
        {label}
      </p>
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-black text-[#07152E]">
        {value || "—"}
      </p>
    </div>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-black text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold text-slate-600">
      {children}
    </td>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center font-bold text-slate-500">
      {text}
    </div>
  );
}