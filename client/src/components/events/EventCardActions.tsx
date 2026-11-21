import { EventDirections } from "./EventDirections";
import { useId,useLayoutEffect,useRef,useState,type CSSProperties } from "react";
import { X } from "lucide-react";
import type { EventListing } from "@shared/multiDayEvents";
import { DiscoveryWordmark } from "../drawers/DiscoveryWordmark";
import { resolveDirectoryLogo } from "@/lib/directoryLogos";
import NightDrawer from "../afterz/NightDrawer";
import EventPlanning from "./EventPlanning";

const tiles = [
  { key: "ridez", color: "var(--neon-orange)", art: <><path d="M4 16l1.6-5.2A2 2 0 0 1 7.5 9.4h9a2 2 0 0 1 1.9 1.4L20 16M4 16h16M4 16v3m16-3v3"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></> },
  { key: "afterz", color: "var(--day-wed)", art: <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.8 6.8 0 0 0 20 13.5z"/> },
  { key: "directions", color: "var(--green-acid)", art: <><path d="M12 21s-6.5-5.6-6.5-10.3A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.7C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.3"/></> },
  { key: "website", color: "var(--neon-violet)", art: <><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z"/></> },
] as const;
type Tile = typeof tiles[number];


export function EventActionTiles({ event, website, googleDirections, appleDirections }: {
  event: EventListing; website?: string | null; googleDirections: string; appleDirections: string;
}) {
  const [open, setOpen] = useState<Tile | null>(null);
  const panelId = useId();
  const swipeStart = useRef<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const venueMark = open?.key === "website" ? resolveDirectoryLogo(event.venueName) : null;
  function close() {
    setOpen(null);
    trigger.current?.focus();
  }
  return <>
    <div className="evz-actions" aria-label="Event actions">
      {tiles.filter(tile => (tile.key !== "website" || website) && (tile.key !== "directions" || !event.isPrivate)).map(tile => <button type="button" key={tile.key}
        style={{"--piece": tile.color} as CSSProperties} aria-expanded={open?.key === tile.key}
        aria-controls={open?.key === tile.key ? panelId : undefined}
        onClick={e => { trigger.current = e.currentTarget; setOpen(open?.key === tile.key ? null : tile); }}>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{tile.art}</svg></span>
        {tile.key}
      </button>)}
    </div>
    {open && <section key={open.key} id={panelId} data-glass-piece="overlay" className="evz-action-drawer" aria-label={open.key} style={{"--piece":open.color} as CSSProperties}>
      <button type="button" className="evz-drawer-grip" aria-label="Collapse action drawer"
        onPointerDown={e => { swipeStart.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if (swipeStart.current !== null && swipeStart.current - e.clientY > 32) { swipeStart.current = null; close(); } }}
        onPointerCancel={() => { swipeStart.current = null; }}
        onClick={close}><span/></button>
      <button type="button" className="evz-action-close" onClick={close} aria-label={`Close ${open.key}`}><X size={17}/></button>
      {open.key !== "afterz" && <div className="evz-action-brand">
        {venueMark ? <img src={venueMark} alt={event.venueName} /> :
          <DiscoveryWordmark rooms={[open.key === "directions" ? "placez" : "eventz"]} />}
      </div>}
      {open.key === "ridez" && <EventPlanning eventId={event.id} occurrenceDate={event.dateStart} section="rides"/>}
      {open.key === "afterz" && <NightDrawer eventId={event.id} occurrenceDate={event.dateStart}/>}
      {open.key === "directions" && <EventDirections event={event} google={googleDirections} apple={appleDirections}/>}
      {open.key === "website" && website && <><h3>{event.venueName}</h3><a className="evz-x__link" href={website} target="_blank" rel="noreferrer">Visit website</a></>}
    </section>}
  </>;
}

export function EventPosterDialog({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return <dialog ref={dialog} className="evz-poster-full" aria-label={`Poster for ${title}`}
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    <img src={src} alt={`Full poster for ${title}`}/>
    <button type="button" aria-label="Close poster" onClick={onClose}><X/></button>
  </dialog>;
}
