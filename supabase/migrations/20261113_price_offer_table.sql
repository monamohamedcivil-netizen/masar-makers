-- جدول الأسعار الموحّد: أسعار مستقلة لكل عرض + عرض نشط واحد يُنقل لجداول الشات.
-- آمن للتكرار (IF NOT EXISTS / ON CONFLICT). لا يحذف أي بيانات.

-- 1) تواريخ واسم إنجليزي للعروض
alter table public.finance_offers add column if not exists starts_at timestamptz;
alter table public.finance_offers add column if not exists ends_at timestamptz;
alter table public.finance_offers add column if not exists name_en text;

-- 2) أسعار كل عرض (كورس/نوع/عملة)
create table if not exists public.price_offer_rows (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.finance_offers(id) on delete cascade,
  kind text not null check (kind in ('course', 'oneday')),
  course_id uuid not null,
  variant_id uuid,
  currency_code text not null,
  original_price numeric,
  offer_price numeric not null default 0,
  offer_active boolean not null default true,
  currency_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_price_offer_rows_key
  on public.price_offer_rows (
    offer_id, kind, course_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    currency_code
  );
create index if not exists idx_price_offer_rows_offer on public.price_offer_rows (offer_id);

-- 3) العرض النشط (صف واحد)
create table if not exists public.price_offer_settings (
  id int primary key default 1 check (id = 1),
  active_offer_id uuid references public.finance_offers(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.price_offer_settings (id) values (1) on conflict (id) do nothing;

-- RLS: بدون سياسات = لا وصول من المتصفح؛ الإدارة تعمل عبر الخادم فقط.
alter table public.price_offer_rows enable row level security;
alter table public.price_offer_settings enable row level security;

-- 4) نقل الأسعار الحالية إلى عرض «عرض خاص» (الشات يبقى كما هو بالظبط)
do $$
declare v_offer uuid;
begin
  select id into v_offer from public.finance_offers where name = 'عرض خاص' order by created_at limit 1;
  if v_offer is null then
    insert into public.finance_offers (name, discount_percent, sort_order, is_active)
    values ('عرض خاص', 0, 100, true) returning id into v_offer;
  end if;

  update public.finance_offers set name_en = 'Special offer' where id = v_offer and name_en is null;

  -- سعر CSD المتكامل بالريال كان «عرض التوفير» (بقايا قديمة): يوحَّد مع «عرض خاص».
  update public.whatsapp_course_prices
     set offer_label = 'عرض خاص', offer_label_en = 'Special offer'
   where offer_label = 'عرض التوفير';

  insert into public.price_offer_rows
    (offer_id, kind, course_id, variant_id, currency_code, original_price, offer_price, offer_active, currency_active)
  select v_offer, 'course', course_id, variant_id, currency_code,
         coalesce(original_price, current_price), current_price, offer_active, is_active
  from public.whatsapp_course_prices
  on conflict do nothing;

  insert into public.price_offer_rows
    (offer_id, kind, course_id, variant_id, currency_code, original_price, offer_price, offer_active, currency_active)
  select v_offer, 'oneday', course_id, null, currency_code,
         coalesce(original_price, current_price), current_price, offer_active, is_active
  from public.whatsapp_oneday_prices
  where lesson_id is null
  on conflict do nothing;

  update public.price_offer_settings set active_offer_id = v_offer where id = 1 and active_offer_id is null;
end $$;
