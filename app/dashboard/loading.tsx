export default function DashboardLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8FA] px-4 pb-10 pt-24">
      <div className="mx-auto max-w-[1500px] animate-pulse space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-white" />)}</div>
        <div className="grid min-h-[610px] gap-4 lg:grid-cols-[250px_minmax(0,1fr)_250px]">
          <div className="hidden bg-white lg:block" />
          <div className="bg-white"><div className="h-20 bg-[#07152E]/90" /><div className="grid gap-4 p-6 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-52 bg-slate-100" />)}</div></div>
          <div className="hidden bg-white lg:block" />
        </div>
      </div>
    </main>
  );
}
