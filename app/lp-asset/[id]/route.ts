import { createAdminClient } from "@/lib/supabase/server";

/* صور صفحات هبوط الإعلانات المرفوعة من لوحة التحكم (مخزنة في ad_landing_assets). */

type Context = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ad_landing_assets")
    .select("mime,data")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.data) {
    return new Response("Not found", { status: 404 });
  }

  const raw = String(data.data);
  const bytes = raw.startsWith("\\x")
    ? Buffer.from(raw.slice(2), "hex")
    : Buffer.from(raw, "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": String(data.mime || "image/webp"),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
