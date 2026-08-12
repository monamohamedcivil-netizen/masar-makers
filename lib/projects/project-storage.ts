"use server";

import { createClient } from "@/lib/supabase/server";

import { PROJECT_BUCKET } from "./constants";

export async function createSignedProjectUrl(
  storagePath: string | null,
) {
  if (!storagePath) return null;

  const supabase =
    await createClient();

  const { data, error } =
    await supabase.storage
      .from(PROJECT_BUCKET)
      .createSignedUrl(
        storagePath,
        60 * 60,
      );

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function uploadProjectImage(
  storagePath: string,
  file: File,
) {
  const supabase =
    await createClient();

  const { error } =
    await supabase.storage
      .from(PROJECT_BUCKET)
      .upload(
        storagePath,
        file,
      );

  if (error) {
    throw error;
  }
}

export async function deleteProjectImage(
  storagePath: string,
) {
  const supabase =
    await createClient();

  await supabase.storage
    .from(PROJECT_BUCKET)
    .remove([storagePath]);
}