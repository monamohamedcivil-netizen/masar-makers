-- فيديوهات أقسام المحطة في صفحة «رحلة الاحتراف المتكاملة»
-- (محاور الرحلة / نتائج الرحلة / هدايا الرحلة / المحاضرة الأولى / مشاريع المتدربين).
-- كل عنصر إما رابط يوتيوب أو محاضرة موجودة. تُدار من «الدروس والمحتوى» ← تبويب «أقسام المحطات».
-- خطة الرجوع: drop table public.station_section_items;
-- (جدول جديد فقط، لا يمس أي جدول موجود ولا يحذف بيانات.)

create table if not exists public.station_section_items (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.course_stations(id) on delete cascade,
  section_key text not null check (section_key in ('professional','outcome','gifts','free','reviews')),
  kind text not null check (kind in ('youtube','lesson')),
  title text,
  youtube_url text,
  lesson_id uuid references public.lessons(id) on delete cascade,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'youtube' and youtube_url is not null) or (kind = 'lesson' and lesson_id is not null))
);

alter table public.station_section_items enable row level security;
drop policy if exists station_section_items_public_read on public.station_section_items;
create policy station_section_items_public_read on public.station_section_items for select using (is_active);

create index if not exists station_section_items_idx
  on public.station_section_items (station_id, section_key, sort_order);
