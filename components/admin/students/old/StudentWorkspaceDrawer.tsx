"use client";
import {
  useEffect,
  useState,
} from "react";

import CertificatesPanel from "@/components/student/workspace/panels/CertificatesPanel";
import MasarPassportPanel from "@/components/student/workspace/panels/MasarPassportPanel";

import {
  getAdminStudentDashboardData,
} from "@/lib/actions/admin/student-dashboard";

import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";
import StudentJourneysPanel from "@/components/admin/students/StudentJourneysPanel";
interface StudentWorkspaceDrawerProps {
  open: boolean;
  onClose: () => void;

  student: {
    userId: string;

    studentName: string;
    studentEmail: string;
    studentPhone: string | null;

    totalPoints: number;

    rewardProgress: number;

earnedRewards: number;

redeemedRewards: number;

availableRewards: number;
  } | null;
}

export default function StudentWorkspaceDrawer({
  open,
  onClose,
  student,
}: StudentWorkspaceDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "journeys"
    | "passport"
    | "certificates"
    | "projects"
    | "surveys"
    | "notifications"
  >("profile");

  const [
    dashboardData,
    setDashboardData,
  ] =
    useState<StudentDashboardData | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) {
      return;
    }

    let cancelled = false;

    async function loadStudentData() {
      setIsLoading(true);
      setLoadError(null);
      setDashboardData(null);

      const result =
        await getAdminStudentDashboardData(
          student!.userId,
        );

      if (cancelled) {
        return;
      }

      if (!result.success) {
        setLoadError(result.message);
        setIsLoading(false);
        return;
      }

      setDashboardData(result.data);
      setIsLoading(false);
    }

    void loadStudentData();

    return () => {
      cancelled = true;
    };
  }, [open, student]);

  if (!open || !student) {
    return null;
  }

const tabs = [
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
] as const;
  return (
    <div className="fixed inset-0 z-[200] bg-black/40">

      <div className="absolute inset-y-0 right-0 w-[88vw] max-w-[1500px] overflow-auto bg-[#F8FAFC] shadow-2xl">

        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-8 py-6">

          <div>

  <h2 className="text-[26px] font-black text-[#07152E]">
    {student.studentName}
  </h2>

  <p className="mt-2 text-sm text-slate-500">
    {student.studentEmail}
  </p>

  {student.studentPhone && (
    <p className="mt-1 text-sm text-slate-500">
      {student.studentPhone}
    </p>
  )}

</div>

<div className="flex items-start gap-4">
  
  <div className="rounded-xl bg-[#FFF5DD] min-w-[130px] px-5 py-3 text-center">

    <div className="text-[24px] font-black text-[#C88712]">
      {student.totalPoints}
    </div>

    <div className="text-[11px] font-bold text-slate-500">
      Masar Points
    </div>

  </div>

  <div className="rounded-xl bg-[#F5F8FC] px-5 py-3 text-center">

    <div className="text-[22px] font-black text-[#07152E]">
      {student.rewardProgress}/10
    </div>

    <div className="text-[11px] font-bold text-slate-500">
بطاقة المكافآت
    </div>

  </div>
<div className="rounded-xl bg-white border px-5 py-3">

<div className="flex justify-between">

<span>المكتسبة</span>

<span className="font-black">

{student.earnedRewards}

</span>

</div>

<div className="mt-2 flex justify-between">

<span>المستخدمة</span>

<span className="font-black">

{student.redeemedRewards}

</span>

</div>

<div className="mt-2 flex justify-between">

<span>المتاحة</span>

<span className="font-black text-[#0F8A42]">

{student.availableRewards}

</span>

</div>

</div>
  <button
    onClick={onClose}
    className="rounded-xl border px-4 py-2"
  >
    إغلاق
  </button>

</div>


        </div>

        <div className="border-b bg-white">

  <div className="flex overflow-x-auto">

    {tabs.map((tab) => (

      <button
        key={tab.id}
        onClick={() =>
          setActiveTab(tab.id)
        }
        className={`border-b-2 px-6 py-4 text-sm font-black whitespace-nowrap transition ${
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

<div className="p-8">

  <div className="rounded-2xl border bg-white p-8">

    {activeTab === "profile" && (
      <h2 className="text-xl font-black">
        البيانات الأساسية
      </h2>
    )}

    {activeTab === "journeys" && (
  <StudentJourneysPanel
    userId={student.userId}
  />
)}

    {activeTab === "passport" && (
  <>
    {isLoading ? (
      <div className="py-20 text-center font-bold text-slate-500">
        جاري تحميل بيانات الطالب...
      </div>
    ) : loadError ? (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center font-bold text-red-700">
        {loadError}
      </div>
    ) : dashboardData ? (
      <MasarPassportPanel
        data={dashboardData}
      />
    ) : null}
  </>
)}

    {activeTab === "certificates" && (
  <>
    {isLoading ? (
      <div className="py-20 text-center font-bold text-slate-500">
        جاري تحميل الشهادات...
      </div>
    ) : loadError ? (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center font-bold text-red-700">
        {loadError}
      </div>
    ) : dashboardData ? (
      <CertificatesPanel
        certificates={
          dashboardData.certificates
        }
        mode="admin"
      />
    ) : null}
  </>
)}

    {activeTab === "projects" && (
      <h2 className="text-xl font-black">
        المشاريع
      </h2>
    )}

    {activeTab === "surveys" && (
      <h2 className="text-xl font-black">
        الاستبيانات
      </h2>
    )}

    {activeTab === "notifications" && (
      <h2 className="text-xl font-black">
        الإشعارات
      </h2>
    )}

  </div>

</div>

      </div>

    </div>
  );
}