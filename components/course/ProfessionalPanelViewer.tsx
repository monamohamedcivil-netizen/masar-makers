"use client";

import { useEffect, useState } from "react";

import { CalendarDays, CheckCircle2, Gift, MessageSquareQuote, Play, PlayCircle, Rocket, Target } from "lucide-react";

import PlatformActionButton from "./PlatformActionButton";

import type {
  CourseEnrollmentAccess,
  EnrollmentStatusMap,
} from "@/lib/actions/enroll";
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
  enrollmentAccess?: CourseEnrollmentAccess;
  value: ProfessionalPanelDraft;
};

export default function ProfessionalPanelViewer({
  stationId,
  courseId,
  panelComponent = "professional",
  enrollmentStatuses,
  enrollmentAccess,
  value,
}: ProfessionalPanelViewerProps) {
  const fundamentalBlocks = value.blocks.filter(
    (block) => block.journey === "fundamental",
  );

  const advancedBlocks = value.blocks.filter(
    (block) => block.journey === "advanced",
  );

  const showIntegrated =
    enrollmentAccess?.showIntegrated ?? true;

  const showFundamental =
    enrollmentAccess?.showFundamental ?? true;

  const showAdvanced =
    enrollmentAccess?.showAdvanced ?? true;

  const panelHeader = getPanelHeaderConfig(panelComponent, value.screenTitle);
  const HeaderIcon = panelHeader.icon;

  const [mobileColumn, setMobileColumn] =
    useState<ProfessionalJourneyColumn>("fundamental");

  useEffect(() => {
    setMobileColumn("fundamental");
  }, [panelComponent, value.columnCount]);

  return (
    <section
      data-panel-component={panelComponent}
      className="min-h-[400px] overflow-hidden rounded-[24px] border border-[#C9D2DE] bg-white shadow-[0_22px_55px_rgba(7,21,46,0.16),0_4px_12px_rgba(7,21,46,0.08)]"
    >
      <header className="flex min-h-[64px] items-center justify-between gap-3 border-b-[3px] border-[#F7B548] bg-[#07152E] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7B548] text-[#07152E]">
            <HeaderIcon size={16} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-black leading-5 text-white sm:text-[20px]">
              {panelHeader.title}
            </h2>
          </div>
        </div>

        {value.screenAction.enabled && showIntegrated && (
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
            actionTitle={value.screenTitle}
            enrollmentStatus={
              enrollmentStatuses?.[`${panelComponent}:screen`] ?? null
            }
            className="w-[132px] shrink-0 sm:w-[155px]"
          />
        )}
      </header>

      {value.columnCount === 2 ? (
        <>
          {/* Mobile: inner columns become tabs */}
          <div
            className="grid grid-cols-2 border-b border-[#DCE2EA] bg-[#EEF1F5] lg:hidden"
            role="tablist"
            aria-label="أقسام الشاشة"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                mobileColumn === "fundamental"
              }
              onClick={() =>
                setMobileColumn("fundamental")
              }
              className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
                mobileColumn === "fundamental"
                  ? "bg-[#173A61] text-white"
                  : "bg-[#EEF1F5] text-[#4B5563]"
              }`}
            >
              {value.columnOneTitle}

              {mobileColumn ===
              "fundamental" ? (
                <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
              ) : null}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                mobileColumn === "advanced"
              }
              onClick={() =>
                setMobileColumn("advanced")
              }
              className={`relative min-h-[46px] px-3 text-[11px] font-black transition ${
                mobileColumn === "advanced"
                  ? "bg-[#102D50] text-white"
                  : "bg-[#EEF1F5] text-[#4B5563]"
              }`}
            >
              {value.columnTwoTitle}

              {mobileColumn ===
              "advanced" ? (
                <span className="absolute inset-x-4 bottom-0 h-[3px] bg-[#F7B548]" />
              ) : null}
            </button>
          </div>

          <div className="min-h-[333px] bg-white lg:hidden">
            {mobileColumn ===
            "fundamental" ? (
              <ViewerColumn
                stationId={stationId}
                courseId={courseId}
                panelComponent={panelComponent}
                enrollmentStatuses={
                  enrollmentStatuses
                }
                journey="fundamental"
                title={value.columnOneTitle}
                action={value.columnOneAction}
                showAction={showFundamental}
                blocks={fundamentalBlocks}
                hideColumnHeader
              />
            ) : (
              <ViewerColumn
                stationId={stationId}
                courseId={courseId}
                panelComponent={panelComponent}
                enrollmentStatuses={
                  enrollmentStatuses
                }
                journey="advanced"
                title={value.columnTwoTitle}
                action={value.columnTwoAction}
                showAction={showAdvanced}
                blocks={advancedBlocks}
                hideColumnHeader
              />
            )}
          </div>

          {/* Desktop: keep both columns visible */}
          <div className="hidden min-h-[333px] gap-px bg-[#DCE2EA] lg:grid lg:grid-cols-2">
            <ViewerColumn
              stationId={stationId}
              courseId={courseId}
              panelComponent={panelComponent}
              enrollmentStatuses={
                enrollmentStatuses
              }
              journey="fundamental"
              title={value.columnOneTitle}
              action={value.columnOneAction}
              showAction={showFundamental}
              blocks={fundamentalBlocks}
            />

            <ViewerColumn
              stationId={stationId}
              courseId={courseId}
              panelComponent={panelComponent}
              enrollmentStatuses={
                enrollmentStatuses
              }
              journey="advanced"
              title={value.columnTwoTitle}
              action={value.columnTwoAction}
              showAction={showAdvanced}
              blocks={advancedBlocks}
            />
          </div>
        </>
      ) : (
        <div className="grid min-h-[333px] bg-[#DCE2EA]">
          <ViewerColumn
            stationId={stationId}
            courseId={courseId}
            panelComponent={panelComponent}
            enrollmentStatuses={
              enrollmentStatuses
            }
            journey="fundamental"
            title={value.columnOneTitle}
            action={value.columnOneAction}
            showAction={showFundamental}
            blocks={fundamentalBlocks}
          />
        </div>
      )}
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
  showAction: boolean;
  blocks: ProfessionalContentBlock[];
  hideColumnHeader?: boolean;
};

function ViewerColumn({
  stationId,
  courseId,
  panelComponent = "professional",
  enrollmentStatuses,
  journey,
  title,
  action,
  showAction,
  blocks,
  hideColumnHeader = false,
}: ViewerColumnProps) {
  const headerColor =
    journey === "fundamental"
      ? "bg-[#173A61]"
      : "bg-[#102D50]";

  return (
    <article className="flex min-h-[333px] flex-col bg-white">
      {!hideColumnHeader ? (
        <div
          className={`flex min-h-[50px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-white ${headerColor}`}
        >
          <h3 className="text-[13px] font-black">{title}</h3>

          {action.enabled && showAction && (
            <PlatformActionButton
              label={action.label || "اشترك الآن"}
              mode={action.mode}
              link={action.link}
              courseId={courseId}
              stationId={stationId}
              journeyType={resolveJourneyType(panelComponent, journey)}
              actionKey={`${panelComponent}:column:${journey}`}
              actionTitle={title}
              enrollmentStatus={
                enrollmentStatuses?.[
                  `${panelComponent}:column:${journey}`
                ] ?? null
              }
              className="w-full sm:w-[150px]"
            />
          )}
        </div>
      ) : action.enabled && showAction ? (
        <div className="flex justify-end border-b border-[#E3E7ED] bg-white px-3 py-2">
          <PlatformActionButton
            label={action.label || "اشترك الآن"}
            mode={action.mode}
            link={action.link}
            courseId={courseId}
            stationId={stationId}
            journeyType={resolveJourneyType(panelComponent, journey)}
            actionKey={`${panelComponent}:column:${journey}`}
            actionTitle={title}
            enrollmentStatus={
              enrollmentStatuses?.[
                `${panelComponent}:column:${journey}`
              ] ?? null
            }
            className="w-[135px]"
          />
        </div>
      ) : null}

      <div className="flex-1 space-y-2.5 p-3">
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
      <figure className="overflow-hidden rounded-xl border border-[#DCE3EB] bg-[#F8FAFC]">
        {block.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.imageUrl}
            alt={block.altText || block.title}
            className="h-auto w-full object-cover"
          />
        )}

        {(block.title || block.caption) && (
          <figcaption className="p-3">
            {block.title && (
              <h4 className="text-[12px] font-black text-[#07152E]">{block.title}</h4>
            )}

            {block.caption && (
              <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500">
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
      <article className="overflow-hidden rounded-xl border border-[#DCE3EB] bg-[#F8FAFC]">
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

        <div className="p-3">
          <h4 className="text-[12px] font-black text-[#07152E]">{videoBlock.title}</h4>

          {videoBlock.caption && (
            <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500">
              {videoBlock.caption}
            </p>
          )}

          {videoBlock.videoUrl && (
            <a
              href={videoBlock.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#07152E] px-3 text-[9px] font-black text-white transition hover:bg-[#214B75]"
            >
              <Play size={14} fill="currentColor" />
              فتح الفيديو
            </a>
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
      buttonMode?: "enrollment" | "free";
    }>;
  };

  return (
    <div className="rounded-xl border border-[#DCE3EB] bg-white p-3 shadow-sm">
      {listBlock.title && (
        <h4 className="mb-2 text-[12px] font-black text-[#07152E]">{listBlock.title}</h4>
      )}

      <div className="space-y-2">
        {listBlock.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2">
              <CheckCircle2
                size={14}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-[11px] font-black text-[#07152E]">{item.title}</p>

                {item.description && (
                  <p className="mt-0.5 text-[9px] font-bold leading-4 text-slate-500">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {item.hasButton && (
             <PlatformActionButton
                label={item.buttonText || "عرض"}
                mode={item.buttonMode || "enrollment"}
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
                className="w-full sm:w-[120px]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


function getPanelHeaderConfig(panelComponent: string, fallbackTitle: string) {
  switch (panelComponent) {
    case "professional":
      return { title: fallbackTitle || "رحلة الاحتراف المتكاملة", icon: Rocket };
    case "workshop":
      return { title: "رحلات اليوم الواحد", icon: CalendarDays };
    case "free":
      return { title: "الرحلات المجانية", icon: PlayCircle };
    case "outcome":
    case "outcomes":
      return { title: "إلى ماذا سأصل؟", icon: Target };
    case "gifts":
    case "resources":
    case "gifts-files":
      return { title: "الهدايا والملفات", icon: Gift };
    case "success-stories":
    case "successStories":
    case "testimonials":
      return { title: "قصص نجاح المتدربين", icon: MessageSquareQuote };
    default:
      return { title: fallbackTitle, icon: Rocket };
  }
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