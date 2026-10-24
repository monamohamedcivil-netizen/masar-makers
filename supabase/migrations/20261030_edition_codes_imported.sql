-- رموز الإصدار المستوردة من الإكسل بنفس الرموز الجديدة (بدون رقم الدفعة) — طُبّق 2026-10-24:
-- CSD-F2 → CSD-F، CSD-A1 → CSD-A، C3D-F1 → C3D-F، C3D-A1 → C3D-A، BIM1 → BIM، PD1 → PD، VT1 → VT.
-- المرحلة (أساسيات/متقدم) تبقى كما هي في كل صف. النسخة القديمة محفوظة في finance_payments_backup_20261020.
update public.finance_payments
set edition_code = regexp_replace(upper(edition_code), '([A-Z])[0-9]+(?=$|[-+])', '\1', 'g'),
    updated_at = now()
where edition_code ~ '[A-Za-z][0-9]+($|[-+])';
