import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function JourneyCard({ children, className = "" }: Props) {
  return (
    <section
      className={`overflow-hidden rounded-[26px] border border-[#D9E1EA] bg-white shadow-[0_18px_45px_rgba(7,21,46,0.10)] ${className}`}
    >
      {children}
    </section>
  );
}
