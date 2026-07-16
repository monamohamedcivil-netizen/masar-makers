"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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

type NotificationType =
  | "journey"
  | "course"
  | "announcement"
  | "gift"
  | "free_session"
  | "workshop"
  | "journey_available"
  | "journey_update"
  | "live_session"
  | "new_content"
  | "general";

type NotificationDetails = {
  id: string;
  title: string;
  body: string;
  type: NotificationType | string;
  action_url: string | null;
  created_at: string;
};

type NotificationRecipient = {
  notification_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notifications:
    | NotificationDetails
    | NotificationDetails[]
    | null;
};

type DisplayNotification = {
  notificationId: string;
  isRead: boolean;
  readAt: string | null;
  receivedAt: string;
  notification: NotificationDetails;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] =
    useState<DisplayNotification[]>([]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  const loadNotifications = useCallback(async () => {
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

      const { data, error: selectError } =
        await supabase
          .from("notification_recipients")
          .select(`
            notification_id,
            user_id,
            is_read,
            read_at,
            created_at,
            notifications (
              id,
              title,
              body,
              type,
              action_url,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(20);

      if (selectError) {
        throw selectError;
      }

      const formatted = (
        (data ?? []) as NotificationRecipient[]
      )
        .map((recipient) => {
          const relatedNotification =
            Array.isArray(recipient.notifications)
              ? recipient.notifications[0]
              : recipient.notifications;

          if (!relatedNotification) {
            return null;
          }

          return {
            notificationId:
              recipient.notification_id,
            isRead: recipient.is_read,
            readAt: recipient.read_at,
            receivedAt: recipient.created_at,
            notification: relatedNotification,
          };
        })
        .filter(
          (
            item
          ): item is DisplayNotification =>
            Boolean(item)
        );

      setNotifications(formatted);
    } catch (loadError) {
      console.error(
        "Failed to load notifications:",
        loadError
      );

      setError(
        "تعذر تحميل الإشعارات حاليًا."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const closeOnOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeOnOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick
      );
    };
  }, []);

  const markAsRead = async (
    notificationId: string
  ) => {
    const target = notifications.find(
      (item) =>
        item.notificationId === notificationId
    );

    if (!target || target.isRead) {
      return;
    }

    // تحديث الواجهة فورًا
    setNotifications((current) =>
      current.map((item) =>
        item.notificationId === notificationId
          ? {
              ...item,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : item
      )
    );

    const supabase = createClient();

    const { error: updateError } =
      await supabase
        .from("notification_recipients")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq(
          "notification_id",
          notificationId
        );

    if (updateError) {
      console.error(
        "Failed to mark notification as read:",
        updateError
      );

      // استعادة الحالة عند فشل التحديث
      setNotifications((current) =>
        current.map((item) =>
          item.notificationId === notificationId
            ? {
                ...item,
                isRead: false,
                readAt: null,
              }
            : item
        )
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.isRead)
      .map((item) => item.notificationId);

    if (unreadIds.length === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        isRead: true,
        readAt:
          item.readAt ??
          new Date().toISOString(),
      }))
    );

    const supabase = createClient();

    const { error: updateError } =
      await supabase
        .from("notification_recipients")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in(
          "notification_id",
          unreadIds
        );

    if (updateError) {
      console.error(
        "Failed to mark all as read:",
        updateError
      );

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
        onClick={() => setOpen((current) => !current)}
        aria-label="مركز الإشعارات"
        aria-expanded={open}
        className="
          group flex items-center gap-3
          rounded-full transition h-16
        "
      >
        <span className="hidden text-[18px] font-black text-[#07152E] lg:block">
          مركز الإشعارات
        </span>

        <span
          className="
            relative flex h-7 w-7
            items-center justify-center top-0
            rounded-full bg-[#07152E]
            text-white shadow-md
            transition duration-300
            group-hover:bg-[#F7B548]
            group-hover:text-[#07152E]
          "
        >
          <Bell size={16} />

          {unreadCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5 items-center
                justify-center rounded-full
                border-2 border-white
                bg-red-500 px-1
                text-[9px] font-black text-white
              "
            >
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-[63px] z-[200]
            w-[380px] max-w-[calc(100vw-24px)]
            overflow-hidden 
            border border-[#DCE3EC]
            bg-white
            shadow-[0_25px_70px_rgba(7,21,46,0.22)]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#07152E] px-5 py-2 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F7B548]/15 text-[#F7B548]">
                <BellRing size={16} />
              </div>

              <div>
                <h2 className="text-[16px] font-black">
                  الإشعارات
                </h2>

                
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-end border-b border-[#E7EBF0] px-4 py-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="
                  flex items-center gap-1.5
                  text-[10px] font-black
                  text-[#B87808] transition
                  hover:text-[#07152E]
                "
              >
                <Check size={13} />
                تحديد الكل كمقروء
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DCE3EC] border-t-[#F7B548]" />
              </div>
            ) : error ? (
              <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
                <p className="text-[11px] font-bold text-red-600">
                  {error}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F3F6] text-slate-400">
                  <Bell size={22} />
                </div>

                <h3 className="mt-3 text-[14px] font-black text-[#07152E]">
                  لا توجد إشعارات
                </h3>

                <p className="mt-1 text-[10px] font-medium leading-5 text-slate-500">
                  ستظهر هنا أخبار الرحلات والتحديثات الجديدة.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <NotificationItem
                    key={item.notificationId}
                    item={item}
                    onOpen={() =>
                      void markAsRead(
                        item.notificationId
                      )
                    }
                    closeMenu={() =>
                      setOpen(false)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type NotificationItemProps = {
  item: DisplayNotification;
  onOpen: () => void;
  closeMenu: () => void;
};

function NotificationItem({
  item,
  onOpen,
  closeMenu,
}: NotificationItemProps) {
  const { notification } = item;

  const content = (
    <div
      className={`
        relative flex gap-3 rounded-[16px]
        border px-3 py-3 text-right
        transition duration-200
        ${
          item.isRead
            ? `
              border-[#E5E9EF]
              bg-[#F8FAFC]
              hover:bg-white
            `
            : `
              border-[#F7B548]/45
              bg-[#FFF9EC]
              shadow-[0_6px_18px_rgba(247,181,72,0.08)]
            `
        }
      `}
    >
      {!item.isRead && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F7B548]" />
      )}

      <div
        className={`
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl
          ${
            item.isRead
              ? "bg-white text-slate-500"
              : "bg-[#F7B548] text-[#07152E]"
          }
        `}
      >
        <NotificationIcon
          type={notification.type}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[12px] font-black text-[#07152E]">
          {notification.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-5 text-slate-500">
          {notification.body}
        </p>

        <p className="mt-1.5 text-[9px] font-bold text-[#B87808]">
          {formatNotificationDate(
            notification.created_at
          )}
        </p>
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link
        href={notification.action_url}
        onClick={() => {
          onOpen();
          closeMenu();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full"
    >
      {content}
    </button>
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
  dateValue: string
) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}