/* ==================================================
   Shared Types
================================================== */

export type PathSlug =
  | "road"
  | "traffic";

export type CourseType =
  | "professional"
  | "workshop"
  | "free";
export type CoursePanelTab =
  | "outcome"
  | "gifts"
  | "reviews"
  | "free"
  | "workshop"
  | "professional";
/* ==================================================
   Course
================================================== */

export type CurriculumItem = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  lessonsCount?: number;
  order: number;
};

export type Course = {
  id: number;
  slug: string;

  title: string;
  shortTitle: string;
  subtitle?: string;

  description: string;
  longDescription?: string;

  image: string;
  icon: string;

  pathSlug: PathSlug;
  type: CourseType;

  duration: string;
  projects: string;
  level: string;

  instructorIds: string[];

  /* ما سيتعلمه الطالب */
  learningOutcomes?: string[];

  /* محتويات ومنهج الكورس */
  curriculum?: CurriculumItem[];

  /* الهدايا والملفات */
  gifts?: string[];

  /* النتيجة النهائية للكورس */
  finalOutcome?: string;

  /* روابط المحتوى المرتبط */
  freeSessionSlugs?: string[];
  workshopSlugs?: string[];

  /* الربط بالتقييمات والأسئلة */
  reviewIds?: number[];
  faqIds?: number[];

  featured: boolean;
  active: boolean;
  order: number;
  statsJourneyCount?: number | null;
statsLessonCount?: number | null;
statsTrainingHours?: number | null;
statsLevelLabel?: string | null;

  professionalJourneyId?: string;
professionalJourneyStatus?: JourneyStatus;
journeyLayout?:
  | "single"
  | "foundation_advanced";
variants?: CourseVariant[];
};


/* ==================================================
   Career Path
================================================== */

export type CareerPath = {
  id: number;
  slug: PathSlug;

  title: string;
  englishTitle?: string;
  shortTitle: string;

  description: string;
  longDescription?: string;

  image: string;
  icon: string;

  hours: string;
  projects: string;
  coursesCount: number;

  featured: boolean;
  active: boolean;
  order: number;
};

/* ==================================================
   Workshop
================================================== */

export type Workshop = {
  id: number;
  slug: string;

  title: string;
  subtitle?: string;
  description: string;
  longDescription?: string;

  image: string;
  pathSlug: PathSlug;

  duration: string;
  date?: string;
  price?: number;

  learningOutcomes?: string[];
  gifts?: string[];
  finalOutcome?: string;

  instructorIds: string[];

  active: boolean;
  featured: boolean;
  order: number;
};

/* ==================================================
   Free Session
================================================== */

export type FreeSession = {
  id: number;
  slug: string;

  title: string;
  subtitle?: string;
  description: string;

  image: string;
  videoUrl?: string;

  pathSlug: PathSlug;

  duration: string;
  instructorIds: string[];

  relatedCourseSlug?: string;

  active: boolean;
  featured: boolean;
  order: number;
};

/* ==================================================
   Instructor
================================================== */

export type Instructor = {
  id: string;

  name: string;
  title: string;

  bio: string;
  image: string;

  specialties: string[];
  countries?: string[];

  active: boolean;
};

/* ==================================================
   Review
================================================== */

export type Review = {
  id: number;

  studentName: string;
  studentRole: string;
  country: string;

  pathSlug: PathSlug;

  courseSlug?: string;
  workshopSlug?: string;
  freeSessionSlug?: string;

  rating: number;
  review: string;

  approved: boolean;
  featured: boolean;

  createdAt: string;
};

/* ==================================================
   FAQ
================================================== */

export type FaqItem = {
  id: number;

  question: string;
  answer: string;

  pathSlug?: PathSlug;
  courseSlug?: string;
  workshopSlug?: string;
  freeSessionSlug?: string;

  active: boolean;
  order: number;
};

export type JourneyStatus =
  | "draft"
  | "open"
  | "closed"
  | "coming_soon"
  | "archived";

  export type CourseVariantType =
  | "integrated"
  | "fundamental"
  | "advanced";

export type CourseVariant = {
  id: string;
  slug: string;

  title: string;
  shortTitle: string;

  type: CourseVariantType;

  description?: string;

  duration: string;
  projects: string;
  level: string;

  curriculum?: CurriculumItem[];
  gifts?: string[];
  finalOutcome?: string;
  learningOutcomes?: string[];

  freeSessionSlugs?: string[];
  workshopSlugs?: string[];

  professionalJourneyId?: string;

  status:
    | "draft"
    | "open"
    | "closed"
    | "coming_soon"
    | "archived";

  active: boolean;
  order: number;
};