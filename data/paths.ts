import type { PathSlug } from "@/data/courses";

import type {
  CareerPath,
} from "@/data/types";

export type {
  CareerPath,
} from "@/data/types";

export const careerPaths: CareerPath[] = [
  {
    id: 1,
    slug: "road",

    title: "مسار احتراف تصميم الطرق",
    englishTitle: "Road Design Professional Path",
    shortTitle: "تصميم الطرق",

    description:
  "رحلة مهنية متكاملة تساعدك على بناء مهارات تصميم الطرق وتطوير مشروعاتك من الأساسيات حتى المستوى الاحترافي.",
    longDescription:
      "مسار مهني متكامل يساعدك على تعلم تصميم الطرق وإدارة المشروع باستخدام أهم البرامج المطلوبة في سوق العمل، بداية من Civil 3D وCivil Site Design وحتى إخراج اللوحات وتحليل حركة المركبات وإنتاج نموذج BIM متكامل.",

    image: "/images/paths/road-design.jpg",
    icon: "/images/paths/icons/road.png",

    hours: "80+ ساعة تدريبية",
    projects: "12 مشروع",
    coursesCount: 5,

    featured: true,
    active: true,
    order: 1,
  },

  {
    id: 2,
    slug: "traffic",

    title: "مسار احتراف هندسة المرور",
    englishTitle: "Traffic Engineering Professional Path",
    shortTitle: "هندسة المرور",

    description:
  "رحلة مهنية متخصصة تساعدك على تحليل الحركة المرورية وبناء نماذج النقل والمحاكاة بكفاءة احترافية.",
    longDescription:
      "مسار مهني متخصص في هندسة المرور والنقل يساعدك على تحليل التقاطعات والدوارات والإشارات المرورية، وإنشاء المحاكاة المرورية، وبناء نماذج النقل الاستراتيجية باستخدام SIDRA وSynchro وVISSIM وVISUM وCUBE.",

    image: "/images/paths/traffic-engineering.jpg",
    icon: "/images/paths/icons/traffic-light.png",

    hours: "سيحدد لاحقًا",
    projects: "مشاريع تطبيقية",
    coursesCount: 5,

    featured: true,
    active: true,
    order: 2,
  },
];

export function getPathBySlug(
  slug: string
) {
  return careerPaths.find(
    (path) =>
      path.slug === slug &&
      path.active
  );
}

export function getActivePaths() {
  return careerPaths
    .filter((path) => path.active)
    .sort((a, b) => a.order - b.order);
}