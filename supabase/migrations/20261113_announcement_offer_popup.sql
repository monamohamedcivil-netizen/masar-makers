-- شاشة العروض المنبثقة + وجهة الزر المختارة من قائمة.
-- offer_popup: {enabled, imageUrl, buttonEnabled, buttonText, buttonTextEn, link}
-- link_config: وجهة زر الإعلان العادي {kind: whatsapp|page|custom, ...} (للتعديل لاحقًا في النموذج؛ الرابط النهائي يبقى في href).
alter table public.platform_announcements
  add column if not exists offer_popup jsonb,
  add column if not exists link_config jsonb;

-- الكورس المرتبط بزر الإعلان: عند الضغط يفتح الشات تفاصيل هذا الكورس مباشرة (بدل رسالة الترحيب).
alter table public.platform_announcements
  add column if not exists chat_course_id uuid references public.whatsapp_courses(id) on delete set null;
