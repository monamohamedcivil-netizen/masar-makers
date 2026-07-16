"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import AuthLink from "@/components/AuthLink";
import NavbarUser from "@/components/auth/NavbarUser";

type NavbarProps = {
  activeItem?: "home" | "about" | "journeys" | "achievements";
};

export default function Navbar({
  activeItem,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkClass = (
    item: NavbarProps["activeItem"]
  ) => `
    group relative text-[15px] font-semibold
    transition duration-300
    ${
      activeItem === item
        ? "text-[#F7B548]"
        : "text-white hover:text-[#F7B548]"
    }
  `;

  return (
    <header
      dir="rtl"
      className={`
        fixed inset-x-0 top-0 z-[100]
        h-[55px]
        transition-all duration-500
        ${
          scrolled
            ? "bg-[#07152E]/95 shadow-xl backdrop-blur-xl"
            : "bg-[#07152E]"
        }
      `}
    >
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between px-6 lg:px-10">
        {/* Right: Logo + User */}
        <div className="flex shrink-0 items-center gap-15">
          <Link
            href="/"
            aria-label="العودة إلى الصفحة الرئيسية"
            className="flex items-center"
          >
            <h1 className="text-[25px] font-black tracking-tight">
              <span className="text-white">
                صناعــ
              </span>

              <span className="mr-2 text-[#F7B548]">
               ــالمسار
              </span>
            </h1>
          </Link>

          <NavbarUser />
        </div>

        {/* Center Navigation */}
        <nav className="hidden items-center gap-9 lg:flex">
          <Link
            href="/"
            className={navLinkClass("home")}
          >
            مركز الرحلات

            <span
              className={`
                absolute -bottom-2 right-0 h-[2px]
                bg-[#F7B548] transition-all duration-300
                ${
                  activeItem === "home"
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }
              `}
            />
          </Link>

          <AuthLink
            href="/about"
            className={navLinkClass("about")}
          >
            عن الأكاديمية

            <span
              className={`
                absolute -bottom-2 right-0 h-[2px]
                bg-[#F7B548] transition-all duration-300
                ${
                  activeItem === "about"
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }
              `}
            />
          </AuthLink>

          <AuthLink
            href="/journeys"
            className={navLinkClass("journeys")}
          >
            رحلاتي التعليمية

            <span
              className={`
                absolute -bottom-2 right-0 h-[2px]
                bg-[#F7B548] transition-all duration-300
                ${
                  activeItem === "journeys"
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }
              `}
            />
          </AuthLink>

          <AuthLink
            href="/achievements"
            className={navLinkClass("achievements")}
          >
            إنجازاتي

            <span
              className={`
                absolute -bottom-2 right-0 h-[2px]
                bg-[#F7B548] transition-all duration-300
                ${
                  activeItem === "achievements"
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }
              `}
            />
          </AuthLink>
        </nav>

        {/* Left */}
        <div className="flex shrink-0 items-center gap-3">
          <a
            href="https://wa.me/201031885659?text=السلام عليكم، أرغب في الاستفسار عن منصة صناع المسار."
            target="_blank"
            rel="noopener noreferrer"
            className="
              hidden h-7 w-7 items-center justify-center
              rounded-full bg-[#25D366] text-white
              shadow-lg transition duration-300
              hover:scale-110
              hover:shadow-[0_0_22px_rgba(37,211,102,.55)]
              lg:flex
            "
            aria-label="تواصل معنا عبر واتساب"
          >
            <FaWhatsapp size={22} />
          </a>

          <span className="hidden text-[14px] font-bold text-white lg:block">
            اتصل بنا
          </span>

          <button
            type="button"
            aria-label="فتح القائمة"
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl border border-white/20
              text-white transition hover:bg-white/10
              lg:hidden
            "
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}