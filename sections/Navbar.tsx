"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

import AuthLink from "@/components/AuthLink";
import NavbarUser from "@/components/auth/NavbarUser";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";

type ActiveItem = "home" | "about" | "career-paths" | "journeys";
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
    contact: "اتصل بنا",
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
    contact: "Contact Us",
    login: "Login",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "Return to homepage",
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

  useEffect(() => setMobileOpen(false), [pathname]);

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
          {links.map((link) => renderLink(link))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitch compact />

          <a
            href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:shadow-[0_0_22px_rgba(37,211,102,.55)] xl:flex"
            aria-label={locale === "ar" ? "تواصل معنا عبر واتساب" : "Contact us on WhatsApp"}
          >
            <FaWhatsapp size={22} />
          </a>

          <span className="hidden text-[14px] font-bold text-white xl:block">
            {text.contact}
          </span>

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
            {links.map((link) => renderLink(link, true))}
            <div className="mt-2 border-t border-white/10 pt-4">
              <NavbarUser locale={locale} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
