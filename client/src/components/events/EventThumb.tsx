import type { CSSProperties } from "react";
import { dayAccentToken } from "@/lib/dsColors";
import DayMotif, { motifDay } from "./DayMotif";

/** Small list thumbnail: the flyer, or the day motif when there is no flyer. */
export default function EventThumb({ src, day, className = "" }: { src: string | null | undefined; day: string | null | undefined; className?: string }) {
  if (src) return <img className={className || undefined} src={src} alt="" loading="lazy" decoding="async" />;
  return (
    <span className={`event-thumb pdx-glass-rebind ${className}`.trim()} style={{ "--c": dayAccentToken(motifDay(day)) } as CSSProperties} aria-hidden="true">
      <DayMotif day={day} placement="art" />
    </span>
  );
}
