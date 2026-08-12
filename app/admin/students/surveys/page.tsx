import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import SurveysDashboard from "@/components/admin/surveys/SurveysDashboard";
import { getSurveysDashboard } from "@/lib/actions/admin/surveys-dashboard";
export const dynamic="force-dynamic";
export default async function SurveysPage(){
 const result=await getSurveysDashboard();
 if(!result.success||!result.data)return <div className="space-y-6"><AdminPageHeader title="الاستبيانات" description="إدارة تقييمات واستبيانات الطلاب من شاشة واحدة."/><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-black text-red-700">{result.message}</div></div>;
 return <div className="space-y-6"><AdminPageHeader title="الاستبيانات" description="إدارة تقييمات واستبيانات جميع الطلاب والكورسات من شاشة واحدة."/><SurveysDashboard initialData={result.data}/></div>
}