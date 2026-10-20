-- Finance system: payments, offers/prices, expenses, other income, exchange rates.
-- All tables are locked (RLS on, no policies): accessed only via the service-role admin client.

create table if not exists public.finance_exchange_rates (
  currency text primary key,
  rate_to_egp numeric not null check (rate_to_egp > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_percent numeric not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_price_items (
  code text primary key,
  label text not null,
  course_code text,
  price_egp numeric not null default 0,
  price_sar numeric not null default 0,
  price_usd numeric not null default 0,
  sort_order int not null default 0
);

create table if not exists public.finance_payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid unique references public.enrollments(id) on delete set null,
  user_id uuid,
  course_id uuid references public.courses(id) on delete set null,
  course_code text,
  edition_code text,
  delivery_type text check (delivery_type in ('recorded','interactive')),
  student_name text,
  certificate_name text,
  email text,
  phone text,
  nationality text,
  country text,
  offer_id uuid references public.finance_offers(id) on delete set null,
  offer_label text,
  list_price numeric,
  currency text not null default 'EGP',
  amount_total numeric,
  amount_paid numeric not null default 0,
  amount_egp numeric not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  paid_at date,
  notes text,
  followup_date date,
  followup_reason text,
  followup_done boolean not null default false,
  followup_notified_at timestamptz,
  activation_key text,
  email_sent boolean not null default false,
  expires_at date,
  certificate_issued boolean not null default false,
  survey_done boolean not null default false,
  source text not null default 'manual' check (source in ('enrollment','import','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists finance_payments_course_idx on public.finance_payments(course_code);
create index if not exists finance_payments_followup_idx on public.finance_payments(followup_date) where followup_done = false;

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  payee text not null,
  start_month date not null,
  end_month date,
  months_count int not null default 1 check (months_count >= 1),
  currency text not null default 'EGP',
  monthly_amount numeric not null default 0,
  total_amount numeric not null default 0,
  total_egp numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_other_income (
  id uuid primary key default gen_random_uuid(),
  received_from text,
  for_what text,
  month date not null,
  currency text not null default 'EGP',
  amount numeric not null default 0,
  my_percent numeric,
  extra_profit numeric not null default 0,
  extra_reason text,
  total_egp numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.finance_exchange_rates enable row level security;
alter table public.finance_offers enable row level security;
alter table public.finance_price_items enable row level security;
alter table public.finance_payments enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.finance_other_income enable row level security;

alter table public.enrollments add column if not exists subscription_price numeric;
alter table public.enrollments add column if not exists subscription_currency text;
alter table public.enrollments add column if not exists offer_label text;

insert into public.finance_exchange_rates(currency, rate_to_egp) values ('EGP',1),('USD',50),('SAR',13.5)
  on conflict (currency) do nothing;

insert into public.finance_offers(name, discount_percent, sort_order)
select * from (values
  ('بدون خصم', 0, 0),
  ('خصم المجموعات الصغيرة (1-5 أفراد)', 15, 1),
  ('خصم المجموعات الكبيرة (أكثر من 5 أفراد)', 20, 2),
  ('خصم اشتراك 3 كورسات', 10, 3),
  ('خصم اشتراك 4 كورسات', 15, 4),
  ('خصم اشتراك 5 كورسات', 20, 5),
  ('خصم الطلبة', 40, 6),
  ('خصم الطلبة (أكثر من 5 أفراد)', 50, 7)
) v(name, discount_percent, sort_order)
where not exists (select 1 from public.finance_offers);

insert into public.finance_price_items(code,label,course_code,price_egp,price_sar,price_usd,sort_order) values
  ('CSD','CSD (كامل)','CSD',10000,800,200,1),
  ('CSD.F','CSD Fundamental','CSD',5000,500,100,2),
  ('CSD.A','CSD Advanced','CSD',6000,600,130,3),
  ('BIM','BIM Roads','BIM',6500,500,133.33,4),
  ('VT','Vehicle Tracking','VT',5000,400,106.67,5),
  ('PD','Project Deliverables','SPD',5000,400,106.67,6)
on conflict (code) do nothing;
