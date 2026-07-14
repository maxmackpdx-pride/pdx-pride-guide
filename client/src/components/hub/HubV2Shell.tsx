import type { ReactNode } from "react";
import type { HubSection } from "./types";
import HubAdminFolder from "./HubAdminFolder";
import {
  HubIconEvents,
  HubIconFeed,
  HubIconPeople,
  HubIconProfile,
  HubIconSettings,
} from "./hubIcons";
import "./hub-v2.css";

type NavItem = {
  key: HubSection;
  label: string;
  icon: ReactNode;
  teamOnly?: boolean;
  posterOnly?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { key: "feed", label: "Feed", icon: <HubIconFeed /> },
  { key: "profile", label: "Profile", icon: <HubIconProfile /> },
  { key: "events", label: "Events", icon: <HubIconEvents /> },
  { key: "people", label: "People", icon: <HubIconPeople /> },
  { key: "settings", label: "Settings", icon: <HubIconSettings /> },
];

export type HubV2ShellProps = {
  section: HubSection;
  onSectionChange: (section: HubSection) => void;
  isAdmin: boolean;
  isPrimaryOwner?: boolean;
  canPostToFeed?: boolean;
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
  isPrimaryOwner = false,
  canPostToFeed = false,
  canManageTeam = false,
  children,
  rightRail,
  calmMode,
}: HubV2ShellProps) {
  const mainNav = MAIN_NAV.filter((item) => !item.posterOnly || canPostToFeed);

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
      <div className="grid3">
        <aside className="lrail hs" style={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
          {mainNav.map((item) => (
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

          {isAdmin && isPrimaryOwner && (
            <HubAdminFolder
              variant="rail"
              canManageTeam={canManageTeam}
              currentSection={section}
              onNavigate={onSectionChange}
            />
          )}
        </aside>

        <main style={{ minWidth: 0 }}>
          {isAdmin && isPrimaryOwner && (
            <div className="hub-v2-mobile-admin" aria-label="Hub admin access">
              <HubAdminFolder
                variant="mobile"
                canManageTeam={canManageTeam}
                currentSection={section}
                onNavigate={onSectionChange}
              />
            </div>
          )}
          {children}
        </main>

        <aside className="rrail hs" style={{ maxHeight: "calc(100vh - 100px)", overflow: "auto" }}>
          {rightRail}
        </aside>
      </div>
    </div>
  );
}