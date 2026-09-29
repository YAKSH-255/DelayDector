"use client";

import Image from "next/image";
import { cn } from "@/lib/analytics";

/**
 * The DelayDector mark on a glass tile: the supplied logo lifted into the
 * Molten Glass theme with a specular highlight, translucent rim and warm glow.
 */
export function Logo({
  size = 38,
  className,
  title = "DelayDector",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn("logo-tile", className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.29) }}
      title={title}
    >
      <Image
        src="/logo-mark.png"
        alt={title}
        width={size}
        height={size}
        className="logo-mark"
        priority
      />
    </span>
  );
}
