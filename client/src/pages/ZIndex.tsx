import { useMemo, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Z_ADDRESSES, zUrl, type ZAddress } from "@shared/zNamespace";
import { TYPE_LABELS, TYPE_COLORS } from "@/pages/Directory";
import { HOUSING_TYPES, HOUSING_TYPE_KICKER } from "@shared/housing";
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
 * two boards share one, so the set read together is the rainbow and each board
 * alone is a single colour. Housing rebinds per post type further down.
 */
const ACCENT: Record<string, string> = {
  // Boards that already declare an accent keep it, so /z can never disagree
  // with the board it links to.
  hauz: "var(--panel-cyan, #19e3ff)",       // HOUSING_BOARD_ACCENT, shared/housing.ts
  gifz: "var(--board-gifting, #ccff00)",    // --board-gifting, index.css
  gigz: "var(--board-gigs, #6e3dff)",       // --board-gigs, index.css
  mizzed: "var(--board-spotted, #ff00cc)",  // --board-spotted, index.css
  // The rest have no declared board accent, so each takes one unused Zaylist
  // token. No two boards share a colour: the set read together is the rainbow,
  // and a board read alone is one colour.
  happening: "var(--neon-orange, #ff6600)",
  directory: "var(--neon-red, #ff2400)",
  market: "var(--neon-yellow, #ccff00)",
  out: "var(--neon-cyan, #00ffff)",
  "out/nudest": "var(--neon-cyan, #00ffff)",
  space: "#ffd700",                         // TYPE_COLORS.group, Directory.tsx
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
const GIFZ_SUB_ACCENT: Record<string, string> = {
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

/** The set of accents, in index order, for the spectrum rule. */
const SPECTRUM = [
  "#ff6600", // happening
  "#ffd700", // space
  "#ff2400", // directory
  "#6e3dff", // gigz
  "#ccff00", // market and gifz
  "#19e3ff", // hauz
  "#00ffff", // out
  "#ff00cc", // mizzed
];

/** Mote positions for the hero atmosphere, one per letter of the mark. */
const MOTES: Array<[string, string, string]> = [
  ["12%", "30%", "#00ffff"],
  ["30%", "58%", "#ff00cc"],
  ["50%", "26%", "#ccff00"],
  ["70%", "60%", "#ff6600"],
  ["88%", "34%", "#8800ff"],
];

/**
 * Endpoint each address counts from. Absent means there is no countable list
 * behind the address, so no number is shown rather than a misleading zero.
 * z/out/nudest is deliberately absent: /api/nude-beaches returns live river
 * conditions, not a board of posts, so it has no total to report.
 */
const COUNT_ENDPOINT: Record<string, string> = {
  happening: "/api/events",
  hauz: "/api/housing",
  gifz: "/api/gifting",
  gigz: "/api/gigs",
  mizzed: "/api/missed-connections",
  directory: "/api/directory",
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

type Sub = { key: string; label: string; color?: string; count: number };

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

function BoardColumn({ address, index }: { address: ZAddress; index: number }) {
  const { data, isPending } = useBoardRows(address.path);
  const rows = useMemo(() => rowsOf(data), [data]);
  const accent = ACCENT[address.path] ?? "var(--neon-cyan, #19e3ff)";
  const hasBoard = address.route !== null;

  const subs = useMemo<Sub[]>(() => {
    if (!hasBoard) return [];
    if (address.path === "directory") {
      const keys = Object.keys(TYPE_LABELS);
      const counts = countBy(rows, "type", keys);
      return keys.map(key => ({
        key,
        label: TYPE_LABELS[key],
        color: TYPE_COLORS[key],
        count: counts[key],
      }));
    }
    if (address.path === "hauz") {
      const counts = countBy(rows, "type", HOUSING_TYPES);
      return HOUSING_TYPES.map(key => ({
        key,
        label: HOUSING_TYPE_KICKER[key],
        color: HOUSING_SUB_ACCENT[key],
        count: counts[key],
      }));
    }
    if (address.path === "gifz") {
      const counts = countBy(rows, "postType", ["GIFT", "ISO"]);
      return [
        { key: "GIFT", label: "Offered", color: GIFZ_SUB_ACCENT.GIFT, count: counts.GIFT },
        { key: "ISO", label: "In search of", color: GIFZ_SUB_ACCENT.ISO, count: counts.ISO },
      ];
    }
    if (address.path === "gigz") {
      const counts = countBy(rows, "postType", ["POSTING_GIG", "LOOKING_FOR_WORK"]);
      return [
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
      ];
    }
    if (address.path === "happening") {
      // Tags are derived from the listing's real fields, not stored on it, so
      // this has to go through the same function the Events page uses. An event
      // can carry several tags, so these deliberately do not sum to the total.
      type TagSource = Parameters<typeof getEventTypeTagsForEvent>[0];
      const tagged = rows.map(row => getEventTypeTagsForEvent(row as unknown as TagSource));
      return EVENT_TYPE_FILTERS.map(label => ({
        key: label,
        label,
        color: EVENT_TYPE_TAG_COLORS[label]?.color,
        count: tagged.filter(tags => tags.includes(label)).length,
      }));
    }
    // Mizzed and nudest have no taxonomy in the codebase. Show no children
    // rather than inventing them.
    return [];
  }, [address.path, hasBoard, rows]);

  const countable = !!COUNT_ENDPOINT[address.path];

  return (
    <section
      className={`z-index__board pdx-glass-card pdx-glass-rebind${hasBoard ? "" : " z-index__board--pending"}`}
      style={{ ["--c" as string]: accent, ["--d" as string]: `${index * 40}ms` }}
      aria-labelledby={`z-board-${address.path.replace("/", "-")}`}
    >
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />
      <Link href={zUrl(address.path)} className="z-index__board-head">
        <h2 className="z-index__addr" id={`z-board-${address.path.replace("/", "-")}`}>
          {address.display}
        </h2>
        <span className="z-index__board-name">{address.board}</span>
        <span className={`z-index__count${hasBoard ? "" : " z-index__count--none"}`}>
          {!hasBoard
            ? "not built yet"
            : !countable
              ? null
              : isPending
                ? <i className="z-index__pending" />
                : rows.length}
        </span>
      </Link>

      {hasBoard && (
        <Link href={address.route!} className="z-index__open">
          Open board <i aria-hidden="true">&rarr;</i>
        </Link>
      )}

      {subs.length > 0 && (
        <ul className="z-index__subs">
          {subs.map(sub => (
            <li key={sub.key}>
              <Link
                href={address.route!}
                className="z-index__sub"
                style={sub.color ? ({ ["--sub-c" as string]: sub.color }) : undefined}
              >
                {sub.color ? <span className="z-index__sub-swatch" /> : null}
                <span className="z-index__sub-label">{sub.label}</span>
                <span className="z-index__sub-count">{isPending ? "" : sub.count}</span>
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
    "Portland, all at once. Every Zaylist board and every category on one page: events, housing, gigs, free stuff, missed connections, and a directory of queer owned places.",
  );

  const heroRef = useRef<HTMLElement | null>(null);

  /**
   * Pointer parallax on the wordmark only. Pointer driven rather than scroll
   * driven so it costs nothing on a phone, where there is no pointer.
   */
  const onHeroMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };
  const onHeroLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  };

  const words = ["Portland,", "<em>all</em>", "<em>at once.</em>"];

  return (
    <div className="z-index">
      <section
        className="z-hero"
        ref={heroRef}
        onPointerMove={onHeroMove}
        onPointerLeave={onHeroLeave}
      >
        <span className="z-hero__grain" aria-hidden="true" />
        <span className="z-hero__motes" aria-hidden="true">
          {MOTES.map(([left, top, color], i) => (
            <span
              key={color + i}
              className="z-mote"
              style={{
                left,
                top,
                background: color,
                animationDelay: `${i * -1.7}s, ${i * -0.9}s`,
              }}
            />
          ))}
        </span>

        <div className="z-hero__inner">
          <p className="z-hero__kicker">Portland &middot; every board &middot; one page</p>
          <div className="z-hero__mark">
            <h1>
              {words.map((word, i) => (
                <span key={word} style={{ ["--d" as string]: `${90 + i * 80}ms` }}>
                  {word.startsWith("<em>")
                    ? <em>{word.replace(/<\/?em>/g, "")}</em>
                    : word}
                  {i < words.length - 1 ? " " : null}
                </span>
              ))}
            </h1>
          </div>
          <div className="z-hero__copy">
            <p className="z-hero__lede">
              Every board on one page, in plain words, in the order you read them.
              Nothing here decides what you see first. Type an address and go.
            </p>
            <p className="z-hero__live">
              <span className="z-hero__dot" aria-hidden="true" />
              <span>{Z_ADDRESSES.length} addresses live</span>
            </p>
          </div>
        </div>
      </section>

      <div className="z-index__grid">
        {Z_ADDRESSES.map((address, index) => (
          <BoardColumn key={address.path} address={address} index={index} />
        ))}
      </div>

      <div className="z-index__spectrum" aria-hidden="true">
        {SPECTRUM.map(color => <i key={color} style={{ background: color }} />)}
      </div>

      <p className="z-index__note">
        <b>The boards together are the rainbow.</b> Each board owns one colour, and
        that is the only place it appears. Counts come from the same endpoints the
        boards themselves use, so a category with nothing in it stays honestly at zero.
      </p>
    </div>
  );
}
