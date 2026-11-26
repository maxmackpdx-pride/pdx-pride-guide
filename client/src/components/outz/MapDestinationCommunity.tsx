import { createContext, Suspense, useContext, useEffect, useState, type ComponentType, type RefObject } from "react";
import { isValidBeachId } from "@shared/riverBrats";

type Section = "Conditions" | "Wall" | "Your Trip" | "Buddy Finder" | "Beach community";
type Intent = { initial: Section; draft?: string };
export type DestinationCardProps = Intent & { placeId: string; onClose: () => void };

// The site supplies its authenticated card. Portable profile objects can still
// mount the published map on their own, without importing the entire site.
export const DestinationCardRenderer = createContext<ComponentType<DestinationCardProps> | null>(null);

type Props = { root: RefObject<HTMLDivElement | null>; placeId: string; initial?: Section };

export default function MapDestinationCommunity({ root, placeId, initial }: Props) {
  const Card = useContext(DestinationCardRenderer);
  const [intent, setIntent] = useState<Intent | undefined>(() => initial ? { initial } : undefined);

  useEffect(() => {
    const host = root.current;
    if (!host || !Card) return;
    const open = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(
        '.actual-outz-details button[data-tab="community"], .actual-outz-details button[data-open-tab="community"]',
      ) : null;
      if (!button) return;
      let section: Section = isValidBeachId(placeId) ? "Beach community" : "Wall";
      if (button.closest("#overview-wall")) section = "Wall";
      else if (button.dataset.openTab) {
        // The published overview groups "Check in + join the chat" with its conditions button.
        const trip = button.parentElement?.querySelector('[data-open-tab="conditions"]');
        section = trip ? (isValidBeachId(placeId) ? "Beach community" : "Your Trip") : "Buddy Finder";
      }
      event.preventDefault();
      event.stopPropagation();
      setIntent({ initial: section });
    };
    const openDraft = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches(".actual-outz-details #overview-wall form")) return;
      event.preventDefault();
      event.stopPropagation();
      setIntent({ initial: "Wall", draft: String(new FormData(form).get("body") ?? "") });
    };
    host.addEventListener("click", open, true);
    host.addEventListener("submit", openDraft, true);
    return () => {
      host.removeEventListener("click", open, true);
      host.removeEventListener("submit", openDraft, true);
    };
  }, [Card, placeId, root]);

  if (!intent || !Card) return null;
  return <Suspense fallback={<p role="status">Opening destination card…</p>}>
    <Card placeId={placeId} {...intent} onClose={() => setIntent(undefined)} />
  </Suspense>;
}
