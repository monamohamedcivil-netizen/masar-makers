"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { createDefaultBlockData } from "@/lib/page-builder/registry";

function getBuilderPath(templateId: string) {
  return `/admin/page-builder/${templateId}`;
}


export async function createTemplatePanel(
  templateId: string,
  formData: FormData
): Promise<void> {
  const title = String(
    formData.get("title") ?? ""
  ).trim();

  if (!templateId) {
    throw new Error("Template ID غير موجود.");
  }

  if (!title) {
    throw new Error("اكتبي اسم الـ Panel.");
  }

  const supabase = await createClient();

  const { data: lastPanel, error: orderError } =
    await supabase
      .from("course_panels")
      .select("display_order")
      .eq("template_id", templateId)
      .order("display_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (orderError) {
    console.error(
      "Failed to read panel order:",
      orderError
    );

    throw new Error(
      "تعذر تحديد ترتيب الـ Panel."
    );
  }

  const nextOrder =
    (lastPanel?.display_order ?? 0) + 1;

  const panelComponent =
    `custom-${crypto.randomUUID()}`;

  const { error } = await supabase
    .from("course_panels")
    .insert({
      template_id: templateId,
      panel_component: panelComponent,
      title,
      description: "",
      icon: "layout-panel-top",
      layout_type: "default",
      display_order: nextOrder,
      active: true,
    });

  if (error) {
    console.error(
      "Failed to create panel:",
      error
    );

    throw new Error(
      `تعذر إنشاء الـ Panel: ${error.message}`
    );
  }

  revalidatePath(
    getBuilderPath(templateId)
  );

  revalidatePath("/dev/page-builder");
}

export async function toggleTemplatePanel(
  templateId: string,
  panelId: string,
  currentActive: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_panels")
    .update({
      active: !currentActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", panelId)
    .eq("template_id", templateId);

  if (error) {
    console.error(
      "Failed to toggle panel:",
      error
    );

    throw new Error(
      `تعذر تحديث الـ Panel: ${error.message}`
    );
  }

  revalidatePath(
    getBuilderPath(templateId)
  );

  revalidatePath("/dev/page-builder");
}

export async function deleteTemplatePanel(
  templateId: string,
  panelId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_panels")
    .delete()
    .eq("id", panelId)
    .eq("template_id", templateId);

  if (error) {
    console.error(
      "Failed to delete panel:",
      error
    );

    throw new Error(
      `تعذر حذف الـ Panel: ${error.message}`
    );
  }

  revalidatePath(
    getBuilderPath(templateId)
  );

  revalidatePath("/dev/page-builder");
}

export async function createPanelSection(
  templateId: string,
  panelId: string,
  formData: FormData
): Promise<void> {
  const title = String(
    formData.get("title") ?? ""
  ).trim();

  if (!title) {
    throw new Error("اكتبي اسم الـ Section.");
  }

  const supabase = await createClient();

  const { data: lastSection, error: orderError } =
    await supabase
      .from("course_panel_sections")
      .select("display_order")
      .eq("panel_id", panelId)
      .order("display_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (orderError) {
    console.error(
      "Failed to read section order:",
      orderError
    );

    throw new Error(
      "تعذر تحديد ترتيب الـ Section."
    );
  }

  const nextOrder =
    (lastSection?.display_order ?? 0) + 1;

  const { error } = await supabase
    .from("course_panel_sections")
  .insert({
  panel_id: panelId,
  panel_component:
    `custom-section-${crypto.randomUUID()}`,
  section_key:
    `section-${crypto.randomUUID()}`,
  title,
  display_order: nextOrder,
  active: true,
});

  if (error) {
    console.error(
      "Failed to create section:",
      error
    );

    throw new Error(
      `تعذر إنشاء الـ Section: ${error.message}`
    );
  }

  revalidatePath(
    `/admin/page-builder/${templateId}/panels/${panelId}`
  );

  revalidatePath("/dev/page-builder");
}

export async function togglePanelSection(
  templateId: string,
  panelId: string,
  sectionId: string,
  currentActive: boolean
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_panel_sections")
    .update({
      active: !currentActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId)
    .eq("panel_id", panelId);

  if (error) {
    console.error(
      "Failed to toggle section:",
      error
    );

    throw new Error(
      `تعذر تحديث الـ Section: ${error.message}`
    );
  }

  revalidatePath(
    `/admin/page-builder/${templateId}/panels/${panelId}`
  );

  revalidatePath("/dev/page-builder");
}

export async function deletePanelSection(
  templateId: string,
  panelId: string,
  sectionId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("course_panel_sections")
    .delete()
    .eq("id", sectionId)
    .eq("panel_id", panelId);

  if (error) {
    console.error(
      "Failed to delete section:",
      error
    );

    throw new Error(
      `تعذر حذف الـ Section: ${error.message}`
    );
  }

  revalidatePath(
    `/admin/page-builder/${templateId}/panels/${panelId}`
  );

  revalidatePath("/dev/page-builder");
}


function getBlockPagePath(formData: FormData) {
  const templateId = String(formData.get("template_id") ?? "");
  const panelId = String(formData.get("panel_id") ?? "");
  const sectionId = String(formData.get("section_id") ?? "");

  return `/admin/page-builder/${templateId}/panels/${panelId}/sections/${sectionId}`;
}

export async function createPanelBlock(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const panelId = String(
  formData.get("panel_id") ?? ""
);

  const sectionId = String(
    formData.get("section_id") ?? ""
  );

  const title = String(
    formData.get("title") ?? ""
  ).trim();

 const blockType = String(
  formData.get("block_type") ?? "text"
);

const defaultData =
  createDefaultBlockData(blockType);

const displayOrder = Number(
  formData.get("display_order") ?? 0
);

if (!sectionId || !title) {
  throw new Error(
    "Section ID and block title are required."
  );
}

const { error } = await supabase
  .from("panel_blocks")
  .insert({
    panel_id: panelId,
    section_id: sectionId,
    title,
    block_type: blockType,
    display_order: displayOrder,
    active: true,
    data: defaultData,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getBlockPagePath(formData));
  revalidatePath("/dev/page-builder");
}

export async function updatePanelBlock(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const blockType = String(
    formData.get("block_type") ?? "text"
  );

  const displayOrder = Number(
    formData.get("display_order") ?? 0
  );

  if (!id || !title) {
    throw new Error(
      "Block ID and title are required."
    );
  }

  const { error } = await supabase
    .from("panel_blocks")
  .update({
    title,
    block_type: blockType,
    display_order: displayOrder,
    data: createDefaultBlockData(blockType),
})
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getBlockPagePath(formData));
  revalidatePath("/dev/page-builder");
}

export async function togglePanelBlock(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const currentActive =
    String(formData.get("current_active")) === "true";

  if (!id) {
    throw new Error("Block ID is required.");
  }

  const { error } = await supabase
    .from("panel_blocks")
    .update({
      active: !currentActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getBlockPagePath(formData));
  revalidatePath("/dev/page-builder");
}

export async function deletePanelBlock(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Block ID is required.");
  }

  const { error } = await supabase
    .from("panel_blocks")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getBlockPagePath(formData));
  revalidatePath("/dev/page-builder");
}

export async function updatePanelBlockData({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("panel_blocks")
    .update({
      data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Failed to update block data:",
      error
    );

    throw new Error(
      `تعذر حفظ محتوى الـ Block: ${error.message}`
    );
  }

  revalidatePath("/dev/page-builder");
}