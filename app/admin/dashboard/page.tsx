import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileImage,
  GraduationCap,
  ShieldAlert,
  Star,
  UserRoundX,
  Users,
} from "lucide-react";

import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { getAdminDashboardStats } from "@/lib/queries/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="لوحة التحكم"
        description="نظرة مباشرة على الطلاب والاشتراكات والمهام التي تحتاج مراجعتك."
        actions={
          <Link
            href="/admin/students/enrollment-requests"
            className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-3 text-sm font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
          >
            مراجعة الطلبات
            <ClipboardList className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الطلاب"
          value={stats.students}
          icon={Users}
          tone="navy"
        />

        <StatCard
          title="الكورسات"
          value={stats.courses}
          icon={BookOpen}
          tone="gold"
        />

        <StatCard
          title="الاشتراكات النشطة"
          value={stats.activeEnrollments}
          icon={GraduationCap}
          tone="blue"
        />

        <StatCard
          title="طلبات قيد المراجعة"
          value={stats.pendingRequests}
          icon={ClipboardList}
          tone="amber"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-black text-[#07152E]">
            يحتاج انتباهك
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            الأرقام هنا مأخوذة من نفس مصادر شاشات الإدارة المتخصصة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionCard
            href="/admin/students/enrollment-requests"
            title="طلبات اشتراك"
            value={stats.pendingRequests}
            subtitle="قيد المراجعة"
            icon={ClipboardList}
            tone="amber"
          />

          <AttentionCard
            href="/admin/students/certificates"
            title="شهادات"
            value={stats.pendingCertificates}
            subtitle="مستحقة للإصدار"
            icon={Award}
            tone="blue"
          />

          <AttentionCard
            href="/admin/students/projects"
            title="مشاريع"
            value={stats.pendingProjects}
            subtitle="بانتظار المراجعة"
            icon={FileImage}
            tone="emerald"
          />

          <AttentionCard
            href="/admin/students/surveys"
            title="استبيانات"
            value={stats.surveysReceived}
            subtitle="إجمالي التقييمات المستلمة"
            icon={Star}
            tone="gold"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#07152E]">
              حالة الاشتراكات
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              ملخص مباشر من جدول الاشتراكات الحالي.
            </p>
          </div>

          <Link
            href="/admin/students/enrollment-requests"
            className="text-sm font-black text-[#B87908] hover:underline"
          >
            عرض الكل
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            label="قيد المراجعة"
            value={stats.pendingRequests}
            icon={ShieldAlert}
            className="border-amber-200 bg-amber-50 text-amber-700"
          />

          <StatusCard
            label="نشطة / مقبولة"
            value={stats.approvedRequests}
            icon={CheckCircle2}
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          />

          <StatusCard
            label="مرفوضة"
            value={stats.rejectedRequests}
            icon={UserRoundX}
            className="border-red-200 bg-red-50 text-red-700"
          />

          <StatusCard
            label="موقوفة"
            value={stats.suspendedRequests}
            icon={ShieldAlert}
            className="border-slate-200 bg-slate-50 text-slate-700"
          />
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
  tone:
    | "navy"
    | "gold"
    | "blue"
    | "amber";
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
}: StatCardProps) {
  const tones = {
    navy: "bg-[#07152E] text-white",
    gold: "bg-[#F7B548] text-[#07152E]",
    blue: "border border-blue-100 bg-blue-50 text-blue-700",
    amber:
      "border border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <article
      className={`rounded-3xl p-6 shadow-sm ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-75">
            {title}
          </p>

          <p className="mt-4 text-4xl font-black">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-white/20 p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

function AttentionCard({
  href,
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  href: string;
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  tone:
    | "amber"
    | "blue"
    | "emerald"
    | "gold";
}) {
  const tones = {
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    gold:
      "border-[#F7B548]/40 bg-[#FFF8E8] text-[#9A6711]",
  };

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-6 w-6" />

        <span className="text-3xl font-black">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-black">
        {title}
      </p>

      <p className="mt-1 text-xs font-bold opacity-70">
        {subtitle}
      </p>
    </Link>
  );
}

function StatusCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" />
        <span className="text-2xl font-black">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm font-bold">
        {label}
      </p>
    </div>
  );
}