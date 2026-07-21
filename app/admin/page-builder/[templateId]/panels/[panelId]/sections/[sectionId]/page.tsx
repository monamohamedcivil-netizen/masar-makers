import Link from "next/link";

import {
  ArrowRight,
  Blocks,
  FileText,
  Heading,
  ImageIcon,
  Pencil,
  Plus,
  Power,
  Trash2,
  Video,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import {
  createPanelBlock,
  deletePanelBlock,
  togglePanelBlock,
  updatePanelBlock,
} from "@/lib/actions/panel-builder";

type PageProps = {
  params: Promise<{
    templateId: string;
    panelId: string;
    sectionId: string;
  }>;
};

type PanelBlock = {
  id: string;
  panel_id: string;
  section_id: string | null;
  title: string | null;
  subtitle: string | null;
  block_type: string;
  display_order: number;
  active: boolean;
  data: Record<string, unknown>;
};

function BlockTypeIcon({
  type,
}: {
  type: string;
}) {
  const iconClassName = "h-5 w-5";

  switch (type) {
    case "heading":
      return (
        <Heading className={iconClassName} />
      );

    case "image":
      return (
        <ImageIcon className={iconClassName} />
      );

    case "video":
      return (
        <Video className={iconClassName} />
      );

    case "text":
    default:
      return (
        <FileText className={iconClassName} />
      );
  }
}

function getBlockTypeLabel(type: string) {
  switch (type) {
    case "heading":
      return "عنوان";

    case "text":
      return "نص";

    case "image":
      return "صورة";

    case "video":
      return "فيديو";

    default:
      return type;
  }
}

export default async function SectionBlocksPage({
  params,
}: PageProps) {
  const {
    templateId,
    panelId,
    sectionId,
  } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
  .from("panel_blocks")
  .select(`
    id,
    panel_id,
    section_id,
    title,
    subtitle,
    block_type,
    display_order,
    active,
    data
  `)
  .eq("section_id", sectionId)
  .order("display_order", {
    ascending: true,
  })
  .order("created_at", {
    ascending: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const blocks = (data ?? []) as PanelBlock[];

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
            flex flex-col gap-4
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
              <Blocks size={23} />
            </span>

            <div>
              <h1 className="text-2xl font-black text-[#07152E]">
                إدارة Blocks
              </h1>

              <p className="mt-1 text-xs font-bold text-slate-500">
                أضيفي مكونات المحتوى ورتبيها داخل
                هذا الـ Section.
              </p>
            </div>
          </div>

          <Link
  href={`/admin/page-builder/${templateId}/panels/${panelId}`}
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
  العودة إلى Sections
</Link>
        </header>

        <section
          className="
            mt-6 rounded-[24px]
            border border-[#DCE3EB]
            bg-white p-6
            shadow-[0_14px_40px_rgba(7,21,46,0.05)]
          "
        >
          <div className="mb-5 flex items-center gap-2">
            <Plus
              size={18}
              className="text-[#F7B548]"
            />

            <h2 className="font-black text-[#07152E]">
              إضافة Block جديد
            </h2>
          </div>

          <form
            action={createPanelBlock}
            className="
              grid gap-4
              md:grid-cols-[minmax(0,1fr)_180px_130px_auto]
              md:items-end
            "
          >
            <input
              type="hidden"
              name="template_id"
              value={templateId}
            />

            <input
              type="hidden"
              name="panel_id"
              value={panelId}
            />

            <input
              type="hidden"
              name="section_id"
              value={sectionId}
            />

            <label className="space-y-2">
              <span className="text-xs font-black text-[#07152E]">
                عنوان الـ Block
              </span>

              <input
                required
                name="title"
                placeholder="مثال: مقدمة الرحلة"
                className="
                  h-11 w-full rounded-xl
                  border border-[#DCE3EB]
                  bg-white px-4
                  text-sm font-bold
                  text-[#07152E]
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-[#F7B548]
                  focus:ring-4
                  focus:ring-[#F7B548]/15
                "
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black text-[#07152E]">
                النوع
              </span>

              <select
                name="block_type"
                defaultValue="text"
                className="
                  h-11 w-full rounded-xl
                  border border-[#DCE3EB]
                  bg-white px-4
                  text-sm font-bold
                  text-[#07152E]
                  outline-none
                  focus:border-[#F7B548]
                "
              >
                <option value="heading">
                  Heading
                </option>

                <option value="text">
                  Text
                </option>

                <option value="image">
                  Image
                </option>

                <option value="video">
                  Video
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black text-[#07152E]">
                الترتيب
              </span>

              <input
                type="number"
                name="display_order"
                defaultValue={blocks.length + 1}
                min={0}
                className="
                  h-11 w-full rounded-xl
                  border border-[#DCE3EB]
                  px-4 text-sm font-bold
                  text-[#07152E]
                  outline-none
                  focus:border-[#F7B548]
                "
              />
            </label>

            <button
              type="submit"
              className="
                inline-flex h-11
                items-center justify-center
                gap-2 rounded-xl
                bg-[#07152E] px-5
                text-xs font-black
                text-white transition
                hover:bg-[#10284E]
              "
            >
              <Plus size={16} />
              إضافة
            </button>
          </form>
        </section>

        <section className="mt-6">
          <div
            className="
              mb-4 flex items-center
              justify-between gap-3
            "
          >
            <div>
              <h2 className="text-lg font-black text-[#07152E]">
                Blocks الحالية
              </h2>

              <p className="mt-1 text-xs font-bold text-slate-500">
                العدد: {blocks.length}
              </p>
            </div>

            <Link
              href="/dev/page-builder"
              className="
                rounded-xl border
                border-[#F7B548]
                bg-[#FFF8E8] px-4 py-2
                text-xs font-black
                text-[#07152E]
                transition
                hover:bg-[#F7B548]
              "
            >
              معاينة النتيجة
            </Link>
          </div>

          {blocks.length === 0 ? (
            <div
              className="
                rounded-[24px]
                border-2 border-dashed
                border-[#D5DDE7]
                bg-white px-6 py-16
                text-center
              "
            >
              <Blocks
                size={36}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-lg font-black text-[#07152E]">
                لا توجد Blocks بعد
              </h3>

              <p className="mt-2 text-xs font-bold text-slate-500">
                استخدمي النموذج بالأعلى لإضافة أول
                Block.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <article
                  key={block.id}
                  className="
                    rounded-[22px]
                    border border-[#DCE3EB]
                    bg-white p-5
                    shadow-[0_10px_30px_rgba(7,21,46,0.05)]
                  "
                >
                  <div
                    className="
                      flex flex-col gap-5
                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                    "
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`
                          flex h-11 w-11
                          shrink-0 items-center
                          justify-center
                          rounded-xl
                          ${
                            block.active
                              ? "bg-[#07152E] text-[#F7B548]"
                              : "bg-slate-100 text-slate-400"
                          }
                        `}
                      >
                        <BlockTypeIcon
                          type={block.block_type}
                        />
                      </span>

                      <div>
                        <h3 className="font-black text-[#07152E]">
                          {block.title ||
                            "Block بدون عنوان"}
                        </h3>

                        <div
                          className="
                            mt-2 flex flex-wrap
                            items-center gap-2
                            text-[11px] font-bold
                            text-slate-500
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2.5 py-1
                            "
                          >
                            {getBlockTypeLabel(
                              block.block_type
                            )}
                          </span>

                          <span>
                            الترتيب:{" "}
                            {block.display_order}
                          </span>

                          <span
                            className={
                              block.active
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }
                          >
                            {block.active
                              ? "مفعّل"
                              : "غير مفعّل"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
  className="
    flex flex-wrap
    items-center gap-2
  "
>
  <Link
    href={`/admin/page-builder/${templateId}/panels/${panelId}/sections/${sectionId}/blocks/${block.id}/edit`}
    className="
      inline-flex min-h-10
      items-center justify-center
      gap-2 rounded-xl
      bg-[#F7B548]
      px-4 text-xs
      font-black
      text-[#07152E]
      transition
      hover:bg-[#E8A62A]
    "
  >
    <Blocks size={14} />
    تعديل المحتوى
  </Link>

  <details
    key={`${block.id}-${block.title}-${block.block_type}-${block.display_order}`}
    className="group"
  >
                        <summary
                          className="
                            inline-flex min-h-10
                            cursor-pointer
                            list-none
                            items-center
                            justify-center gap-2
                            rounded-xl
                            border border-[#DCE3EB]
                            px-4 text-xs
                            font-black
                            text-[#07152E]
                            transition
                            hover:border-[#F7B548]
                            hover:bg-[#FFF8E8]
                          "
                        >
                          <Pencil size={14} />
                          تعديل
                        </summary>

                        <form
                          action={updatePanelBlock}
                          className="
                            mt-4 grid gap-3
                            rounded-2xl
                            border border-[#DCE3EB]
                            bg-[#F8FAFC] p-4
                            md:grid-cols-[minmax(0,1fr)_160px_110px_auto]
                            md:items-end
                          "
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={block.id}
                          />

                          <input
                            type="hidden"
                            name="template_id"
                            value={templateId}
                          />

                          <input
                            type="hidden"
                            name="panel_id"
                            value={panelId}
                          />

                          <input
                            type="hidden"
                            name="section_id"
                            value={sectionId}
                          />

                          <label className="space-y-2">
                            <span className="text-xs font-black">
                              العنوان
                            </span>

                            <input
                              required
                              name="title"
                              defaultValue={
                                block.title ?? ""
                              }
                              className="
                                h-10 w-full
                                rounded-xl border
                                border-[#DCE3EB]
                                bg-white px-3
                                text-sm font-bold
                                outline-none
                                focus:border-[#F7B548]
                              "
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-black">
                              النوع
                            </span>

                            <select
                              name="block_type"
                              defaultValue={
                                block.block_type
                              }
                              className="
                                h-10 w-full
                                rounded-xl border
                                border-[#DCE3EB]
                                bg-white px-3
                                text-sm font-bold
                                outline-none
                              "
                            >
                              <option value="heading">
                                Heading
                              </option>

                              <option value="text">
                                Text
                              </option>

                              <option value="image">
                                Image
                              </option>

                              <option value="video">
                                Video
                              </option>
                            </select>
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs font-black">
                              الترتيب
                            </span>

                            <input
                              type="number"
                              name="display_order"
                              min={0}
                              defaultValue={
                                block.display_order
                              }
                              className="
                                h-10 w-full
                                rounded-xl border
                                border-[#DCE3EB]
                                bg-white px-3
                                text-sm font-bold
                                outline-none
                              "
                            />
                          </label>

                           <button
      type="submit"
      className="
        h-10 rounded-xl
        bg-[#07152E] px-4
        text-xs font-black
        text-white
      "
    >
      حفظ
                          </button>
                        </form>
                      </details>

                      <form
                        action={togglePanelBlock}
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={block.id}
                        />

                        <input
                          type="hidden"
                          name="current_active"
                          value={String(
                            block.active
                          )}
                        />

                        <input
                          type="hidden"
                          name="template_id"
                          value={templateId}
                        />

                        <input
                          type="hidden"
                          name="panel_id"
                          value={panelId}
                        />

                        <input
                          type="hidden"
                          name="section_id"
                          value={sectionId}
                        />

                        <button
                          type="submit"
                          className="
                            inline-flex min-h-10
                            items-center justify-center
                            gap-2 rounded-xl
                            border border-[#DCE3EB]
                            px-4 text-xs
                            font-black
                            text-[#07152E]
                            transition
                            hover:border-[#F7B548]
                            hover:bg-[#FFF8E8]
                          "
                        >
                          <Power size={14} />

                          {block.active
                            ? "تعطيل"
                            : "تفعيل"}
                        </button>
                      </form>

                      <form
                        action={deletePanelBlock}
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={block.id}
                        />

                        <input
                          type="hidden"
                          name="template_id"
                          value={templateId}
                        />

                        <input
                          type="hidden"
                          name="panel_id"
                          value={panelId}
                        />

                        <input
                          type="hidden"
                          name="section_id"
                          value={sectionId}
                        />

                        <button
                          type="submit"
                          className="
                            inline-flex min-h-10
                            items-center justify-center
                            gap-2 rounded-xl
                            border border-red-200
                            bg-red-50 px-4
                            text-xs font-black
                            text-red-600 transition
                            hover:bg-red-100
                          "
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}