import type { CatalogPanelBlock } from "@/lib/queries/catalog";
import HeadingBlock from "./blocks/HeadingBlock";

type BlockRendererProps = {
  block: CatalogPanelBlock;
};

export default function BlockRenderer({
  block,
}: BlockRendererProps) {
  switch (block.block_type) {

    case "heading":
      return (
        <div className="px-6 py-5">
          <HeadingBlock data={block.data} />
        </div>
      );

    case "text": {
  const content =
    typeof block.data?.content === "string"
      ? block.data.content
      : "";

  return (
    <div className="px-6 py-5">
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    </div>
  );
}

    case "image": {
  const imageSrc =
    typeof block.data?.src === "string"
      ? block.data.src
      : "";

  const imageAlt =
    typeof block.data?.alt === "string"
      ? block.data.alt
      : "";

  return (
    <img
      src={imageSrc}
      alt={imageAlt}
      className="w-full rounded-xl"
    />
  );
}
    case "video": {
  const videoUrl =
    typeof block.data?.url === "string"
      ? block.data.url
      : "";

  return (
    <iframe
      className="aspect-video w-full rounded-xl"
      src={videoUrl}
      title={
        typeof block.data?.title === "string"
          ? block.data.title
          : "Video"
      }
      allowFullScreen
    />
  );
}
    default:
      return (
        <div className="rounded-xl border border-dashed p-5 text-center text-slate-400">
          Unknown Block : {block.block_type}
        </div>
      );
  }
}