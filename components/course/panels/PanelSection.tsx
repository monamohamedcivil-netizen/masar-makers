"use client";

type Props = {
  title: string;

  sectionKey: string;
};

export default function PanelSection({
  title,
  sectionKey,
}: Props) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
      "
    >
      <div className="text-lg font-black">
        {title}
      </div>

      <div className="mt-3 text-sm text-slate-500">
        Section:
        {" "}
        {sectionKey}
      </div>
    </div>
  );
}