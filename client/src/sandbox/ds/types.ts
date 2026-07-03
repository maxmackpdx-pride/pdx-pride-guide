import type { CSSProperties, HTMLAttributes, MouseEventHandler, ReactNode } from "react";

export type PrideDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type PrideWeekendDay = "THU" | "FRI" | "SAT" | "SUN";

export type Admission = "FREE" | "TICKETED" | "SUGGESTED_DONATION";

export type AgeRequirement = "ALL_AGES" | "18_PLUS" | "21_PLUS";

export type PlaceCategory =
  | "bars"
  | "food"
  | "cafes"
  | "venues"
  | "services"
  | "shops"
  | "hotels";

export type NeonColor =
  | "lime"
  | "pink"
  | "cyan"
  | "green"
  | "orange"
  | "purple"
  | "amber"
  | "yellow"
  | "blue"
  | "red"
  | "neutral";

export type CssVarStyle = CSSProperties & Record<`--${string}`, string | number>;

export interface PlaceEvent {
  day?: PrideWeekendDay;
  date: string;
  title: string;
}

export interface MapPin {
  x: number;
  y: number;
  day?: PrideDay;
  multi?: boolean;
}

export interface MapLegendDay {
  label: string;
  c: string;
}

export type DivProps = HTMLAttributes<HTMLDivElement>;
export type SpanProps = HTMLAttributes<HTMLSpanElement>;
export type AnchorProps = HTMLAttributes<HTMLAnchorElement>;

export type ClickHandler = MouseEventHandler<HTMLButtonElement>;

export type StatValue = ReactNode;
export type StatLabel = ReactNode;