import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { GoingEventCard } from "./ProfileEventRail";
import ProfilePlacePreview from "./ProfilePlacePreview";
import UpdatesPanel, { type UpdatesAuthor } from "./UpdatesPanel";
import type { Business } from "@/pages/Directory";
import type { ProfileAdventure } from "@/pages/profile/types";
import type { ProfileBoardPost } from "./types";
import TodayLocationCard from "@/components/home/TodayLocationCard";
import outzMapCatalog from "@shared/outzMapCatalog";
import { formatRiverBratsWindow } from "@shared/riverBrats";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { ProfileEvent } from "./types";
import "./FlyerStash.css";

import { buildStashCollection, normalizeStashRole as normalizeRole, STASH_WORK_XP, type StashRole, type BoardMemory } from "./stashCollection";

type WorkMeta = {
  label: string;
  color: string;
  xp: number;
  ladder: string[] | null;
};

const WORK: Record<StashRole, WorkMeta> = {
  DJ: { label: "DJ SET", color: "#19e3ff", xp: STASH_WORK_XP.DJ, ladder: ["BEDROOM DJ", "OPENER", "RESIDENT DJ", "HEADLINE DJ", "PDX SOUND LEGEND"] },
  DRAG: { label: "DRAG", color: "#FF00CC", xp: STASH_WORK_XP.DRAG, ladder: ["BABY QUEEN", "LOCAL LEGEND", "STAGE MOTHER", "HEADLINER", "PDX DRAG ROYALTY"] },
  MC: { label: "HOST / MC", color: "#CCFF00", xp: STASH_WORK_XP.MC, ladder: ["OPEN MIC", "MC", "MAIN STAGE MC", "RINGLEADER", "PARTY PUP"] },
  GOGO: { label: "GO-GO", color: "#FF6600", xp: STASH_WORK_XP.GOGO, ladder: ["FRESH FEET", "GO-GO", "BOX STAR", "HEADLINE DANCER", "PDX GO-GO LEGEND"] },
  PHOTO: { label: "PHOTOG", color: "#b06bff", xp: STASH_WORK_XP.PHOTO, ladder: ["SHUTTERBUG", "EVENT PHOTOG", "SCENE SHOOTER", "STAFF LENS", "PDX LENS LEGEND"] },
  BAR: { label: "BAR", color: "#FFB23D", xp: STASH_WORK_XP.BAR, ladder: ["BACK BAR", "BARTENDER", "HEAD POUR", "BAR BOSS", "PDX BAR LEGEND"] },
  SECURITY: { label: "SECURITY", color: "#39FF14", xp: STASH_WORK_XP.SECURITY, ladder: ["DOOR", "SECURITY", "HEAD OF DOOR", "SAFETY LEAD", "PDX SAFETY LEGEND"] },
  VOLUNTEER: { label: "VOLUNTEER", color: "#00FFFF", xp: STASH_WORK_XP.VOLUNTEER, ladder: ["HELPER", "VOLUNTEER", "CREW", "TEAM LEAD", "PDX CREW LEGEND"] },
  VENDOR: { label: "VENDOR", color: "#FFEE00", xp: STASH_WORK_XP.VENDOR, ladder: ["POP-UP", "VENDOR", "MARKET REG", "VENDOR BOSS", "PDX MARKET LEGEND"] },
  WENT: { label: "WENT", color: "#00FFFF", xp: STASH_WORK_XP.WENT, ladder: null },
};

const SCENE_LADDER = ["FRESH FACE", "REGULAR", "SCENE STAPLE", "PARTY GREMLIN", "PDX SCENE ROYALTY"];
const XP_TIERS = [0, 150, 350, 600, 900];

export type FlyerStashEvent = ProfileEvent & {
  /** When known: worker role. Hosted past events map to MC. Default WENT. */
  stashRole?: StashRole | string | null;
};

export type StashPlace = Pick<Business,"id"|"name"> & Partial<Business>;
export type Props = {
  events: FlyerStashEvent[];
  onEventClick?: (event: ProfileEvent) => void;
  collectHref?: string;
  completedAdventures?: ProfileAdventure[];
  favoritePlaces?: StashPlace[];
  boardPosts?: ProfileBoardPost[];
  boardMemories?: BoardMemory[];
  author?: UpdatesAuthor;
  onPlaceOpen?: (place: StashPlace, element: HTMLElement) => void;
  onBoardOpen?: (post: ProfileBoardPost) => void;
  onRequireAuth?: () => void;
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

function formatShortDate(iso?: string | null, includeYear = false): string {
  if (!iso) return "";
  const ms = Date.parse(iso.includes("T") || /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}T12:00:00-07:00`);
  if (!Number.isFinite(ms)) return String(iso).slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    ...(includeYear ? {year: "numeric" as const} : {}),
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
  completedAdventures = [], favoritePlaces = [], boardPosts = [], boardMemories = [],
  onPlaceOpen, onBoardOpen, onRequireAuth, author,
}: Props) {
  const collection = useMemo(() => buildStashCollection({events,adventures:completedAdventures,places:favoritePlaces,posts:boardPosts,memories:boardMemories,canRenderPosts:!!author}),[events,completedAdventures,favoritePlaces,boardPosts,boardMemories,author]);
  const base = useMemo(() => buildFlyers(collection.events),[collection.events]);
  const {adventures,places,posts,memories,counts,collectionXp} = collection;
  const [category,setCategory] = useState<'all'|'flyers'|'outz'|'places'|'boards'>('all');
  const n = base.length;

  const stats = useMemo(() => {
    const count = n;
    const worked = base.filter((f) => f.worked);
    const attended = count - worked.length;
    const xp = base.reduce((s, f) => s + f.pts, 0) + collectionXp;
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
  }, [base, n, collectionXp]);

  if (!counts.all) return null;

  return (
    <section className="flyer-stash" aria-label="The Stash">
      <div className="flyer-stash__head">
        <div className="flyer-stash__kicker">
          <span className="flyer-stash__dot" aria-hidden />
          The Stash
        </div>
        <span className="flyer-stash__sub">Your nights, places and community, collected.</span>
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
              {counts.all} collected · {stats.count} flyers · {stats.rareCount} rare
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

        <div className="flyer-stash__gallery" aria-label="Your collected cards">
          <div className="flyer-stash__album-tabs" role="group" aria-label="Collection category">
            {([['all','All'],['flyers','Flyers'],['outz','Outz'],['places','Placez'],['boards','BoardZ']] as const).map(([key,label]) => <button key={key} type="button" aria-pressed={category===key} onClick={()=>setCategory(key)}>{label}<span>{counts[key]}</span></button>)}
          </div>
          <div className="flyer-stash__album" role="list" aria-label={`${category} collection`}>
            {(category==='all' || category==='flyers') && base.map(flyer=><div className="flyer-stash__album-item" role="listitem" key={`event:${flyer.id}`}><GoingEventCard event={flyer.event} past onClick={onEventClick}/><p className="flyer-stash__album-caption">{flyer.roleLabel} · {flyer.pts} XP{flyer.rare?' · Rare':''}</p></div>)}
            {(category==='all' || category==='outz') && adventures.map(trip=>{
              const destination=outzMapCatalog.find(place=>place.id===trip.placeId);
              return <div className="flyer-stash__album-item" role="listitem" key={`outz:${trip.placeId}:${trip.calendarDate}`}><TodayLocationCard location={{key:trip.placeId,name:destination?.name || trip.placeId,room:'OutZide',kind:destination?.kind,detail:`${formatShortDate(trip.calendarDate)} · ${formatRiverBratsWindow(trip.arrivalHour,trip.departHour)}`,href:`/outzide?place=${encodeURIComponent(trip.placeId)}`}}/><p className="flyer-stash__album-caption">Past Outz check-in · 25 XP · Only you see this</p></div>;
            })}
            {(category==='all' || category==='places') && places.map(place=><div className="flyer-stash__album-item" role="listitem" key={`place:${place.id}`}><ProfilePlacePreview place={place} onOpen={element=>onPlaceOpen?.(place,element)} onRequireAuth={onRequireAuth}/><p className="flyer-stash__album-caption">Favorite place · 10 XP</p></div>)}
            {(category==='all' || category==='boards') && posts.map(post=><div className="flyer-stash__album-item flyer-stash__album-item--board" role="listitem" key={`board:${post.contentType}:${post.id}`}><UpdatesPanel posts={[post]} author={author!} hideHeader onPostClick={onBoardOpen}/><p className="flyer-stash__album-caption">Community post · 10 XP</p></div>)}
            {(category==='all' || category==='boards') && memories.map(memory=><div className="flyer-stash__album-item flyer-stash__board-memory" role="listitem" key={`board:${memory.board}:${memory.postId}`}><h3>{memory.title}</h3><p>{{housing:'My Hoüz',gigz:'Gigz',giftz:'Giftz',sellz:'Sellz',mizzed:'Mizzed'}[memory.board]} · Archived {formatShortDate(memory.archivedAt, true)}</p><p className="flyer-stash__album-caption">Community post · 10 XP · Only you see this</p></div>)}
          </div>
          {!counts[category] && <p className="flyer-stash__album-empty">Nothing collected here yet.</p>}
          <details className="flyer-stash__album-scoring"><summary>How collection XP works</summary><p>Flyers keep their existing attendance/work XP and rare bonus. Each unique past Outz check-in destination and date adds 25 XP; a favorite place adds 10 XP; a community post adds 10 XP. Repeated records count once.</p></details>
        </div>
      </div>
    </section>
  );
}
