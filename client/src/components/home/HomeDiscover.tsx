import type { CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, CalendarDays, LayoutGrid, LifeBuoy, MapPinned, X } from "lucide-react";
import { Link } from "wouter";
import "./HomeDiscover.css";

const destinations = [
  { icon: CalendarDays, name: "EVENTZ", description: "Find something to do.", href: "/events", accent: "var(--room-eventz)" },
  { icon: MapPinned, name: "PLACEZ", description: "Find somewhere to go.", href: "/directory", accent: "var(--room-placez)" },
  { icon: LayoutGrid, name: "OUR BOARDZ", description: "Find people, work, and things.", href: "/boardz", accent: "var(--neon-magenta)" },
  { icon: LifeBuoy, name: "NEEDZ", description: "Find care and support.", href: "/needz", accent: "var(--green-acid)" },

];

export default function HomeDiscover({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className="home-discover-trigger pdx-glass-rebind">
          <strong>Start here</strong><ArrowRight size={25} aria-hidden="true" />
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
