import { addTransitionType, startTransition } from "react";
import { preinit, preinitModule, preload, preloadModule } from "react-dom";

/** React 19.3 exports these. The plan keeps the names in one place. */
export const CARD_OPEN_TRANSITION = "card-open";
export const CARD_MORPH_CLASS = "zay-card-morph";
export const CARD_SLOT_EVENT = "zay-card-slot";

const resources = new Map<string, Promise<unknown>>();
let activeOrigin: HTMLElement | null = null;

export function cardMorphName(parts: Array<string | number | null | undefined>) {
  const raw = parts.filter((part) => part != null && String(part) !== "").join("-");
  const safe = raw.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `zay-card-${safe || "item"}`.slice(0, 96);
}

/** View transitions only run for the card-open type. Hearts and other updates stay still. */
export function cardMorphUpdate(reduced: boolean) {
  const morph = reduced ? "none" : CARD_MORPH_CLASS;
  return {
    default: "none" as const,
    enter: "none" as const,
    exit: "none" as const,
    update: { default: "none" as const, [CARD_OPEN_TRANSITION]: morph },
    share: { default: "none" as const, [CARD_OPEN_TRANSITION]: morph },
  };
}

export function cardActivityMode(open: boolean): "visible" | "hidden" {
  return open ? "visible" : "hidden";
}

export function openCardTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  return clean ? `${clean} · Zaylist` : "Zaylist";
}

export function openCardDescription(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
}

/** One in-flight promise per key. Failures drop out of the cache so a retry can run. */
export function cardResource<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = resources.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = load();
  resources.set(key, pending);
  pending.catch(() => {
    if (resources.get(key) === pending) resources.delete(key);
  });
  return pending;
}

export function resetCardResources() {
  resources.clear();
}

export function rememberActiveCard(element: HTMLElement | null) {
  activeOrigin = element;
}

export function forgetActiveCard(element: HTMLElement | null) {
  if (element && activeOrigin === element) activeOrigin = null;
}

function morphHost(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-card-morph]");
}

export function signalCardSlot(target: EventTarget | null, detail: "open" | "close") {
  morphHost(target)?.dispatchEvent(new CustomEvent(CARD_SLOT_EVENT, { detail }));
}

/** Open inside a transition so `<ViewTransition>` can morph the card slot. */
export function openCardFromEvent(event: { currentTarget: EventTarget | null }, update: () => void) {
  const slot = event.currentTarget;
  startTransition(() => {
    addTransitionType(CARD_OPEN_TRANSITION);
    signalCardSlot(slot, "open");
    update();
  });
}

export function openCardTransition(update: () => void, slot?: EventTarget | null) {
  startTransition(() => {
    addTransitionType(CARD_OPEN_TRANSITION);
    if (slot) signalCardSlot(slot, "open");
    update();
  });
}

/** Close inside the same transition type, and tell the source card to leave the open phase. */
export function closeOpenCard(onClose?: () => void) {
  const element = activeOrigin;
  startTransition(() => {
    addTransitionType(CARD_OPEN_TRANSITION);
    element?.dispatchEvent(new CustomEvent(CARD_SLOT_EVENT, { detail: "close" }));
    onClose?.();
  });
}

export function preloadCardImage(href: string | null | undefined, priority: "high" | "low" | "auto" = "auto") {
  if (!href || typeof document === "undefined") return;
  preload(href, { as: "image", fetchPriority: priority });
}

export function preinitCardStyle(href: string) {
  if (!href || typeof document === "undefined") return;
  preinit(href, { as: "style" });
}

export function preinitCardModule(href: string) {
  if (!href || typeof document === "undefined") return;
  preinitModule(href, { as: "script" });
}

export function preloadCardModule(href: string) {
  if (!href || typeof document === "undefined") return;
  preloadModule(href, { as: "script" });
}

/** Optimistic heart/follow flag. Pass the next boolean, or "toggle" to flip. */
export function nextOptimisticFlag(current: boolean, action: boolean | "toggle") {
  return action === "toggle" ? !current : action;
}
