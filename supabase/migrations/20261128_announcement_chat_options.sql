-- الاختيارات التي تظهر تحت رسالة الشات عند الضغط على زر الإعلان:
-- 'main' = القائمة الرئيسية للشات، 'course' = اختيارات الكورس المرتبط/المطابق.
-- خطة الرجوع: alter table public.platform_announcements drop column chat_options;
alter table public.platform_announcements add column if not exists chat_options text;
