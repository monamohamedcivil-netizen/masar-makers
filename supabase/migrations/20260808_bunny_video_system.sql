-- Masar Makers
-- Final Bunny Stream video integration

alter table public.lessons
  add column if not exists video_provider text not null default 'bunny',
  add column if not exists video_asset_id text,
  add column if not exists video_status text,
  add column if not exists video_duration_seconds int4,
  add column if not exists video_size_bytes int8,
  add column if not exists video_thumbnail_url text,
  add column if not exists video_updated_at timestamptz;

alter table public.lessons
  alter column video_provider set default 'bunny';

alter table public.lessons
  drop constraint if exists lessons_video_provider_check;

alter table public.lessons
  add constraint lessons_video_provider_check
  check (video_provider in ('bunny', 'external', 'supabase'));

create index if not exists lessons_video_asset_id_idx
  on public.lessons(video_asset_id)
  where video_asset_id is not null;

update public.lessons
set video_provider = 'bunny'
where video_provider is null;

notify pgrst, 'reload schema';
