"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Eye, FileArchive, FileText, GripVertical, Link as LinkIcon, Pencil, PlayCircle, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { attachUploadedVideo, createAssetPreview, deleteLessonContent, deleteLessonResource, reorderLessons, saveLesson, saveLessonResource, uploadLessonAsset } from "@/lib/actions/admin/lesson-content";

type Row = Record<string, any>;

export default function LessonContentManager({ initialLessons, courses, journeys, initialResources }: { initialLessons: Row[]; courses: Row[]; journeys: Row[]; initialResources: Row[] }) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [resources, setResources] = useState(initialResources);
  const [courseFilter, setCourseFilter] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [resourceLesson, setResourceLesson] = useState<Row | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const courseTitle = (lesson: Row) => lesson.courses?.title_ar || lesson.courses?.title || courses.find((course) => course.id === lesson.course_id)?.title_ar || courses.find((course) => course.id === lesson.course_id)?.title || "بدون كورس";
  const visible = useMemo(() => lessons.filter((lesson) => (!courseFilter || lesson.course_id === courseFilter) && `${lesson.title} ${courseTitle(lesson)}`.toLowerCase().includes(query.toLowerCase())), [lessons, courseFilter, query]);
  const lessonResources = (lessonId: string) => resources.filter((resource) => resource.lesson_id === lessonId);

  function openLesson(row?: Row) {
    setEditing(row ? { ...row } : { course_id: courseFilter || courses[0]?.id || "", journey_id: "", title: "", description: "", video_url: "", video_provider: "external", video_asset_id: "", lesson_order: lessons.filter((item) => item.course_id === (courseFilter || courses[0]?.id)).length + 1, duration_minutes: 30, is_preview: false, is_published: false });
  }

  function submitLesson() {
    if (!editing) return;
    startTransition(async () => {
      const result = await saveLesson(editing);
      if (!result.success) return alert(result.message);
      setEditing(null);
      window.location.reload();
    });
  }

  function removeLesson(row: Row) {
    if (!confirm(`هل تريدين حذف الدرس «${row.title}» وجميع مرفقاته؟`)) return;
    startTransition(async () => {
      const result = await deleteLessonContent(row.id);
      if (!result.success) return alert(result.message);
      setLessons((items) => items.filter((item) => item.id !== row.id));
      setResources((items) => items.filter((item) => item.lesson_id !== row.id));
      router.refresh();
    });
  }

  function drop(target: string) {
    if (!dragged || dragged === target) return;
    const groupCourse = lessons.find((item) => item.id === dragged)?.course_id;
    const sameCourse = lessons.filter((item) => item.course_id === groupCourse);
    const other = lessons.filter((item) => item.course_id !== groupCourse);
    const from = sameCourse.findIndex((item) => item.id === dragged);
    const to = sameCourse.findIndex((item) => item.id === target);
    if (from < 0 || to < 0) return;
    const next = [...sameCourse];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setLessons([...other, ...next]);
    setDragged(null);
    startTransition(async () => {
      const result = await reorderLessons(next.map((entry) => entry.id));
      if (!result.success) alert(result.message);
      router.refresh();
    });
  }

  async function preview(path?: string, external?: string) {
    if (external) return window.open(external, "_blank", "noopener,noreferrer");
    if (!path) return;
    const result = await createAssetPreview(path);
    if (!result.success || !result.data?.url) return alert(result.message);
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  return <div className="space-y-5">
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_260px_auto]">
      <div className="relative"><Search className="absolute right-3 top-3 h-5 w-5 text-slate-400"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="البحث باسم الدرس أو الكورس" className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 outline-none focus:border-[#F7B548]"/></div>
      <select value={courseFilter} onChange={(event)=>setCourseFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]"><option value="">كل الكورسات</option>{courses.map((course)=><option key={course.id} value={course.id}>{course.title_ar || course.title}</option>)}</select>
      <button onClick={()=>openLesson()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F7B548] px-5 font-black text-[#07152E]"><Plus className="h-5 w-5"/>إضافة درس</button>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-right"><thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="w-12 p-4"></th><th className="p-4">الدرس</th><th className="p-4">الكورس / الرحلة</th><th className="p-4">الفيديو</th><th className="p-4">المرفقات</th><th className="p-4">المدة</th><th className="p-4">الوصول</th><th className="p-4">الحالة</th><th className="p-4">الإجراءات</th></tr></thead>
      <tbody>{visible.map((lesson)=><tr key={lesson.id} draggable onDragStart={()=>setDragged(lesson.id)} onDragOver={(event)=>event.preventDefault()} onDrop={()=>drop(lesson.id)} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="p-4 text-slate-400"><GripVertical className="h-5 w-5 cursor-grab"/></td><td className="p-4"><div className="font-black text-[#07152E]">{lesson.lesson_order}. {lesson.title}</div><div className="max-w-xs truncate text-xs text-slate-500">{lesson.description || "بدون وصف"}</div></td><td className="p-4 text-sm"><div>{courseTitle(lesson)}</div><div className="text-xs text-slate-400">{lesson.journeys?.title || journeys.find((journey)=>journey.id===lesson.journey_id)?.title || "بدون رحلة محددة"}</div></td><td className="p-4">{lesson.video_url || lesson.video_asset_id ? <button onClick={()=>lesson.video_provider === "supabase" ? preview(lesson.video_asset_id) : preview(undefined, lesson.video_url)} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"><PlayCircle className="h-4 w-4"/>معاينة</button> : <span className="text-sm text-slate-400">غير مضاف</span>}</td><td className="p-4"><button onClick={()=>setResourceLesson(lesson)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{lessonResources(lesson.id).length} ملف</button></td><td className="p-4 text-sm">{lesson.duration_minutes} دقيقة</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${lesson.is_preview ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{lesson.is_preview ? "معاينة مجانية" : "للمشتركين"}</span></td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${lesson.is_published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{lesson.is_published ? "منشور" : "مسودة"}</span></td><td className="p-4"><div className="flex gap-2"><button onClick={()=>setResourceLesson(lesson)} title="المحتوى والمرفقات" className="rounded-lg border border-slate-200 p-2 text-violet-600 hover:bg-violet-50"><BookOpen className="h-4 w-4"/></button><button onClick={()=>openLesson(lesson)} className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4"/></button><button onClick={()=>removeLesson(lesson)} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>
      {visible.length===0 && <div className="p-16 text-center text-slate-500">لا توجد دروس مطابقة.</div>}
    </div>

    {editing && <LessonDialog editing={editing} setEditing={setEditing} courses={courses} journeys={journeys} pending={pending} close={()=>setEditing(null)} submit={submitLesson} />}
    {resourceLesson && <ResourcesDialog lesson={resourceLesson} resources={lessonResources(resourceLesson.id)} pending={pending} close={()=>setResourceLesson(null)} refresh={()=>window.location.reload()} remove={(id)=>startTransition(async()=>{const result=await deleteLessonResource(id);if(!result.success)return alert(result.message);setResources((items)=>items.filter((item)=>item.id!==id));})} preview={preview} />}
  </div>;
}

function LessonDialog({ editing, setEditing, courses, journeys, pending, close, submit }: any) {
  const filteredJourneys = journeys.filter((journey: Row)=>!editing.course_id || journey.course_id===editing.course_id);
  async function uploadVideo(file?: File) {
    if (!file || !editing.id) return alert("احفظي الدرس أولاً، ثم افتحيه للتعديل لرفع الفيديو.");
    const form = new FormData(); form.append("file", file); form.append("lessonId", editing.id); form.append("category", "videos");
    const uploaded = await uploadLessonAsset(form); if (!uploaded.success || !uploaded.data) return alert(uploaded.message);
    const attached = await attachUploadedVideo(editing.id, uploaded.data.path); if (!attached.success) return alert(attached.message);
    setEditing({ ...editing, video_provider: "supabase", video_asset_id: uploaded.data.path, video_url: "" }); alert("تم رفع الفيديو وربطه بالدرس.");
  }
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"><div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5"><h2 className="text-xl font-black text-[#07152E]">{editing.id ? "تعديل الدرس" : "إضافة درس"}</h2><button onClick={close} className="rounded-lg p-2 hover:bg-slate-100"><X/></button></div><div className="grid gap-5 p-6 md:grid-cols-2">
    <Select label="الكورس" value={editing.course_id || ""} set={(value:string)=>setEditing({...editing,course_id:value,journey_id:""})} options={[{value:"",label:"اختاري الكورس"},...courses.map((course:Row)=>({value:course.id,label:course.title_ar||course.title}))]}/>
    <Select label="الرحلة (اختياري)" value={editing.journey_id || ""} set={(value:string)=>setEditing({...editing,journey_id:value})} options={[{value:"",label:"بدون رحلة محددة"},...filteredJourneys.map((journey:Row)=>({value:journey.id,label:journey.title}))]}/>
    <Field label="اسم الدرس" value={editing.title || ""} set={(value:string)=>setEditing({...editing,title:value})}/><Field label="الترتيب" type="number" value={editing.lesson_order} set={(value:string)=>setEditing({...editing,lesson_order:Number(value)})}/>
    <Field label="المدة بالدقائق" type="number" value={editing.duration_minutes} set={(value:string)=>setEditing({...editing,duration_minutes:Number(value)})}/><Select label="مصدر الفيديو" value={editing.video_provider || "external"} set={(value:string)=>setEditing({...editing,video_provider:value})} options={[{value:"external",label:"رابط خارجي"},{value:"supabase",label:"رفع آمن إلى Supabase"}]}/>
    {editing.video_provider !== "supabase" ? <div className="md:col-span-2"><Field label="رابط الفيديو" value={editing.video_url || ""} set={(value:string)=>setEditing({...editing,video_url:value,video_asset_id:""})}/></div> : <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 p-5"><label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-slate-50 px-4 py-6 font-bold text-[#07152E]"><Upload className="h-5 w-5"/>{editing.video_asset_id ? "استبدال الفيديو المرفوع" : "رفع فيديو الدرس"}<input type="file" accept="video/*" className="hidden" onChange={(event)=>uploadVideo(event.target.files?.[0])}/></label>{!editing.id && <p className="mt-2 text-center text-xs text-amber-600">احفظي الدرس أولاً ثم افتحيه للتعديل لرفع الفيديو.</p>}</div>}
    <div className="md:col-span-2"><label className="mb-2 block text-sm font-bold text-[#07152E]">وصف الدرس</label><textarea rows={4} value={editing.description || ""} onChange={(event)=>setEditing({...editing,description:event.target.value})} className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#F7B548]"/></div>
    <Toggle label="معاينة مجانية" checked={editing.is_preview} set={(value:boolean)=>setEditing({...editing,is_preview:value})}/><Toggle label="منشور للطلاب" checked={editing.is_published} set={(value:boolean)=>setEditing({...editing,is_published:value})}/>
  </div><div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-5"><button onClick={close} className="rounded-xl border px-5 py-3 font-bold">إلغاء</button><button disabled={pending} onClick={submit} className="rounded-xl bg-[#07152E] px-7 py-3 font-black text-white disabled:opacity-50">{pending ? "جارٍ الحفظ..." : "حفظ الدرس"}</button></div></div></div>;
}

function ResourcesDialog({ lesson, resources, pending, close, refresh, remove, preview }: any) {
  const [mode,setMode]=useState<"file"|"link">("file"); const [title,setTitle]=useState(""); const [type,setType]=useState("file"); const [url,setUrl]=useState(""); const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false);
  async function add() { if(!title.trim())return alert("أدخلي اسم المرفق."); setBusy(true); let path=""; if(mode==="file"){if(!file){setBusy(false);return alert("اختاري الملف.");}const form=new FormData();form.append("file",file);form.append("lessonId",lesson.id);form.append("category","resources");const uploaded=await uploadLessonAsset(form);if(!uploaded.success||!uploaded.data){setBusy(false);return alert(uploaded.message);}path=uploaded.data.path;}const result=await saveLessonResource({lesson_id:lesson.id,title,resource_type:mode==="link"?"link":type,file_path:path,external_url:mode==="link"?url:"",display_order:resources.length+1,is_active:true});setBusy(false);if(!result.success)return alert(result.message);refresh(); }
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4"><div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5"><div><h2 className="text-xl font-black text-[#07152E]">محتوى الدرس ومرفقاته</h2><p className="text-sm text-slate-500">{lesson.title}</p></div><button onClick={close} className="rounded-lg p-2 hover:bg-slate-100"><X/></button></div><div className="space-y-6 p-6">
    <div className="rounded-2xl border border-slate-200 p-5"><div className="mb-4 flex gap-2"><button onClick={()=>setMode("file")} className={`rounded-xl px-4 py-2 text-sm font-bold ${mode==="file"?"bg-[#07152E] text-white":"bg-slate-100"}`}><Upload className="ml-2 inline h-4 w-4"/>رفع ملف</button><button onClick={()=>setMode("link")} className={`rounded-xl px-4 py-2 text-sm font-bold ${mode==="link"?"bg-[#07152E] text-white":"bg-slate-100"}`}><LinkIcon className="ml-2 inline h-4 w-4"/>رابط خارجي</button></div><div className="grid gap-4 md:grid-cols-2"><Field label="اسم المرفق" value={title} set={setTitle}/><Select label="النوع" value={type} set={setType} options={[{value:"file",label:"ملف"},{value:"pdf",label:"PDF"},{value:"dwg",label:"DWG"},{value:"zip",label:"ZIP"},{value:"other",label:"أخرى"}]}/>{mode==="file"?<label className="md:col-span-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 font-bold"><Upload className="h-5 w-5"/>{file?.name||"اختيار ملف حتى 100 MB"}<input type="file" className="hidden" onChange={(event)=>setFile(event.target.files?.[0]||null)}/></label>:<div className="md:col-span-2"><Field label="الرابط الخارجي" value={url} set={setUrl}/></div>}</div><button disabled={busy||pending} onClick={add} className="mt-4 rounded-xl bg-[#F7B548] px-6 py-3 font-black text-[#07152E] disabled:opacity-50">{busy?"جارٍ الرفع...":"إضافة المرفق"}</button></div>
    <div className="space-y-3">{resources.map((resource:Row)=><div key={resource.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3">{resource.resource_type==="zip"?<FileArchive className="text-amber-600"/>:<FileText className="text-blue-600"/>}<div><div className="font-bold text-[#07152E]">{resource.title}</div><div className="text-xs text-slate-400">{resource.resource_type}</div></div></div><div className="flex gap-2"><button onClick={()=>preview(resource.file_path,resource.external_url||resource.file_url)} className="rounded-lg border p-2 text-blue-600"><Eye className="h-4 w-4"/></button><button onClick={()=>{if(confirm("حذف المرفق؟"))remove(resource.id)}} className="rounded-lg border p-2 text-red-600"><Trash2 className="h-4 w-4"/></button></div></div>)}{resources.length===0&&<div className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">لا توجد مرفقات حتى الآن.</div>}</div>
  </div></div></div>;
}

function Field({label,value,set,type="text"}:any){return <div><label className="mb-2 block text-sm font-bold text-[#07152E]">{label}</label><input type={type} value={value ?? ""} onChange={(event)=>set(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#F7B548]"/></div>}
function Select({label,value,set,options}:any){return <div><label className="mb-2 block text-sm font-bold text-[#07152E]">{label}</label><select value={value ?? ""} onChange={(event)=>set(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F7B548]">{options.map((option:any)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
function Toggle({label,checked,set}:any){return <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 font-bold text-[#07152E]"><span>{label}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event)=>set(event.target.checked)} className="h-5 w-5 accent-[#F7B548]"/></label>}
