-- يضيف القسم السادس «تعرف على الرحلة أكثر» (intro) لجدول station_section_items.
-- خطة الرجوع: أعيدي إنشاء القيد بدون 'intro' (بعد إخفاء/حذف عناصر intro).
alter table public.station_section_items drop constraint if exists station_section_items_section_key_check;
alter table public.station_section_items
  add constraint station_section_items_section_key_check
  check (section_key in ('professional','outcome','gifts','free','reviews','intro'));
