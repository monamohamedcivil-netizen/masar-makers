"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addStudentBonusPoints,
  getStudentBonusPointsHistory,
  type StudentBonusPointHistoryItem,
} from "@/lib/actions/admin/students";
import {
  Award,
  BookOpenCheck,
  Eye,
  ExternalLink,
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

bonusPoints: number;
lastBonusReason: string | null;

drawEntries: number;
drawWins: number;
availableDrawEntries: number;
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
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const [floatingHeader, setFloatingHeader] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const updateFloatingHeader = () => {
      const wrap = tableWrapRef.current;
      const header = headerRef.current;
      if (!wrap || !header) return;

      const wrapRect = wrap.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const topOffset = 98;
      const shouldFloat =
        headerRect.top < topOffset &&
        wrapRect.bottom > topOffset + header.offsetHeight;

      setFloatingHeader(
        shouldFloat
          ? {
              position: "fixed",
              top: topOffset,
              left: wrapRect.left,
              width: wrapRect.width,
              zIndex: 40,
            }
          : null,
      );
    };

    window.addEventListener("scroll", updateFloatingHeader, { passive: true });
    window.addEventListener("resize", updateFloatingHeader);
    updateFloatingHeader();

    return () => {
      window.removeEventListener("scroll", updateFloatingHeader);
      window.removeEventListener("resize", updateFloatingHeader);
    };
  }, []);

  const basicColGroup = (
    <colgroup>
      <col className="w-[23%]" />
      <col className="w-[15%]" />
      <col className="w-[10%]" />
      <col className="w-[7%]" />
      <col className="w-[8%]" />
      <col className="w-[6%]" />
      <col className="w-[7%]" />
      <col className="w-[6%]" />
      <col className="w-[18%]" />
    </colgroup>
  );

  const basicHeaderRow = (
    <tr>
      <TableHead>الطالب</TableHead>
      <TableHead>الهاتف</TableHead>
      <TableHead>الدولة</TableHead>
      <TableHead>الاحترافية</TableHead>
      <TableHead>إجمالي الاشتراكات</TableHead>
      <TableHead>النشط</TableHead>
      <TableHead>قيد المراجعة</TableHead>
      <TableHead>الحالة</TableHead>
      <TableHead>عرض</TableHead>
    </tr>
  );

  return (
    <>
      {floatingHeader && (
        <div
          style={floatingHeader}
          className="pointer-events-none overflow-hidden border-b border-slate-200 bg-slate-50 shadow-sm"
        >
          <table className="w-full table-fixed">
            {basicColGroup}
            <thead className="bg-slate-50">{basicHeaderRow}</thead>
          </table>
        </div>
      )}

      <div
        ref={tableWrapRef}
        className="w-full overflow-x-auto lg:overflow-x-hidden"
      >
        <table className="w-full min-w-[980px] table-fixed lg:min-w-0">
          {basicColGroup}
          <thead ref={headerRef} className="bg-slate-50">
            {basicHeaderRow}
          </thead>
          <tbody>
          {students.map((student) => (
            <tr
              key={student.userId}
              className="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <td className="px-3 py-4">
                <StudentIdentity
                  student={student}
                  expanded
                />
              </td>

              <td className="whitespace-nowrap px-2 py-3 text-center text-xs">
                {student.studentPhone ? (
                  <span
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-slate-600"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    {student.studentPhone}
                  </span>
                ) : (
                  <EmptyValue />
                )}
              </td>

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
                value={student.professionalEnrollments}
              />

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

              <StudentActionsCell
                userId={student.userId}
              />
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}

function StudentJourneyTable({
  students,
}: {
  students: StudentRow[];
}) {
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const floatingHeaderScrollRef = useRef<HTMLDivElement>(null);
  const floatingBottomScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const [floatingChrome, setFloatingChrome] = useState<{
    left: number;
    width: number;
    tableWidth: number;
    columnWidths: number[];
    showHeader: boolean;
    showBottomScroll: boolean;
  } | null>(null);

 const syncAllFrom = (source: HTMLDivElement) => {
  if (syncingRef.current) return;

  syncingRef.current = true;
  const x = source.scrollLeft;

  const wrap = tableWrapRef.current;

  if (wrap && source !== wrap) {
    wrap.scrollLeft = x;
  }

  if (
    floatingHeaderScrollRef.current &&
    source !== floatingHeaderScrollRef.current
  ) {
    floatingHeaderScrollRef.current.scrollLeft = x;
  }

  if (
    floatingBottomScrollRef.current &&
    source !== floatingBottomScrollRef.current
  ) {
    floatingBottomScrollRef.current.scrollLeft = x;
  }

  requestAnimationFrame(() => {
    syncingRef.current = false;
  });
};

useEffect(() => {
  const wrap = tableWrapRef.current;
  const table = tableRef.current;
  const header = headerRef.current;

  if (!wrap || !table || !header) return;

  const onWrapScroll = () => syncAllFrom(wrap);

  const onHeaderScroll = () => {
    if (floatingHeaderScrollRef.current) {
      syncAllFrom(floatingHeaderScrollRef.current);
    }
  };

  const onBottomScroll = () => {
    if (floatingBottomScrollRef.current) {
      syncAllFrom(floatingBottomScrollRef.current);
    }
  };

    const updateChrome = () => {
      const rect = wrap.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const topOffset = 98;
      const viewportHeight = window.innerHeight;
      const visible = rect.top < viewportHeight && rect.bottom > topOffset;
      const showHeader =
        visible &&
        headerRect.top < topOffset &&
        rect.bottom > topOffset + header.offsetHeight;
      const showBottomScroll =
        visible &&
        rect.bottom > viewportHeight;

      const columnWidths = Array.from(
        header.querySelectorAll("th"),
      ).map((cell) => cell.getBoundingClientRect().width);

      setFloatingChrome({
        left: Math.max(0, rect.left),
        width: Math.max(
          0,
          Math.min(rect.right, window.innerWidth) -
            Math.max(0, rect.left),
        ),
        tableWidth: table.scrollWidth,
        columnWidths,
        showHeader,
        showBottomScroll,
      });

      requestAnimationFrame(() => {
        if (floatingHeaderScrollRef.current) {
          floatingHeaderScrollRef.current.scrollLeft = wrap.scrollLeft;
        }
        if (floatingBottomScrollRef.current) {
          floatingBottomScrollRef.current.scrollLeft = wrap.scrollLeft;
        }
      });
    };

    wrap.addEventListener("scroll", onWrapScroll, { passive: true });
    window.addEventListener("scroll", updateChrome, { passive: true });
    window.addEventListener("resize", updateChrome);

    const resizeObserver = new ResizeObserver(updateChrome);
    resizeObserver.observe(wrap);
    resizeObserver.observe(table);

    updateChrome();

    return () => {
      wrap.removeEventListener("scroll", onWrapScroll);
      window.removeEventListener("scroll", updateChrome);
      window.removeEventListener("resize", updateChrome);
      resizeObserver.disconnect();
    };
  }, []);

  const journeyHeaderRow = (
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
            <TableHead>إضافة نقاط</TableHead>
<TableHead>سبب النقاط</TableHead>
            <TableHead>إجمالي فرص السحب</TableHead>
            <TableHead>مرات الفوز</TableHead>
            <TableHead>الفرص المتبقية</TableHead>
            <TableHead>بطاقة المكافأة</TableHead>

<TableHead>المكتسبة</TableHead>

<TableHead>المصروفة</TableHead>

<TableHead>المتاحة</TableHead>

<TableHead>آخر رحلة مجانية</TableHead>

<TableHead>منح رحلة</TableHead>

<TableHead>عرض</TableHead>
          </tr>
  );

  return (
    <>
      {floatingChrome?.showHeader && (
        <div
          ref={floatingHeaderScrollRef}
          dir="ltr"
          onScroll={(event) => syncAllFrom(event.currentTarget)}
          className="fixed top-[98px] z-40 overflow-x-hidden border-b border-slate-200 bg-slate-50 shadow-sm"
          style={{
            left: floatingChrome.left,
            width: floatingChrome.width,
          }}
        >
          <table
            dir="rtl"
            className="table-fixed"
            style={{
              width: `${floatingChrome.tableWidth}px`,
              minWidth: `${floatingChrome.tableWidth}px`,
            }}
          >
            <colgroup>
              {floatingChrome.columnWidths.map((width, index) => (
                <col
                  key={index}
                  style={{ width: `${width}px` }}
                />
              ))}
            </colgroup>
            <thead className="bg-slate-50">{journeyHeaderRow}</thead>
          </table>
        </div>
      )}

      <div
        ref={tableWrapRef}
        dir="ltr"
        className="w-full overflow-x-auto"
      >
        <table
          ref={tableRef}
          dir="rtl"
          className="w-full min-w-[1750px]"
        >
          <thead ref={headerRef} className="bg-slate-50">
            {journeyHeaderRow}
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
<BonusPointsCells
  student={student}
/>
              <MetricCell
                value={student.drawEntries}
              />

              <MetricCell
                value={student.drawWins}
              />

              <MetricCell
                value={
                  student.availableDrawEntries
                }
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

      {floatingChrome?.showBottomScroll && (
        <div
          ref={floatingBottomScrollRef}
          dir="ltr"
          onScroll={(event) => syncAllFrom(event.currentTarget)}
          className="fixed bottom-0 z-50 h-5 overflow-x-auto overflow-y-hidden border-t border-slate-300 bg-white shadow-[0_-2px_8px_rgba(15,23,42,0.12)]"
          style={{
            left: floatingChrome.left,
            width: floatingChrome.width,
          }}
          aria-label="شريط تمرير أفقي ثابت لجدول رحلة الطالب"
        >
          <div
            className="h-px shrink-0"
            style={{
              width: `${floatingChrome.tableWidth}px`,
              minWidth: `${floatingChrome.tableWidth}px`,
            }}
          />
        </div>
      )}
    </>
  );
}

function StudentIdentity({
  student,
  expanded = false,
}: {
  student: StudentRow;
  expanded?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#07152E] text-base font-black text-[#F7B548]">
        {student.studentName
          .trim()
          .charAt(0) || "؟"}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`font-black text-[#07152E] ${
            expanded
              ? "whitespace-normal break-words leading-5"
              : "max-w-[170px] truncate"
          }`}
        >
          {student.studentName}
        </div>

        <div
          className={`mt-1 flex items-center gap-1 text-xs font-bold text-slate-500 ${
            expanded
              ? "max-w-full"
              : "max-w-[185px] truncate"
          }`}
        >
          <Mail className="h-3 w-3 shrink-0" />
          <span className={expanded ? "break-all" : "truncate"}>
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
    <th className="whitespace-nowrap px-2 py-3 text-center text-[11px] font-black text-[#07152E]">
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
    <td className="whitespace-nowrap px-2 py-3 text-center text-xs">
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

function StudentActionsCell({
  userId,
}: {
  userId: string;
}) {
  return (
    <td className="px-2 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <Link
          href={`/admin/students/${userId}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#07152E] px-2 py-2 text-[10px] font-black text-white transition hover:bg-[#0B2146]"
        >
          <Eye size={13} />
          عرض
        </Link>

        <Link
          href={`/admin/students/${userId}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-[#F7B548] bg-[#FFF8E9] px-2 py-2 text-[10px] font-black text-[#07152E] transition hover:bg-[#F7B548]"
          title="فتح رحلاتي التعليمية كما يراها الطالب"
        >
          <ExternalLink size={13} />
          صفحة الطالب
        </Link>
      </div>
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
function BonusPointsCells({
  student,
}: {
  student: StudentRow;
}) {
  const router = useRouter();

  const [points, setPoints] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [pointType, setPointType] =
    useState<
      "referral" | "bonus" | "adjustment"
    >("bonus");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");
const [historyOpen, setHistoryOpen] =
  useState(false);

const [historyLoading, setHistoryLoading] =
  useState(false);

const [historyItems, setHistoryItems] =
  useState<StudentBonusPointHistoryItem[]>([]);

const [historyError, setHistoryError] =
  useState("");
  async function handleSave() {
    const numericPoints =
      Number(points);

    if (
      !Number.isFinite(numericPoints) ||
      numericPoints === 0
    ) {
      setMessage(
        "أدخلي عدد نقاط صحيح.",
      );
      return;
    }

    if (!reason.trim()) {
      setMessage(
        "أدخلي سبب النقاط.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const result =
      await addStudentBonusPoints(
        student.userId,
        numericPoints,
        reason,
        pointType,
      );

    setSaving(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setPoints("");
    setReason("");
    setPointType("bonus");
    setMessage("تم الحفظ");

    router.refresh();
  }
async function handleOpenHistory() {
  setHistoryOpen(true);
  setHistoryLoading(true);
  setHistoryError("");

  const result =
    await getStudentBonusPointsHistory(
      student.userId,
    );

  setHistoryLoading(false);

  if (!result.success) {
    setHistoryItems([]);
    setHistoryError(
      result.message ??
        "تعذر تحميل السجل.",
    );
    return;
  }

  setHistoryItems(result.items);
}
  return (
    <>
      <td className="min-w-[190px] px-3 py-4 text-center">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-[#FFF5DD] px-3 py-1 text-[10px] font-black text-[#C88712]">
            الإجمالي:{" "}
            {student.bonusPoints}
          </span>

          <select
            value={pointType}
            onChange={(event) =>
              setPointType(
                event.target.value as
                  | "referral"
                  | "bonus"
                  | "adjustment",
              )
            }
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-[10px] font-black text-[#07152E] outline-none focus:border-[#F7B548]"
          >
            <option value="bonus">
              نقاط إضافية
            </option>
            <option value="referral">
              دعوة صديق
            </option>
            <option value="adjustment">
              تصحيح نقاط
            </option>
          </select>

          <input
            type="number"
            value={points}
            onChange={(event) =>
              setPoints(
                event.target.value,
              )
            }
            placeholder="+50"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-center text-xs font-black outline-none focus:border-[#F7B548]"
          />
        </div>
      </td>

      <td className="min-w-[300px] px-3 py-4">
        <div className="space-y-2">
          <input
            type="text"
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value,
              )
            }
            placeholder="مثال: دعوة صديق للاشتراك في CSD"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#F7B548]"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
  <span className="max-w-[150px] truncate text-[9px] font-bold text-slate-400">
    {student.lastBonusReason
      ? `آخر إضافة: ${student.lastBonusReason}`
      : "لا توجد إضافات سابقة"}
  </span>

  {student.bonusPoints !== 0 ? (
    <button
      type="button"
      onClick={() =>
        void handleOpenHistory()
      }
      className="shrink-0 text-[9px] font-black text-[#C88712] underline underline-offset-2"
    >
      عرض السجل
    </button>
  ) : null}
</div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleSave()
              }
              className="h-8 shrink-0 rounded-lg bg-[#07152E] px-3 text-[10px] font-black text-white disabled:opacity-50"
            >
              {saving
                ? "..."
                : "حفظ"}
            </button>
          </div>

          {message ? (
            <p className="text-[9px] font-black text-[#C88712]">
              {message}
            </p>
          ) : null}
        </div>
      </td>
      {historyOpen ? (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07152E]/55 p-4"
    onClick={() =>
      setHistoryOpen(false)
    }
  >
    <div
      dir="rtl"
      onClick={(event) =>
        event.stopPropagation()
      }
      className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between bg-[#07152E] px-5 py-4">
        <div>
          <h3 className="text-base font-black text-white">
            سجل النقاط الإضافية
          </h3>

          <p className="mt-1 text-xs font-bold text-white/60">
            {student.studentName}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setHistoryOpen(false)
          }
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg font-black text-white hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div className="border-b border-slate-100 bg-[#FFF8E9] px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500">
            إجمالي النقاط الإضافية
          </span>

          <span className="text-lg font-black text-[#C88712]">
            {student.bonusPoints}
          </span>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-4">
        {historyLoading ? (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            جاري تحميل السجل...
          </div>
        ) : historyError ? (
          <div className="py-10 text-center text-sm font-bold text-red-500">
            {historyError}
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            لا توجد نقاط إضافية مسجلة.
          </div>
        ) : (
          <div className="space-y-2">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div
                  className={`min-w-[70px] text-center text-base font-black ${
                    item.points >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {item.points > 0
                    ? `+${item.points}`
                    : item.points}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${
                      item.pointType === "referral"
                        ? "bg-blue-50 text-blue-700"
                        : item.pointType === "adjustment"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-[#FFF5DD] text-[#C88712]"
                    }`}
                  >
                    {item.pointType === "referral"
                      ? "دعوة صديق"
                      : item.pointType === "adjustment"
                        ? "تصحيح نقاط"
                        : "نقاط إضافية"}
                  </span>

                  <p className="text-xs font-black text-[#07152E]">
                    {item.reason}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    {item.createdAt
                      ? new Intl.DateTimeFormat(
                          "ar-SA",
                          {
                            dateStyle:
                              "medium",
                            timeStyle:
                              "short",
                          },
                        ).format(
                          new Date(
                            item.createdAt,
                          ),
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
) : null}
    </>
  );
}
function EmptyValue() {
  return (
    <span className="font-bold text-slate-300">
      —
    </span>
  );
}