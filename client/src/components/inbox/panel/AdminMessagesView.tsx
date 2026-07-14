import type { Thread } from "../types";
import { C, MONO, DISPLAY } from "./sheet";

const CAT_TAG: Record<string, { label: string; color: string }> = {
  spotted: { label: "MISSED CONN", color: C.magenta },
  gigs: { label: "GIG", color: C.purple },
  gifting: { label: "GIFTING", color: C.lime },
  hosts: { label: "HOST", color: C.cyan },
  checkins: { label: "CHECK-IN", color: C.green },
};

function tagFor(cat: string) {
  return CAT_TAG[cat] || { label: "ADMIN", color: C.magenta };
}

/** Shared guide-admin Inbox / Sent list under floating inbox → Admin. */
export default function AdminMessagesView({
  threads,
  folder,
  query,
  onOpenThread,
}: {
  threads: Thread[];
  folder: "inbox" | "sent";
  query: string;
  onOpenThread: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const rows = threads
    .filter((t) => !t.archived && t.folder === folder)
    .filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q) ||
        (t.handle || "").toLowerCase().includes(q),
    );

  if (rows.length === 0) {
    return (
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
        {folder === "sent" ? "NO SENT ADMIN MESSAGES" : "NO REPLIES IN ADMIN INBOX"}
      </div>
    );
  }

  return (
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenThread(t.id);
              }
            }}
            style={{
              background: t.unread ? C.borderFaint : "transparent",
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
                  background: t.ring || C.magenta,
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
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: C.magenta,
                          flex: "none",
                          boxShadow: `0 0 8px ${C.magenta}`,
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint, flex: "none" }}>
                    {t.at}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: C.muted,
                    marginTop: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.subject}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
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
                  <span
                    style={{
                      fontSize: 13,
                      color: C.faint,
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
  );
}
