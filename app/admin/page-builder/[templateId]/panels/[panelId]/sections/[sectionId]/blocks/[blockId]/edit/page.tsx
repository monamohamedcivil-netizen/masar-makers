import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import BlockEditorPage from "@/components/page-builder/editors/BlockEditorPage";

type Props = {
  params: Promise<{
    templateId: string;
    panelId: string;
    sectionId: string;
    blockId: string;
  }>;
};

export default async function Page({
  params,
}: Props) {
  const {
    templateId,
    panelId,
    sectionId,
    blockId,
  } = await params;

  const supabase = await createClient();

  const { data: block, error } = await supabase
    .from("panel_blocks")
    .select("*")
    .eq("id", blockId)
    .eq("panel_id", panelId)
    .eq("section_id", sectionId)
    .single();

  if (error || !block) {
    notFound();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-8"
    >
      <BlockEditorPage block={block} />
    </main>
  );
}