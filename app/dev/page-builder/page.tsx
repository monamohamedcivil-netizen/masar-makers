import { getTemplatePageBuilder } from "@/lib/queries/catalog";

export default async function Page() {
  const page = await getTemplatePageBuilder(
    "5fbddec5-79e3-4c63-8000-46123b9ee518"
  );

  return (
    <pre className="p-8 text-xs">
      {JSON.stringify(page, null, 2)}
    </pre>
  );
}