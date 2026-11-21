import { useMyGroupChats, type GroupChatRow } from "@/hooks/useMyGroupChats";
import {visibleThreads} from "../visibleThreads";
import { useEffect, useState, type CSSProperties } from "react";
import {
  formatClosesIn,
  formatOpensAtWall,
  formatOpensIn,
} from "@/lib/chatCountdown";
import { useInboxThreads } from "../useInboxThreads";
import type { Folder } from "../types";
import { C } from "./sheet";
import "../inbox.css";
import { inboxRoomTag } from "@/lib/rooms";

const CAT_TAG: Record<string, { label: string; color: string }> = {
  messages: { label: "MESSAGE", color: C.cyan },
  spotted: { label: "MISSED CONN", color: C.magenta },
  gigs: { label: "GIG", color: C.purple },
  gifting: { label: "GIFTING", color: C.lime },
  sellz: { label: "SELLZ", color: C.green },
  housing: { label: "My Hoüz", color: C.cyan },
  hosts: { label: "HOST", color: C.cyan },
  checkins: { label: "CHECK-IN", color: C.green },
  group: { label: "GROUP", color: C.limeSoft },
};

function tagFor(cat: string) {
  return inboxRoomTag(cat, CAT_TAG[cat] || { label: "MESSAGE", color: C.limeSoft });
}

export type { GroupChatRow } from "@/hooks/useMyGroupChats";

function groupSub(row: GroupChatRow, now: number): string {
  if (row.kind === 'COMMUNITY') return `${row.muted ? 'Muted · ' : ''}${row.unreadCount || 0} unread`;
  if (row.state === "BEFORE" && row.opensAt) {
    const live = formatOpensIn(row.opensAt, now);
    if (live) return live;
    const wall = formatOpensAtWall(row.opensAt);
    return wall ? `Opens ${wall}` : "Opens soon";
  }
  const left = formatClosesIn(row.closesAt, now);
  if (left && left !== "Chat closed") return `Open · ${left}`;
  return `Open now · until ${new Date(row.closesAt || 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

const openRow = (fn: () => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    },
  });

export function GroupChatsView({onOpen}:{onOpen:(row:GroupChatRow)=>void}) {
  const [now, setNow] = useState(() => Date.now());

  // Tick while any group chat is waiting to open so the countdown stays fun.
  const { data: groupChats = [], isPending: groupsLoading, isError: groupsFailed, refetch: retryGroups } = useMyGroupChats();

  const hasPreOpen = groupChats.some((g) => g.state === "BEFORE" && g.opensAt);
  useEffect(() => {
    if (!hasPreOpen) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasPreOpen]);

  if (groupsFailed) return <p role="alert">Chats unavailable. <button onClick={()=>void retryGroups()}>Retry</button></p>;
  if (groupsLoading) return <p role="status">Loading chats…</p>;
  if (!groupChats.length) return <div className="inbox-exp-empty">No joined chats.</div>;
  return (
    <div className="inbox-exp-list inbox-exp-list--spaced">
      {groupChats.map((row) => {
        const waiting = row.state === "BEFORE";
        return (
          <div
            key={`${row.kind}-${row.id}-${row.calendarDate || ""}`}
            className={`inbox-exp-row${waiting ? " inbox-exp-row--waiting" : ""}`}
            onClick={() => onOpen(row)}
            {...openRow(() => onOpen(row))}
          >
            <span className="inbox-exp-group-avatar">{row.kind === "BEACH" ? "RB" : row.kind === "OUTZ" ? "OZ" : row.kind === "COMMUNITY" ? "SZ" : "GC"}</span>
            <div className="inbox-exp-row__body">
              <div className="inbox-exp-row__top">
                <div className="inbox-exp-row__id">
                  <span className="inbox-exp-row__name">{row.title}</span>
                  {row.state === "OPEN" && <span className="inbox-exp-dot inbox-exp-dot--live" aria-hidden />}
                </div>
                {waiting && (
                  <span className="inbox-exp-row__countdown" aria-live="polite">
                    {formatOpensIn(row.opensAt, now) || "Soon"}
                  </span>
                )}
              </div>
              <div className="inbox-exp-row__foot">
                <span
                  className="inbox-exp-tag"
                  style={{ background: waiting ? C.cyan : C.limeSoft }}
                >
                  {waiting ? "SOON" : "GROUP"}
                </span>
                <span className="inbox-exp-row__preview">{groupSub(row, now)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

}

export default function PersonalView({
  folder,
  filter,
  query,
  showTags,
  tintUnread,
  onOpenThread,
}: {
  folder: Folder;
  filter: string;
  query: string;
  showTags: boolean;
  tintUnread: boolean;
  onOpenThread: (id: string) => void;
}) {
  const { threads, loading, inboxError, sentError, refetchInbox, refetchSent, archiveQuery } = useInboxThreads(null);
  const rows=visibleThreads(threads,folder,filter,query);
  if(archiveQuery.isError || (folder!=="sent" && inboxError) || (folder!=="inbox" && sentError))
    return <p role="alert">Conversations unavailable. <button onClick={()=>{void refetchInbox();void refetchSent();void archiveQuery.refetch();}}>Retry</button></p>;
  if(loading && !rows.length)return <p role="status">Loading conversations…</p>;
  if (!rows.length) return <div className="inbox-exp-empty">{folder === "deleted" ? "NO ARCHIVED CONVERSATIONS" : "NO MESSAGES HERE"}</div>;
  return (
    <>
      <div className="inbox-exp-list">
        {rows.map((t) => {
          const tag = tagFor(t.cat);
          const initial = (t.name || "?").trim().charAt(0).toUpperCase();
          const preview = t.messages[t.messages.length - 1]?.body || t.subject || "";
          const unread = t.unread && tintUnread;
          return (
            <div
              key={t.id}
              className={`inbox-exp-row${unread ? " inbox-exp-row--unread" : ""}`}
              onClick={() => onOpenThread(t.id)}
              {...openRow(() => onOpenThread(t.id))}
            >
              <div
                className="inbox-exp-avatar inbox-exp-avatar--lg"
                style={{ "--inbox-exp-ring": t.ring || C.limeSoft, "--inbox-exp-initial-color": tag.color } as CSSProperties}
              >
                <div className="inbox-exp-avatar__inner">{initial}</div>
              </div>
              <div className="inbox-exp-row__body">
                <div className="inbox-exp-row__top">
                  <div className="inbox-exp-row__id">
                    <span className="inbox-exp-row__name">{t.name}</span>
                    {t.unread && <span className="inbox-exp-dot" aria-hidden />}
                  </div>
                  <span className="inbox-exp-row__at">{t.at}</span>
                </div>
                {t.subject ? <span className="inbox-exp-row__sub">{t.subject}</span> : null}
                <div className="inbox-exp-row__foot">
                  {showTags && (
                    <span className="inbox-exp-tag" style={{ background: tag.color }}>
                      {tag.label}
                    </span>
                  )}
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
