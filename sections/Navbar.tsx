"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Languages, Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

import AuthLink from "@/components/AuthLink";
import NavbarUser from "@/components/auth/NavbarUser";

type ActiveItem = "home" | "about" | "career-paths" | "journeys";
type Locale = "ar" | "en";

type NavbarProps = {
  activeItem?: ActiveItem;
};

const labels = {
  ar: {
    home: "مركز الرحلات",
    about: "عن الأكاديمية",
    careerPaths: "المسارات المهنية",
    journeys: "رحلاتي التعليمية",
    contact: "اتصل بنا",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    homeAria: "العودة إلى الصفحة الرئيسية",
    language: "English",
  },
  en: {
    home: "Journey Center",
    about: "About Academy",
    careerPaths: "Career Paths",
    journeys: "My Learning Journeys",
    contact: "Contact Us",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "Return to homepage",
    language: "العربية",
  },
} as const;

function detectActiveItem(pathname: string): ActiveItem {
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/my-learning")
  ) {
    return "journeys";
  }

  if (pathname.startsWith("/career-path")) return "career-paths";
  if (pathname.startsWith("/about")) return "about";
  return "home";
}

export default function Navbar({ activeItem }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("ar");
  const [localeReady, setLocaleReady] = useState(false);

  const detectedItem = detectActiveItem(pathname);
  const currentItem = detectedItem === "home" && activeItem ? activeItem : detectedItem;
  const text = labels[locale];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale"
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    setLocaleReady(true);

    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!localeReady) return;

    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("masar-locale", locale);
  }, [locale, localeReady]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const links = useMemo(
    () => [
      { id: "home" as const, href: "/", label: text.home, protected: false },
      { id: "about" as const, href: "/about", label: text.about, protected: true },
      { id: "career-paths" as const, href: "/career-path/road-design", label: text.careerPaths, protected: true },
      { id: "journeys" as const, href: "/dashboard", label: text.journeys, protected: true },
    ],
    [text]
  );

  const navLinkClass = (item: ActiveItem) =>
    `group relative text-[15px] font-semibold transition duration-300 ${
      currentItem === item ? "text-[#F7B548]" : "text-white hover:text-[#F7B548]"
    }`;

  const renderLink = (link: (typeof links)[number], mobile = false) => {
    const className = mobile
      ? `flex min-h-12 items-center rounded-xl px-4 text-sm font-black transition ${
          currentItem === link.id
            ? "bg-[#F7B548] text-[#07152E]"
            : "text-white hover:bg-white/10 hover:text-[#F7B548]"
        }`
      : navLinkClass(link.id);

    const content = (
      <>
        {link.label}
        {!mobile && (
          <span
            className={`absolute -bottom-2 right-0 h-[2px] bg-[#F7B548] transition-all duration-300 ${
              currentItem === link.id ? "w-full" : "w-0 group-hover:w-full"
            }`}
          />
        )}
      </>
    );

    return link.protected ? (
      <AuthLink key={link.id} href={link.href} className={className}>
        {content}
      </AuthLink>
    ) : (
      <Link key={link.id} href={link.href} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <header
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`fixed inset-x-0 top-0 z-[100] h-[55px] transition-all duration-500 ${
        scrolled ? "bg-[#07152E]/95 shadow-xl backdrop-blur-xl" : "bg-[#07152E]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex shrink-0 items-center gap-5 xl:gap-10">
          <Link href="/" aria-label={text.homeAria} className="flex items-center">
            <h1 className="whitespace-nowrap text-[22px] font-black tracking-tight sm:text-[25px]">
              {locale === "ar" ? (
                <>
                  <span className="text-white">صناعــ</span>
                  <span className="mr-2 text-[#F7B548]">ــالمسار</span>
                </>
              ) : (
                <>
                  <span className="text-white">Masar</span>
                  <span className="ml-2 text-[#F7B548]">Makers</span>
                </>
              )}
            </h1>
          </Link>
          <div className="hidden lg:block"><NavbarUser locale={locale} /></div>
        </div>

        <nav className="hidden items-center gap-7 xl:gap-9 lg:flex">
          {links.map((link) => renderLink(link))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLocale((value) => (value === "ar" ? "en" : "ar"))}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-black text-white transition hover:border-[#F7B548] hover:text-[#F7B548]"
            aria-label="تغيير اللغة"
          >
            <Languages size={16} />
            <span>{text.language}</span>
          </button>

          <a
            href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:shadow-[0_0_22px_rgba(37,211,102,.55)] xl:flex"
            aria-label="تواصل معنا عبر واتساب"
          >
            <FaWhatsapp size={22} />
          </a>
          <span className="hidden text-[14px] font-bold text-white xl:block">{text.contact}</span>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? text.closeMenu : text.openMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#07152E]/98 px-4 pb-5 pt-4 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-[1480px] flex-col gap-2">
            {links.map((link) => renderLink(link, true))}
            <div className="mt-2 border-t border-white/10 pt-4"><NavbarUser locale={locale} /></div>
          </nav>
        </div>
      )}
    </header>
  );
}