"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Map,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import useCurrentUser from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";
type ProfileRole = "admin" | "student" | string | null;

type NavbarUserProps = {
  locale?: Locale;
};

const labels = {
  ar: {
    profile: "بياناتي",
    careerPaths: "المسارات المهنية",
    journeys: "رحلاتي التعليمية",
    adminDashboard: "لوحة التحكم",
    signOut: "تسجيل الخروج",
    signingOut: "جارٍ تسجيل الخروج...",
    signOutError: "تعذر تسجيل الخروج. حاول مرة أخرى.",
    admin: "مدير المنصة",
    student: "طالب",
    openMenu: "فتح قائمة المستخدم",
  },
  en: {
    profile: "My Profile",
    careerPaths: "Career Paths",
    journeys: "My Learning Journeys",
    adminDashboard: "Admin Dashboard",
    signOut: "Sign Out",
    signingOut: "Signing out...",
    signOutError: "Unable to sign out. Please try again.",
    admin: "Administrator",
    student: "Student",
    openMenu: "Open user menu",
  },
} as const;

export default function NavbarUser({
  locale = "ar",
}: NavbarUserProps) {
  const { user, loading } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const text = labels[locale];

  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<ProfileRole>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user?.id) {
        setRole(null);
        return;
      }

      const metadataRole =
        typeof user.user_metadata?.role === "string"
          ? user.user_metadata.role
          : null;

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("Failed to load navbar profile role:", error);
          setRole(metadataRole);
          return;
        }

        setRole(
          typeof data?.role === "string"
            ? data.role
            : metadataRole,
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to initialize navbar profile role:", error);
          setRole(metadataRole);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.user_metadata?.role]);

  if (loading) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
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
    (locale === "ar" ? "متدرب" : "Student");

  const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    "";

  const nameParts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName =
    nameParts[0] ||
    (locale === "ar" ? "متدرب" : "Student");

  const initials =
    nameParts.length > 1
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : firstName.slice(0, 2);

  const uppercaseInitials = initials.toUpperCase();
  const isAdmin = String(role ?? "").toLowerCase() === "admin";

  const menuItems = [
    {
      id: "profile",
      label: text.profile,
      href: "/profile",
      icon: CircleUserRound,
    },
    {
      id: "career-paths",
      label: text.careerPaths,
      href: "/career-path/road-design",
      icon: Map,
    },
    {
      id: "journeys",
      label: text.journeys,
      href: "/dashboard",
      icon: BookOpenCheck,
    },
  ] as const;

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      window.alert(text.signOutError);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={text.openMenu}
        className="
          flex items-center gap-2 rounded-full
          border border-transparent px-1.5 py-1
          transition
          hover:border-white/15 hover:bg-white/10
          focus:outline-none focus-visible:ring-2
          focus-visible:ring-[#F7B548]
        "
      >
        <span
          className="
            relative flex h-8 w-8 shrink-0
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
        </span>

        <span className="hidden max-w-[95px] truncate text-[12px] font-bold text-white lg:block">
          {firstName}
        </span>

        <ChevronDown
          size={15}
          className={`hidden text-white/70 transition-transform duration-200 lg:block ${
            menuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={`
            absolute top-[calc(100%+10px)]
            z-[140] w-[270px] overflow-hidden
            rounded-2xl border border-slate-200
            bg-white
            shadow-[0_24px_65px_rgba(7,21,46,0.24)]
            ${locale === "ar" ? "right-0 text-right" : "left-0 text-left"}
          `}
        >
          <div className="border-b border-slate-100 bg-[#F8FAFC] px-4 py-3">
            <p className="truncate text-[13px] font-black text-[#07152E]">
              {String(fullName)}
            </p>

            <p
              dir="ltr"
              className={`mt-1 truncate text-[10px] font-semibold text-slate-500 ${
                locale === "ar" ? "text-right" : "text-left"
              }`}
            >
              {user.email}
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${
                isAdmin
                  ? "bg-[#FFF1D6] text-[#9A6711]"
                  : "bg-sky-50 text-sky-700"
              }`}
            >
              {isAdmin ? text.admin : text.student}
            </span>
          </div>

          <nav className="p-2">
            {menuItems.map(({ id, label, href, icon: Icon }) => {
              const active =
                id === "journeys"
                  ? pathname.startsWith("/dashboard") ||
                    pathname.startsWith("/journeys") ||
                    pathname.startsWith("/student") ||
                    pathname.startsWith("/workspace") ||
                    pathname.startsWith("/my-learning")
                  : pathname === href ||
                    pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={id}
                  href={href}
                  role="menuitem"
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12px] font-black transition ${
                    active
                      ? "bg-[#FFF4DF] text-[#9A6711]"
                      : "text-[#07152E] hover:bg-slate-50 hover:text-[#B87508]"
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="my-2 h-px bg-slate-100" />

                <Link
                  href="/admin/dashboard"
                  role="menuitem"
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12px] font-black transition ${
                    pathname.startsWith("/admin")
                      ? "bg-[#07152E] text-[#F7B548]"
                      : "text-[#07152E] hover:bg-[#07152E] hover:text-[#F7B548]"
                  }`}
                >
                  <LayoutDashboard size={17} className="shrink-0" />
                  <span>{text.adminDashboard}</span>
                </Link>
              </>
            )}
          </nav>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="
                flex min-h-11 w-full items-center gap-3
                rounded-xl px-3
                text-[12px] font-black text-red-600
                transition hover:bg-red-50
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              <LogOut size={17} className="shrink-0" />
              <span>
                {signingOut ? text.signingOut : text.signOut}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}