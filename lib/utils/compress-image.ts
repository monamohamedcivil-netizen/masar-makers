/*
 * ضغط الصور في المتصفح قبل رفعها إلى Supabase Storage.
 *
 * الهدف: تقليل حجم الصور (وبالتالي استهلاك نقل البيانات Egress)
 * دون تغيير شكلها بشكل ملحوظ.
 *
 * - الحد الأقصى للعرض/الارتفاع: 1600 بكسل.
 * - الصيغة: WebP بجودة 0.82.
 * - صور GIF لا تُضغط (حتى لا تفقد الحركة).
 * - إذا فشل الضغط أو لم يصغّر الحجم، نرفع الملف الأصلي كما هو.
 */

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 150 * 1024;

export async function compressImageForUpload(
  file: File,
): Promise<File> {
  try {
    if (
      typeof window === "undefined" ||
      typeof createImageBitmap !== "function"
    ) {
      return file;
    }

    // GIF قد تكون متحركة، والصور الصغيرة لا تحتاج ضغطًا.
    if (
      file.type === "image/gif" ||
      file.size <= SKIP_BELOW_BYTES
    ) {
      return file;
    }

    const bitmap = await createImageBitmap(file);

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    // أي خطأ: نرفع الصورة الأصلية بدون ضغط.
    return file;
  }
}
