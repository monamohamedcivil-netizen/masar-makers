import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { createClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function JourneysPage(){const supabase=await createClient();const [{data:journeys},{data:courses}]=await Promise.all([supabase.from("journeys").select("*").order("display_order"),supabase.from("courses").select("id,title,title_ar,slug").order("display_order")]);const normalized=(courses??[]).map(c=>({...c,title:c.title_ar||c.title}));return <><AdminPageHeader title="إدارة الرحلات" description="إنشاء الرحلات وربط كل رحلة بالكورس المناسب وتحديد السعر والحالة والترتيب."/><CatalogManager kind="journeys" initialRows={journeys??[]} courses={normalized}/></>}
