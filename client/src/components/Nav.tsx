import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useLocation } from "wouter";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, House, Inbox, Search, Settings, Trash2, UserRound, UsersRound } from "lucide-react";
import { MenuCloseIcon } from "@/components/ui/animated-state-icons";
import { CompactHubLink, CompactNavigation } from "@/components/ui/compact-navigation";
import GlitchLogo from "@/components/GlitchLogo";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import AuthModal from "./AuthModal";
import StankTicketGate from "./StankTicketGate";
import UserAvatar from "@/components/UserAvatar";
import SiteSearch, { useSiteSearchHotkey } from "@/components/SiteSearch";
import { Divider } from "@/components/ds";
import { navGlassPointer } from "@/components/ui/nav-glass";
import { MobileLiquidGlass } from "@/components/ui/mobile-liquid-glass";
import { ButtonGlassOptics } from "@/components/ui/button-glass-optics";
import { counterpartyAvatar } from "@/lib/inboxAvatar";
import { contextLabelOf, contextTypeOf, notifyContextTag } from "@/lib/inboxContext";
import { BOARD_NAV, PRIMARY_NAV, navLinkActive } from "@/lib/siteNav";
import type { NavAccent } from "@/lib/siteNav";
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
  return (
    <Link
      href={href}
      className={`site-nav-link${active ? " active" : ""}${showNotify ? " site-nav-link--notify" : ""}`}
      data-accent={accent}
      onClick={onClick}
      aria-label={notifyLabel}
      aria-current={active ? "page" : undefined}
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
        className="site-nav-dropdown__panel pdx-liquid-overlay"
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
  adminPending,
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
  adminPending: number;
  location: string;
  onClose: () => void;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner"; threadId?: string | null }) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  canManageTeam: boolean;
  isPrimaryOwner: boolean;
}) {
  const hubSection = hubActive
    ? parseHubSection(new URLSearchParams(window.location.search).get("section"))
    : undefined;

  return (
    <div className="site-profile-menu__panel pdx-liquid-overlay" role="menu">
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
        className="site-profile-menu__item site-profile-menu__messages"
        aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages"}
        onClick={() => { onClose(); openSheet(); }}
      >
        <span className="site-profile-menu__messages-label"><Inbox size={17} strokeWidth={2} aria-hidden="true" />Messages</span>
        {unreadCount > 0 && <span className="site-profile-menu__messages-badge" aria-hidden="true">{unreadCount}</span>}
      </button>
      <ProfileBoardsFolder location={location} onClose={onClose} />
      <NotifyMenu unreadCount={unreadCount} adminPending={adminPending} openSheet={openSheet} onClose={onClose} />
      <HubMemberFolder
        hubActive={hubActive}
        hubSection={hubSection}
        location={location}
        onClose={onClose}
      />
      {isAdmin && (
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
          void logout().catch(() => {});
          onClose();
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function ProfileBoardsFolder({ location, onClose }: { location: string; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return <div className="hub-member-folder">
    <button type="button" className="site-profile-menu__item hub-member-folder__toggle" aria-expanded={open} aria-controls="profile-board-links" onClick={() => setOpen(value => !value)}><span>Boards</span><ChevronDown size={14} strokeWidth={2.4} aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }} /></button>
    {open && <div id="profile-board-links" className="hub-member-folder__children" role="group" aria-label="Boards">{BOARD_NAV.map(item => <Link key={item.href} href={item.href} role="menuitem" className={`site-profile-menu__item hub-member-folder__child${location === item.href ? " active" : ""}`} onClick={onClose}>{item.label}</Link>)}</div>}
  </div>;
}

function HubMemberFolder({
  hubActive,
  hubSection,
  location,
  onClose,
}: {
  hubActive: boolean;
  hubSection: ReturnType<typeof parseHubSection> | undefined;
  location: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const profileEditorOpen = location.startsWith("/dashboard") && new URLSearchParams(window.location.search).get("edit") === "profile";
  const items = [
    { label: "Feed", href: "/dashboard", icon: House, active: hubActive && hubSection === "feed" },
    { label: "Profile", href: "/dashboard?edit=profile", icon: UserRound, active: profileEditorOpen },
    { label: "Events", href: "/dashboard?section=events", icon: CalendarDays, active: hubActive && hubSection === "events" },
    { label: "People", href: "/dashboard?section=people", icon: UsersRound, active: hubActive && hubSection === "people" },
    { label: "Settings", href: "/dashboard?section=settings", icon: Settings, active: hubActive && hubSection === "settings" },
  ];

  return (
    <div className="hub-member-folder">
      <button
        type="button"
        className="site-profile-menu__item hub-member-folder__toggle"
        aria-expanded={open}
        aria-controls="profile-member-sections"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Member</span>
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div id="profile-member-sections" className="hub-member-folder__children" role="group" aria-label="Member sections">
          {items.map(({ label, href, icon: Icon, active }) => (
            <Link key={href} href={href} role="menuitem" className={`site-profile-menu__item hub-member-folder__child${active ? " active" : ""}`} onClick={onClose}>
              <Icon size={16} strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
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
  adminPending,
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
  adminPending: number;
  location: string;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner"; threadId?: string | null }) => void;
  logout: () => Promise<void>;
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
          <ButtonGlassOptics />
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
          adminPending={adminPending}
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

function NotifyMenu({
  unreadCount,
  adminPending,
  openSheet,
  onClose,
}: {
  unreadCount: number;
  adminPending: number;
  openSheet: (opts?: { view?: "inbox" | "posts" | "stats"; account?: "personal" | "admin" | "owner"; threadId?: string | null }) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const queryClient = useQueryClient();
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

  const remove = async (id: number) => {
    if (deleting !== null) return;
    setDeleting(id);
    setError("");
    try {
      const response = await fetch(`/api/messages/${id}/inbox`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Could not delete notification.");
      queryClient.setQueryData<ApiMessageRow[]>(["/api/messages/inbox"], previous => previous?.filter(row => row.id !== id));
      await queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    } catch {
      setError("Could not delete notification. Try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="hub-member-folder site-profile-notify">
      <button
        type="button"
        className="site-profile-menu__item hub-member-folder__toggle"
        aria-expanded={open}
        aria-controls="profile-notification-sections"
        onClick={() => setOpen(value => !value)}
      >
        <span>Notifications{alertTotal > 0 ? ` (${alertTotal})` : ""}</span>
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div id="profile-notification-sections" className="hub-member-folder__children site-profile-notify__children" role="group" aria-label="Notifications">
          <div className="site-mobile-notify__list">
            {isLoading && <p className="site-mobile-notify__empty">Loading…</p>}
            {!isLoading && notifications.length === 0 && (
              <p className="site-mobile-notify__empty">No notifications yet.</p>
            )}
            {error && <p className="site-profile-notify__error" role="alert">{error}</p>}
            {notifications.map(row => {
              const unread = !(row.isRead ?? row.is_read);
              const subject = row.subject?.trim() || "New message";
              return (
                <div key={row.id} className="site-profile-notify__entry" onPointerDown={event => {
                  if (event.pointerType === "touch") swipe.current = { id: row.id, x: event.clientX, y: event.clientY };
                }} onPointerUp={event => {
                  const start = swipe.current;
                  swipe.current = null;
                  if (start?.id === row.id && start.x - event.clientX > 85 && Math.abs(start.y - event.clientY) < 65) {
                    suppressClick.current = true;
                    window.setTimeout(() => { suppressClick.current = false; }, 250);
                    void remove(row.id);
                  }
                }} onPointerCancel={() => { swipe.current = null; }}>
                  <button
                    type="button"
                    className={`site-mobile-notify__row${unread ? " is-unread" : ""}`}
                    onClick={() => {
                      if (suppressClick.current) { suppressClick.current = false; return; }
                      onClose();
                      openSheet({ view: "inbox", account: "personal", threadId: row.threadId ?? row.thread_id ?? null });
                    }}
                  >
                    {unread && <span className="site-mobile-notify__dot" aria-hidden="true" />}
                    <span className="site-mobile-notify__row-top">
                      <span className="site-mobile-notify__sender">{senderLabel(row)}</span>
                      <span className="site-mobile-notify__time">{formatNotifyTime(row.createdAt || row.created_at)}</span>
                    </span>
                    <span className="site-mobile-notify__tag">{notifyHeadline(row)}</span>
                    <span className="site-mobile-notify__subject">{subject}</span>
                  </button>
                  <button type="button" className="site-profile-notify__delete" aria-label={`Delete notification from ${senderLabel(row)}`} disabled={deleting !== null} onClick={() => void remove(row.id)}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              );
            })}
          </div>
          <div className="site-mobile-notify__foot">
            {adminPending > 0 && (
              <button
                type="button"
                className="site-mobile-notify__foot-btn"
                onClick={() => {
                  onClose();
                  openSheet({ view: "inbox", account: "admin" });
                }}
              >
                Admin queue ({adminPending})
              </button>
            )}
            <Link
              href="/dashboard?section=settings"
              className="site-mobile-notify__foot-btn"
              onClick={onClose}
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
  const { user, logout, loading: authLoading } = useAuth();
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
  const headerRef = useRef<HTMLElement>(null);
  const fetching = useIsFetching();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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

  const seamLoading = routeLoading || fetching > 0;

  return (
    <>
      <header ref={headerRef} className="site-header site-header--real-seam site-header--compact site-header--caption-split z-glass site-header--glass" data-seam="bottom" data-map-surface={location.startsWith("/map") || location.startsWith("/outzide") || undefined} onPointerMove={navGlassPointer} onPointerLeave={navGlassPointer}>
        <MobileLiquidGlass quiet={false} />
        <div className="site-header-inner">
          <Link href="/" className="site-brand site-brand--desktop" aria-label="Zaylist home">
            <GlitchLogo
              src="/brand/family/zaylist-primary.svg"
              alt="Zaylist"
              className="site-brand-lockup"
            />
          </Link>

          <div className="hub-mtop site-hub-mtop" aria-label="Mobile navigation">
            <nav aria-label="Mobile top navigation"><CompactNavigation location={location} entries={PRIMARY_NAV.filter(entry => entry.type === "link" && (entry.href === "/" || entry.href === "/about"))} onNavigate={() => { closeMenu(); dismissMobileNavOverlays(); }} /></nav>
            <div className="hub-mtop__spacer" />
            {(user || localDemo) && (
              <CompactHubLink
                active={hubActive}
                unreadCount={unreadCount}
                onNavigate={() => {
                  setMobileProfileOpen(false);
                  dismissMobileNavOverlays();
                }}
              />
            )}
            {authLoading && !user ? (
              <span className="hub-mtop__mode-btn" role="status" aria-label="Checking your session">…</span>
            ) : user ? (
              <ProfileMenu
                user={user}
                profileOpen={mobileProfileOpen}
                setProfileOpen={setMobileProfileOpen}
                profileRef={mobileProfileRef}
                profilePath={profilePath}
                profileActive={profileActive}
                hubActive={hubActive}
                unreadCount={unreadCount}
                adminPending={adminPending}
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
                <UserAvatar href={LOCAL_DEMO_PROFILE_PATH} username="tucker_pdmax" title="Local demo profile" size={34} onClick={() => dismissMobileNavOverlays()} />
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
              <CompactNavigation textOnly location={location} onNavigate={closeMenu} />
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

            {(user || localDemo) && (
              <div className="site-auth site-auth--desktop">
                <span className="site-auth__hub">
                  <CompactHubLink textOnly active={hubActive} unreadCount={unreadCount} onNavigate={closeMenu} />
                </span>
                <span className="site-auth__seam" aria-hidden="true" />
                {user && (
                <ProfileMenu
                  user={user}
                  profileOpen={profileOpen}
                  setProfileOpen={setProfileOpen}
                  profileRef={profileRef}
                  profilePath={profilePath}
                  profileActive={profileActive}
                  hubActive={hubActive}
                  unreadCount={unreadCount}
                  adminPending={adminPending}
                  location={location}
                  openSheet={openSheet}
                  logout={logout}
                  onMenuClose={closeMenu}
                  isAdmin={isAdmin}
                  canManageTeam={canManageTeam}
                  isPrimaryOwner={isPrimaryOwner}
                />
                )}
              </div>
            )}

            {/* Local demo guest: public Tucker profile without a session */}
            {!user && localDemo && (
              <div className="site-auth site-auth--desktop site-auth--local-demo">
                <UserAvatar href={LOCAL_DEMO_PROFILE_PATH} username="tucker_pdmax" title="Local demo profile" size={38} onClick={closeMenu} />
              </div>
            )}

            {!user && !localDemo && !authLoading && (
              <button
                onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                className="site-login-button pdx-glass-rebind"
              >
                LOG IN / JOIN
              </button>
            )}
          </nav>

          <div className="site-header-controls">
            <button
              type="button"
              className="site-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls="site-nav-menu"
              onClick={() => setMenuOpen(open => !open)}
            >
              <MenuCloseIcon open={menuOpen} size={28} />
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
