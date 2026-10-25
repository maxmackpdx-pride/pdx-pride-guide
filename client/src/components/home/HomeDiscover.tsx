import { useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, CalendarDays, LayoutGrid, LifeBuoy, MapPinned, X } from "lucide-react";
import { Link } from "wouter";
import "./HomeDiscover.css";

const destinations = [
  { icon: CalendarDays, name: "EVENTZ", description: "Find something to do.", href: "/events", accent: "var(--room-eventz)" },
  { icon: MapPinned, name: "PLACEZ", description: "Find somewhere to go.", href: "/directory", accent: "var(--room-placez)" },
  { icon: LayoutGrid, name: "OUR BOARDZ", description: "Find people, work, and things.", href: "/boardz", accent: "var(--neon-magenta)" },
  { icon: LifeBuoy, name: "NEEDZ", description: "Find care, support, clubs, and groups.", href: "/needz", accent: "var(--green-acid)" },

];

/**
 * "Start here": the entry panel that sits directly above the Explore Today rail, and the dialog it opens.
 * The panel is a glass card (no opaque fill), so the shared site wallpaper shows through it. Title is the ransom-note
 * treatment with exactly one whole word inverted (white on black, one word black on white), never mixed letters.
 */
export default function HomeDiscover({ open: controlledOpen, onOpenChange: controlledChange }: { open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const onOpenChange = (next: boolean) => { setInnerOpen(next); controlledChange?.(next); };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className="home-start pdx-glass-rebind" aria-label="Start here: choose where to go on Zaylist">
          <span className="home-start__copy">
            <span className="home-start__eyebrow">Queer Portland, connected.</span>
            <span className="home-start__title" aria-hidden="true">
              <span className="home-start__word">Start</span>
              <span className="home-start__word home-start__word--inverted">here</span>
            </span>
            <span className="home-start__ask">What do you need today?</span>
          </span>
          <span className="home-start__rooms" aria-hidden="true">
            {destinations.map(item => (
              <span key={item.href} className="home-start__room pdx-glass-rebind" style={{ "--c": item.accent } as CSSProperties}><i />{item.name.replace("OUR ", "")}</span>
            ))}
          </span>
          <span className="home-start__go" aria-hidden="true"><ArrowRight size={22} /></span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="home-discover-backdrop" />
        <Dialog.Content className="home-discover pdx-glass-rebind pdx-liquid-overlay">
          <span className="home-discover__seam pdx-rainbow-rule" aria-hidden="true" />
          <header className="home-discover__header">
            <span className="home-discover__eyebrow">Queer Portland, connected.</span>
            <Dialog.Close className="home-discover__close pdx-glass-rebind" aria-label="Close Start Here"><X size={20} aria-hidden="true" /></Dialog.Close>
          </header>
          <Dialog.Title className="home-discover__title">Start here.</Dialog.Title>
          <Dialog.Description className="home-discover__intro">What do you need today?</Dialog.Description>
          <nav className="home-discover__destinations" aria-label="Choose your destination">
            {destinations.map(item => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className="home-discover__choice pdx-glass-rebind" style={{ "--c": item.accent } as CSSProperties} onClick={() => onOpenChange(false)}>
                <Icon className="home-discover__icon" size={28} strokeWidth={1.75} aria-hidden="true" />
                <span className="home-discover__copy"><strong>{item.name}</strong><span>{item.description}</span></span>
                <ArrowRight className="home-discover__arrow" size={22} aria-hidden="true" />
              </Link>;
            })}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
