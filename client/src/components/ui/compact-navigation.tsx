import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Info, CalendarDays, MapPin, Map, TreePine, Layers, House, LayoutGrid, PanelsTopLeft, ChevronDown, Menu, X, MessageCircle, type LucideIcon } from "lucide-react";
import { PRIMARY_NAV, navLinkActive, type NavEntry } from "@/lib/siteNav";
import { MOBILE_NAV_DISMISS, dismissMobileNavOverlays } from "@/lib/mobileNavDismiss";

// 21st arunachalam/Bottom Nav Bar (8343): spring width/opacity label reveal.
// https://21st.dev/@arunachalam/components/bottom-nav-bar
// Combined with soralabs/Dock Nav (19177)'s focused-item interaction, then
// adapted to Tucker's Caption Dock + Split Rail selection (2026-09-08).
// Real routes and Radix disclosures replace the catalog's local tab selection.
const ICONS: Record<string, LucideIcon> = {
  Home, About: Info, Eventz: CalendarDays, Placez: MapPin, Mapz: Map,
  OutZide: TreePine, "Z/ List": Layers, "The Haüz": House, Boards: LayoutGrid,
};
const entryKey = (entry: NavEntry) => entry.type === "link" ? entry.href : entry.id;
const entryActive = (entry: NavEntry, location: string) => entry.type === "link"
  ? navLinkActive(location, entry.href)
  : entry.items.some(item => navLinkActive(location, item.href));

function useQuietMotion() {
  const reduced = useReducedMotion();
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const update = () => setCalm(document.documentElement.classList.contains("calm-mode") || document.documentElement.dataset.calm === "true");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => observer.disconnect();
  }, []);
  return reduced || calm;
}

export function CompactNavigation({ location, onNavigate, entries = PRIMARY_NAV }: { location: string; onNavigate: () => void; entries?: NavEntry[] }) {
  const [focused, setFocused] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const quiet = useQuietMotion();
  useEffect(() => { setOpen(null); setFocused(null); }, [location]);
  useEffect(() => {
    const close = () => setOpen(null);
    window.addEventListener(MOBILE_NAV_DISMISS, close);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, close);
  }, []);
  return <div className="znav-rail" onMouseLeave={() => setFocused(null)}>
    {entries.map(entry => {
      const key = entryKey(entry);
      const Icon = ICONS[entry.label];
      const active = entryActive(entry, location);
      const expanded = open === key || (focused ? focused === key : active);
      const content = <><span className="znav-icon-row"><Icon size={20} strokeWidth={1.8} aria-hidden="true" />
        <motion.span initial={false} animate={{ width: expanded ? 66 : 0, opacity: expanded ? 1 : 0, marginLeft: expanded ? 7 : 0 }} transition={quiet ? { duration: 0 } : { width: { type: "spring", stiffness: 350, damping: 32 }, opacity: { duration: 0.19 }, marginLeft: { duration: 0.19 } }} className="znav-expanding-label">{entry.label}</motion.span>
        {entry.type === "dropdown" && <ChevronDown className="znav-chevron" size={11} aria-hidden="true" />}
      </span><span className="znav-caption" aria-hidden="true">{entry.label}</span></>;
      const className = `znav-control pdx-glass-rebind${active ? " is-active" : ""}${open === key ? " is-open" : ""}`;
      return <div key={key} className={`znav-item${entry.label === "About" ? " znav-item--split" : ""}`} data-accent={entry.accent}>
        {entry.type === "link" ? <Link href={entry.href} className={className} data-accent={entry.accent} aria-label={entry.label} aria-current={active ? "page" : undefined} onMouseEnter={() => setFocused(key)} onFocus={() => setFocused(key)} onBlur={() => setFocused(null)} onClick={onNavigate}>{content}</Link> :
          <DropdownMenu.Root open={open === key} onOpenChange={value => { if (value) dismissMobileNavOverlays(); setOpen(value ? key : null); }}>
            <DropdownMenu.Trigger className={className} data-accent={entry.accent} aria-label={entry.label} onMouseEnter={() => setFocused(key)} onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}>{content}</DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content className="znav-dropdown pdx-liquid-overlay" aria-label={entry.label} sideOffset={10} align={entry.id === "boards" ? "end" : "start"} collisionPadding={12}>
              {entry.eyebrow && <DropdownMenu.Label className="znav-eyebrow">{entry.eyebrow}</DropdownMenu.Label>}
              {entry.items.map(item => <DropdownMenu.Item asChild key={item.href}><Link href={item.href} className="znav-menu-link" data-accent={item.accent ?? entry.accent} aria-current={navLinkActive(location, item.href) ? "page" : undefined} onClick={onNavigate}>{item.label}</Link></DropdownMenu.Item>)}
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>}
      </div>;
    })}
  </div>;
}

/** Hub shares the destination controls' icon, caption, and accent-rim treatment. */
export function CompactHubLink({ active, unreadCount = 0, onNavigate }: { active: boolean; unreadCount?: number; onNavigate: () => void }) {
  return <Link href="/dashboard" className={`znav-control znav-hub pdx-glass-rebind${active ? " is-active" : ""}`} data-accent="cyan" aria-current={active ? "page" : undefined} aria-label={unreadCount > 0 ? `Hub, ${unreadCount} unread messages` : "Hub"} onClick={onNavigate}>
    <span className="znav-icon-row"><PanelsTopLeft size={20} strokeWidth={1.8} aria-hidden="true" />{unreadCount > 0 && <span className="znav-hub-badge" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}</span>
    <span className="znav-caption" aria-hidden="true">Hub</span>
  </Link>;
}

/** The same caption rail scrolls within the phone header, below account controls. */
export function MobileExploreNavigation({ location, onMessages }: { location: string; onMessages: () => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const messagesPending = useRef(false);
  useEffect(() => { setOpen(false); setGroup(null); }, [location]);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(MOBILE_NAV_DISMISS, close);
    return () => window.removeEventListener(MOBILE_NAV_DISMISS, close);
  }, []);
  return <Dialog.Root open={open} onOpenChange={value => { if (value) dismissMobileNavOverlays(); setOpen(value); }}>
    <div className="znav-mobile-row"><nav className="znav-mobile-scroll" aria-label="Mobile primary navigation"><CompactNavigation location={location} onNavigate={() => dismissMobileNavOverlays()} /></nav><Dialog.Trigger className="znav-control znav-explore-trigger" data-accent="cyan" aria-label="Explore all navigation"><span className="znav-icon-row"><Menu size={20} aria-hidden="true" /></span><span className="znav-caption" aria-hidden="true">Explore</span></Dialog.Trigger></div>
    <Dialog.Portal><Dialog.Overlay className="znav-scrim" /><Dialog.Content className="znav-mobile-sheet pdx-liquid-overlay" onCloseAutoFocus={event => {
      if (messagesPending.current) { event.preventDefault(); messagesPending.current = false; onMessages(); }
    }}>
      <div className="znav-sheet-heading"><Dialog.Title>Explore Zaylist</Dialog.Title><Dialog.Close className="znav-close" aria-label="Close navigation"><X size={20} /></Dialog.Close></div>
      <Dialog.Description className="sr-only">Choose a page or open a destination group.</Dialog.Description>
      <nav aria-label="Mobile destinations">{PRIMARY_NAV.map(entry => {
        const Icon = ICONS[entry.label];
        if (entry.type === "link") return <Link key={entry.href} href={entry.href} className="znav-menu-link" data-accent={entry.accent} aria-current={entryActive(entry, location) ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={19} aria-hidden="true" />{entry.label}</Link>;
        return <div key={entry.id}><button className="znav-menu-link" data-accent={entry.accent} aria-expanded={group === entry.id} aria-controls={`znav-mobile-${entry.id}`} onClick={() => setGroup(group === entry.id ? null : entry.id)}><Icon size={19} aria-hidden="true" />{entry.label}<ChevronDown size={15} className="znav-group-chevron" /></button>
          {group === entry.id && <div id={`znav-mobile-${entry.id}`} className="znav-mobile-group">{entry.items.map(item => <Link key={item.href} href={item.href} className="znav-menu-link" data-accent={item.accent} onClick={() => setOpen(false)}>{item.label}</Link>)}</div>}
        </div>;
      })}<button className="znav-menu-link" onClick={() => { messagesPending.current = true; setOpen(false); }}><MessageCircle size={19} aria-hidden="true" />Messages</button></nav>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
