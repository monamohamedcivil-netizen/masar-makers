-- Lecture topics (design steps) per career path; a lecture may have several topics (lesson_topic_links) — used by the one-day / free journeys pages.
-- Editable from «الدروس والمحتوى» (rename / add topics, change a lecture's topic).
create table if not exists public.lesson_topics (
  id uuid primary key default gen_random_uuid(),
  career_path_id uuid not null references public.career_paths(id) on delete cascade,
  title text not null,
  title_en text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lesson_topics enable row level security;
drop policy if exists lesson_topics_public_read on public.lesson_topics;
create policy lesson_topics_public_read on public.lesson_topics for select using (is_active);
create index if not exists lesson_topics_path_idx on public.lesson_topics (career_path_id, sort_order);

-- A lecture can belong to more than one topic.
create table if not exists public.lesson_topic_links (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  topic_id uuid not null references public.lesson_topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lesson_id, topic_id)
);
alter table public.lesson_topic_links enable row level security;
drop policy if exists lesson_topic_links_public_read on public.lesson_topic_links;
create policy lesson_topic_links_public_read on public.lesson_topic_links for select using (true);
create index if not exists lesson_topic_links_topic_idx on public.lesson_topic_links (topic_id);

insert into public.lesson_topics (career_path_id, title, title_en, sort_order) values
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'البداية وتجهيز بيانات المشروع', 'Getting started & project data', 10),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'تصميم عناصر الطريق', 'Designing road elements', 20),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'التقاطعات والدوارات والنهايات المغلقة', 'Intersections, roundabouts & cul-de-sacs', 30),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'التحقق من صحة التصميم', 'Design checks', 40),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'محاكاة حركة المركبات', 'Vehicle movement simulation', 50),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'مخرجات حزمة الطرق الاحترافية', 'Professional road deliverables', 60),
  ('4e1d804d-4daa-4ff0-b48e-11f458ee0fb7', 'نمذجة شبكات الطرق BIM', 'BIM road network modeling', 70),
  ('83099f73-6a0f-4ae1-b0fc-ea4e214a837c', 'تجهيز بيانات شبكة النقل', 'Transport network data', 10),
  ('83099f73-6a0f-4ae1-b0fc-ea4e214a837c', 'نمذجة الطلب المروري', 'Travel demand modeling', 20);

with m(lesson_id, topic) as (values
  -- البداية وتجهيز بيانات المشروع
  ('fbc4d853-1f81-4ed0-9c2e-a96cea0f0635'::uuid, 'البداية وتجهيز بيانات المشروع'),
  ('1abd6aed-39d1-487d-aca5-607310b7ce7f', 'البداية وتجهيز بيانات المشروع'),
  ('11d5f5bf-8c47-4077-abaa-a1673d26b6d7', 'البداية وتجهيز بيانات المشروع'),
  ('dc7aac9e-d5c5-47c5-8bf8-3973ff1b10c4', 'البداية وتجهيز بيانات المشروع'),
  ('2fc09ec0-fba1-4e23-8dd5-d3d03a4b3a1e', 'البداية وتجهيز بيانات المشروع'),
  ('d0fb2ea8-2b1c-4bb9-9f2e-2ea93653986e', 'البداية وتجهيز بيانات المشروع'),
  ('4d4e25bf-f2ee-48ed-be1f-655c3551b832', 'البداية وتجهيز بيانات المشروع'),
  ('43396bf0-68c6-40bc-904a-99b558a05acf', 'البداية وتجهيز بيانات المشروع'),
  ('4ae3e158-ee6f-4fc3-9f1c-229e5010cf32', 'البداية وتجهيز بيانات المشروع'),
  ('d1384847-71c3-4934-9c1e-ab8addac73fe', 'البداية وتجهيز بيانات المشروع'),
  ('c0c86b7a-f23b-41c9-96bb-7f8af819c866', 'البداية وتجهيز بيانات المشروع'),
  ('3519bd44-b6ad-4b71-9dcc-ed09f74a783c', 'البداية وتجهيز بيانات المشروع'),
  ('2f85a0b7-75eb-4e20-97c9-a36ad000a085', 'البداية وتجهيز بيانات المشروع'),
  -- تصميم عناصر الطريق
  ('55e28fc2-52f0-4f92-b65f-b7e5668f9c08', 'تصميم عناصر الطريق'),
  ('43858ba1-ab8a-4717-a177-5742010a58a4', 'تصميم عناصر الطريق'),
  ('d5eacd7a-a6dd-47d3-837e-7f3abf4af11f', 'تصميم عناصر الطريق'),
  ('f5ec1568-35c7-482f-857f-d9773181cf65', 'تصميم عناصر الطريق'),
  ('26034c47-4634-48fe-a3c3-774f02b8b7c1', 'تصميم عناصر الطريق'),
  ('de70eb20-6f40-464c-991f-feeec85ea38a', 'تصميم عناصر الطريق'),
  ('74b0d07b-0588-4e0d-90b5-7aa9ca6cbeac', 'تصميم عناصر الطريق'),
  ('b58b644d-4ad6-4e25-b629-707f0cf0afb7', 'تصميم عناصر الطريق'),
  ('2b1827ed-7a3c-4ca9-a539-4f6324011a35', 'تصميم عناصر الطريق'),
  ('04dbf787-da80-42a4-9078-78a0765e1a01', 'تصميم عناصر الطريق'),
  ('c91ac4bf-2cfc-4330-a1d1-3b03321d03ce', 'تصميم عناصر الطريق'),
  ('17c669aa-a313-47e5-9665-d80018f053b1', 'تصميم عناصر الطريق'),
  ('c5376d43-b34c-489a-8935-da3fe0713786', 'تصميم عناصر الطريق'),
  ('0503ada6-168b-4335-94e4-b713fdc81470', 'تصميم عناصر الطريق'),
  ('aad2cbc3-51be-409c-b211-ea3cb84d1acd', 'تصميم عناصر الطريق'),
  ('093b3666-b7b9-4d55-b4b5-75206e9da02e', 'تصميم عناصر الطريق'),
  ('8153167a-f230-48a3-bb70-931dbd90c7c4', 'تصميم عناصر الطريق'),
  ('c3ad318f-f865-40e1-a5f5-4244c446d192', 'تصميم عناصر الطريق'),
  ('645fe768-ee81-4b52-9580-5da3ca82cf4b', 'تصميم عناصر الطريق'),
  -- التقاطعات والدوارات والنهايات المغلقة
  ('db0341ac-f22f-42e0-9d7f-16fc34d76b11', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('3e9889f2-41f5-47ba-82d7-310d20ce864d', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('eb3a1995-3a26-4f40-a8b1-55ca2eaea8fe', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('f452b2f9-837a-4c6f-b90c-3b580bb0529b', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('00ddb555-a2be-463e-9b83-9a378b58860a', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('5d96f802-57b9-4d3c-a42e-8562f3712131', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('fb564c3e-f397-41f6-aae6-96b5162e8d3f', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('cd9d1b97-a4ee-4d6e-a107-e90829a3740f', 'التقاطعات والدوارات والنهايات المغلقة'),
  ('a7fcf5f5-3e0f-46c6-8ef8-e90425074c06', 'التقاطعات والدوارات والنهايات المغلقة'),
  -- التحقق من صحة التصميم
  ('1b7de9e6-87c5-4bd4-8986-f61f780957c9', 'التحقق من صحة التصميم'),
  ('b3627838-83c9-43a2-8259-799102cd0f51', 'التحقق من صحة التصميم'),
  ('815e08f7-6ffb-42e5-9382-a9339b591d7b', 'التحقق من صحة التصميم'),
  ('84d64904-cbc8-4b55-8838-090dca768210', 'التحقق من صحة التصميم'),
  -- محاكاة حركة المركبات
  ('c792ac98-7cd9-4251-a8b3-bae6bcf397bf', 'محاكاة حركة المركبات'),
  ('a34d8bf1-6858-4f2d-bda5-b2c81d913724', 'محاكاة حركة المركبات'),
  ('f7c9b861-c74f-4f01-9162-484b6082c525', 'محاكاة حركة المركبات'),
  ('a6eca4c3-c5e5-41aa-97c9-c0d8bb26963f', 'محاكاة حركة المركبات'),
  ('707d2c32-edb9-481c-bc06-273b408ad7a6', 'محاكاة حركة المركبات'),
  ('a026cb12-d2a9-4db6-8cfc-fd60a1eb7e46', 'محاكاة حركة المركبات'),
  ('e4dafa8d-ea76-498c-97ce-9a46b78a1739', 'محاكاة حركة المركبات'),
  ('058243ef-f126-4994-a63d-9cc4e5d5c4d5', 'محاكاة حركة المركبات'),
  ('69d75ae5-b78d-403e-8915-7403d182e392', 'محاكاة حركة المركبات'),
  ('b7d58e54-f02b-4b65-b814-cd143af25e5b', 'محاكاة حركة المركبات'),
  -- مخرجات حزمة الطرق الاحترافية
  ('bdf3b3af-3f30-4e6b-b62e-85bbad202c9a', 'مخرجات حزمة الطرق الاحترافية'),
  ('08cdbcc7-3178-4e75-bf99-e533292770f2', 'مخرجات حزمة الطرق الاحترافية'),
  ('5074aebf-83d9-4e9b-a4a3-1ad1b3f47c52', 'مخرجات حزمة الطرق الاحترافية'),
  ('8cd73c42-5677-4cd2-adb9-5762003ed239', 'مخرجات حزمة الطرق الاحترافية'),
  ('fd356405-87d6-48cc-8e92-132417e8c621', 'مخرجات حزمة الطرق الاحترافية'),
  ('f7bdf1a6-5163-4f8d-910a-a9332311c15d', 'مخرجات حزمة الطرق الاحترافية'),
  ('1e047cf4-3ccd-41f0-98e6-9ef42ef2baba', 'مخرجات حزمة الطرق الاحترافية'),
  ('103cef63-750b-495d-9f41-7d951c43f07b', 'مخرجات حزمة الطرق الاحترافية'),
  ('d05b97ca-d3d7-4a6e-b341-6245d988f3b9', 'مخرجات حزمة الطرق الاحترافية'),
  ('83e12b78-42e7-4ffa-a799-684f8dcca909', 'مخرجات حزمة الطرق الاحترافية'),
  ('3bff7e52-ab90-47c8-9a57-75e0b213e15c', 'مخرجات حزمة الطرق الاحترافية'),
  ('57d6a1cb-ed66-461c-ad52-da8fce08bc8e', 'مخرجات حزمة الطرق الاحترافية'),
  ('7e14203e-8a37-43ff-8ab4-e635cb04e192', 'مخرجات حزمة الطرق الاحترافية'),
  ('3e0c1de9-8853-4cd5-9c21-fcc2c30d6da4', 'مخرجات حزمة الطرق الاحترافية'),
  ('2d7ffdcd-53c0-42bc-8aa4-d36c27900531', 'مخرجات حزمة الطرق الاحترافية'),
  ('42b8bfea-693c-4a01-bde5-e9c1178e5213', 'مخرجات حزمة الطرق الاحترافية'),
  ('b30ea02d-1475-4d3e-9144-6dc58c4c41fb', 'مخرجات حزمة الطرق الاحترافية'),
  ('8dac0384-b1ce-4e19-93f6-400de96ef99b', 'مخرجات حزمة الطرق الاحترافية'),
  -- نمذجة شبكات الطرق BIM
  ('9071103e-31a1-4e75-803d-2265d8151deb', 'نمذجة شبكات الطرق BIM'),
  ('90c434af-acdf-48fd-983d-64d5f81cef27', 'نمذجة شبكات الطرق BIM'),
  ('39d8bf8a-f151-4843-ab23-416d133b4874', 'نمذجة شبكات الطرق BIM'),
  ('4049579d-406b-4818-99fc-11f887f62994', 'نمذجة شبكات الطرق BIM'),
  ('c40449a1-7809-484f-9672-0e3d141dcdb8', 'نمذجة شبكات الطرق BIM'),
  ('4e9fa6df-6abc-468b-803b-daa3f71ce741', 'نمذجة شبكات الطرق BIM'),
  -- هندسة المرور: CUBE
  ('423e0577-6c55-40ee-b773-20d428c5a2f2', 'تجهيز بيانات شبكة النقل'),
  ('928075af-efc5-438a-8416-a572e02dfa75', 'تجهيز بيانات شبكة النقل'),
  ('ee4a5ba7-7e32-4536-b117-00dcc730a0af', 'تجهيز بيانات شبكة النقل'),
  ('a5ce47ab-9acf-43a1-a3df-5b0f1102e4de', 'نمذجة الطلب المروري'),
  ('4cb16a46-53d9-491c-b1ab-661d9b4d9f3f', 'نمذجة الطلب المروري'),
  ('e2566b94-0d60-4885-8aa9-ea4441435e0b', 'نمذجة الطلب المروري')
)
insert into public.lesson_topic_links (lesson_id, topic_id)
select m.lesson_id, t.id
  from m
  join public.lessons l on l.id = m.lesson_id
  join public.courses c on c.id = l.course_id
  join public.lesson_topics t on t.title = m.topic and t.career_path_id = c.career_path_id
on conflict do nothing;
