import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Layers3,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";

import {
  createPanelSection,
  deletePanelSection,
  togglePanelSection,
} from "@/lib/actions/panel-builder";

import {
  getPanelSections,
} from "@/lib/queries/catalog";

type PageProps = {
  params: Promise<{
    templateId: string;
    panelId: string;
  }>;
};

export default async function PanelSectionsPage({
  params,
}: PageProps) {
  const {
    templateId,
    panelId,
  } = await params;

  const sections =
    await getPanelSections(panelId);

  const createSectionAction =
    createPanelSection.bind(
      null,
      templateId,
      panelId
    );

  return (
    <main
      dir="rtl"
      className="
        min-h-screen bg-[#F4F6F9]
        px-4 py-10
        sm:px-6
      "
    >
      <div className="mx-auto max-w-5xl">
        <header
          className="
            mb-6 flex flex-col gap-4
            rounded-[24px]
            border border-[#DCE3EB]
            bg-white p-6
            shadow-[0_14px_40px_rgba(7,21,46,0.07)]
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div className="flex items-center gap-3">
            <span
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-[#07152E]
                text-[#F7B548]
              "
            >
              <Layers3 size={23} />
            </span>

            <div>
              <h1 className="text-2xl font-black text-[#07152E]">
                إدارة Sections
              </h1>

              <p className="mt-1 text-xs font-bold text-slate-500">
                أضيفي أقسام المحتوى داخل الـ Panel.
              </p>
            </div>
          </div>

          <Link
            href={`/admin/page-builder/${templateId}`}
            className="
              inline-flex min-h-10
              items-center justify-center
              gap-2 rounded-xl
              border border-[#DCE3EB]
              bg-white px-4
              text-xs font-black
              text-[#07152E]
              transition
              hover:border-[#F7B548]
              hover:bg-[#FFF8E8]
            "
          >
            <ArrowRight size={15} />
            العودة إلى Panels
          </Link>
        </header>

        <section
          className="
            mb-6 rounded-[24px]
            border border-[#DCE3EB]
            bg-white p-5
            shadow-[0_12px_32px_rgba(7,21,46,0.05)]
          "
        >
          <form
            action={createSectionAction}
            className="
              flex flex-col gap-3
              sm:flex-row
            "
          >
            <input
              name="title"
              type="text"
              required
              placeholder="اسم الـ Section الجديد"
              className="
                min-h-12 flex-1
                rounded-xl
                border border-[#DCE3EB]
                bg-[#F8FAFC]
                px-4
                text-sm font-bold
                text-[#07152E]
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#F7B548]
                focus:bg-white
              "
            />

            <button
              type="submit"
              className="
                inline-flex min-h-12
                items-center justify-center
                gap-2 rounded-xl
                bg-[#F7B548]
                px-6
                text-sm font-black
                text-[#07152E]
                transition
                hover:bg-[#FFC968]
              "
            >
              <Plus size={17} />
              إضافة Section
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {sections.length > 0 ? (
            sections.map(
              (section, index) => {
                const toggleAction =
                  togglePanelSection.bind(
                    null,
                    templateId,
                    panelId,
                    section.id,
                    section.active
                  );

                const deleteAction =
                  deletePanelSection.bind(
                    null,
                    templateId,
                    panelId,
                    section.id
                  );

                return (
                  <article
                    key={section.id}
                    className="
                      flex flex-col gap-4
                      rounded-[20px]
                      border border-[#DCE3EB]
                      bg-white p-4
                      shadow-[0_10px_26px_rgba(7,21,46,0.05)]
                      md:flex-row
                      md:items-center
                    "
                  >
                    <span
                      className="
                        flex h-11 w-11
                        shrink-0 items-center
                        justify-center
                        rounded-xl
                        bg-[#07152E]
                        text-sm font-black
                        text-[#F7B548]
                      "
                    >
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-black text-[#07152E]">
                        {section.title}
                      </h2>

                      <div
                        className="
                          mt-2 flex flex-wrap
                          items-center gap-3
                          text-[10px]
                          font-bold text-slate-500
                        "
                      >
                        <span>
                          المفتاح:{" "}
                          {section.section_key}
                        </span>

                        <span>
                          الترتيب:{" "}
                          {section.display_order}
                        </span>

                        <span
                          className={
                            section.active
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }
                        >
                          {section.active
                            ? "نشط"
                            : "غير نشط"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/page-builder/${templateId}/panels/${panelId}/sections/${section.id}`}
                        className="
                          inline-flex h-10
                          items-center justify-center
                          gap-2 rounded-xl
                          bg-[#07152E]
                          px-4
                          text-xs font-black
                          text-white
                          transition
                          hover:bg-[#17345C]
                        "
                      >
                        <Settings2 size={15} />
                        إدارة Blocks
                      </Link>

                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="
                            inline-flex h-10
                            items-center justify-center
                            gap-2 rounded-xl
                            border border-[#DCE3EB]
                            bg-white px-4
                            text-xs font-black
                            text-[#07152E]
                            transition
                            hover:border-[#F7B548]
                          "
                        >
                          {section.active ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}

                          {section.active
                            ? "إخفاء"
                            : "إظهار"}
                        </button>
                      </form>

                      <form action={deleteAction}>
                        <button
                          type="submit"
                          className="
                            inline-flex h-10
                            items-center justify-center
                            gap-2 rounded-xl
                            border border-red-200
                            bg-red-50 px-4
                            text-xs font-black
                            text-red-600
                            transition
                            hover:bg-red-100
                          "
                        >
                          <Trash2 size={15} />
                          حذف
                        </button>
                      </form>
                    </div>
                  </article>
                );
              }
            )
          ) : (
            <div
              className="
                rounded-[24px]
                border-2 border-dashed
                border-[#D5DDE7]
                bg-white px-6 py-16
                text-center
              "
            >
              <Layers3
                size={34}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-lg font-black text-[#07152E]">
                لا توجد Sections حتى الآن
              </h2>

              <p className="mt-2 text-xs font-bold text-slate-500">
                اكتبي اسم أول Section ثم اضغطي إضافة.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}