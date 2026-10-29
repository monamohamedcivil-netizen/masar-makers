-- Certificate progress per course (Mona, 2026-10-29):
-- «نسبة الإنجاز» في تبويب الشهادات وإشعار الاستحقاق = متوسط تقدم محاضرات الكورس (الرحلة المتكاملة) للطالب
-- (المحاضرة المكتملة = 100، المشترك فيها = نسبة تقدمها، غير المشترك = 0). ≥ 90 → إشعار مرة واحدة.
-- لا يغيّر أي بيانات؛ الدالة فقط.

create or replace function public.notify_composed_certificate(p_user_id uuid, p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_split boolean;
  v_has_pro_links boolean;
  r record;
  v_student_name text;
  v_course_title text;
begin
  -- Professional enrollment → its own certificate flow.
  if exists (
    select 1 from public.enrollments e
     where e.user_id = p_user_id and e.course_id = p_course_id and e.status = 'active'
       and lower(replace(coalesce(e.journey_type, ''), '-', '_')) in
           ('fundamental', 'fundamentals', 'advanced', 'integrated', 'professional', 'career_path', 'career')
  ) then
    return;
  end if;

  select exists (
    select 1 from public.lessons l
     where l.course_id = p_course_id and l.status = 'published'
       and lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals', 'advanced')
  ) into v_is_split;

  select exists (
    select 1 from public.lesson_journeys lj
      join public.journeys j on j.id = lj.journey_id
      join public.lessons l on l.id = lj.lesson_id
     where l.course_id = p_course_id and j.course_id = p_course_id and j.is_active = true
       and lower(replace(coalesce(j.journey_type, ''), '-', '_')) not in
           ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
  ) into v_has_pro_links;

  for r in
    with pro as (
      select l.id,
             case
               when not v_is_split then 'advanced'
               when lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals') then 'fundamental'
               else 'advanced'
             end as cert_type
        from public.lessons l
       where l.course_id = p_course_id and l.status = 'published'
         and (
           (v_is_split and lower(coalesce(l.course_part, '')) in ('fundamental', 'fundamentals', 'advanced'))
           or (
             not v_is_split
             and (
               not v_has_pro_links
               or exists (
                 select 1 from public.lesson_journeys lj
                   join public.journeys j on j.id = lj.journey_id
                  where lj.lesson_id = l.id and j.course_id = p_course_id and j.is_active = true
                    and lower(replace(coalesce(j.journey_type, ''), '-', '_')) not in
                        ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
               )
             )
           )
         )
    ),
    mine as (
      select distinct substring(e.action_key from '^(?:workshop|free):lesson:([0-9a-fA-F-]{36})')::uuid as lesson_id
        from public.enrollments e
       where e.user_id = p_user_id and e.course_id = p_course_id and e.status = 'active'
         and lower(replace(coalesce(e.journey_type, ''), '-', '_')) in
             ('free', 'free_session', 'free_journey', 'workshop', 'one_day', 'one_day_workshop')
         and e.action_key ~ '^(workshop|free):lesson:[0-9a-fA-F-]{36}'
    )
    select pro.cert_type,
           count(*) as total,
           count(*) filter (
             where pro.id in (select lesson_id from mine)
               and exists (
                 select 1 from public.lesson_progress lp
                  where lp.user_id = p_user_id and lp.lesson_id = pro.id
                    and (lp.completed = true or coalesce(lp.progress_percent, 0) >= 100)
               )
           ) as covered,
           -- نسبة الإنجاز في الكورس: تقدم المحاضرات المشترك فيها فقط (غير المشترك = 0) من 100 لكل محاضرة
           coalesce(sum(
             case when pro.id in (select lesson_id from mine) then
               (select greatest(0, least(100, case when lp.completed = true then 100 else coalesce(lp.progress_percent, 0) end))
                  from public.lesson_progress lp
                 where lp.user_id = p_user_id and lp.lesson_id = pro.id
                 order by lp.progress_percent desc nulls last limit 1)
             else 0 end
           ), 0) as progress_sum
      from pro
     group by pro.cert_type
  loop
    if r.total > 0 and r.progress_sum::numeric / r.total >= 90 then
      insert into public.composed_certificate_notices (user_id, course_id, certificate_type, percent)
      values (p_user_id, p_course_id, r.cert_type, round(r.progress_sum::numeric / r.total))
      on conflict do nothing;

      if found then
        select coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.email), ''), 'طالب') into v_student_name
          from public.profiles p where p.id = p_user_id;
        select coalesce(nullif(trim(c.title_ar), ''), nullif(trim(c.title), ''), 'الكورس') into v_course_title
          from public.courses c where c.id = p_course_id;

        perform public.create_admin_event_notification(
          'استحقاق شهادة جديد (يوم واحد + مجاني)',
          coalesce(v_student_name, 'طالب') || ' أنجز ' || round(r.progress_sum::numeric / r.total)::text || '% من الرحلة المتكاملة (' || r.covered || ' من ' || r.total ||
            ' محاضرة مكتملة) في ' || coalesce(v_course_title, 'الكورس') ||
            case when v_is_split then (case when r.cert_type = 'fundamental' then ' (الأساسيات)' else ' (المتقدم)' end) else '' end ||
            ' عن طريق رحلات اليوم الواحد والمجانية (يمكنك إصدار الشهادة من صفحة الشهادات).',
          'admin_certificate_ready',
          '/admin/students/certificates'
        );
      end if;
    end if;
  end loop;
end;
$$;

