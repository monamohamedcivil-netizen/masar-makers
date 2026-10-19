"use client";

import type { ImgHTMLAttributes } from "react";

import { getOptimizedImageSrc } from "@/lib/utils/optimized-image";

/*
 * صورة عادية (<img>) لكنها تمر عبر مُحسِّن الصور في Next.js:
 * - تُحمَّل من Supabase مرة واحدة ثم تُخدَّم من سيرفر المنصة.
 * - إذا فشل المُحسِّن لأي سبب، تعود تلقائيًا للرابط الأصلي.
 * الشكل والتنسيق (className) يبقيان كما هما بدون أي تغيير.
 */

type CachedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: string;
  optimizeWidth?: number;
};

export default function CachedImage({
  src,
  optimizeWidth = 1200,
  alt,
  onError,
  ...rest
}: CachedImageProps) {
  const optimizedSrc = getOptimizedImageSrc(src, optimizeWidth);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={alt ?? ""}
      src={optimizedSrc}
      onError={(event) => {
        const image = event.currentTarget;

        if (optimizedSrc !== src && image.dataset.fallback !== "1") {
          image.dataset.fallback = "1";
          image.src = src;
          return;
        }

        onError?.(event);
      }}
    />
  );
}
