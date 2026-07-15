import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { ChevronLeft, Inbox } from "lucide-react";
import { Link } from "wouter";
import type { HubSection } from "./types";
import { hubAdminNavItems } from "@/lib/hubAdminNav";
import { useInboxSheet } from "@/context/InboxSheetContext";
import {
  HubIconAdmin,
  HubIconClaims,
  HubIconEvents,
  HubIconFeed,
  HubIconPeople,
  HubIconProfile,
  HubIconSettings,
  HubIconWerk,
} from "./hubIcons";
import {
  MOBILE_NAV_DISMISS,
  dismissMobileNavOverlays,
  type MobileNavDismissDetail,
} from "@/lib/mobileNavDismiss";
import HubNextRsvpTile from "./HubNextRsvpTile";
import "./hub-v2.css";

const DRAWER_TAP_SLOP_PX = 4;
const DRAWER_FLICK_PX = 40;

type NavItem = {
  key: HubSection;
  label: string;
  icon: ReactNode;
  posterOnly?: boolean;
};

const MEMBER_NAV: NavItem[] = [
  { key: "feed", label: "Feed", icon: <HubIconFeed /> },
  { key: "profile", label: "Profile", icon: <HubIconProfile /> },
  { key: "events", label: "Events", icon: <HubIconEvents /> },
  { key: "people", label: "People", icon: <HubIconPeople /> },
  { key: "settings", label: "Settings", icon: <HubIconSettings /> },
];

const ADMIN_ICONS: Partial<Record<HubSection, ReactNode>> = {
  admin: <HubIconAdmin size={18} />,
  "tbl-events": <HubIconEvents size={18} />,
  "tbl-users": <HubIconProfile size={18} />,
  "tbl-werk": <HubIconWerk size={18} />,
  "tbl-promoters": <HubIconPeople size={18} />,
  "tbl-claims": <HubIconClaims size={18} />,
  "tbl-team": <HubIconPeople size={18} />,
};

export type HubChromeMode = "member" | "admin";

export type HubV2ShellProps = {
  section: HubSection;
  onSectionChange: (section: HubSection) => void;
  isAdmin: boolean;
  isPrimaryOwner?: boolean;
  canPostToFeed?: boolean;
  canManageTeam?: boolean;
  /** When true, left rail shows admin tools (same chrome as member — only items change). */
  chromeMode?: HubChromeMode;
  /** Pending queue badge for Messages / admin keys. */
  pendingCount?: number;
  children: ReactNode;
  rightRail?: ReactNode | null;
  calmMode: boolean;
  onToggleCalm: () => void;
  onLogout: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Extra block at bottom of left rail (e.g. push status on admin tools). */
  sideExtra?: ReactNode;
  /** Optional top-of-main toolbar (refresh, etc.) — stays inside the same shell. */
  mainToolbar?: ReactNode;
};

/**
 * Shared look for member hub and admin tools, but modes stay separate:
 * - Member = /dashboard only (member nav only)
 * - Admin = /admin only (admin nav only)
 * Desktop: left rail. Mobile: bottom drawer. Never mix rails by section alone.
 */
export default function HubV2Shell({
  section,
  onSectionChange,
  isAdmin,
  canPostToFeed = false,
  canManageTeam = false,
  chromeMode,
  pendingCount = 0,
  children,
  rightRail = null,
  calmMode,
  sideExtra,
  mainToolbar,
}: HubV2ShellProps) {
  const [location, navigate] = useLocation();
  const { openSheet } = useInboxSheet();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [drawerBounceHint, setDrawerBounceHint] = useState(false);
  const [drawerDragging, setDrawerDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const collapseHRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragBaseYRef = useRef(0);
  const dragMovedRef = useRef(false);
  const dragActiveRef = useRef(false);
  const drawerOpenRef = useRef(false);
  const memberNav = MEMBER_NAV.filter((item) => !item.posterOnly || canPostToFeed);
  const adminNav = hubAdminNavItems(canManageTeam);

  // Route / chromeMode only — do not flip the rail when section is "admin" on /dashboard.
  const isAdminChrome = chromeMode === "admin" || location.startsWith("/admin");
  const isHubRoute = location === "/dashboard" || location.startsWith("/admin");
  const routeMenuMode: HubChromeMode = isAdminChrome ? "admin" : "member";
  const [drawerMenuMode, setDrawerMenuMode] = useState<HubChromeMode>(routeMenuMode);

  drawerOpenRef.current = mobileDrawerOpen;

  const setDrawerY = useCallback((px: number | null) => {
    const el = drawerRef.current;
    if (!el) return;
    if (px == null) {
      el.style.removeProperty("--drawer-y");
      return;
    }
    el.style.setProperty("--drawer-y", `${px}px`);
  }, []);

  /**
   * Closed offset + drag clamp = sheet height only (grab is outside the measurement).
   * CSS seeds --drawer-collapse to calc(100% - grab) so the pill peeks pre-measure;
   * once measured we overwrite with exact sheet px so closed rest and clamp match.
   */
  const measureDrawerCollapse = useCallback(() => {
    const sheet = sheetRef.current;
    const drawer = drawerRef.current;
    if (!sheet || !drawer) return;
    const sheetH = sheet.offsetHeight;
    if (sheetH <= 0) return; // keep CSS seed until layout is ready
    collapseHRef.current = sheetH;
    drawer.style.setProperty("--drawer-collapse", `${sheetH}px`);
  }, []);

  const goMemberMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileDrawerOpen(false);
    // One navigation only — never stack navigate + onSectionChange + replaceState
    // (that could thrash history when leaving /admin).
    if (isAdminChrome) {
      navigate("/dashboard");
      return;
    }
    if (section !== "feed") {
      onSectionChange("feed");
    }
  };

  const goAdminMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileDrawerOpen(false);
    if (isAdminChrome) return;
    navigate("/admin?tab=overview");
  };

  // Mobile drawer: mode tabs switch the menu only — navigate when a section is picked.
  const goDrawerMemberMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrawerMenuMode("member");
    if (isAdminChrome) {
      navigate("/dashboard");
    }
  };

  const goDrawerAdminMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrawerMenuMode("admin");
  };

  const pickSection = (next: HubSection) => {
    onSectionChange(next);
    setMobileDrawerOpen(false);
  };

  const openPersonalInbox = () => {
    if (location === "/inbox" || location.startsWith("/inbox?")) return;
    openSheet({ view: "inbox", account: "personal" });
    setMobileDrawerOpen(false);
  };

  const openAdminInbox = () => {
    openSheet({ view: "inbox", account: "admin" });
    setMobileDrawerOpen(false);
  };

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [section, isAdminChrome]);

  useEffect(() => {
    if (!mobileDrawerOpen) {
      setDrawerMenuMode(routeMenuMode);
    }
  }, [mobileDrawerOpen, routeMenuMode]);

  // Hub-only mobile peek: bounce the grab pill once on hub routes (gated; idle elsewhere).
  useEffect(() => {
    if (!isHubRoute) {
      setDrawerBounceHint(false);
      return;
    }
    if (calmMode) return;
    const mq = window.matchMedia("(max-width: 720px)");
    if (!mq.matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setDrawerBounceHint(true);
    const t = window.setTimeout(() => setDrawerBounceHint(false), 920);
    return () => window.clearTimeout(t);
  }, [location, isHubRoute, calmMode]);

  useEffect(() => {
    const lock = mobileDrawerOpen || drawerDragging;
    document.body.classList.toggle("hub-v2-drawer-open", lock);
    return () => document.body.classList.remove("hub-v2-drawer-open");
  }, [mobileDrawerOpen, drawerDragging]);

  useEffect(() => {
    const onDismiss = (event: Event) => {
      const except = (event as CustomEvent<MobileNavDismissDetail>).detail?.except;
      if (except !== "hub-drawer") setMobileDrawerOpen(false);
    };
    window.addEventListener(MOBILE_NAV_DISMISS, onDismiss);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, onDismiss);
  }, []);

  // Measure sheet height for drag clamp (mount + resize + content changes).
  useEffect(() => {
    measureDrawerCollapse();
    const onResize = () => measureDrawerCollapse();
    window.addEventListener("resize", onResize);
    const sheet = sheetRef.current;
    let ro: ResizeObserver | null = null;
    if (sheet && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureDrawerCollapse());
      ro.observe(sheet);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [measureDrawerCollapse, drawerMenuMode, isAdmin, sideExtra]);

  // Remeasure after open/close so the collapse clamp matches laid-out sheet height.
  useEffect(() => {
    if (drawerDragging) return;
    requestAnimationFrame(() => measureDrawerCollapse());
  }, [mobileDrawerOpen, drawerDragging, measureDrawerCollapse]);

  const setMobileDrawerOpenSafe = useCallback((open: boolean) => {
    setMobileDrawerOpen((prev) => {
      if (open && !prev) dismissMobileNavOverlays("hub-drawer");
      return open;
    });
  }, []);

  const setDragging = useCallback((on: boolean) => {
    drawerRef.current?.classList.toggle("is-dragging", on);
    setDrawerDragging(on);
  }, []);

  /** Snap to open/closed: drop is-dragging, commit open state, then clear inline --drawer-y so CSS rest wins and transition runs from the finger. */
  const finishDrawerGesture = useCallback(
    (open: boolean) => {
      setDragging(false);
      setMobileDrawerOpenSafe(open);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (dragActiveRef.current) return;
          setDrawerY(null);
        });
      });
    },
    [setDragging, setMobileDrawerOpenSafe, setDrawerY],
  );

  const toggleMobileDrawer = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setMobileDrawerOpen((open) => {
      if (open) return false;
      dismissMobileNavOverlays("hub-drawer");
      return true;
    });
  };

  const onGrabPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button != null && e.button !== 0) return;
    measureDrawerCollapse();
    const collapse = collapseHRef.current;
    if (collapse <= 0) return;

    dragStartYRef.current = e.clientY;
    dragBaseYRef.current = drawerOpenRef.current ? 0 : collapse;
    dragMovedRef.current = false;
    dragActiveRef.current = true;
    setDragging(true);
    setDrawerY(dragBaseYRef.current);

    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (!dragActiveRef.current) return;
      const dy = ev.clientY - dragStartYRef.current;
      if (Math.abs(dy) > DRAWER_TAP_SLOP_PX) dragMovedRef.current = true;
      const ty = Math.max(0, Math.min(collapseHRef.current, dragBaseYRef.current + dy));
      setDrawerY(ty);
    };

    const onUp = (ev: PointerEvent) => {
      dragActiveRef.current = false;
      try {
        target.releasePointerCapture?.(ev.pointerId);
      } catch {
        /* already released */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      const dy = ev.clientY - dragStartYRef.current;
      const moved = dragMovedRef.current;

      if (!moved) {
        // Tap: leave rest state to the click handler (toggle). Keep dragMoved false.
        setDragging(false);
        setDrawerY(null);
        return;
      }

      const collapseNow = collapseHRef.current || collapse;
      const currentY = Math.max(0, Math.min(collapseNow, dragBaseYRef.current + dy));
      let open: boolean;
      if (dy < -DRAWER_FLICK_PX) open = true;
      else if (dy > DRAWER_FLICK_PX) open = false;
      else open = currentY < collapseNow / 2;

      // Keep dragMoved true so the synthetic click after pointerup does not re-toggle.
      finishDrawerGesture(open);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const showRight = rightRail != null;

  const renderModeToggle = (
    menuMode: HubChromeMode,
    onMember: (e: React.MouseEvent) => void,
    onAdmin: (e: React.MouseEvent) => void,
  ) =>
    isAdmin ? (
      <div className="hub-v2-mode" role="group" aria-label="Hub mode">
        <button
          type="button"
          onClick={onMember}
          className={`hub-v2-mode-btn${menuMode === "member" ? " is-active is-member" : ""}`}
          aria-pressed={menuMode === "member"}
        >
          Member
        </button>
        <button
          type="button"
          onClick={onAdmin}
          className={`hub-v2-mode-btn${menuMode === "admin" ? " is-active is-admin" : ""}`}
          aria-pressed={menuMode === "admin"}
        >
          Admin
        </button>
      </div>
    ) : null;

  const renderNav = (menuMode: HubChromeMode) => (
    <nav className="hub-v2-nav" aria-label={menuMode === "admin" ? "Admin sections" : "Member sections"}>
      {menuMode === "member" && (
        <>
          {memberNav.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => pickSection(item.key)}
              className={`navi${section === item.key ? " on" : ""}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
          <button type="button" className="navi" onClick={openPersonalInbox}>
            <Inbox size={18} strokeWidth={2.2} aria-hidden />
            <span style={{ flex: 1 }}>Messages</span>
            {pendingCount > 0 && isAdmin && (
              <span className="hub-v2-pill">{pendingCount > 99 ? "99+" : pendingCount}</span>
            )}
          </button>
        </>
      )}

      {menuMode === "admin" && (
        <>
          {adminNav.map((item) => (
            <button
              key={item.section}
              type="button"
              onClick={() => pickSection(item.section)}
              className={`navi${section === item.section ? " on" : ""}`}
            >
              {ADMIN_ICONS[item.section] ?? <HubIconAdmin size={18} />}
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
          <button type="button" className="navi" onClick={openAdminInbox}>
            <Inbox size={18} strokeWidth={2.2} aria-hidden />
            <span style={{ flex: 1 }}>Queue & messages</span>
            {pendingCount > 0 && (
              <span className="hub-v2-pill hub-v2-pill--pink">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </button>
        </>
      )}
    </nav>
  );

  const desktopModeToggle = renderModeToggle(routeMenuMode, goMemberMode, goAdminMode);
  const drawerModeToggle = renderModeToggle(drawerMenuMode, goDrawerMemberMode, goDrawerAdminMode);
  const desktopNav = renderNav(routeMenuMode);
  const drawerNav = renderNav(drawerMenuMode);

  const mobileDrawer =
    typeof document !== "undefined"
      ? createPortal(
          <>
            {(mobileDrawerOpen || drawerDragging) && (
              <button
                type="button"
                className="hub-v2-drawer-backdrop"
                aria-label="Close hub menu"
                onClick={() => setMobileDrawerOpenSafe(false)}
              />
            )}
            <div
              ref={drawerRef}
              className={[
                "hub-v2-drawer",
                mobileDrawerOpen ? "is-open" : "",
                drawerDragging ? "is-dragging" : "",
                drawerBounceHint && isHubRoute ? "is-bounce-hint" : "",
                calmMode ? "calm-mode" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-hub-drawer
            >
              {/* Grab first so translateY(sheetH) leaves the handle peeking when closed */}
              <button
                type="button"
                className="hub-v2-drawer__grab"
                aria-expanded={mobileDrawerOpen}
                aria-controls="hub-v2-drawer-panel"
                aria-label={mobileDrawerOpen ? "Close hub menu" : "Open hub menu"}
                onPointerDown={onGrabPointerDown}
                onClick={toggleMobileDrawer}
              >
                <span className="hub-v2-drawer__grip" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                {/* Pill always; label only during hub bounce (closed) or while open — never inflate the peek */}
                {isHubRoute && (mobileDrawerOpen || drawerBounceHint) && (
                  <span className="hub-v2-drawer__hint">
                    {mobileDrawerOpen ? "SWIPE DOWN TO CLOSE" : "SWIPE UP FOR MENU"}
                  </span>
                )}
              </button>
              <div
                ref={sheetRef}
                id="hub-v2-drawer-panel"
                className="hub-v2-drawer__sheet"
                role="dialog"
                aria-label="Hub menu"
                aria-hidden={!mobileDrawerOpen}
              >
                {drawerModeToggle}
                <div className="hub-v2-kicker hub-v2-kicker--drawer">
                  {drawerMenuMode === "admin" ? "Admin" : "Your hub"}
                </div>
                {drawerNav}
                {sideExtra && <div className="hub-v2-side-extra hub-v2-side-extra--drawer">{sideExtra}</div>}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div
      className={`hub-root hub-root--unified${calmMode ? " calm-mode" : ""}${isAdminChrome ? " hub-root--admin" : ""}${mobileDrawerOpen ? " hub-root--drawer-open" : ""}`}
    >
      <div className="hub-v2-rainbow" aria-hidden="true" />

      <div className={showRight ? "grid3" : "grid2"}>
        <aside className="lrail hs hub-v2-lrail hub-v2-lrail--desktop" aria-label="Hub navigation">
          <Link href="/" className="hub-v2-home" aria-label="Return to Pride Guide home">
            <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
            <span>Return to Pride Guide</span>
          </Link>

          {desktopModeToggle}

          <div className="hub-v2-kicker">{routeMenuMode === "admin" ? "Admin" : "Your hub"}</div>

          {desktopNav}

          <div className="hub-v2-spacer" />

          {sideExtra && <div className="hub-v2-side-extra">{sideExtra}</div>}
        </aside>

        <main className="hub-v2-main" style={{ minWidth: 0 }}>
          {mainToolbar && <div className="hub-v2-main-toolbar">{mainToolbar}</div>}
          {!isAdminChrome && <HubNextRsvpTile />}
          {children}
        </main>

        {showRight && (
          <aside className="rrail hs" style={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
            {rightRail}
          </aside>
        )}
      </div>

      {mobileDrawer}
    </div>
  );
}