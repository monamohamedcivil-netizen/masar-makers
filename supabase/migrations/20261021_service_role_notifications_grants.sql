-- يسمح للسيرفر (service_role فقط) بإنشاء الإشعارات؛ لا يؤثر على صلاحيات الطلاب.
grant insert, update, delete on public.notifications to service_role;
grant insert, update, delete on public.notification_recipients to service_role;
