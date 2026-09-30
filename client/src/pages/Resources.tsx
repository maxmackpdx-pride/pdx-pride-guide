import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { Command } from "cmdk";
import {
  ArrowUpRight,
  LifeBuoy,
  BriefcaseBusiness,
  Heart,
  House,
  Mountain,
  Palette,
  Scale,
  Search,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import { RESOURCE_CATEGORIES, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_PANTRIES, FOOD_RESOURCE } from "@/lib/foodPantries";
import DirectoryMap from "@/components/DirectoryMap";
import { placeGoogleMapsUrl } from "@/lib/placeLinks";
import { Badge } from "@/components/ds/Badge";
import { PlaceCard } from "@/components/ds/PlaceCard";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "./Resources.css";

const ICONS = [
  Heart,
  ShieldCheck,
  Scale,
  Star,
  Users,
  House,
  BriefcaseBusiness,
  Palette,
  Mountain,
  LifeBuoy,
];
const LABELS = [
  "Health & care",
  "Safety & basic needs",
  "Rights & advocacy",
  "Youth support",
  "Community",
  "Family & elders",
  "Work & money",
  "Arts & spaces",
  "Around Oregon",
  "Harm reduction",
];
const ROWS = RESOURCE_CATEGORIES.flatMap((category) =>
  (category.id === "safety"
    ? [...category.orgs, FOOD_RESOURCE]
    : category.orgs
  ).map((org) => ({ org, category })),
);
type Row = (typeof ROWS)[number];
function categoriesFor(row: Row) {
  return RESOURCE_CATEGORIES.filter((category) =>
    category.id === row.category.id || row.org.categoryIds?.includes(category.id),
  );
}
const HOTLINES = [
  {
    name: "988",
    description: "Suicide & Crisis Lifeline · call or text",
    tel: "988",
  },
  { name: "Call to Safety", description: "503-235-5333", tel: "5032355333" },
  {
    name: "The Trevor Project",
    description: "866-488-7386",
    tel: "18664887386",
  },
  { name: "Trans Lifeline", description: "877-565-8860", tel: "18775658860" },
];

function Mark({ org }: { org: ResourceOrg }) {
  const letters =
    org.mark ||
    org.name
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter(
        (w) => !["the", "and", "of", "for", "&"].includes(w.toLowerCase()),
      )
      .slice(0, 3)
      .map((w) => w[0])
      .join("");
  return org.logo ? (
    <img
      className={`rg-logo${org.logoSurface === "light" ? " rg-logo--light" : ""}`}
      src={org.logo}
      alt={`${org.name} logo`}
      loading="lazy"
    />
  ) : (
    <span className="rg-mark" aria-hidden="true">
      {letters}
    </span>
  );
}

function SafetyNotice({ openCard = false }: { openCard?: boolean }) {
  return (
    <aside className={openCard ? "rg-safety-prompt rg-safety-open" : "pdxPlace pdx-glass-rebind rg-safety-prompt"} style={{ "--c": "#FF2400", "--_c": "#FF2400" } as CSSProperties} aria-label="Urgent safety help">
      <div className={openCard ? "rg-safety-open-body" : "pdxPlace__body pdx-glass-card pdx-glass-rebind"}>
        {!openCard && <div className="pdxPlace__sheen pdx-glass-sheen--specular" aria-hidden="true" />}
        {!openCard && <div className="pdxPlace__seam pdx-refract-seam" aria-hidden="true" />}
        <div className="rg-safety-content">
      <div className="rg-safety-heading">
        <ShieldAlert size={28} aria-hidden="true" />
        <div>
          <span className="pdxPlace__cat"><Badge color="var(--neon-orange)" size="sm">Immediate safety</Badge></span>
          <h3>In immediate danger?</h3>
        </div>
      </div>
      <p className="rg-safety-lead">If you or someone else is in danger right now, call 911 if you can do so safely.</p>
      <a className="pdxBtn pdxBtn--solid rg-safety-emergency" href="tel:911"><Phone size={18} aria-hidden="true" /> Call 911</a>
      <div className="rg-safety-support">
        <h4>You don’t have to figure this out alone.</h4>
        <p>For domestic or sexual violence support, talk with a Call to Safety advocate. Free, confidential, and available 24/7. You can call even if you’re unsure what to call your experience.</p>
        <a className="pdxBtn rg-safety-crisis" href="tel:+15032355333"><Phone size={18} aria-hidden="true" /><span>Call to Safety<strong>503-235-5333</strong></span><ArrowUpRight size={18} aria-hidden="true" /></a>
        <a className="rg-safety-source" href="https://calltosafety.org/services/" target="_blank" rel="noopener noreferrer">Support options & service details <ArrowUpRight size={13} /></a>
      </div>
      <details className="rg-safety-law">
        <summary>Domestic violence in Oregon — what counts?</summary>
        <div>
          <p>Oregon law covers abuse in certain family or household relationships. Under ORS 135.230, this includes:</p>
          <ul>
            <li>Hurting someone physically, or trying to.</li>
            <li>Making someone fear serious physical harm that is about to happen.</li>
            <li>Sexual abuse.</li>
          </ul>
          <p>The law includes requirements about intent or recklessness and the relationship between the people involved. The full rules are linked below.</p>
          <p><strong>What about roommates?</strong> Sharing an address alone does not automatically qualify you for a family-abuse restraining order (FAPA). That order has specific family or intimate-relationship requirements. Other protections may apply, depending on what happened.</p>
          <p>If a roommate, partner, or anyone else is hurting or threatening you, you can ask for help. You don’t need to know the legal label first. Call to Safety or a legal aid provider can help you explore your options.</p>
          <div className="rg-safety-law-links">
            <a href="https://oregonlawhelp.org/topics/safety/restraining-orders-oregon/oregons-five-restraining-orders/family-abuse-restraining-order-fapa" target="_blank" rel="noopener noreferrer">Who can get a family-abuse restraining order? ↗</a>
            <a href="https://www.oregonlegislature.gov/bills_laws/ors/ors135.html" target="_blank" rel="noopener noreferrer">Read ORS 135.230 ↗</a>
            <a href="https://www.oregonlegislature.gov/bills_laws/ors/ors107.html" target="_blank" rel="noopener noreferrer">Read ORS 107.705 ↗</a>
            <a href="https://www.courts.oregon.gov/programs/family/domestic-violence/Pages/restraining.aspx" target="_blank" rel="noopener noreferrer">Oregon Courts: restraining orders ↗</a>
          </div>
          <small>General legal information, not individual legal advice. Sources checked September 30, 2026.</small>
        </div>
      </details>
        </div>
      </div>
    </aside>
  );
}

function Support({ showSafety = true, openCard = false }: { showSafety?: boolean; openCard?: boolean }) {
  return (
    <div className={openCard ? "rg-support rg-support-open" : "rg-support"}>
      {showSafety && <SafetyNotice openCard={openCard} />}
      <div className="rg-talk">
        <span className="rg-eyebrow">Find local services</span>
        <h3>Start with 211info.</h3>
        <p>
          A connection to housing, food, health care, and other services in
          Oregon and SW Washington.
        </p>
        <a className="pdxBtn pdxBtn--solid" href="tel:211">
          Call 211 <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="rg-hotlines">
        {HOTLINES.map((h) => (
          <a href={`tel:${h.tel}`} key={h.tel}>
            <strong>{h.name}</strong>
            <span>{h.description}</span>
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
    </div>
  );
}

function FoodPantryList() {
  return (
    <div className="rg-food-list">
      <p className="rg-food-note">
        Hours checked September 30, 2026 · Portland time. Check the provider’s
        site for closures before visiting.
      </p>
      {FOOD_PANTRIES.map((pantry) => (
        <details key={pantry.name}>
          <summary>
            <strong>{pantry.name}</strong>
            <span>{pantry.hours}</span>
          </summary>
          <div className="rg-food-visit">
            <p>{pantry.address}</p>
            <p>{pantry.note}</p>
            <a href={pantry.url} target="_blank" rel="noopener noreferrer">
              Visit official site <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
      ))}
    </div>
  );
}

function ResourceCard({
  row,
  onOpen,
}: {
  row: Row;
  onOpen: (row: Row) => void;
}) {
  const { org, category } = row;
  return (
    <PlaceCard
      name={org.name}
      categoryLabel={category.name}
      categoryTags={categoriesFor(row)}
      accentColor={category.color}
      logoUrl={org.logo}
      logoFallback={<Mark org={{ ...org, logo: undefined }} />}
      address={org.addr}
      phone={org.phoneLabel}
      phoneHref={org.phone}
      description={org.desc}
      website={org.url}
      shareUrl={`https://www.zaylist.com/rezources?resource=${encodeURIComponent(org.name)}`}
      className={`rg-directory-card pdxPlace--clickable${org.logoSurface === "light" ? " rg-directory-card--light-logo" : ""}`}
      onClick={() => onOpen(row)}
      footer={
        <div className="rg-directory-footer" onClick={(event) => event.stopPropagation()}>
          <span className="rg-eyebrow">{org.scope}</span>
          {org.sourceChecked && (
            <a className="rg-source-check" href={org.sourceUrl || org.url} target="_blank" rel="noopener noreferrer">
              Service page checked {org.sourceChecked} <ArrowUpRight size={13} />
            </a>
          )}
          <button className={`pdxBtn${["safety", "legal", "arts"].includes(category.id) ? " rg-contact-white" : ""}`} onClick={() => onOpen(row)}>
            All details & contact <ArrowUpRight size={16} />
          </button>
        </div>
      }
    />
  );
}

export default function Resources() {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location === "/resources") navigate(`/rezources${window.location.search}${window.location.hash}`, { replace: true });
  }, [location, navigate]);
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  async function shareResources() {
    const url = "https://www.zaylist.com/rezources";
    setSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: "ReZources | Zaylist", url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share Zaylist ReZources with someone.",
      });
    } catch {
      toast({
        title: "Couldn't copy the link",
        description: url,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  }

  usePageSeo(
    "ReZources | Zaylist",
    "Art, community, opportunity, care, and support for queer and trans Oregon. Explore local organizations and food pantries to find your next connection.",
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<"directory" | "talk">("directory");
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [safetyAnswer, setSafetyAnswer] = useState<"yes" | "no" | null>(null);
  const supportTrigger = useRef<HTMLElement | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("resource");
    if (!requested) return;
    const row = ROWS.find(({ org }) => org.name === requested);
    if (row) {
      setDetail(row);
      setDetailOpen(true);
    }
  }, []);

  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 600px)").matches,
  );
  const detailTrigger = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const category = RESOURCE_CATEGORIES.find((c) => c.id === categoryId);
  const rows = useMemo(
    () =>
      categoryId ? ROWS.filter((r) => categoriesFor(r).some((c) => c.id === categoryId)) : ROWS,
    [categoryId],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !detailOpen &&
        !supportOpen
      ) {
        event.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [detailOpen, supportOpen]);
  function choose(id: string | null) {
    setCategoryId(id);
    setMode("directory");
  }
  function openDetail(row: Row) {
    detailTrigger.current = document.activeElement as HTMLElement;
    setDetail(row);
    setDetailOpen(true);
  }
  function selectSearchCategory(id: string | null) {
    choose(id);
    setSearchOpen(false);
    requestAnimationFrame(() => {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="resources-page">
      <WebGLShader />
      <header className="rg-intro rg-wrap">
        <div className="rg-intro-top">
          <span className="rg-eyebrow">
            ReZources / All the ways we show up
          </span>
          <button
            className="pdxBtn rg-share"
            onClick={shareResources}
            disabled={sharing}
            aria-label="Share ReZources"
          >
            <Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
        <h1>
          Find your <em className="rg-word-people">people</em>.
          <br />
          Find your <em>possibility</em>.
          <br />
          Find your <em className="rg-word-hope">hope</em>.
        </h1>
        <p>
          Make art. Find community. Build something.
          <br />
          Get support. There's more than one way forward.
        </p>
        <button
          className="rg-text-link rg-help"
          onClick={() => setSupportOpen(true)}
        >
          Need help now? Support lines <ArrowUpRight size={14} />
        </button>
        <button
          className="rg-search-trigger"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={19} />
          <span>Search everything</span>
          <kbd>⌘ K</kbd>
        </button>
      </header>
      <section className="rg-layout rg-wrap">
        <aside className="rg-controls" aria-label="Choose ReZources">
          <div className="rg-step">
            <span className="rg-step-number" aria-hidden="true">
              01
            </span>
            <div>
              <span className="rg-eyebrow">Start here</span>
              <h2>What brings you in?</h2>
              <div className="rg-mode">
                <button
                  aria-pressed={mode === "directory"}
                  onClick={() => setMode("directory")}
                >
                  Find a resource
                </button>
                <button
                  aria-pressed={mode === "talk"}
                  aria-expanded={mode === "talk"}
                  aria-controls="resource-safety-check"
                  onClick={() => { setMode("talk"); setSafetyAnswer(null); }}
                >
                  Talk to someone
                </button>
              </div>
              {mode === "talk" && (
                <div id="resource-safety-check" className="rg-safety-check" role="group" aria-labelledby="resource-safety-question">
                  <h3 id="resource-safety-question">Are you safe right now?</h3>
                  <p>Choose what you need. You can change your answer.</p>
                  <div>
                    <button className="pdxBtn" aria-pressed={safetyAnswer === "yes"} onClick={() => {
                      setSafetyAnswer("yes");
                      requestAnimationFrame(() => { resultsRef.current?.scrollIntoView({ behavior: "auto", block: "start" }); resultsRef.current?.focus({ preventScroll: true }); });
                    }}>Yes, I’m safe</button>
                    <button className="pdxBtn" aria-pressed={safetyAnswer === "no"} onClick={(event) => {
                      supportTrigger.current = event.currentTarget;
                      setSafetyAnswer("no");
                      setSupportOpen(true);
                    }}>No, I need help now</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {mode === "directory" && <div className="rg-step">
            <span className="rg-step-number" aria-hidden="true">
              02
            </span>
            <div>
              <span className="rg-eyebrow rg-muted">Explore categories</span>
              <h2>I'm looking for…</h2>
              <div
                className="rg-options"
                role="group"
                aria-label="Resource categories"
              >
                {RESOURCE_CATEGORIES.map((c, i) => {
                  const Icon = ICONS[i];
                  return (
                    <button
                      key={c.id}
                      className="pdx-glass-rebind"
                      aria-pressed={categoryId === c.id}
                      style={{ "--res-accent": c.color } as CSSProperties}
                      onClick={() => choose(c.id)}
                    >
                      <Icon size={18} />
                      <span>{LABELS[i]}</span>
                      <i aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <button
                className="rg-text-link rg-all"
                aria-pressed={categoryId === null && mode === "directory"}
                onClick={() => selectSearchCategory(null)}
              >
                Show all ReZources
              </button>
            </div>
          </div>}
          <div className="rg-reassurance">
            <span aria-hidden="true">↳</span>
            <p>
              Not sure? <a href="tel:211">Call 211info</a> for help finding a
              starting point.
            </p>
          </div>
        </aside>
        {(mode === "directory" || safetyAnswer === "yes") && <div
          className="rg-results"
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Resource results"
        >
          <div className="rg-results-head">
            <span className="rg-eyebrow">03 / Make a connection</span>
            <h2>
              {mode === "talk"
                ? "A person on the other end."
                : category
                  ? `${category.name}.`
                  : "A world of possibilities."}
            </h2>
            <p>
              {mode === "talk"
                ? "Choose the support line that fits what you need."
                : category
                  ? category.forr
                  : "Art, community, opportunity, care, and support. Choose a category to find your next connection."}
            </p>
          </div>
          {mode === "directory" && categoryId === "safety" && (
            <SafetyNotice />
          )}

          <p className="rg-count" aria-live="polite">
            {mode === "talk"
              ? "Support lines"
              : `${rows.length} resource cards${rows.some((row) => row.org === FOOD_RESOURCE) ? " · includes 8 food pantries" : ""}`}
          </p>
          {mode === "talk" ? (
            <Support showSafety={false} />
          ) : (
            <div className="rg-cards">
              {rows.map((row) => (
                <ResourceCard
                  key={row.org.name}
                  row={row}
                  onOpen={openDetail}
                />
              ))}
            </div>
          )}
        </div>}
      </section>
      <aside className="rg-urgent rg-wrap" aria-label="Immediate support">
        <strong>Need help now?</strong>
        {HOTLINES.map((h) => (
          <a key={h.tel} href={`tel:${h.tel}`}>
            <b>{h.name}</b>
            <span>{h.description}</span>
            <ArrowUpRight size={18} />
          </a>
        ))}
        <small>In immediate danger? Call 911.</small>
      </aside>
      <footer className="rg-footer rg-wrap">
        <div>
          <span className="rg-eyebrow">
            Built by community. Kept by community.
          </span>
          <h2>Know someone we should know?</h2>
        </div>
        <Link className="pdxBtn" href="/contact">
          Suggest a resource <ArrowUpRight size={16} />
        </Link>
      </footer>

      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="rg-overlay-backdrop" />
          <Dialog.Content
            className="rg-overlay rg-command"
            style={{ "--resource-accent": detail?.category.color || "#00FFFF" } as CSSProperties}
            onCloseAutoFocus={(event) => {
              if (detailOpen) event.preventDefault();
            }}
          >
            <Dialog.Title className="sr-only">
              Search community ReZources
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Search interests and organizations across the entire resource
              directory.
            </Dialog.Description>
            <Dialog.Close className="rg-close" aria-label="Close search">
              <X size={20} />
            </Dialog.Close>
            <Command>
              <Command.Input
                aria-label="Search all ReZources"
                placeholder="Art, grants, groups, studios, support…"
              />
              <Command.List>
                <Command.Empty>
                  No matches. Try art, youth, work, or an organization name.
                </Command.Empty>
                <Command.Group heading="Explore an interest">
                  {RESOURCE_CATEGORIES.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`category ${c.name}`}
                      onSelect={() => selectSearchCategory(c.id)}
                    >
                      {c.name}
                      <ArrowUpRight size={16} />
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Organizations">
                  {ROWS.map((row) => (
                    <Command.Item
                      key={row.org.name}
                      value={row.org.name}
                      keywords={[
                        row.org.desc,
                        row.org.scope,
                        ...(row.org === FOOD_RESOURCE
                          ? FOOD_PANTRIES.map((p) => p.name)
                          : []),
                        ...categoriesFor(row).map((c) => c.name),
                      ]}
                      onSelect={() => {
                        setSearchOpen(false);
                        openDetail(row);
                      }}
                    >
                      <span>
                        {row.org.name}
                        <small>{categoriesFor(row).map((c) => c.name).join(" · ")}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
            <p className="rg-command-hint">
              ↑ ↓ to move · Enter to open · Esc to close
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Drawer.Root open={supportOpen} onOpenChange={setSupportOpen} direction={mobile ? "bottom" : "right"} shouldScaleBackground={false} dismissible closeThreshold={0.2}>
        <Drawer.Portal>
          <Drawer.Overlay className="rg-overlay-backdrop" />
          <Drawer.Content
            className={`rg-overlay rg-drawer ${mobile ? "rg-drawer-mobile" : "rg-drawer-desktop"}`}
            style={{ "--resource-accent": "#FF2400" } as CSSProperties}
            onCloseAutoFocus={(event) => { if (supportTrigger.current?.isConnected) { event.preventDefault(); supportTrigger.current.focus(); } }}
          >
            <Drawer.Handle className="rg-drawer-handle" aria-label="Drag to close safety support" />
            <Drawer.Close className="rg-close" aria-label="Close safety support"><X size={20} /></Drawer.Close>
            <div className="rg-drawer-body">
              <Drawer.Title className="sr-only">Immediate safety and support</Drawer.Title>
              <Drawer.Description className="sr-only">Call 911 for immediate danger, or choose a crisis support line. Includes Oregon safety information.</Drawer.Description>
              <Support openCard />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root
        open={detailOpen}
        onOpenChange={setDetailOpen}
        direction={mobile ? "bottom" : "right"}
        shouldScaleBackground={false}
        dismissible
        closeThreshold={0.2}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="rg-overlay-backdrop" />
          <Drawer.Content
            className={`rg-overlay rg-drawer ${mobile ? "rg-drawer-mobile" : "rg-drawer-desktop"}`}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const target = detailTrigger.current;
              if (target?.isConnected) target.focus();
              else
                document
                  .querySelector<HTMLButtonElement>(".rg-search-trigger")
                  ?.focus();
            }}
          >
            {(
              <Drawer.Handle
                className="rg-drawer-handle"
                aria-label="Drag to close resource"
              />
            )}
            <Drawer.Close className="rg-close" aria-label="Close resource">
              <X size={20} />
            </Drawer.Close>
            {detail && (
              <div className="rg-drawer-body">
                <div className="rg-detail-tags">
                  {categoriesFor(detail).map((category) => (
                    <span key={category.id} className="rg-eyebrow" style={{ color: category.color }}>
                      {category.name}
                    </span>
                  ))}
                </div>
                <div className="rg-detail-logo">
                  <Mark org={detail.org} />
                </div>
                <Drawer.Title>{detail.org.name}</Drawer.Title>
                {detail.org.sub && <p>{detail.org.sub}</p>}
                <Drawer.Description>{detail.org.desc}</Drawer.Description>
                {detail.org.sourceChecked && (
                  <a
                    className="rg-source-check"
                    href={detail.org.sourceUrl || detail.org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Service page checked {detail.org.sourceChecked}{" "}
                    <ArrowUpRight size={13} />
                  </a>
                )}
                {detail.org === FOOD_RESOURCE && (
                  <>
                    <a className="pdxBtn pdxBtn--solid rg-food-finder" href="https://foodfinder.oregonfoodbank.org/" target="_blank" rel="noopener noreferrer">
                      Find food near you <ArrowUpRight size={22} aria-hidden="true" />
                    </a>
                    <p className="rg-food-finder-caption">Oregon Food Bank’s Food Finder · Search by location, day, and food type.</p>
                    <FoodPantryList />
                  </>
                )}
                <div className="rg-detail-meta">
                  <span className="rg-eyebrow">How to start</span>
                  <p>{detail.category.use}</p>
                  <span className="rg-eyebrow">Where they serve</span>
                  <p>{detail.org.scope}</p>
                  {detail.org.addr && (
                    <>
                      <span className="rg-eyebrow">Location</span>
                      <p>{detail.org.addr}</p>
                    </>
                  )}
                </div>
                {detail.org.phone && (
                  <a className="rg-resource-phone" href={detail.org.phone}>
                    {detail.org.phoneLabel}
                  </a>
                )}
                {detail.org.addr && (
                  <section className="rg-resource-map" aria-label={`Location map for ${detail.org.name}`}>
                    <div className="rg-resource-map-canvas" data-vaul-no-drag>
                      <DirectoryMap
                        businesses={[]}
                        height="100%"
                        showKey={false}
                        interactive={false}
                        rasterBasemap
                        accent={detail.category.color}
                      />
                      <span className="rg-resource-map-label">Portland overview · exact address below</span>
                    </div>
                    <a className="pdxBtn" href={placeGoogleMapsUrl({ address: detail.org.addr, name: detail.org.name })} target="_blank" rel="noopener noreferrer">
                      Directions to {detail.org.addr} <ArrowUpRight size={16} />
                    </a>
                  </section>
                )}
                <div className="rg-detail-actions">
                  {detail.org.url && (
                    <a
                      className="pdxBtn pdxBtn--solid"
                      style={
                        {
                          "--action-accent": detail.category.color,
                        } as CSSProperties
                      }
                      href={detail.org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {detail.org.cta || "Visit website"}
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                  {detail.org.alt && (
                    <a
                      className="pdxBtn"
                      href={detail.org.alt}
                      {...(detail.org.alt.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {detail.org.altLabel}
                    </a>
                  )}
                </div>
                <small>
                  Check the organization's website for current hours, services,
                  and eligibility.
                </small>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
