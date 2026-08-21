import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useLocation } from "wouter";
import { useIsFetching, useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, Search, X, Zap } from "lucide-react";
import GlitchLogo from "@/components/GlitchLogo";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import AuthModal from "./AuthModal";
import StankTicketGate from "./StankTicketGate";
import UserAvatar from "@/components/UserAvatar";
import CalmModeToggle from "@/components/CalmModeToggle";
import SiteSearch, { useSiteSearchHotkey } from "@/components/SiteSearch";
import { Divider } from "@/components/ds";
import { counterpartyAvatar } from "@/lib/inboxAvatar";
import { contextLabelOf, contextTypeOf, notifyContextTag } from "@/lib/inboxContext";
import { PRIMARY_NAV, navLinkActive } from "@/lib/siteNav";
import type { NavAccent, NavFeature } from "@/lib/siteNav";
import type { AuthUser } from "@/context/AuthContext";
import type { ApiMessageRow } from "@/components/inbox/types";
import HubAdminFolder from "@/components/hub/HubAdminFolder";
import { parseHubSection } from "@/components/hub/types";
import { dismissMobileNavOverlays } from "@/lib/mobileNavDismiss";
import { isLocalDemo, LOCAL_DEMO_PROFILE_PATH } from "@/lib/localDemo";

type NavItem = { href: string; label: string; accent?: NavAccent };

const navEntries = PRIMARY_NAV;

function NavLink({
  href,
  label,
  active,
  accent,
  showNotify,
  notifyLabel,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  accent?: NavAccent;
  showNotify?: boolean;
  notifyLabel?: string;
  onClick?: () => void;
}) {
  const isDarkroom = href === "/next" || href.startsWith("/next?");
  return (
    <Link
      href={href}
      className={`site-nav-link${active ? " active" : ""}${showNotify ? " site-nav-link--notify" : ""}${isDarkroom ? " site-nav-link--darkroom" : ""}`}
      data-accent={accent}
      onClick={onClick}
      aria-label={notifyLabel}
    >
      {label}
      {showNotify && <span className="site-nav-notify-dot" aria-hidden="true" />}
    </Link>
  );
}

function NavDropdown({
  id,
  label,
  items,
  accent,
  eyebrow,
  feature,
  location,
  open,
  onToggle,
  onClose,
}: {
  id: string;
  label: string;
  items: NavItem[];
  accent?: NavAccent;
  eyebrow?: string;
  feature?: NavFeature;
  location: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const active = items.some(item => location === item.href || location.startsWith(`${item.href}/`));
  const panelId = `site-nav-dropdown-${id}`;

  return (
    <div className={`site-nav-dropdown${open ? " open" : ""}`} data-accent={accent}>
      <button
        type="button"
        className={`site-nav-dropdown__trigger${active ? " active" : ""}`}
        data-accent={accent}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={onToggle}
      >
        {label}
        <ChevronDown size={16} className="site-nav-dropdown__chevron" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className={`site-nav-dropdown__panel${feature ? " site-nav-dropdown__panel--feature" : ""}`}
        role="menu"
      >
        <div className="site-nav-dropdown__column">
          {eyebrow && <span className="site-nav-dropdown__eyebrow">{eyebrow}</span>}
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={`site-nav-dropdown__item${location === item.href ? " active" : ""}`}
              data-accent={item.accent ?? accent}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {feature && (
          <Link
            href={feature.href}
            role="menuitem"
            className="site-nav-dropdown__feature"
            onClick={onClose}
          >
            <span className="site-nav-dropdown__feature-kicker">{feature.kicker}</span>
            <span className="site-nav-dropdown__feature-title">{feature.title}</span>
            <span className="site-nav-dropdown__feature-body">{feature.body}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function ProfileMenuPanel({
  user,
  profilePath,
  profileActive,
  hubActive,
  unreadCount,
  location,
  onClose,
  openSheet,
  logout,
  isAdmin,
  canManageTeam,
  isPrimaryOwner,
}: {
  user: AuthUser;
  profilePath: string;
  profileActive: boolean;
  hubActive: boolean;
  unreadCount: number;
  location: string;
  onClose: () => void;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner" }) => void;
  logout: () => void;
  isAdmin: boolean;
  canManageTeam: boolean;
  isPrimaryOwner: boolean;
}) {
  const hubSection = hubActive
    ? parseHubSection(new URLSearchParams(window.location.search).get("section"))
    : undefined;

  return (
    <div className="site-profile-menu__panel" role="menu">
      <Link
        href="/dashboard?edit=profile"
        role="menuitem"
        className="site-profile-menu__item"
        onClick={onClose}
      >
        Edit profile
      </Link>
      <Link
        href="/dashboard"
        role="menuitem"
        className={`site-profile-menu__item site-profile-menu__item--hub${hubActive ? " active" : ""}`}
        onClick={onClose}
      >
        Hub{unreadCount > 0 ? ` (${unreadCount})` : ""}
      </Link>
      <Link
        href={profilePath}
        role="menuitem"
        className="site-profile-menu__identity site-profile-menu__identity--link"
        onClick={onClose}
      >
        <span className="site-profile-menu__name">{user.displayName || user.username}</span>
        <span className="site-profile-menu__username">@{user.username}</span>
        <span className="site-profile-menu__identity-hint">View public profile</span>
      </Link>
      <button
        type="button"
        role="menuitem"
        className={`site-profile-menu__item site-profile-menu__item--inbox${location === "/inbox" || location.startsWith("/inbox?") ? " active" : ""}`}
        onClick={() => {
          onClose();
          openSheet();
        }}
      >
        Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
      </button>
      <Link
        href="/dashboard?section=settings"
        role="menuitem"
        className={`site-profile-menu__item${hubSection === "settings" ? " active" : ""}`}
        onClick={onClose}
      >
        Notification settings
      </Link>
      <div className="site-profile-menu__item site-profile-menu__item--calm" role="none">
        <CalmModeToggle compact />
      </div>
      {isAdmin && canManageTeam && (
        <HubAdminFolder
          variant="menu"
          canManageTeam={canManageTeam}
          isPrimaryOwner={isPrimaryOwner}
          currentSection={hubSection}
          onClose={onClose}
          defaultOpen={hubActive}
        />
      )}
      <button
        type="button"
        role="menuitem"
        className="site-profile-menu__item site-profile-menu__item--logout"
        onClick={() => {
          logout();
          onClose();
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function ProfileMenu({
  user,
  profileOpen,
  setProfileOpen,
  profileRef,
  profilePath,
  profileActive,
  hubActive,
  unreadCount,
  location,
  openSheet,
  logout,
  onMenuClose,
  isAdmin,
  canManageTeam,
  isPrimaryOwner,
}: {
  user: AuthUser;
  profileOpen: boolean;
  setProfileOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  profileRef: RefObject<HTMLDivElement>;
  profilePath: string;
  profileActive: boolean;
  hubActive: boolean;
  unreadCount: number;
  location: string;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner" }) => void;
  logout: () => void;
  onMenuClose: () => void;
  isAdmin: boolean;
  canManageTeam: boolean;
  isPrimaryOwner: boolean;
}) {
  const closeAll = () => {
    setProfileOpen(false);
    onMenuClose();
  };

  return (
    <div className={`site-profile-menu${profileActive ? " site-profile-menu--active" : ""}`} ref={profileRef}>
      <div className="site-profile-menu__cluster">
        <button
          type="button"
          className="site-profile-menu__avatar-link"
          aria-label={`Open profile menu: ${user.displayName || user.username}`}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          onClick={() => {
            dismissMobileNavOverlays("profile");
            setProfileOpen((open) => !open);
          }}
        >
          <UserAvatar
            photoUrl={user.photoUrl}
            avatarChoice={user.avatarChoice}
            avatarRing={user.avatarRing}
            displayName={user.displayName}
            username={user.username}
          />
          {unreadCount > 0 && <span className="site-profile-menu__notify-dot" aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={`site-profile-menu__caret${profileOpen ? " site-profile-menu__caret--open" : ""}`}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          aria-label={
            unreadCount > 0
              ? `Profile menu: ${user.displayName || user.username}, ${unreadCount} unread`
              : `Profile menu: ${user.displayName || user.username}`
          }
          onClick={() => {
            dismissMobileNavOverlays("profile");
            setProfileOpen((open) => !open);
          }}
        >
          <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
      {profileOpen && (
        <ProfileMenuPanel
          user={user}
          profilePath={profilePath}
          profileActive={profileActive}
          hubActive={hubActive}
          unreadCount={unreadCount}
          location={location}
          onClose={closeAll}
          openSheet={openSheet}
          logout={logout}
          isAdmin={isAdmin}
          canManageTeam={canManageTeam}
          isPrimaryOwner={isPrimaryOwner}
        />
      )}
    </div>
  );
}

function formatNotifyTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function senderLabel(row: ApiMessageRow): string {
  const party = counterpartyAvatar(row, "inbox");
  const handle = party.username || party.displayName || "Someone";
  return handle.toUpperCase();
}

function notifyHeadline(row: ApiMessageRow): string {
  const tag = notifyContextTag(contextTypeOf(row)).toUpperCase();
  const label = contextLabelOf(row);
  return label ? `${tag}: ${label.toUpperCase()}` : tag;
}

function MobileNotifyMenu({
  unreadCount,
  adminPending,
  openSheet,
  onCloseOthers,
}: {
  unreadCount: number;
  adminPending: number;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner" }) => void;
  onCloseOthers: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const alertTotal = unreadCount + adminPending;

  const { data: inbox = [], isLoading } = useQuery<ApiMessageRow[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: () =>
      fetch("/api/messages/inbox", { credentials: "include" }).then(r => (r.ok ? r.json() : [])),
    enabled: open,
    staleTime: 30_000,
  });

  const notifications = useMemo(
    () =>
      [...inbox].sort((a, b) => {
        const ta = new Date(a.createdAt || a.created_at || 0).getTime();
        const tb = new Date(b.createdAt || b.created_at || 0).getTime();
        return tb - ta;
      }),
    [inbox],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={`site-mobile-notify${open ? " open" : ""}`} ref={ref}>
      <button
        type="button"
        className={`hub-notify-btn site-mobile-notify__bolt${alertTotal > 0 ? " site-mobile-notify--alert" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          alertTotal > 0
            ? `Notifications, ${alertTotal} pending`
            : "Notifications"
        }
        onClick={() => {
          onCloseOthers();
          dismissMobileNavOverlays("notify");
          setOpen(v => !v);
        }}
      >
        <Zap size={17} strokeWidth={2.4} aria-hidden="true" />
        {alertTotal > 0 && <span className="hub-notify-btn__badge">{alertTotal}</span>}
      </button>
      {open && (
        <div className="site-mobile-notify__panel" role="dialog" aria-label="Notifications">
          <div className="site-mobile-notify__head">Notifications</div>
          <div className="site-mobile-notify__list">
            {isLoading && <p className="site-mobile-notify__empty">Loading…</p>}
            {!isLoading && notifications.length === 0 && (
              <p className="site-mobile-notify__empty">No messages yet.</p>
            )}
            {notifications.map(row => {
              const unread = !(row.isRead ?? row.is_read);
              const subject = row.subject?.trim() || "New message";
              return (
                <button
                  key={row.id}
                  type="button"
                  className={`site-mobile-notify__row${unread ? " is-unread" : ""}`}
                  onClick={() => {
                    close();
                    openSheet();
                  }}
                >
                  {unread && <span className="site-mobile-notify__dot" aria-hidden="true" />}
                  <span className="site-mobile-notify__row-top">
                    <span className="site-mobile-notify__sender">{senderLabel(row)}</span>
                    <span className="site-mobile-notify__time">
                      {formatNotifyTime(row.createdAt || row.created_at)}
                    </span>
                  </span>
                  <span className="site-mobile-notify__tag">{notifyHeadline(row)}</span>
                  <span className="site-mobile-notify__subject">{subject}</span>
                </button>
              );
            })}
          </div>
          <div className="site-mobile-notify__foot">
            {adminPending > 0 && (
              <button
                type="button"
                className="site-mobile-notify__foot-btn"
                onClick={() => {
                  close();
                  openSheet({ view: "inbox", account: "admin" });
                }}
              >
                Admin queue ({adminPending})
              </button>
            )}
            <Link
              href="/dashboard?section=settings"
              className="site-mobile-notify__foot-btn"
              onClick={close}
            >
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { openSheet } = useInboxSheet();
  const [showAuth, setShowAuth] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");
  /** Ticket gate only when arriving from direct secret-story close (?from=stank-egg). */
  const [showStankTicketGate, setShowStankTicketGate] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useMemo(() => () => setSearchOpen(true), []);
  useSiteSearchHotkey(openSearch);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const fetching = useIsFetching();

  // Deep link: /?auth=register (or join/signup) opens Join modal.
  // Direct secret-story exit uses /?auth=register&from=stank-egg → ticket gate first.
  useEffect(() => {
    if (user) return;
    const params = new URLSearchParams(window.location.search);
    const auth = (params.get("auth") || "").toLowerCase();
    if (auth !== "register" && auth !== "join" && auth !== "signup") return;
    const from = (params.get("from") || "").toLowerCase();
    const viaStankEgg = from === "stank-egg" || from === "stank";
    setAuthDefaultTab("register");
    if (viaStankEgg) {
      setShowStankTicketGate(true);
    } else {
      setShowAuth(true);
    }
    params.delete("auth");
    params.delete("from");
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", next);
  }, [user, location]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setMobileProfileOpen(false);
    setOpenDropdown(null);
    setRouteLoading(true);
    const t = window.setTimeout(() => setRouteLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [location]);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!mobileProfileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!mobileProfileRef.current?.contains(event.target as Node)) {
        setMobileProfileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileProfileOpen]);

  useEffect(() => {
    if (!openDropdown) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!navScrollRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenDropdown(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown]);

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled: !!user,
    refetchInterval: 90000,
  });

  const isAdmin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  const canManageTeam = Boolean(user?.canManageTeam || user?.isPrimaryOwner);
  const isPrimaryOwner = Boolean(user?.isPrimaryOwner);
  const { data: pendingAdmin = { count: 0, ownerCount: 0 } } = useQuery<{ count: number; ownerCount?: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0, ownerCount: 0 },
      ),
    enabled: !!user && isAdmin,
    refetchInterval: 90000,
  });

  const unreadCount = unread.count || 0;
  const adminPending = (pendingAdmin.count || 0) + (user?.isPrimaryOwner ? (pendingAdmin.ownerCount || 0) : 0);
  const closeMenu = () => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };
  const hubActive = location === "/dashboard" || location.startsWith("/dashboard?");
  const localDemo = isLocalDemo();
  const profilePath = user
    ? `/u/${encodeURIComponent(user.username)}`
    : localDemo
      ? LOCAL_DEMO_PROFILE_PATH
      : "";
  const profileActive = Boolean(
    profilePath && (location === profilePath || location.startsWith(`${profilePath}/`)),
  );
  const aboutActive = navLinkActive(location, "/about");
  const homeActive = location === "/";
  const nextActive = navLinkActive(location, "/next");

  const seamLoading = routeLoading || fetching > 0;

  return (
    <>
      <header className="site-header site-header--real-seam">
        <div className="site-header-inner">
          <Link href="/" className="site-brand site-brand--desktop" aria-label="Zaylist home">
            <GlitchLogo
              src="/brand/family/zaylist-primary.svg"
              alt="Zaylist"
              className="site-brand-lockup"
            />
          </Link>

          <div className="hub-mtop site-hub-mtop" aria-label="Mobile navigation">
            <div className="hub-mtop__mode" role="group" aria-label="Site sections">
              <Link
                href="/"
                className={`hub-mtop__mode-btn${homeActive ? " is-active is-member" : ""}`}
                data-accent="lime"
                aria-current={homeActive ? "page" : undefined}
                onClick={() => dismissMobileNavOverlays()}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`hub-mtop__mode-btn${aboutActive ? " is-active is-member" : ""}`}
                data-accent="magenta"
                aria-current={aboutActive ? "page" : undefined}
                onClick={() => dismissMobileNavOverlays()}
              >
                About
              </Link>
              <Link
                href="/next"
                className={`hub-mtop__mode-btn${nextActive ? " is-active is-member" : ""}`}
                aria-current={nextActive ? "page" : undefined}
                onClick={() => dismissMobileNavOverlays()}
              >
                Next
              </Link>
            </div>
            <div className="hub-mtop__spacer" />
            <button
              type="button"
              className="site-search-trigger site-search-trigger--mobile"
              onClick={() => {
                dismissMobileNavOverlays();
                setSearchOpen(true);
              }}
              aria-label="Search events and places"
              data-testid="site-search-trigger-mobile"
            >
              <Search size={18} aria-hidden="true" />
            </button>
            {user && (
              <MobileNotifyMenu
                unreadCount={unreadCount}
                adminPending={adminPending}
                openSheet={openSheet}
                onCloseOthers={() => {
                  setMobileProfileOpen(false);
                  dismissMobileNavOverlays("notify");
                }}
              />
            )}
            {user ? (
              <ProfileMenu
                user={user}
                profileOpen={mobileProfileOpen}
                setProfileOpen={setMobileProfileOpen}
                profileRef={mobileProfileRef}
                profilePath={profilePath}
                profileActive={profileActive}
                hubActive={hubActive}
                unreadCount={unreadCount}
                location={location}
                openSheet={openSheet}
                logout={logout}
                onMenuClose={closeMenu}
                isAdmin={isAdmin}
                canManageTeam={canManageTeam}
                isPrimaryOwner={isPrimaryOwner}
              />
            ) : localDemo ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link
                  href="/dashboard"
                  className={`hub-mtop__mode-btn${hubActive ? " is-active is-member" : ""}`}
                  data-accent="cyan"
                  onClick={() => dismissMobileNavOverlays()}
                >
                  Hub
                </Link>
                <Link
                  href={LOCAL_DEMO_PROFILE_PATH}
                  className={`hub-mtop__mode-btn${profileActive ? " is-active is-member" : ""}`}
                  data-accent="violet"
                  onClick={() => dismissMobileNavOverlays()}
                >
                  Profile
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className="hub-mtop__mode-btn is-active is-admin"
                onClick={() => setShowAuth(true)}
              >
                Join
              </button>
            )}
          </div>

          <nav
            id="site-nav-menu"
            className={`site-nav${menuOpen ? " open" : ""}`}
            aria-label="Primary navigation"
          >
            <div className="site-nav-scroll" ref={navScrollRef}>
              {navEntries.map(entry => {
                if (entry.type === "link") {
                  return (
                    <NavLink
                      key={entry.href}
                      href={entry.href}
                      label={entry.label}
                      accent={entry.accent}
                      active={navLinkActive(location, entry.href)}
                      onClick={closeMenu}
                    />
                  );
                }

                return (
                  <NavDropdown
                    key={entry.id}
                    id={entry.id}
                    label={entry.label}
                    items={entry.items}
                    accent={entry.accent}
                    eyebrow={entry.eyebrow}
                    feature={entry.feature}
                    location={location}
                    open={openDropdown === entry.id}
                    onToggle={() => setOpenDropdown(current => (current === entry.id ? null : entry.id))}
                    onClose={closeMenu}
                  />
                );
              })}
            </div>

            <button
              type="button"
              className="site-search-trigger site-search-trigger--desktop-nav"
              onClick={() => setSearchOpen(true)}
              aria-label="Search events and places"
              title="Search (⌘K)"
              data-testid="site-search-trigger"
            >
              <Search size={18} aria-hidden="true" />
              <span className="site-search-trigger__label">Search</span>
            </button>

            {user && (
              <div className="site-auth site-auth--desktop">
                <ProfileMenu
                  user={user}
                  profileOpen={profileOpen}
                  setProfileOpen={setProfileOpen}
                  profileRef={profileRef}
                  profilePath={profilePath}
                  profileActive={profileActive}
                  hubActive={hubActive}
                  unreadCount={unreadCount}
                  location={location}
                  openSheet={openSheet}
                  logout={logout}
                  onMenuClose={closeMenu}
                  isAdmin={isAdmin}
                  canManageTeam={canManageTeam}
                  isPrimaryOwner={isPrimaryOwner}
                />
              </div>
            )}

            {/* Local demo guest: Hub + public Tucker profile without a session */}
            {!user && localDemo && (
              <div className="site-auth site-auth--desktop site-auth--local-demo">
                <NavLink
                  href={LOCAL_DEMO_PROFILE_PATH}
                  label="@tucker_pdmax"
                  active={profileActive}
                  onClick={closeMenu}
                />
              </div>
            )}

            {!user && !localDemo && (
              <button
                onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                className="site-login-button"
              >
                LOG IN / JOIN
              </button>
            )}
          </nav>

          <div className="site-header-controls">
            {(user || localDemo) && (
              <span className="site-header-calm--desktop">
                <Link
                  href="/dashboard"
                  className={`site-hub-button${hubActive ? " active" : ""}`}
                  aria-label={user && unreadCount > 0 ? `Hub, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}` : "Hub"}
                  onClick={closeMenu}
                >
                  Hub
                  {Boolean(user && unreadCount > 0) && <span className="site-nav-notify-dot" aria-hidden="true" />}
                </Link>
              </span>
            )}
            <button
              type="button"
              className="site-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-nav-menu"
              onClick={() => setMenuOpen(open => !open)}
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
              <span>{menuOpen ? "CLOSE" : "MENU"}</span>
            </button>
          </div>
        </div>
        <Divider
          seam
          thin
          loading={seamLoading}
          className="site-header-rainbow-seam"
        />
      </header>

      {showStankTicketGate && (
        <StankTicketGate
          onContinue={() => {
            setShowStankTicketGate(false);
            setAuthDefaultTab("register");
            setShowAuth(true);
          }}
          onClose={() => setShowStankTicketGate(false)}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            setAuthDefaultTab("login");
          }}
          defaultTab={authDefaultTab}
        />
      )}

      <SiteSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
