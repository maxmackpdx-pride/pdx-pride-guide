import { ArrowRight } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, RefreshCw, SlidersHorizontal, ChevronDown, Search, ChevronLeft, Archive } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import * as Tabs from "@radix-ui/react-tabs";
import HeaderDropdown from "@/components/ui/header-dropdown";
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
import "@/components/inbox/inbox.css";
import "@/components/inbox/message-reactions.css";
import "@/components/inbox/inbox-dropdown.css";

type View = "inbox" | "posts" | "stats";
type Account = "personal" | "admin" | "owner";

type InboxOverlayProps = {
  open: boolean;
  trigger: RefObject<HTMLElement | null>;
  onClose: () => void;
  initialView?: View;
  initialAccount?: Account;
  initialThreadId?: string | null;
};

function InboxPanelHeader({ onClose, onRefresh, refreshing = false, guest = false }: { onClose: () => void; onRefresh?: () => void; refreshing?: boolean; guest?: boolean }) {
  return <header className="hub-reader__header">
    <div className="hub-reader__heading">
      <div><h2>INBOX</h2><p>Your conversations.</p></div>
      <div className="hub-reader__utilities">
        {onRefresh && <button type="button" className="hub-reader__icon" aria-label="Refresh inbox" disabled={refreshing} onClick={onRefresh}><RefreshCw size={19} aria-hidden /></button>}
        <button type="button" className="hub-reader__icon" aria-label="Close inbox" onClick={onClose}><X size={22} aria-hidden /></button>
      </div>
    </div>
    <Tabs.List className="hub-reader__tabs inbox-dropdown__tabs" aria-label="Inbox views">
      {(["inbox", "posts", "stats"] as const).map(value => <Tabs.Trigger className="hub-reader__tab" value={value} key={value} disabled={guest && value !== "inbox"}>{value}</Tabs.Trigger>)}
    </Tabs.List>
  </header>;
}

const ACCOUNTS: Array<[Account, string, string]> = [
  ["personal", "Personal", C.limeSoft],
  ["admin", "Staff", C.cyan],
  ["owner", "Owner", C.purple],
];

const FILTERS: Array<[string, string, string]> = [
  ["all", "All", C.lime],
  ["spotted", "MIZZED CONNECTION", C.magenta],
  ["gigs", "GIGZ", C.purple],
  ["gifting", "GIFTZ", C.lime],
  ["sellz", "SELLZ", C.green],
  ["housing", "My Hoüz", C.cyan],
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

export default function InboxOverlay({ open, trigger, onClose, initialView, initialAccount, initialThreadId }: InboxOverlayProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const inboxRefreshing = useIsFetching({ queryKey: ["/api/messages/inbox"] });
  const [view, setView] = useState<View>("inbox");
  const [account, setAccount] = useState<Account>("personal");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [queueWorkFilter, setQueueWorkFilter] = useState("all");
  const [queueFolder, setQueueFolder] = useState<QueueFolder>("active");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openEvent, setOpenEvent] = useState<EventListing | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<InboxGroupChatTarget | null>(null);
  const [reply, setReply] = useState("");
  const [showAuth, setShowAuth] = useState(false);
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

  // After the reset above, so a thread passed in (the /inbox?thread= door, a
  // notification row) is the one that opens.
  useEffect(() => {
    if (!open || !initialThreadId) return;
    setView("inbox");
    setAccount("personal");
    setActiveId(initialThreadId);
  }, [open, initialThreadId]);

  useEffect(() => {
    setQueueFolder("active");
    setActiveGroup(null);
  }, [account]);

  useEffect(() => {
    if (view !== "inbox") setActiveGroup(null);
  }, [view]);

  if (!open) return null;

  // Local preview shares the same frame and keeps real messages behind sign-in.
  if (!user) {
    if (!isLocalDemo()) return null;
    return <>
      <HeaderDropdown open={open} onOpenChange={next => { if (!next) onClose(); }} trigger={trigger} triggerSelector="[data-inbox-open-trigger]" id="inbox-panel" title="Inbox" description="Your messages, posts, and stats." className="inbox-overlay inbox-dropdown">
        <Tabs.Root value={view} onValueChange={value => setView(value as View)} className="inbox-dropdown__reader">
          <InboxPanelHeader onClose={onClose} guest />
          <Tabs.Content value={view} className="hub-reader__state">
            <h3>Your conversations are here.</h3>
            <p>Sign in to read messages, manage your posts, and see your stats.</p>
            <button type="button" className="hub-reader__action pdx-glass-rebind" data-testid="inbox-demo-login" onClick={() => setShowAuth(true)}>Log in / Join</button>
          </Tabs.Content>
        </Tabs.Root>
      </HeaderDropdown>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="login" />}
    </>;
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
      <HeaderDropdown open={open} onOpenChange={next => { if (!next) onClose(); }} trigger={trigger} triggerSelector="[data-inbox-open-trigger]" id="inbox-panel" title="Inbox" description="Your messages, posts, stats, and account tools." className="inbox-overlay inbox-dropdown" actionContext={account === "owner" ? "owner" : account === "admin" ? "admin" : "hub"}>
        <Tabs.Root value={view} onValueChange={value => setView(value as View)} className="inbox-dropdown__reader">
        <InboxPanelHeader onClose={onClose} refreshing={inboxRefreshing > 0} onRefresh={() => {
          for (const key of ["/api/messages/inbox", "/api/messages/sent", "/api/messages/unread-count", "/api/admin/pending-count"]) void queryClient.invalidateQueries({ queryKey: [key] });
        }} />

        {/* account tabs (inbox only) */}
        {inboxActive && !detailOpen && visibleAccounts.length > 1 && (
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
              <span className="inbox-exp-design-guide__meta">Full system · share from the page <ArrowUpRight size={14} aria-hidden="true" /></span>
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
                    ["completed", "Done"],
                  ] as Array<[QueueFolder, string]>)
              ).map(([f, label]) => {
                const act = queueFolder === f;
                const badge =
                  f === "inbox"
                    ? (pendingAdmin.guideUnread || adminGuideUnread || 0)
                    : f === "active"
                      ? (account === "owner" ? pendingAdmin.ownerCount || 0 : pendingAdmin.queueCount ?? pendingAdmin.count ?? 0)
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
        <Tabs.Content value={view} data-view={view} className={`inbox-overlay__scroll${detailOpen ? " inbox-overlay__scroll--detail" : ""}`}>

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
                  {accountUnread.admin} item{accountUnread.admin === 1 ? "" : "s"} in the shared admin inbox <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
              {inboxActive && account === "personal" && isOwner && (pendingAdmin.ownerCount || 0) > 0 && (
                <button
                  type="button"
                  className="inbox-exp-jump inbox-exp-jump--purple"
                  onClick={() => setAccount("owner")}
                >
                  {pendingAdmin.ownerCount} item{(pendingAdmin.ownerCount || 0) === 1 ? "" : "s"} on your Owner Desk <ArrowRight size={14} aria-hidden="true" />
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
                  initialWorkFilter={queueWorkFilter}
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
              {view === "stats" && <StatsView onOpenQueue={isAdmin ? (status) => {setQueueWorkFilter(status);setView("inbox");setAccount("admin");setQueueFolder("active");} : undefined} />}
            </>
          )}
        </Tabs.Content>

        {/* bottom search */}
        {searchVisible && !detailOpen && (
          <div className="inbox-exp-search">
            <div className="inbox-exp-search__field">
              <Search size={17} color={C.faint} />
              <input
                className="inbox-exp-search__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search messages"
                placeholder="Search messages"
              />
            </div>
          </div>
        )}
        </Tabs.Root>
      </HeaderDropdown>

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
            Open event card <ArrowRight size={14} aria-hidden="true" />
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
            Asked to chat about this My Hoüz post. Nothing opens until you accept.
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
