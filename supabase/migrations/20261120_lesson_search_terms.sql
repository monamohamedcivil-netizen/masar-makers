-- كلمات البحث لصفحتي رحلات اليوم الواحد والمجانية.
-- كل كلمة تتبع مسارًا مهنيًا، وكل محاضرة قد ترتبط بأكثر من كلمة.
-- تُدار من «الدروس والمحتوى» ← تبويب «تصنيف الرحلات».
-- خطة الرجوع: drop table public.lesson_search_term_links; drop table public.lesson_search_terms;
-- (لا يمس أي جدول موجود، ولا يحذف أي بيانات.)

create table if not exists public.lesson_search_terms (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references public.career_paths(id) on delete cascade,
  title text not null,
  title_en text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (career_path_id, title)
);
alter table public.lesson_search_terms enable row level security;
drop policy if exists lesson_search_terms_public_read on public.lesson_search_terms;
create policy lesson_search_terms_public_read on public.lesson_search_terms for select using (is_active);
create index if not exists lesson_search_terms_path_idx on public.lesson_search_terms (career_path_id, sort_order);

create table if not exists public.lesson_search_term_links (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  term_id uuid not null references public.lesson_search_terms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, term_id)
);
alter table public.lesson_search_term_links enable row level security;
drop policy if exists lesson_search_term_links_public_read on public.lesson_search_term_links;
create policy lesson_search_term_links_public_read on public.lesson_search_term_links for select using (true);
create index if not exists lesson_search_term_links_term_idx on public.lesson_search_term_links (term_id);

-- قائمة مقترحة (تعدّلينها من لوحة التحكم).
insert into public.lesson_search_terms (career_path_id, title, title_en, sort_order)
select p.id, v.t, v.e, v.o
from (values
  ('road-design', 'تصميم الدوارات', 'Roundabout Design', 10),
  ('road-design', 'ارتفاع الظهر عن البطن', 'Superelevation', 20),
  ('road-design', 'تصريف المياه السطحية', 'Surface Drainage', 30),
  ('road-design', 'نهايات الطرق المغلقة', 'Cul-De-Sac', 40),
  ('road-design', 'تسوية مناسيب التقاطعات', 'Intersection Grading', 50),
  ('road-design', 'مواقف المركبات', 'Parking', 60),
  ('road-design', 'مسارات حركة المركبات', 'Swept Path & Vehicle Tracking', 70),
  ('road-design', 'القطاع الطولي', 'Profiles', 80),
  ('road-design', 'القطاعات العرضية', 'Cross Sections', 90),
  ('road-design', 'المحاذاة الأفقية', 'Horizontal Alignment', 100),
  ('road-design', 'الكوريدور', 'Corridor', 110),
  ('road-design', 'العناصر والقطاعات النموذجية', 'Assemblies & Subassemblies', 120),
  ('road-design', 'القوالب وتطبيقها على الشبكة', 'Templates', 130),
  ('road-design', 'الأسطح والتضاريس', 'Surfaces', 140),
  ('road-design', 'الكميات والتقارير', 'Reports & Quantities', 150),
  ('road-design', 'توقيع النقاط والمناسيب', 'Setting Out & Road Levels', 160),
  ('road-design', 'بيانات الرفع المساحي والنقاط', 'Survey Data & Points', 170),
  ('road-design', 'المراجع الخارجية ومشاركة البيانات', 'X-Ref & Data Shortcuts', 180),
  ('road-design', 'نمذجة BIM والمجسمات ثلاثية الأبعاد', 'BIM & 3D Solids', 190),
  ('road-design', 'الرسم والطباعة وإخراج اللوحات', 'Plotting & Sheets', 200),
  ('road-design', 'فحص ومراجعة التصميم', 'Design Checks & Review', 210),
  ('road-design', 'إعداد المشروع والبرنامج', 'Project & Software Setup', 220),
  ('road-design', 'المنحدرات ومداخل المباني', 'Ramps & Driveways', 230),
  ('road-design', 'عارض النموذج', 'Model Viewer', 240),
  ('traffic-engineering', 'إدارة البيانات', 'Data Manager', 10),
  ('traffic-engineering', 'نمذجة الطرق السريعة', 'Highway Model', 20),
  ('traffic-engineering', 'الكتالوج', 'Catalog', 30),
  ('traffic-engineering', 'أدوات CUBE', 'CUBE Tools', 40)
) as v(slug, t, e, o)
join public.career_paths p on p.slug = v.slug
on conflict (career_path_id, title) do nothing;

-- ربط أولي بالمحاضرات حسب عناوينها (عربي أو إنجليزي).
with pat(slug, term, pattern) as (values
  ('road-design','تصميم الدوارات','%roundabout%'),
  ('road-design','ارتفاع الظهر عن البطن','%superelevation%'),
  ('road-design','تصريف المياه السطحية','%drainage%'),
  ('road-design','نهايات الطرق المغلقة','%cul de sac%'),
  ('road-design','نهايات الطرق المغلقة','%cul-de-sac%'),
  ('road-design','تسوية مناسيب التقاطعات','%grading intersection%'),
  ('road-design','تسوية مناسيب التقاطعات','%intersection grading%'),
  ('road-design','تسوية مناسيب التقاطعات','%design road intersections%'),
  ('road-design','مواقف المركبات','%parking%'),
  ('road-design','مسارات حركة المركبات','%swept path%'),
  ('road-design','مسارات حركة المركبات','%vehicle tracking%'),
  ('road-design','القطاع الطولي','%profile%'),
  ('road-design','القطاعات العرضية','%cross section%'),
  ('road-design','القطاعات العرضية','%quick section%'),
  ('road-design','القطاعات العرضية','%intelligent sections%'),
  ('road-design','القطاعات العرضية','%section editor%'),
  ('road-design','المحاذاة الأفقية','%alignment%'),
  ('road-design','الكوريدور','%corridor%'),
  ('road-design','العناصر والقطاعات النموذجية','%assembl%'),
  ('road-design','القوالب وتطبيقها على الشبكة','%template%'),
  ('road-design','الأسطح والتضاريس','%surface%'),
  ('road-design','الكميات والتقارير','%quantit%'),
  ('road-design','الكميات والتقارير','%reports%'),
  ('road-design','توقيع النقاط والمناسيب','%setting out%'),
  ('road-design','توقيع النقاط والمناسيب','%setting-out%'),
  ('road-design','توقيع النقاط والمناسيب','%road levels%'),
  ('road-design','بيانات الرفع المساحي والنقاط','%survey%'),
  ('road-design','المراجع الخارجية ومشاركة البيانات','%x-ref%'),
  ('road-design','المراجع الخارجية ومشاركة البيانات','%external reference%'),
  ('road-design','المراجع الخارجية ومشاركة البيانات','%data shortcuts%'),
  ('road-design','المراجع الخارجية ومشاركة البيانات','%data shourtcuts%'),
  ('road-design','نمذجة BIM والمجسمات ثلاثية الأبعاد','%bim model%'),
  ('road-design','نمذجة BIM والمجسمات ثلاثية الأبعاد','%3d solids%'),
  ('road-design','نمذجة BIM والمجسمات ثلاثية الأبعاد','%3d blocks%'),
  ('road-design','نمذجة BIM والمجسمات ثلاثية الأبعاد','%create model%'),
  ('road-design','نمذجة BIM والمجسمات ثلاثية الأبعاد','%total csd model%'),
  ('road-design','الرسم والطباعة وإخراج اللوحات','%plotting%'),
  ('road-design','الرسم والطباعة وإخراج اللوحات','%plan profile%'),
  ('road-design','الرسم والطباعة وإخراج اللوحات','%plan cuts%'),
  ('road-design','الرسم والطباعة وإخراج اللوحات','%general plan%'),
  ('road-design','فحص ومراجعة التصميم','%review & checks%'),
  ('road-design','فحص ومراجعة التصميم','%design analysis%'),
  ('road-design','فحص ومراجعة التصميم','%driveway checking%'),
  ('road-design','إعداد المشروع والبرنامج','%introduction%'),
  ('road-design','إعداد المشروع والبرنامج','%project setup%'),
  ('road-design','إعداد المشروع والبرنامج','%02- setting%'),
  ('road-design','إعداد المشروع والبرنامج','%files preparation%'),
  ('road-design','المنحدرات ومداخل المباني','%layback%'),
  ('road-design','المنحدرات ومداخل المباني','%driveway%'),
  ('road-design','عارض النموذج','%model viewer%'),
  ('traffic-engineering','إدارة البيانات','%data manager%'),
  ('traffic-engineering','نمذجة الطرق السريعة','%hw model%'),
  ('traffic-engineering','الكتالوج','%catalog%'),
  ('traffic-engineering','أدوات CUBE','%cube tools%')
)
insert into public.lesson_search_term_links (lesson_id, term_id)
select distinct l.id, t.id
from pat
join public.career_paths cp on cp.slug = pat.slug
join public.lesson_search_terms t on t.career_path_id = cp.id and t.title = pat.term
join public.courses c on c.career_path_id = cp.id
join public.lessons l on l.course_id = c.id
  and (coalesce(l.title, '') ilike pat.pattern or coalesce(l.title_ar, '') ilike pat.pattern)
on conflict do nothing;
