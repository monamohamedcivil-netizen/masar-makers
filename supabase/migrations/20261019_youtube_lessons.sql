-- Masar Makers
-- Allow YouTube as a lesson video source (in addition to bunny / external / supabase).
-- Existing rows are unaffected (all current lessons are 'bunny').

alter table public.lessons
  drop constraint if exists lessons_video_provider_check;

alter table public.lessons
  add constraint lessons_video_provider_check
  check (video_provider in ('bunny', 'external', 'supabase', 'youtube'));

notify pgrst, 'reload schema';
