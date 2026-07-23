"use client";

import type {
  CatalogBuiltTemplatePage,
} from "@/lib/queries/catalog/page-builder";

import CourseRenderer from "@/components/course/renderer/CourseRenderer";

import {
  ProfessionalPanelEditor,
  createInitialProfessionalPanel,
  normalizeProfessionalPanel,
  type ProfessionalPanelDraft,
} from "@/components/course/editor";

import {
  saveCourseScreenContent,
} from "@/lib/actions/course-screen-content";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  CalendarDays,
  Eye,
  Gift,
  MessageSquareQuote,
  PlayCircle,
  Rocket,
  Target,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import ProfessionalPanelViewer from "./ProfessionalPanelViewer";
import SideMenu from "./SideMenu";

import type {
  PanelMenuItemData,
} from "./PanelMenuItem";

import type {
  Course,
  CoursePanelTab,
  FreeSession,
  Review,
  Workshop,
} from "@/data/types";

import type {
  CatalogCoursePanelItem,
} from "@/lib/queries/catalog/panels";

import {
  useBuilder,
} from "@/components/builder/BuilderProvider";

import {
  swapPanelOrder,
} from "@/lib/actions/builder";

import type { EnrollmentStatusMap } from "@/lib/actions/enroll";

export type PlatformPageMode =
  | "student"
  | "edit"
  | "preview"
  | "admin";

type CourseInteractiveDashboardProps = {
  mode?: PlatformPageMode;
  stationId: string;
  builderPage?: CatalogBuiltTemplatePage;
  course: Course;
  enrollmentStatuses?: EnrollmentStatusMap;
  freeSessions: FreeSession[];
  workshops: Workshop[];
  reviews: Review[];
  learningModes: CatalogCoursePanelItem[];
  resultTabs: CatalogCoursePanelItem[];
  learningColumnTitle?: string;
  resultColumnTitle?: string;

  /** محتوى كل زر، مفهرس بقيمة panel_component. */
  initialPanelContents?: Record<
    string,
    Partial<ProfessionalPanelDraft> | null
  >;
};

const panelIconMap = {
  "play-circle": PlayCircle,
  "calendar-days": CalendarDays,
  rocket: Rocket,
  target: Target,
  gift: Gift,
  "message-square-quote": MessageSquareQuote,
} as const;

export default function CourseInteractiveDashboard({
  mode = "student",
  stationId,
  course,
  enrollmentStatuses,
  freeSessions,
  workshops,
  reviews,
  builderPage,
  learningModes,
  resultTabs,
  learningColumnTitle = "اختر طريقة التعلم",
  resultColumnTitle = "نتائج الرحلة",
  initialPanelContents = {},
}: CourseInteractiveDashboardProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [isSavingPanel, setIsSavingPanel] =
    useState(false);

  const normalizePanelMap = (
    values: Record<
      string,
      Partial<ProfessionalPanelDraft> | null
    >
  ): Record<string, ProfessionalPanelDraft> =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value
          ? normalizeProfessionalPanel(value)
          : createInitialProfessionalPanel(),
      ])
    );

  const [panelContents, setPanelContents] = useState<
    Record<string, ProfessionalPanelDraft>
  >(() => normalizePanelMap(initialPanelContents));

  const {
    mode: builderMode,
    selectElement,
    openPanelItemEditor,
  } = useBuilder();

  const normalizedMode =
    mode === "admin" ? "edit" : builderMode;

  const isEditMode = normalizedMode === "edit";

  const mappedLearningItems =
    useMemo<PanelMenuItemData[]>(
      () =>
        learningModes.map((item) => ({
          databaseId: item.id,
          id:
            item.panel_component as CoursePanelTab,
          title: item.title,
          icon:
            panelIconMap[
              item.icon as keyof typeof panelIconMap
            ] ?? PlayCircle,
          displayOrder: item.display_order,
        })),
      [learningModes]
    );

  const mappedResultItems =
    useMemo<PanelMenuItemData[]>(
      () =>
        resultTabs.map((item) => ({
          databaseId: item.id,
          id:
            item.panel_component as CoursePanelTab,
          title: item.title,
          icon:
            panelIconMap[
              item.icon as keyof typeof panelIconMap
            ] ?? Target,
          displayOrder: item.display_order,
        })),
      [resultTabs]
    );

  const defaultPanel =
    mappedLearningItems.find(
      (item) => item.id === "professional"
    )?.id ??
    mappedLearningItems[0]?.id ??
    mappedResultItems[0]?.id ??
    "professional";

  const [activePanel, setActivePanel] =
    useState<CoursePanelTab>(defaultPanel);

  const [displayedPanel, setDisplayedPanel] =
    useState<CoursePanelTab>(defaultPanel);

  const [panelVisible, setPanelVisible] =
    useState(true);

  useEffect(() => {
    setPanelContents(normalizePanelMap(initialPanelContents));
  }, [initialPanelContents, stationId]);

  useEffect(() => {
    const availablePanels = [
      ...mappedLearningItems,
      ...mappedResultItems,
    ].map((item) => item.id);

    if (
      availablePanels.length > 0 &&
      !availablePanels.includes(activePanel)
    ) {
      setActivePanel(defaultPanel);
      setDisplayedPanel(defaultPanel);
    }
  }, [
    activePanel,
    defaultPanel,
    mappedLearningItems,
    mappedResultItems,
  ]);

  useEffect(() => {
    if (activePanel === displayedPanel) {
      return;
    }

    setPanelVisible(false);

    const timer = window.setTimeout(() => {
      setDisplayedPanel(activePanel);

      window.requestAnimationFrame(() => {
        setPanelVisible(true);
      });
    }, 160);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activePanel, displayedPanel]);

  const openItemEditor = (
    table:
      | "course_learning_modes"
      | "course_result_tabs",
    group: "learning" | "result",
    item: PanelMenuItemData
  ) => {
    openPanelItemEditor({
      table,
      recordId: item.databaseId,
      group,
      title: item.title,
      displayOrder: item.displayOrder,
      active: true,
    });
  };

  const createItem = (
    table:
      | "course_learning_modes"
      | "course_result_tabs",
    group: "learning" | "result",
    nextOrder: number
  ) => {
    selectElement({
      id: crypto.randomUUID(),
      type: "panel-item",
      label: "إضافة زر جديد",
      value: "",
      originalValue: "",
      table,
      field: "title",
      group,
      recordId: "",
      pageType: stationId,
      displayOrder: nextOrder,
      scope: "page",
    });
  };

  const moveItem = (
    table:
      | "course_learning_modes"
      | "course_result_tabs",
    items: PanelMenuItemData[],
    item: PanelMenuItemData,
    direction: "up" | "down"
  ) => {
    if (isPending) {
      return;
    }

    const currentIndex = items.findIndex(
      (currentItem) =>
        currentItem.databaseId === item.databaseId
    );

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    const targetItem = items[targetIndex];

    if (currentIndex < 0 || !targetItem) {
      return;
    }

    startTransition(async () => {
      const result = await swapPanelOrder({
        table,
        firstId: item.databaseId,
        firstOrder: item.displayOrder,
        secondId: targetItem.databaseId,
        secondOrder: targetItem.displayOrder,
      });

      if (!result.success) {
        window.alert(
          result.message ??
            "تعذر تغيير ترتيب الأزرار."
        );
        return;
      }

      router.refresh();
    });
  };

  const currentPanelContent =
    panelContents[displayedPanel] ??
    createInitialProfessionalPanel();

  const updateCurrentPanelContent = (
    value: ProfessionalPanelDraft
  ) => {
    setPanelContents((current) => ({
      ...current,
      [displayedPanel]: value,
    }));
  };

  const handleSavePanel = async (
    value: ProfessionalPanelDraft
  ) => {
    setIsSavingPanel(true);

    try {
      await saveCourseScreenContent({
        stationId,
        panelComponent: displayedPanel,
        screenTitle: value.screenTitle,
        columnCount: value.columnCount,
        columnOneTitle: value.columnOneTitle,
        columnTwoTitle: value.columnTwoTitle,
        content: value,
      });

      updateCurrentPanelContent(value);
      window.alert("تم حفظ الشاشة بنجاح.");
      router.refresh();
    } catch (error) {
      console.error("Failed to save panel:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "حدث خطأ غير معروف أثناء الحفظ.";

      window.alert(
        `حدث خطأ أثناء حفظ الشاشة:

${errorMessage}`
      );
    } finally {
      setIsSavingPanel(false);
    }
  };

  const renderCenterContent = () => {
    if (isEditMode) {
      return (
        <ProfessionalPanelEditor
          key={`${stationId}-${displayedPanel}-editor`}
          value={currentPanelContent}
          onChange={updateCurrentPanelContent}
          onSave={handleSavePanel}
          isSaving={isSavingPanel}
        />
      );
    }

    if (builderPage) {
      return <CourseRenderer page={builderPage} />;
    }

    return (
      <ProfessionalPanelViewer
        key={`${stationId}-${displayedPanel}-viewer`}
        stationId={stationId}
        courseId={course.slug}
        panelComponent={displayedPanel}
        enrollmentStatuses={enrollmentStatuses}
        value={currentPanelContent}
      />
    );
  };

  return (
    <section
      dir="rtl"
      className="bg-[#F7F8FA] px-4 pb-12 pt-7 sm:px-6"
    >
      <div className="mx-auto max-w-[1580px]">
        {isEditMode && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#DCE3EB] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(7,21,46,0.07)]">
            <div>
              <p className="text-[13px] font-black text-[#07152E]">
                وضع تحرير الصفحة
              </p>

              <p className="mt-1 text-[10px] font-bold text-slate-500">
                أدوات الإدارة ظاهرة لك فقط، مع الحفاظ على شكل صفحة الطالب.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#FFF7E3] px-3 py-1.5 text-[11px] font-black text-[#B87508]">
              <Eye size={15} />
              {isPending
                ? "جارٍ ترتيب الأزرار..."
                : "معاينة مباشرة"}
            </div>
          </div>
        )}

        <div className="relative flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:gap-0">
          <div className="order-1 w-full lg:relative lg:z-10 lg:mt-[76px] lg:w-[205px] lg:shrink-0 xl:w-[220px]">
            <SideMenu
              mode={normalizedMode}
              title={learningColumnTitle}
              items={mappedLearningItems}
              activePanel={activePanel}
              onChange={setActivePanel}
              onEditTitle={() =>
                selectElement({
                  id: `learning-column-title-${stationId}`,
                  type: "title",
                  label: "عنوان عمود طريقة التعلم",
                  value: learningColumnTitle,
                  originalValue: learningColumnTitle,
                  scope: "page",
                  table: "course_stations",
                  recordId: stationId,
                  field: "learning_column_title",
                  group: "learning",
                })
              }
              onAdd={() =>
                createItem(
                  "course_learning_modes",
                  "learning",
                  mappedLearningItems.length + 1
                )
              }
              onEditItem={(item) =>
                openItemEditor(
                  "course_learning_modes",
                  "learning",
                  item
                )
              }
              onMoveUp={(item) =>
                moveItem(
                  "course_learning_modes",
                  mappedLearningItems,
                  item,
                  "up"
                )
              }
              onMoveDown={(item) =>
                moveItem(
                  "course_learning_modes",
                  mappedLearningItems,
                  item,
                  "down"
                )
              }
            />
          </div>

          <div className="order-3 w-full min-w-0 lg:order-2 lg:relative lg:z-20 lg:-mx-1 lg:flex-1">
            {renderCenterContent()}
          </div>

          <div className="order-2 w-full lg:order-3 lg:relative lg:z-10 lg:mt-[76px] lg:w-[205px] lg:shrink-0 xl:w-[220px]">
            <SideMenu
              mode={normalizedMode}
              title={resultColumnTitle}
              items={mappedResultItems}
              activePanel={activePanel}
              onChange={setActivePanel}
              onEditTitle={() =>
                selectElement({
                  id: `result-column-title-${stationId}`,
                  type: "title",
                  label: "عنوان عمود نتائج الرحلة",
                  value: resultColumnTitle,
                  originalValue: resultColumnTitle,
                  scope: "page",
                  table: "course_stations",
                  recordId: stationId,
                  field: "result_column_title",
                  group: "result",
                })
              }
              onAdd={() =>
                createItem(
                  "course_result_tabs",
                  "result",
                  mappedResultItems.length + 1
                )
              }
              onEditItem={(item) =>
                openItemEditor(
                  "course_result_tabs",
                  "result",
                  item
                )
              }
              onMoveUp={(item) =>
                moveItem(
                  "course_result_tabs",
                  mappedResultItems,
                  item,
                  "up"
                )
              }
              onMoveDown={(item) =>
                moveItem(
                  "course_result_tabs",
                  mappedResultItems,
                  item,
                  "down"
                )
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}