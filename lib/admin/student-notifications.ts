"use server";

import { createAdminClient } from "@/lib/supabase/server";

export type AdminStudentNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  actionUrl: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  receivedAt: string;
};

export async function getAdminStudentNotifications(
  userId: string,
): Promise<AdminStudentNotification[]> {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return [];
  }

  const supabase = createAdminClient();

  // أولاً: نحضر سجل استلام الإشعارات الخاص بهذا الطالب فقط
  const {
    data: recipientData,
    error: recipientError,
  } = await supabase
    .from("notification_recipients")
    .select(
      "notification_id,user_id,is_read,read_at,created_at",
    )
    .eq("user_id", normalizedUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (recipientError) {
  console.error(
    "GET ADMIN STUDENT NOTIFICATION RECIPIENTS ERROR:",
    recipientError,
  );

  throw new Error(
    `تعذر تحميل إشعارات الطالب: ${recipientError.message}`,
  );
}

  const recipients = recipientData ?? [];

  if (recipients.length === 0) {
    return [];
  }

  const notificationIds = recipients.map(
    (recipient) => recipient.notification_id,
  );

  // ثانياً: نحضر محتوى الإشعارات نفسها
  const {
    data: notificationData,
    error: notificationError,
  } = await supabase
    .from("notifications")
    .select(
      "id,title,body,type,action_url,created_at",
    )
    .in("id", notificationIds);

  if (notificationError) {
  console.error(
    "GET ADMIN STUDENT NOTIFICATIONS ERROR:",
    notificationError,
  );

  throw new Error(
    `تعذر تحميل محتوى إشعارات الطالب: ${notificationError.message}`,
  );
}

  const notificationMap = new Map(
    (notificationData ?? []).map((notification) => [
      notification.id,
      notification,
    ]),
  );

  return recipients
    .map((recipient) => {
      const notification = notificationMap.get(
        recipient.notification_id,
      );

      if (!notification) {
        return null;
      }

      return {
        id: notification.id,
        title: notification.title ?? "إشعار",
        body: notification.body ?? "",
        type: notification.type ?? "general",
        actionUrl: notification.action_url ?? null,
        createdAt: notification.created_at,
        isRead: Boolean(recipient.is_read),
        readAt: recipient.read_at ?? null,
        receivedAt: recipient.created_at,
      };
    })
    .filter(
      (
        item,
      ): item is AdminStudentNotification =>
        item !== null,
    );
}