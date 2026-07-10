import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Maximize2, X, SlidersHorizontal, ChevronDown, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useInboxThreads } from "@/components/inbox/useInboxThreads";
import type { Folder } from "@/components/inbox/types";
import { C, MONO, DISPLAY, BODY } from "@/components/inbox/panel/sheet";
import PersonalView from "@/components/inbox/panel/PersonalView";
import QueueView from "@/components/inbox/panel/QueueView";
import PostsView from "@/components/inbox/panel/PostsView";
import StatsView from "@/components/inbox/panel/StatsView";

type View = "inbox" | "posts" | "stats";
type Account = "personal" | "admin" | "owner";

const ACCOUNTS: Array<[Account, string, string]> = [
  ["personal", "Personal", C.limeSoft],
  ["admin", "Admin", C.magenta],
  ["owner", "Owner", C.purple],
];

const FILTERS: Array<[string, string, string]> = [
  ["all", "All", C.lime],
  ["spotted", "Spotted", C.magenta],
  ["gigs", "Gigs", C.purple],
  ["hosts", "Hosts", C.cyan],
  ["checkins", "Check-ins", C.green],
];

export default function InboxOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("inbox");
  const [account, setAccount] = useState<Account>("personal");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const { threads } = useInboxThreads(null);
  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const isOwner = Boolean(user?.username === "tuckerhelms" || user?.isSuperAdmin);

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
    if (open) return;
    setView("inbox");
    setAccount("personal");
    setFolder("inbox");
    setFilter("all");
    setFilterOpen(false);
    setQuery("");
  }, [open]);

  if (!open || !user) return null;

  const inboxActive = view === "inbox";
  const personalActive = inboxActive && account === "personal";
  const searchVisible = view !== "stats";
  const visibleAccounts = ACCOUNTS.filter(([id]) => id === "personal" || (id === "admin" && isAdmin) || (id === "owner" && isOwner));

  const active = threads.filter((t) => !t.archived);
  const folderCount = (f: Folder) => active.filter((t) => t.folder === f).length;
  const catCount = (id: string) => (id === "all" ? active.length : active.filter((t) => t.cat === id).length);
  const activeFilterLabel = (FILTERS.find((f) => f[0] === filter)?.[1] || "All").toUpperCase();

  const openThread = (id: string) => {
    onClose();
    setLocation(`/inbox?thread=${encodeURIComponent(id)}`);
  };
  const openFull = () => {
    onClose();
    setLocation("/inbox");
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
        style={{ background: C.sheet, border: `1px solid ${C.border}`, padding: 0 }}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={iconBtn} onClick={openFull} aria-label="Open full inbox" title="Open full inbox">
              <Maximize2 size={15} />
            </button>
            <button style={iconBtn} onClick={onClose} aria-label="Close" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* account tabs (inbox only) */}
        {inboxActive && (
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
                    {!act && <span style={{ width: 7, height: 7, borderRadius: 999, background: color, flex: "none", boxShadow: `0 0 7px ${color}` }} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* personal toolbar: received/sent + filter */}
        {personalActive && (
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
        <div className="inbox-overlay__scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 12px", minHeight: 0 }}>
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
        </div>

        {/* bottom search */}
        {searchVisible && (
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
