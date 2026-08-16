import {
  Database,
  Eye,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";
import BackToRegistrationButton from "@/components/auth/BackToRegistrationButton";

const sections = [
  {
    id: "data",
    title: "1. البيانات التي نجمعها",
    icon: Database,
    paragraphs: [
      "قد نجمع البيانات التي يقدمها المستخدم عند إنشاء الحساب أو تحديث ملفه، مثل الاسم، الاسم باللغة الإنجليزية، البريد الإلكتروني، رقم الهاتف، الدولة، المسمى الوظيفي، سنوات الخبرة والتخصص.",
      "كما قد نعالج بيانات مرتبطة باستخدام المنصة مثل الرحلات المشترك بها، التقدم في الدروس، الشهادات، الاستبيانات، المشاريع والصور التي يرفعها الطالب، والنقاط والإنجازات المرتبطة بحسابه.",
      "قد تجمع الأنظمة التقنية بيانات تشغيلية لازمة للأمان وتحسين الأداء، مثل معلومات الجلسة وسجلات الاستخدام الفنية، وفق الإعدادات والخدمات المستخدمة في المنصة.",
    ],
  },
  {
    id: "purpose",
    title: "2. لماذا نستخدم بياناتك؟",
    icon: Eye,
    paragraphs: [
      "نستخدم البيانات لإنشاء الحساب وإدارته، وتفعيل الاشتراكات، وتقديم المحتوى التعليمي، وحفظ التقدم، وإصدار الشهادات، وإدارة المشاريع والاستبيانات والإشعارات، وتشغيل مزايا Masar Passport.",
      "قد نستخدم بيانات التواصل لإرسال رسائل ضرورية مرتبطة بالحساب، مثل تأكيد البريد، استعادة كلمة المرور، تفعيل الاشتراك، إصدار شهادة، أو إشعار متعلق بالخدمة.",
      "قد تستخدم Masar Makers بعض بيانات المتدرب، مثل الاسم والدولة والمسمى الوظيفي، لأغراض العرض والتسويق المرتبطة بالمنصة، بما في ذلك عرض آراء المتدربين، ونماذج من مشاريعهم وأعمالهم وإنجازاتهم التعليمية.",
    ],
  },
  {
    id: "legal",
    title: "3. الأساس النظامي والموافقة",
    icon: UserRoundCheck,
    paragraphs: [
      "تتم معالجة البيانات وفق الأغراض المعلنة وبالقدر اللازم لتقديم الخدمة والامتثال للمتطلبات النظامية المطبقة.",
      "الموافقة على الشروط والأحكام لا تعني موافقة مفتوحة على كل استخدام محتمل للبيانات؛ وقد نطلب موافقة منفصلة عند الحاجة.",
    ],
  },
  {
    id: "sharing",
    title: "4. مشاركة البيانات ومقدمو الخدمات",
    icon: ShieldCheck,
    paragraphs: [
      "قد نستخدم مقدمي خدمات تقنيين لتشغيل أجزاء من المنصة مثل الاستضافة، المصادقة، إرسال البريد، تشغيل الفيديو أو التخزين، وذلك بالقدر اللازم لتقديم الخدمة.",
      "لا يتم بيع البيانات الشخصية للمستخدمين.",
      "قد يتم الإفصاح عن البيانات عندما يكون ذلك مطلوبًا نظامًا أو لحماية الحقوق أو أمن المنصة أو المستخدمين، وبما يتوافق مع المتطلبات المطبقة.",
    ],
  },
  {
    id: "security",
    title: "5. حماية البيانات",
    icon: LockKeyhole,
    paragraphs: [
      "نتخذ إجراءات تنظيمية وتقنية معقولة لحماية البيانات من الوصول غير المصرح به أو التعديل أو الفقد أو الإفصاح غير المشروع.",
      "رغم ذلك لا يمكن ضمان الأمان المطلق لأي خدمة إلكترونية، لذلك نراجع الضوابط والإعدادات بصورة مستمرة ونقيد الوصول إلى البيانات بحسب الحاجة.",
    "قد تتم معالجة بيانات الحساب وسجلات الاستخدام والبيانات التقنية المتاحة للمنصة بالقدر اللازم لحماية المحتوى التعليمي، والتحقق من حالات الوصول أو المشاركة غير المصرح بها، ومنع إساءة استخدام المنصة، وإنفاذ الشروط والأحكام. وفي حال ثبوت مخالفة شروط حماية المحتوى، يجوز اتخاذ الإجراءات الموضحة في الشروط والأحكام، بما في ذلك تعليق أو إنهاء الحساب وإلغاء صلاحية الوصول إلى كل المحتوى المشترك به، وفق الأنظمة المطبقة.",
    ],
  },
  {
    id: "retention",
    title: "6. مدة الاحتفاظ",
    icon: FileText,
    paragraphs: [
      "نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمات، وحفظ السجلات التعليمية والشهادات، والوفاء بالالتزامات النظامية، ثم نتعامل معها وفق سياسة الاحتفاظ المعتمدة.",
      "قد تختلف مدة الاحتفاظ بحسب نوع البيانات والغرض منها والمتطلبات النظامية ذات العلاقة.",
    ],
  },
  {
    id: "rights",
    title: "7. حقوقك المتعلقة ببياناتك",
    icon: UserRoundCheck,
    paragraphs: [
      "يمكن للمستخدم طلب الاطلاع على بياناته أو تصحيحها أو تحديثها من خلال الأدوات المتاحة في المنصة أو عبر التواصل معنا، وفق الحدود والإجراءات النظامية المطبقة.",
      "قد نحتاج إلى التحقق من هوية مقدم الطلب قبل تنفيذ طلب متعلق بالبيانات لحماية خصوصية الحساب.",
    ],
  },
  {
    id: "projects",
    title: "8. المشاريع والصور التي يرفعها الطالب",
    icon: FileText,
    paragraphs: [
      "المشاريع والصور المرفوعة ترتبط بحساب الطالب وتستخدم لعرض أعماله داخل المنصة وتشغيل المزايا المرتبطة بالمشروعات والإنجازات.",
      "يعتبر مجرد رفع المشروع موافقة تلقائية على استخدامه في الإعلانات العامة.",
      "يجب على الطالب عدم رفع محتوى يتضمن بيانات سرية أو مواد لا يملك حق مشاركتها.",
    ],
  },
  {
    id: "contact",
    title: "9. التواصل والاستفسارات",
    icon: Mail,
    paragraphs: [
      "إذا كان لديك استفسار عن بياناتك أو هذه السياسة أو رغبت في ممارسة حق متعلق بالخصوصية، يمكنك التواصل مع إدارة Masar Makers عبر قنوات التواصل المعلنة في المنصة.",
      "قد نحدث هذه السياسة عند تطوير الخدمة أو تغير المتطلبات النظامية، وسيظهر تاريخ آخر تحديث في هذه الصفحة.",
    ],
  },
];

export default function PrivacyPage() {
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
              <LockKeyhole size={17} />
            </span>

            <h1 className="mt-1 text-[26px] font-black leading-tight text-white sm:text-[30px]">
              سياسة الخصوصية
            </h1>

            <p className="mt-0.5 max-w-3xl text-[14px] font-semibold leading-6 text-white/65">
              توضح هذه السياسة أنواع البيانات التي تعالجها Masar Makers،
              والأغراض من استخدامها، وكيف نحميها، والحقوق المتعلقة بها.
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
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[#C88712]"
                  size={20}
                />

                <div>
                  <h2 className="text-[15px] font-black text-[#07152E]">
                    التزامنا بالوضوح
                  </h2>

                  <p className="mt-0.5 text-[13px] font-semibold leading-5 text-slate-600">
                    نهدف إلى جمع واستخدام البيانات بالقدر اللازم لتشغيل
                    المنصة وتقديم الخدمة، مع توضيح الأغراض للمستخدم قبل
                    أو عند جمع البيانات.
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
                  className="scroll-mt-24 rounded-[18px] border border-[#DCE2EA] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(7,21,46,0.045)] sm:px-5 sm:py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF4DF] text-[#C88712]">
                      <Icon size={16} />
                    </span>

                    <h2 className="text-[16px] font-black text-[#07152E]">
                      {section.title}
                    </h2>
                  </div>

                  <div className="mt-1 space-y-0 px-10">
                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-[12px] font-semibold leading-5.5 text-slate-600"
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
                قرأت سياسة الخصوصية؟
              </h2>

              <p className="mt-1 text-[13px] font-semibold leading-5 text-white/65">
                يمكنك العودة إلى نموذج التسجيل واستكمال إنشاء حسابك.
              </p>

              <BackToRegistrationButton />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}