"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Check,
  Gift,
  Megaphone,
  PlayCircle,
  Rocket,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";

const labels = {
  ar: {
    center: "مركز الإشعارات",
    notifications: "الإشعارات",
    close: "إغلاق",
    markAll: "تحديد الكل كمقروء",
    actionError: "تعذر تنفيذ الإجراء",
    empty: "لا توجد إشعارات جديدة",
    loadError: "تعذر تحميل الإشعارات حاليًا.",
    updateError: "تعذر تحديث الإشعارات.",
  },
  en: {
    center: "Notification Center",
    notifications: "Notifications",
    close: "Close",
    markAll: "Mark all as read",
    actionError: "Unable to complete the action",
    empty: "No new notifications",
    loadError: "Unable to load notifications right now.",
    updateError: "Unable to update notifications.",
  },
} as const;

type DisplayNotification = {
  notificationId: string;
  title: string;
  body: string;
  type: string;
  actionUrl: string | null;
  createdAt: string;
};

type NotificationRpcRow = {
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  received_at: string;
  title: string;
  body: string;
  type: string;
  action_url: string | null;
  notification_created_at: string;
};

export default function NotificationCenter() {
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("ar");
  const [notifications, setNotifications] =
    useState<DisplayNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale",
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: Locale;
      }>;

      const nextLocale = customEvent.detail?.locale;

      if (nextLocale === "ar" || nextLocale === "en") {
        setLocale(nextLocale);
      }
    };

    window.addEventListener(
      "masar:locale-change",
      handleLocaleChange,
    );

    return () => {
      window.removeEventListener(
        "masar:locale-change",
        handleLocaleChange,
      );
    };
  }, []);

  const text = labels[locale];
  const isArabic = locale === "ar";

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "get_my_notifications",
        { p_limit: 20 },
      );

      if (rpcError) throw rpcError;

      const formatted = ((data ?? []) as NotificationRpcRow[])
        .filter((row) => row.is_read === false)
        .map((row) => ({
          notificationId: row.notification_id,
          title: row.title,
          body: row.body,
          type: row.type,
          actionUrl: row.action_url,
          createdAt: row.notification_created_at,
        }));

      setNotifications(formatted);
    } catch (loadError) {
      console.error("Failed to load notifications:", loadError);

      const message =
        typeof loadError === "object" &&
        loadError !== null &&
        "message" in loadError &&
        typeof loadError.message === "string"
          ? loadError.message
          : text.loadError;

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [text.loadError]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const refresh = () => void loadNotifications();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick,
      );
    };
  }, []);

  const markAsRead = async (
    notificationId: string,
  ): Promise<boolean> => {
    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc(
      "mark_my_notification_read",
      {
        p_notification_id: notificationId,
      },
    );

    if (rpcError) {
      console.error(
        "Failed to mark notification as read:",
        rpcError,
      );
      setError(rpcError.message);
      return false;
    }

    if (data !== true) {
      setError(text.updateError);
      return false;
    }

    setNotifications((current) =>
      current.filter(
        (item) =>
          item.notificationId !== notificationId,
      ),
    );

    return true;
  };

  const openNotification = async (
    notification: DisplayNotification,
  ) => {
    if (actionPending) return;

    setActionPending(true);
    setError("");

    const marked = await markAsRead(
      notification.notificationId,
    );

    setActionPending(false);

    if (!marked) return;

    setOpen(false);

    if (notification.actionUrl) {
      /*
       * Do not refresh immediately after navigation. Refreshing the current
       * route can finish before router.push(), so the notification disappears
       * without opening its target page.
       */
      router.push(notification.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    if (
      notifications.length === 0 ||
      actionPending
    ) {
      return;
    }

    setActionPending(true);
    setError("");

    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc(
      "mark_all_my_notifications_read",
    );

    if (rpcError) {
      console.error(
        "Failed to mark all notifications as read:",
        rpcError,
      );
      setError(rpcError.message);
      setActionPending(false);
      return;
    }

    if (typeof data !== "number") {
      setError(text.updateError);
      setActionPending(false);
      return;
    }

    setNotifications([]);
    setActionPending(false);
  };

  return (
    <div
      ref={containerRef}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative"
    >
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);

          if (nextOpen) {
            void loadNotifications();
          }
        }}
        aria-label={text.center}
        aria-expanded={open}
        className="group flex h-16 items-center gap-3 rounded-full transition"
      >
        <span className="hidden text-[18px] font-black text-[#07152E] lg:block">
          {text.center}
        </span>

        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#07152E] text-white shadow-md transition duration-300 group-hover:bg-[#F7B548] group-hover:text-[#07152E]">
          <Bell size={16} />

          {notifications.length > 0 && (
            <span
              className={`absolute -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black text-white ${
                isArabic ? "-right-1" : "-left-1"
              }`}
            >
              {notifications.length > 99
                ? "99+"
                : notifications.length}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-[63px] z-[200] w-[380px] max-w-[calc(100vw-24px)] overflow-hidden border border-[#DCE3EC] bg-white shadow-[0_25px_70px_rgba(7,21,46,0.22)] ${
            isArabic ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between bg-[#07152E] px-5 py-2 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F7B548]/15 text-[#F7B548]">
                <BellRing size={16} />
              </div>

              <h2 className="text-[16px] font-black">
                {text.notifications}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={text.close}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          {notifications.length > 0 && (
            <div
              className={`flex border-b border-[#E7EBF0] px-4 py-2 ${
                isArabic ? "justify-end" : "justify-start"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
                disabled={actionPending}
                className="flex items-center gap-1.5 text-[10px] font-black text-[#B87808] transition hover:text-[#07152E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={13} />
                {text.markAll}
              </button>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DCE3EC] border-t-[#F7B548]" />
              </div>
            ) : error ? (
              <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
                <div>
                  <p className="text-[11px] font-bold text-red-600">
                    {text.actionError}
                  </p>

                  <p className="mt-2 break-words text-[9px] text-slate-500">
                    {error}
                  </p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3F6] text-slate-400">
                  <Bell size={22} />
                </div>

                <h3 className="mt-3 text-[14px] font-black text-[#07152E]">
                  {text.empty}
                </h3>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <button
                    key={item.notificationId}
                    type="button"
                    disabled={actionPending}
                    onClick={() =>
                      void openNotification(item)
                    }
                    className="block w-full disabled:cursor-wait disabled:opacity-70"
                  >
                    <NotificationItem
                      item={item}
                      locale={locale}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  item,
  locale,
}: {
  item: DisplayNotification;
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  return (
    <div
      className={`relative flex gap-3 rounded-[16px] border border-[#F7B548]/45 bg-[#FFF9EC] px-3 py-3 shadow-[0_6px_18px_rgba(247,181,72,0.08)] transition duration-200 ${
        isArabic ? "text-right" : "text-left"
      }`}
    >
      <span
        className={`absolute top-2 h-2 w-2 rounded-full bg-[#F7B548] ${
          isArabic ? "right-2" : "left-2"
        }`}
      />

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7B548] text-[#07152E]">
        <NotificationIcon type={item.type} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[12px] font-black text-[#07152E]">
          {item.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-5 text-slate-500">
          {item.body}
        </p>

        <p className="mt-1.5 text-[9px] font-bold text-[#B87808]">
          {formatNotificationDate(item.createdAt, locale)}
        </p>
      </div>
    </div>
  );
}

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === "journey" ||
    type === "journey_available" ||
    type === "journey_update"
  ) {
    return <Rocket size={18} />;
  }

  if (type === "gift") {
    return <Gift size={18} />;
  }

  if (
    type === "free_session" ||
    type === "new_content" ||
    type === "live_session"
  ) {
    return <PlayCircle size={18} />;
  }

  return <Megaphone size={18} />;
}

function formatNotificationDate(
  dateValue: string,
  locale: Locale,
) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}