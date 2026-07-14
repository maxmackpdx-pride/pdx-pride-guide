import { useEffect, useState, type ReactNode } from "react";
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
import "./hub-v2.css";

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
  const memberNav = MEMBER_NAV.filter((item) => !item.posterOnly || canPostToFeed);
  const adminNav = hubAdminNavItems(canManageTeam);

  // Route / chromeMode only — do not flip the rail when section is "admin" on /dashboard.
  const isAdminChrome = chromeMode === "admin" || location.startsWith("/admin");

  const goMemberMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileDrawerOpen(false);
    // One navigation only — never stack navigate + onSectionChange + replaceState
    // (that could thrash history when leaving /admin).
    if (isAdminChrome) {
      navigate("/dashboard");
      return;
    }
    onSectionChange("feed");
  };

  const goAdminMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileDrawerOpen(false);
    if (isAdminChrome) return;
    navigate("/admin?tab=overview");
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
    document.body.classList.toggle("hub-v2-drawer-open", mobileDrawerOpen);
    return () => document.body.classList.remove("hub-v2-drawer-open");
  }, [mobileDrawerOpen]);

  const showRight = rightRail != null;

  const modeToggle = isAdmin ? (
    <div className="hub-v2-mode" role="group" aria-label="Hub mode">
      <button
        type="button"
        onClick={goMemberMode}
        className={`hub-v2-mode-btn${!isAdminChrome ? " is-active is-member" : ""}`}
        aria-pressed={!isAdminChrome}
      >
        Member
      </button>
      <button
        type="button"
        onClick={goAdminMode}
        className={`hub-v2-mode-btn${isAdminChrome ? " is-active is-admin" : ""}`}
        aria-pressed={isAdminChrome}
      >
        Admin
      </button>
    </div>
  ) : null;

  const navButtons = (
    <nav className="hub-v2-nav" aria-label={isAdminChrome ? "Admin sections" : "Member sections"}>
      {!isAdminChrome && (
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

      {isAdminChrome && (
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

  const mobileDrawer =
    typeof document !== "undefined"
      ? createPortal(
          <>
            {mobileDrawerOpen && (
              <button
                type="button"
                className="hub-v2-drawer-backdrop"
                aria-label="Close hub menu"
                onClick={() => setMobileDrawerOpen(false)}
              />
            )}
            <div
              className={`hub-v2-drawer${mobileDrawerOpen ? " is-open" : ""}`}
              data-hub-drawer
            >
              <div id="hub-v2-drawer-panel" className="hub-v2-drawer__sheet" role="dialog" aria-label="Hub menu" aria-hidden={!mobileDrawerOpen}>
                {modeToggle}
                <div className="hub-v2-kicker hub-v2-kicker--drawer">
                  {isAdminChrome ? "Admin" : "Your hub"}
                </div>
                {navButtons}
                {sideExtra && <div className="hub-v2-side-extra hub-v2-side-extra--drawer">{sideExtra}</div>}
              </div>
              <button
                type="button"
                className="hub-v2-drawer__grab"
                aria-expanded={mobileDrawerOpen}
                aria-controls="hub-v2-drawer-panel"
                aria-label={mobileDrawerOpen ? "Close hub menu" : "Open hub menu"}
                onClick={() => setMobileDrawerOpen((open) => !open)}
              >
                <span className="hub-v2-drawer__pill" aria-hidden />
              </button>
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

          {modeToggle}

          <div className="hub-v2-kicker">{isAdminChrome ? "Admin" : "Your hub"}</div>

          {navButtons}

          <div className="hub-v2-spacer" />

          {sideExtra && <div className="hub-v2-side-extra">{sideExtra}</div>}
        </aside>

        <main className="hub-v2-main" style={{ minWidth: 0 }}>
          {mainToolbar && <div className="hub-v2-main-toolbar">{mainToolbar}</div>}
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