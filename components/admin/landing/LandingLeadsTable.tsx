import type { LandingLeadRow } from "@/lib/actions/landing-leads";

/* حجوزات الصفحة: كل ضغطة على «إرسال بياناتي على واتساب». */

function waLink(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export default function LandingLeadsTable({ leads }: { leads: LandingLeadRow[] }) {
  return (
    <details className="mb-4 rounded-2xl border border-slate-200 bg-white p-4" open={leads.length > 0}>
      <summary className="cursor-pointer text-base font-black text-[#07152E]">
        الحجوزات من الصفحة ({leads.length})
      </summary>
      {leads.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          لسه مفيش حجوزات. كل ضغطة على زر واتساب في الصفحة بتظهر هنا، بالبيانات اللي الزائر كتبها (لو كتب) ومصدر الإعلان.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">الوقت</th>
                <th className="px-3 py-2 font-semibold">الاسم</th>
                <th className="px-3 py-2 font-semibold">الواتساب</th>
                <th className="px-3 py-2 font-semibold">الإيميل</th>
                <th className="px-3 py-2 font-semibold">الدولة</th>
                <th className="px-3 py-2 font-semibold">الرحلة</th>
                <th className="px-3 py-2 font-semibold">المصدر</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(lead.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Riyadh" })}
                  </td>
                  <td className="px-3 py-2 font-semibold text-[#07152E]">{lead.name || <span className="font-normal text-slate-400">بدون بيانات</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {waLink(lead.phone) ? (
                      <a href={waLink(lead.phone)} target="_blank" rel="noopener" className="text-emerald-700 underline">
                        {lead.phone}
                      </a>
                    ) : (
                      lead.phone
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">{lead.email}</td>
                  <td className="px-3 py-2">{lead.country}</td>
                  <td className="px-3 py-2">{lead.plan}</td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {[lead.utm_source, lead.utm_campaign, lead.utm_content].filter(Boolean).join(" / ") || "مباشر"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
