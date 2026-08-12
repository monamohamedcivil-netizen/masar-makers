import CourseSurveyTableClient from "@/components/admin/courses/CourseSurveyTableClient";
import { getCourseSurveys } from "@/lib/queries/admin/course-surveys";

interface Props {
  courseId: string;
}

export default async function CourseSurveyTable({
  courseId,
}: Props) {
  const surveys = await getCourseSurveys(courseId);

  return (
    <CourseSurveyTableClient surveys={surveys} />
  );
}