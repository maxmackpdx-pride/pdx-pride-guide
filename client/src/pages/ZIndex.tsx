import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import ZBoardIcon from "@/components/ZBoardIcon";
import {
  Z_ADDRESSES,
  routedZAddresses,
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
  market: "var(--neon-yellow, #ccff00)",
  mizzed: "var(--board-spotted, #ff00cc)",  // --board-spotted, index.css
  // The rest use Zaylist tokens; a nested address inherits its parent colour.
  happening: "var(--neon-orange, #ff6600)",
  directory: "var(--neon-red, #ff2400)",
  out: "var(--neon-orange, #ff6600)",
  "out/rooster-rock": "var(--neon-orange, #ff6600)",
  "out/sauvie-island": "var(--neon-green, #39ff14)",
  spaces: "#ffd700",                        // TYPE_COLORS.group, directoryTheme.ts
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
const CARD_PHOTO: Record<string, string> = {
  hauz: "/home/hausing/room-forming.jpg",
  happening: "/home/flyers/sasha-colby-live.jpg",
};

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
 * Marked `next` in the manifest (Z/SPACE, Z/OUT) still get their wordmark here:
 * the address is real and reserved even where the board is not built.
 */
const WORDMARK: Record<string, { src: string; alt: string }> = {
  gifz: { src: "/brand/family/gifz.svg", alt: "GifZ" },
  gigz: { src: "/brand/family/gigz.svg", alt: "Gigz" },
  hauz: { src: "/brand/family/the-hauz.svg", alt: "THE HAUZ" },
  spaces: { src: "/brand/family/z-space.svg", alt: "Z/SPACE" },
  out: { src: "/brand/family/z-out.svg", alt: "Z/OUT" },
  // Glyphs traced out of the real masters rather than redrawn: the letter
  // library PNG for M I D L K R T S V H, Z/SPACE for P A C E, GIFZ for Z. N is
  // built from the library H, keeping its exact tapered stems and swapping the
  // crossbar for a diagonal at the same stroke weight, because no mark in the
  // family contains an N.
  directory: { src: "/brand/family/placez.svg", alt: "PlaceZ" },
  mizzed: { src: "/brand/family/mizzed.svg", alt: "MizZed" },
  market: { src: "/brand/family/marketz.svg", alt: "MarketZ" },
  happening: { src: "/brand/family/eventz.svg", alt: "EventZ" },
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
 * Z/OUT destinations are deliberately absent: /api/nude-beaches returns live river
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

type Sub = ZCategoryAddress & { color?: string; count: number };

const VISIBLE_SUBS = 4;

/** Put the Places/Directory hub at the center seam without changing canonical address order. */
const Z_INDEX_ADDRESSES = (() => {
  const addresses = Z_ADDRESSES.filter(address => address.path !== "directory");
  const directory = Z_ADDRESSES.find(address => address.path === "directory");
  if (directory) addresses.splice(4, 0, directory);
  return addresses;
})();

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
        <li key={sub.key} className={sub.boardPath === "directory" && sub.key === "group" ? "z-index__sub-item--clubs" : undefined}>
          <Link
            href={zUrl(sub.path)}
            className={`z-index__sub${sub.boardPath === "directory" && sub.key === "group" ? " z-index__sub--clubs" : ""}`}
            style={sub.color ? ({ ["--sub-c" as string]: sub.color }) : undefined}
          >
            {sub.color ? <span className="z-index__sub-swatch" aria-hidden="true" /> : null}
            <span className="z-index__sub-copy">
              <span className="z-index__sub-address">z/{sub.path}</span>
              <span className="z-index__sub-label">{sub.label}</span>
            </span>
            <span
              className="z-index__sub-count"
              aria-label={countState === "loading" ? "Loading count" : countState === "error" ? "Count unavailable" : undefined}
            >
              {countState === "loading" ? "" : countState === "error" ? "\u2014" : sub.count}
            </span>
          </Link>
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
  const photo = CARD_PHOTO[address.path];
  const hasBoard = address.route !== null;
  const isDirectoryHub = address.path === "directory";

  const subs = useMemo<Sub[]>(() => {
    if (!hasBoard) return [];
    if (address.path === "directory") {
      const keys = Object.keys(TYPE_LABELS);
      const counts = countBy(rows, "type", keys);
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
        { key: "GIFT", label: "Offered", color: GIFZ_SUB_ACCENT.GIFT, count: counts.GIFT },
        { key: "ISO", label: "In search of", color: GIFZ_SUB_ACCENT.ISO, count: counts.ISO },
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
  const countState = isPending ? "loading" : isError ? "error" : "ready";
  const firstSubs = isDirectoryHub ? subs : subs.slice(0, VISIBLE_SUBS);
  const remainingSubs = isDirectoryHub ? [] : subs.slice(VISIBLE_SUBS);

  return (
    <section
      className={`z-index__board pdx-glass-card pdx-glass-rebind${hasBoard ? "" : " z-index__board--pending"}${isDirectoryHub ? " z-index__board--hub" : ""}`}
      style={{ ["--c" as string]: accent, ["--d" as string]: `${index * 40}ms` }}
      aria-labelledby={`z-board-${address.path.replace("/", "-")}`}
      data-address={address.path}
      data-photo={photo ? "1" : undefined}
    >
      {photo ? (
        <span className="z-index__photo" aria-hidden="true">
          <img src={photo} alt="" loading="lazy" decoding="async" />
          <span className="z-index__photo-tint" />
          <span className="z-index__photo-scrim" />
        </span>
      ) : null}
      {isDirectoryHub ? (
        <img
          className="z-index__hub-blueprint"
          src="/brand/waypoints/next-blueprint-reference-b.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />
      <Link href={zUrl(address.path)} className="z-index__board-head">
        <h2 className="z-index__addr" id={`z-board-${address.path.replace("/", "-")}`}>
          <ZBoardIcon path={address.path} />
          {address.path.split("/").at(-1)}
        </h2>
        <span className="z-index__wordmark-slot">
          {wordmark ? (
            <img
              className="z-index__wordmark"
              src={wordmark.src}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="z-index__board-name">{isDirectoryHub ? "Places" : address.board}</span>
          )}
          {isDirectoryHub ? <span className="z-index__hub-label">Portland community directory</span> : null}
        </span>
        <span className={`z-index__count${hasBoard ? "" : " z-index__count--none"}`}>
          {!hasBoard
            ? "not built yet"
            : !countable
              ? null
              : countState === "loading"
                ? <i className="z-index__pending" role="status" aria-label="Loading count" />
                : countState === "error"
                  ? <span aria-label="Count unavailable">\u2014</span>
                  : rows.length}
        </span>
      </Link>

      {subs.length > 0 && (
        <div className="z-index__categories">
          <SubcategoryRows subs={firstSubs} countState={countState} />
          {remainingSubs.length > 0 ? (
            <details className="z-index__more">
              <summary>{remainingSubs.length} more z/ addresses</summary>
              <SubcategoryRows subs={remainingSubs} countState={countState} />
            </details>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default function ZIndex() {
  usePageSeo(
    "z/ | Every Zaylist board, one page",
    "Portland, all at once. Every Zaylist board and every real category on one page: events, housing, gigs, free stuff, missed connections, and the community directory.",
  );

  const heroRef = useRef<HTMLElement | null>(null);
  const [, setLocation] = useLocation();
  const [addressQuery, setAddressQuery] = useState("");
  const liveCount = routedZAddresses().length;
  const heldCount = Z_ADDRESSES.length - liveCount;

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

  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addressMatches[0]) setLocation(zUrl(addressMatches[0].path));
  };

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
              Nothing here decides what you see first. Find an address and go.
            </p>
            <p className="z-hero__live">
              <span className="z-hero__dot" aria-hidden="true" />
              <span>{liveCount} boards live &middot; {heldCount} not built yet</span>
            </p>
          </div>

          <form className="z-address-search" role="search" onSubmit={submitAddress}>
            <label htmlFor="z-address-input">Find a z/ address</label>
            <div className="z-address-search__field">
              <span aria-hidden="true">z/</span>
              <input
                type="search"
                name="z-address"
                id="z-address-input"
                value={addressQuery}
                onChange={event => setAddressQuery(event.target.value)}
                placeholder="events, free, cafes, housing..."
                autoComplete="off"
              />
              <button type="submit" disabled={!addressMatches.length}>Go</button>
            </div>
            {normalizedQuery ? (
              <div className="z-address-search__results" id="z-address-results" aria-live="polite">
                {addressMatches.length ? addressMatches.map(entry => (
                  <Link key={entry.path} href={zUrl(entry.path)}>
                    <span>z/{entry.path}</span>
                    <small>{entry.label} &middot; {entry.detail}</small>
                  </Link>
                )) : (
                  <p>No z/ address matches that search.</p>
                )}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <nav className="z-address-index" aria-label="Zaylist board address index">
        {Z_ADDRESSES.map(address => (
          <Link key={address.path} href={zUrl(address.path)}>
            {address.display}
            {!address.route ? <small>not built</small> : null}
          </Link>
        ))}
      </nav>

      <div className="z-index__grid">
        {Z_INDEX_ADDRESSES.map((address, index) => (
          <BoardColumn key={address.path} address={address} index={index} />
        ))}
      </div>

      <hr className="pdx-rainbow-rule z-index__rule" aria-hidden="true" />

      <p className="z-index__note">
        <b>The boards together are the rainbow.</b> Each top-level board keeps one
        colour, and a nested address inherits its parent. Counts come from the same endpoints the
        boards themselves use, so a category with nothing in it stays honestly at zero.
      </p>
    </div>
  );
}
