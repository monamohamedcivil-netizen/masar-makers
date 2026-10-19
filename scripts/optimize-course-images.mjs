/*
 * تقليل حجم صور الكورسات الموجودة في Supabase Storage (bucket: course-images)
 * لتقليل استهلاك نقل البيانات (Egress).
 *
 * الاستخدام (من مجلد المشروع):
 *
 *   1) تجربة بدون أي تعديل على Supabase (تحفظ نسخًا مصغّرة للمعاينة فقط):
 *        node scripts/optimize-course-images.mjs
 *
 *   2) التطبيق الفعلي (يحفظ نسخة احتياطية من الأصل ثم يستبدل الصورة بنفس المسار):
 *        node scripts/optimize-course-images.mjs --apply
 *
 *   اختياري: تجربة على عدد قليل أولًا:
 *        node scripts/optimize-course-images.mjs --limit 3
 *
 * ملاحظات أمان:
 * - المسار والامتداد ونوع الملف تبقى كما هي، فلا تنكسر أي روابط في المنصة.
 * - لا تُستبدل أي صورة إلا إذا وفّرت 15% على الأقل من حجمها.
 * - الأصول تُحفظ محليًا في المجلد backup-course-images قبل الاستبدال.
 * - يحتاج الملف .env.local الذي يحتوي NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "course-images";
const MAX_DIMENSION = 1600;
const MIN_FILE_BYTES = 200 * 1024; // نتجاهل الصور الصغيرة.
const MIN_SAVING_RATIO = 0.15; // لا نستبدل إلا إذا وفّرنا 15% أو أكثر.

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limitIndex = args.indexOf("--limit");
const limit =
  limitIndex >= 0 ? Number(args[limitIndex + 1]) || 0 : 0;

function loadEnvLocal() {
  const envPath = path.resolve(".env.local");

  if (!fs.existsSync(envPath)) {
    throw new Error(
      "لم أجد الملف .env.local في مجلد المشروع. شغّلي الأمر من مجلد المشروع.",
    );
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);

    if (!match) continue;

    const value = match[2].replace(/^["']|["']$/g, "");

    if (!(match[1] in process.env)) {
      process.env[match[1]] = value;
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير موجود في .env.local",
  );
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function listAllFiles(prefix = "") {
  const files = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 100, offset });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (item.id === null) {
        // مجلد
        files.push(...(await listAllFiles(itemPath)));
      } else {
        files.push({
          path: itemPath,
          size: Number(item.metadata?.size ?? 0),
          mime: item.metadata?.mimetype ?? "",
        });
      }
    }

    if (data.length < 100) break;
    offset += 100;
  }

  return files;
}

async function optimize(buffer, ext) {
  let pipeline = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (ext === "png") {
    pipeline = pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: 85,
      effort: 10,
    });
  } else if (ext === "webp") {
    pipeline = pipeline.webp({ quality: 82 });
  } else {
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  }

  return pipeline.toBuffer();
}

function mb(bytes) {
  return (bytes / 1048576).toFixed(2) + " MB";
}

const all = await listAllFiles();
const candidates = all
  .filter((file) => /\.(png|jpe?g|webp)$/i.test(file.path))
  .filter((file) => file.size >= MIN_FILE_BYTES)
  .sort((a, b) => b.size - a.size);

const work = limit > 0 ? candidates.slice(0, limit) : candidates;

console.log(
  `عدد ملفات الصور: ${all.length} | مرشحة للضغط: ${candidates.length}` +
    (limit ? ` | سيتم تجربة: ${work.length}` : ""),
);
console.log(
  apply
    ? "الوضع: تطبيق فعلي (سيتم الاستبدال في Supabase)"
    : "الوضع: تجربة فقط (لن يتغير شيء في Supabase)",
);

let before = 0;
let after = 0;
let replaced = 0;

for (const file of work) {
  const ext = file.path.split(".").pop().toLowerCase().replace("jpeg", "jpg");

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(file.path);

  if (downloadError || !blob) {
    console.log(`تعذر تحميل ${file.path}: ${downloadError?.message}`);
    continue;
  }

  const original = Buffer.from(await blob.arrayBuffer());
  let optimized;

  try {
    optimized = await optimize(original, ext);
  } catch (error) {
    console.log(`تعذر ضغط ${file.path}: ${error.message}`);
    continue;
  }

  const saving = 1 - optimized.length / original.length;

  if (saving < MIN_SAVING_RATIO) {
    console.log(
      `تخطي (التوفير ${(saving * 100).toFixed(0)}% فقط): ${file.path}`,
    );
    continue;
  }

  before += original.length;
  after += optimized.length;

  console.log(
    `${mb(original.length)} -> ${mb(optimized.length)} ` +
      `(-${(saving * 100).toFixed(0)}%)  ${file.path}`,
  );

  if (!apply) {
    const previewPath = path.join("optimized-preview", file.path);
    fs.mkdirSync(path.dirname(previewPath), { recursive: true });
    fs.writeFileSync(previewPath, optimized);
    continue;
  }

  // نسخة احتياطية من الأصل قبل الاستبدال.
  const backupPath = path.join("backup-course-images", file.path);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, original);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(file.path, optimized, {
      upsert: true,
      contentType: file.mime || blob.type,
      cacheControl: "31536000",
    });

  if (uploadError) {
    console.log(`فشل الرفع لـ ${file.path}: ${uploadError.message}`);
    continue;
  }

  replaced += 1;
}

console.log("--------------------------------------------");
console.log(`الحجم قبل: ${mb(before)} | بعد: ${mb(after)} | الموفَّر: ${mb(before - after)}`);
console.log(
  apply
    ? `تم استبدال ${replaced} صورة. الأصول محفوظة في backup-course-images`
    : "هذه تجربة فقط. راجعي الصور في المجلد optimized-preview، ثم شغّلي الأمر مع --apply",
);
