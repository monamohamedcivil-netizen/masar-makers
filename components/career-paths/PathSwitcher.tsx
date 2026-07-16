import Link from "next/link";
import { Route } from "lucide-react";

import { careerPaths } from "@/data/paths";

type PathSwitcherProps = {
  activeSlug: string;
};

export default function PathSwitcher({
  activeSlug,
}: PathSwitcherProps) {
  const activePaths = careerPaths
    .filter((path) => path.active)
    .sort((a, b) => a.order - b.order);

  return (
    <nav
      dir="rtl"
      aria-label="المسارات المهنية"
      className="
        relative z-40 w-full
        border-b border-[#DDE3EB]
        bg-white
        shadow-[0_5px_18px_rgba(7,21,46,0.05)]
      "
    >
      <div className="flex h-[46px] w-full items-stretch">
        {/* Full-edge title strip */}
        <div
          className="
            flex w-[220px] shrink-0
            items-center justify-center gap-2
            bg-[#07152E]
            px-5
            text-[14px] font-black text-[#F7B548]
          "
        >
          <Route size={18} />
          المسارات المتاحة
        </div>

        {/* Path tabs */}
        <div
          className="
            flex min-w-0 flex-1 items-center gap-2
            overflow-x-auto px-5
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {activePaths.map((path) => {
            const isActive = path.slug === activeSlug;

            return (
              <Link
                key={path.slug}
                href={`/career-path/${path.slug}`}
                className={`
                  flex shrink-0 items-center gap-2
                  rounded-xl px-5 py-2
                  text-[13px] font-black
                  transition duration-300
                  ${
                    isActive
                      ? "bg-[#FFF4D9] text-[#07152E]"
                      : "text-slate-600 hover:bg-[#F7F8FA] hover:text-[#07152E]"
                  }
                `}
              >
                {isActive && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#F7B548]" />
                )}

                {path.shortTitle}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}