-- Masar Makers
-- تعديل الطالب لتقييمه يُحفظ كطلب معلّق ولا يظهر للعامة إلا بعد موافقة الأدمن.
-- أعمدة جديدة فقط، لا تمس أي بيانات حالية.

alter table public.student_surveys
  add column if not exists pending_rating smallint
    check (pending_rating is null or (pending_rating between 1 and 5)),
  add column if not exists pending_comment text,
  add column if not exists pending_requested_at timestamptz;

create index if not exists student_surveys_pending_requested_idx
  on public.student_surveys (pending_requested_at)
  where pending_requested_at is not null;

notify pgrst, 'reload schema';
