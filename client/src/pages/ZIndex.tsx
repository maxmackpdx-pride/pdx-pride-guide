import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import VenueFollowButton from "@/components/VenueFollowButton";
import {
  Z_ADDRESSES,
  zUrl,
  type ZAddress,
} from "@shared/zNamespace";
import {
  DIRECTORY_TYPE_COLORS as TYPE_COLORS,
  DIRECTORY_TYPE_LABELS as TYPE_LABELS,
} from "@shared/directoryTheme";
import {
  Z_CATEGORY_ADDRESSES,
  findZCategory,
  type ZCategoryAddress,
} from "@/lib/zCategoryAddresses";
import { HOUSING_TYPES, HOUSING_TYPE_KICKER } from "@shared/housing";
import { placePath, slugifyPlaceName } from "@shared/placeSlug";
import {
  EVENT_TYPE_FILTERS,
  EVENT_TYPE_TAG_COLORS,
  getEventTypeTagsForEvent,
} from "@shared/eventTypeTags";
import "./ZIndex.css";

/**
 * The z/ index. Every address and every real subcategory, typed out on one
 * screen in columns. No hero, no feed, no algorithm. This is the front door for
 * the namespace, not a replacement for the home feed.
 *
 * Every taxonomy below is imported from where it already lives, never restated
 * here, so this page cannot drift from the board it describes and cannot invent
 * a category. Counts come from the same endpoints the boards themselves use.
 */

/**
 * Board accents. Every value is a real token from client/src/index.css, and no
 * the set reads together as the rainbow while each top-level board stays within
 * one colour family. Nested addresses inherit their parent. Housing rebinds per
 * post type further down.
 */
const ACCENT: Record<string, string> = {
  // Boards that already declare an accent keep it, so /z can never disagree
  // with the board it links to.
  hauz: "var(--panel-cyan, #19e3ff)",       // HOUSING_BOARD_ACCENT, shared/housing.ts
  gifz: "var(--board-gifting, #ccff00)",    // --board-gifting, index.css
  gigz: "var(--board-gigs, #6e3dff)",       // --board-gigs, index.css
  sellz: "var(--neon-green, #39ff14)",
  mizzed: "var(--board-spotted, #ff00cc)",  // --board-spotted, index.css
  // The rest use Zaylist tokens; a nested address inherits its parent colour.
  happening: "var(--neon-orange, #ff6600)",
  placez: "var(--neon-blue, #3a6bff)",
  out: "var(--neon-orange, #ff6600)",
  "out/rooster-rock": "var(--neon-orange, #ff6600)",
  "out/sauvie-island": "var(--neon-green, #39ff14)",
  squadz: "#00c2ff",
  dark: "var(--neon-red, #ff2400)",
};

/**
 * Full bleed photography behind a card, for the two boards that are about a
 * place and a night rather than a list. Every other card stays on flat glass, so
 * these two read as the anchors instead of everything shouting at once.
 *
 * Photos are already in the repo and already used by the product. The card tints
 * them to its own accent and lays a scrim over the bottom two thirds, so the
 * type sits on near black no matter what the photograph is doing underneath.
 */
/**
 * Wordmarks from the logo family, `client/public/brand/family/`, matching the
 * Foundation Library manifest at `design-system/assets/logo-family/`.
 *
 * A board that has a wordmark shows it instead of its name set in type, which is
 * what a wordmark is for. Each file carries its own gradients, so it renders as
 * drawn and is never recoloured to the board accent. All five sit in one fixed
 * height slot at one height, so no mark is optically larger than another and
 * every card body starts on the same line. Boards with no mark fall back to the
 * name in Barlow Condensed inside that same slot, and every card carries an icon
 * either way, so the row reads the same whether or not a mark exists.
 *
 * Marked `next` in the manifest (Z/SPACE, OUTZ) still get their wordmark here:
 * the address is real and reserved even where the board is not built.
 */
const WORDMARK: Record<string, { src: string; alt: string }> = {
  gifz: { src: "/brand/family/giftz.svg", alt: "GIFTZ" },
  gigz: { src: "/brand/family/gigz.svg", alt: "GIGZ" },
  hauz: { src: "/brand/family/the-hauz.svg", alt: "THE HAÜZ" },
  squadz: { src: "/brand/family/my-squadz.svg", alt: "MY SQUADZ" },
  out: { src: "/brand/family/outz.svg", alt: "OUTZ" },
  dark: { src: "/brand/family/zaydark.svg", alt: "ZAYDARK" },
  // Glyphs traced out of the real masters rather than redrawn: the letter
  // library PNG for M I D L K R T S V H, Z/SPACE for P A C E, GIFTZ for Z. N is
  // built from the library H, keeping its exact tapered stems and swapping the
  // crossbar for a diagonal at the same stroke weight, because no mark in the
  // family contains an N.
  placez: { src: "/brand/family/our-placez.svg", alt: "OUR PLACEZ" },
  mizzed: { src: "/brand/family/mizzed-connection.svg", alt: "MIZZED CONNECTION" },
  sellz: { src: "/brand/family/sellz.svg", alt: "SELLZ" },
  happening: { src: "/brand/family/eventz.svg", alt: "EVENTZ" },
};

/**
 * Note on calm mode: html.calm-mode remaps every neon and panel token to grey,
 * so a var() reference desaturates with the rest of the site. The few literal
 * hexes below come from maps that are literal at their source too (TYPE_COLORS,
 * EVENT_TYPE_TAG_COLORS), and those already ship on their own boards, so this
 * page behaves exactly like the board it links to.
 */

/**
 * Subcategory accents. Every board already assigns its own colours, so these are
 * read from where that board defines them rather than restated here:
 *   directory  TYPE_COLORS in pages/Directory.tsx
 *   happening  EVENT_TYPE_TAG_COLORS in shared/eventTypeTags.ts
 *   hauz       HOUSING_ACCENT_VAR in shared/housing.ts
 *   gifz       the ACCENT map in pages/Gifting.tsx
 *   gigz       the post type accents in pages/PrideWork.tsx
 */

/** Gifting: lime for both offered and in search of, per pages/Gifting.tsx. */
const GIFTZ_SUB_ACCENT: Record<string, string> = {
  GIFT: "#ccff00",
  ISO: "#ccff00",
};

/** Gigs: cyan for talent, purple for gigs, per pages/PrideWork.tsx. */
const GIGZ_SUB_ACCENT: Record<string, string> = {
  LOOKING_FOR_WORK: "#19e3ff",
  POSTING_GIG: "#b06bff",
};

/** Housing rebinds per post type, from HOUSING_ACCENT_VAR in shared/housing.ts. */
const HOUSING_SUB_ACCENT: Record<string, string> = {
  LOOKING: "var(--panel-cyan, #19e3ff)",
  OFFERING: "var(--panel-orange, #ff8c00)",
  FORMING: "var(--green-acid, #39ff14)",
  MANAGED: "var(--panel-purple, #b06bff)",
};


/**
 * Endpoint each address counts from. Absent means there is no countable list
 * behind the address, so no number is shown rather than a misleading zero.
 * OUTZ destinations are deliberately absent: /api/nude-beaches returns live river
 * conditions, not a board of posts, so it has no total to report.
 */
const COUNT_ENDPOINT: Record<string, string> = {
  happening: "/api/events",
  hauz: "/api/housing",
  gifz: "/api/gifting",
  gigz: "/api/gigs",
  mizzed: "/api/missed-connections",
  placez: "/api/directory",
  squadz: "/api/directory",
};

type Row = Record<string, unknown>;

/** Board payloads are arrays or an object wrapping one. Read both, guess neither. */
function rowsOf(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload as Row[];
  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      if (Array.isArray(value)) return value as Row[];
    }
  }
  return [];
}

type Sub = ZCategoryAddress & {
  color?: string;
  count: number | null;
  href?: string;
  displayAddress?: string;
  businessId?: number;
  isFollowing?: boolean;
};

const VISIBLE_SUBS = 6;

const MANTRA: Record<string, string> = {
  gifz: "Keep it free · keep it kind · keep it moving",
  gigz: "Need work? Need help? Both belong here.",
  mizzed: "Stay kind · stay anonymous · reveal when ready",
  squadz: "Clubs and groups you can just show up to",
  dark: "Coming soon · the after-dark side of Zaylist",
  sellz: "The address is real. The board is not built yet.",
};

const COUNT_LABEL: Record<string, string> = {
  happening: "events",
  hauz: "posts",
  placez: "places",
  gifz: "posts",
  gigz: "posts",
  mizzed: "posts",
  squadz: "squadz",
  out: "live conditions",
  dark: "coming soon",
  sellz: "not built yet",
};

const POSTS_LABEL: Record<string, string> = {
  placez: "Recently added",
  out: "Right now",
  dark: "When it opens",
  sellz: "When it opens",
};

function ageLabel(value: unknown): string {
  const raw = String(value ?? "");
  if (!raw) return "";
  const then = new Date(raw).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Raw sort key for the cross-board feed. The rendered age string cannot sort. */
function timeOf(value: unknown): number {
  const then = new Date(String(value ?? "")).getTime();
  return Number.isFinite(then) ? then : 0;
}

function directoryRowsForBoard(path: string, rows: Row[]): Row[] {
  if (path === "squadz") return rows.filter(row => String(row.type ?? "") === "group");
  if (path === "placez") return rows.filter(row => String(row.type ?? "") !== "group");
  return rows;
}

function withFrom(href: string, from = "/z"): string {
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query || "");
  params.set("from", from);
  return `${path}?${params.toString()}`;
}

function newestPosts(
  path: string,
  rows: Row[],
  limit = 3,
): Array<{ title: string; meta: string; age: string; href: string; ts: number }> {
  const scoped = directoryRowsForBoard(path, rows);
  const sorted = [...scoped].sort((left, right) =>
    String(right.createdAt ?? right.updatedAt ?? right.startTime ?? "").localeCompare(
      String(left.createdAt ?? left.updatedAt ?? left.startTime ?? ""),
    ),
  );
  return sorted.slice(0, limit).flatMap(row => {
    const title = String(row.title ?? row.name ?? row.body ?? "").trim();
    if (!title) return [];
    const id = Number(row.id);
    const listing = Number.isFinite(id) && id > 0
      ? path === "squadz"
        ? `/z/squadz/${id}/${slugifyPlaceName(title)}`
        : path === "placez"
          ? placePath(id, title)
          : zUrl(path)
      : zUrl(path);
    const meta = [
      row.venueName,
      row.neighborhood,
      row.location,
      path === "placez" ? TYPE_LABELS[String(row.type ?? "")] : "",
      path === "gifz" && row.postType === "ISO" ? "In search of" : "",
      path === "gifz" && row.postType === "GIFT" ? "Offered" : "",
      path === "gigz" && row.postType === "POSTING_GIG" ? "Gig" : "",
      path === "gigz" && row.postType === "LOOKING_FOR_WORK" ? "Talent" : "",
    ].map(value => String(value ?? "").trim()).filter(Boolean).join(" · ");
    return [{
      title,
      meta,
      age: ageLabel(row.createdAt ?? row.updatedAt ?? row.startTime),
      href: withFrom(listing),
      ts: timeOf(row.createdAt ?? row.updatedAt ?? row.startTime),
    }];
  });
}

/** Put the Places/Directory hub at the center seam without changing canonical address order. */
const Z_INDEX_ADDRESSES = (() => {
  const addresses = Z_ADDRESSES.filter(address => address.path !== "placez");
  const placez = Z_ADDRESSES.find(address => address.path === "placez");
  if (placez) addresses.splice(2, 0, placez);
  return addresses;
})();

const TOP_LEVEL_Z_ADDRESSES = Z_ADDRESSES.filter(address => !address.path.includes("/"));

/** Count rows by a field, keeping the caller's order and keeping zeroes. */
function countBy(rows: Row[], field: string, keys: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of keys) out[key] = 0;
  for (const row of rows) {
    const value = String(row[field] ?? "");
    if (value in out) out[value] += 1;
  }
  return out;
}

function useBoardRows(path: string) {
  const endpoint = COUNT_ENDPOINT[path];
  return useQuery<unknown>({
    queryKey: [endpoint ?? `z-noop:${path}`],
    queryFn: () => apiRequest("GET", endpoint!).then(r => r.json()),
    enabled: !!endpoint,
    staleTime: 60_000,
  });
}

function addressSubs(
  boardPath: string,
  items: Array<{ key: string; label: string; color?: string; count: number }>,
): Sub[] {
  return items.flatMap(item => {
    const address = findZCategory(boardPath, item.key);
    return address ? [{ ...address, ...item }] : [];
  });
}

function SubcategoryRows({
  subs,
  countState,
}: {
  subs: Sub[];
  countState: "loading" | "error" | "ready";
}) {
  return (
    <ul className="z-index__subs">
      {subs.map(sub => (
        <li key={sub.key} className={sub.businessId != null ? "z-index__sub-item z-index__sub-item--listing" : "z-index__sub-item"}>
          <Link
            href={withFrom(sub.href ?? zUrl(sub.path))}
            className="z-index__sub"
            style={sub.color ? ({ ["--sub-c" as string]: sub.color }) : undefined}
          >
            {sub.color ? <span className="z-index__sub-swatch" aria-hidden="true" /> : null}
            <span className="z-index__sub-copy">
              <span className="z-index__sub-address">{sub.displayAddress ?? sub.path.split("/").at(-1)}</span>
              <span className="z-index__sub-label">{sub.label}</span>
            </span>
            <span
              className="z-index__sub-count"
              aria-label={countState === "loading" ? "Loading count" : countState === "error" ? "Count unavailable" : undefined}
            >
              {sub.count === null
                ? null
                : countState === "loading"
                  ? ""
                  : countState === "error"
                    ? "\u2014"
                    : sub.count === 0
                      ? <span className="z-index__sub-empty">none yet</span>
                      : sub.count}
            </span>
          </Link>
          {sub.businessId != null ? (
            <VenueFollowButton
              businessId={sub.businessId}
              initialFollowing={sub.isFollowing}
              variant="card"
              accent={sub.color}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function BoardColumn({ address, index }: { address: ZAddress; index: number }) {
  const { data, isPending, isError } = useBoardRows(address.path);
  const rows = useMemo(() => rowsOf(data), [data]);
  const accent = ACCENT[address.path] ?? "var(--neon-cyan, #19e3ff)";
  const wordmark = WORDMARK[address.path];
  const hasBoard = address.route !== null;
  const isDirectoryHub = address.path === "placez";
  const isSpacesBoard = address.path === "squadz";

  const subs = useMemo<Sub[]>(() => {
    if (!hasBoard) return [];
    if (address.path === "out") {
      return Z_ADDRESSES
        .filter(candidate => candidate.path.startsWith("out/"))
        .map(candidate => ({
          boardPath: "out",
          key: candidate.path.split("/").at(-1) ?? candidate.path,
          label: candidate.board,
          path: candidate.path,
          route: candidate.route ?? zUrl(candidate.path),
          color: ACCENT[candidate.path],
          count: null,
        }));
    }
    if (address.path === "squadz") {
      return rows
        .filter(row => String(row.type ?? "") === "group")
        .map(row => {
          const id = Number(row.id);
          const name = String(row.name ?? "Club or group");
          const neighborhood = String(row.neighborhood ?? "Portland");
          return {
            boardPath: "squadz",
            key: String(id),
            label: neighborhood,
            path: `squadz/${id}`,
            route: placePath(id, name),
            href: withFrom(`/z/squadz/${id}/${slugifyPlaceName(name)}`),
            displayAddress: name,
            color: ACCENT.squadz,
            count: null,
            businessId: id,
            isFollowing: Boolean(row.isFollowing),
          };
        });
    }
    if (address.path === "placez") {
      // Clubs & Groups owns the complete z/squadz board. Do not duplicate it
      // as a category inside the Places card even though Directory still uses
      // the underlying `group` type for compatibility.
      const availableKeys = Object.keys(TYPE_LABELS).filter(key => key !== "group");
      const counts = countBy(rows, "type", availableKeys);
      // Empty directory categories stay out of the public index. The taxonomy
      // remains defined for future records without advertising an empty lane.
      const keys = availableKeys.filter(key => counts[key] > 0);
      return addressSubs(address.path, keys.map(key => ({
        key,
        label: TYPE_LABELS[key],
        color: TYPE_COLORS[key],
        count: counts[key],
      })));
    }
    if (address.path === "hauz") {
      const counts = countBy(rows, "type", HOUSING_TYPES);
      return addressSubs(address.path, HOUSING_TYPES.map(key => ({
        key,
        label: HOUSING_TYPE_KICKER[key],
        color: HOUSING_SUB_ACCENT[key],
        count: counts[key],
      })));
    }
    if (address.path === "gifz") {
      const counts = countBy(rows, "postType", ["GIFT", "ISO"]);
      return addressSubs(address.path, [
        { key: "GIFT", label: "Offered", color: GIFTZ_SUB_ACCENT.GIFT, count: counts.GIFT },
        { key: "ISO", label: "In search of", color: GIFTZ_SUB_ACCENT.ISO, count: counts.ISO },
      ]);
    }
    if (address.path === "gigz") {
      const counts = countBy(rows, "postType", ["POSTING_GIG", "LOOKING_FOR_WORK"]);
      return addressSubs(address.path, [
        {
          key: "POSTING_GIG",
          label: "Gigs offered",
          color: GIGZ_SUB_ACCENT.POSTING_GIG,
          count: counts.POSTING_GIG,
        },
        {
          key: "LOOKING_FOR_WORK",
          label: "Talent available",
          color: GIGZ_SUB_ACCENT.LOOKING_FOR_WORK,
          count: counts.LOOKING_FOR_WORK,
        },
      ]);
    }
    if (address.path === "happening") {
      // Tags are derived from the listing's real fields, not stored on it, so
      // this has to go through the same function the Events page uses. An event
      // can carry several tags, so these deliberately do not sum to the total.
      type TagSource = Parameters<typeof getEventTypeTagsForEvent>[0];
      const tagged = rows.map(row => getEventTypeTagsForEvent(row as unknown as TagSource));
      return addressSubs(address.path, EVENT_TYPE_FILTERS.map(label => ({
        key: label,
        label,
        color: EVENT_TYPE_TAG_COLORS[label]?.color,
        count: tagged.filter(tags => tags.includes(label)).length,
      })));
    }
    // Mizzed and nudest have no taxonomy in the codebase. Show no children
    // rather than inventing them.
    return [];
  }, [address.path, hasBoard, rows]);

  const countable = !!COUNT_ENDPOINT[address.path];
  const boardCount = address.path === "squadz"
    ? rows.filter(row => String(row.type ?? "") === "group").length
    : rows.length;
  const countState = !countable ? "ready" : isPending ? "loading" : isError ? "error" : "ready";
  const firstSubs = isDirectoryHub ? subs : subs.slice(0, VISIBLE_SUBS);
  const remainingSubs = isDirectoryHub ? [] : subs.slice(VISIBLE_SUBS);

  const posts = useMemo(() => newestPosts(address.path, rows), [address.path, rows]);
  const mantra = MANTRA[address.path];

  return (
    <section
      className={`z-index__board pdx-glass-card pdx-glass-rebind${hasBoard ? "" : " z-index__board--pending"}`}
      style={{ ["--c" as string]: accent, ["--d" as string]: `${index * 40}ms` }}
      aria-labelledby={`z-board-${address.path.replace("/", "-")}`}
      data-address={address.path}
    >
      <span className="pdx-rainbow-rule" aria-hidden="true" />
      <Link href={zUrl(address.path)} className="z-index__board-head">
        <span className="z-index__addr" id={`z-board-${address.path.replace("/", "-")}`}>
          {address.display}
        </span>
        <span className="z-index__head-row">
          <span className="z-index__wordmark-slot">
            {wordmark ? (
              <img
                className="z-index__wordmark"
                src={wordmark.src}
                alt={wordmark.alt}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="z-index__board-name">{address.board}</span>
            )}
          </span>
          <span className={`z-index__count-block${hasBoard && countable ? "" : " z-index__count-block--muted"}`}>
            <b>
              {!hasBoard || !countable
                ? "—"
                : countState === "loading"
                  ? ""
                  : countState === "error"
                    ? "—"
                    : boardCount}
            </b>
            <small>{COUNT_LABEL[address.path] ?? "posts"}</small>
          </span>
        </span>
      </Link>

      {subs.length > 0 ? (
        <div className="z-index__categories">
          <SubcategoryRows subs={firstSubs} countState={countState} />
          {remainingSubs.length > 0 ? (
            <details className="z-index__more">
              <summary>
                {remainingSubs.length} more {isSpacesBoard ? "listings" : "categories"}
              </summary>
              <SubcategoryRows subs={remainingSubs} countState={countState} />
            </details>
          ) : null}
        </div>
      ) : null}

      {mantra ? <p className="z-index__mantra">{mantra}</p> : null}

      {posts.length > 0 ? (
        <div className="z-index__newest">
          <span className="z-index__newest-label">{POSTS_LABEL[address.path] ?? "Newest"}</span>
          {posts.map(post => (
            <Link key={post.title} href={post.href} className="z-index__post">
              <span className="z-index__post-title">{post.title}</span>
              <span className="z-index__post-age">{post.age}</span>
              {post.meta ? <span className="z-index__post-meta">{post.meta}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Coverflow rail.
 *
 * `selected` is the only source of truth; this component animates a floating
 * position toward it and reports drag-driven changes back up, so chips, dots,
 * search and autoplay all steer the same value and cannot disagree.
 *
 * The card DOM is untouched: each child is positioned by a wrapper, so
 * BoardColumn keeps its live counts, follow buttons and headings.
 */
const CF_ROTATE = 26;
const CF_DEPTH = 0.5;
const CF_FALLOFF = 0.6;
const CF_FADE = 0.24;
const CF_GAP = 0.1;
const CF_AUTOPLAY_MS = 2600;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ZCoverflow({
  total,
  selected,
  onSelect,
  children,
}: {
  total: number;
  selected: number;
  onSelect: (index: number) => void;
  children: React.ReactNode[];
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pos = useRef(0);
  const target = useRef(0);
  const width = useRef(0);
  const raf = useRef<number | null>(null);
  const drag = useRef<
    { id: number; x: number; startX: number; v: number; t: number; moved: boolean } | null
  >(null);
  const hovering = useRef(false);
  const justDragged = useRef(false);

  const paint = useCallback(() => {
    const cardWidth = width.current;
    if (!cardWidth || total === 0) return;
    const pitch = cardWidth * (1 + CF_GAP);
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      let offset = index - pos.current;
      offset = ((offset % total) + total) % total;
      if (offset > total / 2) offset -= total;
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, CF_FALLOFF);
      const tilt = Math.min(CF_ROTATE * ramp, 82) * Math.sign(offset);
      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px))`
        + ` translateZ(${-CF_DEPTH * cardWidth * ramp}px)`
        + ` rotateY(${-tilt}deg)`;
      const edge = Math.min(1, Math.max(0, total / 2 - distance));
      card.style.opacity = String(Math.max(0, 1 - CF_FADE * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
      card.setAttribute("aria-hidden", distance >= 1 ? "true" : "false");
      card.inert = distance >= 1;
    });
  }, [total]);

  const measure = useCallback(() => {
    const card = cardRefs.current[0];
    if (!card) return;
    width.current = card.offsetWidth;
    paint();
  }, [paint]);

  const settle = useCallback((to: number) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    target.current = to;
    if (prefersReducedMotion()) {
      pos.current = to;
      paint();
      raf.current = null;
      return;
    }
    const step = () => {
      const remaining = to - pos.current;
      if (Math.abs(remaining) < 0.0004) {
        pos.current = to;
        paint();
        raf.current = null;
        return;
      }
      pos.current += remaining * 0.16;
      paint();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [paint]);

  // Animate to whichever wrap of `selected` is nearest, so 9 -> 0 slides
  // forward across the seam instead of rewinding the whole rail.
  useEffect(() => {
    if (total === 0) return;
    const nearest = selected + Math.round((target.current - selected) / total) * total;
    settle(nearest);
  }, [selected, total, settle]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    measure();
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (total === 0 || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      if (!drag.current && !hovering.current) onSelect((selected + 1) % total);
    }, CF_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [selected, total, onSelect]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const indexAt = (value: number) => ((Math.round(value) % total) + total) % total;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    target.current = pos.current;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      startX: event.clientX,
      v: 0,
      t: performance.now(),
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const pitch = width.current * (1 + CF_GAP);
    if (!pitch) return;
    const now = performance.now();
    const previous = pos.current;
    if (Math.abs(event.clientX - current.startX) > 4) current.moved = true;
    pos.current = pos.current - (event.clientX - current.x) / pitch;
    current.x = event.clientX;
    current.v = ((pos.current - previous) / Math.max(now - current.t, 1)) * 1000;
    current.t = now;
    paint();
    const next = indexAt(pos.current);
    if (next !== selected) onSelect(next);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    justDragged.current = current.moved;
    const carried = Math.max(-2, Math.min(2, current.v * 0.18));
    onSelect(indexAt(pos.current + carried));
  };

  return (
    <div
      className="z-index__rail"
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
    >
      <div className="z-index__track">
        {children.map((child, index) => (
          <div
            key={index}
            className="z-index__slide"
            ref={node => { cardRefs.current[index] = node; }}
            onClickCapture={event => {
              // A drag that ends on a card must not also follow its link.
              if (justDragged.current) {
                justDragged.current = false;
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              if (index !== selected) {
                event.preventDefault();
                event.stopPropagation();
                onSelect(index);
              }
            }}
          >
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="z-index__nav z-index__nav--prev"
        aria-label="Previous board"
        onClick={() => onSelect((selected - 1 + total) % total)}
      >
        &#8249;
      </button>
      <button
        type="button"
        className="z-index__nav z-index__nav--next"
        aria-label="Next board"
        onClick={() => onSelect((selected + 1) % total)}
      >
        &#8250;
      </button>
    </div>
  );
}

/**
 * Everything, newest first.
 *
 * The mixed feed reads the same endpoints the cards do, so react-query serves
 * it from one cache and the feed can never show a post the board disagrees
 * with. Sorting is on the real timestamp, not the rendered age string.
 */
const FEED_PATHS = ["happening", "hauz", "placez", "gifz", "gigz", "mizzed", "squadz"] as const;
const FEED_PER_BOARD = 6;

function ZFeed({ boards }: { boards: ZAddress[] }) {
  const [board, setBoard] = useState<string>("all");

  const happening = useBoardRows("happening");
  const hauz = useBoardRows("hauz");
  const placez = useBoardRows("placez");
  const gifz = useBoardRows("gifz");
  const gigz = useBoardRows("gigz");
  const mizzed = useBoardRows("mizzed");
  const squadz = useBoardRows("squadz");

  const byPath: Record<string, unknown> = {
    happening: happening.data,
    hauz: hauz.data,
    placez: placez.data,
    gifz: gifz.data,
    gigz: gigz.data,
    mizzed: mizzed.data,
    squadz: squadz.data,
  };

  const pending = [happening, hauz, placez, gifz, gigz, mizzed, squadz].some(q => q.isPending);

  const rows = useMemo(
    () =>
      FEED_PATHS.flatMap(path =>
        newestPosts(path, rowsOf(byPath[path]), FEED_PER_BOARD).map(post => ({ ...post, path })),
      ).sort((left, right) => right.ts - left.ts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [happening.data, hauz.data, placez.data, gifz.data, gigz.data, mizzed.data, squadz.data],
  );

  const shown = board === "all" ? rows : rows.filter(row => row.path === board);
  const filters = [{ path: "all", label: "All" }].concat(
    boards
      .filter(address => (FEED_PATHS as readonly string[]).includes(address.path))
      .map(address => ({ path: address.path, label: address.display })),
  );

  return (
    <section className="z-index__feed" aria-labelledby="z-feed-heading">
      <div className="z-index__feed-head">
        <h2 id="z-feed-heading">Everything, newest first</h2>
        <div className="z-index__feed-filters">
          {filters.map(filter => (
            <button
              key={filter.path}
              type="button"
              className={filter.path === board ? "is-on" : undefined}
              style={
                filter.path === "all"
                  ? ({ ["--c" as string]: "var(--panel-lime, #c8fa3c)" })
                  : ({ ["--c" as string]: ACCENT[filter.path] ?? "var(--neon-cyan, #19e3ff)" })
              }
              aria-pressed={filter.path === board}
              onClick={() => setBoard(filter.path)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {pending ? (
        <p className="z-index__feed-empty">Loading the newest posts…</p>
      ) : shown.length === 0 ? (
        <p className="z-index__feed-empty">Nothing posted here yet.</p>
      ) : (
        <ul className="z-index__feed-list">
          {shown.map(row => (
            <li key={`${row.path}-${row.href}-${row.title}`}>
              <Link href={row.href} className="z-index__feed-row">
                <span
                  className="z-index__feed-tag"
                  style={{ ["--c" as string]: ACCENT[row.path] ?? "var(--neon-cyan, #19e3ff)" }}
                >
                  {`z/${row.path}`}
                </span>
                <span className="z-index__feed-copy">
                  <span className="z-index__feed-title">{row.title}</span>
                  {row.meta ? <span className="z-index__feed-meta">{row.meta}</span> : null}
                </span>
                <span className="z-index__feed-age">{row.age}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ZIndex() {
  usePageSeo(
    "z/ | Every Zaylist board, one page",
    "Portland, all at once. Every Zaylist board and every real category on one page: events, housing, gigs, free stuff, missed connections, and the community directory.",
  );

  const [, setLocation] = useLocation();
  const [addressQuery, setAddressQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const liveCount = TOP_LEVEL_Z_ADDRESSES.filter(address => address.route !== null).length;
  const heldCount = TOP_LEVEL_Z_ADDRESSES.length - liveCount;
  const topBoards = Z_INDEX_ADDRESSES.filter(address => !address.path.includes("/"));

  const searchEntries = useMemo(() => [
    ...Z_ADDRESSES.map(address => ({
      path: address.path,
      label: address.board,
      detail: address.route ? "Board" : "Not built yet",
    })),
    ...Z_CATEGORY_ADDRESSES.map(categoryAddress => ({
      path: categoryAddress.path,
      label: categoryAddress.label,
      detail: "Category",
    })),
  ], []);

  const normalizedQuery = addressQuery
    .trim()
    .toLowerCase()
    .replace(/^\/?z\//, "");
  const addressMatches = normalizedQuery
    ? searchEntries.filter(entry =>
        `${entry.path} ${entry.label}`.toLowerCase().includes(normalizedQuery),
      ).slice(0, 6)
    : [];

  // The rail always holds all ten boards. Filtering it as you type would
  // renumber the slides mid-keystroke, so the query steers the rail instead.
  const railMatch = normalizedQuery
    ? topBoards.findIndex(address =>
        `${address.display} ${address.board} ${address.path}`.toLowerCase().includes(normalizedQuery),
      )
    : -1;

  useEffect(() => {
    if (railMatch >= 0) setSelected(railMatch);
  }, [railMatch]);

  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A board match steers the rail; anything else (a category) is a real
    // destination, so it still navigates the way it always has.
    if (railMatch >= 0) {
      setSelected(railMatch);
      return;
    }
    if (addressMatches[0]) setLocation(zUrl(addressMatches[0].path));
  };

  return (
    <div className="z-index z-index--rail">
      <header className="z-index__top">
        <div className="z-index__brand">
          <img src="/brand/family/z-space.svg" alt="Z/SPACE" decoding="async" />
          <span>
            <i aria-hidden="true" />
            the index · every board · one page
          </span>
        </div>
      </header>

      <ZCoverflow
          total={topBoards.length}
          selected={selected}
          onSelect={setSelected}
        >
          {topBoards.map((address, index) => (
            <BoardColumn key={address.path} address={address} index={index} />
          ))}
        </ZCoverflow>

      <div className="z-index__rail-controls">
        <div className="z-index__dots" role="tablist" aria-label="Boards">
          {topBoards.map((address, index) => (
            <button
              key={address.path}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={address.display}
              className={index === selected ? "is-on" : undefined}
              style={{ ["--c" as string]: ACCENT[address.path] ?? "var(--neon-cyan, #19e3ff)" }}
              onClick={() => setSelected(index)}
            />
          ))}
        </div>

        <div className="z-index__finder">
          <form className="z-index__search" role="search" onSubmit={submitAddress}>
            <label htmlFor="z-address-input">Find a z/ address</label>
            <span aria-hidden="true">z/</span>
            <input
              type="search"
              name="z-address"
              id="z-address-input"
              value={addressQuery}
              onChange={event => setAddressQuery(event.target.value)}
              placeholder="events, free stuff, housing, gigs, place"
              autoComplete="off"
            />
            <button type="submit">Go</button>
          </form>
          <nav className="z-index__chips" aria-label="Board addresses">
            {topBoards.map((address, index) => (
              <a
                key={address.path}
                href={zUrl(address.path)}
                className={!address.route ? "is-pending" : undefined}
                onClick={event => {
                  event.preventDefault();
                  setSelected(index);
                }}
              >
                {address.display}
              </a>
            ))}
          </nav>
          <p className="z-index__stats">
            {liveCount} boards live · {heldCount} not built yet
          </p>
        </div>
      </div>

      <ZFeed boards={topBoards} />

      <div className="z-index__seam" aria-hidden="true" />
      <footer className="z-index__footer">
        <p>Type it · find it · show up</p>
        <p>zaylist.com/z</p>
      </footer>
    </div>
  );
}
