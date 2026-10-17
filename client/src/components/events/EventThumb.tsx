import type { CSSProperties } from "react";
import { dayAccentToken } from "@/lib/dsColors";
import DayMotif, { motifDay } from "./DayMotif";

/** Small list thumbnail: the same registered day network beneath flyer or motif. */
export default function EventThumb({ src, day, className = "" }: { src: string | null | undefined; day: string | null | undefined; className?: string }) {
  return (
    <span className={`event-thumb pdx-glass-rebind ${className}`.trim()} style={{ "--c": dayAccentToken(motifDay(day)) } as CSSProperties} aria-hidden="true">
      <DayMotif glass={!src} day={day} placement="art" networkOnly={!!src} />
      {src && <img src={src} alt="" loading="lazy" decoding="async" />}
    </span>
  );
}
