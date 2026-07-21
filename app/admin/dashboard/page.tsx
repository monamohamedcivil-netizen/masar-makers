import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  ShieldAlert,
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
        description="نظرة سريعة على أداء منصة Masar Makers وإدارة أهم العمليات."
        actions={
          <Link
            href="/admin/students/enrollment-requests"
            className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-3 text-sm font-black text-white transition hover:bg-[#F7B548] hover:text-[#07152E]"
          >
            مراجعة الطلبات
            <ArrowLeft className="h-4 w-4" />
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
          title="الرحلات التعليمية"
          value={stats.journeys}
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

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#07152E]">
                حالة طلبات الاشتراك
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                ملخص مباشر للطلبات المسجلة على المنصة.
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
              label="مقبولة"
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
        </div>

        <div className="rounded-3xl bg-[#07152E] p-6 text-white shadow-sm">
          <p className="text-sm font-bold text-[#F7B548]">وصول سريع</p>
          <h2 className="mt-2 text-xl font-black">إدارة المحتوى التعليمي</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            انتقلي مباشرة إلى المسارات أو الكورسات لإضافة المحتوى وتحديثه.
          </p>

          <div className="mt-6 space-y-3">
            <QuickLink
              href="/admin/learning/career-paths"
              label="إدارة المسارات المهنية"
            />
            <QuickLink
              href="/admin/learning/courses"
              label="إدارة الكورسات"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "navy" | "gold" | "blue" | "amber";
}

function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  const tones = {
    navy: "bg-[#07152E] text-white",
    gold: "bg-[#F7B548] text-[#07152E]",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
  };

  return (
    <article className={`rounded-3xl p-6 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-75">{title}</p>
          <p className="mt-4 text-4xl font-black">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
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
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" />
        <span className="text-2xl font-black">{value}</span>
      </div>
      <p className="mt-3 text-sm font-bold">{label}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold transition hover:border-[#F7B548]/50 hover:bg-white/10"
    >
      {label}
      <ArrowLeft className="h-4 w-4 text-[#F7B548]" />
    </Link>
  );
}
