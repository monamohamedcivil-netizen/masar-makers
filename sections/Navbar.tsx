"use client";

import { openMasarChat } from "@/lib/webchat/client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Menu, MessageCircleMore, X } from "lucide-react";
import { usePathname } from "next/navigation";

import AuthLink from "@/components/AuthLink";
import { learningModeHref } from "@/lib/journeys/flags";
import { useJourneysPagesEnabled } from "@/lib/journeys/use-journeys-pages";
import NavbarUser from "@/components/auth/NavbarUser";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";

type ActiveItem = "home" | "about" | "career-paths" | "journeys" | "learning-modes";
type Locale = "ar" | "en";

type NavbarProps = {
  activeItem?: ActiveItem;
};

const labels = {
  ar: {
    home: "مركز الرحلات",
    about: "من نحن",
    careerPaths: "المسارات المهنية",
    journeys: "رحلاتي التعليمية",
    learningModes: "طرق التعلم",
    professionalMode: "رحلات الاحتراف المتكاملة",
    oneDayMode: "رحلات اليوم الواحد",
    freeMode: "الرحلات المجانية",
    contact: "اسألني",
    login: "تسجيل الدخول",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    homeAria: "العودة إلى الصفحة الرئيسية",
  },
  en: {
    home: "Journey Center",
    about: "About Us",
    careerPaths: "Career Paths",
    journeys: "My Learning Journeys",
    learningModes: "Ways to learn",
    professionalMode: "Integrated professional journeys",
    oneDayMode: "One-day journeys",
    freeMode: "Free journeys",
    contact: "Ask me",
    login: "Login",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "Return to homepage",
  },
} as const;

function detectActiveItem(pathname: string): ActiveItem {
  if (/^\/journeys\/(professional|one-day|free)/.test(pathname)) return "learning-modes";
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/my-learning")
  ) {
    return "journeys";
  }

  if (
    pathname.startsWith("/career-path") ||
    pathname.startsWith("/course/")
  ) {
    return "career-paths";
  }

  if (pathname.startsWith("/about")) return "about";
  return "home";
}

export default function Navbar({ activeItem }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modesOpen, setModesOpen] = useState(false);
  const journeysPagesEnabled = useJourneysPagesEnabled();
  const [locale, setLocale] = useState<Locale>("ar");
  const [localeReady, setLocaleReady] = useState(false);

  const detectedItem = detectActiveItem(pathname);
  const currentItem =
    detectedItem === "home" && activeItem ? activeItem : detectedItem;
  const text = labels[locale];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(
      "masar-locale",
    ) as Locale | null;

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
    }

    setLocaleReady(true);

    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("masar:locale-change", handleLocaleChange);
    };
  }, []);

  useEffect(() => {
    if (!localeReady) return;

    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("masar-locale", locale);
    document.cookie = `masar-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale, localeReady]);

  useEffect(() => {
    setMobileOpen(false);
    setModesOpen(false);
  }, [pathname]);

  const modeLinks = [
    { href: learningModeHref("professional"), label: text.professionalMode, dot: "bg-[#E2B867]" },
    { href: learningModeHref("one-day"), label: text.oneDayMode, dot: "bg-[#5B9BEF]" },
    { href: learningModeHref("free"), label: text.freeMode, dot: "bg-[#4CC27A]" },
  ];

  const renderModesMenu = (mobile = false) =>
    !journeysPagesEnabled ? null : mobile ? (
      <div key="learning-modes" className="rounded-xl border border-white/10 p-2">
        <p className="px-2 pb-1 text-xs font-black text-[#F7B548]">{text.learningModes}</p>
        {modeLinks.map((m) => (
          <Link key={m.href} href={m.href} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-black text-white hover:bg-white/10">
            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
            {m.label}
          </Link>
        ))}
      </div>
    ) : (
      <div
        key="learning-modes"
        className="relative"
        onMouseEnter={() => setModesOpen(true)}
        onMouseLeave={() => setModesOpen(false)}
      >
        <button
          type="button"
          aria-expanded={modesOpen}
          onClick={() => setModesOpen((v) => !v)}
          className={`${navLinkClass("learning-modes")} inline-flex items-center gap-1`}
        >
          {text.learningModes}
          <ChevronDown size={15} className={`transition ${modesOpen ? "rotate-180" : ""}`} />
          <span
            className={`absolute -bottom-2 end-0 h-[2px] bg-[#F7B548] transition-all duration-300 ${
              currentItem === "learning-modes" ? "w-full" : "w-0 group-hover:w-full"
            }`}
          />
        </button>
        {modesOpen ? (
          <div className="absolute start-1/2 top-full z-[110] w-64 -translate-x-1/2 pt-3 rtl:translate-x-1/2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07152E] p-2 shadow-2xl">
              {modeLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-white transition hover:bg-white/10 hover:text-[#F7B548]"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );

  const links = useMemo(
    () => [
      {
        id: "home" as const,
        href: "/home",
        label: text.home,
        protected: false,
      },
      {
        id: "about" as const,
        href: "/about",
        label: text.about,
        protected: false,
      },
      {
        id: "career-paths" as const,
        href: "/career-path/road-design",
        label: text.careerPaths,
        protected: true,
      },
      {
        id: "journeys" as const,
        href: "/dashboard",
        label: text.journeys,
        protected: true,
      },
    ],
    [text],
  );

  const navLinkClass = (item: ActiveItem) =>
    `group relative text-[15px] font-semibold transition duration-300 ${
      currentItem === item
        ? "text-[#F7B548]"
        : "text-white hover:text-[#F7B548]"
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
            className={`absolute -bottom-2 end-0 h-[2px] bg-[#F7B548] transition-all duration-300 ${
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
      data-masar-navbar
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`fixed inset-x-0 top-0 z-[100] h-[55px] transition-all duration-500 ${
        scrolled ? "bg-[#07152E]/95 shadow-xl backdrop-blur-xl" : "bg-[#07152E]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-3 sm:px-6 lg:px-10">
        <div className="flex min-w-0 shrink items-center gap-3 xl:gap-10">
          <Link
            href="/home"
            aria-label={text.homeAria}
            className="flex min-w-0 items-center"
          >
            <h1 className="truncate whitespace-nowrap text-[18px] font-black tracking-tight sm:text-[25px]">
              {locale === "ar" ? (
                <>
                  <span className="text-white">صناعــ</span>
                  <span className="ms-2 text-[#F7B548]">ــالمسار</span>
                </>
              ) : (
                <>
                  <span className="text-white">Masar</span>
                  <span className="ms-2 text-[#F7B548]">Makers</span>
                </>
              )}
            </h1>
          </Link>

          <div className="hidden lg:block">
            <NavbarUser locale={locale} />
          </div>
        </div>

        <nav className="hidden items-center gap-7 lg:flex xl:gap-9">
          {links.map((link) => [renderLink(link), link.id === "career-paths" ? renderModesMenu() : null])}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitch compact />

          <a
            href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
            onClick={(event) => { if (openMasarChat({ source: "contact", text: "السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار." })) event.preventDefault(); }}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center gap-2 rounded-full border border-[#F7B548] bg-white/90 px-4 text-[13px] font-black text-[#07152E] shadow-md transition hover:-translate-y-0.5 hover:bg-white xl:flex"
            aria-label={locale === "ar" ? "اسأل مسار: إجابات فورية عن المنصة" : "Ask Masar: instant answers about the platform"}
          >
            <MessageCircleMore size={17} className="text-[#C88712]" />
            {text.contact}
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? text.closeMenu : text.openMenu}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 sm:h-10 sm:w-10 lg:hidden"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#07152E]/98 px-4 pb-5 pt-4 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-[1480px] flex-col gap-2">
            {links.map((link) => [renderLink(link, true), link.id === "career-paths" ? renderModesMenu(true) : null])}
            <div className="mt-2 border-t border-white/10 pt-4">
              <NavbarUser locale={locale} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
