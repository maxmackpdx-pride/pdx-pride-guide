import type { ImgHTMLAttributes } from "react";
import DayMotif, { motifDay } from "./DayMotif";

/**
 * The flyer slot of any event card: the real flyer when there is one, otherwise the
 * event's day motif with the weekday on it. Drop-in for `<img src={poster} />` inside
 * an art container that is position:relative (the container also needs --c set).
 */
export default function EventFlyerArt({
  src,
  day,
  showDay = true,
  alt = "",
  ...img
}: { src: string | null | undefined; day: string | null | undefined; showDay?: boolean } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  if (src) return <img src={src} alt={alt} loading="lazy" decoding="async" {...img} />;
  return (
    <>
      <DayMotif day={day} placement="art" />
      {showDay ? <i className="day-motif-code">{motifDay(day)}</i> : null}
    </>
  );
}
