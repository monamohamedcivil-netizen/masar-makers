"use client";

import { Gift } from "lucide-react";
import ModalShell from "./ModalShell";

interface Props {
  open: boolean;
  monthlyDrawEntries: number;
  onClose: () => void;
}

export default function DrawModal({
  open,
  monthlyDrawEntries,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <ModalShell
      title="السحب الشهري"
      onClose={onClose}
    >
      <div className="text-center">

        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5DD] text-[#C88712]">
          <Gift size={30} />
        </span>

        <p className="mt-4 text-[10px] font-black text-[#C88712]">
          جائزة هذا الشهر
        </p>

        <h3 className="mt-1 text-[22px] font-black text-[#07152E]">
          رحلة احترافية مجانية
        </h3>

        <p className="mt-2 text-[11px] font-bold text-slate-500">
          سيتم تحديد تفاصيل الجائزة
          وموعد السحب من لوحة الإدارة.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">

          <div className="rounded-2xl border border-[#E1E7EE] bg-[#F8FAFC] p-4">

            <p className="text-[23px] font-black text-[#07152E]">
              {monthlyDrawEntries}
            </p>

            <p className="mt-1 text-[9px] font-bold text-slate-500">
              فرصك الحالية
            </p>

          </div>

          <div className="rounded-2xl border border-[#E1E7EE] bg-[#F8FAFC] p-4">

            <p className="text-[18px] font-black text-[#07152E]">
              قريبًا
            </p>

            <p className="mt-1 text-[9px] font-bold text-slate-500">
              موعد السحب القادم
            </p>

          </div>

        </div>

      </div>
    </ModalShell>
  );
}