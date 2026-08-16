import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";
import BackToRegistrationButton from "@/components/auth/BackToRegistrationButton";
const sections = [
  {
    id: "acceptance",
    title: "1. قبول الشروط",
    icon: CheckCircle2,
    content: [
      "باستخدام منصة Masar Makers أو إنشاء حساب بها، فإنك تقر بأنك قرأت هذه الشروط والأحكام وفهمتها ووافقت على الالتزام بها.",
      "إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عدم إنشاء حساب أو استخدام الخدمات التي تتطلب الموافقة عليها.",
    ],
  },
  {
    id: "account",
    title: "2. الحساب وبيانات الدخول",
    icon: UserRoundCheck,
    content: [
      "يجب تقديم بيانات صحيحة ومحدثة عند إنشاء الحساب، ويكون المستخدم مسؤولًا عن المحافظة على سرية بيانات الدخول الخاصة به.",
      "الحساب شخصي ولا يجوز مشاركة كلمة المرور أو منح شخص آخر حق استخدام الحساب أو مشاهدة المحتوى المدفوع من خلاله.",
      "يحق للمنصة اتخاذ الإجراءات المناسبة عند وجود استخدام غير مصرح به أو مشاركة للحساب بما يحمي المحتوى وحقوق بقية المستخدمين.",
    ],
  },
  {
    id: "content",
    title: "3. المحتوى التعليمي وحقوق الاستخدام",
    icon: BookOpenCheck,
    content: [
      "جميع المحاضرات والفيديوهات والمواد التعليمية والتصميمات والملفات والنصوص المرتبطة بالدورات مخصصة للاستخدام الشخصي والتعليمي للمستخدم المسجل.",
      "لا يجوز نسخ المحتوى أو تسجيله أو إعادة نشره أو توزيعه أو بيعه أو مشاركته مع الآخرين بأي وسيلة دون تصريح كتابي مسبق من Masar Makers أو صاحب الحق.",
      "الاشتراك يمنح حق الوصول إلى المحتوى وفق نوع الرحلة وحالة الاشتراك ومدة الإتاحة المعلنة، ولا ينقل ملكية المحتوى إلى المستخدم.",
          "جميع محتويات Masar Makers التعليمية مخصصة للاستخدام الشخصي للمستخدم المشترك فقط. وفي حال ثبوت قيام المستخدم بنسخ أو تسجيل أو تحميل أو إعادة نشر أو مشاركة أو تسريب أي محتوى خاص بالمنصة، كليًا أو جزئيًا، خارج المنصة أو إتاحته لأي شخص غير مصرح له بالوصول إليه، يحق لـ Masar Makers تعليق أو إنهاء حساب المستخدم وحظره نهائيًا من المنصة، وإلغاء وصوله إلى جميع الكورسات والرحلات والمحتويات المشترك بها، وليس فقط الكورس أو الرحلة التي تمت مشاركة محتواها، وذلك دون استحقاق استرداد الرسوم المدفوعة، مع احتفاظ Masar Makers بحقها في اتخاذ أي إجراءات أخرى يجيزها النظام. ويُعد قبول المستخدم لهذه الشروط إقرارًا منه بعلمه بهذه السياسة وموافقته عليها.",
    ],
  },
  {
    id: "enrollment",
    title: "4. الاشتراكات وتفعيل الرحلات",
    icon: FileText,
    content: [
      "بعض الرحلات تتطلب إرسال طلب اشتراك وموافقة الإدارة قبل تفعيل الوصول إلى المحتوى.",
      "تظهر حالة الطلب داخل المنصة، وقد تكون قيد المراجعة أو مفعلة أو مرفوضة أو موقوفة أو منتهية وفق حالة الاشتراك.",
      "تفاصيل السعر ومدة الوصول وما يشمله الاشتراك يجب الرجوع فيها إلى صفحة الرحلة أو العرض المعلن وقت التسجيل.",
    ],
  },
  {
    id: "payments",
    title: "5. الدفع والإلغاء والاسترداد",
    icon: Scale,
    content: [
      "تخضع المدفوعات وسياسات الإلغاء والاسترداد للتفاصيل المعلنة للمستخدم قبل إتمام الشراء وللأنظمة واللوائح المطبقة على مقدم الخدمة.",
      "إذا كان لأي رحلة أو عرض شروط خاصة تتعلق بالاسترداد أو مدة الوصول أو الخصومات، فتعد هذه الشروط الخاصة جزءًا مكملًا لهذه الشروط.",
      "يجب التواصل مع إدارة المنصة عند وجود مشكلة متعلقة بالدفع أو التفعيل حتى تتم مراجعة الحالة.",
    ],
  },
  {
    id: "certificates",
    title: "6. الشهادات والإنجازات",
    icon: ShieldCheck,
    content: [
      "تصدر الشهادات وفق متطلبات كل رحلة وبعد استيفاء الشروط المحددة لها داخل المنصة.",
      "يتحمل المستخدم مسؤولية التأكد من صحة اسمه وبياناته، وبالأخص الاسم الإنجليزي المستخدم في الشهادة، قبل إصدارها.",
      "الشهادة توثق إتمام المتطلبات التعليمية المحددة للرحلة ولا تمثل ترخيصًا مهنيًا أو اعتمادًا حكوميًا ما لم يذكر خلاف ذلك صراحة.",
    ],
  },
  {
    id: "projects",
    title: "7. المشاريع والأعمال التي يرفعها الطالب",
    icon: FileText,
    content: [
      "يجب أن تكون المشاريع والصور والمواد التي يرفعها المستخدم من أعماله أو مما يملك حق استخدامه ونشره.",
      "يظل المستخدم مسؤولًا عن المحتوى الذي يرفعه وعن عدم انتهاكه حقوق الآخرين أو سرية جهات العمل أو العملاء.",
      "بالموافقة على هذه الشروط والأحكام، يوافق المستخدم على منح Masar Makers الإذن بعرض واستخدام المشاريع والصور والأعمال التي يرفعها على المنصة لأغراض العرض والتسويق والتعريف بنتائج الرحلات التعليمية، دون الحاجة إلى الحصول على موافقة منفصلة لكل مرة يتم فيها الاستخدام.",
    ],
  },
  {
    id: "privacy",
    title: "8. البيانات والخصوصية",
    icon: LockKeyhole,
    content: [
      "تستخدم بيانات المستخدم لتشغيل الحساب وتقديم الخدمات التعليمية وإدارة الاشتراكات والشهادات والمشاريع والإشعارات وتحسين تجربة المنصة.",
      "تلتزم المنصة بالتعامل مع البيانات الشخصية وفق سياسة الخصوصية والأنظمة المطبقة، ولا يعني قبول هذه الشروط منح إذن مفتوح لاستخدام البيانات خارج الأغراض الموضحة للمستخدم.",
    ],
  },
  {
    id: "conduct",
    title: "9. الاستخدام المقبول",
    icon: AlertTriangle,
    content: [
      "يحظر إساءة استخدام المنصة أو محاولة تجاوز صلاحيات الوصول أو الوصول إلى محتوى غير مصرح به أو التدخل في عمل النظام أو حسابات المستخدمين الآخرين.",
      "يجب استخدام قنوات التواصل والمجتمع بصورة مهنية ومحترمة وعدم نشر محتوى مسيء أو غير قانوني أو مخالف لحقوق الآخرين.",
    ],
  },
  {
    id: "changes",
    title: "10. تحديث الشروط",
    icon: FileText,
    content: [
      "يجوز تحديث هذه الشروط عند الحاجة لتطوير الخدمات أو الامتثال للمتطلبات النظامية، ويعرض تاريخ آخر تحديث في هذه الصفحة.",
      "عندما يكون التغيير جوهريًا، يمكن إشعار المستخدم داخل المنصة وطلب موافقة جديدة إذا كان ذلك مطلوبًا.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F8FA] pt-[55px]">
        <AnnouncementBar />

        <section className="bg-[#07152E]">
          <div
            dir="rtl"
            className="mx-auto max-w-[1200px] px-6 py-6 text-right lg:px-10 lg:py-7"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7B548] text-[#07152E]">
              <Scale size={17} />
            </span>

            <h1 className="mt-1 text-[26px] font-black leading-tight text-white sm:text-[30px]">
              الشروط والأحكام
            </h1>

            <p className="mt-0.5 max-w-3xl text-[14px] font-semibold leading-6 text-white/65">
              توضح هذه الصفحة القواعد الأساسية لاستخدام منصة Masar Makers
              والخدمات والمحتوى التعليمي المتاح من خلالها.
            </p>

            <p className="mt-0.5 text-[12px] font-bold text-[#F7B548]">
              آخر تحديث: أغسطس 2026
            </p>
          </div>
        </section>

        <section
          dir="rtl"
          className="mx-auto grid max-w-[1200px] gap-4 px-6 py-5 lg:grid-cols-[235px_minmax(0,1fr)] lg:px-10 lg:py-6"
        >
          <aside className="h-fit rounded-[18px] border border-[#DCE2EA] bg-white p-3 lg:sticky lg:top-[80px]">
            <p className="mb-1 text-[16px] font-black text-[#07152E]">
              محتويات الصفحة
            </p>

            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-600 transition hover:bg-[#FFF4DF] hover:text-[#B87508]"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-2.5">
            <div className="rounded-[18px] border border-[#F7B548]/45 bg-[#FFF9EA] px-4 py-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#C88712]" size={20} />

                <div>
                  <h2 className="text-[15px] font-black text-[#07152E]">
                    قبل إنشاء الحساب
                  </h2>

                  <p className="mt-0.5 text-[13px] font-semibold leading-5 text-slate-600">
                    عند التسجيل سيُطلب منك تأكيد قراءة هذه الشروط والموافقة
                    عليها. ننصح بقراءتها كاملة قبل المتابعة.
                  </p>
                </div>
              </div>
            </div>

            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-[18px] border border-[#DCE2EA] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(7,21,46,0.045)] sm:px-5 sm:py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4DF] text-[#C88712]">
                      <Icon size={16} />
                    </span>

                    <h2 className="text-[16px] font-black text-[#07152E]">
                      {section.title}
                    </h2>
                  </div>

                  <div className="mt-1 space-y-0">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-[13px] font-semibold leading-5.5 text-slate-600"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}

            <div className="rounded-[18px] bg-[#07152E] px-5 py-4 text-white">
              <h2 className="text-[16px] font-black">
                هل لديك استفسار عن الشروط؟
              </h2>

              <p className="mt-1 text-[13px] font-semibold leading-5 text-white/65">
                يمكنك التواصل معنا قبل إنشاء الحساب أو الاشتراك في أي رحلة
                للحصول على توضيح حول بنود الاستخدام أو الاشتراك.
              </p>

              <BackToRegistrationButton />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}