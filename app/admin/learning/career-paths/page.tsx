import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { createClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function CareerPathsPage(){const supabase=await createClient();const {data}=await supabase.from("career_paths").select("*").order("display_order");return <><AdminPageHeader title="المسارات المهنية" description="إضافة وتعديل وترتيب المسارات المهنية. اسحبي الصفوف لتغيير الترتيب."/><CatalogManager kind="paths" initialRows={data??[]}/></>}
