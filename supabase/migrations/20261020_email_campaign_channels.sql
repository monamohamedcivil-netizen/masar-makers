-- قناة إرسال الرسالة المخصصة: email / notify / both
alter table public.admin_email_campaigns
  add column if not exists channels text not null default 'email';
