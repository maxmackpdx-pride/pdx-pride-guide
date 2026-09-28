/**
 * The four HAUSING card variants. One shell, four accents.
 */
import type { ReactNode } from "react";
import { ChangeBadge } from "@/components/ds/ChangeBadge";
import { isHousingDemoAuthor } from "@/lib/housingDemo";
import {
  AFFORDABILITY_BADGE_LABEL,
  FORMING_FLAVOR_LABEL,
  HOUSING_TYPE_KICKER,
  OUTDOOR_LABEL,
  PARKING_LABEL,
  type HousingPerson,
  type HousingPostView,
} from "@shared/housing";
import { HouseholdStack } from "@/components/ds";
import { HousingCardTags } from "./HousingTags";
import { HousingWell } from "./HousingWell";
import { HousingIcon } from "./HousingIcon";
import {
  Btn,
  Chip,
  Fact,
  Mono,
  PropertyManagerBadge,
  Trust,
  TypeTitle,
  accentStyle,
} from "./HousingPrimitives";

export type HousingCardHandlers = {
  activeTags?: string[];
  onOpen: (post: HousingPostView) => void;
  onSave: (post: HousingPostView) => void;
  onShare: (post: HousingPostView) => void;
  onChat: (post: HousingPostView) => void;
  onJoin: (post: HousingPostView) => void;
  onWaitlist: (post: HousingPostView) => void;
  onBuildHaus: (post: HousingPostView) => void;
  onPerson?: (person: HousingPerson) => void;
  savePendingIds?: Set<number>;
  requestPendingIds?: Set<number>;
};

export const FORMING_DEFAULT_COVER = "/hausing/forming-no-place.svg";

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

const SINGLE_WORD_CARD_LINE: Record<HousingPostView["type"], string> = {
  LOOKING: "LOOKING TO RENT",
  OFFERING: "JOIN OUR HAÜZ",
  FORMING: "BUILDING A HAÜZ",
  MANAGED: "COMMERCIAL RENTAL HAÜZ",
};

function cardDynamicTitle(post: HousingPostView, title: string): string {
  const clean = title.trim();
  return clean.split(/\s+/).length > 1 ? clean : `${clean}\n${SINGLE_WORD_CARD_LINE[post.type]}`;
}

function splitPeople(post: HousingPostView) {
  const people = post.household.filter((p) => p.kind !== "PET");
  const pets = post.household.filter((p) => p.kind === "PET");
  return { people, pets };
}

function CardShell({
  post,
  wide,
  onOpen,
  children,
}: {
  post: HousingPostView;
  wide?: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`pdx-glass-card pdx-glass-rebind hz-card${wide ? " hz-card--wide" : ""}`}
      role="button"
      tabIndex={0}
      style={accentStyle(post.type)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="pdx-refract-seam" aria-hidden="true" />
      {isHousingDemoAuthor(post.author) ? (
        <span className="hz-demo-sticker" aria-hidden="true">DEMO</span>
      ) : null}
      {post.saved && post.lastChangeLabel ? (
        <ChangeBadge label={post.lastChangeLabel} className="hz-change-label" />
      ) : null}
      {children}
    </div>
  );
}
