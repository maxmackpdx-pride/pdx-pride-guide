import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, SlidersHorizontal, ChevronDown, Search, ChevronLeft, Archive } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxThreads } from "@/components/inbox/useInboxThreads";
import type { Folder, Thread, LineupDecision } from "@/components/inbox/types";
import { C, MONO, DISPLAY, BODY } from "@/components/inbox/panel/sheet";
import ThreadAvatar from "@/components/inbox/ThreadAvatar";
import PersonalView from "@/components/inbox/panel/PersonalView";
import QueueView from "@/components/inbox/panel/QueueView";
import PostsView from "@/components/inbox/panel/PostsView";
import StatsView from "@/components/inbox/panel/StatsView";

type View = "inbox" | "posts" | "stats";
type Account = "personal" | "admin" | "owner";

type InboxOverlayProps = {
  open: boolean;
  onClose: () => void;
  initialView?: View;
  initialAccount?: Account;
};

const ACCOUNTS: Array<[Account, string, string]> = [
  ["personal", "Personal", C.limeSoft],
  ["admin", "Admin", C.magenta],
  ["owner", "Owner", C.purple],
];

const FILTERS: Array<[string, string, string]> = [
  ["all", "All", C.lime],
  ["spotted", "Missed Connections", C.magenta],
  ["gigs", "Gigs", C.purple],
  ["hosts", "Hosts", C.cyan],
  ["checkins", "Check-ins", C.green],
];

export default function InboxOverlay({ open, onClose, initialView, initialAccount }: InboxOverlayProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("inbox");
  const [account, setAccount] = useState<Account>("personal");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const { threads, sendMessage, setRead, archive, revealSelf, resolveLineup } = useInboxThreads(activeId);
  const activeThread = activeId ? threads.find((t) => t.id === activeId) ?? null : null;
  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const isOwner = Boolean(user?.username === "tuckerhelms" || user?.isSuperAdmin);

  const { data: pendingAdmin = { count: 0, ownerCount: 0 } } = useQuery<{ count: number; ownerCount?: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { count: 0, ownerCount: 0 },
      ),
    enabled: isAdmin,
    refetchInterval: 90_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    const t = window.setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  useEffect(() => {
    setActiveId(null);
    setReply("");
    if (!open) {
      setView("inbox");
      setAccount("personal");
      setFolder("inbox");
      setFilter("all");
      setFilterOpen(false);
      setQuery("");
      return;
    }
    setView(initialView ?? "inbox");
    setAccount(initialAccount ?? "personal");
    setFolder("inbox");
    setFilter("all");
    setFilterOpen(false);
    setQuery("");
  }, [open, initialView, initialAccount]);

  if (!open || !user) return null;

  const inboxActive = view === "inbox";
  const personalActive = inboxActive && account === "personal";
  const searchVisible = view !== "stats";
  const visibleAccounts = ACCOUNTS.filter(([id]) => id === "personal" || (id === "admin" && isAdmin) || (id === "owner" && isOwner));

  const active = threads.filter((t) => !t.archived);
  const accountUnread: Record<Account, number> = {
    personal: active.filter((t) => t.folder === "inbox" && t.unread).length,
    admin: pendingAdmin.count || 0,
    owner: isOwner ? pendingAdmin.ownerCount || 0 : 0,
  };
  const folderCount = (f: Folder) => active.filter((t) => t.folder === f).length;
  const catCount = (id: string) => (id === "all" ? active.length : active.filter((t) => t.cat === id).length);
  const activeFilterLabel = (FILTERS.find((f) => f[0] === filter)?.[1] || "All").toUpperCase();

  // Open the thread in place (no navigation) and mark it read so the badge resets.
  const openThread = (id: string) => {
    setActiveId(id);
    setReply("");
    void setRead(id, false);
  };
  const closeThread = () => {
    setActiveId(null);
    setReply("");
  };
  const send = async () => {
    const body = reply.trim();
    if (!body || !activeId) return;
    setReply("");
    try {
      await sendMessage(activeId, body);
    } catch {
      setReply(body);
    }
  };
  const navigateFromSheet = (href: string) => {
    onClose();
    setLocation(href);
  };

  const headStyle = (v: View) => ({
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: 30,
    letterSpacing: ".01em",
    lineHeight: 1,
    transition: "color .15s",
    color: view === v ? C.heading : C.dim,
  });

  const iconBtn = {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: C.inset,
    border: `1px solid ${C.border3}`,
    color: C.meta,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as const;

  return (
    <>
      <div className="inbox-overlay__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="inbox-overlay"
        role="dialog"
        aria-label="Inbox"
        ref={panelRef}
        style={{ background: C.sheet, border: "2px solid var(--neon-blue)", padding: 0 }}
      >
        {/* grab handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flex: "none" }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: "#2a2a31" }} />
        </div>

        {/* heading switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 0", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={headStyle("inbox")} onClick={() => setView("inbox")}>INBOX</button>
            <button style={headStyle("posts")} onClick={() => setView("posts")}>POSTS</button>
            <button style={headStyle("stats")} onClick={() => setView("stats")}>STATS</button>
          </div>
          <button style={iconBtn} onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* account tabs (inbox only) */}
        {inboxActive && !activeThread && (
          <div style={{ padding: "14px 20px 0", flex: "none" }}>
            <div style={{ display: "flex", gap: 4, background: C.inset, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 4 }}>
              {visibleAccounts.map(([id, label, color]) => {
                const act = account === id;
                return (
                  <button
                    key={id}
                    onClick={() => setAccount(id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 0",
                      border: "none",
                      borderRadius: 11,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: ".07em",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      transition: ".15s",
                      background: act ? C.seg : "transparent",
                      color: act ? C.heading : "#7a7a82",
                      boxShadow: act ? "0 1px 2px rgba(0,0,0,.4)" : undefined,
                    }}
                  >
                    {!act && accountUnread[id] > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 999,
                          background: color,
                          flex: "none",
                          boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
                        }}
                      />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* personal toolbar: received/sent + filter */}
        {personalActive && !activeThread && (
          <div style={{ padding: "12px 20px 0", flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", gap: 4, background: C.inset, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 3 }}>
              {(["inbox", "sent"] as Folder[]).map((f) => {
                const act = folder === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFolder(f)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 13px",
                      border: "none",
                      borderRadius: 9,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 10.5,
                      letterSpacing: ".06em",
                      fontWeight: 600,
                      transition: ".15s",
                      background: act ? C.lime : "transparent",
                      color: act ? "#000" : "#7a7a82",
                    }}
                  >
                    {f === "inbox" ? "Received" : "Sent"}
                    <span style={{ fontSize: 9.5, opacity: 0.7, color: act ? "#000" : C.faint }}>{folderCount(f)}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative" }} ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 12,
                  background: C.inset,
                  border: `1px solid ${C.border3}`,
                  color: C.body,
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".12em",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={13} />
                {activeFilterLabel}
                <ChevronDown size={11} style={{ transition: "transform .15s", transform: `rotate(${filterOpen ? 180 : 0}deg)` }} />
              </button>
              {filterOpen && (
                <div style={{ position: "absolute", top: 40, right: 0, zIndex: 20, width: 172, background: C.inset, border: `1px solid ${C.seg}`, borderRadius: 16, padding: 6, boxShadow: "0 18px 40px rgba(0,0,0,.55)" }}>
                  {FILTERS.map(([id, label, color]) => {
                    const act = filter === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setFilter(id);
                          setFilterOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 11px",
                          border: "none",
                          borderRadius: 11,
                          cursor: "pointer",
                          fontSize: 12.5,
                          fontFamily: BODY,
                          transition: ".12s",
                          background: act ? C.seg : "transparent",
                          color: act ? C.heading : "#b6b6bc",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flex: "none" }} />
                          {label}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{catCount(id)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* body */}
        <div
          className="inbox-overlay__scroll"
          style={{
            flex: 1,
            overflowY: activeThread ? "hidden" : "auto",
            padding: activeThread ? 0 : "14px 16px 12px",
            minHeight: 0,
            display: activeThread ? "flex" : undefined,
            flexDirection: activeThread ? "column" : undefined,
          }}
        >
          {activeThread ? (
            <ThreadDetail
              thread={activeThread}
              reply={reply}
              onReplyChange={setReply}
              onSend={send}
              onBack={closeThread}
              onArchive={() => {
                void archive(activeThread.id);
                closeThread();
              }}
              onReveal={() => revealSelf(activeThread.id)}
              onResolveLineup={(decision) => resolveLineup(activeThread.id, decision)}
            />
          ) : (
            <>
              {inboxActive && account === "personal" && (
                <PersonalView
                  folder={folder}
                  filter={filter}
                  query={query}
                  showTags
                  tintUnread
                  onOpenThread={openThread}
                  onNavigate={navigateFromSheet}
                />
              )}
              {inboxActive && account === "admin" && <QueueView mode="admin" />}
              {inboxActive && account === "owner" && <QueueView mode="owner" />}
              {view === "posts" && <PostsView onNavigate={navigateFromSheet} />}
              {view === "stats" && <StatsView />}
            </>
          )}
        </div>

        {/* bottom search */}
        {searchVisible && !activeThread && (
          <div style={{ flex: "none", padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${C.borderFaint}`, background: C.sheet }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 16px", borderRadius: 999, background: C.inset, border: `1px solid ${C.border3}` }}>
              <Search size={17} color={C.faint} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.body2, fontSize: 14, fontFamily: BODY, minWidth: 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const CAT_ACCENT: Record<string, string> = {
  spotted: C.magenta,
  gigs: C.purple,
  hosts: C.cyan,
  checkins: C.green,
};

type ThreadDetailProps = {
  thread: Thread;
  reply: string;
  onReplyChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  onArchive: () => void;
  onReveal: () => void;
  onResolveLineup: (decision: LineupDecision) => void;
};

// Full thread view rendered in place inside the floating inbox — no navigation.
// Reading, replying, archiving, and lineup approve/deny all happen here.
function ThreadDetail({
  thread,
  reply,
  onReplyChange,
  onSend,
  onBack,
  onArchive,
  onReveal,
  onResolveLineup,
}: ThreadDetailProps) {
  const accent = CAT_ACCENT[thread.cat] ?? C.cyan;
  const showReveal = thread.anonymous && thread.reveal && !thread.reveal.iRevealed;
  const lineupPending = thread.lineup?.status === "PENDING" && thread.lineupRequestId != null;

  const iconBtn = {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: C.inset,
    border: `1px solid ${C.border3}`,
    color: C.meta,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flex: "none" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* header: back · avatar · name/handle · archive */}
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: `1px solid ${C.borderFaint}`,
        }}
      >
        <button style={iconBtn} onClick={onBack} aria-label="Back to inbox" title="Back">
          <ChevronLeft size={18} />
        </button>
        <ThreadAvatar party={thread.party} masked={thread.anonymous} size={36} ring={thread.ring} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 18,
              color: C.heading,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {thread.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.meta, letterSpacing: ".04em" }}>
            {thread.handle}
          </div>
        </div>
        <button style={iconBtn} onClick={onArchive} aria-label="Archive thread" title="Archive">
          <Archive size={16} />
        </button>
      </div>

      {/* subject */}
      {thread.subject && (
        <div
          style={{
            flex: "none",
            padding: "10px 16px 0",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 15,
            color: accent,
            letterSpacing: ".01em",
          }}
        >
          {thread.subject}
        </div>
      )}

      {/* reveal panel (anonymous threads) */}
      {showReveal && (
        <div
          style={{
            flex: "none",
            margin: "12px 16px 0",
            padding: "11px 13px",
            background: C.inset,
            border: `1px solid ${C.border3}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5, marginBottom: 9 }}>
            This thread is anonymous. Reveal yourself to share who you are.
          </div>
          <button
            onClick={onReveal}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: ".08em",
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 10,
              border: `1px solid ${C.magenta}`,
              background: "transparent",
              color: C.magenta,
              cursor: "pointer",
            }}
          >
            Reveal myself
          </button>
        </div>
      )}

      {/* lineup approve / deny */}
      {lineupPending && (
        <div
          style={{
            flex: "none",
            margin: "12px 16px 0",
            padding: "11px 13px",
            background: C.inset,
            border: `1px solid ${C.cyan}`,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5, marginBottom: 10 }}>
            Lineup request{thread.lineup?.role ? ` · ${thread.lineup.role}` : ""}
            {thread.lineup?.eventTitle ? ` for ${thread.lineup.eventTitle}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onResolveLineup("APPROVED")}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".08em",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: C.lime,
                color: "#000",
                cursor: "pointer",
              }}
            >
              Approve
            </button>
            <button
              onClick={() => onResolveLineup("DENIED")}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".08em",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border3}`,
                background: "transparent",
                color: C.body,
                cursor: "pointer",
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "14px 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {thread.messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.self ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "82%",
                padding: "9px 12px",
                borderRadius: 14,
                background: m.self ? accent : C.inset,
                color: m.self ? "#000" : C.body2,
                fontSize: 13.5,
                lineHeight: 1.45,
                fontFamily: BODY,
                border: m.self ? "none" : `1px solid ${C.border3}`,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.body}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, marginTop: 3, padding: "0 4px" }}>
              {m.at}
            </div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div
        style={{
          flex: "none",
          padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
          borderTop: `1px solid ${C.borderFaint}`,
          background: C.sheet,
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <textarea
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Write a reply"
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 120,
            resize: "none",
            padding: "12px 14px",
            borderRadius: 14,
            background: C.inset,
            border: `1px solid ${C.border3}`,
            color: C.body2,
            fontFamily: BODY,
            fontSize: 14,
            lineHeight: 1.4,
            outline: "none",
          }}
        />
        <button
          onClick={onSend}
          disabled={!reply.trim()}
          style={{
            flex: "none",
            height: 44,
            padding: "0 18px",
            borderRadius: 14,
            border: "none",
            background: reply.trim() ? accent : C.seg,
            color: reply.trim() ? "#000" : C.faint,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: ".08em",
            fontWeight: 700,
            cursor: reply.trim() ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
