"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Gift,
  GraduationCap,
  Mail,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import type { EnrollmentSource } from "@/lib/actions/admin/enrollments";

import StatusBadge from "./StatusBadge";
import EnrollmentActionButtons from "./EnrollmentActionButtons";
import EnrollmentSourceSelect from "./EnrollmentSourceSelect";

export interface EnrollmentRequestRow {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  stationTitle: string;
  journeyType: string;
  actionKey: string;
  actionTitle: string;
  enrollmentSource: EnrollmentSource;
  status: string;
  createdAt: string;
}

interface EnrollmentRequestsTableProps {
  requests: EnrollmentRequestRow[];
}

type JourneyTab =
  | "professional"
  | "one_day"
  | "free";

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف متكاملة",
  career: "رحلة احتراف متكاملة",
  professional: "رحلة احتراف متكاملة",
  workshop: "رحلة اليوم الواحد",
  one_day: "رحلة اليوم الواحد",
  one_day_journey: "رحلة اليوم الواحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
  free_journey: "رحلة مجانية",
};

const tabs: Array<{
  key: JourneyTab;
  label: string;
  icon: typeof GraduationCap;
}> = [
  {
    key: "professional",
    label: "رحلات الاحتراف",
    icon: GraduationCap,
  },
  {
    key: "one_day",
    label: "رحلات اليوم الواحد",
    icon: Sparkles,
  },
  {
    key: "free",
    label: "الرحلات المجانية",
    icon: Gift,
  },
];

function getJourneyTab(
  journeyType: string,
): JourneyTab {
  const normalizedType =
    journeyType
      .trim()
      .toLowerCase();

  if (
    normalizedType === "workshop" ||
    normalizedType === "one_day" ||
    normalizedType ===
      "one_day_journey"
  ) {
    return "one_day";
  }

  if (
    normalizedType === "free" ||
    normalizedType ===
      "free_session" ||
    normalizedType ===
      "free_journey"
  ) {
    return "free";
  }

  return "professional";
}

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(parsedDate);
}

export default function EnrollmentRequestsTable({
  requests,
}: EnrollmentRequestsTableProps) {
  const [activeTab, setActiveTab] =
    useState<JourneyTab>(
      "professional",
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const tabCounts = useMemo(() => {
    return requests.reduce<
      Record<JourneyTab, number>
    >(
      (counts, request) => {
        counts[
          getJourneyTab(
            request.journeyType,
          )
        ] += 1;

        return counts;
      },
      {
        professional: 0,
        one_day: 0,
        free: 0,
      },
    );
  }, [requests]);

  const pendingTabCounts = useMemo(() => {
    return requests.reduce<
      Record<JourneyTab, number>
    >(
      (counts, request) => {
        if (
          request.status
            .trim()
            .toLowerCase() !== "pending"
        ) {
          return counts;
        }

        counts[
          getJourneyTab(
            request.journeyType,
          )
        ] += 1;

        return counts;
      },
      {
        professional: 0,
        one_day: 0,
        free: 0,
      },
    );
  }, [requests]);

  const filteredRequests =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const matchesJourney =
            getJourneyTab(
              request.journeyType,
            ) === activeTab;

          const matchesStatus =
            statusFilter === "all" ||
            request.status.toLowerCase() ===
              statusFilter;

          const searchableText = [
            request.studentName,
            request.studentEmail,
            request.studentPhone,
            request.courseTitle,
            request.stationTitle,
            request.actionTitle,
            request.actionKey,
            request.journeyType,
            request.enrollmentSource,
          ]
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(
              normalizedSearch,
            );

          return (
            matchesJourney &&
            matchesStatus &&
            matchesSearch
          );
        },
      );
    }, [
      activeTab,
      requests,
      searchTerm,
      statusFilter,
    ]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 p-3">
        <div className="grid gap-2 md:grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);

                  setStatusFilter(
                    pendingTabCounts[
                      tab.key
                    ] > 0
                      ? "pending"
                      : "all",
                  );
                }}
                className={`flex min-h-14 items-center justify-between rounded-xl border px-4 py-3 text-right transition ${
                  isActive
                    ? "border-[#F7B548] bg-[#07152E] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#F7B548]/60 hover:bg-amber-50/40"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-[#F7B548] text-[#07152E]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>

                  <span className="text-sm font-black">
                    {tab.label}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  {pendingTabCounts[
                    tab.key
                  ] > 0 ? (
                    <span
                      className={[
                        "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[10px] font-black",
                        isActive
                          ? "bg-red-500 text-white"
                          : "bg-red-50 text-red-700 ring-1 ring-red-200",
                      ].join(" ")}
                      title="طلبات جديدة قيد المراجعة"
                    >
                      {
                        pendingTabCounts[
                          tab.key
                        ]
                      }{" "}
                      جديد
                    </span>
                  ) : null}

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      isActive
                        ? "bg-white/10 text-[#F7B548]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    title="إجمالي الطلبات"
                  >
                    {tabCounts[tab.key]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="ابحث باسم الطالب أو البريد أو الكورس..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#07152E] outline-none focus:border-[#F7B548]"
        >
          <option value="all">
            جميع الحالات
          </option>

          <option value="pending">
            قيد المراجعة
          </option>

          <option value="approved">
            مقبول
          </option>

          <option value="active">
            نشط
          </option>

          <option value="rejected">
            مرفوض
          </option>

          <option value="suspended">
            موقوف
          </option>

          <option value="expired">
            منتهي
          </option>
        </select>
      </div>

      {filteredRequests.length ===
      0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-7 w-7 text-slate-400" />
          </div>

          <h2 className="text-lg font-black text-[#07152E]">
            لا توجد طلبات
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            لا توجد طلبات اشتراك مطابقة للتبويب وخيارات البحث الحالية.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] text-right">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الطالب
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الكورس
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  العنصر
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  نوع الرحلة
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  نوع الاشتراك
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  تاريخ الطلب
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الحالة
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map(
                (request) => (
                  <tr
                    key={request.id}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07152E] font-bold text-[#F7B548]">
                          {request.studentName
                            .trim()
                            .charAt(0) ||
                            "ط"}
                        </div>

                        <div>
                          <p className="font-bold text-[#07152E]">
                            {request.studentName ||
                              "طالب بدون اسم"}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5" />

                            {request.studentEmail ||
                              "—"}
                          </p>

                          {request.studentPhone ? (
                            <p className="mt-1 text-xs text-slate-400">
                              {
                                request.studentPhone
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-[#07152E]">
                        {request.courseTitle ||
                          "—"}
                      </p>

                      {request.stationTitle ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {
                            request.stationTitle
                          }
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-[#07152E]">
                        {request.actionTitle ||
                          request.courseTitle ||
                          "—"}
                      </p>

                      {request.actionKey ? (
                        <p
                          className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-slate-400"
                          title={
                            request.actionKey
                          }
                        >
                          {
                            request.actionKey
                          }
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {journeyLabels[
                        request.journeyType.toLowerCase()
                      ] ??
                        request.journeyType ??
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <EnrollmentSourceSelect
                        enrollmentId={
                          request.id
                        }
                        journeyType={
                          request.journeyType
                        }
                        status={
                          request.status
                        }
                        initialSource={
                          request.enrollmentSource
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays className="h-4 w-4 text-slate-400" />

                        {formatDate(
                          request.createdAt,
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          request.status
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <EnrollmentActionButtons
                        enrollmentId={
                          request.id
                        }
                        status={
                          request.status
                        }
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
        عدد النتائج في التبويب الحالي:{" "}
        {filteredRequests.length}
      </div>
    </section>
  );
}