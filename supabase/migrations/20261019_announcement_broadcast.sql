-- Masar Makers
-- Track when an announcement was broadcast to students (platform notification + email),
-- so it can never be sent twice by mistake.

alter table public.platform_announcements
  add column if not exists notified_at timestamptz,
  add column if not exists emailed_at timestamptz,
  add column if not exists email_sent_count integer,
  add column if not exists email_failed_count integer;

notify pgrst, 'reload schema';
