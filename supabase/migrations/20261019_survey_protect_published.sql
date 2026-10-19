-- Masar Makers
-- حماية إضافية: لا يستطيع الطالب تغيير تقييمه المنشور أو إعدادات ظهوره مباشرة
-- (حتى لو استدعى قاعدة البيانات بنفسه). التعديل يمر عبر طلب موافقة الأدمن.
-- عمليات السيرفر (service role) والأدمن غير متأثرة.

create or replace function public.protect_published_survey_fields()
returns trigger
language plpgsql
as $$
begin
  if old.submitted_at is not null
     and auth.uid() is not null
     and auth.uid() = old.user_id
     and not coalesce(public.is_admin(), false) then
    if new.rating is distinct from old.rating
       or new.comment is distinct from old.comment
       or new.show_on_home is distinct from old.show_on_home
       or new.show_on_course is distinct from old.show_on_course
       or new.status is distinct from old.status then
      raise exception 'لا يمكن تعديل التقييم المنشور مباشرة. أرسل طلب تعديل للمراجعة.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_published_survey_fields_trg on public.student_surveys;

create trigger protect_published_survey_fields_trg
  before update on public.student_surveys
  for each row
  execute function public.protect_published_survey_fields();
