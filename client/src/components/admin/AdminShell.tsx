import type { ReactNode } from "react";
import {
  Briefcase,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Store,
  Users,
  UserCircle,
} from "lucide-react";
import { Link } from "wouter";
import logo from "@/assets/logo.png";
import "./admin-panel.css";

export type AdminView =
  | "overview"
  | "events"
  | "users"
  | "gigs"
  | "promoters"
  | "venue-claims"
  | "team"
  | "ads";

export type AdminNavItem = {
  key: AdminView;
  label: string;
  alert?: number;
  count?: string | number;
};

type PushStatus = {
  configured: boolean;
  totalActiveSubscriptions: number;
  myDeviceSubscriptions: number;
} | null | undefined;

const VIEW_TITLES: Record<AdminView, string> = {
  overview: "Admin overview",
  events: "All events",
  users: "All users",
  gigs: "Pride Werk",
  promoters: "Promoters",
  "venue-claims": "Venue claims",
  team: "My team",
  ads: "Ad Manager",
};

const VIEW_KICKERS: Record<AdminView, { label: string; color: string }> = {
  overview: { label: "Control room", color: "var(--lime, #ccff00)" },
  events: { label: "The program", color: "var(--orange, #ff6600)" },
  users: { label: "The community", color: "var(--cyan, #00ffff)" },
  gigs: { label: "The gig board", color: "var(--amber, #ffb020)" },
  promoters: { label: "The scene makers", color: "var(--pink, #ff00cc)" },
  "venue-claims": { label: "The directory", color: "var(--cyan, #00ffff)" },
  team: { label: "Keyholders", color: "var(--lime, #ccff00)" },
  ads: { label: "Owner only", color: "var(--cyan, #19e3ff)" },
};

const VIEW_LEDES: Record<AdminView, string> = {
  overview: "Clear the queue, check the pulse, then go live. Pride is a protest. Take care of each other.",
  events: "Assign unclaimed listings, edit details, hide stubs. Every live night starts here.",
  users: "Everyone who signed up. Promote scene-makers, fix usernames, protect the owner seat.",
  gigs: "Live Pride Werk posts. Take down spam, keep the board useful for workers and hosts.",
  promoters: "Pending applications and approved hosts who can claim and edit events.",
  "venue-claims": "Business-owner claims on existing venues, new-business submissions, and logo change requests.",
  team: "Site admins can open this panel while logged into their own account. Grant it to people you trust with the queues.",
  ads: "Build affiliate and house ads, set placement rules, track what is live.",
};

const SIDEBAR_ICON = 15;
/** Mobile bottom bar — ~3× sidebar icons; CSS also scales with viewport. */
const MOBILE_ICON = 45;

function makeIcons(size: number): Record<AdminView | "more", ReactNode> {
  const p = { size, strokeWidth: size >= 32 ? 2 : 2.2, "aria-hidden": true as const };
  return {
    overview: <LayoutDashboard {...p} />,
    events: <CalendarDays {...p} />,
    users: <UserCircle {...p} />,
    gigs: <Briefcase {...p} />,
    promoters: <Users {...p} />,
    "venue-claims": <Store {...p} />,
    team: <Users {...p} />,
    ads: <LayoutDashboard {...p} />,
    more: <MoreHorizontal {...p} />,
  };
}

const ICONS = makeIcons(SIDEBAR_ICON);
const MOBILE_ICONS = makeIcons(MOBILE_ICON);

type Props = {
  view: AdminView;
  onNavigate: (view: AdminView) => void;
  adminName: string;
  isSuperAdmin?: boolean;
  isPrimaryOwner?: boolean;
  pendingCount: number;
  navCounts: Partial<Record<AdminView, number | string>>;
  pushStatus?: PushStatus;
  onRefreshAll: () => void;
  onLogout: () => void;
  onSendTestPush?: () => void;
  testPushPending?: boolean;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export default function AdminShell({
  view,
  onNavigate,
  adminName,
  isSuperAdmin,
  isPrimaryOwner,
  pendingCount,
  navCounts,
  pushStatus,
  onRefreshAll,
  onLogout,
  onSendTestPush,
  testPushPending,
  moreOpen,
  onMoreOpenChange,
  children,
}: Props) {
  const navItems: AdminNavItem[] = [
    { key: "overview", label: "Overview" },
    { key: "team", label: "My team", count: navCounts.team },
    { key: "events", label: "All events", count: navCounts.events },
    { key: "users", label: "All users", count: navCounts.users },
    { key: "gigs", label: "Pride Werk", count: navCounts.gigs },
    { key: "promoters", label: "Promoters", count: navCounts.promoters },
    { key: "venue-claims", label: "Venue claims", count: navCounts["venue-claims"] },
  ];

  const mobilePrimary: Array<{ key: AdminView | "more"; label: string; alert?: number }> = [
    { key: "overview", label: "Home" },
    { key: "events", label: "Events" },
    { key: "more", label: "More" },
  ];

  const moreItems: AdminNavItem[] = [
    { key: "users", label: "All users", count: navCounts.users },
    { key: "gigs", label: "Pride Werk", count: navCounts.gigs },
    { key: "promoters", label: "Promoters", count: navCounts.promoters },
    { key: "venue-claims", label: "Venue claims", count: navCounts["venue-claims"] },
    { key: "team", label: "My team", count: navCounts.team },
  ];

  const moreViews: AdminView[] = ["users", "gigs", "promoters", "venue-claims", "team"];
  const kicker = VIEW_KICKERS[view];
  const pushOk = !!pushStatus?.configured;

  const go = (next: AdminView) => {
    onMoreOpenChange(false);
    onNavigate(next);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar" aria-label="Admin navigation">
        <div className="admin-shell__brand">
          <img src={logo} alt="" width={38} height={38} />
          <div className="admin-shell__brand-text">
            <div>PDX</div>
            <div className="pride">PRIDE</div>
            <div>GUIDE</div>
          </div>
        </div>

        {/* Member / Admin mode toggle (design: cyan member, pink admin) */}
        <div className="admin-shell__mode-toggle" role="group" aria-label="Hub mode">
          <Link href="/dashboard" className="admin-shell__mode-btn">
            Member
          </Link>
          <button type="button" className="admin-shell__mode-btn is-admin is-active" aria-current="page">
            Admin
          </button>
        </div>

        <div className="admin-shell__nav-kicker">Admin</div>

        <nav className="admin-shell__nav">
          {navItems.map(item => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-shell__nav-btn${active ? " is-active" : ""}`}
                onClick={() => go(item.key)}
              >
                {ICONS[item.key]}
                <span className="label">{item.label}</span>
                {item.alert != null && item.alert > 0 ? (
                  <span className="admin-shell__nav-alert">{item.alert}</span>
                ) : item.count != null && item.count !== "" ? (
                  <span className="admin-shell__nav-count">{item.count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="admin-shell__sidebar-foot">
          <div className="admin-shell__push-status">
            <span className={`dot${pushOk ? "" : " is-bad"}`} />
            {pushOk ? "Push server healthy" : "Push not configured"}
          </div>
          <div className="admin-shell__push-meta">
            {pushStatus
              ? `${pushStatus.totalActiveSubscriptions} device${pushStatus.totalActiveSubscriptions === 1 ? "" : "s"} site-wide, ${pushStatus.myDeviceSubscriptions} on this account`
              : "Status loading…"}
          </div>
          {onSendTestPush && (
            <button
              type="button"
              className="admin-shell__ghost-btn"
              disabled={!pushOk || !pushStatus?.myDeviceSubscriptions || testPushPending}
              onClick={onSendTestPush}
            >
              {testPushPending ? "Sending…" : "Send test push"}
            </button>
          )}
        </div>

        <div className="admin-shell__user-row">
          <div className="admin-shell__user-meta">
            <div className="admin-shell__user-name">{adminName}</div>
            <div className="admin-shell__user-role">
              {isPrimaryOwner ? "Owner" : isSuperAdmin ? "Super admin" : "Site admin"}
            </div>
          </div>
          <button
            type="button"
            className="admin-shell__ghost-btn"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </aside>

      <div className="admin-shell__main">
        <div className="admin-shell__mobile-top">
          <img src={logo} alt="" width={32} height={32} />
          <div className="admin-shell__brand-text" style={{ fontSize: 12 }}>
            <div>PDX <span className="pride">PRIDE</span> GUIDE</div>
          </div>
          <span className="admin-shell__badge">ADMIN</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="admin-shell__ghost-btn" onClick={onRefreshAll} aria-label="Refresh all">
            <RefreshCw size={12} />
          </button>
        </div>

        <header className="admin-shell__topbar">
          <div>
            <div className="admin-shell__kicker">
              <span className="bar" style={{ background: kicker.color }} />
              {kicker.label}
            </div>
            <h1 className="admin-shell__title">{VIEW_TITLES[view]}</h1>
            <p className="admin-shell__lede">{VIEW_LEDES[view]}</p>
          </div>
          <div className="admin-shell__top-actions admin-shell__top-actions--desktop">
            <button type="button" className="admin-shell__ghost-btn" onClick={onRefreshAll}>
              <RefreshCw size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
              Refresh all
            </button>
            <button type="button" className="admin-shell__ghost-btn" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="admin-shell__content">
          <div className="admin-panel-body">{children}</div>
        </div>
      </div>

      {moreOpen && (
        <>
          <div className="admin-shell__more-backdrop" onClick={() => onMoreOpenChange(false)} />
          <div className="admin-shell__more-sheet" role="dialog" aria-label="More admin sections">
            <h3>More</h3>
            {moreItems.map(item => (
              <button
                key={item.key}
                type="button"
                className="admin-shell__more-item"
                onClick={() => go(item.key)}
              >
                {ICONS[item.key]}
                <span>{item.label}</span>
                {item.count != null && item.count !== "" && (
                  <span className="count">{item.count}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <nav className="admin-shell__mobile-bar" aria-label="Admin mobile navigation">
        <div className="admin-shell__mobile-bar-inner">
          {mobilePrimary.map(tab => {
            const active =
              tab.key === "more"
                ? moreOpen || moreViews.includes(view)
                : view === tab.key && !moreOpen;
            return (
              <button
                key={tab.key}
                type="button"
                className={`admin-shell__mobile-tab${active ? " is-active" : ""}`}
                onClick={() => {
                  if (tab.key === "more") onMoreOpenChange(!moreOpen);
                  else go(tab.key);
                }}
              >
                <span className="admin-shell__mobile-tab-icon" aria-hidden="true">
                  {tab.key === "overview" ? (
                    <Home size={MOBILE_ICON} strokeWidth={2} />
                  ) : (
                    MOBILE_ICONS[tab.key]
                  )}
                </span>
                <span className="admin-shell__mobile-tab-label">{tab.label}</span>
                {tab.alert != null && tab.alert > 0 && (
                  <span className="alert">{tab.alert}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
