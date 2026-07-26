-- Masar Makers
-- Correct notification destination by journey type.
-- Run this entire file in Supabase > SQL Editor.

create or replace function public.notify_enrollment_activated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_title text;
  v_type text;
  v_action_url text;
  v_journey_type text;
begin
  if new.status = 'active'
     and old.status is distinct from new.status then

    v_title := coalesce(
      nullif(trim(new.action_title), ''),
      'الرحلة التعليمية'
    );

    v_journey_type := lower(
      coalesce(new.journey_type, '')
    );

    if v_journey_type in (
      'workshop',
      'one_day',
      'one_day_journey'
    ) then
      v_type := 'workshop';
      v_action_url := '/dashboard?panel=one-day';

    elsif v_journey_type in (
      'free',
      'free_session',
      'free_journey'
    ) then
      v_type := 'free_session';
      v_action_url := '/dashboard?panel=free';

    else
      v_type := 'journey_available';
      v_action_url := '/dashboard?panel=career';
    end if;

    insert into public.notifications (
      title,
      body,
      type,
      action_url
    )
    values (
      'تم قبول اشتراكك',
      'تم اعتماد اشتراكك في ' || v_title ||
      '. يمكنك الآن بدء رحلتك من لوحة الطالب.',
      v_type,
      v_action_url
    )
    returning id into v_notification_id;

    insert into public.notification_recipients (
      notification_id,
      user_id,
      is_read,
      read_at
    )
    values (
      v_notification_id,
      new.user_id,
      false,
      null
    );
  end if;

  return new;
end;
$$;

-- Fix destinations of existing unread notifications.
update public.notifications
set action_url = case
  when type = 'workshop'
    then '/dashboard?panel=one-day'
  when type = 'free_session'
    then '/dashboard?panel=free'
  when type in (
    'journey',
    'journey_available',
    'journey_update'
  )
    then '/dashboard?panel=career'
  else action_url
end
where type in (
  'workshop',
  'free_session',
  'journey',
  'journey_available',
  'journey_update'
);

notify pgrst, 'reload schema';
