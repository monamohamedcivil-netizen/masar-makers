import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";
import { PROJECT_BUCKET } from "@/lib/projects/constants";

/*
 * يقدّم صور مشاريع الطلاب برابط ثابت مع تخزين طويل في المتصفح،
 * فلا تُحمَّل الصورة من Supabase إلا أول مرة على كل جهاز.
 *
 * الإتاحة:
 * - صور المشاريع المعتمدة: للجميع (هي أصلًا معروضة في صفحات المنصة العامة).
 * - غير ذلك: لصاحب الملف أو الأدمن فقط.
 */
export const dynamic = "force-dynamic";

const IMMUTABLE_YEAR = 60 * 60 * 24 * 365;

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams
    .get("p")
    ?.trim();

  if (
    !path ||
    path.length > 400 ||
    path.startsWith("/") ||
    path.includes("..") ||
    path.includes("\\")
  ) {
    return notFound();
  }

  const admin = createAdminClient();

  // هل الصورة تابعة لمشروع معتمد؟
  let approved = false;

  const { data: imageRow } = await admin
    .from("student_project_images")
    .select("project_id")
    .eq("storage_path", path)
    .limit(1)
    .maybeSingle();

  if (imageRow?.project_id) {
    const { data: project } = await admin
      .from("student_projects")
      .select("status")
      .eq("id", imageRow.project_id)
      .maybeSingle();

    approved = project?.status === "approved";
  }

  if (!approved) {
    const { data: coverProject } = await admin
      .from("student_projects")
      .select("id")
      .eq("cover_image", path)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    approved = Boolean(coverProject);
  }

  let allowed = approved;

  if (!allowed) {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      if (path.split("/")[0] === user.id) {
        allowed = true;
      } else {
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        allowed = ["admin", "super_admin"].includes(
          String(profile?.role ?? ""),
        );
      }
    }
  }

  if (!allowed) {
    return notFound();
  }

  const { data: blob, error } = await admin.storage
    .from(PROJECT_BUCKET)
    .download(path);

  if (error || !blob) {
    return notFound();
  }

  // هذا المسار للصور فقط؛ الفيديو يُشغَّل برابط موقّع عند الضغط على تشغيل.
  if (!blob.type.startsWith("image/")) {
    return new Response("Unsupported media", {
      status: 415,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": blob.type,
      "Cache-Control": `${
        approved ? "public" : "private"
      }, max-age=${IMMUTABLE_YEAR}, immutable`,
    },
  });
}
