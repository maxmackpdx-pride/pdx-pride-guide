import { useQuery } from "@tanstack/react-query";
import { useInboxThreads } from "../useInboxThreads";
import type { Folder } from "../types";
import { C, MONO, DISPLAY } from "./sheet";

const CAT_TAG: Record<string, { label: string; color: string }> = {
  spotted: { label: "MISSED CONN", color: C.magenta },
  gigs: { label: "GIG", color: C.purple },
  gifting: { label: "GIFTING", color: C.lime },
  hosts: { label: "HOST", color: C.cyan },
  checkins: { label: "CHECK-IN", color: C.green },
  group: { label: "GROUP", color: C.limeSoft },
};

function tagFor(cat: string) {
  return CAT_TAG[cat] || { label: "MESSAGE", color: C.limeSoft };
}

export type GroupChatRow = {
  kind: "EVENT" | "BEACH";
  id: number | string;
  title: string;
  state: "BEFORE" | "OPEN";
  opensAt: string | null;
  closesAt: string;
  href: string;
};

function groupSub(row: GroupChatRow): string {
  if (row.state === "BEFORE" && row.opensAt) {
    return `Opens ${new Date(row.opensAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`;
  }
  return `Open now · until ${new Date(row.closesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export default function PersonalView({
  folder,
  filter,
  query,
  showTags,
  tintUnread,
  onOpenThread,
  onOpenGroup,
}: {
  folder: Folder;
  filter: string;
  query: string;
  showTags: boolean;
  tintUnread: boolean;
  onOpenThread: (id: string) => void;
  /** Open event/beach day-room inside the floating inbox (no navigation). */
  onOpenGroup?: (row: GroupChatRow) => void;
}) {
  const { threads } = useInboxThreads(null);

  const { data: groupChats = [] } = useQuery<GroupChatRow[]>({
    queryKey: ["/api/chats/mine"],
    queryFn: () => fetch("/api/chats/mine", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    refetchInterval: 60_000,
  });

  const q = query.trim().toLowerCase();
  const rows = threads
    .filter((t) => (folder === "deleted" ? t.archived : !t.archived && t.folder === folder))
    .filter((t) => folder === "deleted" || filter === "all" || t.cat === filter)
    .filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q),
    );

  const showGroups = folder === "inbox" && filter === "all" && !q && groupChats.length > 0;
  const emptyLabel = folder === "deleted" ? "NO RECENTLY DELETED MESSAGES" : "NO MESSAGES HERE";

  const groupStrip = showGroups ? (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 22,
        overflow: "hidden",
        background: C.list,
        marginBottom: 12,
      }}
    >
      {groupChats.map((row, i) => (
        <div
          key={`${row.kind}-${row.id}`}
          onClick={() => onOpenGroup?.(row)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenGroup?.(row);
            }
          }}
          style={{
            borderTop: i > 0 ? `1px solid ${C.border2}` : undefined,
            padding: "14px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `conic-gradient(from 90deg, ${C.lime}, ${C.cyan}, ${C.magenta}, ${C.lime})`,
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 15,
              color: "#0b0b0b",
            }}
          >
            {row.kind === "BEACH" ? "RB" : "GC"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.heading,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.title}
              </span>
              {row.state === "OPEN" && (
                <span style={{ width: 7, height: 7, borderRadius: 999, background: C.green, flex: "none", boxShadow: `0 0 7px ${C.green}` }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: ".08em",
                  fontWeight: 600,
                  color: "#000",
                  background: C.limeSoft,
                  padding: "2.5px 6px",
                  borderRadius: 6,
                  flex: "none",
                }}
              >
                GROUP
              </span>
              <span style={{ fontSize: 13.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {groupSub(row)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : null;

  if (rows.length === 0) {
    return (
      <>
        {groupStrip}
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: C.faint2,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: ".1em",
          }}
        >
          {emptyLabel}
        </div>
      </>
    );
  }

  return (
    <>
    {groupStrip}
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 22,
        overflow: "hidden",
        background: C.list,
      }}
    >
      {rows.map((t, i) => {
        const tag = tagFor(t.cat);
        const initial = (t.name || "?").trim().charAt(0).toUpperCase();
        const preview = t.messages[t.messages.length - 1]?.body || t.subject || "";
        return (
          <div
            key={t.id}
            onClick={() => onOpenThread(t.id)}
            style={{
              background: t.unread && tintUnread ? C.borderFaint : "transparent",
              borderTop: i > 0 ? `1px solid ${C.border2}` : undefined,
              padding: "16px",
              cursor: "pointer",
              transition: ".15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  background: t.ring || C.limeSoft,
                  padding: 2.5,
                  flex: "none",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 999,
                    background: "#17171b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: DISPLAY,
                    fontWeight: 800,
                    fontSize: 18,
                    color: tag.color,
                  }}
                >
                  {initial}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: C.heading,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.name}
                    </span>
                    {t.unread && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 999,
                          background: C.lime,
                          flex: "none",
                          boxShadow: `0 0 12px ${C.lime}, 0 0 4px ${C.lime}`,
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, flex: "none" }}>
                    {t.at}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  {showTags && (
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        letterSpacing: ".08em",
                        fontWeight: 600,
                        color: "#000",
                        background: tag.color,
                        padding: "2.5px 6px",
                        borderRadius: 6,
                        flex: "none",
                      }}
                    >
                      {tag.label}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 13.5,
                      color: C.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {preview}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
