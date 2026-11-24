import type {
  ProfessionalPanelDraft,
  ProfessionalContentBlock,
  ProfessionalJourneyColumn,
} from "@/components/course/editor";

export type StoredCourseScreenContent = {
  screen_title?: string | null;
  column_count?: number | null;
  column_one_title?: string | null;
  column_two_title?: string | null;
  content?: unknown;
};

export function mapStoredProfessionalContent(
  row: StoredCourseScreenContent | null
): Partial<ProfessionalPanelDraft> | null {
  if (!row) {
    return null;
  }

  const rawContent =
    row.content &&
    typeof row.content === "object"
      ? (row.content as Record<string, unknown>)
      : {};

  /*
   * الشكل الجديد:
   * يتم حفظ ProfessionalPanelDraft كاملًا داخل content.
   */
  if (Array.isArray(rawContent.blocks)) {
    return {
      ...(rawContent as Partial<ProfessionalPanelDraft>),
      screenTitle:
        typeof rawContent.screenTitle === "string"
          ? rawContent.screenTitle
          : row.screen_title ?? undefined,
      columnCount:
        rawContent.columnCount === 2 ||
        row.column_count === 2
          ? 2
          : 1,
      columnOneTitle:
        typeof rawContent.columnOneTitle === "string"
          ? rawContent.columnOneTitle
          : row.column_one_title ?? undefined,
      columnTwoTitle:
        typeof rawContent.columnTwoTitle === "string"
          ? rawContent.columnTwoTitle
          : row.column_two_title ?? undefined,
    };
  }

  /*
   * دعم البيانات التي حُفظت قبل هذا التعديل، وكان شكلها:
   * content: { columns: [{ title, blocks }, ...] }
   */
  const columns = Array.isArray(rawContent.columns)
    ? rawContent.columns
    : [];

  const blocks = columns.flatMap(
    (column, columnIndex) => {
      if (
        !column ||
        typeof column !== "object"
      ) {
        return [];
      }

      const record =
        column as Record<string, unknown>;

      if (!Array.isArray(record.blocks)) {
        return [];
      }

      const journey: ProfessionalJourneyColumn =
  columnIndex === 0
    ? "fundamental"
    : "advanced";

return record.blocks.map(
  (block): ProfessionalContentBlock => ({
    ...(block as ProfessionalContentBlock),
    journey,
  })
);
    }
  );

  return {
    screenTitle:
      row.screen_title ??
      "رحلة الاحتراف المتكاملة",
    columnCount:
      row.column_count === 2 ? 2 : 1,
    columnOneTitle:
      row.column_one_title ??
      getStoredColumnTitle(columns, 0) ??
      "رحلة الأساسيات",
    columnTwoTitle:
      row.column_two_title ??
      getStoredColumnTitle(columns, 1) ??
      "الرحلة المتقدمة",
    blocks,
  };
}

function getStoredColumnTitle(
  columns: unknown[],
  index: number
): string | null {
  const column = columns[index];

  if (
    !column ||
    typeof column !== "object"
  ) {
    return null;
  }

  const title =
    (column as Record<string, unknown>)
      .title;

  return typeof title === "string"
    ? title
    : null;
}

