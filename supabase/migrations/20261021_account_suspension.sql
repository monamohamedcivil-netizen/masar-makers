-- إيقاف الحساب: يوقف كل اشتراكات الطالب ويحفظ حالتها السابقة لإعادتها كما كانت عند التفعيل.

alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspension_reason text;
alter table public.profiles add column if not exists suspended_by uuid;

create table if not exists public.account_suspension_enrollments (
  enrollment_id uuid primary key references public.enrollments(id) on delete cascade,
  user_id uuid not null,
  previous_status text not null,
  suspended_at timestamptz not null default now()
);
create index if not exists account_suspension_enrollments_user_idx
  on public.account_suspension_enrollments(user_id);

create table if not exists public.account_suspension_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null check (action in ('suspend','restore')),
  reason text,
  performed_by uuid,
  created_at timestamptz not null default now()
);

alter table public.account_suspension_enrollments enable row level security;
alter table public.account_suspension_log enable row level security;

create or replace function public.admin_suspend_account(p_user uuid, p_reason text, p_by uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.account_suspension_enrollments (enrollment_id, user_id, previous_status)
  select id, user_id, status::text
  from public.enrollments
  where user_id = p_user
    and status::text not in ('suspended','rejected','expired','cancelled')
  on conflict (enrollment_id) do update
    set previous_status = excluded.previous_status, suspended_at = now();

  -- لا نُرسل إشعارات أو تنبيهات عن هذا التغيير الإداري.
  set local session_replication_role = replica;

  update public.enrollments e
  set status = 'suspended'::public.enrollment_status, updated_at = now()
  from public.account_suspension_enrollments s
  where s.enrollment_id = e.id
    and s.user_id = p_user
    and e.status::text <> 'suspended';
  get diagnostics v_count = row_count;

  set local session_replication_role = origin;

  update public.profiles
  set is_active = false,
      suspended_at = now(),
      suspension_reason = p_reason,
      suspended_by = p_by
  where id = p_user;

  insert into public.account_suspension_log (user_id, action, reason, performed_by)
  values (p_user, 'suspend', p_reason, p_by);

  return v_count;
end;
$$;

create or replace function public.admin_restore_account(p_user uuid, p_by uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  set local session_replication_role = replica;

  -- نعيد فقط الاشتراكات التي ما زالت موقوفة (لو غيّرها المشرف يدويًا نتركها).
  update public.enrollments e
  set status = s.previous_status::public.enrollment_status, updated_at = now()
  from public.account_suspension_enrollments s
  where s.enrollment_id = e.id
    and s.user_id = p_user
    and e.status::text = 'suspended';
  get diagnostics v_count = row_count;

  set local session_replication_role = origin;

  delete from public.account_suspension_enrollments where user_id = p_user;

  update public.profiles
  set is_active = true,
      suspended_at = null,
      suspension_reason = null,
      suspended_by = null
  where id = p_user;

  insert into public.account_suspension_log (user_id, action, performed_by)
  values (p_user, 'restore', p_by);

  return v_count;
end;
$$;

revoke all on function public.admin_suspend_account(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_restore_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_suspend_account(uuid, text, uuid) to service_role;
grant execute on function public.admin_restore_account(uuid, uuid) to service_role;
