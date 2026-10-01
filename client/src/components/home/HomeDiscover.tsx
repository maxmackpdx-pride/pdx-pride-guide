import { useId, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, Gift, Heart, House, MapPinned, Tags, Trees, Users, LifeBuoy, X } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { ResourceFilterButton } from "@/components/resources/ResourceFilterButton";
import "./HomeDiscover.css";

const destinations = [
  { icon: CalendarDays, room: "Eventz", title: "A night out", description: "Find events worth showing up for.", href: "/events", accent: "var(--room-eventz)" },
  { icon: Trees, room: "OutZide", title: "An outdoor escape", description: "Get out. Find your next adventure.", href: "/outzide", accent: "var(--room-outz)" },
  { icon: Heart, room: "Mizzed", title: "That person you noticed", description: "Maybe they noticed you, too.", href: "/mizzed", accent: "var(--room-mizzed)" },
  { icon: House, room: "The Haüz", title: "A roommate", description: "Find your people. Share a place.", href: "/the-hauz", accent: "var(--room-hauz)" },
  { icon: Gift, room: "Giftz", title: "Something to give", description: "Give it a new home. Find something free.", href: "/giftz", accent: "var(--room-giftz)" },
  { icon: Tags, room: "Sellz", title: "Something to buy or sell", description: "Find what you need. Pass something on.", href: "/sellz", accent: "var(--room-sellz)" },
  { icon: LifeBuoy, room: "ReZources", title: "Care and support", description: "Find help, services, and someone to talk to.", href: "/rezources", accent: "var(--neon-green)" },
  { icon: BriefcaseBusiness, room: "Gigz", title: "Work or collaborators", description: "Find a gig, hire someone, or share your skills.", href: "/gigz", accent: "var(--room-gigz)" },
  { icon: Users, room: "Z/Lists", title: "My community", description: "Find groups and people who share your interests.", href: "/z", accent: "var(--room-zlists)" },
  { icon: MapPinned, room: "Mapz", title: "Somewhere nearby", description: "Explore queer Portland on the map.", href: "/map", accent: "var(--neon-cyan)" },
];
const groups = [
  { label: "Go somewhere", description: "Events, outdoors, and local places", indices: [0, 1, 9] },
  { label: "Find my people", description: "Connections, community, and roommates", indices: [2, 8, 3] },
  { label: "Give, buy, or sell", description: "Good things, passed along", indices: [4, 5] },
  { label: "Find work or support", description: "Opportunities, care, and resources", indices: [7, 6] },
];

export default function HomeDiscover({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [group, setGroup] = useState<number | "all" | null>(null);
  const id = useId();
  const reduced = useReducedMotion();
  const { calmMode } = useTheme();
  const quiet = Boolean(reduced || calmMode);
  const shown = group === null ? [] : group === "all" ? destinations : groups[group].indices.map(index => destinations[index]);
  return (
    <Dialog.Root open={open} onOpenChange={next => { if (next) setGroup(null); onOpenChange(next); }}>
      <Dialog.Trigger asChild>
        <button type="button" className="home-discover-trigger pdx-glass-rebind">
          <strong>Start here</strong><ArrowRight size={25} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="home-discover-backdrop" />
        <Dialog.Content className="home-discover pdx-glass-rebind pdx-liquid-overlay" aria-describedby={`${id}-description`}>
          <span className="home-discover__seam pdx-rainbow-rule" aria-hidden="true" />
          <header className="home-discover__header">
            <span className="home-discover__eyebrow"><b aria-hidden="true">01</b> Start here</span>
            <Dialog.Close className="home-discover__close pdx-glass-rebind" aria-label="Close"><X size={20} aria-hidden="true" /></Dialog.Close>
          </header>
          <Dialog.Title className="home-discover__title">What are you looking for?</Dialog.Title>
          <Dialog.Description id={`${id}-description`} className="home-discover__intro">Choose what you need. We’ll help you find your way in.</Dialog.Description>
          <LayoutGroup id={id}>
            <div className="home-discover__filters pdx-glass-rebind" role="group" aria-label="Choose a starting point">
              {groups.map((item, index) => (
                <ResourceFilterButton key={item.label} type="button" quietMotion={quiet} className="home-discover__filter" aria-pressed={group === index} aria-controls={`${id}-destinations`} onClick={() => setGroup(index)}>
                  {group === index && <motion.span className="home-discover__selection" layoutId={quiet ? undefined : "choice"} transition={{ type: "spring", bounce: 0, duration: .25 }} aria-hidden="true" />}
                  <strong>{item.label}</strong><span>{item.description}</span>
                </ResourceFilterButton>
              ))}
            </div>
          </LayoutGroup>
          <button type="button" className="home-discover__skip" aria-controls={`${id}-destinations`} onClick={() => setGroup("all")}>Skip to view all</button>
          <div id={`${id}-destinations`}>
            <AnimatePresence initial={false} mode="wait">
              {group !== null && <motion.section key={group} className="home-discover__results" aria-label="Your front doors" initial={quiet ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: quiet ? 0 : .24, ease: "easeInOut" }}>
                <p className="home-discover__eyebrow"><b aria-hidden="true">02</b> {group === "all" ? "All front doors" : "Your way in"}</p>
                <div className="home-discover__destinations">
                  {shown.map(item => {
                    const Icon = item.icon;
                    return <Link key={item.href} href={item.href} className="home-discover__choice pdx-glass-rebind" style={{ "--c": item.accent } as CSSProperties} onClick={() => onOpenChange(false)}>
                      <Icon className="home-discover__icon" size={24} strokeWidth={1.75} aria-hidden="true" />
                      <span className="home-discover__copy"><small>{item.room}</small><strong>{item.title}</strong><span>{item.description}</span></span>
                      <ArrowUpRight className="home-discover__arrow" size={18} aria-hidden="true" />
                    </Link>;
                  })}
                </div>
              </motion.section>}
            </AnimatePresence>
          </div>
          <span className="sr-only" role="status">{group === null ? "Choose a starting point or skip to view all." : `${shown.length} destinations shown below.`}</span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
