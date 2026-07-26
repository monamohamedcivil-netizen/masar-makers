"use server";

import { createClient } from "@/lib/supabase/server";

const TEMPLATE_BUCKET = "certificate-templates";
const MAX_TEMPLATE_SIZE = 15 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export type CertificateTemplateData = {
  id: string;
  name: string;
  title: string;
  fileName: string | null;
  mimeType: string | null;
  storagePath: string;
  signedUrl: string | null;
  isActive: boolean;
};

export type CourseCertificateSettingsData = {
  certificateEnabled: boolean;
  displayTitle: string | null;
  template: CertificateTemplateData | null;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولاً.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    throw new Error("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  }

  return { supabase, user };
}

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : "";

  const safeBase = fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

  const base = safeBase || "certificate-template";

  return extension ? `${base}.${extension}` : base;
}

export async function getCertificateSettings(
  courseId: string,
): Promise<{
  success: boolean;
  message: string;
  data?: CourseCertificateSettingsData;
}> {
  try {
    const { supabase } = await requireAdmin();

    const { data: settings, error: settingsError } = await supabase
      .from("course_certificate_settings")
      .select(`
        certificate_enabled,
        display_title,
        template_id
      `)
      .eq("course_id", courseId)
      .maybeSingle();

    if (settingsError) {
      return { success: false, message: settingsError.message };
    }

    if (!settings?.template_id) {
      return {
        success: true,
        message: "لا يوجد قالب محفوظ لهذا الكورس.",
        data: {
          certificateEnabled: settings?.certificate_enabled ?? false,
          displayTitle: settings?.display_title ?? null,
          template: null,
        },
      };
    }

    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select(`
        id,
        name,
        title_ar,
        template_url,
        storage_path,
        file_name,
        mime_type,
        is_active
      `)
      .eq("id", settings.template_id)
      .maybeSingle();

    if (templateError) {
      return { success: false, message: templateError.message };
    }

    if (!template) {
      return {
        success: true,
        message: "إعدادات الشهادة موجودة ولكن القالب غير متاح.",
        data: {
          certificateEnabled: settings.certificate_enabled ?? false,
          displayTitle: settings.display_title ?? null,
          template: null,
        },
      };
    }

    const storagePath = template.storage_path || template.template_url || "";
    let signedUrl: string | null = null;

    if (storagePath) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(TEMPLATE_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (!signedError) signedUrl = signedData?.signedUrl ?? null;
    }

    return {
      success: true,
      message: "تم تحميل إعدادات الشهادة.",
      data: {
        certificateEnabled: settings.certificate_enabled ?? false,
        displayTitle: settings.display_title ?? null,
        template: {
          id: template.id,
          name: template.name,
          title: template.title_ar || settings.display_title || template.name,
          fileName: template.file_name,
          mimeType: template.mime_type,
          storagePath,
          signedUrl,
          isActive: template.is_active,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحميل إعدادات الشهادة.",
    };
  }
}

export async function saveCertificateTemplate(formData: FormData) {
  let uploadedPath: string | null = null;

  try {
    const { supabase, user } = await requireAdmin();

    const courseId = String(formData.get("courseId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const templateFile = formData.get("templateFile");

    console.log("=== SAVE CERTIFICATE TEMPLATE ===");
    console.log({
      courseId,
      title,
      hasFile: !!templateFile,
      fileType:
        templateFile && typeof templateFile === "object" && "type" in templateFile
          ? String(templateFile.type)
          : null,
      fileSize:
        templateFile && typeof templateFile === "object" && "size" in templateFile
          ? Number(templateFile.size)
          : null,
      fileName:
        templateFile && typeof templateFile === "object" && "name" in templateFile
          ? String(templateFile.name)
          : null,
    });

    if (!courseId) return { success: false, message: "رقم الكورس غير موجود." };
    if (!title) return { success: false, message: "عنوان الشهادة مطلوب." };

    if (
      !templateFile ||
      typeof templateFile !== "object" ||
      !("size" in templateFile) ||
      !("type" in templateFile) ||
      !("name" in templateFile) ||
      typeof templateFile.arrayBuffer !== "function" ||
      Number(templateFile.size) === 0
    ) {
      return { success: false, message: "اختاري ملف قالب الشهادة أولاً." };
    }

    const uploadedFile = templateFile as File;

    if (!ALLOWED_MIME_TYPES.has(uploadedFile.type)) {
      return {
        success: false,
        message: "صيغة الملف غير مدعومة. استخدمي PDF أو PNG أو JPG أو WEBP.",
      };
    }

    if (uploadedFile.size > MAX_TEMPLATE_SIZE) {
      return { success: false, message: "حجم الملف يجب ألا يتجاوز 15 ميجابايت." };
    }

    const { data: existingSettings, error: existingSettingsError } = await supabase
      .from("course_certificate_settings")
      .select("template_id")
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingSettingsError) {
      console.error("EXISTING SETTINGS ERROR", existingSettingsError);
      return { success: false, message: existingSettingsError.message };
    }

    let oldStoragePath: string | null = null;

    if (existingSettings?.template_id) {
      const { data: oldTemplate, error: oldTemplateError } = await supabase
        .from("certificate_templates")
        .select("storage_path, template_url")
        .eq("id", existingSettings.template_id)
        .maybeSingle();

      if (oldTemplateError) console.error("OLD TEMPLATE ERROR", oldTemplateError);
      oldStoragePath = oldTemplate?.storage_path || oldTemplate?.template_url || null;
    }

    const safeFileName = sanitizeFileName(uploadedFile.name);
    uploadedPath = `${courseId}/${crypto.randomUUID()}-${safeFileName}`;
    const fileBuffer = await uploadedFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(TEMPLATE_BUCKET)
      .upload(uploadedPath, fileBuffer, {
        contentType: uploadedFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    console.log("UPLOAD RESULT", { uploadedPath, uploadError });

    if (uploadError) {
      return { success: false, message: `تعذر رفع الملف: ${uploadError.message}` };
    }

    const templatePayload = {
      name: title,
      title_ar: title,
      template_url: uploadedPath,
      storage_path: uploadedPath,
      file_name: uploadedFile.name,
      mime_type: uploadedFile.type,
      is_active: true,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let templateId = existingSettings?.template_id ?? null;

    if (templateId) {
      const { error: updateTemplateError } = await supabase
        .from("certificate_templates")
        .update(templatePayload)
        .eq("id", templateId);

      console.log("UPDATE TEMPLATE RESULT", { templateId, updateTemplateError });

      if (updateTemplateError) {
        await supabase.storage.from(TEMPLATE_BUCKET).remove([uploadedPath]);
        return { success: false, message: updateTemplateError.message };
      }
    } else {
      const { data: createdTemplate, error: createTemplateError } = await supabase
        .from("certificate_templates")
        .insert(templatePayload)
        .select("id")
        .single();

      console.log("INSERT TEMPLATE RESULT", { createdTemplate, createTemplateError });

      if (createTemplateError || !createdTemplate) {
        await supabase.storage.from(TEMPLATE_BUCKET).remove([uploadedPath]);
        return {
          success: false,
          message: createTemplateError?.message ?? "تعذر حفظ بيانات قالب الشهادة.",
        };
      }

      templateId = createdTemplate.id;
    }

    const { error: settingsError } = await supabase
      .from("course_certificate_settings")
      .upsert(
        {
          course_id: courseId,
          certificate_enabled: true,
          template_id: templateId,
          display_title: title,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "course_id" },
      );

    console.log("UPSERT SETTINGS RESULT", { templateId, settingsError });

    if (settingsError) {
      return { success: false, message: settingsError.message };
    }

    if (oldStoragePath && oldStoragePath !== uploadedPath) {
      const { error: removeOldFileError } = await supabase.storage
        .from(TEMPLATE_BUCKET)
        .remove([oldStoragePath]);

      if (removeOldFileError) {
        console.error("REMOVE OLD TEMPLATE FILE ERROR", removeOldFileError);
      }
    }

    return { success: true, message: "تم حفظ قالب الشهادة بنجاح." };
  } catch (error) {
    console.error("SAVE CERTIFICATE TEMPLATE ERROR", error);

    if (uploadedPath) {
      try {
        const { supabase } = await requireAdmin();
        await supabase.storage.from(TEMPLATE_BUCKET).remove([uploadedPath]);
      } catch {
        // Ignore cleanup failure and return the original error.
      }
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ قالب الشهادة.",
    };
  }
}

export async function deleteCertificateTemplate(courseId: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: settings, error: settingsError } = await supabase
      .from("course_certificate_settings")
      .select("template_id")
      .eq("course_id", courseId)
      .maybeSingle();

    if (settingsError) return { success: false, message: settingsError.message };
    if (!settings?.template_id) {
      return { success: true, message: "لا يوجد قالب شهادة لحذفه." };
    }

    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select("storage_path, template_url")
      .eq("id", settings.template_id)
      .maybeSingle();

    if (templateError) return { success: false, message: templateError.message };

    const storagePath = template?.storage_path || template?.template_url || null;

    const { error: updateSettingsError } = await supabase
      .from("course_certificate_settings")
      .update({
        certificate_enabled: false,
        template_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("course_id", courseId);

    if (updateSettingsError) {
      return { success: false, message: updateSettingsError.message };
    }

    const { error: deleteTemplateError } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", settings.template_id);

    if (deleteTemplateError) {
      return { success: false, message: deleteTemplateError.message };
    }

    if (storagePath) {
      const { error: removeError } = await supabase.storage
        .from(TEMPLATE_BUCKET)
        .remove([storagePath]);

      if (removeError) console.error("DELETE TEMPLATE FILE ERROR", removeError);
    }

    return { success: true, message: "تم حذف قالب الشهادة." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "تعذر حذف قالب الشهادة.",
    };
  }
}