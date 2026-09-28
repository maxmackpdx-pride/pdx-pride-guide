import { useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CalendarDays, Check, Gift, Heart, House, Tags, Trees, X } from "lucide-react";
import { Link } from "wouter";
import "./HomeDiscover.css";

const destinations = [
  { icon: CalendarDays, title: "A night out", description: "Find events worth showing up for.", href: "/events", accent: "var(--neon-cyan)" },
  { icon: Trees, title: "An outdoor escape", description: "Get out. Find your next adventure.", href: "/outzide", accent: "var(--neon-orange)" },
  { icon: Heart, title: "That person you noticed", description: "Maybe they noticed you, too.", href: "/spotted", accent: "var(--board-spotted)" },
  { icon: House, title: "A roommate", description: "Find your people. Share a place.", href: "/the-hauz", accent: "var(--neon-cyan)" },
  { icon: Gift, title: "Something to give", description: "Give it a new home. Find something free.", href: "/gifting", accent: "var(--board-gifting)" },
  { icon: Tags, title: "Something to buy or sell", description: "Find what you need. Pass something on.", href: "/sellz", accent: "var(--neon-green)" },
];
const groups = [
  { label: "Everything", indices: [0, 1, 2, 3, 4, 5] },
  { label: "Go somewhere", indices: [0, 1] },
  { label: "Connect", indices: [2, 3] },
  { label: "Give & trade", indices: [4, 5] },
];

/** Approved invitation/intent blend. Account access remains in the site navigation. */
export default function HomeDiscover({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [group, setGroup] = useState(0);
  return (
    <Dialog.Root open={open} onOpenChange={next => { if (next) setGroup(0); onOpenChange(next); }}>
      <Dialog.Trigger asChild>
        <button type="button" className="home-discover-trigger pdx-glass-rebind">
          Find your next <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="home-discover-backdrop" />
        <Dialog.Content className="home-discover pdx-glass-rebind pdx-liquid-overlay" aria-describedby="home-discover-description">
          <span className="home-discover__seam" aria-hidden="true" />
          <header className="home-discover__header">
            <span className="home-discover__eyebrow">Find your next</span>
            <Dialog.Close className="home-discover__close pdx-glass-rebind" aria-label="Close">
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </header>
          <Dialog.Title className="home-discover__title">What are you looking for?</Dialog.Title>
          <Dialog.Description id="home-discover-description" className="sr-only">
            Explore all six destinations or narrow your choices by what you want to do.
          </Dialog.Description>
          <div className="home-discover__filters" role="group" aria-label="Narrow your choices">
            {groups.map((item, index) => (
              <button key={item.label} type="button" className="home-discover__filter pdx-glass-rebind" aria-pressed={group === index} aria-controls="home-discover-destinations" onClick={() => setGroup(index)}>
                {group === index && <Check size={14} aria-hidden="true" />}{item.label}
              </button>
            ))}
          </div>
          <div id="home-discover-destinations" className="home-discover__destinations">
            {groups[group].indices.map(index => {
              const item = destinations[index];
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="home-discover__choice pdx-glass-rebind" style={{ "--c": item.accent } as CSSProperties} onClick={() => onOpenChange(false)}>
                  <Icon className="home-discover__icon" size={24} strokeWidth={1.75} aria-hidden="true" />
                  <span className="home-discover__copy"><strong>{item.title}</strong><span>{item.description}</span></span>
                  <ArrowUpRight className="home-discover__arrow" size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          <span className="sr-only" role="status">{groups[group].indices.length} destinations shown</span>
          <p className="home-discover__footer">Your queer Portland. A place for what’s next.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
