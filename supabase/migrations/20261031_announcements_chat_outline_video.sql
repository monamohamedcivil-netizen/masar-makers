-- طُبّق 2026-10-24.
alter table public.platform_announcements
  add column if not exists opens_chat boolean not null default false,
  add column if not exists chat_reply text,
  add column if not exists chat_reply_en text;

update public.platform_announcements
set opens_chat = true
where href ilike '%wa.me/%' or href ilike '%whatsapp.com/%';

alter table public.whatsapp_courses
  add column if not exists outline_video_url text;

-- زر «شرح محاور الرحلة ونتائجها» في قائمة الكورس (يُفعَّل بعد نشر الكود).
insert into public.whatsapp_menu_items (menu_id, item_key, label, label_en, action_type, action_value, sort_order, web_visibility, is_active)
select m.id, 'course_outline', '🧭 شرح محاور الرحلة ونتائجها', '🧭 Journey outline & outcomes', 'open_url', 'outline_video', 35, 'all', false
from public.whatsapp_menus m
where m.menu_key = 'course_actions'
  and not exists (select 1 from public.whatsapp_menu_items i where i.menu_id = m.id and i.item_key = 'course_outline');

-- Ads / direct links (?ask=<course>) open the chat on that course with this welcome (applied 2026-10-25).
insert into public.web_chat_entry_points (entry_key, label, welcome_text, welcome_text_en) values
('ad', 'الإعلانات الممولة والروابط المباشرة (?ask=)',
 'أهلًا بيك في Masar Makers 👋' || chr(10) || 'شكرًا لاهتمامك برحلة *{course}* — التسجيل مفتوح والرحلة بتبدأ قريبًا.' || chr(10) || 'اختار سؤالك من القائمة وهرد عليك فورًا 👇',
 'Welcome to Masar Makers 👋' || chr(10) || 'Thanks for your interest in the *{course}* journey — registration is open and it starts soon.' || chr(10) || 'Pick your question below 👇')
on conflict (entry_key) do nothing;
