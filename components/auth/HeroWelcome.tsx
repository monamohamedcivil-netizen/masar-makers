"use client";

import useCurrentUser from "@/hooks/useCurrentUser";

export default function HeroWelcome() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "مهندس";

  const firstName =
    String(fullName).trim().split(/\s+/)[0] || "مهندس";

  return (
    <div
      className="
        absolute left-[28%] top-[16%] z-30
        -translate-x-1/2
        max-lg:left-[38%]
        max-md:hidden
      "
    >
      <div
        className="
          rounded-[28px]
          border border-white/55
          bg-white/78
          px-7 py-3
          text-center
          shadow-[0_8px_24px_rgba(7,21,46,0.12)]
          backdrop-blur-md
        "
        
      >

        
        <p className="whitespace-nowrap text-[13px] font-bold text-[#07152E]">
          أهلًا بعودتك يا{" "}
          <span className="font-black text-[#C88712]">
            {firstName}
          </span>
          ، سعداء بوجودك معنا
        </p>
      </div>
    </div>
  );
}