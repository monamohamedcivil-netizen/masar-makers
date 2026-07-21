type Props = {
  data: any;
};

export default function HeadingBlock({ data }: Props) {
  const Tag =
    data.size === "h1"
      ? "h1"
      : data.size === "h3"
      ? "h3"
      : "h2";

  return (
    <div
      style={{
        textAlign: data.align ?? "right",
      }}
      className="space-y-4"
    >
      <Tag
        style={{
          color: data.color ?? "#07152E",
        }}
        className="font-black"
      >
        {data.title}
      </Tag>

      {data.subtitle && (
        <p className="text-slate-600">
          {data.subtitle}
        </p>
      )}
    </div>
  );
}