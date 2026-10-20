"use client";

import { useEffect, useState } from "react";

export type CellType = "text" | "number" | "date" | "select" | "bool" | "month";

interface EditableCellProps {
  value: string | number | boolean | null | undefined;
  type?: CellType;
  options?: Array<{ value: string; label: string }>;
  listId?: string;
  placeholder?: string;
  width?: number;
  className?: string;
  onSave: (value: string | number | boolean | null) => Promise<boolean>;
}

const base =
  "h-8 w-full rounded-md border border-transparent bg-transparent px-1.5 text-xs text-[#07152E] outline-none transition hover:border-slate-200 focus:border-[#F7B548] focus:bg-white";

/** خلية قابلة للتعديل مباشرة: تحفظ عند مغادرة الخلية (أو عند الاختيار). */
export default function EditableCell({
  value,
  type = "text",
  options,
  listId,
  placeholder,
  width,
  className = "",
  onSave,
}: EditableCellProps) {
  const toText = (v: EditableCellProps["value"]) =>
    v === null || v === undefined || typeof v === "boolean" ? "" : String(v);

  const [draft, setDraft] = useState(toText(value));
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    setDraft(toText(value));
  }, [value]);

  const commit = async (next: string | number | boolean | null) => {
    setState("saving");
    const ok = await onSave(next);
    setState(ok ? "idle" : "error");
    if (!ok) setDraft(toText(value));
  };

  const ring =
    state === "error"
      ? "!border-red-400"
      : state === "saving"
        ? "!border-amber-300"
        : "";

  const style = width ? { minWidth: width } : undefined;

  if (type === "bool") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => commit(e.target.checked)}
        className="h-4 w-4 accent-[#07152E]"
      />
    );
  }

  if (type === "select") {
    return (
      <select
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        style={style}
        className={`${base} ${ring} ${className}`}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const inputType = type === "month" ? "date" : type;

  return (
    <input
      type={inputType}
      step={type === "number" ? "any" : undefined}
      list={listId}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === toText(value)) return;
        if (type === "number") {
          commit(draft.trim() === "" ? null : Number(draft));
        } else {
          commit(draft.trim() === "" ? null : draft);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      style={style}
      className={`${base} ${ring} ${className}`}
    />
  );
}
