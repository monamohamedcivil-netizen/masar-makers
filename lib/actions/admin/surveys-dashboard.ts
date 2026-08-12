"use server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type SurveysDashboardRow={id:string;userId:string|null;studentName:string;studentEmail:string;courseId:string;courseTitle:string;courseCode:string|null;pathId:string|null;pathTitle:string;rating:number;comment:string|null;submittedAt:string|null;detailedSurveyCompleted:boolean;showOnHome:boolean;showOnCourse:boolean;surveyUrl:string|null};
export type SurveysDashboardData={rows:SurveysDashboardRow[];paths:{id:string;title:string;count:number}[];statistics:{total:number;average:number;detailedCompleted:number;showOnHome:number}};

async function requireAdmin(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();
 if(!user)throw new Error("يجب تسجيل الدخول أولًا.");
 const {data:p}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(!p||!["admin","super_admin"].includes(String(p.role)))throw new Error("ليس لديك صلاحية لعرض الاستبيانات.");
}

export async function getSurveysDashboard(){
 try{
  await requireAdmin();const a=createAdminClient();
  const {data:sd,error:se}=await a.from("student_surveys").select("id,user_id,student_name,student_email,course_id,rating,comment,submitted_at,detailed_survey_completed,show_on_home,show_on_course").order("submitted_at",{ascending:false});
  if(se)return{success:false,message:se.message};
  const ids=[...new Set((sd??[]).map(x=>x.course_id).filter(Boolean))];
  const {data:cd,error:ce}=ids.length?await a.from("courses").select("id,title,title_ar,course_code,station_id,survey_enabled,survey_url").in("id",ids):{data:[],error:null};
  if(ce)return{success:false,message:ce.message};
  const sids=[...new Set((cd??[]).map(x=>x.station_id).filter(Boolean))];
  const {data:st}=sids.length?await a.from("course_stations").select("id,career_path_id").in("id",sids):{data:[]};
  const pids=[...new Set((st??[]).map(x=>x.career_path_id).filter(Boolean))];
  const {data:pd}=pids.length?await a.from("career_paths").select("id,title,title_ar").in("id",pids):{data:[]};
  const cm=new Map((cd??[]).map(x=>[x.id,x])),sm=new Map((st??[]).map(x=>[x.id,x])),pm=new Map((pd??[]).map(x=>[x.id,x]));
  const rows:SurveysDashboardRow[]=(sd??[]).map(s=>{const c=cm.get(s.course_id),stn=c?.station_id?sm.get(c.station_id):null,path=stn?.career_path_id?pm.get(stn.career_path_id):null;return{id:s.id,userId:s.user_id??null,studentName:s.student_name||"طالب بدون اسم",studentEmail:s.student_email||"",courseId:s.course_id,courseTitle:c?.title_ar||c?.title||"—",courseCode:c?.course_code||null,pathId:path?.id||null,pathTitle:path?.title_ar||path?.title||"بدون مسار",rating:Math.max(0,Math.min(5,Number(s.rating??0))),comment:s.comment??null,submittedAt:s.submitted_at??null,detailedSurveyCompleted:Boolean(s.detailed_survey_completed),showOnHome:Boolean(s.show_on_home),showOnCourse:Boolean(s.show_on_course),surveyUrl:c?.survey_enabled===false?null:(c?.survey_url?.trim()||null)}});
  const pc=new Map<string,{id:string;title:string;count:number}>();rows.forEach(r=>{const id=r.pathId??"unassigned",o=pc.get(id);if(o)o.count++;else pc.set(id,{id,title:r.pathTitle,count:1})});
  const avg=rows.length?rows.reduce((n,r)=>n+r.rating,0)/rows.length:0;
  return{success:true,message:"تم تحميل الاستبيانات.",data:{rows,paths:[...pc.values()],statistics:{total:rows.length,average:Number(avg.toFixed(1)),detailedCompleted:rows.filter(r=>r.detailedSurveyCompleted).length,showOnHome:rows.filter(r=>r.showOnHome).length}} satisfies SurveysDashboardData};
 }catch(e){return{success:false,message:e instanceof Error?e.message:"تعذر تحميل الاستبيانات."}}
}