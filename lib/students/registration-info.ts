import { createAdminClient } from "@/lib/supabase/server";

/*
 * بيانات الطالب الإنجليزية المحفوظة عند التسجيل الأول:
 *  - الاسم الإنجليزي (المخصص للشهادة) full_name_en
 *  - المهنة job_title
 *
 * عمود profiles.full_name_en غير معبّأ لكل الطلاب، لكن الاسم موجود دائمًا في
 * بيانات التسجيل (user_metadata)، فنقرأ الملف الشخصي أولًا ثم بيانات التسجيل.
 * ملف سيرفر فقط (يستخدم مفتاح الخدمة).
 */

export type StudentRegistrationInfo = {
  nameEn: string;
  jobTitle: string;
};

export async function getStudentRegistrationInfo(
  userIds: Array<string | null | undefined>,
): Promise<Map<string, StudentRegistrationInfo>> {
  const result = new Map<string, StudentRegistrationInfo>();

  const ids = Array.from(
    new Set(
      userIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    ),
  ).slice(0, 100);

  if (ids.length === 0) {
    return result;
  }

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,full_name_en")
    .in("id", ids);

  for (const profile of profiles ?? []) {
    result.set(String(profile.id), {
      nameEn:
        typeof profile.full_name_en === "string"
          ? profile.full_name_en.trim()
          : "",
      jobTitle: "",
    });
  }

  // نكمل الناقص (الاسم والمهنة) من بيانات التسجيل.
  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        const metadata = data?.user?.user_metadata ?? {};

        const current = result.get(id) ?? { nameEn: "", jobTitle: "" };

        const metaName =
          typeof metadata.full_name_en === "string"
            ? metadata.full_name_en.trim()
            : "";

        const metaJob =
          typeof metadata.job_title === "string"
            ? metadata.job_title.trim()
            : "";

        result.set(id, {
          nameEn: current.nameEn || metaName,
          jobTitle: current.jobTitle || metaJob,
        });
      } catch {
        // نتجاهل: يبقى ما وُجد من الملف الشخصي.
      }
    }),
  );

  return result;
}
