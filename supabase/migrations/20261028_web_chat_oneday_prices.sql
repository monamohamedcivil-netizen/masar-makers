-- One-day journey prices for the chat bot (رحلات اليوم الواحد).
-- lesson_id null  → the course's general price for every one-day lecture.
-- lesson_id set   → a special price for that lecture (overrides the general price).
-- course_id is the chat course (whatsapp_courses); lesson_id is the platform lesson of a one-day journey.
create table if not exists public.whatsapp_oneday_prices (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.whatsapp_courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  currency_code text not null,
  currency_label text not null,
  current_price numeric not null default 0,
  original_price numeric,
  offer_label text,
  offer_label_en text,
  offer_active boolean not null default false,
  offer_start timestamptz,
  offer_end timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One general price per course + currency, one special price per lecture + currency.
create unique index if not exists whatsapp_oneday_prices_general_uq
  on public.whatsapp_oneday_prices (course_id, currency_code) where lesson_id is null;
create unique index if not exists whatsapp_oneday_prices_lesson_uq
  on public.whatsapp_oneday_prices (course_id, lesson_id, currency_code) where lesson_id is not null;

-- Same access as whatsapp_course_prices: admins only (the chat engine reads with the service role).
alter table public.whatsapp_oneday_prices enable row level security;

drop policy if exists whatsapp_admin_all on public.whatsapp_oneday_prices;
create policy whatsapp_admin_all on public.whatsapp_oneday_prices
  for all to authenticated
  using (public.is_whatsapp_admin())
  with check (public.is_whatsapp_admin());
