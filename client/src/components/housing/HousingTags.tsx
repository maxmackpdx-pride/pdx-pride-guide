/**
 * Tag chips for HAUSING posts.
 *
 * The hierarchy in shared/housingTags.ts decides what shows and in what order.
 * This file only decides how it looks. Four registers, all from the approved
 * design system:
 *
 *   urgent      magenta, strong glow. The one immediate tag also pulses.
 *   adult       purple, soft static glow. Never pulses, never sorts ahead.
 *   verified    cyan hairline. Issued by the platform, not typed by a poster.
 *   restriction orange hairline. A hard no, or a condition on the lease.
 *
 * Everything else is the plain utility chip, unless it matched a filter the
 * viewer has on, in which case it borrows the card's own accent so the reason
 * the post came back is visible.
 */
import type { HousingTag } from "@shared/housingTags";
import { splitHousingCardTags, orderHousingTags } from "@shared/housingTags";
import { HousingIcon } from "./HousingIcon";
import { useState } from "react";

function toneClass(tag: HousingTag, matched: boolean): string {
  if (tag.pulse) return "hz-tag--urgent hz-tag--now";
  if (tag.tone) return `hz-tag--${tag.tone}`;
  return matched ? "hz-tag--match" : "";
}

/** Only the registers that carry a glyph. The rest read as plain text. */
function TagIcon({ tag }: { tag: HousingTag }) {
  if (tag.priority === 1) return <HousingIcon name="alerts" size={12} />;
  if (tag.tone === "verified") return <HousingIcon name="verified" size={12} />;
  if (tag.tone === "restriction") return <HousingIcon name="safety" size={12} />;
  return null;
}

export function HousingTagChip({
  tag,
  matched,
  onClick,
}: {
  tag: HousingTag;
  matched?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const cls = `hz-tag ${toneClass(tag, !!matched)}`.trim();
  const body = (
    <>
      <TagIcon tag={tag} />
      {tag.label}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={`${cls} hz-tag--btn`} onClick={onClick} title={tag.helper}>
        {body}
      </button>
    );
  }
  return (
    <span className={cls} title={tag.helper}>
      {body}
    </span>
  );
}

/**
 * The row on a listing card. Urgent and pinned tags never fold away, however
 * many of them there are. Everything past the budget collapses into a count
 * that opens the post, because a card is already one big click target and
 * nesting an expander inside it just fights the card.
 */
export function HousingCardTags({
  tags,
  active = [],
  onMore,
}: {
  tags: string[];
  active?: string[];
  onMore?: (e: React.MouseEvent) => void;
}) {
  if (!tags.length) return null;
  const { shown, hidden } = splitHousingCardTags(tags, active);
  if (!shown.length) return null;
  const activeSet = new Set(active);

  return (
    <div className="hz-tagrow">
      {shown.map((tag) => (
        <HousingTagChip key={tag.id} tag={tag} matched={activeSet.has(tag.id)} />
      ))}
      {hidden.length ? (
        <button type="button" className="hz-tag hz-tag--more" onClick={onMore}>
          {`+${hidden.length} more`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * The full set on a detail page. Everything is here, so the fold is only about
 * not opening with a wall of chips. Urgent and pinned tags stay above it.
 */
export function HousingDetailTags({
  tags,
  active = [],
  initial = 12,
}: {
  tags: string[];
  active?: string[];
  initial?: number;
}) {
  const [open, setOpen] = useState(false);
  if (!tags.length) return null;
  const ordered = orderHousingTags(tags, active);
  const activeSet = new Set(active);
  const alwaysOn = ordered.filter((t) => t.priority === 1 || t.pinned);
  const rest = ordered.filter((t) => !(t.priority === 1 || t.pinned));
  const visible = open ? rest : rest.slice(0, Math.max(initial - alwaysOn.length, 0));
  const remaining = rest.length - visible.length;

  return (
    <div className="hz-tagrow hz-tagrow--detail">
      {[...alwaysOn, ...visible].map((tag) => (
        <HousingTagChip key={tag.id} tag={tag} matched={activeSet.has(tag.id)} />
      ))}
      {remaining > 0 && !open ? (
        <button type="button" className="hz-tag hz-tag--more" onClick={() => setOpen(true)}>
          {`View ${remaining} more`}
        </button>
      ) : null}
      {open && rest.length > initial ? (
        <button type="button" className="hz-tag hz-tag--more" onClick={() => setOpen(false)}>
          Show less
        </button>
      ) : null}
    </div>
  );
}
