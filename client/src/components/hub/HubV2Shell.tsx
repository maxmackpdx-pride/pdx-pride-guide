import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Inbox } from "lucide-react";
import type { HubSection } from "./types";
import { hubAdminHref, hubAdminNavItems } from "@/lib/hubAdminNav";
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
 * Single hub frame for member + admin.
 * Same left rail, same type, same “Return to Pride Guide”.
 * MEMBER | ADMIN only swaps which nav list is shown — not a second website.
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
  const [location] = useLocation();
  const { openSheet } = useInboxSheet();
  const memberNav = MEMBER_NAV.filter((item) => !item.posterOnly || canPostToFeed);
  const adminNav = hubAdminNavItems(canManageTeam);

  const isAdminChrome =
    chromeMode === "admin"
    || section === "admin"
    || section.startsWith("tbl-");

  const adminTabHref = (() => {
    if (section.startsWith("tbl-") || section === "admin") return hubAdminHref(section);
    return "/admin?tab=overview";
  })();

  const showRight = rightRail != null;

  return (
    <div
      className={`hub-root hub-root--unified${calmMode ? " calm-mode" : ""}${isAdminChrome ? " hub-root--admin" : ""}`}
      style={{
        minHeight: "100vh",
        background: "var(--panel-ink)",
        color: "var(--board-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div className="hub-v2-rainbow" aria-hidden="true" />

      <div className={showRight ? "grid3" : "grid2"}>
        <aside className="lrail hs hub-v2-lrail" aria-label="Hub navigation">
          <Link href="/" className="hub-v2-home" aria-label="Return to Pride Guide home">
            <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
            <span>Return to Pride Guide</span>
          </Link>

          {isAdmin && (
            <div className="hub-v2-mode" role="group" aria-label="Hub mode">
              <Link
                href="/dashboard"
                className={`hub-v2-mode-btn${!isAdminChrome ? " is-active is-member" : ""}`}
              >
                Member
              </Link>
              <Link
                href={adminTabHref}
                className={`hub-v2-mode-btn${isAdminChrome ? " is-active is-admin" : ""}`}
              >
                Admin
              </Link>
            </div>
          )}

          <div className="hub-v2-kicker">{isAdminChrome ? "Admin" : "Your hub"}</div>

          <nav className="hub-v2-nav" aria-label={isAdminChrome ? "Admin sections" : "Member sections"}>
            {!isAdminChrome && (
              <>
                {memberNav.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSectionChange(item.key)}
                    className={`navi${section === item.key ? " on" : ""}`}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="navi"
                  onClick={() => {
                    if (location === "/inbox" || location.startsWith("/inbox?")) return;
                    openSheet({ view: "inbox", account: "personal" });
                  }}
                >
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
                    onClick={() => onSectionChange(item.section)}
                    className={`navi${section === item.section ? " on" : ""}`}
                  >
                    {ADMIN_ICONS[item.section] ?? <HubIconAdmin size={18} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="navi"
                  onClick={() => openSheet({ view: "inbox", account: "admin" })}
                >
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
    </div>
  );
}
