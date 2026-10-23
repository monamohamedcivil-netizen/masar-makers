-- رموز الإصدار الجديدة (بدون رقم دفعة) لسجلات المدفوعات القادمة من اشتراكات المنصة:
--   كورس بمرحلتين: أساسيات C3D-F / متقدم C3D-A / متكاملة C3D-F+A
--   كورس بمرحلة واحدة أو رحلة يوم واحد: VT / BIM / PD / CUBE / VISUM / VISSIM / SIDRA / SYNCHRO
-- السجلات المستوردة من الإكسل (source = 'import') تبقى برموزها الأصلية (CSD-F2, BIM1 ...).
update public.finance_payments fp
set edition_code =
  (case upper(fp.course_code)
     when 'SPD' then 'PD'
     when 'SID' then 'SIDRA'
     when 'SYN' then 'SYNCHRO'
     when 'VIS' then 'VISSIM'
     else upper(fp.course_code)
   end)
  || case
       when lower(coalesce(c.level, '')) <> 'split' then ''
       when fp.journey_kind = 'fundamental' then '-F'
       when fp.journey_kind = 'advanced' then '-A'
       when fp.journey_kind = 'integrated' then '-F+A'
       else ''
     end
from public.courses c
where c.course_code = fp.course_code
  and fp.source = 'enrollment'
  and fp.course_code is not null;
