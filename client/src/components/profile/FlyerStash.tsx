import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
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

const DAY_COLOR: Record<string, string> = {
  MON: "#8800FF",
  TUE: "#0044FF",
  WED: "#FFEE00",
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

const TAG: Record<string, { bg: string; fg: string }> = {
  FREE: { bg: "rgba(204,255,0,0.14)", fg: "#CCFF00" },
  TICKETED: { bg: "rgba(0,255,255,0.14)", fg: "#19e3ff" },
  DONATION: { bg: "rgba(255,178,61,0.16)", fg: "#FFB23D" },
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
const CYCLE_MS = 2600;

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
  day: string;
  date: string;
  admission: string;
  rare: boolean;
  role: StashRole;
  color: string;
  tagBg: string;
  tagFg: string;
  roleLabel: string;
  roleColor: string;
  roleBg: string;
  roleFg: string;
  worked: boolean;
  pts: number;
  posterUrl: string | null;
  event: ProfileEvent;
};

function normalizeDay(raw?: string | null): string {
  const d = String(raw || "").trim().toUpperCase().slice(0, 3);
  return DAY_COLOR[d] ? d : "";
}

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

function normalizeAdmission(raw?: string | null): string {
  const a = String(raw || "").toUpperCase();
  if (!a) return "TICKETED";
  if (a.includes("TICKET") || a.includes("PAID") || a === "COVER" || a.includes("DOOR") || a === "DOOR_FEE") return "TICKETED";
  if (a.includes("DONAT")) return "DONATION";
  if (a.includes("FREE") || a.includes("NO COVER") || a === "NC") return "FREE";
  return TAG[a] ? a : "TICKETED";
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (document.documentElement.classList.contains("calm-mode")) return true;
  } catch {
    /* ignore */
  }
  return false;
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
    const day = normalizeDay(e.dayOfWeek);
    const admission = normalizeAdmission(e.admission);
    const role = normalizeRole(e.stashRole);
    const w = WORK[role];
    const rare = !!e.featured;
    const worked = role !== "WENT";
    const pts = w.xp + (rare ? 25 : 0);
    const tag = TAG[admission] || TAG.FREE;
    const posterUrl = resolveEventPosterUrl(e.id, e.posterImageUrl, e.dayOfWeek) || null;
    return {
      id: e.id,
      title: e.title || "Untitled",
      venue: e.venueName || "Portland",
      day: day || "NITE",
      date: formatShortDate(e.dateStart),
      admission: admission === "DONATION" ? "DONATE" : admission,
      rare,
      role,
      color: DAY_COLOR[day] || "#ffffff",
      tagBg: tag.bg,
      tagFg: tag.fg,
      roleLabel: w.label,
      roleColor: w.color,
      roleBg: worked ? w.color : "transparent",
      roleFg: worked ? "#0a0a0a" : w.color,
      worked,
      pts,
      posterUrl,
      event: e,
    };
  });
}

/**
 * The Stash: fanned auto-cycling flyer deck + collector XP panel.
 * Drop-in replacement for the bottom past-events flyer grid only.
 */
export default function FlyerStash({
  events,
  onEventClick,
  collectHref = "/events",
}: Props) {
  const base = useMemo(() => buildFlyers(events), [events]);
  const n = base.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    setActive(0);
  }, [n]);

  useEffect(() => {
    if (paused || n <= 1 || reduced) return;
    const id = window.setInterval(() => {
      setActive((a) => a + 1);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, n, reduced]);

  const act = n > 0 ? ((active % n) + n) % n : 0;

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
      frontTitle: base[act]?.title || "",
      posLabel: n ? `${act + 1} / ${n}` : "0 / 0",
    };
  }, [base, n, act]);

  const spread = paused ? 15 : 10;
  const gap = paused ? 88 : 56;

  const laidOut = useMemo(() => {
    return base.map((f, i) => {
      let rel = i - act;
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;
      const abs = Math.abs(rel);
      const rot = rel * spread;
      const x = rel * gap;
      const y = abs * abs * 9;
      const scale = rel === 0 ? 1.14 : Math.max(0.6, 1 - Math.min(abs, 5) * 0.055);
      const z = 200 - Math.round(abs * 10);
      const opacity = abs > 5 ? 0 : 1;
      const front = rel === 0;
      const glow = front
        ? `0 18px 44px rgba(0,0,0,0.7), 0 0 26px ${f.rare ? f.color : "rgba(255,0,204,0.35)"}`
        : f.rare
          ? `0 10px 26px rgba(0,0,0,0.6), 0 0 16px ${f.color}`
          : "0 10px 26px rgba(0,0,0,0.55)";
      const transform = `translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`;
      return { ...f, transform, z, opacity, front, glow, index: i };
    });
  }, [base, act, n, spread, gap]);

  const pick = useCallback((i: number) => {
    setActive(i);
  }, []);

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
            <div className="flyer-stash__section-label">Gigs worked</div>
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
            Collect more →
          </Link>
          <p className="flyer-stash__blurb">
            Every gig you work drops its flyer here and earns XP. The role you log most sets which title you climb, so DJ nights build a DJ name. Rare headliners shimmer and pay bonus XP.
          </p>
        </aside>

        <div
          className="flyer-stash__stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flyer-stash__stage-dots" aria-hidden />
          <div className="flyer-stash__front-label">Front · {stats.frontTitle}</div>

          <div className="flyer-stash__fan-anchor">
            {laidOut.map((f) => (
              <button
                key={f.id}
                type="button"
                className="flyer-stash__card"
                style={{
                  transform: f.transform,
                  zIndex: f.z,
                  opacity: f.opacity,
                  borderColor: f.color,
                  boxShadow: f.glow,
                  pointerEvents: f.opacity === 0 ? "none" : "auto",
                }}
                onClick={() => {
                  pick(f.index);
                  onEventClick?.(f.event);
                }}
                aria-label={`${f.title} at ${f.venue}`}
              >
                <div className="flyer-stash__card-daybar" style={{ background: f.color }} />
                {f.posterUrl ? (
                  <img className="flyer-stash__card-poster" src={f.posterUrl} alt="" decoding="async" />
                ) : null}
                {f.rare ? (
                  <>
                    <div className="flyer-stash__card-holo" aria-hidden />
                    <div className="flyer-stash__card-rare">RARE</div>
                  </>
                ) : null}
                <div className="flyer-stash__card-body">
                  <div className="flyer-stash__card-top">
                    <div className="flyer-stash__card-day" style={{ color: f.color }}>
                      {f.day}
                      {f.date ? ` · ${f.date}` : ""}
                    </div>
                    <span
                      className="flyer-stash__card-role"
                      style={{
                        background: f.roleBg,
                        color: f.roleFg,
                        borderColor: f.roleColor,
                      }}
                    >
                      {f.roleLabel}
                    </span>
                  </div>
                  <div className="flyer-stash__card-title">{f.title}</div>
                  <div className="flyer-stash__card-foot">
                    <div className="flyer-stash__card-venue">{f.venue}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flyer-stash__controls">
            <button
              type="button"
              className="flyer-stash__nav"
              aria-label="Previous flyer"
              onClick={() => setActive((a) => a - 1)}
            >
              ‹
            </button>
            <div className="flyer-stash__pos">{stats.posLabel}</div>
            <button
              type="button"
              className="flyer-stash__nav"
              aria-label="Next flyer"
              onClick={() => setActive((a) => a + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
