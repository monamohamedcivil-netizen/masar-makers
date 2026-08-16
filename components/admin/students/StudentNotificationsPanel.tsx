"use client";

import {
  Bell,
  BellRing,
  ExternalLink,
  Loader2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminStudentNotifications,
  type AdminStudentNotification,
} from "@/lib/admin/student-notifications";

type Props = {
  userId: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function StudentNotificationsPanel({
  userId,
}: Props) {
  const [notifications, setNotifications] =
    useState<AdminStudentNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await getAdminStudentNotifications(userId);

      setNotifications(result);
    } catch (loadError) {
      console.error(
        "Failed to load admin student notifications:",
        loadError,
      );

      setNotifications([]);
      setError("تعذر تحميل إشعارات الطالب حاليًا.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.isRead,
      ).length,
    [notifications],
  );

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F7B548]" />

          <p className="mt-3 text-sm font-bold text-slate-500">
            جاري تحميل إشعارات الطالب...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <Bell className="h-10 w-10 text-[#F7B548]" />

        <p className="mt-4 font-black text-[#07152E]">
          لا توجد إشعارات لهذا الطالب.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="إجمالي الإشعارات"
          value={notifications.length}
        />

        <SummaryCard
          label="غير المقروءة"
          value={unreadCount}
        />

        <SummaryCard
          label="المقروءة"
          value={notifications.length - unreadCount}
        />
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={`${notification.id}-${notification.receivedAt}`}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              notification.isRead
                ? "border-slate-200"
                : "border-[#F7B548]/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  notification.isRead
                    ? "bg-slate-100 text-slate-500"
                    : "bg-[#FFF4DF] text-[#C88712]"
                }`}
              >
                {notification.isRead ? (
                  <Bell size={17} />
                ) : (
                  <BellRing size={17} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[#07152E]">
                      {notification.title}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500">
                        {notification.type}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                          notification.isRead
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {notification.isRead
                          ? "مقروء"
                          : "غير مقروء"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDate(
                      notification.receivedAt,
                    )}
                  </span>
                </div>

                {notification.body ? (
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    {notification.body}
                  </p>
                ) : null}

                {notification.actionUrl ? (
                  <div className="mt-3">
                    <a
                      href={notification.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-[#07152E] transition hover:border-[#F7B548]"
                    >
                      <ExternalLink size={12} />
                      فتح الرابط
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-[#07152E]">
        {value}
      </p>
    </div>
  );
}