"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Award,
  BookOpenCheck,
  Eye,
  FileImage,
  Gift,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  UserRound,
} from "lucide-react";

export interface StudentRow {
  userId: string;

  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  studentCountry: string | null;

  professionalEnrollments: number;
  oneDayEnrollments: number;
  freeEnrollments: number;

  totalEnrollments: number;
  approvedEnrollments: number;
  pendingEnrollments: number;

  completedCourses: number;

  certificatesCount: number;
  projectsCount: number;
  surveysCount: number;

  rewardCourses: number;
  earnedRewards: number;

redeemedRewards: number;

availableRewards: number;

rewardBalance: number;

rewardProgress: number;

lastRewardCourseId: string | null;

lastRewardCourseTitle: string | null;

lastRewardRedeemedAt: string | null;
  totalPoints: number;
  drawEntries: number;
}

interface StudentsTableProps {
  students: StudentRow[];
}

type TabId = "basic" | "journey";

export default function StudentsTable({
  students,
}: StudentsTableProps) {
  const [activeTab, setActiveTab] =
    useState<TabId>("basic");

  const [searchTerm, setSearchTerm] =
    useState("");

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    if (!search) {
      return students;
    }

    return students.filter((student) =>
      [
        student.studentName,
        student.studentEmail,
        student.studentPhone,
        student.studentCountry,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [students, searchTerm]);

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-white px-4 pt-4 sm:px-6">
        <div className="flex overflow-x-auto">
          <TabButton
            active={activeTab === "basic"}
            label="البيانات الأساسية"
            onClick={() =>
              setActiveTab("basic")
            }
          />

          <TabButton
            active={activeTab === "journey"}
            label="رحلة الطالب"
            onClick={() =>
              setActiveTab("journey")
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="ابحث باسم الطالب أو البريد أو الهاتف..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 text-sm outline-none transition focus:border-[#F7B548] focus:ring-2 focus:ring-[#F7B548]/20"
          />
        </div>

        <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#07152E]">
          {filteredStudents.length} طالب
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="flex min-h-[350px] items-center justify-center p-6">
          <div className="text-center">
            <UserRound className="mx-auto mb-4 h-12 w-12 text-slate-300" />

            <p className="font-black text-[#07152E]">
              لا توجد نتائج
            </p>

            <p className="mt-2 text-sm font-bold text-slate-400">
              جرّبي البحث باسم أو بريد مختلف.
            </p>
          </div>
        </div>
      ) : activeTab === "basic" ? (
        <BasicStudentsTable
          students={filteredStudents}
        />
      ) : (
        <StudentJourneyTable
          students={filteredStudents}
        />
      )}
    </section>
  );
}

function BasicStudentsTable({
  students,
}: {
  students: StudentRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px]">
        <thead className="bg-slate-50">
          <tr>
            <TableHead>الطالب</TableHead>
            <TableHead>الهاتف</TableHead>
            <TableHead>الدولة</TableHead>
            <TableHead>إجمالي الاشتراكات</TableHead>
            <TableHead>النشط</TableHead>
            <TableHead>قيد المراجعة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>عرض</TableHead>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.userId}
              className="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <td className="px-4 py-4">
                <StudentIdentity
                  student={student}
                />
              </td>

              <TableCell>
                {student.studentPhone ? (
                  <span className="inline-flex items-center gap-2 font-bold text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {student.studentPhone}
                  </span>
                ) : (
                  <EmptyValue />
                )}
              </TableCell>

              <TableCell>
                {student.studentCountry ? (
                  <span className="inline-flex items-center gap-2 font-bold text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {student.studentCountry}
                  </span>
                ) : (
                  <EmptyValue />
                )}
              </TableCell>

              <MetricCell
                value={student.totalEnrollments}
              />

              <MetricCell
                value={student.approvedEnrollments}
              />

              <MetricCell
                value={student.pendingEnrollments}
              />

              <TableCell>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  نشط
                </span>
              </TableCell>

              <ViewStudentCell
                userId={student.userId}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentJourneyTable({
  students,
}: {
  students: StudentRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1750px]">
        <thead className="bg-slate-50">
          <tr>
            <TableHead>الطالب</TableHead>
            <TableHead>احتراف</TableHead>
            <TableHead>يوم واحد</TableHead>
            <TableHead>مجانية</TableHead>
            <TableHead>مكتملة</TableHead>
            <TableHead>الشهادات</TableHead>
            <TableHead>المشاريع</TableHead>
            <TableHead>الاستبيانات</TableHead>
            <TableHead>النقاط</TableHead>
            <TableHead>السحب</TableHead>
            <TableHead>بطاقة المكافأة</TableHead>

<TableHead>المكتسبة</TableHead>

<TableHead>المصروفة</TableHead>

<TableHead>المتاحة</TableHead>

<TableHead>آخر رحلة مجانية</TableHead>

<TableHead>منح رحلة</TableHead>

<TableHead>عرض</TableHead>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr
              key={student.userId}
              className="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <td className="px-4 py-4">
                <StudentIdentity
                  student={student}
                />
              </td>

              <IconMetricCell
                icon={GraduationCap}
                value={
                  student.professionalEnrollments
                }
              />

              <IconMetricCell
                icon={BookOpenCheck}
                value={
                  student.oneDayEnrollments
                }
              />

              <IconMetricCell
                icon={Star}
                value={student.freeEnrollments}
              />

              <MetricCell
                value={student.completedCourses}
              />

              <IconMetricCell
                icon={Award}
                value={student.certificatesCount}
              />

              <IconMetricCell
                icon={FileImage}
                value={student.projectsCount}
              />

              <MetricCell
                value={student.surveysCount}
              />

              <td className="px-4 py-4 text-center">
                <span className="inline-flex min-w-[76px] items-center justify-center rounded-xl bg-[#FFF5DD] px-3 py-2 text-sm font-black text-[#C88712]">
                  {student.totalPoints}
                </span>
              </td>

              <MetricCell
                value={student.drawEntries}
              />

              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F7B548]/40 bg-[#FFF8E9] px-3 py-1.5 text-xs font-black text-[#07152E]">
                  <Gift className="h-4 w-4 text-[#C88712]" />
                  {student.rewardProgress}/10
                </span>
              </td>

              <td className="px-4 py-4 text-center">
  <span className="font-black text-[#07152E]">
    {student.earnedRewards}
  </span>
</td>
<td className="px-4 py-4 text-center">
  <span className="font-black text-[#07152E]">
    {student.redeemedRewards}
  </span>
</td>
<td className="px-4 py-4 text-center">
  <span
    className={`rounded-full px-3 py-1 text-xs font-black ${
      student.availableRewards > 0
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-500"
    }`}
  >
    {student.availableRewards}
  </span>
</td>
<td className="px-4 py-4 text-center">
  <span className="text-xs font-bold text-slate-600">
    {student.lastRewardCourseTitle ?? "—"}
  </span>
</td>
<td className="px-4 py-4 text-center">
  <button
    disabled={student.availableRewards === 0}
    className={`rounded-xl px-3 py-2 text-xs font-black ${
      student.availableRewards > 0
        ? "bg-[#F7B548] text-[#07152E]"
        : "cursor-not-allowed bg-slate-200 text-slate-400"
    }`}
  >
    🎁 منح رحلة
  </button>
</td>
              <ViewStudentCell
                userId={student.userId}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentIdentity({
  student,
}: {
  student: StudentRow;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-base font-black text-[#F7B548]">
        {student.studentName
          .trim()
          .charAt(0) || "؟"}
      </div>

      <div className="min-w-0">
        <div className="max-w-[250px] truncate font-black text-[#07152E]">
          {student.studentName}
        </div>

        <div className="mt-1 flex max-w-[270px] items-center gap-1 truncate text-xs font-bold text-slate-500">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {student.studentEmail || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-6 py-4 text-sm font-black transition ${
        active
          ? "border-[#F7B548] text-[#07152E]"
          : "border-transparent text-slate-500 hover:text-[#07152E]"
      }`}
    >
      {label}
    </button>
  );
}

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-black text-[#07152E]">
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
    <td className="whitespace-nowrap px-4 py-4 text-center text-sm">
      {children}
    </td>
  );
}

function MetricCell({
  value,
}: {
  value: number;
}) {
  return (
    <td className="px-4 py-4 text-center">
      <span className="font-black text-[#07152E]">
        {value}
      </span>
    </td>
  );
}

function IconMetricCell({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  value: number;
}) {
  return (
    <td className="px-4 py-4 text-center">
      <span className="inline-flex items-center gap-2 font-black text-[#07152E]">
        <Icon className="h-4 w-4 text-[#C88712]" />
        {value}
      </span>
    </td>
  );
}

function ViewStudentCell({
  userId,
}: {
  userId: string;
}) {
  return (
    <td className="px-4 py-4 text-center">
      <Link
        href={`/admin/students/${userId}`}
        className="inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0B2146]"
      >
        <Eye size={15} />
        عرض
      </Link>
    </td>
  );
}

function EmptyValue() {
  return (
    <span className="font-bold text-slate-300">
      —
    </span>
  );
}