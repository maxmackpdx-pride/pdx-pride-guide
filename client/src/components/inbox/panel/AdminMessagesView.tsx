import type { CSSProperties } from "react";
import type { Thread } from "../types";
import { C } from "./sheet";
import "../inbox-experiment.css";

const CAT_TAG: Record<string, { label: string; color: string }> = {
  spotted: { label: "MISSED CONN", color: C.magenta },
  gigs: { label: "GIG", color: C.purple },
  gifting: { label: "GIFTING", color: C.lime },
  housing: { label: "THE HAÜZ", color: C.cyan },
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
  onMarkAllRead,
  markingAllRead,
}: {
  threads: Thread[];
  folder: "inbox" | "sent";
  query: string;
  onOpenThread: (id: string) => void;
  onMarkAllRead?: () => void;
  markingAllRead?: boolean;
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

  const unread = rows.filter((t) => t.unread).length;

  if (rows.length === 0) {
    return (
      <div className="inbox-exp-empty">
        {folder === "sent" ? "NO SENT ADMIN MESSAGES" : "NO REPLIES IN ADMIN INBOX"}
      </div>
    );
  }

  const openRow = (id: string) => ({
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpenThread(id);
      }
    },
  });

  return (
    <>
      {folder === "inbox" && onMarkAllRead && unread > 0 && (
        <div className="inbox-exp-toolbar">
          <button
            type="button"
            className="inbox-exp-mark-read"
            disabled={markingAllRead}
            onClick={() => onMarkAllRead()}
          >
            {markingAllRead ? "MARKING…" : `MARK ALL READ (${unread})`}
          </button>
        </div>
      )}
      <div className="inbox-exp-list">
        {rows.map((t) => {
          const tag = tagFor(t.cat);
          const initial = (t.name || "?").trim().charAt(0).toUpperCase();
          const preview = t.messages[t.messages.length - 1]?.body || t.subject || "";
          return (
            <div
              key={t.id}
              className={`inbox-exp-row${t.unread ? " inbox-exp-row--unread-admin" : ""}`}
              onClick={() => onOpenThread(t.id)}
              {...openRow(t.id)}
            >
              <div
                className="inbox-exp-avatar inbox-exp-avatar--lg"
                style={{ "--inbox-exp-ring": t.ring || C.magenta, "--inbox-exp-initial-color": tag.color } as CSSProperties}
              >
                <div className="inbox-exp-avatar__inner">{initial}</div>
              </div>
              <div className="inbox-exp-row__body">
                <div className="inbox-exp-row__top">
                  <div className="inbox-exp-row__id">
                    <span className="inbox-exp-row__name">{t.name}</span>
                    {t.unread && <span className="inbox-exp-dot inbox-exp-dot--magenta" aria-hidden />}
                  </div>
                  <span className="inbox-exp-row__at">{t.at}</span>
                </div>
                {t.subject ? <span className="inbox-exp-row__sub">{t.subject}</span> : null}
                <div className="inbox-exp-row__foot">
                  <span className="inbox-exp-tag" style={{ background: tag.color }}>
                    {tag.label}
                  </span>
                  <span className="inbox-exp-row__preview">{preview}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}