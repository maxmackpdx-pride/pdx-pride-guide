import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  Home,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  Store,
  Users,
  UserCircle,
} from "lucide-react";
import logo from "@/assets/logo.png";
import UserAvatar from "@/components/UserAvatar";
import "./hub-shell.css";

export type HubMode = "member" | "admin";

export type MemberView = "home" | "inbox" | "posts";
export type AdminViewKey =
  | "overview"
  | "stats"
  | "inbox"
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
    lede: "Everything in one place: site pulse, community counts, and what is live right now.",
  },
  inbox: {
    title: "Review queue",
    kicker: "Shared queue",
    kickerColor: "var(--pink, #ff00cc)",
    lede: "One queue the whole admin team works together. Not a mailbox, a shared to-do list.",
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

type Props = {
  mode: HubMode;
  /** Active member sub-view (member mode) */
  memberView?: MemberView;
  /** Active admin sub-view (admin mode) */
  adminView?: AdminViewKey;
  onAdminNavigate?: (view: AdminViewKey) => void;
  onMemberNavigate?: (view: MemberView) => void;
  isAdminUser?: boolean;
  isSuperAdmin?: boolean;
  userName: string;
  userHandle?: string;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  unreadCount?: number;
  postsCount?: number;
  pendingCount?: number;
  kicker: string;
  kickerColor?: string;
  title: string;
  lede?: string;
  topRight?: ReactNode;
  /** Optional block above the sidebar user row (e.g. push status) */
  sideExtra?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
};

const ADMIN_NAV: Array<{ key: AdminViewKey; label: string; icon: typeof Home }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "inbox", label: "Review queue", icon: Inbox },
  { key: "events", label: "All events", icon: CalendarDays },
  { key: "users", label: "All users", icon: UserCircle },
  { key: "gigs", label: "Pride Werk", icon: Briefcase },
  { key: "promoters", label: "Promoters", icon: Users },
  { key: "venue-claims", label: "Venue claims", icon: Store },
  { key: "team", label: "My team", icon: Users },
];

export default function HubShell({
  mode,
  memberView = "home",
  adminView = "overview",
  onAdminNavigate,
  onMemberNavigate,
  isAdminUser = false,
  isSuperAdmin = false,
  userName,
  userHandle,
  photoUrl,
  avatarChoice,
  avatarRing,
  unreadCount = 0,
  postsCount = 0,
  pendingCount = 0,
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
  const roleLabel = isSuperAdmin
    ? "Owner · super admin"
    : isAdminUser
      ? "Site admin"
      : "Member";

  const goMember = (v: MemberView) => {
    if (onMemberNavigate) {
      onMemberNavigate(v);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  };

  const goAdmin = (v: AdminViewKey) => {
    onAdminNavigate?.(v);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return (
    <div className={`hub-shell hub-shell--${mode}`}>
      <div className="hub-shell__rainbow" aria-hidden="true" />

      <div className="hub-shell__frame">
        {/* ── SIDEBAR ── */}
        <aside className="hub-side" aria-label="Hub navigation">
          <Link href="/" className="hub-side__brand" aria-label="PDX Pride Guide home">
            <img src={logo} alt="" width={42} height={42} className="hub-side__logo" />
            <div className="hub-side__wordmark">
              <div>PDX</div>
              <div className="pride">PRIDE</div>
              <div>GUIDE</div>
            </div>
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
                href="/admin?tab=overview"
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
                  className={`hub-side__nav-btn${memberView === "home" ? " is-active is-cyan" : ""}`}
                  onClick={() => goMember("home")}
                >
                  <Home size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">Home</span>
                </button>
                <Link
                  href="/inbox"
                  className={`hub-side__nav-btn${location.startsWith("/inbox") || memberView === "inbox" ? " is-active is-cyan" : ""}`}
                >
                  <Inbox size={18} strokeWidth={2.2} aria-hidden />
                  <span className="label">Inbox</span>
                  {unreadCount > 0 && <span className="hub-side__pill hub-side__pill--pink">{unreadCount}</span>}
                </Link>
                <button
                  type="button"
                  className={`hub-side__nav-btn${memberView === "posts" ? " is-active is-green" : ""}`}
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
                {ADMIN_NAV.map(item => {
                  const Icon = item.icon;
                  const active = adminView === item.key;
                  const alert = item.key === "inbox" && pendingCount > 0 ? pendingCount : undefined;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`hub-side__nav-btn${active ? " is-active is-lime" : ""}`}
                      onClick={() => goAdmin(item.key)}
                    >
                      <Icon size={18} strokeWidth={2.2} aria-hidden />
                      <span className="label">{item.label}</span>
                      {alert != null && <span className="hub-side__pill hub-side__pill--pink">{alert}</span>}
                    </button>
                  );
                })}
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

        {/* ── MAIN ── */}
        <div className="hub-main">
          <header className="hub-main__top">
            <div>
              <div className="hub-main__kicker" style={{ color: kickerColor }}>
                <span className="hub-main__kicker-bar" style={{ background: kickerColor }} />
                {kicker}
              </div>
              <h1 className="hub-main__title">{title}</h1>
              {lede && <p className="hub-main__lede">{lede}</p>}
            </div>
            {topRight && <div className="hub-main__top-right">{topRight}</div>}
          </header>

          <div className="hub-main__body">{children}</div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="hub-mobile-bar" aria-label="Hub mobile navigation">
        {mode === "member" ? (
          <>
            <button type="button" className={memberView === "home" ? "is-active" : ""} onClick={() => goMember("home")}>
              <Home size={22} /><span>Home</span>
            </button>
            <Link href="/inbox" className={location.startsWith("/inbox") ? "is-active" : ""}>
              <Inbox size={22} /><span>Inbox</span>
              {unreadCount > 0 && <i>{unreadCount}</i>}
            </Link>
            <button type="button" className={memberView === "posts" ? "is-active" : ""} onClick={() => goMember("posts")}>
              <Layers size={22} /><span>Posts</span>
            </button>
            {isAdminUser && (
              <Link href="/admin?tab=overview">
                <LayoutDashboard size={22} /><span>Admin</span>
                {pendingCount > 0 && <i>{pendingCount}</i>}
              </Link>
            )}
          </>
        ) : (
          <>
            <button type="button" className={adminView === "overview" ? "is-active" : ""} onClick={() => goAdmin("overview")}>
              <Home size={22} /><span>Home</span>
            </button>
            <button type="button" className={adminView === "stats" ? "is-active" : ""} onClick={() => goAdmin("stats")}>
              <BarChart3 size={22} /><span>Stats</span>
            </button>
            <button type="button" className={adminView === "inbox" ? "is-active" : ""} onClick={() => goAdmin("inbox")}>
              <Inbox size={22} /><span>Queue</span>
              {pendingCount > 0 && <i>{pendingCount}</i>}
            </button>
            <Link href="/dashboard" className="is-cyan">
              <UserCircle size={22} /><span>Me</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
