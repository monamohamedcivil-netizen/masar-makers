create table if not exists public.course_action_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id uuid not null,
  panel_component text not null,
  source_type text not null check (source_type in ('screen', 'column', 'item')),
  source_id text not null,
  source_title text not null,
  action_label text not null,
  action_link text null,
  student_name text null,
  student_email text null,
  student_phone text null,
  student_country text null,
  created_at timestamptz not null default now()
);

create index if not exists course_action_leads_station_id_idx
  on public.course_action_leads(station_id);

create index if not exists course_action_leads_user_id_idx
  on public.course_action_leads(user_id);

create index if not exists course_action_leads_created_at_idx
  on public.course_action_leads(created_at desc);

alter table public.course_action_leads enable row level security;

create policy "authenticated users can insert own course action leads"
on public.course_action_leads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "authenticated users can view own course action leads"
on public.course_action_leads
for select
to authenticated
using (auth.uid() = user_id);
