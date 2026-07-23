"use client";

import { CheckCircle2, Play, Rocket } from "lucide-react";

import PlatformActionButton from "./PlatformActionButton";

import type { EnrollmentStatusMap } from "@/lib/actions/enroll";
import type {
  ProfessionalActionConfig,
  ProfessionalContentBlock,
  ProfessionalJourneyColumn,
  ProfessionalPanelDraft,
} from "@/components/course/editor";

type ProfessionalPanelViewerProps = {
  stationId: string;
  courseId: string;
  panelComponent?: string;
  enrollmentStatuses?: EnrollmentStatusMap;
  value: ProfessionalPanelDraft;
};

export default function ProfessionalPanelViewer({
  stationId,
  courseId,
  panelComponent = "professional",
  enrollmentStatuses,
  value,
}: ProfessionalPanelViewerProps) {
  const fundamentalBlocks = value.blocks.filter(
    (block) => block.journey === "fundamental",
  );

  const advancedBlocks = value.blocks.filter(
    (block) => block.journey === "advanced",
  );

  return (
    <section
      data-panel-component={panelComponent}
      className="overflow-hidden rounded-[28px] border border-[#F7B548]/35 bg-[#07152E] shadow-[0_24px_70px_rgba(7,21,46,0.20)]"
    >
      <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F7B548]/15 text-[#F7B548]">
            <Rocket size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#F7B548] sm:text-3xl">
              {value.screenTitle}
            </h2>

            {value.screenSubtitle && (
              <p className="mt-2 text-sm font-bold text-white/70">
                {value.screenSubtitle}
              </p>
            )}
          </div>
        </div>

        {value.screenAction.enabled && (
          <PlatformActionButton
            label={value.screenAction.label || "اشترك الآن"}
            mode={value.screenAction.mode}
            link={value.screenAction.link}
            courseId={courseId}
            stationId={stationId}
            journeyType={
              panelComponent === "free"
                ? "free"
                : panelComponent === "workshop"
                  ? "workshop"
                  : "integrated"
            }
            actionKey={`${panelComponent}:screen`}
            actionTitle={value.screenAction.label || value.screenTitle}
            enrollmentStatus={
              enrollmentStatuses?.[`${panelComponent}:screen`] ?? null
            }
            className="min-w-[180px]"
          />
        )}
      </header>

      <div
        className={
          value.columnCount === 2
            ? "grid gap-px bg-white/10 lg:grid-cols-2"
            : "grid gap-px bg-white/10"
        }
      >
        <ViewerColumn
          stationId={stationId}
          courseId={courseId}
          panelComponent={panelComponent}
          enrollmentStatuses={enrollmentStatuses}
          journey="fundamental"
          title={value.columnOneTitle}
          action={value.columnOneAction}
          blocks={fundamentalBlocks}
        />

        {value.columnCount === 2 && (
          <ViewerColumn
            stationId={stationId}
            courseId={courseId}
            panelComponent={panelComponent}
            enrollmentStatuses={enrollmentStatuses}
            journey="advanced"
            title={value.columnTwoTitle}
            action={value.columnTwoAction}
            blocks={advancedBlocks}
          />
        )}
      </div>
    </section>
  );
}

type ViewerColumnProps = {
  stationId: string;
  courseId: string;
  panelComponent?: string;
  enrollmentStatuses?: EnrollmentStatusMap;
  journey: ProfessionalJourneyColumn;
  title: string;
  action: ProfessionalActionConfig;
  blocks: ProfessionalContentBlock[];
};

function ViewerColumn({
  stationId,
  courseId,
  panelComponent = "professional",
  enrollmentStatuses,
  journey,
  title,
  action,
  blocks,
}: ViewerColumnProps) {
  const headerColor =
    journey === "fundamental"
      ? "bg-[#214B75]"
      : "bg-[#263F6D]";

  return (
    <article className="bg-white">
      <div
        className={`flex min-h-[84px] flex-wrap items-center justify-between gap-3 px-5 py-4 text-white ${headerColor}`}
      >
        <h3 className="text-xl font-black">{title}</h3>

        {action.enabled && (
          <PlatformActionButton
            label={action.label || "اشترك الآن"}
            mode={action.mode}
            link={action.link}
            courseId={courseId}
            stationId={stationId}
            journeyType={resolveJourneyType(panelComponent, journey)}
            actionKey={`${panelComponent}:column:${journey}`}
            actionTitle={action.label || title}
            enrollmentStatus={
              enrollmentStatuses?.[
                `${panelComponent}:column:${journey}`
              ] ?? null
            }
            className="min-w-[180px]"
          />
        )}
      </div>

      <div className="space-y-4 p-5">
        {blocks.map((block) => (
          <ViewerBlock
            key={block.id}
            stationId={stationId}
            courseId={courseId}
            panelComponent={panelComponent}
            enrollmentStatuses={enrollmentStatuses}
            block={block}
          />
        ))}
      </div>
    </article>
  );
}

function ViewerBlock({
  stationId,
  courseId,
  panelComponent,
  enrollmentStatuses,
  block,
}: {
  stationId: string;
  courseId: string;
  panelComponent: string;
  enrollmentStatuses?: EnrollmentStatusMap;
  block: ProfessionalContentBlock;
}) {

  if (block.type === "image") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC]">
        {block.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.imageUrl}
            alt={block.altText || block.title}
            className="h-auto w-full object-cover"
          />
        )}

        {(block.title || block.caption) && (
          <figcaption className="p-4">
            {block.title && (
              <h4 className="font-black text-[#07152E]">{block.title}</h4>
            )}

            {block.caption && (
              <p className="mt-1 text-sm font-bold text-slate-500">
                {block.caption}
              </p>
            )}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "video") {
    const videoBlock = block as ProfessionalContentBlock & {
      type: "video";
      title: string;
      caption?: string;
      provider?: "youtube" | "vimeo" | "mp4";
      videoUrl: string;
      thumbnail?: string;
    };

    const youtubeThumbnail = getYouTubeThumbnail(videoBlock.videoUrl);
    const displayThumbnail = videoBlock.thumbnail?.trim() || youtubeThumbnail;

    return (
      <article className="overflow-hidden rounded-2xl border border-[#DCE3EB] bg-[#F8FAFC]">
        {displayThumbnail && videoBlock.videoUrl ? (
          <a
            href={videoBlock.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-video overflow-hidden bg-[#07152E]"
            aria-label="فتح الفيديو"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayThumbnail}
              alt={videoBlock.title || "غلاف الفيديو"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />

            <div className="absolute inset-0 bg-[#07152E]/30 transition group-hover:bg-[#07152E]/20" />

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/85 bg-[#F7B548] text-[#07152E] shadow-[0_14px_35px_rgba(0,0,0,0.35)] transition group-hover:scale-110">
                <Play
                  size={28}
                  fill="currentColor"
                  className="-translate-x-0.5"
                />
              </span>
            </span>
          </a>
        ) : null}

        <div className="p-4">
          <h4 className="font-black text-[#07152E]">{videoBlock.title}</h4>

          {videoBlock.caption && (
            <p className="mt-1 text-sm font-bold text-slate-500">
              {videoBlock.caption}
            </p>
          )}

          {videoBlock.videoUrl && (
            <PlatformActionButton
              label="فتح الفيديو"
              mode="link"
              link={videoBlock.videoUrl}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#07152E] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214B75]"
            >
              <>
                <Play size={14} fill="currentColor" />
                فتح الفيديو
              </>
            </PlatformActionButton>
          )}
        </div>
      </article>
    );
  }

  const listBlock = block as ProfessionalContentBlock & {
    type: "list";
    title?: string;
    items: Array<{
      id: string;
      title: string;
      description?: string;
      hasButton: boolean;
      buttonLink?: string;
      buttonText?: string;
      buttonMode?: "enrollment" | "free" | "whatsapp" | "link";
    }>;
  };

  return (
    <div className="rounded-2xl border border-[#DCE3EB] bg-white p-4 shadow-sm">
      {listBlock.title && (
        <h4 className="mb-3 font-black text-[#07152E]">{listBlock.title}</h4>
      )}

      <div className="space-y-3">
        {listBlock.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="font-black text-[#07152E]">{item.title}</p>

                {item.description && (
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {item.hasButton && (
             <PlatformActionButton
                label={item.buttonText || "عرض"}
                mode={item.buttonMode || "link"}
                link={item.buttonLink}
                courseId={courseId}
                stationId={stationId}
                journeyType={resolveJourneyType(panelComponent, block.journey)}
                actionKey={`${panelComponent}:item:${item.id}`}
                actionTitle={item.title}
                enrollmentStatus={
                  enrollmentStatuses?.[
                    `${panelComponent}:item:${item.id}`
                  ] ?? null
                }
                itemTitle={item.title}
                className="rounded-xl bg-[#07152E] px-4 py-2 text-xs font-black text-white transition hover:bg-[#214B75]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


function resolveJourneyType(
  panelComponent: string,
  blockJourney: ProfessionalJourneyColumn,
): string {
  if (panelComponent === "free") {
    return "free";
  }

  if (panelComponent === "workshop") {
    return "workshop";
  }

  if (panelComponent === "professional") {
    return blockJourney;
  }

  return panelComponent || blockJourney;
}

function getYouTubeThumbnail(videoUrl: string): string {
  const videoId = extractYouTubeVideoId(videoUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function extractYouTubeVideoId(videoUrl: string): string {
  const normalizedUrl = videoUrl?.trim();

  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (url.pathname.includes("/shorts/")) {
      return url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    }

    if (url.pathname.includes("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }

    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
}