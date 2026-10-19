-- عدّاد تشغيل المحاضرات: صف لكل (محاضرة، طالب) فيه عدد مرات التشغيل.
create table if not exists public.lesson_play_counts (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null,
  play_count integer not null default 0,
  first_played_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);

alter table public.lesson_play_counts enable row level security;
-- بلا سياسات: القراءة والكتابة عبر service role فقط (لوحة الإدارة والسيرفر).

create or replace function public.increment_lesson_play(p_lesson uuid, p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.lesson_play_counts (lesson_id, user_id, play_count)
  values (p_lesson, p_user, 1)
  on conflict (lesson_id, user_id)
  do update set play_count = public.lesson_play_counts.play_count + 1,
                last_played_at = now();
$$;

revoke all on function public.increment_lesson_play(uuid, uuid) from public, anon, authenticated;
grant execute on function public.increment_lesson_play(uuid, uuid) to service_role;
