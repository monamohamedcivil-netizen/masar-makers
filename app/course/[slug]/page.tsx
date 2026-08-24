import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/sections/Navbar";
import AnnouncementBar from "@/sections/AnnouncementBar";

import {
  CourseInteractiveDashboard,
  CourseJourneyHeader,
  CourseStats,
} from "@/components/course";

import { getCareerPaths } from "@/lib/queries/catalog/career-paths";

import { getCatalogCourseBySlug } from "@/lib/queries/catalog/courses";

import {
  getCourseLearningModes,
  getCourseResultTabs,
} from "@/lib/queries/catalog/panels";

import { getJourneyModules } from "@/lib/queries/catalog/journeys";

import { getStationBySlug } from "@/lib/queries/catalog/stations";

import {
  getCourseScreenContent,
} from "@/lib/actions/course-screen-content";

import type {
  ProfessionalPanelDraft,
  ProfessionalContentBlock,
  ProfessionalJourneyColumn,
} from "@/components/course/editor";

import {
  getCourse,
  getFreeSession,
  getWorkshop,
} from "@/lib/helpers";

import type {
  Course,
  CourseVariant,
  CurriculumItem,
  FreeSession,
  PathSlug,
  Review,
  Workshop,
} from "@/data/types";

import type {
  CatalogCareerPath,
} from "@/lib/queries/catalog/career-paths";

import type {
  CatalogCourse,
} from "@/lib/queries/catalog/courses";

import type {
  CatalogCoursePanelItem,
} from "@/lib/queries/catalog/panels";

import type {
  CatalogJourney,
} from "@/lib/queries/catalog/journeys";

import type {
  CatalogStation,
} from "@/lib/queries/catalog/stations";

import CourseActionButton from "@/components/course/CourseActionButton";
import BunnyVideoPlayer from "@/components/student/player/BunnyVideoPlayer";
import { getCourseEnrollmentAccess } from "@/lib/actions/enroll";
import {
  createAdminClient,
} from "@/lib/supabase/server";

import {
  getCourseProjects,
} from "@/lib/projects/student-projects";
type CoursePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    lesson?: string | string[];
    journey?: string | string[];
  }>;
};

type CoursePageData = {
  course: Course;
  path: CatalogCareerPath;
  station: CatalogStation;
  pathCourses: Course[];
  freeSessions: FreeSession[];
  workshops: Workshop[];
  reviews: Review[];
  catalogCourseId: string;
  learningModes: CatalogCoursePanelItem[];
  resultTabs: CatalogCoursePanelItem[];
  initialPanelContents: Record<
    string,
    Partial<ProfessionalPanelDraft> | null
  >;
};

export const dynamic = "force-dynamic";

/* ==================================================
   Metadata
================================================== */

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;

  const station = await getStationBySlug(slug);
  const catalogCourse = station
    ? null
    : await getCatalogCourseBySlug(slug);

  const title =
    station?.title ??
    catalogCourse?.title;

  const description =
    station?.description ??
    catalogCourse?.description;

  if (!title) {
    return {
      title: "الكورس غير موجود | Masar Makers",
    };
  }

  return {
    title: `${title} | Masar Makers`,
    description:
      description ??
      "استكشف الرحلات التعليمية في منصة صناع المسار.",
  };
}

/* ==================================================
   Page
================================================== */

export default async function CoursePage({
  params,
  searchParams,
}: CoursePageProps) {
  const { slug } = await params;

  const resolvedSearchParams = searchParams
    ? await searchParams
    : {};

  const selectedLesson = Array.isArray(
    resolvedSearchParams.lesson,
  )
    ? resolvedSearchParams.lesson[0]
    : resolvedSearchParams.lesson;

  const requestedJourney = Array.isArray(
    resolvedSearchParams.journey,
  )
    ? resolvedSearchParams.journey[0]
    : resolvedSearchParams.journey;

  const initialJourneyType =
    requestedJourney === "one_day" ||
    requestedJourney === "free" ||
    requestedJourney === "integrated"
      ? requestedJourney
      : "integrated";

  const pageData =
    await loadCoursePageData(slug);

const enrollmentAccess = pageData
  ? await getCourseEnrollmentAccess(slug)
  : {
      statuses: {},
      journeyStatuses: {},
      journeyTypes: [],
      hasFundamental: false,
      hasAdvanced: false,
      hasIntegrated: false,
      showFundamental: true,
      showAdvanced: true,
      showIntegrated: true,
    };
const courseProjects = pageData
  ? await getCourseProjects(
      pageData.course.variants
        ?.map((variant) => String(variant.id))
        .filter(Boolean) ??
        [String(pageData.course.id)],
    )
  : [];
  if (!pageData) {
    notFound();
  }

 const {
  course,
  path,
  station,
  catalogCourseId,
  pathCourses,
  freeSessions,
  workshops,
  reviews: courseReviews,
  learningModes,
  resultTabs,
  initialPanelContents,
} = pageData;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F8FA]"
    >
      <Navbar />

      {/* مساحة الـNavbar الثابت */}
      <div className="h-[55px]" />

      <AnnouncementBar />

      {selectedLesson ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-6">
          <BunnyVideoPlayer lessonId={selectedLesson} />
        </section>
      ) : null}

      <CourseJourneyHeader
        courses={pathCourses}
        currentCourseSlug={course.slug}
        pathTitle={path.title}
        pathSlug={path.slug}
      />

      {/*
        الإحصائيات تخص الرحلة المتكاملة
        أو الكورس الرئيسي داخل المحطة.
      */}
     <CourseStats
  course={course}
  catalogCourseId={catalogCourseId}
/>

   <CourseInteractiveDashboard
  mode="student"
  stationId={station.id}
  course={course}
  enrollmentStatuses={enrollmentAccess.statuses}
  enrollmentAccess={enrollmentAccess}
  freeSessions={freeSessions}
  workshops={workshops}
  reviews={courseReviews}
  projects={courseProjects}
  learningModes={learningModes}
  resultTabs={resultTabs}
  learningColumnTitle={
    station.learning_column_title ??
    "اختر طريقة التعلم"
  }
  resultColumnTitle={
    station.result_column_title ??
    "نتائج الرحلة"
  }
  initialPanelContents={initialPanelContents}
  initialJourneyType={initialJourneyType}
/>
    </main>
  );
}

/* ==================================================
   Load Page Data
================================================== */

async function loadCoursePageData(
  slug: string
): Promise<CoursePageData | null> {
  /*
    الأولوية الأولى:
    اعتبار الـSlug محطة، مثل:
    civil-site-design
    civil-3d
    bim-for-roads
  */
  let station =
    await getStationBySlug(slug);

  /*
    إذا لم يكن Slug محطة، نحاول اعتباره
    كورسًا فعليًا مثل csd-integrated.
  */
  let directCourse: CatalogCourse | null =
    null;

  if (!station) {
    directCourse =
      await getCatalogCourseBySlug(slug);

    if (!directCourse) {
      return null;
    }

    const careerPaths =
      await getCareerPaths();

    station =
      careerPaths
        .flatMap(
          (path) => path.course_stations
        )
        .find(
          (item) =>
            item.id ===
            directCourse?.station_id
        ) ?? null;
  }

  if (!station) {
    return null;
  }

  const careerPaths =
    await getCareerPaths();

  const path =
    careerPaths.find(
      (item) =>
        item.id === station.career_path_id
    ) ?? null;

  if (!path) {
    return null;
  }

  const activeStationCourses =
    station.courses
      .filter((course) => course.is_active)
      .sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

  if (activeStationCourses.length === 0) {
    return null;
  }

  /*
    الكورس الرئيسي الذي ستعتمد عليه
    الإحصائيات وبيانات الصفحة العامة.
  */
  const representativeCourse =
    directCourse ??
    findRepresentativeCourse(
      activeStationCourses
    );

  if (!representativeCourse) {
    return null;
  }

  /*
    نحول كورسات المحطة إلى Variants:
    Integrated / Fundamental / Advanced
  */
  const variants =
    await Promise.all(
      activeStationCourses.map(
        async (catalogCourse) =>
          buildCourseVariant(catalogCourse)
      )
    );

  const integratedVariant =
    variants.find(
      (variant) =>
        variant.type === "integrated"
    ) ??
    variants[0];

  const representativeJourney =
    findProfessionalJourney(
      representativeCourse
    );

  /*
    نستخدم بيانات الكورس المحلي كـFallback
    للهدايا والآراء والورش مؤقتًا.
  */
  const localCourse =
    getCourse(station.slug) ??
    getCourse(representativeCourse.slug);

  const course: Course = {
    ...(localCourse ?? {}),

    id:
      localCourse?.id ??
      representativeCourse.id,

    /*
      نستخدم Slug المحطة حتى يبقى رابط الصفحة:
      /course/civil-site-design
    */
    slug: station.slug,

journeyLayout: station.journey_layout,

    title: station.title,

    shortTitle:
      station.short_title ??
      station.title,

    description:
      station.description ??
      representativeCourse.description ??
      "",

    image:
      station.image_url ??
      representativeCourse.image_url ??
      "/images/courses/course-placeholder.jpg",

    icon:
      station.icon_url ??
      representativeCourse.icon_url ??
      "/images/courses/icons/default.png",

    pathSlug: path.slug,

    type: "professional",

    duration:
      integratedVariant?.duration ??
      formatHours(
        representativeCourse.duration_hours
      ),

    projects:
      integratedVariant?.projects ??
      formatProjects(
        representativeCourse.projects_count
      ),

    level:
      integratedVariant?.level ??
      representativeCourse.level ??
      "احترافي",

    instructorIds:
      localCourse?.instructorIds ?? [],

    curriculum:
      integratedVariant?.curriculum ??
      localCourse?.curriculum ??
      [],

    finalOutcome:
      integratedVariant?.finalOutcome ??
      representativeCourse.final_outcome ??
      localCourse?.finalOutcome,

    learningOutcomes:
      integratedVariant?.learningOutcomes ??
      localCourse?.learningOutcomes ??
      [],

    gifts:
      integratedVariant?.gifts ??
      localCourse?.gifts ??
      [],

    freeSessionSlugs:
      localCourse?.freeSessionSlugs ??
      [],

    workshopSlugs:
      localCourse?.workshopSlugs ??
      [],

    reviewIds:
      localCourse?.reviewIds ??
      [],

    professionalJourneyId:
      representativeJourney?.id,

    professionalJourneyStatus:
      representativeJourney?.status ??
      "coming_soon",

    variants,

    featured:
      representativeCourse.is_featured,

    active:
      station.is_active,

    order:
      station.display_order,

      statsJourneyCount:
  station.stats_journey_count,

statsLessonCount:
  station.stats_lesson_count,

statsTrainingHours:
  station.stats_training_hours,

statsLevelLabel:
  station.stats_level_label,

  } as Course;

  /*
    تقييمات صفحة الكورس تأتي من student_surveys مباشرة.
    نستخدم Course ID الحقيقي للـ representativeCourse حتى يظهر كل تقييم
    مفعّل له show_on_course داخل صفحة الكورس الصحيحة.
  */
  const reviews =
    await loadPublishedCourseReviews(
      representativeCourse.id,
      course.pathSlug,
      course.slug,
    );

  /*
    نحول محطات المسار إلى Course[]
    لأن CourseJourneyHeader الحالي يعتمد
    على النوع المحلي Course.
  */
  const pathCourses =
    path.course_stations
      .filter(
        (pathStation) =>
          pathStation.is_active
      )
      .map(
        (
          pathStation,
          stationIndex
        ) =>
          convertStationToHeaderCourse(
            pathStation,
            path.slug,
            stationIndex
          )
      )
      .sort(
        (a, b) => a.order - b.order
      );

  const freeSessions =
    loadLocalFreeSessions(course);

  const workshops =
    loadLocalWorkshops(course);

   const learningModes =
  await getCourseLearningModes(
    station.id
  );

const resultTabs =
  await getCourseResultTabs(
    station.id
  );

const panelComponents = Array.from(
  new Set(
    [...learningModes, ...resultTabs]
      .map((item) => item.panel_component)
      .filter(
        (value): value is string =>
          typeof value === "string" &&
          value.trim().length > 0
      )
  )
);

const storedPanelEntries = await Promise.all(
  panelComponents.map(async (panelComponent) => {
    const storedScreen = await getCourseScreenContent(
      station.id,
      panelComponent
    );

    return [
      panelComponent,
      mapStoredProfessionalContent(storedScreen),
    ] as const;
  })
);

const initialPanelContents = Object.fromEntries(
  storedPanelEntries
) as Record<
  string,
  Partial<ProfessionalPanelDraft> | null
>;

return {
  course,
  path,
  station,
  catalogCourseId: representativeCourse.id,
  pathCourses,
  freeSessions,
  workshops,
  reviews,
  learningModes,
  resultTabs,
  initialPanelContents,
};
}

/* ==================================================
   Professional screen content
================================================== */

type StoredCourseScreenContent = {
  screen_title?: string | null;
  column_count?: number | null;
  column_one_title?: string | null;
  column_two_title?: string | null;
  content?: unknown;
};

function mapStoredProfessionalContent(
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

/* ==================================================
   Build Course Variant
================================================== */

async function buildCourseVariant(
  catalogCourse: CatalogCourse
): Promise<CourseVariant> {
  const professionalJourney =
    findProfessionalJourney(
      catalogCourse
    );

  const modules =
    professionalJourney
      ? await getJourneyModules(
          professionalJourney.id
        )
      : [];

  const curriculum: CurriculumItem[] =
    modules.map((module, index) => ({
      id: module.id,
      title: module.title,
      description:
        module.description ?? "",
      duration:
        formatMinutes(
          module.duration_minutes
        ),
      order:
        module.display_order ??
        index + 1,
    }));

  return {
    id: catalogCourse.id,

    slug: catalogCourse.slug,

    title: catalogCourse.title,

    shortTitle:
      catalogCourse.subtitle ??
      catalogCourse.title,

    type: getVariantType(
      catalogCourse.slug
    ),

    description:
      catalogCourse.description ??
      undefined,

    duration:
      formatHours(
        professionalJourney
          ?.duration_hours ??
          catalogCourse.duration_hours
      ),

    projects:
      formatProjects(
        catalogCourse.projects_count
      ),

    level:
      catalogCourse.level ??
      "احترافي",

    curriculum,

    finalOutcome:
      catalogCourse.final_outcome ??
      undefined,

    learningOutcomes: [],

    gifts: [],

    freeSessionSlugs: [],

    workshopSlugs: [],

    reviewIds: [],

    professionalJourneyId:
      professionalJourney?.id,

    status:
      professionalJourney?.status ??
      "coming_soon",

    active:
      catalogCourse.is_active,

    order:
      catalogCourse.display_order,
  } as CourseVariant;
}

/* ==================================================
   Header Stations
================================================== */

function convertStationToHeaderCourse(
  station: CatalogStation,
  pathSlug: string,
  index: number
): Course {
  const representativeCourse =
    findRepresentativeCourse(
      station.courses.filter(
        (course) => course.is_active
      )
    );

  const representativeJourney =
    representativeCourse
      ? findProfessionalJourney(
          representativeCourse
        )
      : undefined;

  const stationIsComingSoon =
    station.courses.length === 0 ||
    station.courses
      .filter(
        (course) => course.is_active
      )
      .every((course) => {
        const journey =
          findProfessionalJourney(course);

        return (
          !journey ||
          journey.status ===
            "coming_soon"
        );
      });

  return {
    id: index + 1,

    slug: station.slug,

    title: station.title,

    shortTitle:
      station.short_title ??
      station.title,

    description:
      station.description ??
      representativeCourse?.description ??
      "",

    image:
      station.image_url ??
      representativeCourse?.image_url ??
      "/images/courses/course-placeholder.jpg",

    icon:
      station.icon_url ??
      representativeCourse?.icon_url ??
      "/images/courses/icons/default.png",

    pathSlug,

    type: "professional",

    duration:
      formatHours(
        representativeJourney
          ?.duration_hours ??
          representativeCourse
            ?.duration_hours
      ),

    projects:
      formatProjects(
        representativeCourse
          ?.projects_count
      ),

    level:
      representativeCourse?.level ??
      "احترافي",

    instructorIds: [],

    professionalJourneyId:
      representativeJourney?.id,

    professionalJourneyStatus:
      stationIsComingSoon
        ? "coming_soon"
        : representativeJourney
            ?.status ?? "open",

    featured:
      representativeCourse
        ?.is_featured ?? false,

    active:
      station.is_active,

    order:
      station.display_order,
  } as Course;
}

/* ==================================================
   Catalog Helpers
================================================== */

function findRepresentativeCourse(
  courses: CatalogCourse[]
): CatalogCourse | undefined {
  return (
    courses.find(
      (course) => course.is_featured
    ) ??
    courses.find((course) =>
      course.slug.includes("integrated")
    ) ??
    courses[0]
  );
}

function findProfessionalJourney(
  course: CatalogCourse
): CatalogJourney | undefined {
  return (
    course.journeys.find(
      (journey) =>
        journey.journey_type ===
          "professional" &&
        journey.is_active
    ) ??
    course.journeys.find(
      (journey) => journey.is_active
    ) ??
    course.journeys[0]
  );
}

function getVariantType(
  slug: string
): CourseVariant["type"] {
  if (slug.includes("integrated")) {
    return "integrated";
  }

  if (
    slug.includes("fundamental") ||
    slug.includes("essential")
  ) {
    return "fundamental";
  }

  if (slug.includes("advanced")) {
    return "advanced";
  }

  /*
    المحطات التي تحتوي كورسًا واحدًا فقط
    نعامل كورسها كرحلة متكاملة.
  */
  return "integrated";
}

type CourseReviewRow = {
  id: string;
  user_id: string | null;
  rating: number | string | null;
  comment: string | null;
  submitted_at: string | null;

  student_name: string | null;
  student_job_title: string | null;
  student_country: string | null;
};

type CourseReviewProfileRow = {
  id: string;
  full_name: string | null;
  country: string | null;
};

async function loadPublishedCourseReviews(
  courseId: string,
  pathSlug: PathSlug,
  courseSlug: string,
): Promise<Review[]> {
  const supabase = createAdminClient();

  /*
   * أولًا:
   * قراءة التقييمات المنشورة لهذا الكورس.
   *
   * لا نستخدم profiles(...) هنا لأن student_surveys.user_id
   * ليس Foreign Key مباشرًا إلى profiles.id.
   */
  const { data, error } = await supabase
    .from("student_surveys")
    .select(`
      id,
      user_id,
      rating,
      comment,
      submitted_at,
      student_name,
      student_job_title,
      student_country
    `)
    .eq("course_id", courseId)
    .eq("show_on_course", true)
    .eq("status", "approved")
    .order("submitted_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load published course reviews:",
      error.message,
    );

    return [];
  }

  const rows =
    (data ?? []) as CourseReviewRow[];

  /*
   * ثانيًا:
   * نجمع الحسابات المسجلة المرتبطة بالتقييمات.
   */
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter(
          (id): id is string =>
            typeof id === "string" &&
            id.length > 0,
        ),
    ),
  );

  let profileRows: CourseReviewProfileRow[] = [];

  if (userIds.length > 0) {
    const {
      data: profilesData,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select(`
  id,
  full_name,
  country
`)
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Failed to load review profiles:",
        profilesError.message,
      );
    } else {
      profileRows =
        (profilesData ?? []) as CourseReviewProfileRow[];
    }
  }

  const profilesMap = new Map(
    profileRows.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  /*
   * ثالثًا:
   * إذا كان التقييم مربوطًا بحساب حقيقي،
   * نعطي بيانات الحساب الأولوية.
   *
   * وإذا كان الطالب مستوردًا ولم يسجل بعد،
   * نستخدم البيانات المحفوظة في student_surveys.
   */
  return rows
    .filter(
      (row) =>
        Number(row.rating ?? 0) > 0,
    )
    .map((row, index) => {
      const profile = row.user_id
        ? profilesMap.get(row.user_id)
        : undefined;

      return {
        id: index + 1,

        studentName:
          profile?.full_name?.trim() ||
          row.student_name?.trim() ||
          "أحد متدربي Masar Makers",

        studentRole:
  row.student_job_title?.trim() ||
  "",

        country:
          profile?.country?.trim() ||
          row.student_country?.trim() ||
          "",

        pathSlug,
        courseSlug,

        rating: Math.max(
          1,
          Math.min(
            5,
            Math.round(
              Number(row.rating ?? 0),
            ),
          ),
        ),

        review:
          row.comment?.trim() || "",

        approved: true,
        featured: false,

        createdAt:
          row.submitted_at ??
          new Date().toISOString(),
      };
    });
}

/* ==================================================
   Local Temporary Data
================================================== */

function loadLocalFreeSessions(
  course: Course
): FreeSession[] {
  return (
    course.freeSessionSlugs
      ?.map((sessionSlug) =>
        getFreeSession(sessionSlug)
      )
      .filter(
        (
          session
        ): session is NonNullable<
          ReturnType<
            typeof getFreeSession
          >
        > => Boolean(session)
      ) ?? []
  );
}

function loadLocalWorkshops(
  course: Course
): Workshop[] {
  return (
    course.workshopSlugs
      ?.map((workshopSlug) =>
        getWorkshop(workshopSlug)
      )
      .filter(
        (
          workshop
        ): workshop is NonNullable<
          ReturnType<
            typeof getWorkshop
          >
        > => Boolean(workshop)
      ) ?? []
  );
}


/* ==================================================
   Formatting
================================================== */

function formatHours(
  hours: number | null | undefined
): string {
  if (
    hours === null ||
    hours === undefined
  ) {
    return "سيتم تحديدها";
  }

  return `${Number(hours)} ساعة`;
}

function formatProjects(
  projects: number | null | undefined
): string {
  if (!projects) {
    return "مشاريع تطبيقية";
  }

  return `${projects} مشاريع`;
}

function formatMinutes(
  minutes: number | null | undefined
): string {
  if (
    minutes === null ||
    minutes === undefined ||
    minutes <= 0
  ) {
    return "";
  }

  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }

  return `${hours} ساعة و${remainingMinutes} دقيقة`;
}