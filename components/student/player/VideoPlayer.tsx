"use client";

import BunnyVideoPlayer from "@/components/student/player/BunnyVideoPlayer";

type VideoPlayerProps = {
  lessonId: string;
  title?: string;
  initialPositionSeconds?: number;
  completionThreshold?: number;
  posterUrl?: string | null;
  onCompleted?: () => void;
};

export default function VideoPlayer({
  lessonId,
  completionThreshold = 90,
}: VideoPlayerProps) {
  return (
    <BunnyVideoPlayer
      lessonId={lessonId}
      completionThreshold={completionThreshold}
    />
  );
}