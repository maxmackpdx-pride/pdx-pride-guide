/**
 * One card in the home destination rail.
 *
 * Every card is the same box and the same vertical order:
 *   seam -> top (number + eyebrow) -> wordmark + blurb -> slot -> action row
 * and only the slot changes between them. Seven slot bodies exist and no card
 * mixes two. Anything beyond those seven is drift; do not add an eighth.
 *
 * EVENTZ is the one exception to the padding: its flyer is the card, so the
 * shell drops to zero padding, the number ring floats over the poster, and the
 * action row is folded into the flyer footer instead of sitting under it.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { prefersStillMotion } from "@/lib/motion";
import {
  clearDynamicTextCache,
  rowGapAbove,
  solveDynamicText,
  type DynamicTextResult,
} from "@/lib/dynamicText";
import { OUTZ_TOPO, WORLD_MOTIFS } from "@/components/home/homeWorldMotifs";
import {
  ROADMAP_MARKS,
  type WorldFlyer,
  type WorldItem,
  type WorldPanel,
  type WorldPill,
  type WorldPosting,
  type WorldRow,
  type WorldSpec,
} from "@/lib/homeWorlds";
import "./HomeWorldCard.css";

const FLYER_ROTATE_MS = 4200;
const MARQUEE_FLIP_MS = 1400;

export type HomeWorldCardProps = {
  world: WorldSpec;
  /** True for the front card and its two neighbours: the only ones that animate. */
  hot: boolean;
  rows?: WorldRow[];
  flyers?: WorldFlyer[];
  panels?: WorldPanel[];
  postings?: WorldPosting[];
  items?: WorldItem[];
  pills?: WorldPill[];
};

/**
 * Solve a posting title into rows that fill its measured band.
 *
 * Dynamic Text stacks: two rows unless the title is a single word. That is the
 * owner rule, so `preferTwoRows` and the `fitWithinFrame` it requires are both
 * on here. See the solve below for why the pair travels together.
 *
 * Scope here is posting titles only. The EVENTZ flyer keeps the normal type
 * scale, because the published standard excludes event names.
 *
 * `outOfRange` means no grouping fits the readable 24-220px band. The standard
 * says flag it rather than clip or shrink silently, so the card drops back to
 * the plain clamped title instead of forcing a row that would break the slot.
 */
function useDynamicTitle(text: string, wide?: boolean) {
  const bodyRef = useRef<HTMLSpanElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const kicker = kickerRef.current;
    const tail = tailRef.current;
    if (!body || !kicker || !tail) return;

    let raf = 0;
    /*
     * The frame is derived from the rows the title does NOT control: the body
     * box, the kicker above and the line/foot below. Measuring the title's own
     * container instead would feed the solved rows back into the frame they
     * were solved against, and the two would chase each other without settling.
     */
    const measure = () => {
      const rect = body.getBoundingClientRect();
      const inner = rect.width - BODY_PADDING * 2;
      const h = rect.height - BODY_PADDING * 2 - kicker.offsetHeight - tail.offsetHeight - TITLE_GAP;
      // Standard cards give the title 60% of the band and stack the copy beside
      // it; MIZZED reads as a quote and takes the band edge to edge.
      const w = inner * (wide ? 1 : 0.6);
      if (w <= 0 || h <= 0) return;
      setFrame(prev => (prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }));
    };

    raf = window.requestAnimationFrame(measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(body);
    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [wide]);

  // Fallback-font metrics would otherwise stick, so re-solve once Barlow lands.
  const [fontsReady, setFontsReady] = useState(() => Boolean(document.fonts?.status === "loaded"));
  useEffect(() => {
    if (fontsReady) return;
    let live = true;
    document.fonts?.ready
      .then(() => {
        if (!live) return;
        clearDynamicTextCache();
        setFontsReady(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [fontsReady]);

  const layout = useMemo(() => {
    if (!frame) return null;
    /*
     * Dynamic Text stacks. Owner rule, approved 2026-08-23: "almost always two
     * lines except with one word." One word is the only single-row case, and
     * the solver already handles it by skipping the two-row search when there
     * is nothing to split.
     *
     *   preferTwoRows   ON, per that rule.
     *   fitWithinFrame  ON, and required alongside it rather than optional: a
     *     posting well is short and fixed, so a forced two-row title routinely
     *     solves taller than the band, and without the fit pass strict mode
     *     drops the whole title to plain type. That is what put two different
     *     title treatments on one MIZZED card.
     *   maxNeighborRatio OFF. At the housing value of 3 it is a no-op here, and
     *     tightening it is a threshold decision that has not been made.
     */
    const solved = solveDynamicText(text, frame.w, frame.h, true, true);
    return solved.outOfRange ? null : solved;
    // fontsReady is a dependency on purpose: the same inputs measure
    // differently before and after the webfont resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, frame, fontsReady]);

  return { bodyRef, kickerRef, tailRef, frame, layout };
}

/** `.home-world__post-body` padding, and the title's own top margin. */
const BODY_PADDING = 10;
const TITLE_GAP = 6;

function Posting({ post, wide }: { post: WorldPosting; wide?: boolean }) {
  const { bodyRef, kickerRef, tailRef, frame, layout } = useDynamicTitle(post.title, wide);
  return (
    <Link href={post.href} className="home-world__post" data-wide={wide ? "1" : undefined}>
      {post.photo ? (
        <img className="home-world__post-photo" src={post.photo} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="home-world__post-photo home-world__post-photo--empty" aria-hidden="true" />
      )}
      <span className="home-world__post-scrim" aria-hidden="true" />
      <span className="home-world__post-seam" aria-hidden="true" />
      <span className="home-world__post-body" ref={bodyRef}>
        <span className="home-world__post-kicker-row" ref={kickerRef}>
          <span className="home-world__dot" aria-hidden="true" />
          <span className="home-world__post-kicker">{post.kicker}</span>
          {!post.isLive ? <span className="home-world__demo">Demo</span> : null}
        </span>
        {/* Sized from the frame, never by its own content. */}
        <span
          className="home-world__post-title-box"
          aria-label={post.title}
          style={frame ? { width: frame.w, height: frame.h } : undefined}
        >
          {layout ? (
            layout.lines.map((line, index) => (
              <span
                key={`${line}-${index}`}
                className="home-world__post-row"
                style={{
                  fontSize: layout.sizes[index],
                  marginTop: index > 0 ? rowGapAbove(line, layout.sizes[index]) : undefined,
                }}
              >
                {line}
              </span>
            ))
          ) : (
            <p className="home-world__post-title">{post.title}</p>
          )}
        </span>
        <span className="home-world__post-tail" ref={tailRef}>
          <span className="home-world__post-line">{post.line}</span>
          <span className="home-world__post-foot">
            <span className="home-world__post-meta">{post.meta}</span>
            <span className="home-world__post-action">{post.action} ↗</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

function Flyer({ flyers, playing }: { flyers: WorldFlyer[]; playing: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [flyers.length]);

  useEffect(() => {
    if (!playing || flyers.length < 2 || prefersStillMotion()) return;
    const id = window.setInterval(() => setActive(i => (i + 1) % flyers.length), FLYER_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [playing, flyers.length]);

  const flyer = flyers[active] ?? flyers[0];
  if (!flyer) return null;

  return (
    <div className="home-world__flyer" style={{ ["--day-c" as string]: flyer.dayColor }}>
      <Link href={flyer.href} className="home-world__flyer-hit" aria-label={flyer.title}>
        {flyer.poster ? (
          <img className="home-world__flyer-photo" src={flyer.poster} alt="" loading={playing ? "eager" : "lazy"} decoding="async" />
        ) : (
          <span className="home-world__flyer-photo home-world__flyer-photo--empty" aria-hidden="true" />
        )}
        <span className="home-world__flyer-scrim" aria-hidden="true" />
        <span className="home-world__flyer-body">
          <span className="home-world__flyer-chip">{flyer.isLive ? "Up next" : "Tonight"}</span>
          <strong className="home-world__flyer-title">{flyer.title}</strong>
          <span className="home-world__flyer-when">
            {flyer.when}
            {!flyer.isLive ? " · Demo" : ""}
          </span>
        </span>
      </Link>
      <div className="home-world__flyer-dots">
        <span className="home-world__flyer-count">
          {String(active + 1).padStart(2, "0")} / {String(flyers.length).padStart(2, "0")}
        </span>
        <div>
          {flyers.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? "is-active" : ""}
              aria-label={`Show ${item.title}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The marquee is lit, not static: one random panel flips to the next place in
 * the pool every beat, the way a bar sign cycles. Holds still under calm mode
 * and reduced motion, and when the card is not near the front of the deck.
 */
function Marquee({ panels, playing }: { panels: WorldPanel[]; playing: boolean }) {
  const [offsets, setOffsets] = useState<number[]>(() => Array(9).fill(0));

  useEffect(() => {
    if (!playing || panels.length <= 9 || prefersStillMotion()) return;
    const id = window.setInterval(() => {
      setOffsets(current => {
        const next = [...current];
        const slot = Math.floor(Math.random() * 9);
        next[slot] = next[slot] + 1;
        return next;
      });
    }, MARQUEE_FLIP_MS);
    return () => window.clearInterval(id);
  }, [playing, panels.length]);

  const shown = useMemo(
    () =>
      Array.from({ length: 9 }, (_, slot) => {
        const stride = Math.max(1, Math.floor(panels.length / 9));
        return panels[(slot + offsets[slot] * 9 * stride) % panels.length];
      }).filter(Boolean),
    [panels, offsets],
  );

  return (
    <div className="home-world__marquee">
      <div className="home-world__marquee-grid">
        {shown.map((panel, index) => (
          <Link
            key={`${panel.id}-${index}`}
            href={panel.href}
            className="home-world__panel"
            title={panel.name}
            aria-label={panel.name}
          >
            <img src={panel.logo} alt="" loading="lazy" decoding="async" />
          </Link>
        ))}
      </div>
      <p className="home-world__marquee-honor">Queer owned and queer friendly, listed by the people who go.</p>
    </div>
  );
}

export default function HomeWorldCard({
  world,
  hot,
  rows = [],
  flyers = [],
  panels = [],
  postings = [],
  items = [],
  pills = [],
}: HomeWorldCardProps) {
  const motifs = WORLD_MOTIFS[world.key] ?? [];
  const isFlyerCard = world.slot === "flyer";

  return (
    <article
      className="home-world pdx-glass-card pdx-glass-rebind"
      data-world={world.key}
      data-slot={world.slot}
      style={{ ["--c" as string]: world.accent }}
    >
      {/* The card system's rainbow refract seam, composed not hand-rolled. */}
      <span className="pdx-refract-seam" aria-hidden="true" />
      <span className="home-world__pattern" aria-hidden="true" />
      {/* OUTZ carries real terrain instead of line objects: the contour map is
          the subject of the board, not a decoration standing in for it. */}
      {world.key === "outz"
        ? OUTZ_TOPO.map(topo => (
            <svg
              key={topo.name}
              className="home-world__topo"
              viewBox="0 0 600 600"
              aria-hidden="true"
              style={{
                top: topo.top,
                left: topo.left,
                width: topo.size,
                height: topo.size,
                opacity: topo.opacity,
                transform: `rotate(${topo.rotate})`,
              }}
            >
              {topo.paths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          ))
        : null}
      {motifs.map((motif, index) => (
        <svg
          key={index}
          className="home-world__motif"
          viewBox="0 0 64 64"
          aria-hidden="true"
          style={{
            top: motif.top,
            left: motif.left,
            width: motif.size,
            height: motif.size,
            opacity: motif.opacity,
            transform: `rotate(${motif.rotate})`,
          }}
        >
          <path d={motif.path} />
        </svg>
      ))}
      <span className="home-world__bloom" aria-hidden="true" />
      <Link href={world.href} className="home-world__hit" aria-label={`Open ${world.title}`} />

      <div className="home-world__content">
        <div className="home-world__top">
          <span className="home-world__number">{world.number}</span>
          <span className="home-world__eyebrow">{world.eyebrow}</span>
        </div>

        {!isFlyerCard ? (
          <div className="home-world__head">
            {world.mark ? (
              <img className="home-world__mark" src={world.mark} alt={world.title} loading="lazy" decoding="async" />
            ) : world.headline ? (
              <h3 className="home-world__headline">{world.headline}</h3>
            ) : null}
            {world.body ? <p className="home-world__body">{world.body}</p> : null}
          </div>
        ) : null}

        <div className="home-world__slot">
          {world.slot === "rows" ? (
            <div className="home-world__rows">
              {rows.map(row => (
                <Link key={row.id} href={row.href} className="home-world__row">
                  <span className="home-world__row-head">
                    <span className="home-world__row-name">{row.name}</span>
                    {row.count != null ? (
                      <span className="home-world__row-tag">
                        <span className="home-world__dot" aria-hidden="true" />
                        {row.count} in
                      </span>
                    ) : null}
                    {!row.isLive ? <span className="home-world__demo">Demo</span> : null}
                  </span>
                  <span className="home-world__row-stats">{row.stats}</span>
                  <span className="home-world__row-sub">{row.sub}</span>
                  <span className="home-world__row-chips">
                    <span className="home-world__chip">Check in</span>
                    <span className="home-world__chip">Join chat</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {world.slot === "flyer" ? <Flyer flyers={flyers} playing={hot} /> : null}

          {world.slot === "marquee" ? <Marquee panels={panels} playing={hot} /> : null}

          {world.slot === "postings" ? (
            <div className="home-world__posts">
              {postings.map(post => (
                <Posting key={post.id} post={post} wide={post.wide} />
              ))}
            </div>
          ) : null}

          {world.slot === "items" ? (
            <div className="home-world__items">
              {items.map(item => (
                <Link key={item.id} href={item.href} className="home-world__item">
                  {item.photo ? (
                    <img className="home-world__item-photo" src={item.photo} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="home-world__item-photo home-world__item-photo--empty" aria-hidden="true" />
                  )}
                  <span className="home-world__item-scrim" aria-hidden="true" />
                  {item.reserved ? <span className="home-world__item-reserved">Reserved</span> : null}
                  {!item.isLive ? <span className="home-world__demo home-world__demo--pin">Demo</span> : null}
                  <span className="home-world__item-foot">
                    <span className="home-world__item-price">{item.price}</span>
                    <span className="home-world__item-cond">{item.cond}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {world.slot === "pills" ? (
            /* The headline names this slot, so it carries no header of its own.
               Five pills fill the slot, ten pack down and scroll inside it, and
               the card box is the same 648px either way. */
            <div className="home-world__pills" data-dense={pills.length > 6 ? "1" : undefined}>
              {pills.map(pill => (
                <Link
                  key={pill.id}
                  href={pill.href}
                  className="home-world__pill"
                  style={{ ["--pill-c" as string]: pill.accent }}
                >
                  <span className="home-world__pill-label">{pill.label}</span>
                  <span className="home-world__pill-time">{pill.time}</span>
                </Link>
              ))}
              {pills.length && !pills[0].isLive ? (
                <span className="home-world__demo home-world__demo--inline">Demo</span>
              ) : null}
            </div>
          ) : null}

          {world.slot === "roadmap" ? (
            <div className="home-world__roadmap">
              <span className="home-world__roadmap-dim" aria-hidden="true" />
              <div className="home-world__roadmap-marks">
                {ROADMAP_MARKS.map(mark => (
                  <img
                    key={mark.name}
                    className="home-world__roadmap-mark"
                    src={mark.src}
                    alt={mark.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      ["--mark-w" as string]: mark.width,
                      transform: `rotate(${mark.rotate})`,
                      filter: `drop-shadow(0 0 18px color-mix(in srgb, ${mark.glow} 45%, transparent))`,
                    }}
                  />
                ))}
              </div>
              <span className="home-world__roadmap-scan" aria-hidden="true" />
              <span className="home-world__roadmap-glitch" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        {!isFlyerCard ? (
          <Link href={world.href} className="home-world__action">
            <span>{world.action}</span>
            <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
