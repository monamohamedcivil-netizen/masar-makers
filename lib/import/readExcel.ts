import * as XLSX from "xlsx";
import { StudentImportRow } from "./types";

function normalizeBoolean(
  value: unknown,
): boolean {
  const normalizedValue = String(
    value ?? "",
  )
    .trim()
    .toLowerCase();

  return [
    "yes",
    "true",
    "1",
    "نعم",
  ].includes(normalizedValue);
}

function normalizeProgress(
  value: unknown,
): number | null {
  const text = String(
    value ?? "",
  ).trim();

  if (!text) {
    return null;
  }

  const numericValue =
    Number(text);

  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return null;
  }

  return Math.round(
    numericValue,
  );
}

export async function readImportExcel(
  file: File,
): Promise<StudentImportRow[]> {
  const buffer =
    await file.arrayBuffer();

  const workbook =
    XLSX.read(buffer);

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const rows =
    XLSX.utils.sheet_to_json<
      Record<string, unknown>
    >(sheet, {
      defval: "",
    });

  return rows.map((row) => ({
    studentName:
      String(
        row["Student Name"] ??
          "",
      ).trim(),

    studentNameEn:
      String(
        row[
          "Student Name English"
        ] ?? "",
      ).trim(),

    studentEmail:
      String(
        row["Student Email"] ??
          "",
      )
        .trim()
        .toLowerCase(),

    jobTitle:
      String(
        row["Job Title"] ??
          "",
      ).trim(),

    country:
      String(
        row["Country"] ??
          "",
      ).trim(),

    courseCode:
      String(
        row["Course Code"] ??
          "",
      ).trim(),

    journeyType:
      String(
        row["Journey Type"] ??
          row["JourneyType"] ??
          row["Journey"] ??
          "",
      ).trim(),

    progress:
      normalizeProgress(
        row["Progress"],
      ),

    fundamentalsProgress:
      normalizeProgress(
        row[
          "Fundamentals Progress"
        ],
      ),

    advancedProgress:
      normalizeProgress(
        row[
          "Advanced Progress"
        ],
      ),

    certificateType:
      String(
        row[
          "Certificate Type"
        ] ?? "",
      ).trim(),

    rating:
      Number(
        row["Rating"] ?? 0,
      ),

    generalReview:
      String(
        row[
          "General Review"
        ] ?? "",
      ).trim(),

    detailedSurveyCompleted:
      normalizeBoolean(
        row[
          "Detailed Survey Completed"
        ],
      ),

    showReviewHome:
      normalizeBoolean(
        row[
          "Show Review Home"
        ],
      ),

    showReviewCourse:
      normalizeBoolean(
        row[
          "Show Review Course"
        ],
      ),

    projectTitle:
      String(
        row[
          "Project Title"
        ] ?? "",
      ).trim(),

    projectDescription:
      String(
        row[
          "Project Description"
        ] ?? "",
      ).trim(),

    projectImages:
      String(
        row[
          "Project Images"
        ] ?? "",
      )
        .split(",")
        .map((image) =>
          image.trim(),
        )
        .filter(Boolean),

    showProjectHome:
      normalizeBoolean(
        row[
          "Show Project Home"
        ],
      ),

    showProjectCourse:
      normalizeBoolean(
        row[
          "Show Project Course"
        ],
      ),

    importSource:
      String(
        row[
          "Import Source"
        ] ??
          "admin_import",
      ).trim(),

    operation:
      String(
        row["Operation"] ??
          "",
      )
        .trim()
        .toLowerCase() ===
      "update"
        ? "Update"
        : "Insert",
  }));
}