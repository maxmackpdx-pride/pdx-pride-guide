import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  Home,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Search,
  Shield,
  Store,
  Users,
  UserCircle,
} from "lucide-react";

import UserAvatar from "@/components/UserAvatar";
import { useInboxSheet } from "@/context/InboxSheetContext";
import "./hub-shell.css";

export type HubMode = "member" | "admin";

export type MemberView = "home" | "inbox" | "posts";
export type AdminViewKey =
  | "overview"
  | "qsearch"
  | "events"
  | "users"
  | "gigs"
  | "promoters"
  | "venue-claims"
  | "team"
  | "ads";

export const ADMIN_VIEW_META: Record<
  AdminViewKey,
  { title: string; kicker: string; kickerColor: string; lede: string }
> = {
  overview: {
    title: "Admin overview",
    kicker: "Control room",
    kickerColor: "var(--lime, #ccff00)",
    lede: "Clear the queue, check the pulse, then go live. Take care of each other.",
  },
  qsearch: {
    title: "QSearch",
    kicker: "Ingest",
    kickerColor: "var(--orange, #ff6600)",
    lede: "Pull events from venue sites and directory websites. Preview first, commit as HIDDEN, then go LIVE from All Events.",
  },
  events: {
    title: "All events",
    kicker: "The program",
    kickerColor: "var(--orange, #ff6600)",
    lede: "Assign unclaimed listings, edit details, hide stubs. Every live night starts here.",
  },
  users: {
    title: "All users",
    kicker: "The community",
    kickerColor: "var(--cyan, #00ffff)",
    lede: "Everyone who signed up. Promote scene-makers, fix usernames, protect the owner seat.",
  },
  gigs: {
    title: "Gig Work",
    kicker: "The gig board",
    kickerColor: "var(--amber, #ffb020)",
    lede: "Live Gig Work posts. Take down spam, keep the board useful for workers and hosts.",
  },
  promoters: {
    title: "Promoters",
    kicker: "The scene makers",
    kickerColor: "var(--pink, #ff00cc)",
    // Keep lede short so Manual Promoter Override sits high on the page
    lede: "Grant status, clear the queue, message hosts.",
  },
  "venue-claims": {
    title: "Venue claims",
    kicker: "The directory",
    kickerColor: "var(--cyan, #00ffff)",
    lede: "Business-owner claims on existing venues and new-business submissions. Logo requests go to the Owner desk.",
  },
  team: {
    title: "My team",
    kicker: "Keyholders",
    kickerColor: "var(--lime, #ccff00)",
    lede: "Site admins can open this panel while logged into their own account. Grant it to people you trust with the queues.",
  },
  ads: {
    title: "Ad Manager",
    kicker: "Owner only",
    kickerColor: "var(--cyan, #19e3ff)",
    lede: "Build affiliate and house ads, set placement rules, track what is live. Never visible to the public.",
  },
};

type NavAccent = "cyan" | "green" | "lime" | "pink" | "purple" | "orange";

type Props = {
  mode: HubMode;
  memberView?: MemberView;
  adminView?: AdminViewKey;
  onAdminNavigate?: (view: AdminViewKey) => void;
  onMemberNavigate?: (view: MemberView) => void;
  isAdminUser?: boolean;
  isSuperAdmin?: boolean;
  isPrimaryOwner?: boolean;
  canManageTeam?: boolean;
  canViewUsers?: boolean;
  canManageCatalog?: boolean;
  canPush?: boolean;
  userName: string;
  userHandle?: string;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  unreadCount?: number;
  postsCount?: number;
  pendingCount?: number;
  ownerCount?: number;
  navCounts?: Partial<Record<AdminViewKey, number | string>>;
  moreOpen?: boolean;
  onMoreOpenChange?: (open: boolean) => void;
  kicker: string;
  kickerColor?: string;
  title: string;
  lede?: string;
  topRight?: ReactNode;
  sideExtra?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
};

const ADMIN_PRIMARY_NAV: Array<{
  key: AdminViewKey;
  label: string;
  icon: typeof Home;
  accent: NavAccent;
  ownerOnly?: boolean;
}> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, accent: "lime" },
];

const ADMIN_MORE_NAV: Array<{
  key: AdminViewKey;
  label: string;
  icon: typeof Home;
  teamOnly?: boolean;
  usersOnly?: boolean;
  catalogOnly?: boolean;
}> = [
  { key: "qsearch", label: "QSearch", icon: Search, catalogOnly: true },
  { key: "events", label: "All events", icon: CalendarDays, catalogOnly: true },
  { key: "users", label: "All users", icon: UserCircle, usersOnly: true },
  { key: "gigs", label: "Gig Werk", icon: Briefcase, catalogOnly: true },
  { key: "promoters", label: "Promoters", icon: Users },
  { key: "venue-claims", label: "Venue claims", icon: Store },
  { key: "team", label: "My team", icon: Users, teamOnly: true },
];

const MORE_VIEWS: AdminViewKey[] = ["qsearch", "events", "users", "gigs", "promoters", "venue-claims", "team"];

const MOBILE_ICON = 26;

function navBtnClass(active: boolean, accent?: NavAccent) {
  if (!active || !accent) return "";
  return ` is-active is-${accent}`;
}

export default function HubShell({
  mode,
  memberView = "home",
  adminView = "overview",
  onAdminNavigate,
  onMemberNavigate,
  isAdminUser = false,
  isSuperAdmin = false,
  isPrimaryOwner = false,
  canManageTeam = false,
  canViewUsers = false,
  canManageCatalog = false,
  userName,
  userHandle,
  photoUrl,
  avatarChoice,
  avatarRing,
  unreadCount = 0,
  postsCount = 0,
  pendingCount = 0,
  ownerCount = 0,
  navCounts = {},
  moreOpen = false,
  onMoreOpenChange,
  kicker,
  kickerColor = "var(--cyan, #00ffff)",
  title,
  lede,
  topRight,
  sideExtra,
  onLogout,
  children,
}: Props) {
  const [location] = useLocation();
  const { open: sheetOpen, openSheet } = useInboxSheet();
  const onInboxPage = location === "/inbox" || location.startsWith("/inbox?");
  const inboxNavActive = sheetOpen || onInboxPage || memberView === "inbox";
  const adminTabHref = `/admin?tab=${encodeURIComponent(adminView)}`;
  const alertTotal = pendingCount + (isPrimaryOwner ? ownerCount : 0);
  const moreViews = MORE_VIEWS.filter(v => {
    if (v === "team") return canManageTeam;
    if (v === "users") return canViewUsers;
    if (v === "qsearch" || v === "events" || v === "gigs") return canManageCatalog;
    return true;
  });
  const moreNav = ADMIN_MORE_NAV.filter(item => {
    if (item.teamOnly) return canManageTeam;
    if (item.usersOnly) return canViewUsers;
    if (item.catalogOnly) return canManageCatalog;
    return true;
  });

  const roleLabel = isPrimaryOwner
    ? "Owner"
    : isSuperAdmin
      ? "Super admin"
      : isAdminUser
        ? "Site admin"
        : "Member";

  const goMember = (v: MemberView) => {
    onMoreOpenChange?.(false);
    if (onMemberNavigate) {
      onMemberNavigate(v);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  };

  const goAdmin = (v: AdminViewKey) => {
    onMoreOpenChange?.(false);
    onAdminNavigate?.(v);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const notifyBell = mode === "admin" && (
    <button
      type="button"
      className="hub-notify-btn"
      onClick={() => openSheet({ view: "inbox", account: "admin" })}
      aria-label={`Notifications${alertTotal > 0 ? `, ${alertTotal} pending` : ""}`}
    >
      <Bell size={mode === "admin" ? 21 : 17} strokeWidth={2.2} aria-hidden />
      {alertTotal > 0 && <span className="hub-notify-btn__badge">{alertTotal}</span>}
    </button>
  );

  return (
    <div className={`hub-shell hub-shell--${mode}`}>
      <div className="hub-shell__rainbow" aria-hidden="true" />

      <div className="hub-shell__frame">
        <aside className="hub-side" aria-label="Hub navigation">
          <Link href="/" className="hub-home-link hub-side__home" aria-label="Return to Zaylist home">
            <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
            <span>Return to Zaylist</span>
          </Link>

          {isAdminUser && (
            <div className="hub-side__mode" role="group" aria-label="Hub mode">
              <Link
                href="/dashboard"
                className={`hub-side__mode-btn${mode === "member" ? " is-active is-member" : ""}`}
              >
                Member
              </Link>
              <Link
                href={adminTabHref}
                className={`hub-side__mode-btn${mode === "admin" ? " is-active is-admin" : ""}`}
              >
                Admin
              </Link>
            </div>
          )}

          {mode === "member" ? (
            <>
              <div className="hub-side__kicker">Your account</div>
              <nav className="hub-side__nav">
                <button
                  type="button"
                  className={`hub-side__nav-btn${navBtnClass(memberView === "home", "cyan")}`}
                  onClick={() => goMember("home")}
                >
                  <Home size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">Home</span>
                </button>
                <button
                  type="button"
                  className={`hub-side__nav-btn${navBtnClass(inboxNavActive, "cyan")}`}
                  onClick={() => {
                    if (onInboxPage) return;
                    openSheet();
                  }}
                >
                  <Inbox size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">Inbox</span>
                  {unreadCount > 0 && <span className="hub-side__pill hub-side__pill--pink">{unreadCount}</span>}
                </button>
                <button
                  type="button"
                  className={`hub-side__nav-btn${navBtnClass(memberView === "posts", "green")}`}
                  onClick={() => goMember("posts")}
                >
                  <Layers size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">My posts</span>
                  {postsCount > 0 && <span className="hub-side__pill hub-side__pill--outline">{postsCount}</span>}
                </button>
              </nav>
            </>
          ) : (
            <>
              <div className="hub-side__kicker">Admin</div>
              <nav className="hub-side__nav">
                {ADMIN_PRIMARY_NAV.map(item => {
                  const Icon = item.icon;
                  const active = adminView === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`hub-side__nav-btn${navBtnClass(active, item.accent)}`}
                      onClick={() => goAdmin(item.key)}
                    >
                      <Icon size={18} strokeWidth={2.2} aria-hidden />
                      <span className="label">{item.label}</span>
                    </button>
                  );
                })}
                {onMoreOpenChange && (
                  <button
                    type="button"
                    className={`hub-side__nav-btn${moreOpen || moreViews.includes(adminView) ? " is-active is-orange" : ""}`}
                    onClick={() => onMoreOpenChange(!moreOpen)}
                  >
                    <MoreHorizontal size={18} strokeWidth={2.2} aria-hidden />
                    <span className="label">More</span>
                  </button>
                )}
              </nav>
            </>
          )}

          <div className="hub-side__spacer" />

          {sideExtra && <div className="hub-side__extra">{sideExtra}</div>}

          <div className="hub-side__user">
            {mode === "member" ? (
              <Link href="/dashboard?edit=profile" className="hub-side__avatar-link" aria-label="Edit profile">
                <UserAvatar
                  photoUrl={photoUrl}
                  avatarChoice={avatarChoice}
                  avatarRing={avatarRing}
                  displayName={userName}
                  username={userHandle}
                  size={38}
                />
              </Link>
            ) : (
              <UserAvatar
                photoUrl={photoUrl}
                avatarChoice={avatarChoice}
                avatarRing={avatarRing}
                displayName={userName}
                username={userHandle}
                size={38}
              />
            )}
            <div className="hub-side__user-meta">
              <div className="hub-side__user-name">{userName}</div>
              <div className="hub-side__user-role">{roleLabel}</div>
            </div>
            <button type="button" className="hub-side__logout" onClick={onLogout} aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <div className="hub-main">
          <header className="hub-mtop" aria-label="Hub mobile header">
            <Link href="/" className="hub-home-link hub-mtop__home" aria-label="Return to Zaylist home">
              <ChevronLeft size={16} strokeWidth={2.4} aria-hidden />
              <span>Return to Zaylist</span>
            </Link>
            <div className="hub-mtop__spacer" />
            {mode === "admin" && notifyBell}
            {isAdminUser && (
              <div className="hub-mtop__mode" role="group" aria-label="Hub mode">
                <Link
                  href="/dashboard"
                  className={`hub-mtop__mode-btn${mode === "member" ? " is-active is-member" : ""}`}
                >
                  Me
                </Link>
                <Link
                  href={adminTabHref}
                  className={`hub-mtop__mode-btn${mode === "admin" ? " is-active is-admin" : ""}`}
                >
                  Admin
                </Link>
              </div>
            )}
          </header>

          <header className="hub-main__top">
            <div>
              <div className="hub-main__kicker" style={{ color: kickerColor }}>
                <span className="hub-main__kicker-bar" style={{ background: kickerColor }} />
                {kicker}
              </div>
              <h1 className="hub-main__title">{title}</h1>
              {lede && <p className="hub-main__lede">{lede}</p>}
            </div>
            <div className="hub-main__top-right">
              {mode === "admin" && <span className="hub-main__notify-desktop">{notifyBell}</span>}
              {topRight}
            </div>
          </header>

          <div className="hub-main__body">{children}</div>
        </div>
      </div>

      {mode === "admin" && moreOpen && onMoreOpenChange && (
        <>
          <div className="hub-more-backdrop" onClick={() => onMoreOpenChange(false)} />
          <div className="hub-more-sheet pdx-edge-deboss" role="dialog" aria-label="More admin sections">
            <h3>More</h3>
            {moreNav.map(item => {
              const Icon = item.icon;
              const count = navCounts[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`hub-more-item${adminView === item.key ? " is-active" : ""}`}
                  onClick={() => goAdmin(item.key)}
                >
                  <Icon size={18} strokeWidth={2.2} aria-hidden />
                  <span>{item.label}</span>
                  {count != null && count !== "" && <span className="count">{count}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Member mode: site MobileBottomNav is the single bar (App.tsx).
          Admin mode keeps this hub bar; App hides the site bar on /admin. */}
      {mode === "admin" && (
        <nav className="hub-mobile-bar" aria-label="Hub mobile navigation">
          <span className="pull-handle hub-mobile-bar__pull" aria-hidden="true" />
          <button
            type="button"
            className={`hub-mobile-tab${adminView === "overview" ? " is-active is-lime" : ""}`}
            onClick={() => goAdmin("overview")}
          >
            <LayoutDashboard size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Home</span>
          </button>
          <button
            type="button"
            className={`hub-mobile-tab${adminView === "events" ? " is-active is-orange" : ""}`}
            onClick={() => goAdmin("events")}
          >
            <CalendarDays size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Events</span>
          </button>
          <button
            type="button"
            className={`hub-mobile-tab${moreOpen || moreViews.includes(adminView) ? " is-active is-more" : ""}`}
            onClick={() => onMoreOpenChange?.(!moreOpen)}
          >
            <MoreHorizontal size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>More</span>
          </button>
          <Link href="/dashboard" className="hub-mobile-tab is-switch is-cyan">
            <UserCircle size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
            <span>Me</span>
          </Link>
        </nav>
      )}
    </div>
  );
}