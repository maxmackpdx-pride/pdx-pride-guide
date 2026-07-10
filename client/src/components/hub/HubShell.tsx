import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  Home,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Shield,
  ShoppingCart,
  Store,
  Users,
  UserCircle,
} from "lucide-react";
import hubLogo from "@/assets/hub-logo.jpg";
import UserAvatar from "@/components/UserAvatar";
import "./hub-shell.css";

export type HubMode = "member" | "admin";

export type MemberView = "home" | "inbox" | "posts";
export type AdminViewKey =
  | "overview"
  | "stats"
  | "inbox"
  | "owner"
  | "events"
  | "users"
  | "gigs"
  | "promoters"
  | "venue-claims"
  | "team";

export const ADMIN_VIEW_META: Record<
  AdminViewKey,
  { title: string; kicker: string; kickerColor: string; lede: string }
> = {
  overview: {
    title: "Admin overview",
    kicker: "Control room",
    kickerColor: "var(--lime, #ccff00)",
    lede: "Clear the queue, check the pulse, then go live. Pride is a protest. Take care of each other.",
  },
  stats: {
    title: "Stats",
    kicker: "The numbers",
    kickerColor: "var(--cyan, #00ffff)",
    lede: "First-party traffic tracking plus database counts: page views, sources, signups, RSVPs, listings, and queue depth.",
  },
  inbox: {
    title: "Review queue",
    kicker: "Shared queue",
    kickerColor: "var(--pink, #ff00cc)",
    lede: "One queue the whole admin team works together. Not a mailbox, a shared to-do list.",
  },
  owner: {
    title: "Owner desk",
    kicker: "Owner only",
    kickerColor: "var(--purple, #8800ff)",
    lede: "Only you, the owner, see these. Keyholder grants, escalations, and account-level calls the team can't make.",
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
    title: "Pride Werk",
    kicker: "The gig board",
    kickerColor: "var(--amber, #ffb020)",
    lede: "Live Pride Werk posts. Take down spam, keep the board useful for workers and hosts.",
  },
  promoters: {
    title: "Promoters",
    kicker: "The scene makers",
    kickerColor: "var(--pink, #ff00cc)",
    lede: "Pending applications and approved hosts who can claim and edit events.",
  },
  "venue-claims": {
    title: "Venue claims",
    kicker: "The directory",
    kickerColor: "var(--cyan, #00ffff)",
    lede: "Business-owner claims on existing venues, new-business submissions, and logo change requests.",
  },
  team: {
    title: "My team",
    kicker: "Keyholders",
    kickerColor: "var(--lime, #ccff00)",
    lede: "Site admins can open this panel while logged into their own account. Grant it to people you trust with the queues.",
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
  { key: "stats", label: "Stats", icon: BarChart3, accent: "cyan" },
  { key: "inbox", label: "Review queue", icon: ShoppingCart, accent: "pink" },
  { key: "owner", label: "Owner desk", icon: KeyRound, accent: "purple", ownerOnly: true },
];

const ADMIN_MORE_NAV: Array<{
  key: AdminViewKey;
  label: string;
  icon: typeof Home;
  teamOnly?: boolean;
}> = [
  { key: "events", label: "All events", icon: CalendarDays },
  { key: "users", label: "All users", icon: UserCircle },
  { key: "gigs", label: "Pride Werk", icon: Briefcase },
  { key: "promoters", label: "Promoters", icon: Users },
  { key: "venue-claims", label: "Venue claims", icon: Store },
  { key: "team", label: "My team", icon: Users, teamOnly: true },
];

const MORE_VIEWS: AdminViewKey[] = ["events", "users", "gigs", "promoters", "venue-claims", "team"];

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
  const adminTabHref = `/admin?tab=${encodeURIComponent(adminView)}`;
  const alertTotal = pendingCount + (isPrimaryOwner ? ownerCount : 0);
  const moreViews = MORE_VIEWS.filter(v => v !== "team" || canManageTeam);
  const moreNav = ADMIN_MORE_NAV.filter(item => !item.teamOnly || canManageTeam);

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
      onClick={() => goAdmin("inbox")}
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
          <Link href="/" className="hub-side__brand" aria-label="PDX Pride Guide home">
            <img
              src={hubLogo}
              alt="PDX Pride Guide 2026"
              width={1024}
              height={468}
              className="hub-side__logo-full"
            />
          </Link>

          <Link href="/" className="hub-back-btn hub-side__back">
            <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
            Back to website
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
                <Link
                  href="/inbox"
                  className={`hub-side__nav-btn${navBtnClass(location.startsWith("/inbox") || memberView === "inbox", "cyan")}`}
                >
                  <Inbox size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">Inbox</span>
                  {unreadCount > 0 && <span className="hub-side__pill hub-side__pill--pink">{unreadCount}</span>}
                </Link>
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
                {ADMIN_PRIMARY_NAV.filter(item => !item.ownerOnly || isPrimaryOwner).map(item => {
                  const Icon = item.icon;
                  const active = adminView === item.key;
                  const alert =
                    item.key === "inbox" && pendingCount > 0
                      ? pendingCount
                      : item.key === "owner" && ownerCount > 0
                        ? ownerCount
                        : undefined;
                  const alertClass = item.key === "owner" ? "hub-side__pill--purple" : "hub-side__pill--pink";
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`hub-side__nav-btn${navBtnClass(active, item.accent)}`}
                      onClick={() => goAdmin(item.key)}
                    >
                      <Icon size={18} strokeWidth={2.2} aria-hidden />
                      <span className="label">{item.label}</span>
                      {alert != null && (
                        <span className={`hub-side__pill ${alertClass}`}>{alert}</span>
                      )}
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
            <UserAvatar
              photoUrl={photoUrl}
              avatarChoice={avatarChoice}
              avatarRing={avatarRing}
              displayName={userName}
              username={userHandle}
              size={38}
            />
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
            <Link href="/" className="hub-back-btn hub-mtop__back">
              <ChevronLeft size={16} strokeWidth={2.4} aria-hidden />
              <span>Back</span>
            </Link>
            <Link href="/" className="hub-mtop__brand" aria-label="PDX Pride Guide home">
              <img
                src={hubLogo}
                alt="PDX Pride Guide 2026"
                width={1024}
                height={468}
                className="hub-mtop__logo-full"
              />
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
          <div className="hub-more-sheet" role="dialog" aria-label="More admin sections">
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

      <nav className="hub-mobile-bar" aria-label="Hub mobile navigation">
        {mode === "member" ? (
          <>
            <button
              type="button"
              className={`hub-mobile-tab${memberView === "home" ? " is-active is-cyan" : ""}`}
              onClick={() => goMember("home")}
            >
              <Home size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
              <span>Home</span>
            </button>
            <Link
              href="/inbox"
              className={`hub-mobile-tab${location.startsWith("/inbox") ? " is-active is-cyan" : ""}`}
            >
              <span className="hub-mobile-tab__icon-wrap">
                <Inbox size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
                {unreadCount > 0 && <i>{unreadCount}</i>}
              </span>
              <span>Inbox</span>
            </Link>
            <button
              type="button"
              className={`hub-mobile-tab${memberView === "posts" ? " is-active is-green" : ""}`}
              onClick={() => goMember("posts")}
            >
              <Layers size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
              <span>Posts</span>
            </button>
            {isAdminUser && (
              <Link href={adminTabHref} className="hub-mobile-tab is-switch is-pink">
                <span className="hub-mobile-tab__icon-wrap">
                  <Shield size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
                  {alertTotal > 0 && <i className="is-blink">{alertTotal}</i>}
                </span>
                <span>Admin</span>
              </Link>
            )}
          </>
        ) : (
          <>
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
              className={`hub-mobile-tab${adminView === "stats" ? " is-active is-cyan" : ""}`}
              onClick={() => goAdmin("stats")}
            >
              <BarChart3 size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
              <span>Stats</span>
            </button>
            <button
              type="button"
              className={`hub-mobile-tab${adminView === "inbox" ? " is-active is-pink" : ""}`}
              onClick={() => goAdmin("inbox")}
            >
              <span className="hub-mobile-tab__icon-wrap">
                <ShoppingCart size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
                {pendingCount > 0 && <i className="is-blink">{pendingCount}</i>}
              </span>
              <span>Queue</span>
            </button>
            {isPrimaryOwner && (
              <button
                type="button"
                className={`hub-mobile-tab${adminView === "owner" ? " is-active is-purple" : ""}`}
                onClick={() => goAdmin("owner")}
              >
                <span className="hub-mobile-tab__icon-wrap">
                  <KeyRound size={MOBILE_ICON} strokeWidth={2.3} aria-hidden />
                  {ownerCount > 0 && <i className="is-purple">{ownerCount}</i>}
                </span>
                <span>Owner</span>
              </button>
            )}
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
          </>
        )}
      </nav>
    </div>
  );
}