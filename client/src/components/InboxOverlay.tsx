import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, SlidersHorizontal, ChevronDown, Search, ChevronLeft, Archive } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxThreads } from "@/components/inbox/useInboxThreads";
import { useAdminGuideThreads } from "@/components/inbox/useAdminGuideThreads";
import type { Folder, QueueFolder, Thread, LineupDecision } from "@/components/inbox/types";
import { C } from "@/components/inbox/panel/sheet";
import ThreadAvatar from "@/components/inbox/ThreadAvatar";
import PersonalView from "@/components/inbox/panel/PersonalView";
import type { GroupChatRow } from "@/components/inbox/panel/PersonalView";
import AdminMessagesView from "@/components/inbox/panel/AdminMessagesView";
import QueueView from "@/components/inbox/panel/QueueView";
import PostsView from "@/components/inbox/panel/PostsView";
import StatsView from "@/components/inbox/panel/StatsView";
import InboxGroupChat, { type InboxGroupChatTarget } from "@/components/inbox/InboxGroupChat";
import { MessageBubbleWithReactions } from "@/components/inbox/MessageReactions";
import { eventIdFromInboxContext } from "@/lib/inboxContext";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import type { EventListing } from "@shared/multiDayEvents";
import type { MessageReactionCode } from "@shared/messageReactions";
import { isLocalDemo } from "@/lib/localDemo";
import "@/components/inbox/inbox-experiment.css";
import "@/components/inbox/message-reactions.css";

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
  ["spotted", "MIZZED CONNECTION", C.magenta],
  ["gigs", "GIGZ", C.purple],
  ["gifting", "GIFTZ", C.lime],
  ["sellz", "SELLZ", C.green],
  ["housing", "THE HAÜZ", C.cyan],
  ["hosts", "Hosts", C.cyan],
  ["checkins", "Check-ins", C.green],
];

type HousingThreadGate = {
  requestId: number;
  kind: string;
  role: "requester" | "recipient";
  accepted: boolean;
  pending: boolean;
  awaiting: boolean;
  canNudge: boolean;
};

export default function InboxOverlay({ open, onClose, initialView, initialAccount }: InboxOverlayProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("inbox");
  const [account, setAccount] = useState<Account>("personal");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [queueFolder, setQueueFolder] = useState<QueueFolder>("active");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openEvent, setOpenEvent] = useState<EventListing | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<InboxGroupChatTarget | null>(null);
  const [reply, setReply] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  /** Owner desk is primary owner only (@tucker_pdmax), not other admins/super-admins. */
  const isOwner = Boolean(user?.isPrimaryOwner);
  const adminMailActive = isAdmin && account === "admin" && (queueFolder === "inbox" || queueFolder === "sent");

  const {
    threads,
    sendMessage,
    toggleReaction,
    setRead,
    archive,
    unarchive,
    deletedCount,
    revealSelf,
    resolveLineup,
  } = useInboxThreads(adminMailActive ? null : activeId);
  const {
    threads: adminThreads,
    sendMessage: sendAdminGuideMessage,
    toggleReaction: toggleAdminGuideReaction,
    setRead: setAdminGuideRead,
    archive: archiveAdminGuide,
    unarchive: unarchiveAdminGuide,
    markAllRead: markAllAdminGuideRead,
    remove: removeAdminGuideThread,
    unreadCount: adminGuideUnread,
  } = useAdminGuideThreads(adminMailActive ? activeId : null, isAdmin);
  const [markingGuideAllRead, setMarkingGuideAllRead] = useState(false);

  const activeThread = activeId
    ? (adminMailActive
        ? adminThreads.find((t) => t.id === activeId)
        : threads.find((t) => t.id === activeId)) ?? null
    : null;

  const housingThread = Boolean(
    activeThread && !adminMailActive && (activeThread.cat === "housing" || activeThread.contextType === "HOUSING"),
  );
  const { data: housingGate = null, isLoading: housingGateLoading } = useQuery<HousingThreadGate | null>({
    queryKey: ["/api/housing/requests/by-thread", activeId],
    enabled: housingThread && !!activeId,
    queryFn: async () => {
      const r = await fetch(`/api/housing/requests/by-thread/${encodeURIComponent(activeId!)}`, { credentials: "include" });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Could not load housing request");
      return r.json();
    },
  });
  const housingComposerLocked = Boolean(
    housingThread && (housingGateLoading || (housingGate && !housingGate.accepted)),
  );

  const { data: pendingAdmin = { count: 0, queueCount: 0, ownerCount: 0, guideUnread: 0, adminBadge: 0 } } = useQuery<{
    count: number;
    queueCount?: number;
    ownerCount?: number;
    guideUnread?: number;
    adminBadge?: number;
  }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { count: 0, queueCount: 0, ownerCount: 0, guideUnread: 0, adminBadge: 0 },
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

  // Close on outside press - but never on the same gesture that opened the
  // sheet (FAB / Messages tab). Also ignore the floating FAB itself so open
  // can toggle cleanly without an instant close.
  useEffect(() => {
    if (!open) return;
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 280);
    const onDown = (e: PointerEvent | MouseEvent) => {
      if (!armed) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (panelRef.current?.contains(t)) return;
      if (t instanceof Element) {
        if (t.closest(".floating-inbox")) return;
        if (t.closest("[data-inbox-open-trigger]")) return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("pointerdown", onDown, true);
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
    setActiveGroup(null);
    setReply("");
    if (!open) {
      setView("inbox");
      setAccount("personal");
      setFolder("inbox");
      setQueueFolder("active");
      setFilter("all");
      setFilterOpen(false);
      setQuery("");
      return;
    }
    setView(initialView ?? "inbox");
    if (initialAccount) {
      setAccount(initialAccount);
    } else if (isAdmin && (pendingAdmin.count || 0) > 0) {
      setAccount("admin");
    } else if (isOwner && (pendingAdmin.ownerCount || 0) > 0) {
      setAccount("owner");
    } else {
      setAccount("personal");
    }
    setFolder("inbox");
    setQueueFolder("active");
    setFilter("all");
    setFilterOpen(false);
    setQuery("");
  }, [open, initialView, initialAccount, isAdmin, isOwner, pendingAdmin.count, pendingAdmin.ownerCount]);

  useEffect(() => {
    setQueueFolder("active");
    setActiveGroup(null);
  }, [account]);

  useEffect(() => {
    if (view !== "inbox") setActiveGroup(null);
  }, [view]);

  if (!open) return null;

  // Local guest demo: glass shell + login so the FAB/chrome can be shown without a session.
  if (!user) {
    if (!isLocalDemo()) return null;
    return (
      <>
        <div
          className="inbox-overlay inbox-overlay--experiment"
          role="dialog"
          aria-modal="true"
          aria-label="Inbox demo"
          ref={panelRef}
          data-testid="inbox-overlay-guest-demo"
        >
          <header className="inbox-exp-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px", gap: 12 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
              <span className="display" style={{ fontWeight: 900, letterSpacing: "0.06em", color: "#fff" }}>INBOX</span>
              <span className="display" style={{ fontWeight: 800, letterSpacing: "0.06em", color: "#666" }}>POSTS</span>
              <span className="display" style={{ fontWeight: 800, letterSpacing: "0.06em", color: "#666" }}>STATS</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inbox"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid #2a2a32",
                background: "#0c0c0f",
                color: "#ccc",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </header>
          <div style={{ padding: "28px 22px 32px", display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <p style={{ margin: 0, color: "#e6e3da", fontSize: "0.95rem", lineHeight: 1.5, maxWidth: 36 + "ch" }}>
              Local demo - floating inbox glass shell. Sign in to load real threads, posts, and queues.
            </p>
            <p style={{ margin: 0, color: "#8a8a8a", fontSize: "0.8rem", lineHeight: 1.45 }}>
              Smoke account if seeded: <code style={{ color: "#3d7cff" }}>tucker@test.com</code> /{" "}
              <code style={{ color: "#3d7cff" }}>smoketest</code>
            </p>
            <button
              type="button"
              className="pdx-glass-btn pdx-glass-rebind"
              data-testid="inbox-demo-login"
              onClick={() => setShowAuth(true)}
              style={{
                ["--c" as string]: "#1a4dff",
                marginTop: 4,
                padding: "10px 18px",
                borderRadius: 6,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Log in to demo
            </button>
          </div>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
      </>
    );
  }

  const inboxActive = view === "inbox";
  const personalActive = inboxActive && account === "personal";
  const searchVisible = view !== "stats";
  const visibleAccounts = ACCOUNTS.filter(([id]) => id === "personal" || (id === "admin" && isAdmin) || (id === "owner" && isOwner));

  const active = threads.filter((t) => !t.archived);
  const accountUnread: Record<Account, number> = {
    personal: active.filter((t) => t.folder === "inbox" && t.unread).length,
    admin: pendingAdmin.adminBadge ?? ((pendingAdmin.count || 0) + (pendingAdmin.guideUnread || adminGuideUnread || 0)),
    owner: isOwner ? pendingAdmin.ownerCount || 0 : 0,
  };
  const folderCount = (f: Folder) =>
    f === "deleted" ? deletedCount : active.filter((t) => t.folder === f).length;
  const catCount = (id: string) => (id === "all" ? active.length : active.filter((t) => t.cat === id).length);
  const activeFilterLabel = (FILTERS.find((f) => f[0] === filter)?.[1] || "All").toUpperCase();

  // Open the thread in place (no navigation) and mark it read so the badge resets.
  const openThread = (id: string) => {
    setActiveGroup(null);
    setActiveId(id);
    setReply("");
    if (adminMailActive) void setAdminGuideRead(id);
    else void setRead(id, false);
  };
  const closeThread = () => {
    setActiveId(null);
    setReply("");
  };
  const openGroup = (row: GroupChatRow) => {
    setActiveId(null);
    setReply("");
    setActiveGroup({
      kind: row.kind,
      id: row.id,
      title: row.title,
      state: row.state,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      href: row.href,
      calendarDate: row.calendarDate,
    });
  };
  const closeGroup = () => setActiveGroup(null);
  const detailOpen = Boolean(activeThread || activeGroup);
  const send = async () => {
    const body = reply.trim();
    if (!body || !activeId) return;
    if (housingComposerLocked) return;
    setReply("");
    try {
      if (adminMailActive) await sendAdminGuideMessage(activeId, body);
      else await sendMessage(activeId, body);
    } catch {
      setReply(body);
    }
  };
  const navigateFromSheet = (href: string) => {
    onClose();
    setLocation(href);
  };

  return (
    <>
      <div className="inbox-overlay__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="inbox-overlay inbox-overlay--experiment"
        role="dialog"
        aria-modal="true"
        aria-label="Inbox"
        ref={panelRef}
      >
        <div className="inbox-exp-handle">
          <div className="inbox-exp-handle__bar" />
        </div>

        <div className="inbox-exp-head">
          <div className="inbox-exp-head__tabs">
            <button type="button" className={`inbox-exp-head__tab${view === "inbox" ? " is-active" : ""}`} onClick={() => setView("inbox")}>INBOX</button>
            <button type="button" className={`inbox-exp-head__tab${view === "posts" ? " is-active" : ""}`} onClick={() => setView("posts")}>POSTS</button>
            <button type="button" className={`inbox-exp-head__tab${view === "stats" ? " is-active" : ""}`} onClick={() => setView("stats")}>STATS</button>
          </div>
          <button type="button" className="inbox-exp-icon-btn" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* account tabs (inbox only) */}
        {inboxActive && !detailOpen && (
          <div className="inbox-exp-chrome-pad">
            <div className="inbox-exp-seg-tray">
              {visibleAccounts.map(([id, label]) => {
                const act = account === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`inbox-exp-seg-tray__btn${act ? " is-active" : ""}`}
                    onClick={() => setAccount(id)}
                  >
                    {accountUnread[id] > 0 && (
                      <span
                        aria-hidden="true"
                        className={`inbox-exp-seg-tray__badge inbox-exp-seg-tray__badge--${id}`}
                      >
                        {act ? (accountUnread[id] > 99 ? "99+" : accountUnread[id]) : null}
                      </span>
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* personal toolbar: received/sent/deleted + filter */}
        {personalActive && !detailOpen && (
          <div className="inbox-exp-chrome-pad inbox-exp-chrome-pad--toolbar">
            <div className="inbox-exp-seg-tray inbox-exp-seg-tray--compact">
              {([
                ["inbox", "Received"],
                ["sent", "Sent"],
                ["deleted", "Recently deleted"],
              ] as Array<[Folder, string]>).map(([f, label]) => {
                const act = folder === f;
                return (
                  <button
                    key={f}
                    type="button"
                    className={`inbox-exp-folder-pill${act ? " is-active" : ""}`}
                    onClick={() => setFolder(f)}
                  >
                    {label}
                    <span className="inbox-exp-folder-pill__count">{folderCount(f)}</span>
                  </button>
                );
              })}
            </div>
            {folder !== "deleted" && (
            <div className="inbox-exp-filter" ref={filterRef}>
              <button
                type="button"
                className="inbox-exp-filter__btn"
                onClick={() => setFilterOpen((o) => !o)}
              >
                <SlidersHorizontal size={13} />
                {activeFilterLabel}
                <ChevronDown size={11} className={`inbox-exp-filter__chev${filterOpen ? " is-open" : ""}`} />
              </button>
              {filterOpen && (
                <div className="inbox-exp-filter__menu">
                  {FILTERS.map(([id, label]) => {
                    const act = filter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`inbox-exp-filter__item${act ? " is-active" : ""}`}
                        onClick={() => {
                          setFilter(id);
                          setFilterOpen(false);
                        }}
                      >
                        <span className="inbox-exp-filter__item-label">
                          <span className={`inbox-exp-filter__dot inbox-exp-filter__dot--${id}`} />
                          {label}
                        </span>
                        <span className="inbox-exp-filter__count">{catCount(id)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* Owner-only: public design guide (hosted separately; not product logic) */}
        {inboxActive && account === "owner" && isOwner && !detailOpen && (
          <div className="inbox-exp-chrome-pad" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <a
              href="https://maxmackpdx-pride.github.io/zaylist-design-system/"
              target="_blank"
              rel="noopener noreferrer"
              className="inbox-exp-design-guide"
              data-testid="owner-design-guide-link"
            >
              <span className="inbox-exp-design-guide__label">Design guide</span>
              <span className="inbox-exp-design-guide__meta">Full system · share from the page ↗</span>
            </a>
          </div>
        )}

        {/* admin/owner queue folder tabs */}
        {inboxActive && (account === "admin" || account === "owner") && !detailOpen && (
          <div className="inbox-exp-chrome-pad inbox-exp-chrome-pad--queue">
            <div className={`inbox-exp-seg-tray inbox-exp-seg-tray--compact${account === "admin" ? " inbox-exp-seg-tray--wrap" : ""}`}>
              {(account === "admin"
                ? ([
                    ["active", "Queue"],
                    ["inbox", "Inbox"],
                    ["sent", "Sent"],
                    ["completed", "Done"],
                  ] as Array<[QueueFolder, string]>)
                : ([
                    ["active", "Active desk"],
                    ["completed", "Recently deleted"],
                  ] as Array<[QueueFolder, string]>)
              ).map(([f, label]) => {
                const act = queueFolder === f;
                const badge =
                  f === "inbox"
                    ? (pendingAdmin.guideUnread || adminGuideUnread || 0)
                    : f === "active"
                      ? (pendingAdmin.queueCount ?? pendingAdmin.count ?? 0)
                      : 0;
                const pillClass =
                  account === "admin"
                    ? "inbox-exp-queue-pill inbox-exp-queue-pill--admin"
                    : "inbox-exp-queue-pill inbox-exp-queue-pill--owner inbox-exp-queue-pill--owner-desk";
                return (
                  <button
                    key={f}
                    type="button"
                    className={`${pillClass}${act ? " is-active" : ""}`}
                    onClick={() => {
                      setQueueFolder(f);
                      setActiveId(null);
                      setReply("");
                    }}
                  >
                    {label}
                    {badge > 0 && (
                      <span className="inbox-exp-queue-pill__badge">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* body */}
        <div
          className={`inbox-overlay__scroll${detailOpen ? " inbox-overlay__scroll--detail" : ""}`}
        >
          {activeGroup ? (
            <InboxGroupChat target={activeGroup} onBack={closeGroup} />
          ) : activeThread ? (
            <ThreadDetail
              thread={activeThread}
              isAdminGuide={adminMailActive}
              reply={reply}
              onReplyChange={setReply}
              onSend={send}
              housingGate={housingThread ? housingGate : null}
              housingComposerLocked={housingComposerLocked}
              onHousingAccept={async () => {
                if (!housingGate) return;
                const r = await fetch(`/api/housing/requests/${housingGate.requestId}/accept`, { method: "POST", credentials: "include" });
                if (!r.ok) return;
                await queryClient.invalidateQueries({ queryKey: ["/api/housing/requests/by-thread", activeId] });
                await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", activeId] });
                await queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
              }}
              onHousingDecline={async () => {
                if (!housingGate) return;
                const r = await fetch(`/api/housing/requests/${housingGate.requestId}/decline`, { method: "POST", credentials: "include" });
                if (!r.ok) return;
                await queryClient.invalidateQueries({ queryKey: ["/api/housing/requests/by-thread", activeId] });
                await queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
              }}
              onHousingNudge={async () => {
                if (!housingGate) return;
                const r = await fetch(`/api/housing/requests/${housingGate.requestId}/nudge`, { method: "POST", credentials: "include" });
                if (!r.ok) return;
                await queryClient.invalidateQueries({ queryKey: ["/api/housing/requests/by-thread", activeId] });
                await queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", activeId] });
              }}
              onBack={closeThread}
              readOnly={activeThread.archived}
              onReact={async (messageId, code) => {
                if (adminMailActive) {
                  await toggleAdminGuideReaction(activeThread.id, messageId, code);
                } else {
                  await toggleReaction(activeThread.id, messageId, code);
                }
              }}
              onArchive={() => {
                if (adminMailActive) {
                  archiveAdminGuide(activeThread.id);
                  void removeAdminGuideThread(activeThread.id).catch(() => {
                    /* local archive still applied */
                  });
                } else void archive(activeThread.id);
                closeThread();
              }}
              onUnarchive={() => {
                if (adminMailActive) unarchiveAdminGuide(activeThread.id);
                else unarchive(activeThread.id);
                closeThread();
              }}
              onReveal={() => {
                if (!adminMailActive) revealSelf(activeThread.id);
              }}
              onResolveLineup={(decision) => {
                if (!adminMailActive) resolveLineup(activeThread.id, decision);
              }}
              onOpenEvent={async (eventId) => {
                try {
                  const r = await fetch(`/api/events/${eventId}`, { credentials: "include" });
                  if (!r.ok) return;
                  const evt = await r.json();
                  setOpenEvent(evt as EventListing);
                } catch {
                  /* ignore */
                }
              }}
            />
          ) : (
            <>
              {inboxActive && account === "personal" && isAdmin && (accountUnread.admin || 0) > 0 && (
                <button
                  type="button"
                  className="inbox-exp-jump inbox-exp-jump--magenta"
                  onClick={() => setAccount("admin")}
                >
                  {accountUnread.admin} item{accountUnread.admin === 1 ? "" : "s"} in the shared admin inbox →
                </button>
              )}
              {inboxActive && account === "personal" && isOwner && (pendingAdmin.ownerCount || 0) > 0 && (
                <button
                  type="button"
                  className="inbox-exp-jump inbox-exp-jump--purple"
                  onClick={() => setAccount("owner")}
                >
                  {pendingAdmin.ownerCount} item{(pendingAdmin.ownerCount || 0) === 1 ? "" : "s"} on your Owner Desk →
                </button>
              )}
              {inboxActive && account === "personal" && (
                <PersonalView
                  folder={folder}
                  filter={filter}
                  query={query}
                  showTags
                  tintUnread
                  onOpenThread={openThread}
                  onOpenGroup={openGroup}
                />
              )}
              {inboxActive && account === "admin" && (queueFolder === "inbox" || queueFolder === "sent") && (
                <AdminMessagesView
                  threads={adminThreads}
                  folder={queueFolder}
                  query={query}
                  onOpenThread={openThread}
                  markingAllRead={markingGuideAllRead}
                  onMarkAllRead={
                    queueFolder === "inbox"
                      ? () => {
                          setMarkingGuideAllRead(true);
                          void markAllAdminGuideRead().finally(() => setMarkingGuideAllRead(false));
                        }
                      : undefined
                  }
                />
              )}
              {inboxActive && account === "admin" && (queueFolder === "active" || queueFolder === "completed") && (
                <QueueView
                  mode="admin"
                  queueFolder={queueFolder}
                  guideUnread={pendingAdmin.guideUnread || adminGuideUnread || 0}
                  ownerCount={isOwner ? (pendingAdmin.ownerCount || 0) : 0}
                  onOpenGuideInbox={() => {
                    setQueueFolder("inbox");
                    setActiveId(null);
                  }}
                  onOpenOwnerDesk={isOwner ? () => {
                    setAccount("owner");
                    setQueueFolder("active");
                    setActiveId(null);
                  } : undefined}
                />
              )}
              {inboxActive && account === "owner" && (
                <QueueView mode="owner" queueFolder={queueFolder === "completed" ? "completed" : "active"} />
              )}
              {view === "posts" && <PostsView onNavigate={navigateFromSheet} />}
              {view === "stats" && <StatsView />}
            </>
          )}
        </div>

        {/* bottom search */}
        {searchVisible && !detailOpen && (
          <div className="inbox-exp-search">
            <div className="inbox-exp-search__field">
              <Search size={17} color={C.faint} />
              <input
                className="inbox-exp-search__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages"
              />
            </div>
          </div>
        )}
      </div>

      {openEvent && (
        <EventModal
          event={openEvent}
          onClose={() => setOpenEvent(null)}
          onEventUpdated={(updated) => setOpenEvent(updated as EventListing)}
        />
      )}
    </>
  );
}

const CAT_ACCENT: Record<string, string> = {
  spotted: C.magenta,
  gigs: C.purple,
  gifting: C.lime,
  sellz: C.green,
  housing: C.cyan,
  hosts: C.cyan,
  checkins: C.green,
};

type ThreadDetailProps = {
  thread: Thread;
  isAdminGuide?: boolean;
  reply: string;
  onReplyChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  readOnly?: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onReveal: () => void;
  onResolveLineup: (decision: LineupDecision) => void;
  onOpenEvent?: (eventId: number) => void;
  onReact?: (messageId: string, code: MessageReactionCode) => void | Promise<void>;
  housingGate?: HousingThreadGate | null;
  housingComposerLocked?: boolean;
  onHousingAccept?: () => void;
  onHousingDecline?: () => void;
  onHousingNudge?: () => void;
};

// Full thread view rendered in place inside the floating inbox - no navigation.
// Reading, replying, archiving, and lineup approve/deny all happen here.
function ThreadDetail({
  thread,
  isAdminGuide = false,
  reply,
  onReplyChange,
  onSend,
  onBack,
  readOnly = false,
  onArchive,
  onUnarchive,
  onReveal,
  onResolveLineup,
  onOpenEvent,
  onReact,
  housingGate = null,
  housingComposerLocked = false,
  onHousingAccept,
  onHousingDecline,
  onHousingNudge,
}: ThreadDetailProps) {
  const accent = isAdminGuide ? C.magenta : (CAT_ACCENT[thread.cat] ?? C.cyan);
  const showReveal = thread.anonymous && thread.reveal && !thread.reveal.iRevealed;
  const lineupPending = thread.lineup?.status === "PENDING" && thread.lineupRequestId != null;
  const openEventId = eventIdFromInboxContext(thread.contextType, thread.contextId);
  const housingLocked = housingComposerLocked || Boolean(housingGate && !housingGate.accepted);
  const canSend = Boolean(reply.trim()) && !housingLocked;

  return (
    <div
      className={`inbox-exp-thread${isAdminGuide ? " inbox-exp-thread--admin" : ""}`}
      style={!isAdminGuide ? ({ "--inbox-exp-accent": accent } as CSSProperties) : undefined}
    >
      <div className="inbox-exp-thread__head">
        <button type="button" className="inbox-exp-icon-btn" onClick={onBack} aria-label="Back to inbox" title="Back">
          <ChevronLeft size={18} />
        </button>
        <ThreadAvatar party={thread.party} masked={thread.anonymous} size={36} ring={thread.ring} />
        <div className="inbox-exp-thread__identity">
          <div className="inbox-exp-thread__name">{thread.name}</div>
          <div className="inbox-exp-thread__handle">{thread.handle}</div>
        </div>
        {readOnly ? (
          <button type="button" className="inbox-exp-icon-btn" onClick={onUnarchive} aria-label="Restore thread" title="Restore">
            <Archive size={16} />
          </button>
        ) : (
          <button type="button" className="inbox-exp-icon-btn" onClick={onArchive} aria-label="Archive thread" title="Archive">
            <Archive size={16} />
          </button>
        )}
      </div>

      {thread.subject && <div className="inbox-exp-thread__subject">{thread.subject}</div>}

      {openEventId != null && onOpenEvent && (
        <div className="inbox-exp-thread__pad">
          <button type="button" className="inbox-exp-thread__cta" onClick={() => onOpenEvent(openEventId)}>
            Open event card →
          </button>
        </div>
      )}

      {showReveal && (
        <div className="inbox-exp-thread__panel">
          <div className="inbox-exp-thread__panel-copy">
            This thread is anonymous. Reveal yourself to share who you are.
          </div>
          <button type="button" className="inbox-exp-thread__btn-reveal" onClick={onReveal}>
            Reveal myself
          </button>
        </div>
      )}

      {lineupPending && (
        <div className="inbox-exp-thread__panel inbox-exp-thread__panel--lineup">
          <div className="inbox-exp-thread__panel-copy inbox-exp-thread__panel-copy--actions">
            Lineup request{thread.lineup?.role ? ` · ${thread.lineup.role}` : ""}
            {thread.lineup?.eventTitle ? ` for ${thread.lineup.eventTitle}` : ""}
          </div>
          <div className="inbox-exp-thread__panel-actions">
            <button type="button" className="inbox-exp-thread__btn-approve" onClick={() => onResolveLineup("APPROVED")}>
              Approve
            </button>
            <button type="button" className="inbox-exp-thread__btn-decline" onClick={() => onResolveLineup("DENIED")}>
              Decline
            </button>
          </div>
        </div>
      )}

      {housingGate?.awaiting && housingGate.role === "requester" && (
        <div className="inbox-exp-thread__panel">
          <div className="inbox-exp-thread__panel-copy">Waiting on them</div>
          {housingGate.canNudge && onHousingNudge ? (
            <button type="button" className="inbox-exp-thread__cta" onClick={onHousingNudge}>
              Send one nudge
            </button>
          ) : (
            <div className="inbox-exp-thread__panel-copy">The chat opens if they say yes. One nudge after 48 hours.</div>
          )}
        </div>
      )}

      {housingGate?.pending && housingGate.role === "recipient" && (
        <div className="inbox-exp-thread__panel inbox-exp-thread__panel--lineup">
          <div className="inbox-exp-thread__panel-copy inbox-exp-thread__panel-copy--actions">
            Asked to chat about this HAÜZ post. Nothing opens until you accept.
          </div>
          <div className="inbox-exp-thread__panel-actions">
            <button type="button" className="inbox-exp-thread__btn-approve" onClick={onHousingAccept}>
              Accept
            </button>
            <button type="button" className="inbox-exp-thread__btn-decline" onClick={onHousingDecline}>
              Not right now
            </button>
          </div>
        </div>
      )}

      <div className="inbox-exp-thread__messages">
        {thread.messages.map((m) => (
          <MessageBubbleWithReactions
            key={m.id}
            messageId={m.id}
            body={m.body}
            self={m.self}
            reactions={m.reactions}
            disabled={readOnly || !onReact}
            timeLabel={m.at}
            onToggle={async (code) => {
              if (!onReact) return;
              await onReact(m.id, code);
            }}
          />
        ))}
      </div>

      {!readOnly && !housingLocked && (
        <div className="inbox-exp-composer">
          <textarea
            className="inbox-exp-composer__input"
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
          />
          <button
            type="button"
            className={`inbox-exp-composer__send${canSend ? " is-ready" : ""}`}
            onClick={onSend}
            disabled={!canSend}
          >
            Send
          </button>
        </div>
      )}
      {!readOnly && housingLocked && (
        <div className="inbox-exp-thread__readonly">
          {housingGate?.role === "requester" ? "Waiting on them to accept" : "Accept to open the chat"}
        </div>
      )}
      {readOnly && (
        <div className="inbox-exp-thread__readonly">
          Archived thread · tap restore to move back to your inbox
        </div>
      )}
    </div>
  );
}
