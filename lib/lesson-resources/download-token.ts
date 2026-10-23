import { createHmac, timingSafeEqual } from "crypto";

/*
 * روابط تحميل مرفقات الدروس.
 * عند عرض الصفحة لا ننشئ رابط Supabase (كان يُنشأ لكل مرفق مع كل فتح للصفحة).
 * بدلًا من ذلك نعطي الطالب «تذكرة» موقّعة محليًا (بدون أي طلب لقاعدة البيانات)
 * لا تصدر إلا لمن اجتاز فحص الصلاحية، والرابط الحقيقي يُنشأ فقط عند الضغط على «تحميل».
 *
 * ملف سيرفر عادي (ليس "use server"): لا يُستورد من مكونات المتصفح.
 */

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

function secret() {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }
  return createHmac("sha256", base)
    .update("masar-lesson-resource-download-v1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Ticket for one resource, valid 24 h, only for the viewer who passed the access check. */
export function createResourceDownloadToken(
  resourceId: string,
  viewerUserId: string,
): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${resourceId}.${viewerUserId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyResourceDownloadToken(
  token: string,
): { resourceId: string; userId: string } | null {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 4) return null;

  const [resourceId, userId, expText, signature] = parts;
  const payload = `${resourceId}.${userId}.${expText}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  return { resourceId, userId };
}

/** Same download file name as before: "<title>.<ext>". */
export function resourceDownloadFileName(
  title: string | null | undefined,
  filePath: string,
) {
  const resourceTitle = title?.trim() || "مرفق";
  const storedFileName = filePath.split("/").pop() ?? "";
  const extension = storedFileName.match(/(\.[^./\\]+)$/)?.[1] ?? "";

  return extension &&
    !resourceTitle.toLowerCase().endsWith(extension.toLowerCase())
    ? `${resourceTitle}${extension}`
    : resourceTitle;
}
