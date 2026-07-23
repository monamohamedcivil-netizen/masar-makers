"use client";

import { Button } from "@/components/button";

export default function JourneyInfoManager() {
  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">
            بيانات الرحلة
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            تعديل بيانات الرحلة الأساسية.
          </p>
        </div>

        <Button>
          حفظ التعديلات
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <label className="mb-2 block text-sm font-bold">
            عنوان الرحلة
          </label>

          <input
            className="w-full rounded-xl border p-3"
            placeholder="رحلة الأساسيات"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">
            الرابط (Slug)
          </label>

          <input
            className="w-full rounded-xl border p-3"
            placeholder="fundamentals"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">
            السعر
          </label>

          <input
            className="w-full rounded-xl border p-3"
            type="number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold">
            عدد الساعات
          </label>

          <input
            className="w-full rounded-xl border p-3"
            type="number"
          />
        </div>

      </div>

      <div>
        <label className="mb-2 block text-sm font-bold">
          وصف الرحلة
        </label>

        <textarea
          rows={6}
          className="w-full rounded-xl border p-3"
        />
      </div>

    </div>
  );
}