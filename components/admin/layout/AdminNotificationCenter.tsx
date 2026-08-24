"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  Check,
  ClipboardList,
  FileImage,
  Star,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type NotificationDetails = {
  id: string;
  title: string;
  body: string;
  type: string;
  action_url: string | null;
  created_at: string;
};

type NotificationRecipientRow = {
  notification_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type DisplayNotification = {
  notificationId: string;
  isRead: boolean;
  receivedAt: string;
  notification: NotificationDetails;
};

function getIcon(type: string) {
  if (type === "admin_enrollment_request") {
    return ClipboardList;
  }

  if (type === "admin_certificate_ready") {
    return Award;
  }

  if (type === "admin_project_submitted") {
    return FileImage;
  }

  if (type === "admin_survey_submitted") {
    return Star;
  }

  return Bell;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] =
    useState<DisplayNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (item) => !item.isRead,
  ).length;

  const loadNotifications =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setNotifications([]);
          return;
        }

        const {
          data: recipientData,
          error: recipientError,
        } = await supabase
          .from("notification_recipients")
          .select(
            "notification_id,user_id,is_read,read_at,created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(30);

        if (recipientError) {
          throw recipientError;
        }

        const recipients =
          (recipientData ??
            []) as NotificationRecipientRow[];

        if (recipients.length === 0) {
          setNotifications([]);
          return;
        }

        const ids = recipients.map(
          (row) => row.notification_id,
        );

        const {
          data: detailsData,
          error: detailsError,
        } = await supabase
          .from("notifications")
          .select(
            "id,title,body,type,action_url,created_at",
          )
          .in("id", ids);

        if (detailsError) {
          throw detailsError;
        }

        const detailsMap = new Map(
          ((detailsData ??
            []) as NotificationDetails[]).map(
            (item) => [item.id, item],
          ),
        );

        const merged = recipients
          .map((recipient) => {
            const notification =
              detailsMap.get(
                recipient.notification_id,
              );

            if (!notification) {
              return null;
            }

            return {
              notificationId:
                recipient.notification_id,
              isRead: recipient.is_read,
              receivedAt:
                recipient.created_at,
              notification,
            };
          })
          .filter(
            (
              item,
            ): item is DisplayNotification =>
              item !== null,
          )
          .filter((item) =>
            item.notification.type.startsWith(
              "admin_",
            ),
          );

        setNotifications(merged);
      } catch (loadError) {
        console.error(
          "Failed to load admin notifications:",
          loadError,
        );
        setError(
          "تعذر تحميل إشعارات الإدارة.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const refresh = () => {
      void loadNotifications();
    };

    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(
        "focus",
        refresh,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      close,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        close,
      );
    };
  }, []);

  const markAsRead = async (
    notificationId: string,
  ) => {
    const target = notifications.find(
      (item) =>
        item.notificationId ===
        notificationId,
    );

    if (!target || target.isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.notificationId ===
        notificationId
          ? {
              ...item,
              isRead: true,
            }
          : item,
      ),
    );

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      void loadNotifications();
      return;
    }

    const { error: updateError } =
      await supabase
        .from("notification_recipients")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq(
          "notification_id",
          notificationId,
        )
        .eq("user_id", user.id);

    if (updateError) {
      void loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.isRead)
      .map(
        (item) =>
          item.notificationId,
      );

    if (unreadIds.length === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        isRead: true,
      })),
    );

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      void loadNotifications();
      return;
    }

    const { error } = await supabase
      .from("notification_recipients")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .in(
        "notification_id",
        unreadIds,
      );

    if (error) {
      void loadNotifications();
    }
  };

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className="relative"
    >
      <button
        type="button"
        aria-label="إشعارات الإدارة"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);

          if (!open) {
            void loadNotifications();
          }
        }}
        className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -left-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-black text-[#07152E]">
                إشعارات الإدارة
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                {unreadCount} غير مقروء
              </p>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
                className="inline-flex items-center gap-1 text-xs font-black text-[#B87908]"
              >
                <Check className="h-4 w-4" />
                قراءة الكل
              </button>
            ) : null}
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-sm font-bold text-slate-400">
                جارٍ تحميل الإشعارات...
              </p>
            ) : error ? (
              <p className="p-8 text-center text-sm font-bold text-red-600">
                {error}
              </p>
            ) : notifications.length ===
              0 ? (
              <p className="p-8 text-center text-sm font-bold text-slate-400">
                لا توجد إشعارات إدارية حتى الآن.
              </p>
            ) : (
              notifications.map((item) => {
                const Icon = getIcon(
                  item.notification.type,
                );

                const href =
                  item.notification
                    .action_url ||
                  "/admin/dashboard";

                return (
                  <Link
                    key={
                      item.notificationId
                    }
                    href={href}
                    onClick={() => {
                      void markAsRead(
                        item.notificationId,
                      );
                      setOpen(false);
                    }}
                    className={`flex gap-3 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50 ${
                      item.isRead
                        ? "bg-white"
                        : "bg-amber-50/60"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07152E] text-[#F7B548]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-[#07152E]">
                        {
                          item.notification
                            .title
                        }
                      </span>

                      <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                        {
                          item.notification
                            .body
                        }
                      </span>

                      <span className="mt-2 block text-[10px] font-bold text-slate-400">
                        {formatRelativeDate(
                          item.receivedAt,
                        )}
                      </span>
                    </span>

                    {!item.isRead ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#F7B548]" />
                    ) : null}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}