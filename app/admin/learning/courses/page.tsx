import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { createClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function CoursesPage(){const supabase=await createClient();const [{data:courses},{data:stations}]=await Promise.all([supabase.from("courses").select("*").order("display_order"),supabase.from("course_stations").select("id,title,career_path_id,display_order").order("display_order")]);return <><AdminPageHeader title="إدارة الكورسات" description="إنشاء الكورسات وربطها بمحطات المسارات ورفع الصور والأيقونات وترتيبها بالسحب."/><CatalogManager kind="courses" initialRows={courses??[]} stations={stations??[]}/></>}
