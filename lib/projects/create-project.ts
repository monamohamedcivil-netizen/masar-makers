"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import { MAX_PROJECT_IMAGES } from "./constants";
export type CreateProjectInput = {
  enrollmentId: string | null;

  courseId: string;

  courseTitle: string;

  projectTitle: string;

  projectDescription: string;

  projectLink: string;

  images: File[];
};
async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    supabase,
    user,
  };
}
function sanitizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");
}
export async function createProject(
  input: CreateProjectInput,
) {
  const { supabase, user } =
    await requireUser();

  if (
    input.images.length === 0
  ) {
    throw new Error(
      "يجب اختيار صورة واحدة على الأقل."
    );
  }

  if (
    input.images.length >
    MAX_PROJECT_IMAGES
  ) {
    throw new Error(
      "عدد الصور أكبر من الحد المسموح."
    );
  }
  const {
  data: profile,
} = await supabase
  .from("profiles")
  .select("full_name,email")
  .eq("id", user.id)
  .single();
  const {
  data: project,
  error: projectError,
} = await supabase
  .from("student_projects")
  .insert({

    user_id: user.id,

    enrollment_id:
      input.enrollmentId,

    course_id:
      input.courseId,

    course_title:
      input.courseTitle,

    student_name:
      profile?.full_name ??
      "",

    student_email:
      profile?.email ??
      "",

    project_title:
      input.projectTitle,

    project_description:
      input.projectDescription,

    project_link:
      input.projectLink,

    status: "pending",

  })
  .select("id")
  .single();

if (
  projectError ||
  !project
) {
  throw new Error(
    projectError?.message
  );
}
for (
  let i = 0;
  i < input.images.length;
  i++
) {
  const file =
    input.images[i];

  const extension =
    file.name.split(".").pop();

  const path =
    `${user.id}/${project.id}/${Date.now()}-${i}.${extension}`;
    const {
  error: uploadError,
} = await supabase.storage

  .from(
    "student-projects",
  )

  .upload(path, file);

if (uploadError) {
  throw new Error(
    uploadError.message,
  );
}
await supabase
  .from("student_project_images")
  .insert({
    project_id: project.id,

    image_url: "",

    storage_path: path,

    is_cover: i === 0,

    show_in_course: false,

    sort_order: i,
  });
}
revalidatePath(
  "/dashboard",
);

return {

  success: true,

  projectId:
    project.id,

};
}