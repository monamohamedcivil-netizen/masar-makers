-- Masar Makers
-- تحسينات الإشعارات:
--  1) إشعار طلب الاشتراك للأدمن يذكر نوع الرحلة (متكاملة / يوم واحد / مجانية ...).
--  2) إشعار رفع مشروع للأدمن: مشروع واحد يعطي إشعارًا واحدًا (كان هناك Trigger مكرر)
--     ولا يُرسل للمشاريع المستوردة من الإدارة.
--  3) إشعار للطالب عند اعتماد مشروعه (مع ذكر 50 نقطة إن كانت الرحلة احترافية).
-- لا تغيير على أي بيانات موجودة.

-- (1) نوع الرحلة في إشعار طلب الاشتراك
create or replace function public.notify_admin_new_enrollment_request()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_student_name text;
  v_course_title text;
  v_journey_label text;
begin
  if public.current_actor_is_admin() then
    return new;
  end if;

  if lower(coalesce(new.status::text, '')) <> 'pending' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and lower(coalesce(old.status::text, '')) = 'pending' then
    return new;
  end if;

  select coalesce(
    nullif(trim(p.full_name), ''),
    nullif(trim(new.student_name), ''),
    nullif(trim(new.student_email), ''),
    'طالب'
  )
  into v_student_name
  from public.profiles p
  where p.id = new.user_id;

  v_student_name := coalesce(
    v_student_name,
    nullif(trim(new.student_name), ''),
    nullif(trim(new.student_email), ''),
    'طالب'
  );

  select coalesce(
    nullif(trim(c.title_ar), ''),
    nullif(trim(c.title), ''),
    nullif(trim(new.course_title), ''),
    'الكورس'
  )
  into v_course_title
  from public.courses c
  where c.id = new.course_id;

  v_course_title := coalesce(
    v_course_title,
    nullif(trim(new.course_title), ''),
    'الكورس'
  );

  v_journey_label := case lower(coalesce(new.journey_type, ''))
    when 'fundamental' then 'رحلة الأساسيات'
    when 'fundamentals' then 'رحلة الأساسيات'
    when 'advanced' then 'الرحلة المتقدمة'
    when 'integrated' then 'رحلة الاحتراف المتكاملة'
    when 'professional' then 'رحلة الاحتراف المتكاملة'
    when 'career_path' then 'رحلة الاحتراف المتكاملة'
    when 'workshop' then 'رحلة اليوم الواحد'
    when 'one_day' then 'رحلة اليوم الواحد'
    when 'one-day' then 'رحلة اليوم الواحد'
    when 'free' then 'الرحلة المجانية'
    when 'free_session' then 'الرحلة المجانية'
    else nullif(trim(new.journey_title), '')
  end;

  perform public.create_admin_event_notification(
    'طلب اشتراك جديد',
    v_student_name || ' أرسل طلب اشتراك في ' || v_course_title
      || coalesce(' — ' || v_journey_label, '') || '.',
    'admin_enrollment_request',
    '/admin/students/enrollment-requests'
  );

  return new;
end;
$function$;

-- (2) إشعار رفع مشروع: Trigger واحد فقط، يتجاهل المشاريع المستوردة
drop trigger if exists trg_notify_admins_project_submitted on public.student_projects;

create or replace function public.notify_admin_new_project()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_student_name text;
  v_course_title text;
  v_project_title text;
begin
  if public.current_actor_is_admin() then
    return new;
  end if;

  if coalesce(new.source, '') = 'admin_import' then
    return new;
  end if;

  select coalesce(
    nullif(trim(p.full_name), ''),
    nullif(trim(new.student_name), ''),
    nullif(trim(new.student_email), ''),
    'طالب'
  )
  into v_student_name
  from public.profiles p
  where p.id = new.user_id;

  v_student_name := coalesce(
    v_student_name,
    nullif(trim(new.student_name), ''),
    nullif(trim(new.student_email), ''),
    'طالب'
  );

  select coalesce(
    nullif(trim(c.title_ar), ''),
    nullif(trim(c.title), ''),
    nullif(trim(new.course_title), ''),
    'الكورس'
  )
  into v_course_title
  from public.courses c
  where c.id = new.course_id;

  v_course_title := coalesce(v_course_title, 'الكورس');
  v_project_title := coalesce(
    nullif(trim(new.project_title), ''),
    'مشروع جديد'
  );

  perform public.create_admin_event_notification(
    'مشروع جديد بانتظار الاعتماد',
    v_student_name || ' رفع مشروع "' || v_project_title
      || '" للاعتماد في كورس ' || v_course_title || '.',
    'admin_project_submitted',
    '/admin/students/projects'
  );

  return new;
end;
$function$;

-- (3) إشعار للطالب عند اعتماد مشروعه
create or replace function public.notify_student_project_approved()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_notification_id uuid;
  v_course_title text;
  v_project_title text;
  v_body text;
  v_gives_points boolean := false;
begin
  if new.user_id is null
     or coalesce(new.source, '') = 'admin_import' then
    return new;
  end if;

  select coalesce(
    nullif(trim(c.title_ar), ''),
    nullif(trim(c.title), ''),
    nullif(trim(new.course_title), ''),
    'الكورس'
  )
  into v_course_title
  from public.courses c
  where c.id = new.course_id;

  v_course_title := coalesce(
    v_course_title,
    nullif(trim(new.course_title), ''),
    'الكورس'
  );

  v_project_title := coalesce(
    nullif(trim(new.project_title), ''),
    'مشروعك'
  );

  -- نفس شرط جواز السفر: النقاط فقط لو الرحلة احترافية وفعّالة.
  select exists (
    select 1
    from public.enrollments e
    where e.id = new.enrollment_id
      and lower(coalesce(e.status::text, '')) in
        ('approved', 'active', 'enrolled', 'confirmed', 'completed')
      and lower(coalesce(e.journey_type, '')) not in
        ('workshop', 'one_day', 'one-day', 'one_day_workshop',
         'one-day-workshop', 'free', 'free_session', 'free-session',
         'free_journey', 'free-journey')
  )
  into v_gives_points;

  v_body :=
    'مبروك! تم اعتماد مشروع "' || v_project_title || '" في ' || v_course_title
    || case
         when v_gives_points
           then ' وحصلت على 50 نقطة إضافية تزيد فرصك في السحب الشهري.'
         else '.'
       end;

  insert into public.notifications (title, body, type, action_url)
  values (
    'تم اعتماد مشروعك 🎉',
    v_body,
    'project_approved',
    '/dashboard?panel=projects'
  )
  returning id into v_notification_id;

  insert into public.notification_recipients (notification_id, user_id, is_read)
  values (v_notification_id, new.user_id, false);

  return new;
end;
$function$;

drop trigger if exists trg_notify_student_project_approved on public.student_projects;

create trigger trg_notify_student_project_approved
  after update of status on public.student_projects
  for each row
  when (new.status = 'approved' and old.status is distinct from new.status)
  execute function public.notify_student_project_approved();
