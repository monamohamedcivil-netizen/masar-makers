"use client";

type Props = {
  data: any;
  onChange: (data: any) => void;
};

export default function HeadingEditor({
  data,
  onChange,
}: Props) {

  function setValue(key: string, value: any) {
    onChange({
      ...data,
      [key]: value,
    });
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="mb-2 block font-semibold">
          Title
        </label>

        <input
          value={data.title ?? ""}
          onChange={(e) =>
            setValue("title", e.target.value)
          }
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Subtitle
        </label>

        <textarea
          rows={3}
          value={data.subtitle ?? ""}
          onChange={(e) =>
            setValue("subtitle", e.target.value)
          }
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div>
          <label className="mb-2 block">
            Alignment
          </label>

          <select
            value={data.align ?? "left"}
            onChange={(e) =>
              setValue("align", e.target.value)
            }
            className="w-full rounded-lg border p-3"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>

        </div>

        <div>

          <label className="mb-2 block">
            Size
          </label>

          <select
            value={data.size ?? "h2"}
            onChange={(e) =>
              setValue("size", e.target.value)
            }
            className="w-full rounded-lg border p-3"
          >

            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>

          </select>

        </div>

        <div>

          <label className="mb-2 block">
            Color
          </label>

          <input
            type="color"
            value={data.color ?? "#07152E"}
            onChange={(e) =>
              setValue("color", e.target.value)
            }
            className="h-12 w-full rounded-lg border"
          />

        </div>

      </div>

      <div className="rounded-xl border p-6">

        <p
          style={{
            color: data.color ?? "#07152E",
            textAlign: data.align ?? "left",
          }}
          className={
            data.size === "h1"
              ? "text-4xl font-black"
              : data.size === "h3"
              ? "text-xl font-black"
              : "text-3xl font-black"
          }
        >
          {data.title || "Heading"}
        </p>

        <p className="mt-3 text-slate-500">
          {data.subtitle}
        </p>

      </div>

    </div>
  );
}