import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLocation } from "wouter";

type Guide = { key: string; title: string; intro: string; steps: string[] };

function guideFor(path: string): Guide | null {
  if (path === "/dashboard") return { key: "hub", title: "Your Hub", intro: "A quick map of the controls that are yours.", steps: ["Use the rail to move between your profile, people, posts, and settings.", "Your public profile preview updates from Profile.", "Messages and admin work stay in their own focused spaces."] };
  if (path === "/inbox") return { key: "messages", title: "Messages", intro: "Find a thread without losing your place.", steps: ["Use the folders and filters to narrow the list.", "Open a thread to reply, react, attach, archive, or block.", "Search and filters stay local to Messages."] };
  if (path === "/map") return { key: "map", title: "Explore the map", intro: "The map and its list are two views of the same places.", steps: ["Use the place-type rail to filter what is shown.", "Open a marker or its matching list row for details.", "The list remains available for keyboard and screen-reader navigation."] };
  if (path === "/directory" || path.startsWith("/directory/")) return { key: "placez", title: "Explore Placez", intro: "Search, filter, and open a place when you want the full story.", steps: ["Filters narrow the directory without changing the main navigation.", "Map and list results stay connected.", "Open a place for hours, details, and community actions."] };
  if (path.startsWith("/u/")) return { key: "profile", title: "Member profiles", intro: "Profiles put identity and connection controls in one place.", steps: ["Use Follow or Message for direct connection.", "Share opens a compact action sheet on phones.", "Profile owners can edit their identity and reorder Top 8 from their Hub."] };
  return null;
}

export default function RouteGuide() {
  const [location] = useLocation();
  const path = location.split("?")[0];
  const guide = useMemo(() => guideFor(path), [path]);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!guide) return null;
  return (
    <div className="route-guide" data-no-pull-to-refresh>
      <button type="button" className="route-guide__trigger pdx-glass-btn pdx-glass-rebind" aria-label={`How ${guide.title} works`} aria-expanded={open} onClick={() => setOpen(true)}>
        <HelpCircle size={19} aria-hidden="true" /><span>How it works</span>
      </button>
      {open && <>
        <button type="button" className="route-guide__backdrop" aria-label="Close guide" onClick={() => setOpen(false)} />
        <section className="route-guide__sheet pdx-liquid-overlay" role="dialog" aria-modal="true" aria-labelledby="route-guide-title">
          <div className="route-guide__head">
            <div><span className="route-guide__kicker">Quick guide</span><h2 id="route-guide-title">{guide.title}</h2></div>
            <button ref={closeRef} type="button" className="route-guide__close" aria-label="Close guide" onClick={() => setOpen(false)}><X size={20} /></button>
          </div>
          <p className="route-guide__intro">{guide.intro}</p>
          <ol>{guide.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
          <button type="button" className="route-guide__done pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" onClick={() => setOpen(false)}>Got it</button>
        </section>
      </>}
    </div>
  );
}
