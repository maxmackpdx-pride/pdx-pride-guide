import { useEffect, useLayoutEffect, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { Link } from "wouter";
import { Home, MapPin, Moon, Mountain, Shield } from "lucide-react";
import "./MobileWorldFan.css";

export type WorldFanMode = "mapz" | "outzide" | "afterz" | "boardz" | "zaydark";

type World = {
  mode: WorldFanMode;
  label: string;
  descriptor: string;
  accent: string;
  paper?: boolean;
  Icon: typeof Shield;
  x: string;
  y: number;
  delay: number;
};

// The fan keeps the Worlds Dial's own arrangement and words: ZayDark and
// Afterz at the low ends of the arc, Boardz and Outzide mid-arc, Mapz at the
// crown above the MAPZ dock button it is anchored to. Descriptors mirror the
// maps app's Dial tags verbatim. Accents are the mode colours; Boardz coral
// has no site token yet, so it is the one literal (#FF5F6D, the kit value).
const WORLDS: World[] = [
  { mode: "zaydark", label: "ZayDark", descriptor: "ON YOUR TERMS", accent: "var(--neon-red)", Icon: Moon, x: "9%", y: 0, delay: 84 },
  { mode: "boardz", label: "Boardz", descriptor: "MADE OF COMMUNITY", accent: "#FF5F6D", paper: true, Icon: MapPin, x: "29.5%", y: 30, delay: 42 },
  { mode: "mapz", label: "Mapz", descriptor: "THE CITY AFTER DARK", accent: "var(--neon-magenta)", Icon: Shield, x: "50%", y: 54, delay: 0 },
  { mode: "outzide", label: "Outzide", descriptor: "TAKE THE LONG WAY", accent: "var(--neon-orange)", Icon: Mountain, x: "70.5%", y: 30, delay: 42 },
  { mode: "afterz", label: "Afterz", descriptor: "A LIGHT LEFT ON", accent: "var(--yellow)", Icon: Home, x: "91%", y: 0, delay: 84 },
];

export default function MobileWorldFan({ open, onClose, onNavigate }: {
  open: boolean;
  onClose: () => void;
  onNavigate: () => void;
}) {
  // The fan floats directly above the dock. Measure the dock so the arc
  // tracks its real top edge (dock height and safe-area vary) instead of a
  // hardcoded guess; 102px matches the dock's standard 8px inset + 82px
  // height + a 12px gap until the first measurement lands.
  const [lift, setLift] = useState(102);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const dock = document.querySelector(".z-mobile-dock");
      if (!dock) return;
      const top = dock.getBoundingClientRect().top;
      if (top > 0) setLift(Math.round(window.innerHeight - top + 12));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => onClose();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleNodeClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onNavigate();
    const path = window.location.pathname;
    if (path === "/map" || path === "/outzide") {
      // The pinned map module reads ?mode= only when it mounts, and the host
      // does not remount it on a query change, so a world switch requested
      // while the map is already up has to load the deep link outright.
      event.preventDefault();
      window.location.assign(event.currentTarget.href);
    }
  };

  return (
    <>
      <div className={`world-fan-scrim${open ? " is-open" : ""}`} aria-hidden="true" onClick={onClose} />
      <div
        id="world-fan"
        className={`world-fan${open ? " is-open" : ""}`}
        role="group"
        aria-label="Choose a map world"
        aria-hidden={!open}
        style={{ "--wf-lift": `${lift}px` } as CSSProperties}
      >
        {WORLDS.map((world) => {
          const Icon = world.Icon;
          return (
            <Link
              key={world.mode}
              href={`/map?mode=${world.mode}`}
              className={`wf-node${world.paper ? " wf-node--paper" : ""}`}
              style={{
                "--wf-x": world.x,
                "--wf-y": `${world.y}px`,
                "--wf-c": world.accent,
                "--wf-delay": `${world.delay}ms`,
              } as CSSProperties}
              aria-label={`${world.label} — ${world.descriptor.toLowerCase()}`}
              tabIndex={open ? 0 : -1}
              onClick={handleNodeClick}
            >
              <span className="wf-node__disc">
                <Icon size={24} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="wf-node__label">{world.label}</span>
              <span className="wf-node__desc">{world.descriptor}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
