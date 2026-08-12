"use server";

import {
  createSignedProjectUrl,
} from "./project-storage";

import type {
  StudentProjectImage,
} from "./types";

type ImageRow = {
  id: string;

  project_id: string;

  image_url: string;

  storage_path: string | null;

  is_cover: boolean;

  show_in_course: boolean;

  sort_order: number;
};

export async function mapProjectImage(
  row: ImageRow,
): Promise<StudentProjectImage> {

  const signedUrl =
    await createSignedProjectUrl(
      row.storage_path,
    );

  return {

    id: row.id,

    projectId:
      row.project_id,

    imageUrl:
      signedUrl ?? "",

    storagePath:
      row.storage_path,

    isCover:
      row.is_cover,

    showInCourse:
      row.show_in_course,

    sortOrder:
      row.sort_order,

  };
}