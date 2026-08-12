"use server";

import type {
  StudentDashboardData,
} from "@/lib/queries/student-dashboard";

import {
  getStudentDashboardData,
} from "@/lib/queries/student-dashboard";

export type AdminStudentDashboardResult =
  | {
      success: true;
      data: StudentDashboardData;
    }
  | {
      success: false;
      message: string;
    };

export async function getAdminStudentDashboardData(
  userId: string,
): Promise<AdminStudentDashboardResult> {
  if (!userId?.trim()) {
    return {
      success: false,
      message: "معرّف الطالب غير موجود.",
    };
  }

  try {
    const data =
      await getStudentDashboardData(userId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحميل بيانات الطالب.",
    };
  }
}