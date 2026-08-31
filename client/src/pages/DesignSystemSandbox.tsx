// @ts-nocheck - sandbox components are ported JSX without strict typings.
import {
  Component,
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "wouter";
import { usePageSeo } from "@/hooks/usePageSeo";
import { EVENT_WEEK_DAY_OPTIONS } from "@shared/eventWeek";
import {
  SANDBOX_BANNERS,
  SANDBOX_EVENTS,
  SANDBOX_PLACES,
  formatEventWhen,
} from "@/sandbox/ds/mockData";
import { DsPlaceholder, type DsRegistry, tryLoadComponent } from "@/sandbox/ds/loadDs";

import "@/components/ds/tokens/index.css";
import "@/components/ds/styles.css";
import "@/sandbox/ds/sandbox-preview.css";

const NEON_SWATCHES = [
  { name: "Yellow", var: "--neon-yellow", hex: "#CCFF00" },
  { name: "Cyan", var: "--neon-cyan", hex: "#00FFFF" },
  { name: "Magenta", var: "--neon-magenta", hex: "#FF00CC" },
  { name: "Orange", var: "--neon-orange", hex: "#FF6600" },
  { name: "Violet", var: "--neon-violet", hex: "#8800FF" },
  { name: "Blue", var: "--neon-blue", hex: "#0044FF" },
  { name: "Acid Green", var: "--green-acid", hex: "#39FF14" },
  { name: "Red", var: "--neon-red", hex: "#FF2400" },
] as const;

const SUBNAV = [
  { id: "tokens", label: "Tokens" },
  { id: "forms", label: "Forms" },
  { id: "layout", label: "Layout" },
  { id: "cards", label: "Cards" },
  { id: "map", label: "Map" },
  { id: "brand", label: "Brand" },
] as const;

class SectionBoundary extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <DsPlaceholder name={this.props.name} />;
    }
    return this.props.children;
  }
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="ds-sandbox__section">
      <div className="ds-sandbox__card">
        <h2 className="ds-sandbox__card-title">{title}</h2>
        <SectionBoundary name={title}>{children}</SectionBoundary>
      </div>
    </section>
  );
}

export default function DesignSystemSandbox() {
  usePageSeo(
    "Design System Sandbox",
    "Isolated preview of Zaylist design tokens and components. Not production.",
    { url: typeof window !== "undefined" ? `${window.location.origin}/design-preview` : undefined },
  );

  const [calm, setCalm] = useState(false);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");
  const [registry, setRegistry] = useState<DsRegistry>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await tryLoadComponent(() => import("@/components/ds"));
      if (cancelled) return;

      if (mod) {
        setRegistry({
          Badge: mod.Badge,
          Button: mod.Button,
          Countdown: mod.Countdown,
          Divider: mod.Divider,
          EventCard: mod.EventCard,
          FilterChip: mod.FilterChip,
          HeroBanner: mod.HeroBanner,
          Logo: mod.Logo,
          MapLegend: mod.MapLegend,
          MapPanel: mod.MapPanel,
          Marquee: mod.Marquee,
          PlaceCard: mod.PlaceCard,
          PosterCard: mod.PosterCard,
          SearchInput: mod.SearchInput,
          SectionHeader: mod.SectionHeader,
          StatCard: mod.StatCard,
          StatPill: mod.StatPill,
          StickerBadge: mod.StickerBadge,
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const C = registry;

  const posterEvent = SANDBOX_EVENTS[2];
  const rowEvent = SANDBOX_EVENTS[1];

  const filterChips = useMemo(
    () => [
      { key: "all", label: "All", accent: "lime" },
      { key: "thu", label: "Thu", accent: "cyan" },
      { key: "fri", label: "Fri", accent: "pink" },
      { key: "sat", label: "Sat", accent: "green" },
    ],
    [],
  );

  return (
    <div
      className={`ds-sandbox${calm ? " calm" : ""}`}
      data-calm={calm ? "true" : "false"}
    >
      <div className="ds-sandbox__dev-banner" role="note">
        Dev preview: design system sandbox only
      </div>

      <header className="ds-sandbox__header">
        <div className="ds-sandbox__header-top">
          <div>
            <h1 className="ds-sandbox__title">Design System Sandbox</h1>
            <p className="ds-sandbox__subtitle">
              Ported Claude Design export components and tokens. Toggle calm mode to
              flatten glows and motion inside this preview.
            </p>
          </div>
          <div className="ds-sandbox__row">
            <Link href="/" className="ds-sandbox__back">
              ← Live site
            </Link>
            <div className="ds-sandbox__calm">
              <span className="ds-sandbox__calm-label">Calm mode</span>
              <button
                type="button"
                className="ds-sandbox__calm-btn"
                aria-pressed={calm}
                onClick={() => setCalm((v) => !v)}
              >
                {calm ? "Calm on" : "Neon"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="ds-sandbox__subnav" aria-label="Sandbox sections">
        {SUBNAV.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <main className="ds-sandbox__main">
        {loading && (
          <p className="ds-sandbox__placeholder" role="status">
            Loading sandbox components…
          </p>
        )}

        <Section id="tokens" title="Tokens: day colors & neon palette">
          <div className="ds-sandbox__stack">
            <h3 className="ds-sandbox__card-title" style={{ fontSize: "1rem" }}>
              Pride week days
            </h3>
            <div className="ds-sandbox__grid ds-sandbox__grid--swatches">
              {EVENT_WEEK_DAY_OPTIONS.map((d) => (
                <div key={d.value} className="ds-sandbox__swatch">
                  <div
                    className="ds-sandbox__swatch-chip"
                    style={{ background: d.color }}
                  />
                  <div className="ds-sandbox__swatch-label">
                    <b>{d.value}</b>
                    {d.color}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="ds-sandbox__card-title" style={{ fontSize: "1rem" }}>
              Neon palette
            </h3>
            <div className="ds-sandbox__grid ds-sandbox__grid--swatches">
              {NEON_SWATCHES.map((n) => (
                <div key={n.name} className="ds-sandbox__swatch">
                  <div
                    className="ds-sandbox__swatch-chip"
                    style={{ background: `var(${n.var})` }}
                  />
                  <div className="ds-sandbox__swatch-label">
                    <b>{n.name}</b>
                    {n.hex}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="forms" title="Forms">
          <div className="ds-sandbox__stack">
            <div className="ds-sandbox__row">
              {C.Button ? (
                <>
                  <C.Button accent="lime">Primary</C.Button>
                  <C.Button accent="cyan" variant="solid">
                    Solid cyan
                  </C.Button>
                  <C.Button accent="pink" arrow>
                    With arrow
                  </C.Button>
                  <C.Button accent="purple" variant="ghost">
                    Ghost
                  </C.Button>
                  <C.Button accent="lime" live>
                    Live
                  </C.Button>
                </>
              ) : (
                <DsPlaceholder name="Button" />
              )}
            </div>

            <div className="ds-sandbox__row">
              {C.FilterChip ? (
                filterChips.map((f) => (
                  <C.FilterChip
                    key={f.key}
                    accent={f.accent}
                    selected={chip === f.key}
                    onToggle={() => setChip(f.key)}
                  >
                    {f.label}
                  </C.FilterChip>
                ))
              ) : (
                <DsPlaceholder name="FilterChip" />
              )}
            </div>

            {C.SearchInput ? (
              <C.SearchInput
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                onClear={() => setSearch("")}
                placeholder="Search events, venues, tags…"
              />
            ) : (
              <DsPlaceholder name="SearchInput" />
            )}
          </div>
        </Section>

        <Section id="layout" title="Layout">
          <div className="ds-sandbox__stack">
            {C.SectionHeader ? (
              <C.SectionHeader
                kicker="Portland Pride 2026"
                title="Made with Pride"
                subtitle="Section header with kicker, display title, and optional action slot."
                accent="pink"
                action={
                  C.Button ? (
                    <C.Button size="sm" accent="lime">
                      View schedule
                    </C.Button>
                  ) : null
                }
              />
            ) : (
              <DsPlaceholder name="SectionHeader" />
            )}

            {C.Divider ? (
              <>
                <C.Divider />
                <C.Divider label="Rainbow seam" variant="glow" color="cyan" />
              </>
            ) : (
              <DsPlaceholder name="Divider" />
            )}

            {C.Marquee ? (
              <C.Marquee
                items={[
                  "Pride Week Jul 13 to 19",
                  "Keep the nights ours",
                  "Take Care of Each Other",
                ]}
                color="rainbow"
              />
            ) : (
              <DsPlaceholder name="Marquee" />
            )}

            {C.HeroBanner ? (
              <C.HeroBanner image={SANDBOX_BANNERS.gifting} minHeight={320}>
                {C.SectionHeader ? (
                  <C.SectionHeader
                    kicker="Hero banner"
                    title="Collage wallpaper + scrim"
                    subtitle="Uses /sandbox-ds/banners/ assets when present."
                    accent="cyan"
                    align="left"
                  />
                ) : null}
              </C.HeroBanner>
            ) : (
              <DsPlaceholder name="HeroBanner" />
            )}
          </div>
        </Section>

        <Section id="cards" title="Data display">
          <div className="ds-sandbox__stack">
            <div className="ds-sandbox__row">
              {C.Badge ? (
                <>
                  <C.Badge admission="FREE" />
                  <C.Badge admission="TICKETED" />
                  <C.Badge admission="DOOR_FEE" />
                  <C.Badge day="SAT" />
                  <C.Badge color="yellow" glow>
                    Grand Opening
                  </C.Badge>
                </>
              ) : (
                <DsPlaceholder name="Badge" />
              )}
              {C.StickerBadge ? (
                <>
                  <C.StickerBadge color="lime">KEEP THE NIGHTS OURS</C.StickerBadge>
                  <C.StickerBadge color="pink" rotate={3}>
                    PRIDE IS A PROTEST
                  </C.StickerBadge>
                </>
              ) : (
                <DsPlaceholder name="StickerBadge" />
              )}
            </div>

            <div className="ds-sandbox__row">
              {C.StatPill ? (
                <>
                  <C.StatPill count={42} color="lime" dot>
                    Going
                  </C.StatPill>
                  <C.StatPill count={18} color="pink" variant="solid">
                    Featured
                  </C.StatPill>
                </>
              ) : (
                <DsPlaceholder name="StatPill" />
              )}
              {C.StatCard ? (
                <div className="ds-sandbox__grid ds-sandbox__grid--cards">
                  <C.StatCard value="220" label="Events listed" color="cyan" />
                  <C.StatCard value="310" label="Parade RSVPs" color="orange" />
                </div>
              ) : (
                <DsPlaceholder name="StatCard" />
              )}
            </div>

            {C.Countdown ? (
              <C.Countdown target="2026-07-16T19:00:00" accent="lime" />
            ) : (
              <DsPlaceholder name="Countdown" />
            )}

            <div className="ds-sandbox__grid ds-sandbox__grid--cards">
              {C.PosterCard ? (
                <C.PosterCard
                  title={posterEvent.title}
                  venue={posterEvent.venue}
                  when={formatEventWhen(posterEvent)}
                  day={posterEvent.day}
                  image={posterEvent.image}
                  types={posterEvent.tags.slice(0, 2)}
                  admission={posterEvent.admission}
                  going={posterEvent.going}
                />
              ) : (
                <DsPlaceholder name="PosterCard" />
              )}
              {C.EventCard ? (
                <C.EventCard
                  title={rowEvent.title}
                  venue={rowEvent.venue}
                  when={formatEventWhen(rowEvent)}
                  day={rowEvent.day}
                  image={rowEvent.image}
                  types={rowEvent.tags.slice(0, 2)}
                  admission={rowEvent.admission}
                  going={rowEvent.going}
                />
              ) : (
                <DsPlaceholder name="EventCard" />
              )}
            </div>

            {C.PlaceCard ? (
              <div className="ds-sandbox__grid ds-sandbox__grid--cards">
                {SANDBOX_PLACES.map((p) => (
                  <C.PlaceCard key={p.name} {...p} />
                ))}
              </div>
            ) : (
              <DsPlaceholder name="PlaceCard" />
            )}
          </div>
        </Section>

        <Section id="map" title="Map">
          <div className="ds-sandbox__stack">
            {C.MapPanel ? (
              <C.MapPanel height={360} expandable onExpand={() => undefined} />
            ) : (
              <DsPlaceholder name="MapPanel" />
            )}
            {C.MapLegend ? (
              <div style={{ maxWidth: 280 }}>
                <C.MapLegend />
              </div>
            ) : (
              <DsPlaceholder name="MapLegend" />
            )}
          </div>
        </Section>

        <Section id="brand" title="Brand">
          {C.Logo ? (
            <div className="ds-sandbox__row">
              <C.Logo src="/sandbox-ds/logo.png" size={64} />
              <C.Logo variant="stacked" src="/sandbox-ds/logo.png" size={72} />
              <C.Logo variant="wordmark" size={48} />
            </div>
          ) : (
            <DsPlaceholder name="Logo" />
          )}
        </Section>

        <footer className="ds-sandbox__footer-note">
          Sandbox only, not production. Open via{" "}
          <code>npm run dev</code> → /design-preview
        </footer>
      </main>
    </div>
  );
}
