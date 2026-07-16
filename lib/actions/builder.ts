"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateCoursePanelItem({
  table,
  id,
  values,
}: {
  table:
  | "course_learning_modes"
  | "course_result_tabs"
  | "course_stations";

  id: string;

  values: Record<string, unknown>;
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(table)
      .update(values)
      .eq("id", id);

  if (error) {
    console.error(error);

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}
export async function createCoursePanelItem({
  table,
  values,
}: {
  table:
    | "course_learning_modes"
    | "course_result_tabs";

  values: Record<string, unknown>;
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(table)
      .insert(values);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}
export async function deleteCoursePanelItem({
  table,
  id,
}: {
  table:
    | "course_learning_modes"
    | "course_result_tabs";

  id: string;
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(table)
      .delete()
      .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function swapPanelOrder({
  table,
  firstId,
  firstOrder,
  secondId,
  secondOrder,
}: {
  table:
    | "course_learning_modes"
    | "course_result_tabs";

  firstId: string;
  firstOrder: number;

  secondId: string;
  secondOrder: number;
}) {
  const supabase =
    await createClient();

  const { error: error1 } =
    await supabase
      .from(table)
      .update({
        display_order:
          secondOrder,
      })
      .eq("id", firstId);

  if (error1) {
    return {
      success: false,
      message: error1.message,
    };
  }

  const { error: error2 } =
    await supabase
      .from(table)
      .update({
        display_order:
          firstOrder,
      })
      .eq("id", secondId);

  if (error2) {
    return {
      success: false,
      message: error2.message,
    };
  }

  return {
    success: true,
  };
}

export async function createPanelSection({
  courseId,
  panelComponent,
  sectionKey,
  title,
  displayOrder,
}: {
  courseId: string;
  panelComponent: string;
  sectionKey: string;
  title: string;
  displayOrder: number;
}) {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("course_panel_sections")
      .insert({
        course_id: courseId,
        panel_component: panelComponent,
        section_key: sectionKey,
        title,
        display_order: displayOrder,
        active: true,
        updated_at:
          new Date().toISOString(),
      })
      .select("id")
      .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    id: data.id,
  };
}

export async function updatePanelSection({
  id,
  values,
}: {
  id: string;
  values: {
    section_key?: string;
    title?: string;
    display_order?: number;
    active?: boolean;
  };
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("course_panel_sections")
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function deletePanelSection({
  id,
}: {
  id: string;
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("course_panel_sections")
      .delete()
      .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function swapPanelSectionOrder({
  firstId,
  firstOrder,
  secondId,
  secondOrder,
}: {
  firstId: string;
  firstOrder: number;
  secondId: string;
  secondOrder: number;
}) {
  const supabase =
    await createClient();

  const { error: firstError } =
    await supabase
      .from("course_panel_sections")
      .update({
        display_order: secondOrder,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", firstId);

  if (firstError) {
    return {
      success: false,
      message: firstError.message,
    };
  }

  const { error: secondError } =
    await supabase
      .from("course_panel_sections")
      .update({
        display_order: firstOrder,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", secondId);

  if (secondError) {
    return {
      success: false,
      message: secondError.message,
    };
  }

  return {
    success: true,
  };
}

export async function createCourseTemplate({
  name,
  slug,
  templateType,
}: {
  name: string;
  slug: string;
  templateType:
    | "road"
    | "traffic"
    | "general";
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("course_templates")
      .insert({
        name,
        slug,

        template_type:
          templateType,

        version: 1,

        is_active: true,

        is_default: false,
      });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function updateCourseTemplate({
  id,
  values,
}: {
  id: string;

  values: {
    name?: string;
    description?: string | null;
    template_type?:
      | "road"
      | "traffic"
      | "general";
    is_active?: boolean;
  };
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("course_templates")
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function deleteCourseTemplate({
  id,
}: {
  id: string;
}) {
  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("course_templates")
      .delete()
      .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function setDefaultCourseTemplate({
  id,
  templateType,
}: {
  id: string;

  templateType:
    | "road"
    | "traffic"
    | "general";
}) {
  const supabase =
    await createClient();

  const {
    error: resetError,
  } = await supabase
    .from("course_templates")
    .update({
      is_default: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "template_type",
      templateType
    );

  if (resetError) {
    return {
      success: false,
      message:
        resetError.message,
    };
  }

  const {
    error: defaultError,
  } = await supabase
    .from("course_templates")
    .update({
      is_default: true,
      is_active: true,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (defaultError) {
    return {
      success: false,
      message:
        defaultError.message,
    };
  }

  return {
    success: true,
  };
}

export async function duplicateCourseTemplate({
  templateId,
}: {
  templateId: string;
}) {
  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("course_templates")
      .select("*")
      .eq("id", templateId)
      .single();

  if (error || !data) {
    return {
      success: false,
      message:
        error?.message ??
        "Template not found.",
    };
  }

  const nextVersion =
    data.version + 1;

  const { error: insertError } =
  await supabase
    .from("course_templates")
    .insert({
      name:
        `${data.name.split(" V")[0]} V${nextVersion}`,

      slug:
        `${data.slug}-v${nextVersion}`,

      description:
        data.description,

      template_type:
        data.template_type,

      source_station_id:
        data.source_station_id,

      content_schema:
        data.content_schema,

      layout_schema:
        data.layout_schema,

      version:
        nextVersion,

      is_default:
        false,

      is_active:
        true,
    });

  if (insertError) {
    return {
      success: false,
      message:
        insertError.message,
    };
  }

  return {
    success: true,
  };
}