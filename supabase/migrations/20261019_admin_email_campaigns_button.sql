-- Masar Makers
-- حفظ نص الزر ورابطه في سجل الإيميلات المخصصة لإعادة استخدامها كقالب.
alter table public.admin_email_campaigns
  add column if not exists button_text text,
  add column if not exists button_url text;

notify pgrst, 'reload schema';
