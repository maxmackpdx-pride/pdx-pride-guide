import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { Command } from "cmdk";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  Heart,
  House,
  Mountain,
  Palette,
  Scale,
  Search,
  ShieldCheck,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageSeo } from "@/hooks/usePageSeo";
import { RESOURCE_CATEGORIES, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_PANTRIES, FOOD_RESOURCE } from "@/lib/foodPantries";
import { WebGLShader } from "@/components/ui/web-gl-shader";
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
];
const ROWS = RESOURCE_CATEGORIES.flatMap((category) =>
  (category.id === "safety"
    ? [FOOD_RESOURCE, ...category.orgs]
    : category.orgs
  ).map((org) => ({ org, category })),
);
type Row = (typeof ROWS)[number];
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
      className="rg-logo"
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

function Support() {
  return (
    <div className="rg-support">
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
      <p className="rg-emergency">In immediate danger? Call 911.</p>
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
  const [expanded, setExpanded] = useState(false);
  const { org, category } = row;
  return (
    <article
      className={`rg-card pdx-glass-card pdx-glass-rebind${expanded ? " rg-expanded" : ""}`}
      style={{ "--c": category.color, "--dir-gm": 8 } as CSSProperties}
    >
      <div className="rg-card-top">
        <Mark org={org} />
        <span className="rg-eyebrow rg-scope">{org.scope}</span>
      </div>
      <span className="rg-eyebrow rg-category">{category.name}</span>
      <h3>{org.name}</h3>
      <p className="rg-description">{org.desc}</p>
      {org === FOOD_RESOURCE && <FoodPantryList />}
      {expanded && org !== FOOD_RESOURCE && (
        <div className="rg-extra">
          <span className="rg-eyebrow">How to start</span>
          <p>{category.use}</p>
          {org.addr && (
            <>
              <span className="rg-eyebrow">Location</span>
              <p>{org.addr}</p>
            </>
          )}
        </div>
      )}
      {org !== FOOD_RESOURCE && (
        <div className="rg-card-actions">
          <button className="pdxBtn" onClick={() => onOpen(row)}>
            Connect <ArrowUpRight size={16} />
          </button>
          <button
            className="rg-expand"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Less detail" : "Read more"}
            <ChevronDown size={18} />
          </button>
        </div>
      )}
    </article>
  );
}

export default function Resources() {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  async function shareResources() {
    const url = "https://www.zaylist.com/resources";
    setSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Resources | Zaylist", url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share Zaylist Resources with someone.",
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
    "Resources | Zaylist",
    "Art, community, opportunity, care, and support for queer and trans Oregon. Explore local organizations and food pantries to find your next connection.",
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<"directory" | "talk">("directory");
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 600px)").matches,
  );
  const detailTrigger = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const category = RESOURCE_CATEGORIES.find((c) => c.id === categoryId);
  const rows = useMemo(
    () =>
      categoryId ? ROWS.filter((r) => r.category.id === categoryId) : ROWS,
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
            Resources / All the ways we show up
          </span>
          <button
            className="pdxBtn rg-share"
            onClick={shareResources}
            disabled={sharing}
            aria-label="Share Resources"
          >
            <Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
        <h1>
          Find your people.
          <br />
          <em>Find your possibility.</em>
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
      </header>
      <section className="rg-layout rg-wrap">
        <aside className="rg-controls" aria-label="Choose resources">
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
                  onClick={() => setMode("talk")}
                >
                  Talk to someone
                </button>
              </div>
            </div>
          </div>
          <div className="rg-step">
            <span className="rg-step-number" aria-hidden="true">
              02
            </span>
            <div>
              <span className="rg-eyebrow rg-muted">Make it yours</span>
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
                Show all resources
              </button>
            </div>
          </div>
          <div className="rg-reassurance">
            <span aria-hidden="true">↳</span>
            <p>
              Not sure? <a href="tel:211">Call 211info</a> for help finding a
              starting point.
            </p>
          </div>
        </aside>
        <div
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
          <button
            className="rg-search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={19} />
            <span>Search everything</span>
            <kbd>⌘ K</kbd>
          </button>
          <p className="rg-count" aria-live="polite">
            {mode === "talk"
              ? "Support lines"
              : `${rows.length} resource cards${rows.some((row) => row.org === FOOD_RESOURCE) ? " · includes 8 food pantries" : ""}`}
          </p>
          {mode === "talk" ? (
            <Support />
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
        </div>
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
            onCloseAutoFocus={(event) => {
              if (detailOpen) event.preventDefault();
            }}
          >
            <Dialog.Title className="sr-only">
              Search community resources
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
                aria-label="Search all resources"
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
                        row.category.name,
                      ]}
                      onSelect={() => {
                        setSearchOpen(false);
                        openDetail(row);
                      }}
                    >
                      <span>
                        {row.org.name}
                        <small>{row.category.name}</small>
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

      <Dialog.Root open={supportOpen} onOpenChange={setSupportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="rg-overlay-backdrop" />
          <Dialog.Content className="rg-overlay rg-support-dialog">
            <Dialog.Close className="rg-close" aria-label="Close support lines">
              <X size={20} />
            </Dialog.Close>
            <span className="rg-eyebrow">Immediate support</span>
            <Dialog.Title>Someone to talk to.</Dialog.Title>
            <Dialog.Description className="sr-only">
              Local services and crisis support lines.
            </Dialog.Description>
            <Support />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Drawer.Root
        open={detailOpen}
        onOpenChange={setDetailOpen}
        direction={mobile ? "bottom" : "right"}
        shouldScaleBackground={false}
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
            {mobile && (
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
                <span
                  className="rg-eyebrow"
                  style={{ color: detail.category.color }}
                >
                  {detail.category.name}
                </span>
                <div className="rg-detail-logo">
                  <Mark org={detail.org} />
                </div>
                <Drawer.Title>{detail.org.name}</Drawer.Title>
                {detail.org.sub && <p>{detail.org.sub}</p>}
                <Drawer.Description>{detail.org.desc}</Drawer.Description>
                {detail.org === FOOD_RESOURCE && <FoodPantryList />}
                <div className="rg-detail-meta">
                  <span className="rg-eyebrow">Where they serve</span>
                  <p>{detail.org.scope}</p>
                  {detail.org.addr && (
                    <>
                      <span className="rg-eyebrow">Location</span>
                      <p>{detail.org.addr}</p>
                    </>
                  )}
                </div>
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
