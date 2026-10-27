/*
 * تحويل الصور إلى WebP في المتصفح قبل رفعها إلى Supabase Storage.
 *
 * - كل صورة JPG / PNG (وأي صيغة يقرأها المتصفح) تتحول إلى WebP بجودة 0.82.
 * - الحد الأقصى للعرض/الارتفاع: 1600 بكسل (الأكبر يُصغَّر بنفس النسبة).
 * - صورة WebP صغيرة الأبعاد تُرفع كما هي (لا داعي لإعادة ضغطها).
 * - GIF لا تُحوَّل (حتى لا تفقد الحركة)، وكذلك SVG (صورة متجهة).
 * - إذا فشل التحويل (متصفح قديم أو صيغة غير مدعومة) نرفع الملف الأصلي كما هو.
 */

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

const SKIP_TYPES = ["image/gif", "image/svg+xml"];

export async function compressImageForUpload(
  file: File,
): Promise<File> {
  try {
    if (
      typeof window === "undefined" ||
      typeof createImageBitmap !== "function" ||
      !file.type.startsWith("image/") ||
      SKIP_TYPES.includes(file.type)
    ) {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const largest = Math.max(bitmap.width, bitmap.height);

    // WebP بالفعل وأبعاده مناسبة → كما هو.
    if (file.type === "image/webp" && largest <= MAX_DIMENSION) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, MAX_DIMENSION / largest);
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

    // المتصفح لا يدعم WebP (يرجع PNG) → نرفع الأصل.
    if (!blob || blob.type !== "image/webp") {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    // أي خطأ: نرفع الصورة الأصلية بدون تحويل.
    return file;
  }
}
