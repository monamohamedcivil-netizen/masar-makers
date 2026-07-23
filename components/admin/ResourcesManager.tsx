"use client";

import { FileText, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/button";

export default function ResourcesManager() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            إدارة الملفات
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            ملفات الرحلة التي يستطيع الطالب تحميلها.
          </p>
        </div>

        <Button>
          <Upload className="mr-2 h-4 w-4" />
          رفع ملف
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <FileText className="mx-auto mb-4 h-10 w-10 text-slate-400" />

        <h3 className="text-xl font-bold">
          لا توجد ملفات
        </h3>

        <p className="mt-2 text-slate-500">
          يمكنك إضافة ملفات PDF أو DWG أو ZIP أو أي ملفات خاصة بالرحلة.
        </p>
      </div>

      <div className="rounded-2xl border bg-white">
        <table className="w-full">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-4 text-right">اسم الملف</th>
              <th className="p-4 text-right">النوع</th>
              <th className="p-4 text-right">الحجم</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan={4}
                className="py-10 text-center text-slate-400"
              >
                لم يتم رفع أي ملفات حتى الآن.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}