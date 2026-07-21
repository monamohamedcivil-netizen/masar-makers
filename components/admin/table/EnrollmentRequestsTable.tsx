"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Mail,
  Search,
  UserRound,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import EnrollmentActionButtons from "./EnrollmentActionButtons";

export interface EnrollmentRequestRow {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  stationTitle: string;
  journeyType: string;
  status: string;
  createdAt: string;
}

interface EnrollmentRequestsTableProps {
  requests: EnrollmentRequestRow[];
}

const journeyLabels: Record<string, string> = {
  career_path: "رحلة احتراف متكاملة",
  career: "رحلة احتراف متكاملة",
  workshop: "رحلة اليوم الواحد",
  one_day: "رحلة اليوم الواحد",
  free: "رحلة مجانية",
  free_session: "رحلة مجانية",
};

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

export default function EnrollmentRequestsTable({
  requests,
}: EnrollmentRequestsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" ||
        request.status.toLowerCase() === statusFilter;

      const searchableText = [
        request.studentName,
        request.studentEmail,
        request.studentPhone,
        request.courseTitle,
        request.stationTitle,
        request.journeyType,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="ابحث باسم الطالب أو البريد أو الكورس..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F7B548] focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#07152E] outline-none focus:border-[#F7B548]"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">مقبول</option>
          <option value="rejected">مرفوض</option>
          <option value="suspended">موقوف</option>
          <option value="expired">منتهي</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-7 w-7 text-slate-400" />
          </div>

          <h2 className="text-lg font-black text-[#07152E]">
            لا توجد طلبات
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            لا توجد طلبات اشتراك مطابقة لخيارات البحث الحالية.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الطالب
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الكورس
                </th>

                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  الرحلة
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
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#07152E] font-bold text-[#F7B548]">
                        {request.studentName
                          .trim()
                          .charAt(0) || "ط"}
                      </div>

                      <div>
                        <p className="font-bold text-[#07152E]">
                          {request.studentName ||
                            "طالب بدون اسم"}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5" />
                          {request.studentEmail || "—"}
                        </p>

                        {request.studentPhone && (
                          <p className="mt-1 text-xs text-slate-400">
                            {request.studentPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-bold text-[#07152E]">
                      {request.courseTitle || "—"}
                    </p>

                    {request.stationTitle && (
                      <p className="mt-1 text-xs text-slate-500">
                        {request.stationTitle}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {journeyLabels[
                      request.journeyType.toLowerCase()
                    ] ??
                      request.journeyType ??
                      "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      {formatDate(request.createdAt)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={request.status} />
                  </td>

                  <td className="px-5 py-4">
                    <EnrollmentActionButtons
                      enrollmentId={request.id}
                      status={request.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500">
        عدد النتائج: {filteredRequests.length}
      </div>
    </section>
  );
}