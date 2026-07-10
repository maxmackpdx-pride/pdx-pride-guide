import type { ReactNode } from "react";
import hubLogo from "@/assets/hub-logo.jpg";
import { SearchInput } from "@/components/ds";
import CalmModeToggle from "@/components/CalmModeToggle";
import type { HubSection } from "./types";
import {
  HubIconAdmin,
  HubIconClaims,
  HubIconEvents,
  HubIconFeed,
  HubIconPeople,
  HubIconPost,
  HubIconProfile,
  HubIconSettings,
  HubIconWerk,
} from "./hubIcons";
import "./hub-v2.css";

type NavItem = {
  key: HubSection;
  label: string;
  icon: ReactNode;
  teamOnly?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { key: "feed", label: "Feed", icon: <HubIconFeed /> },
  { key: "post", label: "Post", icon: <HubIconPost /> },
  { key: "profile", label: "Profile", icon: <HubIconProfile /> },
  { key: "events", label: "Events", icon: <HubIconEvents /> },
  { key: "people", label: "People", icon: <HubIconPeople /> },
  { key: "settings", label: "Settings", icon: <HubIconSettings /> },
];

const ADMIN_NAV: NavItem[] = [
  { key: "admin", label: "Overview", icon: <HubIconAdmin /> },
  { key: "tbl-events", label: "All Events", icon: <HubIconEvents /> },
  { key: "tbl-users", label: "All Users", icon: <HubIconProfile /> },
  { key: "tbl-werk", label: "Pride Werk", icon: <HubIconWerk /> },
  { key: "tbl-promoters", label: "Promoters", icon: <HubIconPeople /> },
  { key: "tbl-claims", label: "Venue Claims", icon: <HubIconClaims /> },
  { key: "tbl-team", label: "My Team", icon: <HubIconPeople />, teamOnly: true },
];

export type HubV2ShellProps = {
  section: HubSection;
  onSectionChange: (section: HubSection) => void;
  isAdmin: boolean;
  canManageTeam?: boolean;
  children: ReactNode;
  rightRail: ReactNode;
  calmMode: boolean;
  onToggleCalm: () => void;
  onLogout: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function HubV2Shell({
  section,
  onSectionChange,
  isAdmin,
  canManageTeam = false,
  children,
  rightRail,
  calmMode,
  searchValue = "",
  onSearchChange,
}: HubV2ShellProps) {
  const adminNav = ADMIN_NAV.filter((item) => !item.teamOnly || canManageTeam);

  return (
    <div
      className={`hub-root${calmMode ? " calm-mode" : ""}`}
      style={{
        minHeight: "100vh",
        background: "var(--panel-ink)",
        color: "var(--board-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "color-mix(in srgb, var(--panel-ink) 93%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--panel-border)",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "11px 24px",
          }}
        >
          <img
            src={hubLogo}
            alt="PDX Pride Guide"
            width={36}
            height={36}
            style={{ borderRadius: 8, flex: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span className="ld" />
            <span className="kick" style={{ letterSpacing: ".22em" }}>
              Your Hub
            </span>
          </div>
          <div style={{ flex: 1, maxWidth: 360, margin: "0 auto" }}>
            <SearchInput
              placeholder="Search the guide..."
              size="sm"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          <CalmModeToggle minimal />
        </div>
      </div>

      <div className="grid3">
        <aside className="lrail hs" style={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
          {MAIN_NAV.map((item) => (
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

          {isAdmin && (
            <>
              <div className="kick" style={{ letterSpacing: ".2em", padding: "20px 12px 8px" }}>
                More · Admin only
              </div>
              {adminNav.map((item) => (
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
            </>
          )}
        </aside>

        <main style={{ minWidth: 0 }}>{children}</main>

        <aside className="rrail hs" style={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
          {rightRail}
        </aside>
      </div>
    </div>
  );
}