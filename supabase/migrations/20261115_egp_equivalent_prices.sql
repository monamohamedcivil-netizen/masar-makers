-- «الجنيه المكافئ» لسعر الريال: القيمة التي يراها الطالب غير المقيم في مصر عند اختيار الجنيه.
-- NULL = يُحسب تلقائيًا (الريال × سعر الصرف، لأقرب 50) كما هو الآن. إضافة أعمدة فقط، بدون حذف.
alter table public.price_offer_rows add column if not exists egp_equiv_original numeric;
alter table public.price_offer_rows add column if not exists egp_equiv_price numeric;
alter table public.whatsapp_course_prices add column if not exists egp_equiv_original numeric;
alter table public.whatsapp_course_prices add column if not exists egp_equiv_price numeric;
alter table public.whatsapp_oneday_prices add column if not exists egp_equiv_original numeric;
alter table public.whatsapp_oneday_prices add column if not exists egp_equiv_price numeric;
