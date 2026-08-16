"use client";

import { useState } from "react";
import StudentNotificationsPanel from "./StudentNotificationsPanel";
import CertificatesPanel from "@/components/student/workspace/panels/CertificatesPanel";
import MasarPassportPanel from "@/components/student/workspace/panels/MasarPassportPanel";
import StudentJourneysPanel from "@/components/admin/students/StudentJourneysPanel";
import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";
import StudentProjectsPanel from "@/components/admin/students/StudentProjectsPanel";
type TabId =
  | "profile"
  | "journeys"
  | "passport"
  | "certificates"
  | "projects"
  | "surveys"
  | "notifications";

interface StudentAdminWorkspaceProps {
  data: StudentDashboardData;
  userId: string;
}

const tabs: {
  id: TabId;
  label: string;
}[] = [
  {
    id: "profile",
    label: "البيانات الأساسية",
  },
  {
    id: "journeys",
    label: "الرحلات",
  },
  {
    id: "passport",
    label: "Masar Passport",
  },
  {
    id: "certificates",
    label: "الشهادات",
  },
  {
    id: "projects",
    label: "المشاريع",
  },
  {
    id: "surveys",
    label: "الاستبيانات",
  },
  {
    id: "notifications",
    label: "الإشعارات",
  },
];

export default function StudentAdminWorkspace({
  data,
  userId,
}: StudentAdminWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<TabId>("profile");

  const allCourses = [
    ...data.activeCourses,
    ...data.pendingCourses,
    ...data.completedCourses,
  ];

  return (
    <div dir="rtl">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="إجمالي النقاط"
          value={data.passport.totalPoints}
        />

        <SummaryCard
          label="الرحلات الاحترافية"
          value={data.passport.rewardCourses}
        />

        <SummaryCard
          label="الشهادات"
          value={data.certificates.length}
        />

        <SummaryCard
          label="فرص السحب"
          value={data.passport.drawEntries}
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
                label="المستوى الحالي"
                value={
                  data.passport.currentLevel
                }
              />

              <ProfileField
                label="إجمالي النقاط"
                value={`${data.passport.totalPoints} نقطة`}
              />
            </section>
          ) : null}

          {activeTab === "journeys" ? (
  <StudentJourneysPanel
    userId={userId}
  />
) : null}

          {activeTab === "passport" ? (
            <MasarPassportPanel data={data} />
          ) : null}

          {activeTab === "certificates" ? (
            <CertificatesPanel
              certificates={data.certificates}
              mode="admin"
            />
          ) : null}

          {activeTab === "projects" ? (
  <StudentProjectsPanel
    userId={userId}
  />
) : null}

          {activeTab === "surveys" ? (
            <section className="space-y-3">
              {data.surveys.length === 0 ? (
                <EmptyState text="لا توجد تقييمات لهذا الطالب." />
              ) : (
                data.surveys.map((survey) => (
                  <article
                    key={survey.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-black text-[#07152E]">
                        التقييم العام
                      </span>

                      <span className="font-black text-[#C88712]">
                        {survey.rating}/5
                      </span>
                    </div>

                    {survey.comment ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {survey.comment}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </section>
          ) : null}

          {activeTab === "notifications" ? (
  <StudentNotificationsPanel userId={userId} />
) : null}
        </div>
      </div>
    </div>
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