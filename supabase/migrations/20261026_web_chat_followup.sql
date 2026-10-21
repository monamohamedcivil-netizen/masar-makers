-- Website chat v2: one locked currency per student, per-button welcome messages,
-- and automatic follow-up (every 3 days, 3 times, then auto-close).

-- 1) Students of the website chat (logged-in user or anonymous browser).
create table if not exists public.web_chat_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  visitor_id text unique,
  currency text,                         -- SAR | EGP ... locked after the first choice
  currency_set_at timestamptz,
  currency_set_by text,                  -- student | admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.web_chat_contacts enable row level security;

-- 2) Session state for summaries and follow-up.
alter table public.web_chat_sessions
  add column if not exists contact_id uuid references public.web_chat_contacts(id) on delete set null,
  add column if not exists variant_id uuid,
  add column if not exists last_price jsonb,                 -- {course, variant, currency, amount, label, offer}
  add column if not exists last_visitor_at timestamptz,
  add column if not exists followup_status text not null default 'none'
    check (followup_status in ('none', 'active', 'closed')),
  add column if not exists followup_count integer not null default 0,
  add column if not exists followup_next_at timestamptz,
  add column if not exists followup_last_at timestamptz,
  add column if not exists followup_closed_at timestamptz,
  add column if not exists followup_closed_reason text,       -- no_reply | admin | new_chat
  add column if not exists has_unseen boolean not null default false;

create index if not exists web_chat_sessions_followup_idx
  on public.web_chat_sessions (followup_next_at) where followup_status = 'active';
create index if not exists web_chat_sessions_contact_idx on public.web_chat_sessions (contact_id);

alter table public.web_chat_messages
  add column if not exists buttons jsonb;

-- 3) First message for every platform button (editable from the admin page).
create table if not exists public.web_chat_entry_points (
  entry_key text primary key,
  label text not null,
  welcome_text text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.web_chat_entry_points enable row level security;

insert into public.web_chat_entry_points (entry_key, label, welcome_text) values
  ('contact', 'زر التواصل / الاستفسار العام',
   'أهلًا بك في Masar Makers 👋' || chr(10) || 'أنا مساعد المنصة، وهساعدك تعرف كل حاجة عن الكورسات والأسعار في ثواني.'),
  ('course_action', 'أزرار الإجراءات داخل الكورس',
   'أهلًا بك 👋 وصلنا طلبك بخصوص *{action}*.' || chr(10) || 'دي كل المعلومات اللي محتاجها عن الكورس 👇'),
  ('enrollment', 'زر طلب الاشتراك',
   'تم تسجيل طلب اشتراكك بنجاح ✅' || chr(10) || 'راجع تفاصيل الاشتراك والسعر، ولما تكون جاهز اضغط «اشترك الآن» وهنكمل معاك الدفع على واتساب.'),
  ('launcher', 'زر المساعد العائم',
   'أهلًا بك في Masar Makers 👋 اختار استفسارك من القائمة.')
on conflict (entry_key) do nothing;

-- 4) Follow-up settings + messages (editable from the admin page).
create table if not exists public.web_chat_settings (
  id integer primary key default 1 check (id = 1),
  followup_every_days integer not null default 3,
  followup_max integer not null default 3,
  followup_messages text[] not null default array[
    '👋 أهلًا من جديد! كنت بتسأل عن *{course}*. لو لسه مهتم تقدر تكمل الاشتراك من هنا، أو تشوف التفاصيل والسعر تاني 👇',
    '📌 تذكير: مكانك في *{course}* لسه متاح. لو عندك أي سؤال قبل الاشتراك اختار «خدمة العملاء» وهنرد عليك.',
    '⏳ آخر تذكير بخصوص *{course}*. لو حابب تكمل اضغط «اشترك الآن» 👇 وبعد كده مش هنزعجك تاني.'
  ],
  updated_at timestamptz not null default now()
);
alter table public.web_chat_settings enable row level security;
insert into public.web_chat_settings (id) values (1) on conflict (id) do nothing;

-- 5) Follow-up runner (pg_cron, hourly). Sends a bot message inside the platform chat
--    and a platform notification (logged-in students); closes after the last one.
create or replace function public.web_chat_run_followups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
  s record;
  course_title text;
  msg text;
  btns jsonb;
  notif_id uuid;
  sent integer := 0;
begin
  select * into cfg from web_chat_settings where id = 1;
  if cfg is null then return 0; end if;

  -- No answer after the last follow-up → close automatically.
  update web_chat_sessions
     set followup_status = 'closed', followup_closed_reason = 'no_reply',
         followup_closed_at = now(), followup_next_at = null
   where followup_status = 'active'
     and followup_count >= cfg.followup_max
     and followup_next_at <= now();

  for s in
    select * from web_chat_sessions
     where followup_status = 'active'
       and followup_count < cfg.followup_max
       and followup_next_at <= now()
     order by followup_next_at
     limit 200
  loop
    course_title := null;
    if s.current_course_id is not null then
      select coalesce(nullif(whatsapp_label, ''), title) into course_title
        from whatsapp_courses where id = s.current_course_id;
    end if;

    msg := coalesce(
      cfg.followup_messages[least(s.followup_count + 1, coalesce(array_length(cfg.followup_messages, 1), 1))],
      '👋 لسه مهتم بـ *{course}*؟'
    );
    msg := replace(msg, '{course}', coalesce(course_title, 'طلبك'));

    if s.current_course_id is not null then
      btns := jsonb_build_array(
        jsonb_build_object('id', 'course:' || s.current_course_id, 'label', '📘 تفاصيل وسعر الكورس'),
        jsonb_build_object('id', 'handoff:subscribe', 'label', '✅ اشترك الآن', 'kind', 'handoff'),
        jsonb_build_object('id', 'handoff:support', 'label', '👩‍💼 خدمة العملاء', 'kind', 'handoff')
      );
    else
      btns := jsonb_build_array(
        jsonb_build_object('id', 'courses', 'label', '📚 الكورسات والأسعار'),
        jsonb_build_object('id', 'handoff:support', 'label', '👩‍💼 خدمة العملاء', 'kind', 'handoff')
      );
    end if;

    insert into web_chat_messages (session_id, sender, body, buttons, action_id)
    values (s.id, 'bot', msg, btns, 'followup:' || (s.followup_count + 1));

    if s.user_id is not null then
      insert into notifications (title, body, type, action_url)
      values (
        '💬 رسالة من مساعد Masar Makers',
        left(regexp_replace(msg, '\*', '', 'g'), 300),
        'announcement',
        '/?chat=' || s.id
      )
      returning id into notif_id;
      insert into notification_recipients (notification_id, user_id) values (notif_id, s.user_id)
      on conflict do nothing;
    end if;

    update web_chat_sessions
       set followup_count = followup_count + 1,
           followup_last_at = now(),
           followup_next_at = now() + make_interval(days => cfg.followup_every_days),
           message_count = message_count + 1,
           has_unseen = true,
           updated_at = now()
     where id = s.id;

    sent := sent + 1;
  end loop;

  return sent;
end;
$$;

revoke all on function public.web_chat_run_followups() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'web-chat-followups';
select cron.schedule('web-chat-followups', '7 * * * *', 'select public.web_chat_run_followups()');

-- 6) Who sees the ANSWER of each bot question in the website chat:
--    all = everyone (visitor + registered), members = registered students only
--    (visitors see the question but get "please register to see ...").
alter table public.whatsapp_menu_items
  add column if not exists web_visibility text not null default 'all'
  check (web_visibility in ('all', 'members'));

update public.whatsapp_menu_items i
   set web_visibility = 'members'
  from public.whatsapp_menus m
 where m.id = i.menu_id
   and (i.action_type in ('show_price', 'subscribe')
        or (m.menu_key = 'course_actions' and i.item_key = 'course_price'));

insert into public.web_chat_entry_points (entry_key, label, welcome_text) values
  ('members_only', 'رسالة الزائر غير المسجّل (أسئلة المشتركين فقط)',
   '🔒 الأسعار وتفاصيل الاشتراك متاحة للمسجّلين على المنصة فقط.' || chr(10) || 'سجّل حسابك مجانًا في أقل من دقيقة، وبعدها ارجع هنا وهتلاقي كل الأسعار بعملتك 👇')
on conflict (entry_key) do nothing;
