-- اشتراكات المكافآت (مثل جائزة السحب الشهري) تُسجَّل في المدفوعات بقيمة 0
alter table public.finance_payments
  add column if not exists is_reward boolean not null default false,
  add column if not exists reward_reason text,
  add column if not exists reward_date date;
