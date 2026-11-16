-- Website chat follow-up v3
--  1) No follow-up at all for the Masar Makers team / Mona (admin role or an email in
--     web_chat_settings.team_emails). Their open follow-ups are closed (reason = team).
--  2) Every course the student asked about is remembered on the session (course_ids)
--     and ONE grouped follow-up mentions all of them (not only the last course).
--  3) web_chat_followups_preview(): dry run — shows what would be sent, writes nothing.
-- Rollback: see the bottom of this file.

-- 1) Team accounts (editable later from SQL / admin).
alter table public.web_chat_settings
  add column if not exists team_emails text[] not null default array[
    'mona.mohamed.civil@gmail.com',
    'mona_abdallah2013@hotmail.com',
    'mona.abdallah.civil@gmail.com',
    'mobility.makers.civil@gmail.com',
    'mino.moor22@gmail.com',
    'm.f.sherif@gmail.com'
  ];

create or replace function public.web_chat_is_team(p_user uuid, p_contact uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from profiles p
     where p.id in (
             p_user,
             (select c.user_id from web_chat_contacts c where c.id = p_contact)
           )
       and (
             p.role::text in ('admin', 'super_admin')
             or lower(p.email) = any (
                  select lower(e) from unnest(coalesce((select team_emails from web_chat_settings where id = 1), '{}')) e
                )
           )
  );
$$;
revoke all on function public.web_chat_is_team(uuid, uuid) from public, anon, authenticated;
grant execute on function public.web_chat_is_team(uuid, uuid) to service_role;

-- 2) All the courses asked about in a chat (in order, no duplicates).
alter table public.web_chat_sessions
  add column if not exists course_ids uuid[] not null default '{}';

-- Backfill: courses opened in each chat + the current course.
with opened as (
  select m.session_id, (substring(m.action_id from 8))::uuid as course_id, min(m.created_at) as first_at
    from web_chat_messages m
   where m.action_id ~ '^course:[0-9a-fA-F-]{36}$'
   group by 1, 2
)
update web_chat_sessions s
   set course_ids = x.ids
  from (
    select s2.id,
           array(
             select c from (
               select o.course_id as c, o.first_at as t from opened o where o.session_id = s2.id
               union all
               select s2.current_course_id, 'infinity'::timestamptz where s2.current_course_id is not null
             ) z
             where exists (select 1 from whatsapp_courses w where w.id = z.c)
             group by c
             order by min(t)
           ) as ids
      from web_chat_sessions s2
  ) x
 where x.id = s.id
   and cardinality(x.ids) > 0
   and s.course_ids = '{}';

-- 3) One plan used by both the real runner and the dry-run preview.
create or replace function public.web_chat_followup_plan()
returns table (
  session_id uuid,
  session_code text,
  user_id uuid,
  is_team boolean,
  en boolean,
  step integer,
  course_titles text[],
  msg text,
  btns jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cfg record;
  s record;
  list text[];
  titles text[];
  ids uuid[];
  joined text;
  b jsonb;
  i integer;
begin
  select * into cfg from web_chat_settings where id = 1;
  if cfg is null then return; end if;

  for s in
    select * from web_chat_sessions ws
     where ws.followup_status = 'active'
       and ws.followup_count < cfg.followup_max
       and ws.followup_next_at <= now()
     order by ws.followup_next_at
     limit 200
  loop
    session_id := s.id;
    session_code := s.code;
    user_id := s.user_id;
    is_team := web_chat_is_team(s.user_id, s.contact_id);
    en := coalesce(s.locale, 'ar') = 'en';
    step := s.followup_count + 1;

    ids := case when cardinality(s.course_ids) > 0 then s.course_ids
                when s.current_course_id is not null then array[s.current_course_id]
                else '{}'::uuid[] end;
    select coalesce(array_agg(w.id order by array_position(ids, w.id)), '{}'),
           coalesce(array_agg(coalesce(nullif(w.whatsapp_label, ''), w.title) order by array_position(ids, w.id)), '{}')
      into ids, titles
      from whatsapp_courses w
     where w.id = any (ids);
    course_titles := titles;

    joined := case
      when cardinality(titles) = 0 then case when en then 'your request' else 'طلبك' end
      when cardinality(titles) = 1 then titles[1]
      else array_to_string(titles[1:cardinality(titles) - 1], case when en then ', ' else '، ' end)
           || case when en then '* and *' else '* و *' end || titles[cardinality(titles)]
    end;

    list := case when en and coalesce(array_length(cfg.followup_messages_en, 1), 0) > 0
                 then cfg.followup_messages_en else cfg.followup_messages end;
    msg := coalesce(
      list[least(step, coalesce(array_length(list, 1), 1))],
      case when en then '👋 Still interested in *{course}*?' else '👋 لسه مهتم بـ *{course}*؟' end
    );
    msg := replace(msg, '{course}', joined);

    if cardinality(ids) = 1 then
      btns := jsonb_build_array(
        jsonb_build_object('id', 'course:' || ids[1], 'label', case when en then '📘 Course details & price' else '📘 تفاصيل وسعر الكورس' end),
        jsonb_build_object('id', 'handoff:subscribe', 'label', case when en then '✅ Subscribe now' else '✅ اشترك الآن' end, 'kind', 'handoff'),
        jsonb_build_object('id', 'handoff:support', 'label', case when en then '👩‍💼 Customer service' else '👩‍💼 خدمة العملاء' end, 'kind', 'handoff')
      );
    elsif cardinality(ids) > 1 then
      b := '[]'::jsonb;
      for i in 1 .. least(cardinality(ids), 4) loop
        b := b || jsonb_build_array(jsonb_build_object('id', 'course:' || ids[i], 'label', '📘 ' || titles[i]));
      end loop;
      btns := b || jsonb_build_array(
        jsonb_build_object('id', 'courses', 'label', case when en then '📚 All courses & prices' else '📚 كل الكورسات والأسعار' end),
        jsonb_build_object('id', 'handoff:support', 'label', case when en then '👩‍💼 Customer service' else '👩‍💼 خدمة العملاء' end, 'kind', 'handoff')
      );
    else
      btns := jsonb_build_array(
        jsonb_build_object('id', 'courses', 'label', case when en then '📚 Courses & prices' else '📚 الكورسات والأسعار' end),
        jsonb_build_object('id', 'handoff:support', 'label', case when en then '👩‍💼 Customer service' else '👩‍💼 خدمة العملاء' end, 'kind', 'handoff')
      );
    end if;

    return next;
  end loop;
end;
$$;
revoke all on function public.web_chat_followup_plan() from public, anon, authenticated;

-- Dry run: what WOULD be sent now (nothing is written). Usage: select * from web_chat_followups_preview();
create or replace function public.web_chat_followups_preview()
returns table (session_code text, is_team boolean, step integer, course_titles text[], msg text, btns jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.session_code, p.is_team, p.step, p.course_titles, p.msg, p.btns from web_chat_followup_plan() p;
$$;
revoke all on function public.web_chat_followups_preview() from public, anon, authenticated;

-- The hourly runner (same name / signature, pg_cron job unchanged).
create or replace function public.web_chat_run_followups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
  p record;
  notif_id uuid;
  sent integer := 0;
begin
  select * into cfg from web_chat_settings where id = 1;
  if cfg is null then return 0; end if;

  -- Team / Mona: never followed up.
  update web_chat_sessions ws
     set followup_status = 'closed', followup_closed_reason = 'team',
         followup_closed_at = now(), followup_next_at = null
   where ws.followup_status = 'active'
     and web_chat_is_team(ws.user_id, ws.contact_id);

  update web_chat_sessions
     set followup_status = 'closed', followup_closed_reason = 'no_reply',
         followup_closed_at = now(), followup_next_at = null
   where followup_status = 'active'
     and followup_count >= cfg.followup_max
     and followup_next_at <= now();

  for p in select * from web_chat_followup_plan() where not is_team loop
    insert into web_chat_messages (session_id, sender, body, buttons, action_id)
    values (p.session_id, 'bot', p.msg, p.btns, 'followup:' || p.step);

    if p.user_id is not null then
      insert into notifications (title, body, type, action_url)
      values (
        case when p.en then '💬 A message from the Masar Makers assistant' else '💬 رسالة من مساعد Masar Makers' end,
        left(regexp_replace(p.msg, '\*', '', 'g'), 300),
        'announcement',
        '/?chat=' || p.session_id
      )
      returning id into notif_id;
      insert into notification_recipients (notification_id, user_id) values (notif_id, p.user_id)
      on conflict do nothing;
    end if;

    update web_chat_sessions
       set followup_count = followup_count + 1,
           followup_last_at = now(),
           followup_next_at = now() + make_interval(days => cfg.followup_every_days),
           message_count = message_count + 1,
           has_unseen = true,
           updated_at = now()
     where id = p.session_id;

    sent := sent + 1;
  end loop;

  return sent;
end;
$$;
revoke all on function public.web_chat_run_followups() from public, anon, authenticated;

-- Rollback (if ever needed): re-run the web_chat_run_followups() body from
-- 20261027_web_chat_english.sql, then:
--   drop function if exists public.web_chat_followups_preview();
--   drop function if exists public.web_chat_followup_plan();
--   drop function if exists public.web_chat_is_team(uuid, uuid);
-- (the new columns course_ids / team_emails are harmless and can stay.)
