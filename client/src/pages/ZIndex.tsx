import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Z_ADDRESSES, zUrl, type ZAddress } from "@shared/zNamespace";
import { TYPE_LABELS, TYPE_COLORS } from "@/pages/Directory";
import { HOUSING_TYPES, HOUSING_TYPE_KICKER } from "@shared/housing";
import { EVENT_TYPE_FILTERS, getEventTypeTagsForEvent } from "@shared/eventTypeTags";
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

/** Board accents, reusing the tokens the home stage already assigns. */
const ACCENT: Record<string, string> = {
  happening: "var(--neon-yellow, #ccff00)",
  hauz: "var(--board-housing, #00ffff)",
  market: "var(--neon-orange, #ff6600)",
  gifz: "var(--board-gifting, #ccff00)",
  gigz: "var(--board-gigs, #b06bff)",
  mizzed: "var(--board-spotted, #ff1fa0)",
  directory: "var(--neon-red, #ff2400)",
  out: "var(--neon-orange, #ff6600)",
  "out/nudest": "var(--neon-orange, #ff6600)",
  space: "var(--board-gigs, #b06bff)",
};

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

function BoardColumn({ address }: { address: ZAddress }) {
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
        count: counts[key],
      }));
    }
    if (address.path === "gifz") {
      const counts = countBy(rows, "postType", ["GIFT", "ISO"]);
      return [
        { key: "GIFT", label: "Offered", count: counts.GIFT },
        { key: "ISO", label: "In search of", count: counts.ISO },
      ];
    }
    if (address.path === "gigz") {
      const counts = countBy(rows, "postType", ["POSTING_GIG", "LOOKING_FOR_WORK"]);
      return [
        { key: "POSTING_GIG", label: "Gigs offered", count: counts.POSTING_GIG },
        { key: "LOOKING_FOR_WORK", label: "Talent available", count: counts.LOOKING_FOR_WORK },
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
      className="z-index__board pdx-glass-rebind"
      style={{ ["--c" as string]: accent }}
      aria-labelledby={`z-board-${address.path.replace("/", "-")}`}
    >
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

      {subs.length > 0 && (
        <ul className="z-index__subs">
          {subs.map(sub => (
            <li key={sub.key}>
              <Link
                href={address.route!}
                className="z-index__sub"
                style={sub.color ? ({ ["--sub-c" as string]: sub.color }) : undefined}
              >
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
    "z/ | Every Zaylist board at one address",
    "Every Zaylist board and every category, typed out on one page. Events, housing, gigs, free stuff, missed connections, and a directory of queer owned places.",
  );

  return (
    <div className="z-index">
      <header className="z-index__head">
        <p className="z-index__kicker">Zaylist / addresses</p>
        <h1>Everything, at one address.</h1>
        <p className="z-index__lede">
          Every board has a z/ address you can type. This is the whole list, on one page.
        </p>
      </header>

      <div className="z-index__grid">
        {Z_ADDRESSES.map(address => (
          <BoardColumn key={address.path} address={address} />
        ))}
      </div>
    </div>
  );
}
