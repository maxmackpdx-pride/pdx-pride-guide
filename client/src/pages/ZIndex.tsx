import { useMemo, useState } from "react";
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
import { placePath } from "@shared/placeSlug";
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

function newestPosts(path: string, rows: Row[]): Array<{ title: string; meta: string; age: string }> {
  const sorted = [...rows].sort((left, right) =>
    String(right.createdAt ?? right.updatedAt ?? right.startTime ?? "").localeCompare(
      String(left.createdAt ?? left.updatedAt ?? left.startTime ?? ""),
    ),
  );
  return sorted.slice(0, 3).flatMap(row => {
    const title = String(row.title ?? row.name ?? row.body ?? "").trim();
    if (!title) return [];
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
    return [{ title, meta, age: ageLabel(row.createdAt ?? row.updatedAt ?? row.startTime) }];
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
            href={sub.href ?? zUrl(sub.path)}
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
            href: placePath(id, name),
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
      className={`z-index__board pdx-glass-card pdx-glass-rebind${hasBoard ? "" : " z-index__board--pending"}${address.path === "happening" ? " pdx-glass--rainbow" : ""}`}
      style={{ ["--c" as string]: accent, ["--d" as string]: `${index * 40}ms` }}
      aria-labelledby={`z-board-${address.path.replace("/", "-")}`}
      data-address={address.path}
    >
      <span className="pdx-refract-seam" aria-hidden="true" />
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
            <Link key={post.title} href={zUrl(address.path)} className="z-index__post">
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

export default function ZIndex() {
  usePageSeo(
    "z/ | Every Zaylist board, one page",
    "Portland, all at once. Every Zaylist board and every real category on one page: events, housing, gigs, free stuff, missed connections, and the community directory.",
  );

  const [, setLocation] = useLocation();
  const [addressQuery, setAddressQuery] = useState("");
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

  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addressMatches[0]) setLocation(zUrl(addressMatches[0].path));
  };

  const visibleBoards = normalizedQuery
    ? topBoards.filter(address =>
        `${address.display} ${address.board} ${address.path}`.toLowerCase().includes(normalizedQuery),
      )
    : topBoards;

  return (
    <div className="z-index">
      <header className="z-index__top">
        <div className="z-index__intro">
          <div className="z-index__brand">
            <img src="/brand/family/z-space.svg" alt="Z/SPACE" decoding="async" />
            <span>
              <i aria-hidden="true" />
              the index · every board · one page
            </span>
          </div>
          <h1>Portland, <em>all at once.</em></h1>
          <p>Nine boards, newest posts first. Nothing here decides what you see. Type an address and go.</p>
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
            {topBoards.map(address => (
              <Link
                key={address.path}
                href={zUrl(address.path)}
                className={!address.route ? "is-pending" : undefined}
              >
                {address.display}
              </Link>
            ))}
          </nav>
          <p className="z-index__stats">
            {liveCount} boards live · {heldCount} not built yet
          </p>
        </div>
      </header>

      <div className="z-index__seam" aria-hidden="true" />

      <div className="z-index__grid">
        {visibleBoards.map((address, index) => (
          <BoardColumn key={address.path} address={address} index={index} />
        ))}
      </div>
    </div>
  );
}
