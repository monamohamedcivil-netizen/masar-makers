"use client";

import { useEffect, useState } from "react";

type SectionTitleProps = {
  title: string;
  description: string;
};

export default function SectionTitle({
  title,
  description,
}: SectionTitleProps) {
  const [displayedTitle, setDisplayedTitle] =
    useState(title);

  const [
    displayedDescription,
    setDisplayedDescription,
  ] = useState(description);

  const [visible, setVisible] =
    useState(true);

  useEffect(() => {
    if (
      title === displayedTitle &&
      description === displayedDescription
    ) {
      return;
    }

    setVisible(false);

    const timer =
      window.setTimeout(() => {
        setDisplayedTitle(title);
        setDisplayedDescription(
          description,
        );
        setVisible(true);
      }, 220);

    return () =>
      window.clearTimeout(timer);
  }, [
    title,
    description,
    displayedTitle,
    displayedDescription,
  ]);

  return (
    <section className="relative z-30 border-y border-[#E8E8E8] bg-[#F7F8FA]">
      <div
        className="
          mx-auto
          flex
          h-[58px]
          max-w-[1500px]
          flex-col
          items-center
          justify-center
          overflow-hidden
          px-3
          text-center

          sm:h-[62px]
          md:h-[70px]
        "
      >
        <div
          className={`w-full transition-all duration-500 ease-out ${
            visible
              ? "translate-y-0.5 opacity-100"
              : "-translate-y-3 opacity-0"
          }`}
        >
          <h2
            className="
              text-[20px]
              font-black
              leading-tight
              text-[#07152E]

              sm:text-[24px]
              md:text-3xl
            "
          >
            {displayedTitle}
          </h2>

          <p
            className="
              mt-1
              px-2
              text-[10px]
              font-medium
              leading-4
              text-slate-500

              sm:text-[13px]
              sm:leading-5

              md:mt-0
              md:text-base
            "
          >
            {displayedDescription}
          </p>
        </div>
      </div>
    </section>
  );
}