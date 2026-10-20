-- المصروفات: فئات، دورة صرف (يومي/شهري/سنوي)، مستمر/متوقف، وربط بجدول خدمات المنصة.
-- + نوع الرحلة في المدفوعات (متكاملة / يوم واحد).

create table if not exists public.finance_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'platform' check (category in ('ads','platform','other')),
  amount numeric,
  currency text not null default 'USD',
  billing_period text not null default 'monthly' check (billing_period in ('daily','monthly','yearly')),
  started_on date,
  stopped_on date,
  is_running boolean not null default false,
  next_renewal date,
  next_renewal_note text,
  last_payment_note text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.finance_services enable row level security;

alter table public.finance_expenses add column if not exists category text not null default 'other';
alter table public.finance_expenses add column if not exists billing_period text not null default 'monthly';
alter table public.finance_expenses add column if not exists is_running boolean not null default false;
alter table public.finance_expenses add column if not exists service_id uuid references public.finance_services(id) on delete set null;

do $$ begin
  alter table public.finance_expenses add constraint finance_expenses_category_chk check (category in ('ads','platform','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.finance_expenses add constraint finance_expenses_period_chk check (billing_period in ('daily','monthly','yearly'));
exception when duplicate_object then null; end $$;

-- تصنيف المصروفات الحالية (المستوردة) تلقائيًا؛ وتبقى كلها «متوقفة» لتحافظ على أرقام الإكسل.
update public.finance_expenses set category = 'ads', billing_period = 'daily'
  where payee ilike '%meta%' or payee ilike '%إعلان%' or payee ilike '%اعلان%';
update public.finance_expenses set category = 'platform'
  where category = 'other' and (payee ilike '%zoom%' or payee ilike '%namecheap%' or payee ilike '%cloudways%'
     or payee ilike '%chatgpt%' or payee ilike '%bunny%' or payee ilike '%digitalocean%' or payee ilike '%cloud %'
     or payee ilike '%claude%' or payee ilike '%resend%');
update public.finance_expenses set billing_period = 'yearly' where payee ilike '%namecheap%';

alter table public.finance_payments add column if not exists journey_kind text not null default 'integrated';
do $$ begin
  alter table public.finance_payments add constraint finance_payments_kind_chk check (journey_kind in ('integrated','one_day'));
exception when duplicate_object then null; end $$;

update public.finance_payments fp set journey_kind = 'one_day'
from public.enrollments e
where e.id = fp.enrollment_id and lower(coalesce(e.journey_type,'')) in ('workshop','one_day','one-day','one_day_journey');

-- خدمات المنصة ومواعيد التجديد (من ملف الإكسل). الأسعار فارغة: اكتبيها واضغطي «مستمر» لتبدأ المحاسبة.
insert into public.finance_services (name, category, currency, billing_period, next_renewal, next_renewal_note, last_payment_note, notes, sort_order)
select * from (values
  ('DigitalOcean', 'platform', 'USD', 'monthly', date '2026-11-01', 'فاتورة 1 نوفمبر', 'فاتورة سبتمبر: 10.59 دولار، خُصمت تلقائيًا في 1 أكتوبر', 'الرصيد المجاني انتهى في 4 سبتمبر، والخصم من البطاقة تلقائي', 1),
  ('Bunny.net', 'platform', 'USD', 'monthly', date '2026-11-07', 'فاتورة أكتوبر تقريبًا في 7 نوفمبر', 'شحن رصيد 25 دولار في 7 أغسطس. فواتير: أغسطس 2.00 وسبتمبر 4.86', 'الاستهلاك في ارتفاع. تحققي أن الشحن التلقائي مفعّل', 2),
  ('Namecheap (الدومين)', 'platform', 'USD', 'yearly', null, 'تجديد الدومين غالبًا يوليو 2027', 'طلب في 7 يوليو بمبلغ 11.18 دولار', 'سعر تجديد .com يرتفع في 1 نوفمبر من 18.48 إلى 19.98 دولار، وتجديد عدة سنوات قبل 31 أكتوبر يوفر 10%', 3),
  ('Meta Ads', 'ads', 'SAR', 'daily', null, 'حسب الصرف', 'إعلان BIM + 40%: 17.72 ريال (28–30 سبتمبر)', 'الدفع تلقائي من نفس البطاقة', 4),
  ('Claude Pro', 'platform', 'USD', 'monthly', date '2026-11-19', '19 نوفمبر', '23 دولارًا (شاملة ضريبة 15%) في 19 أكتوبر', null, 5),
  ('Cloudways', 'platform', 'USD', 'monthly', null, 'لا شيء ظاهر', 'فاتورة يوليو فقط (أرسلت في 1 أغسطس)', 'تأكدي أن الحساب مغلق إن لم تعودي تستخدمينه', 6),
  ('Resend', 'platform', 'USD', 'monthly', null, '—', 'لا فواتير', 'رسائل نشرات فقط، يبدو أنكم على الخطة المجانية', 7),
  ('ChatGPT / OpenAI', 'platform', 'SAR', 'monthly', null, '—', 'رسائل كثيرة منذ يوليو', 'لم تُقرأ تفاصيلها: المبالغ وهل الاشتراك مدفوع غير معروفة', 8)
) v(name, category, currency, billing_period, next_renewal, next_renewal_note, last_payment_note, notes, sort_order)
where not exists (select 1 from public.finance_services);
