"use client";

import Image from "next/image";

import useCurrentUser from "@/hooks/useCurrentUser";

export default function NavbarUser() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
    );
  }

  if (!user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "متدرب";

  const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    "";

  const nameParts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts[0] || "متدرب";

  const initials =
  nameParts.length > 1
    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
    : firstName.slice(0, 2);

const uppercaseInitials = initials.toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div
        className="
          relative flex h-7 w-7 shrink-0
          items-center justify-center overflow-hidden
          rounded-full bg-[#F7B548]
          text-[10px] font-black text-[#07152E]
        "
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={String(fullName)}
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <span dir="ltr" className="uppercase tracking-wide">
  {uppercaseInitials}
</span>
        )}
      </div>

      <span className="hidden max-w-[85px] truncate text-[12px] font-bold text-white lg:block">
        {firstName}
      </span>
    </div>
  );
}