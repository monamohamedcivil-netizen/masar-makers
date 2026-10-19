-- Masar Makers
-- سجل الإيميلات المخصصة التي يرسلها الأدمن من لوحة التحكم (جدول جديد، لا يمس أي بيانات حالية).

create table if not exists public.admin_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience text not null check (audience in ('all', 'selected', 'test')),
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_email_campaigns_created_at_idx
  on public.admin_email_campaigns (created_at desc);

alter table public.admin_email_campaigns enable row level security;
-- بدون سياسات: الوصول من السيرفر فقط (service role).

notify pgrst, 'reload schema';
