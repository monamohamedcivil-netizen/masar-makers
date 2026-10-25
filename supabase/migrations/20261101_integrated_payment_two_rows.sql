-- طُبّق 2026-10-25.
-- الاشتراك المتكامل في كورس بمرحلتين يُسجَّل في المدفوعات صفين: أساسيات + متقدم.
alter table public.finance_payments
  add column if not exists enrollment_part text;

alter table public.finance_payments drop constraint if exists finance_payments_enrollment_part_chk;
alter table public.finance_payments add constraint finance_payments_enrollment_part_chk
  check (enrollment_part is null or enrollment_part in ('fundamental','advanced'));

alter table public.finance_payments drop constraint if exists finance_payments_enrollment_id_key;
create unique index if not exists finance_payments_enrollment_part_uq
  on public.finance_payments (enrollment_id, coalesce(enrollment_part, ''))
  where enrollment_id is not null;

-- سعر المتقدم في طلب الاشتراك المتكامل (subscription_price = سعر الأساسيات).
alter table public.enrollments
  add column if not exists subscription_price_advanced numeric;

-- العروض المكتوبة سابقًا تُضاف لقائمة العروض.
insert into public.finance_offers (name, discount_percent, sort_order, is_active)
select distinct trim(l), 0, 100, true from (
  select offer_label l from public.finance_payments union select offer_label from public.enrollments
) x
where trim(coalesce(l,'')) <> '' and trim(l) not like 'مكافأة%'
  and not exists (select 1 from public.finance_offers o where o.name = trim(x.l));
