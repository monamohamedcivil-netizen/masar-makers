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
  const [displayedTitle, setDisplayedTitle] = useState(title);
  const [displayedDescription, setDisplayedDescription] =
    useState(description);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (
      title === displayedTitle &&
      description === displayedDescription
    ) {
      return;
    }

    setVisible(false);

    const timer = window.setTimeout(() => {
      setDisplayedTitle(title);
      setDisplayedDescription(description);
      setVisible(true);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [
    title,
    description,
    displayedTitle,
    displayedDescription,
  ]);

  return (
    <section className="relative z-30 border-y border-[#E8E8E8] bg-[#F7F8FA]">
      <div className="mx-auto flex h-[70px] max-w-[1500px] flex-col items-center justify-center overflow-hidden text-center">
        <div
          className={`transition-all duration-500 ease-out ${
            visible
              ? "translate-y-0.5 opacity-100"
              : "-translate-y-3 opacity-0"
          }`}
        >
          <h2 className="text-4xl font-black text-[#07152E]">
            {displayedTitle}
          </h2>

          <p className="mt-0 text-base font-medium text-slate-500">
            {displayedDescription}
          </p>

          
        </div>
      </div>
    </section>
  );
}