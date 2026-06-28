"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Hostnames configured in next.config.ts → images.remotePatterns.
// Anything outside this set would make next/image throw at runtime
// ("hostname not configured"), so we short-circuit to the fallback.
const ALLOWED_HOSTS = ["images.unsplash.com", "sfnjtnthefclkhmgnwre.supabase.co"];

function isAllowedSrc(src: string): boolean {
  try {
    const h = new URL(src).hostname;
    return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
  } catch {
    return false;
  }
}

/**
 * Wraps next/image with a branded fallback.
 * If the upstream image fails (404, network, unconfigured hostname),
 * a cute sakura-gradient placeholder with an emoji is shown instead of
 * a broken-image icon or a runtime crash.
 *
 * Usage identical to next/image — supports `fill`, `width/height`, etc.
 */
export function SafeImage({ alt, className, src, ...props }: ImageProps) {
  const [errored, setErrored] = useState(false);
  const srcStr = typeof src === "string" ? src : "";
  // Empty / missing / unconfigured-host src → fall back immediately so we
  // never hand next/image an empty string (which warns) or a bad hostname.
  const useFallback = errored || !srcStr || !isAllowedSrc(srcStr);

  if (useFallback) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-sakura-100 via-cream-100 to-peach-100",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <span className="select-none text-4xl opacity-70" aria-hidden>
          🌸
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      src={src}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}
