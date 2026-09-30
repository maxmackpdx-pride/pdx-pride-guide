import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { ProfileEvent } from "./types";
import "./FlyerStash.css";

type StashRole =
  | "DJ"
  | "DRAG"
  | "MC"
  | "GOGO"
  | "PHOTO"
  | "BAR"
  | "SECURITY"
  | "VOLUNTEER"
  | "VENDOR"
  | "WENT";

type WorkMeta = {
  label: string;
  color: string;
  xp: number;
  ladder: string[] | null;
};

const WORK: Record<StashRole, WorkMeta> = {
  DJ: { label: "DJ SET", color: "#19e3ff", xp: 70, ladder: ["BEDROOM DJ", "OPENER", "RESIDENT DJ", "HEADLINE DJ", "PDX SOUND LEGEND"] },
  DRAG: { label: "DRAG", color: "#FF00CC", xp: 70, ladder: ["BABY QUEEN", "LOCAL LEGEND", "STAGE MOTHER", "HEADLINER", "PDX DRAG ROYALTY"] },
  MC: { label: "HOST / MC", color: "#CCFF00", xp: 60, ladder: ["OPEN MIC", "MC", "MAIN STAGE MC", "RINGLEADER", "PARTY PUP"] },
  GOGO: { label: "GO-GO", color: "#FF6600", xp: 55, ladder: ["FRESH FEET", "GO-GO", "BOX STAR", "HEADLINE DANCER", "PDX GO-GO LEGEND"] },
  PHOTO: { label: "PHOTOG", color: "#b06bff", xp: 45, ladder: ["SHUTTERBUG", "EVENT PHOTOG", "SCENE SHOOTER", "STAFF LENS", "PDX LENS LEGEND"] },
  BAR: { label: "BAR", color: "#FFB23D", xp: 40, ladder: ["BACK BAR", "BARTENDER", "HEAD POUR", "BAR BOSS", "PDX BAR LEGEND"] },
  SECURITY: { label: "SECURITY", color: "#39FF14", xp: 40, ladder: ["DOOR", "SECURITY", "HEAD OF DOOR", "SAFETY LEAD", "PDX SAFETY LEGEND"] },
  VOLUNTEER: { label: "VOLUNTEER", color: "#00FFFF", xp: 35, ladder: ["HELPER", "VOLUNTEER", "CREW", "TEAM LEAD", "PDX CREW LEGEND"] },
  VENDOR: { label: "VENDOR", color: "#FFEE00", xp: 35, ladder: ["POP-UP", "VENDOR", "MARKET REG", "VENDOR BOSS", "PDX MARKET LEGEND"] },
  WENT: { label: "WENT", color: "#00FFFF", xp: 15, ladder: null },
};

const SCENE_LADDER = ["FRESH FACE", "REGULAR", "SCENE STAPLE", "PARTY GREMLIN", "PDX SCENE ROYALTY"];
const XP_TIERS = [0, 150, 350, 600, 900];

export type FlyerStashEvent = ProfileEvent & {
  /** When known: worker role. Hosted past events map to MC. Default WENT. */
  stashRole?: StashRole | string | null;
};

type Props = {
  events: FlyerStashEvent[];
  onEventClick?: (event: ProfileEvent) => void;
  collectHref?: string;
};

type BuiltFlyer = {
  id: number;
  title: string;
  venue: string;
  date: string;
  when: string;
  rare: boolean;
  role: StashRole;
  roleLabel: string;
  roleColor: string;
  worked: boolean;
  pts: number;
  posterUrl: string | null;
  event: ProfileEvent;
};

function formatShortDate(iso?: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso.includes("T") || /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}T12:00:00-07:00`);
  if (!Number.isFinite(ms)) return String(iso).slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

function formatPastWhen(iso?: string | null): string {
  const parts = iso?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!parts) return "";
  const [, year, month, day, hour, minute] = parts;
  const date = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })
    .format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
  if (hour == null || minute == null) return date;
  const h = Number(hour);
  return `${date} · ${h % 12 || 12}:${minute}${h < 12 ? "am" : "pm"}`;
}

function normalizeRole(raw?: string | null): StashRole {
  const r = String(raw || "WENT").toUpperCase().replace(/[\s/-]+/g, "");
  if (r === "DJ" || r === "DJSET") return "DJ";
  if (r === "DRAG") return "DRAG";
  if (r === "MC" || r === "HOST" || r === "HOSTMC" || r === "PRIMARY" || r === "COHOST") return "MC";
  if (r === "GOGO" || r === "GOGODANCER") return "GOGO";
  if (r === "PHOTO" || r === "PHOTOG" || r === "PHOTOGRAPHER") return "PHOTO";
  if (r === "BAR" || r === "BARTENDER" || r === "BARTEND") return "BAR";
  if (r === "SECURITY" || r === "DOOR") return "SECURITY";
  if (r === "VOLUNTEER" || r === "CREW") return "VOLUNTEER";
  if (r === "VENDOR") return "VENDOR";
  if (r === "PERFORMER") return "DRAG";
  return "WENT";
}

function tierIndex(xp: number): number {
  let idx = 0;
  for (let i = 0; i < XP_TIERS.length; i++) {
    if (xp >= XP_TIERS[i]) idx = i;
  }
  return idx;
}

function titleFor(xp: number, ladder: string[]): { name: string; next: number | null; base: number } {
  const idx = tierIndex(xp);
  const name = ladder[Math.min(idx, ladder.length - 1)];
  const next = idx + 1 < XP_TIERS.length ? XP_TIERS[idx + 1] : null;
  return { name, next, base: XP_TIERS[idx] };
}

function buildFlyers(events: FlyerStashEvent[]): BuiltFlyer[] {
  return events.map((e) => {
    const role = normalizeRole(e.stashRole);
    const w = WORK[role];
    const rare = !!e.featured;
    const worked = role !== "WENT";
    const pts = w.xp + (rare ? 25 : 0);
    const posterUrl = resolveEventPosterUrl(e.id, e.posterImageUrl, e.dayOfWeek) || null;
    return {
      id: e.id,
      title: e.title || "Untitled",
      venue: e.venueName || "Portland",
      date: formatShortDate(e.dateStart),
      when: formatPastWhen(e.dateStart),
      rare,
      role,
      roleLabel: w.label,
      roleColor: w.color,
      worked,
      pts,
      posterUrl,
      event: e,
    };
  });
}

/**
 * The Stash: browsable flyer collection with collector progress.
 * Drop-in replacement for the bottom past-events flyer grid only.
 */
export default function FlyerStash({
  events,
  onEventClick,
  collectHref = "/events",
}: Props) {
  const base = useMemo(() => buildFlyers(events), [events]);
  const n = base.length;
  const stats = useMemo(() => {
    const count = n;
    const worked = base.filter((f) => f.worked);
    const attended = count - worked.length;
    const xp = base.reduce((s, f) => s + f.pts, 0);
    const rareCount = base.filter((f) => f.rare).length;
    const tally: Record<string, number> = {};
    const roleXp: Record<string, number> = {};
    worked.forEach((f) => {
      tally[f.role] = (tally[f.role] || 0) + 1;
      roleXp[f.role] = (roleXp[f.role] || 0) + f.pts;
    });
    let dom: string | null = null;
    Object.keys(tally).forEach((k) => {
      if (
        !dom
        || tally[k] > tally[dom]
        || (tally[k] === tally[dom] && roleXp[k] > roleXp[dom])
      ) {
        dom = k;
      }
    });
    const ladder = dom && WORK[dom as StashRole]?.ladder
      ? (WORK[dom as StashRole].ladder as string[])
      : SCENE_LADDER;
    const r = titleFor(xp, ladder);
    const progressPct = r.next
      ? Math.round(((xp - r.base) / (r.next - r.base)) * 100)
      : 100;
    const toNextLabel = r.next ? `${r.next - xp} XP to next title` : "Max title reached";
    const roleChips = Object.keys(tally)
      .sort((a, b) => tally[b] - tally[a])
      .map((k) => ({
        label: WORK[k as StashRole].label,
        color: WORK[k as StashRole].color,
        n: tally[k],
      }));
    const domLabel = dom ? WORK[dom as StashRole].label : "SPECTATOR";
    return {
      count,
      attended,
      xp,
      rareCount,
      roleChips,
      domLabel,
      rank: r.name,
      progressPct: `${Math.max(0, Math.min(100, progressPct))}%`,
      toNextLabel,
    };
  }, [base, n]);

  if (!n) return null;

  return (
    <section className="flyer-stash" aria-label="The Stash">
      <div className="flyer-stash__head">
        <div className="flyer-stash__kicker">
          <span className="flyer-stash__dot" aria-hidden />
          The Stash
        </div>
        <span className="flyer-stash__sub">Every flyer from a night out, kept.</span>
      </div>

      <div className="flyer-stash__grid">
        <aside className="flyer-stash__collector" aria-label="Collector stats">
          <div className="flyer-stash__collector-label">Collector</div>
          <div>
            <div className="flyer-stash__xp-row">
              <div className="flyer-stash__xp">{stats.xp}</div>
              <div className="flyer-stash__xp-unit">XP</div>
            </div>
            <div className="flyer-stash__meta">
              {stats.count} flyers · {stats.rareCount} rare
            </div>
          </div>
          <div>
            <span className="flyer-stash__rank">{stats.rank}</span>
          </div>
          <div className="flyer-stash__track">Title track: {stats.domLabel}</div>
          <div>
            <div className="flyer-stash__section-label">GIGZ worked</div>
            <div className="flyer-stash__chips">
              {stats.roleChips.map((rc) => (
                <span
                  key={rc.label}
                  className="flyer-stash__chip"
                  style={{ color: rc.color, borderColor: rc.color }}
                >
                  {rc.label}
                  <strong>{rc.n}</strong>
                </span>
              ))}
              <span className="flyer-stash__chip flyer-stash__chip--went">
                Went
                <strong>{stats.attended}</strong>
              </span>
            </div>
          </div>
          <div>
            <div className="flyer-stash__bar" aria-hidden>
              <div className="flyer-stash__bar-fill" style={{ width: stats.progressPct }} />
            </div>
            <div className="flyer-stash__to-next">{stats.toNextLabel}</div>
          </div>
          <Link href={collectHref} className="flyer-stash__cta">
            Collect more <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <p className="flyer-stash__blurb">
            Flyers from past events you hosted or attended, with your collector progress kept alongside them.
          </p>
        </aside>

        <Carousel className="flyer-stash__gallery" opts={{ align: "start", duration: 0 }} aria-label="Saved flyers">
          <div className="flyer-stash__gallery-head">
            <span>{stats.count} saved flyers</span>
            <div className="flyer-stash__controls">
              <CarouselPrevious className="!static !translate-y-0 h-11 w-11" />
              <CarouselNext className="!static !translate-y-0 h-11 w-11" />
            </div>
          </div>
          <CarouselContent>
            {base.map(f => (
              <CarouselItem key={f.id} className="flyer-stash__slide">
                <button type="button" className="flyer-stash__flyer" onClick={() => onEventClick?.(f.event)}
                  disabled={!onEventClick} aria-label={`Open ${f.title} at ${f.venue}`}>
                  <div className="flyer-stash__art">
                    {f.posterUrl ? <img src={f.posterUrl} alt="" loading="lazy" decoding="async" />
                      : <span className="flyer-stash__fallback">{f.title}</span>}
                  </div>
                  <div className="flyer-stash__caption">
                    <span className="flyer-stash__role" style={{ color: f.roleColor }}>{f.roleLabel}{f.rare ? " · RARE" : ""}</span>
                    <h3>{f.title}</h3>
                    <span>{f.venue}</span>
                    <time>{f.when || f.date}</time>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
