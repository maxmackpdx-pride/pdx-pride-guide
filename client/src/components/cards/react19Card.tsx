import { Activity, ViewTransition, use, useEffect, useRef, useState, cloneElement, Suspense, type ReactElement, type ReactNode, type Ref } from "react";
import { prefersStillMotion } from "@/lib/motion";
import { CARD_SLOT_EVENT, cardActivityMode, cardMorphUpdate, openCardDescription, openCardTitle } from "./react19CardModel";
import "./react19Card.css";

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function useReducedCardMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const sync = () => setReduced(prefersStillMotion());
    sync();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);
  return reduced;
}

type HostProps = { ref?: Ref<HTMLElement>; [key: string]: unknown };

/** Names the card DOM node so a card-open transition can morph that slot. */
export function CardMorph({ name, children }: { name: string; children: ReactElement<HostProps> }) {
  const reduced = useReducedCardMotion();
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const setPhaseRef = useRef(setPhase);
  setPhaseRef.current = setPhase;
  const hostRef = useRef<HTMLElement | null>(null);
  const childRef = useRef(children.props.ref);
  childRef.current = children.props.ref;
  const onSlot = useRef((event: Event) => {
    const next = (event as CustomEvent<string>).detail === "open" ? "open" : "closed";
    setPhaseRef.current((prev) => (prev === next ? prev : next));
  });
  const bind = useRef((node: HTMLElement | null) => {
    const previous = hostRef.current;
    if (previous && previous !== node) previous.removeEventListener(CARD_SLOT_EVENT, onSlot.current);
    if (node && node !== previous) node.addEventListener(CARD_SLOT_EVENT, onSlot.current);
    hostRef.current = node;
    assignRef(childRef.current, node);
  });
  const motion = cardMorphUpdate(reduced);
  return (
    <ViewTransition name={name} default={motion.default} enter={motion.enter} exit={motion.exit} update={motion.update} share={motion.share}>
      {cloneElement(children, {
        "data-card-morph": "",
        "data-card-morph-phase": phase,
        ref: bind.current,
      })}
    </ViewTransition>
  );
}

/** Keep a drawer mounted after its first open, paused while it is closed. */
export function PausedCard({ open, children }: { open: boolean; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  if (!mounted) return null;
  return <Activity mode={cardActivityMode(open)} name="card-drawer">{children}</Activity>;
}

/** React 19 hoists these into the document head while the open card is on screen. */
export function OpenCardMeta({ title, description }: { title: string; description?: string | null }) {
  const text = openCardDescription(description);
  return (
    <>
      <title>{openCardTitle(title)}</title>
      {text ? <meta name="description" content={text} /> : null}
    </>
  );
}

export function CardSkeleton({ size, label }: { size: "tall" | "wide" | "small"; label: string }) {
  return <div data-card-size={size} data-card-category="loading" role="status" className="zay-card-skeleton">{label}</div>;
}

function CardDataInner<T>({ source, children }: { source: Promise<T>; children: (value: T) => ReactNode }) {
  const value = use(source);
  return children(value);
}

/** Suspend on a card payload promise. The fallback is the fixed-size skeleton. */
export function CardData<T>({ source, fallback, children }: { source: Promise<T>; fallback: ReactNode; children: (value: T) => ReactNode }) {
  return <Suspense fallback={fallback}><CardDataInner source={source}>{children}</CardDataInner></Suspense>;
}
