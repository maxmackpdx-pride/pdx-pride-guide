import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ds/Button";
import SafetyGuide from "@/components/SafetyGuide";
import ThreadAvatar from "./ThreadAvatar";
import { useInboxThreads } from "./useInboxThreads";
import { quickRepliesFor } from "./quickReplies";
import type { Category, Folder, Thread } from "./types";
import {
  ArchiveIcon,
  BackIcon,
  CheckIcon,
  ChevronDownIcon,
  ClearIcon,
  FilterIcon,
  MailIcon,
  MoonIcon,
  SearchIcon,
  TrashIcon,
} from "./icons";
import { LongPressReactable } from "./MessageReactions";
import "./inbox.css";
import "./message-reactions.css";

/* ---- Tweaks (were DC editor props; here they are component props) ---- */
export interface InboxProps {
  /** Layout density. */
  density?: "comfortable" | "compact";
  /** Thread rendering: chat bubbles vs. flat left-edge rows. */
  bubbleStyle?: "bubbles" | "flat";
  /** Chrome accent color for primary chrome (segments, primary chips, send). */
  chromeAccent?: "lime" | "cyan" | "pink";
}

const CATC: Record<Category, string> = {
  spotted: "var(--pink)",
  gigs: "var(--cyan)",
  gifting: "var(--neon-yellow, #ccff00)",
  housing: "var(--panel-cyan, #19e3ff)",
  hosts: "var(--amber)",
  checkins: "var(--green)",
};
const BADGE: Record<Category, string> = {
  spotted: "Mizzed Connection",
  gigs: "Gig",
  gifting: "GiftZ",
  housing: "THE HAÜZ",
  hosts: "Host",
  checkins: "Check-in",
};
const CATS: Array<[string, string]> = [
  ["all", "All"],
  ["spotted", "Mizzed Connection"],
  ["gigs", "Gigz"],
  ["gifting", "GiftZ"],
  ["hosts", "Hosts"],
  ["checkins", "Check-ins"],
];

export interface InboxShellProps extends InboxProps {
  initialThreadId?: string | null;
  onThreadChange?: (threadId: string | null) => void;
  /** Force the single-column (list ↔ thread) layout regardless of viewport
   *  width. Used when the shell is embedded in a narrow floating panel. */
  forceNarrow?: boolean;
  /** Hide the "Zaylist / Messages / Calm" brand bar. Used when the shell
   *  is embedded in the floating overlay, which supplies its own header. */
  hideBrandHeader?: boolean;
  /** Minimal chrome for the floating overlay: no list heading/segments row,
   *  filters collapse into a dropdown, and search moves to the bottom. */
  compact?: boolean;
}

export function InboxShell({
  density = "comfortable",
  bubbleStyle = "bubbles",
  chromeAccent = "lime",
  initialThreadId = null,
  onThreadChange,
  forceNarrow,
  hideBrandHeader = false,
  compact = false,
}: InboxShellProps) {
  const [activeId, setActiveId] = useState<string | null>(initialThreadId ?? null);
  const {
    threads,
    loading,
    sendMessage,
    toggleReaction,
    setRead,
    archive,
    remove,
    revealSelf,
    resolveLineup,
    blockMember,
  } = useInboxThreads(activeId);

  const [folder, setFolder] = useState<Folder>("inbox");
  const [cat, setCat] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [isNarrow, setIsNarrow] = useState(false);
  const [calm, setCalm] = useState(false);

  const msgRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const scrollMsgs = () => {
    const el = msgRef.current;
    if (el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filtersOpen]);

  useEffect(() => {
    if (forceNarrow !== undefined) {
      setIsNarrow(forceNarrow);
      return;
    }
    const mq = window.matchMedia("(max-width: 860px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [forceNarrow]);

  useEffect(() => {
    setActiveId(initialThreadId ?? null);
    if (initialThreadId) setMobileView("thread");
  }, [initialThreadId]);

  /* ---- Actions ---- */
  const open = (id: string) => {
    setActiveId(id);
    onThreadChange?.(id);
    setMobileView("thread");
    setReply("");
    setRead(id, false);
    scrollMsgs();
  };
  const switchFolder = (f: Folder) => {
    setFolder(f);
    setActiveId(null);
    onThreadChange?.(null);
    setMobileView("list");
    setReply("");
    setCat("all");
    setQuery("");
    setUnreadOnly(false);
  };
  const back = () => setMobileView("list");
  const onArchive = (id: string) => {
    archive(id);
    if (activeId === id) {
      setActiveId(null);
      onThreadChange?.(null);
      setMobileView("list");
    }
  };
  const onDelete = (id: string) => {
    remove(id);
    if (activeId === id) {
      setActiveId(null);
      onThreadChange?.(null);
      setMobileView("list");
    }
  };
  const toggleRead = (id: string, unread: boolean) => setRead(id, unread);
  const send = (text?: string) => {
    const body = (text ?? reply).trim();
    if (!body || !activeId) return;
    setReply("");
    sendMessage(activeId, body)
      .then(scrollMsgs)
      .catch(() => setReply(body));
  };

  /* ---- Derived (ported from Inbox.dc.html renderVals) ---- */
  const dense = density === "compact";
  const flat = bubbleStyle === "flat";
  const accentKey = chromeAccent;
  const accent =
    ({ lime: "var(--lime)", cyan: "var(--cyan)", pink: "var(--pink)" } as Record<string, string>)[
      accentKey
    ] || "var(--lime)";
  const cc = (c: string) => (calm ? "var(--text-lo)" : CATC[c as Category] || "var(--text-lo)");
  const rowPad = dense ? "11px 12px 11px 12px" : "14px 14px 14px 13px";
  const rowAvatar = dense ? 38 : 44;
  const sidebarW = dense ? 322 : 360;

  const showSidebar = !isNarrow || mobileView === "list";
  const showThread = !isNarrow || mobileView === "thread";

  const inFolder = threads.filter((t) => t.folder === folder && !t.archived);
  const inboxUnread = threads.filter(
    (t) => t.folder === "inbox" && !t.archived && t.unread,
  ).length;
  const sentCount = threads.filter((t) => t.folder === "sent" && !t.archived).length;
  const inboxCount = threads.filter((t) => t.folder === "inbox" && !t.archived).length;

  const chipStyle = (sel: boolean, color: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: dense ? "6px 10px" : "7px 12px",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: ".05em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    border: "2px solid " + (sel ? color : "var(--border-strong)"),
    borderRadius: "4px",
    color: sel ? color : "var(--text-mid)",
    background: "transparent",
    cursor: "pointer",
    boxShadow: sel && !calm ? "0 0 14px -5px " + color : "none",
    flex: "0 0 auto",
  });
  const chips = CATS.map(([k, label]) => {
    const sel = cat === k;
    const color = k === "all" ? accent : cc(k);
    const count = inFolder.filter((t) => (k === "all" ? true : t.cat === k)).length;
    return { key: k, label, count, style: chipStyle(sel, color), onToggle: () => setCat(k) };
  });

  const q = query.trim().toLowerCase();
  let vis = inFolder.slice();
  if (cat !== "all") vis = vis.filter((t) => t.cat === cat);
  if (unreadOnly) vis = vis.filter((t) => t.unread);
  if (q)
    vis = vis.filter((t) => {
      const last = t.messages[t.messages.length - 1];
      return (
        t.name +
        " " +
        t.subject +
        " " +
        t.contextLabel +
        " " +
        (last ? last.body : "")
      )
        .toLowerCase()
        .includes(q);
    });

  const isRevealed = (t: Thread) =>
    t.anonymous ? !!(t.reveal && t.reveal.iRevealed && t.reveal.theyRevealed) : true;

  const rowStyle = (active: boolean, color: string): CSSProperties => ({
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: rowPad,
    cursor: "pointer",
    borderBottom: "1px solid var(--border-faint)",
    borderLeft: "3px solid " + (active ? color : "transparent"),
    background: active
      ? calm
        ? "var(--surface-card-hover)"
        : "color-mix(in srgb, " + color + " 10%, var(--ink-900))"
      : "transparent",
  });
  const badgePill = (color: string): CSSProperties => ({
    display: "inline-block",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.56rem",
    letterSpacing: ".09em",
    textTransform: "uppercase",
    color,
    border: "1px solid " + color,
    borderRadius: "3px",
    padding: "2px 6px 1px",
    lineHeight: 1,
    flex: "0 0 auto",
  });

  const visibleThreads = vis.map((t) => {
    const masked = t.anonymous && !isRevealed(t);
    const last = t.messages[t.messages.length - 1];
    const color = cc(t.cat);
    const active = t.id === activeId;
    return {
      id: t.id,
      displayName: masked ? "Anonymous" : t.name,
      avatarName: masked ? "?" : t.name,
      ring: masked ? ("none" as const) : t.ring,
      avatarSize: rowAvatar,
      party: t.party,
      subject: t.subject,
      at: t.at,
      badge: BADGE[t.cat],
      unread: t.unread,
      preview: (last && last.self ? "You: " : "") + (last ? last.body : ""),
      rowStyle: rowStyle(active, color),
      nameStyle: {
        fontFamily: "var(--font-body)",
        fontWeight: t.unread ? 700 : 600,
        fontSize: "0.92rem",
        color: t.unread ? "var(--text-hi)" : "var(--text-mid)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      } as CSSProperties,
      badgeStyle: badgePill(color),
      dotStyle: {
        position: "absolute",
        top: "-2px",
        right: "-2px",
        width: "11px",
        height: "11px",
        borderRadius: "999px",
        background: calm ? "var(--text-lo)" : color,
        border: "2px solid var(--ink-900)",
      } as CSSProperties,
      readLabel: t.unread ? "Mark read" : "Mark unread",
    };
  });

  const at = threads.find((t) => t.id === activeId && !t.archived) || null;
  const hasActive = !!at;
  const amasked = at ? at.anonymous && !isRevealed(at) : false;
  const headerColor = at ? cc(at.cat) : accent;

  const messages = at
    ? at.messages.map((m) => {
        const other = !m.self;
        const senderLabel = m.self ? "You" : amasked ? "Anonymous" : at.name;
        const avatarName = m.self ? "You" : amasked ? "?" : at.name;
        const ring = m.self ? ("progress" as const) : amasked ? ("none" as const) : at.ring;
        const color = cc(at.cat);
        let wrapStyle: CSSProperties;
        let bubbleStyle: CSSProperties;
        let metaStyle: CSSProperties;
        let showAvatar: boolean;
        if (flat) {
          showAvatar = false;
          wrapStyle = { display: "block" };
          bubbleStyle = {
            background: m.self ? "var(--ink-900)" : "var(--ink-850)",
            borderLeft: "3px solid " + (m.self ? accent : color),
            borderRadius: "0 6px 6px 0",
            padding: "10px 14px",
          };
          metaStyle = {
            fontSize: "0.62rem",
            color: "var(--text-faint)",
            marginBottom: "5px",
            fontFamily: "var(--font-mono)",
            letterSpacing: ".04em",
          };
        } else {
          showAvatar = other;
          wrapStyle = {
            display: "flex",
            gap: "9px",
            alignItems: "flex-end",
            flexDirection: m.self ? "row-reverse" : "row",
          };
          bubbleStyle = {
            maxWidth: "78%",
            background: m.self
              ? calm
                ? "var(--ink-750)"
                : "color-mix(in srgb, " + accent + " 15%, var(--ink-800))"
              : "var(--ink-800)",
            border:
              "1px solid " +
              (m.self
                ? calm
                  ? "var(--border-strong)"
                  : "color-mix(in srgb, " + accent + " 42%, transparent)"
                : "var(--border-default)"),
            borderLeft: m.self ? undefined : "2px solid " + color,
            borderRadius: m.self ? "8px 8px 3px 8px" : "8px 8px 8px 3px",
            padding: "9px 13px",
          };
          metaStyle = {
            fontSize: "0.62rem",
            color: "var(--text-faint)",
            marginBottom: "4px",
            fontFamily: "var(--font-mono)",
            letterSpacing: ".04em",
          };
        }
        return {
          id: m.id,
          body: m.body,
          at: m.at,
          self: m.self,
          reactions: m.reactions,
          senderLabel,
          party: m.party,
          ring,
          showAvatar,
          wrapStyle,
          bubbleStyle,
          metaStyle,
        };
      })
    : [];

  // Missed-connection reveal panel
  let panelSpotted = false;
  let revealText = "";
  let revealTone = "var(--pink)";
  let showReveal = false;
  if (at && at.cat === "spotted" && at.reveal) {
    panelSpotted = true;
    const rv = at.reveal;
    const both = rv.iRevealed && rv.theyRevealed;
    revealTone = both ? "var(--lime)" : "var(--pink)";
    revealText = both
      ? "You both revealed. Real names are showing in this thread."
      : rv.iRevealed
        ? "You revealed yourself. Waiting for them to reveal before names appear."
        : "Missed connections stay anonymous until you both choose to reveal.";
    showReveal = !both && !rv.iRevealed;
  }

  // Lineup approve/deny panel
  let panelLineup = false;
  let lineupText = "";
  let lineupPending = false;
  let lineupResolved = "";
  if (at && at.cat === "gigs" && at.lineup) {
    panelLineup = true;
    const st = at.lineup.status;
    lineupPending = st === "PENDING";
    lineupText = at.name + " wants to be " + at.lineup.role + " on " + at.lineup.eventTitle + ".";
    lineupResolved =
      st === "APPROVED"
        ? "Lineup approved. They have been added to the event."
        : st === "DENIED"
          ? "Request declined."
          : "";
  }
  const lineupResolvedShow = panelLineup && !lineupPending && lineupResolved !== "";

  const quickReplies = at ? quickRepliesFor(at.cat).map((label) => ({ label })) : [];

  /* ---- Layout styles ---- */
  const paneBase: CSSProperties = { height: "100%", minHeight: 0, display: "flex", flexDirection: "column" };
  const bodyStyle: CSSProperties = isNarrow
    ? { flex: "1", minHeight: 0, display: "block", position: "relative" }
    : {
        flex: "1",
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: sidebarW + "px minmax(0,1fr)",
        gridTemplateRows: "minmax(0,1fr)",
      };
  const sidebarStyle: CSSProperties = {
    ...paneBase,
    display: showSidebar ? "flex" : "none",
    borderRight: isNarrow ? "none" : "2px solid var(--border-default)",
    background: "var(--ink-900)",
  };
  const threadStyle: CSSProperties = {
    ...paneBase,
    display: showThread ? "flex" : "none",
    background: "var(--bg-stage)",
  };

  const unreadPill: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.6rem",
    letterSpacing: ".06em",
    textTransform: "uppercase",
    background: calm ? "var(--text-lo)" : accent,
    color: "var(--text-inverse)",
    padding: "3px 8px 2px",
    borderRadius: "999px",
    lineHeight: 1,
  };
  const seg = (active: boolean): CSSProperties => ({
    flex: "1",
    textAlign: "center",
    padding: dense ? "7px 6px" : "9px 8px",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.78rem",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    cursor: "pointer",
    borderRadius: "3px",
    border: "2px solid " + (active ? accent : "var(--border-strong)"),
    color: active ? (calm ? "var(--text-hi)" : "var(--text-inverse)") : "var(--text-lo)",
    background: active ? (calm ? "var(--surface-card-hover)" : accent) : "transparent",
  });
  const segCount: CSSProperties = {
    opacity: 0.7,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    fontSize: "0.7rem",
  };
  const activeCatLabel = CATS.find(([k]) => k === cat)?.[1] ?? "All";
  const filtersActive = cat !== "all" || unreadOnly || folder === "sent";
  const compactBar: CSSProperties = {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 12px",
    borderBottom: "1px solid var(--border-faint)",
    background: "var(--ink-1000)",
  };
  const compactFiltersBtn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.74rem",
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: filtersActive ? "var(--text-inverse)" : "var(--text-hi)",
    background: filtersActive ? accent : "var(--surface-inset)",
    border: "1px solid " + (filtersActive ? accent : "var(--border-default)"),
    borderRadius: "999px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const compactFiltersPopover: CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    zIndex: 20,
    width: "min(280px, 78vw)",
    padding: "14px",
    background: "var(--surface-card)",
    border: "2px solid var(--border-default)",
    borderRadius: "16px",
    boxShadow: "var(--shadow-lg, 0 14px 30px rgba(0,0,0,.42))",
  };
  const compactGroupLabel: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--text-meta)",
    margin: "0 0 8px",
  };
  const compactSearchWrap: CSSProperties = {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    height: "46px",
    margin: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
    padding: "0 15px",
    background: "var(--surface-inset)",
    border: "1px solid var(--border-default)",
    borderRadius: "999px",
  };
  const calmBtn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 12px 6px",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    cursor: "pointer",
    borderRadius: "6px",
    border: "1px solid " + (calm ? "var(--cyan)" : "var(--border-strong)"),
    color: calm ? "var(--cyan)" : "var(--text-lo)",
    background: "transparent",
  };

  let emptyText = "";
  if (visibleThreads.length === 0) {
    emptyText = q
      ? "No messages match your search."
      : unreadOnly
        ? "You are all caught up. No unread messages."
        : folder === "sent"
          ? "You have not sent anything yet."
          : "This filter is empty.";
  }

  // keep the message pane pinned to the latest message
  const lastMsgId = messages.length ? messages[messages.length - 1].id : null;
  useEffect(scrollMsgs, [activeId, lastMsgId]);


  if (loading) {
    return (
      <div
        className="inbox-shell-root inbox-shell-root--deep-glass"
        style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <div className="inbox-shell-loading">Loading messages…</div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div
      className="inbox-shell-root inbox-shell-root--deep-glass"
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        color: "var(--text-body)",
        fontFamily: "var(--font-body)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      {!hideBrandHeader && (
        <>
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "11px clamp(14px,4vw,26px)",
              background: "var(--ink-1000)",
              borderBottom: "1px solid var(--border-faint)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--ink-1000)",
                  border: "1px solid var(--border-default)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 14px -4px var(--lime)",
                  flex: "0 0 auto",
                }}
              >
                <span
                  className="pdx-display"
                  style={{ fontSize: "0.72rem", lineHeight: 0.82, color: "var(--lime)", textAlign: "center" }}
                >
                  Z
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  className="pdx-display"
                  style={{ fontSize: "1.02rem", lineHeight: 1.05, letterSpacing: ".01em", whiteSpace: "nowrap" }}
                >
                  Zaylist
                </div>
                <div className="pdx-kicker" style={{ fontSize: "0.56rem", color: "var(--text-faint)", marginTop: "2px" }}>
                  Messages
                </div>
              </div>
            </div>
            <button
              className="pxCalmBtn"
              onClick={() => setCalm((c) => !c)}
              style={calmBtn}
              title="Calm mode dims the neon"
            >
              <MoonIcon size={15} />
              Calm
            </button>
          </div>
          <hr className="pdx-seam" style={{ margin: 0, flex: "0 0 auto" }} />
        </>
      )}

      {/* Body */}
      <div style={bodyStyle}>
        {/* Sidebar */}
        <aside style={sidebarStyle}>
          {compact && (
            <div style={compactBar}>
              <div ref={filtersRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  style={compactFiltersBtn}
                  aria-expanded={filtersOpen}
                  aria-label="Filters"
                >
                  <FilterIcon size={14} />
                  {folder === "sent" ? "Sent" : "Received"}
                  {cat !== "all" ? ` · ${activeCatLabel}` : ""}
                  {unreadOnly ? " · Unread" : ""}
                  <ChevronDownIcon size={14} />
                </button>
                {filtersOpen && (
                  <div style={compactFiltersPopover}>
                    <div style={compactGroupLabel}>Folder</div>
                    <div style={{ display: "flex", gap: "7px", marginBottom: "13px" }}>
                      <button onClick={() => switchFolder("inbox")} style={seg(folder === "inbox")}>
                        Received <span style={segCount}>{inboxCount}</span>
                      </button>
                      <button onClick={() => switchFolder("sent")} style={seg(folder === "sent")}>
                        Sent <span style={segCount}>{sentCount}</span>
                      </button>
                    </div>
                    <div style={compactGroupLabel}>Category</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "13px" }}>
                      {chips.map((c) => (
                        <button key={c.key} onClick={c.onToggle} style={c.style}>
                          {c.label}
                          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.66rem", opacity: 0.8 }}>
                            {c.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setUnreadOnly((u) => !u)} style={chipStyle(unreadOnly, accent)}>
                      <span
                        style={{ width: "8px", height: "8px", borderRadius: "999px", background: "currentColor", flex: "0 0 auto" }}
                      />
                      Unread only
                    </button>
                  </div>
                )}
              </div>
              {inboxUnread > 0 && <span style={unreadPill}>{inboxUnread} new</span>}
            </div>
          )}
          {!compact && (
          <div
            style={{
              flex: "0 0 auto",
              padding: "15px 15px 13px",
              borderBottom: "2px solid var(--border-default)",
              background: "var(--ink-900)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "9px", minWidth: 0, marginBottom: "13px" }}>
              <span className="pdx-display" style={{ fontSize: "1.45rem", lineHeight: 1.05, letterSpacing: ".01em" }}>
                Inbox
              </span>
              {inboxUnread > 0 && <span style={unreadPill}>{inboxUnread} new</span>}
            </div>
            <div style={{ display: "flex", gap: "7px", marginBottom: "12px" }}>
              <button onClick={() => switchFolder("inbox")} style={seg(folder === "inbox")}>
                Received{" "}
                <span style={{ opacity: 0.7, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem" }}>
                  {inboxCount}
                </span>
              </button>
              <button onClick={() => switchFolder("sent")} style={seg(folder === "sent")}>
                Sent{" "}
                <span style={{ opacity: 0.7, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.7rem" }}>
                  {sentCount}
                </span>
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                height: "44px",
                padding: "0 14px",
                background: "var(--surface-inset)",
                border: "2px solid var(--border-default)",
                borderRadius: "999px",
              }}
            >
              <span style={{ color: "var(--text-meta)", display: "flex" }}>
                <SearchIcon size={17} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages"
                style={{
                  flex: "1 1 auto",
                  minWidth: 0,
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "var(--text-hi)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.92rem",
                }}
              />
              {!!query && (
                <button className="pxClearBtn" onClick={() => setQuery("")} aria-label="Clear search">
                  <ClearIcon size={15} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "7px", overflowX: "auto", marginTop: "12px", paddingBottom: "2px" }}>
              {chips.map((c) => (
                <button key={c.key} onClick={c.onToggle} style={c.style}>
                  {c.label}
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.66rem", opacity: 0.8 }}>
                    {c.count}
                  </span>
                </button>
              ))}
              <button onClick={() => setUnreadOnly((u) => !u)} style={chipStyle(unreadOnly, accent)}>
                <span
                  style={{ width: "8px", height: "8px", borderRadius: "999px", background: "currentColor", flex: "0 0 auto" }}
                />
                Unread
              </button>
            </div>
          </div>
          )}

          <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
            {visibleThreads.length === 0 && (
              <div style={{ padding: "44px 22px", textAlign: "center", color: "var(--text-lo)" }}>
                <div className="pdx-display" style={{ fontSize: "1.1rem", color: "var(--text-mid)", marginBottom: "6px" }}>
                  Nothing here
                </div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{emptyText}</div>
              </div>
            )}
            {visibleThreads.map((t) => (
              <div key={t.id} className="pxRow" onClick={() => open(t.id)} style={t.rowStyle}>
                <span style={{ position: "relative", flex: "0 0 auto" }}>
                  <ThreadAvatar party={t.party} masked={t.displayName === "Anonymous"} size={t.avatarSize} ring={t.ring} />
                  {t.unread && <span style={t.dotStyle} />}
                </span>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    <span style={t.nameStyle}>{t.displayName}</span>
                    <span
                      style={{ fontSize: "0.68rem", color: "var(--text-faint)", flex: "0 0 auto", fontFamily: "var(--font-mono)" }}
                    >
                      {t.at}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.86rem",
                      color: "var(--text-mid)",
                      margin: "2px 0 5px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.subject}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span style={t.badgeStyle}>{t.badge}</span>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-lo)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                      }}
                    >
                      {t.preview}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "0 0 auto" }}>
                  <button
                    className="pxIconBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(t.id);
                    }}
                    title="Archive"
                    aria-label="Archive"
                    style={{ width: "30px", height: "30px", color: "var(--text-faint)", ["--hc" as string]: "var(--cyan)" } as CSSProperties}
                  >
                    <ArchiveIcon size={14} />
                  </button>
                  <button
                    className="pxIconBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(t.id, !threads.find((x) => x.id === t.id)!.unread);
                    }}
                    title={t.readLabel}
                    aria-label={t.readLabel}
                    style={{ width: "30px", height: "30px", color: "var(--text-faint)", ["--hc" as string]: "var(--lime)" } as CSSProperties}
                  >
                    <CheckIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {compact && (
            <div style={compactSearchWrap}>
              <span style={{ color: "var(--text-meta)", display: "flex", flex: "0 0 auto" }}>
                <SearchIcon size={17} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages"
                style={{
                  flex: "1 1 auto",
                  minWidth: 0,
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "var(--text-hi)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.92rem",
                }}
              />
              {!!query && (
                <button className="pxClearBtn" onClick={() => setQuery("")} aria-label="Clear search">
                  <ClearIcon size={15} />
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Thread pane */}
        <section style={threadStyle}>
          {hasActive && at && (
            <>
              <div
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderBottom: "2px solid var(--border-default)",
                  background: "var(--ink-900)",
                }}
              >
                {isNarrow && (
                  <button
                    className="pxIconBtn"
                    onClick={back}
                    aria-label="Back to list"
                    style={{ width: "36px", height: "36px", color: "var(--text-mid)", flex: "0 0 auto", ["--hc" as string]: "var(--cyan)" } as CSSProperties}
                  >
                    <BackIcon size={18} />
                  </button>
                )}
                <ThreadAvatar party={at.party} masked={amasked} size={46} ring={amasked ? "none" : at.ring} />
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      className="pdx-display"
                      style={{ fontSize: "1.15rem", lineHeight: 1.12, whiteSpace: "nowrap", color: "var(--text-hi)" }}
                    >
                      {amasked ? "Anonymous" : at.name}
                    </span>
                    <span style={badgePill(headerColor)}>{BADGE[at.cat]}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)", marginTop: "3px" }}>
                    {at.handle}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-mid)", marginTop: "6px" }}>{at.subject}</div>
                  <div style={{ fontSize: "0.72rem", color: headerColor, marginTop: "3px", fontWeight: 600 }}>
                    {at.contextLabel}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "7px", flex: "0 0 auto" }}>
                  <button
                    className="pxIconBtn"
                    onClick={() => toggleRead(at.id, !at.unread)}
                    title={at.unread ? "Mark read" : "Mark unread"}
                    aria-label={at.unread ? "Mark read" : "Mark unread"}
                    style={{ width: "34px", height: "34px", color: "var(--text-lo)", ["--hc" as string]: "var(--lime)" } as CSSProperties}
                  >
                    <CheckIcon size={16} />
                  </button>
                  <button
                    className="pxIconBtn"
                    onClick={() => onArchive(at.id)}
                    title="Archive"
                    aria-label="Archive"
                    style={{ width: "34px", height: "34px", color: "var(--text-lo)", ["--hc" as string]: "var(--cyan)" } as CSSProperties}
                  >
                    <ArchiveIcon size={16} />
                  </button>
                  <button
                    className="pxIconBtn"
                    onClick={() => onDelete(at.id)}
                    title="Delete thread"
                    aria-label="Delete thread"
                    style={{ width: "34px", height: "34px", color: "var(--text-lo)", ["--hc" as string]: "var(--red)" } as CSSProperties}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Missed-connection reveal panel */}
              {panelSpotted && (
                <div
                  style={{
                    flex: "0 0 auto",
                    margin: "12px 16px 0",
                    padding: "12px 14px",
                    background: "var(--ink-850)",
                    border: "1px solid " + (calm ? "var(--border-strong)" : revealTone),
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "0.66rem",
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: calm ? "var(--text-lo)" : revealTone,
                      marginBottom: "6px",
                    }}
                  >
                    Anonymous thread
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-mid)", lineHeight: 1.5 }}>{revealText}</div>
                  {showReveal && (
                    <div style={{ marginTop: "10px" }}>
                      <Button accent="pink" size="sm" onClick={() => revealSelf(at.id)}>
                        Reveal myself
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Lineup approve/deny panel */}
              {panelLineup && (
                <div
                  style={{
                    flex: "0 0 auto",
                    margin: "12px 16px 0",
                    padding: "12px 14px",
                    background: "var(--ink-850)",
                    border: "2px solid " + (calm ? "var(--border-strong)" : "var(--cyan)"),
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "0.66rem",
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: calm ? "var(--text-lo)" : "var(--cyan)",
                      marginBottom: "6px",
                    }}
                  >
                    Lineup request
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "var(--text-mid)", lineHeight: 1.5 }}>{lineupText}</div>
                  {lineupPending && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "11px" }}>
                      <Button accent="lime" size="sm" arrow onClick={() => resolveLineup(at.id, "APPROVED")}>
                        Approve lineup
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resolveLineup(at.id, "DENIED")}>
                        Decline
                      </Button>
                    </div>
                  )}
                  {lineupResolvedShow && (
                    <div
                      style={{
                        marginTop: "9px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: at.lineup && at.lineup.status === "APPROVED" ? "var(--lime)" : "var(--text-lo)",
                      }}
                    >
                      {lineupResolved}
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: "0 16px" }}>
                <SafetyGuide
                  context="conversation"
                  compact
                  onBlock={!amasked && at.party.username && at.party.username !== "Anonymous"
                    ? () => { void blockMember(at.party.username!).then(done => {
                        if (done) {
                          setActiveId(null);
                          onThreadChange?.(null);
                          setMobileView("list");
                        }
                      }); }
                    : undefined}
                />
              </div>

              {/* Messages */}
              <div
                ref={msgRef}
                style={{
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "16px 16px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                }}
              >
                {messages.map((m) => (
                  <div key={m.id} style={m.wrapStyle}>
                    {m.showAvatar && <ThreadAvatar party={m.party} masked={amasked} size={28} ring={m.ring} />}
                    <LongPressReactable
                      messageId={m.id}
                      self={m.self}
                      reactions={m.reactions}
                      onToggle={async (code) => {
                        if (!at) return;
                        await toggleReaction(at.id, m.id, code);
                      }}
                    >
                      <div style={m.bubbleStyle}>
                        <div style={m.metaStyle}>
                          {m.senderLabel} · {m.at}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--text-mid)", lineHeight: 1.5 }}>
                          {m.body}
                        </div>
                      </div>
                    </LongPressReactable>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div
                style={{
                  flex: "0 0 auto",
                  borderTop: "2px solid var(--border-default)",
                  padding: "11px 14px 13px",
                  background: "var(--ink-900)",
                }}
              >
                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "9px" }}>
                  {quickReplies.map((qr) => (
                    <button key={qr.label} className="pxQuick" onClick={() => send(qr.label)}>
                      {qr.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <textarea
                    className="pxComposer"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply"
                    rows={1}
                    style={{
                      flex: "1 1 auto",
                      minHeight: "44px",
                      maxHeight: "120px",
                      resize: "none",
                      padding: "11px 13px",
                      background: "var(--surface-inset)",
                      border: "2px solid var(--border-default)",
                      borderRadius: "8px",
                      color: "var(--text-hi)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      lineHeight: 1.4,
                    }}
                  />
                  <Button accent={accentKey} size="md" arrow onClick={() => send()} disabled={!reply.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}

          {!hasActive && (
            <div
              style={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px 28px",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  background: "var(--ink-1000)",
                  border: "1px solid var(--border-default)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 22px -6px var(--cyan)",
                }}
              >
                <MailIcon size={28} />
              </div>
              <div className="pdx-display" style={{ fontSize: "1.6rem", color: "var(--text-hi)" }}>
                Pick a thread
              </div>
              <div style={{ maxWidth: "38ch", color: "var(--text-lo)", fontSize: "0.9rem", lineHeight: 1.55 }}>
                Private threads from Mizzed Connection, Gigz, event hosts, and check-ins land here. Choose one on the left to read and
                reply.
              </div>
              <hr className="pdx-rainbow-rule" style={{ width: "120px", margin: "6px 0 0" }} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
