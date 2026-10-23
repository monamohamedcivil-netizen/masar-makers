-- 1) نوع الرحلة في المدفوعات يحفظ المرحلة الفعلية للاشتراك:
--    أساسيات (fundamental) / متقدم (advanced) / متكاملة (integrated) / يوم واحد (one_day).
--    كان كل اشتراك احترافي يُسجَّل «متكاملة» حتى لو كان اشتراكًا في الأساسيات أو المتقدم فقط.
alter table public.finance_payments drop constraint if exists finance_payments_kind_chk;
alter table public.finance_payments add constraint finance_payments_kind_chk
  check (journey_kind in ('integrated','fundamental','advanced','one_day'));

-- تصحيح السجلات الحالية من نوع طلب الاشتراك الأصلي.
update public.finance_payments fp
set journey_kind = lower(e.journey_type)
from public.enrollments e
where e.id = fp.enrollment_id
  and fp.journey_kind = 'integrated'
  and lower(coalesce(e.journey_type, '')) in ('fundamental','advanced');

-- 2) استكمال بيانات الطالب الناقصة في المدفوعات من الحساب نفسه:
--    profiles ثم طلب الاشتراك ثم بيانات التسجيل المحفوظة في Supabase Auth.
--    (to_jsonb حتى لا يفشل الاستعلام إذا لم يوجد عمود بعينه في profiles.)
update public.finance_payments fp
set
  certificate_name = coalesce(
    nullif(trim(fp.certificate_name), ''),
    nullif(trim(to_jsonb(p) ->> 'full_name_en'), ''),
    nullif(trim(to_jsonb(e) ->> 'student_name_en'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name_en'), '')
  ),
  phone = coalesce(
    nullif(trim(fp.phone), ''),
    nullif(trim(to_jsonb(p) ->> 'phone'), ''),
    nullif(trim(to_jsonb(p) ->> 'phone_number'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'phone'), '')
  ),
  country = coalesce(
    nullif(trim(fp.country), ''),
    nullif(trim(to_jsonb(p) ->> 'country'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'country'), '')
  ),
  nationality = coalesce(
    nullif(trim(fp.nationality), ''),
    nullif(trim(to_jsonb(p) ->> 'nationality'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'nationality'), '')
  ),
  email = coalesce(
    nullif(trim(fp.email), ''),
    nullif(trim(to_jsonb(p) ->> 'email'), ''),
    u.email
  )
from public.enrollments e
left join public.profiles p on p.id = e.user_id
left join auth.users u on u.id = e.user_id
where e.id = fp.enrollment_id;

-- 3) رمز الإصدار للسجلات الفارغة حسب نوع الاشتراك وآخر دفعة مستخدمة للكورس:
--    أساسيات C3D-F2 / متقدم C3D-A1 (نفس قاعدة buildEditionCode في الكود).
with targets as (
  select
    fp.id,
    case when upper(fp.course_code) = 'SPD' then 'PD' else upper(fp.course_code) end as prefix,
    case fp.journey_kind when 'fundamental' then 'F' else 'A' end as stage
  from public.finance_payments fp
  where coalesce(trim(fp.edition_code), '') = ''
    and fp.course_code is not null
    and fp.journey_kind in ('fundamental', 'advanced')
)
update public.finance_payments fp
set edition_code = t.prefix || '-' || t.stage || coalesce((
  select max((regexp_match(upper(x.edition_code), '^' || t.prefix || '-(?:F\d+\+)?' || t.stage || '(\d+)'))[1]::int)
  from public.finance_payments x
  where x.edition_code is not null
), 1)
from targets t
where fp.id = t.id;

-- 4) بيانات الدفع التي تُملأ في جدول طلبات الاشتراك قبل القبول
--    (الإصدار، النوع، السعر الأصلي، المدفوع، حالة الدفع، تاريخ الدفع، الملاحظات، المتابعة)،
--    وتُنقل كما هي إلى جدول المدفوعات عند قبول الطلب.
alter table public.enrollments
  add column if not exists payment_draft jsonb not null default '{}'::jsonb;
