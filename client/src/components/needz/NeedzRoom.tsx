import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { BrowseHeader } from "@/components/discovery/EventzBrowse";
import BoardShareButton from "@/components/BoardShareButton";
import BoardFollowButton from "@/components/BoardFollowButton";
import { NeedzTalkBar } from "./NeedzTalkBar";
import { NeedzIntake } from "./NeedzIntake";
import { NeedzDeck } from "./NeedzDeck";
import { NeedzSaved } from "./NeedzSaved";
import { NEEDZ_DEFAULT_FILTERS, NEEDZ_ROWS, NEEDZ_SAVED_KEY, buildDeck, type NeedzFilters, type NeedzRow } from "./needzDeckModel";
import "./NeedzDecks.css";

// The existing NEEDZ drawer (phones, hours, map, programs) opens in embedded mode only when asked for.
const ResourceDetail = lazy(() => import("@/pages/Resources"));

type Step = "intake" | "deck" | "done";
const NEEDZ_LOGO = "/brand/family/needz-mobile.webp?v=20261014-late-rent";

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(NEEDZ_SAVED_KEY) || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && NEEDZ_ROWS.some(row => row.id === id)) : [];
  } catch { return []; }
}

function readDeepLink(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("resource") || params.get("find");
}

function writeDeepLink(name: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete("find");
  if (name) url.searchParams.set("resource", name); else url.searchParams.delete("resource");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function toTop() {
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

/** NEEDZ Decks: intake, one tall card at a time, then a short saved list. Clubs and groups are not part of NEEDZ. */
export function NeedzRoom() {
  const [step, setStep] = useState<Step>("intake");
  const [filters, setFilters] = useState<NeedzFilters>(NEEDZ_DEFAULT_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [detail, setDetail] = useState<string | null>(readDeepLink);

  useEffect(() => {
    try { window.sessionStorage.setItem(NEEDZ_SAVED_KEY, JSON.stringify(saved)); } catch { /* storage may be blocked */ }
  }, [saved]);

  // Derived during render; the React Compiler memoizes this for us.
  const deck = buildDeck(filters);
  const savedRows = NEEDZ_ROWS.filter(row => saved.includes(row.id));
  const current = Math.min(index, Math.max(deck.length - 1, 0));

  const changeFilters = (next: NeedzFilters) => { setFilters(next); setIndex(0); };
  const start = (at: number) => { setIndex(at); setStep("deck"); toTop(); };
  const advance = () => { if (current + 1 >= deck.length) { setStep("done"); toTop(); } else setIndex(current + 1); };
  const save = (row: NeedzRow) => { setSaved(list => list.includes(row.id) ? list : [...list, row.id]); advance(); };
  const openDetails = (row: NeedzRow) => { writeDeepLink(row.org.name); setDetail(row.org.name); };
  const openSaved = (row: NeedzRow) => {
    const at = deck.findIndex(item => item.id === row.id);
    if (at >= 0) start(at); else openDetails(row);
  };
  const closeDetails = () => { writeDeepLink(null); setDetail(null); };

  return <div className="nd-room" data-step={step}>
    <div className="nd-frame">
      <NeedzTalkBar open={talkOpen} onToggle={() => setTalkOpen(!talkOpen)} />
    </div>
    {step !== "deck" && <BrowseHeader title="NEEDZ" logo={NEEDZ_LOGO} kicker="Community resources / Oregon + Vancouver, WA"
      description="Real life gets complicated. Finding support shouldn't. Food, care, housing help and more, for whatever today looks like.">
      <BoardShareButton title="NEEDZ" path="/needz" card={{ room: "NEEDZ", mark: NEEDZ_LOGO, line: "All the ways we show up." }} />
      <BoardFollowButton board="rezources" />
    </BrowseHeader>}
    <main className="nd-frame nd-main" id="needz-results">
      {step === "intake" && <NeedzIntake filters={filters} deck={deck} moreOpen={moreOpen} onFilters={changeFilters} onMore={() => setMoreOpen(!moreOpen)} onStart={start}
        onReset={() => changeFilters({ ...filters, how: "any", where: "all", who: [] })} />}
      {step === "deck" && deck.length > 0 && <NeedzDeck deck={deck} index={current} saved={saved}
        onBack={() => setIndex(Math.max(0, current - 1))} onSkip={advance} onSave={save}
        onChange={() => { setStep("intake"); toTop(); }} onDetails={openDetails} />}
      {(step === "done" || (step === "deck" && deck.length === 0)) && <NeedzSaved rows={savedRows} onOpen={openSaved}
        onRestart={() => start(0)} onIntake={() => { setStep("intake"); setIndex(0); toTop(); }} onClear={() => setSaved([])} />}
      <footer className="nd-footer">
        <p>Know someone we should know?</p>
        <Link className="pdx-glass-rebind pdxBtn nd-btn" href="/contact">Suggest a resource <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </footer>
    </main>
    {detail && <div className="nd-detail" onClick={event => { if (event.target === event.currentTarget) closeDetails(); }}>
      <Suspense fallback={<p className="nd-sub" role="status">Opening card…</p>}><ResourceDetail embeddedDetail={{ name: detail }} onEmbeddedClose={closeDetails} /></Suspense>
    </div>}
  </div>;
}
