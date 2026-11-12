import type { CSSProperties } from "react";
import { Phone } from "lucide-react";
import BoardShareButton from "@/components/BoardShareButton";
import HeartButton from "@/components/HeartButton";
import { resourceMapHref } from "@/lib/resourceMap";
import { NeedzLogo } from "./NeedzLogo";
import { NeedzTorn } from "./NeedzTorn";
import { formatPhone, type NeedzRow } from "./needzDeckModel";

/** NEEDZ closed tall face for one deck card: 630 tall, at most 600 wide. Placez chrome (share circle top left,
 * white outlined View details with accent arrow, circular heart) on torn punk paper in one category accent. */
export function NeedzDeckCard({ row, position, total, onDetails }: { row: NeedzRow; position: number; total: number; onDetails: (row: NeedzRow) => void }) {
  const tags = (row.org.serviceTags || []).slice(0, 3);
  const start = row.org.howToStart || row.category.use;
  const href = resourceMapHref(row.org.name);
  return <article className="nd-card nd-torn pdx-glass-rebind" data-card-size="tall" data-card-category="needz" style={{ "--c": row.color } as CSSProperties} aria-roledescription="card" aria-label={`${position} of ${total}: ${row.org.name}`}>
    <NeedzTorn />
    <div className="nd-card__share"><BoardShareButton title={row.org.name} path={href} /></div>
    <span className="nd-card__count">{position} of {total}</span>
    <div className="nd-card__media">
      <NeedzLogo row={row} eager />
      {row.org.transSpecialist && <span className="nd-card__flag">Trans-focused</span>}
    </div>
    <div className="nd-card__copy">
      <span className="nd-card__category">{row.category.name}</span>
      <h2 className="nd-card__title">{row.caption}</h2>
      <p className="nd-card__subtitle">{row.org.sub ? `${row.org.sub} · ${row.org.scope}` : row.org.scope}</p>
      {tags.length > 0 && <div className="nd-card__tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
      {row.org.hours && <p className="nd-card__hours"><span>Hours</span> {row.org.hours}</p>}
      <p className="nd-card__desc">{row.org.desc}</p>
      <p className="nd-card__start"><span>How to start</span> {start}</p>
      <div className="nd-card__actions">
        {row.phone && <a className="nd-card__call" href={`tel:${row.phone}`}><Phone size={16} aria-hidden="true" /> Call {formatPhone(row.phone)}</a>}
        <div className="nd-card__row">
          <button type="button" className="nd-card__details" onClick={() => onDetails(row)}>View details <span aria-hidden="true">↗</span></button>
          <div className="nd-card__heart"><HeartButton kind="resource" refId={row.org.name} snapshot={{ title: row.org.name, subtitle: row.category.name, href }} /></div>
        </div>
      </div>
    </div>
  </article>;
}
