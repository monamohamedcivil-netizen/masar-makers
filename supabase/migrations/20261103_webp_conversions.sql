-- Old course-page images converted to WebP (tool: /admin/settings/webp-images).
-- Keeps old → new paths so the originals can be deleted later, only after they are no longer used.
create table if not exists public.webp_conversions (
  id bigint generated always as identity primary key,
  bucket text not null default 'course-images',
  old_path text not null,
  new_path text not null,
  old_size bigint,
  new_size bigint,
  converted_at timestamptz not null default now(),
  original_deleted_at timestamptz
);
alter table public.webp_conversions enable row level security;
create unique index if not exists webp_conversions_old_path_idx on public.webp_conversions (bucket, old_path);
