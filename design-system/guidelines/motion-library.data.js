/* The motion library. Ported from the live client; keyframes and timing are
   the real values. Each entry renders a card and a Claude-ready rules block. */
const MOTIONS = [
{
  t: "Aurora, atmosphere layer",
  where: "Home hero, behind everything (HeroAurora.tsx)",
  rule: "Three large blurred colour orbs drift and breathe behind the hero on independent long loops, so the background never visibly repeats. Violet, cyan and magenta. This is the outer of the two aurora layers: the letter orbs sit in front of it, tighter and one per letter.",
  timing: "auroraA 19s / auroraB 23s / auroraC 27s, all ease-in-out infinite. Deliberately coprime so the three never resynchronise.",
  demo: '<div class="aurora"><i></i><i></i><i></i></div>',
  css: `@keyframes auroraA { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(9%,12%) scale(1.25); } }
@keyframes auroraB { 0%,100% { transform: translate(0,0) scale(1.1); } 50% { transform: translate(-11%,-8%) scale(.9); } }
@keyframes auroraC { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(7%,-10%) scale(1.2); } }

.hero-aurora__orb { position: absolute; width: 56%; height: 66%; border-radius: 50%; filter: blur(30px); opacity: .55; }
.hero-aurora__orb--a { background: var(--neon-violet);  animation: auroraA 19s ease-in-out infinite; }
.hero-aurora__orb--b { background: var(--neon-cyan);    animation: auroraB 23s ease-in-out infinite; }
.hero-aurora__orb--c { background: var(--neon-magenta); animation: auroraC 27s ease-in-out infinite; }

/* <HeroAurora /> renders exactly three orbs and nothing else. */`
},
{
  t: "Spectrum wave",
  where: "Full-bleed band under section headers",
  rule: "A continuous spectrum band scrolls sideways at a walking pace. It is one smooth gradient tiled at 288px, never hard colour stops, and the first and last stop are the same colour so the tile seam never shows. Slow enough to read as ambient rather than as a loader.",
  timing: "spectrum-wave-scroll 22s linear infinite. Tile width 288px.",
  demo: '<div class="wave"></div>',
  css: `@keyframes spectrum-wave-scroll { to { background-position: 288px 0; } }

.pdx-spectrum-wave {
  /* A smooth spectrum, never hard stops. The band is one continuous
     gradient tiled at its own width, so the seam is invisible: the
     first and last colour must match. */
  background: linear-gradient(90deg,
    #FF19D6 0%, #FF5319 14.3%, #FFD119 28.6%, #9CFF19 42.9%,
    #19F7FF 57.1%, #1956FF 71.4%, #E419FF 85.7%, #FF19D6 100%);
  background-repeat: repeat-x;
  background-size: 288px 100%;   /* one tile: the loop distance must equal this */
  animation: spectrum-wave-scroll 22s linear infinite;
}`
},
{
  t: "Rainbow divider flow",
  where: "The seam under the header and above the footer",
  rule: "The flag gradient travels right to left under a static second layer, so the seam reads as light moving through it rather than the rule itself sliding. It uses --rainbow-bar-loop, which wraps back to cyan, so the point where the tile repeats is invisible. The plain --rainbow-bar ends on orange and shows a hard orange-to-cyan join when tiled.",
  timing: "rainbow-divider-flow 6s linear infinite. Two background layers; only the first one moves.",
  demo: '<div class="rdiv"></div>',
  css: `@keyframes rainbow-divider-flow {
  from { background-position: 360px 0, 0 0; }
  to   { background-position: 0 0,     0 0; }
}

.pdx-rainbow-rule {
  height: 3px;
  /* --rainbow-bar-loop, never --rainbow-bar. The plain bar ends on orange,
     so tiling it butts orange straight against cyan and the join shows as a
     hard band. The loop token wraps back to cyan and the seam disappears. */
  background: var(--rainbow-bar-loop), var(--ink-900);
  background-size: 360px 100%, 100% 100%;
  background-repeat: repeat-x, no-repeat;
  animation: rainbow-divider-flow 6s linear infinite;
}`
},
{
  t: "Word glitch",
  where: "A single emphasised word in About copy",
  rule: "One word in a headline throws a cyan and magenta text-shadow split for two frames roughly every five seconds, then rests. Hard cuts, never a tween. One word per screen, never body copy.",
  timing: "aboutWordGlitch 5s steps(1) infinite. Active window 92 to 96 percent, about 200ms. Offset never exceeds 2px.",
  demo: '<span class="gword">Zaylist</span>',
  css: `@keyframes aboutWordGlitch {
  0%, 92%, 100% { text-shadow: none; transform: none; }
  93% { text-shadow: -2px 0 var(--cyan), 2px 0 var(--pink); transform: translateX(1px); }
  95% { text-shadow:  2px 0 var(--cyan), -2px 0 var(--pink); transform: translateX(-1px); }
}

.about__word--glitch { animation: aboutWordGlitch 5s steps(1) infinite; }`
},
{
  t: "Sticker float",
  where: "Tilted stickers on About and the promoter pages",
  rule: "Each sticker keeps its own tilt and bobs a few pixels on a slow loop. Two rates are in use so a cluster never moves in lockstep. The rotation is baked into every keyframe so the float never straightens the sticker.",
  timing: "aboutStickerFloat 3.2s and aboutPgStickerFloat 3.4s, both ease-in-out infinite. Travel 5 to 6px.",
  demo: '<div class="float"><span>Free</span><span>Hire me</span></div>',
  css: `@keyframes aboutStickerFloat {
  0%, 100% { transform: rotate(3deg) translateY(0); }
  50%      { transform: rotate(3deg) translateY(-6px); }
}
@keyframes aboutPgStickerFloat {
  0%, 100% { transform: rotate(-2deg) translateY(0); }
  50%      { transform: rotate(-2deg) translateY(-5px); }
}

/* Keep the tilt inside every keyframe, or the sticker snaps upright mid-float. */
.about__sticker    { animation: aboutStickerFloat 3.2s ease-in-out infinite; }
.about__sticker--pg{ animation: aboutPgStickerFloat 3.4s ease-in-out infinite; }`
},
{
  t: "Board flicker",
  where: "Board headings on the community boards",
  rule: "A neon-sign flicker: the heading jitters two pixels and dips in opacity for four frames near the end of a long cycle, then holds steady. It should be easy to miss.",
  timing: "board-flickr 7s linear infinite. Active window 92 to 96 percent.",
  demo: '<span class="flick">Gifting</span>',
  css: `@keyframes board-flickr {
  0%, 100% { opacity: 1;   transform: translateX(0); }
  92%      { opacity: 1; }
  93%      { opacity: .94; transform: translateX(-2px); }
  94%      { opacity: 1;   transform: translateX(2px); }
  95%      { opacity: .96; }
  96%      { opacity: 1;   transform: translateX(0); }
}

.board__title { animation: board-flickr 7s linear infinite; }`
},
{
  t: "Schedule card in",
  where: "Schedule grid cards on load and on filter change",
  rule: "Cards fade up six pixels, staggered down the column. Short and flat: the schedule is dense, so a longer entrance reads as lag.",
  timing: "scheduleCardIn .3s ease both, stagger 70ms per card. Cap the stagger so a long list does not delay the last card past ~500ms.",
  demo: '<div class="stack"><i></i><i></i><i></i><i></i></div>',
  css: `@keyframes scheduleCardIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sch-card { animation: scheduleCardIn .3s ease both; }
.sch-card:nth-child(2) { animation-delay: .07s; }
.sch-card:nth-child(3) { animation-delay: .14s; }
/* ...cap the delay around .5s however deep the list goes. */`
},
{
  t: "Attendance pop",
  where: "Attendance bubbles when someone RSVPs",
  rule: "A new face springs in from zero with an overshoot, the only place in the system that uses a spring curve. It marks a person arriving, so it is allowed to be bouncy.",
  timing: "attendance-pop-in .6s cubic-bezier(.34, 1.56, .64, 1). Overshoot peaks at 1.18 at 60 percent.",
  demo: '<span class="pop"></span>',
  css: `@keyframes attendance-pop-in {
  0%   { transform: scale(0);    opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}

.attendance__bubble { animation: attendance-pop-in .6s cubic-bezier(.34, 1.56, .64, 1); }`
},
{
  t: "Sheet up",
  where: "The attendance sheet and every bottom sheet on mobile",
  rule: "The sheet slides up from fully offscreen with no fade and no scale. Movement alone reads as physical; adding opacity makes it feel like a dialog instead of a surface.",
  timing: "attendance-sheet-up .25s ease-out. The side-panel variant is the same duration on translateX.",
  demo: '<span class="sheet"></span>',
  css: `@keyframes attendance-sheet-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes attendance-panel-in   { from { transform: translateX(100%); } to { transform: translateX(0); } }

.attendance__sheet { animation: attendance-sheet-up .25s ease-out; }
.attendance__panel { animation: attendance-panel-in .25s cubic-bezier(.2, .8, .2, 1); }`
},
{
  t: "Inbox overlay in",
  where: "The floating inbox sheet",
  rule: "The navy sheet rises sixteen pixels and settles from a slight scale-down while fading in. Fast, because the inbox is opened constantly and never navigates.",
  timing: "inbox-overlay-in .2s ease-out for the sheet, inbox-overlay-fade .2s for the scrim behind it.",
  demo: '<span class="overlay"></span>',
  css: `@keyframes inbox-overlay-in {
  from { transform: translateY(16px) scale(.98); opacity: 0; }
  to   { transform: translateY(0) scale(1);      opacity: 1; }
}
@keyframes inbox-overlay-fade { from { opacity: 0; } to { opacity: 1; } }

.inbox-overlay        { animation: inbox-overlay-in .2s var(--ease-out); }
.inbox-overlay__scrim { animation: inbox-overlay-fade .2s var(--ease-out); }`
},
{
  t: "Flyer stash holo",
  where: "The flyer stash on a public profile",
  rule: "A wide holographic sheen creeps across the stash plate, like light moving over a foil card. Three times the tile width, so the pass is long and slow.",
  timing: "stashHolo 4.5s linear infinite. background-size 300%, travelling 0 to 300 percent.",
  demo: '<div class="holo"></div>',
  css: `@keyframes stashHolo {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

.stash__plate {
  background: linear-gradient(110deg, /* dark base with two faint color bands */ );
  background-size: 300% 100%;
  animation: stashHolo 4.5s linear infinite;
}`
},
{
  t: "Aurora, letter orbs",
  where: "Home hero, one orb per letter of ZAYLIST (HomeHero.tsx, .home-hero__aurora)",
  rule: "The inner aurora layer. Seven blurred orbs sit between the grain and the wordmark, one under each letter, each coloured by that letter's position in the spectrum tape. They share one float loop but every orb starts 1.4 seconds earlier than the last, so the glow travels across the word instead of pulsing as a block. Same family as the atmosphere layer behind it: same blur, same breathing, tighter and keyed to type.",
  timing: "One shared float loop; animationDelay is i * -1.4s per orb. Negative delays start them mid-cycle rather than staggering the start.",
  demo: '<div class="orbs"><i style="--x:8%;--o:#FF19D6;animation-delay:0s"></i><i style="--x:22%;--o:#FF196C;animation-delay:-1.4s"></i><i style="--x:36%;--o:#FFD119;animation-delay:-2.8s"></i><i style="--x:50%;--o:#9CFF19;animation-delay:-4.2s"></i><i style="--x:64%;--o:#19F7FF;animation-delay:-5.6s"></i><i style="--x:78%;--o:#1956FF;animation-delay:-7s"></i><i style="--x:92%;--o:#E419FF;animation-delay:-8.4s"></i></div>',
  css: `/* Colors are sampled from the spectrum tape at each letter's position.
   Do not recolor them individually: they are one gradient, taken apart. */
const LETTER_ORBS = [
  { letter: "Z", color: "#FF19D6", left: "16%", top: "42%" },
  { letter: "A", color: "#FF196C", left: "28%", top: "46%" },
  { letter: "Y", color: "#FFD119", left: "40%", top: "40%" },
  { letter: "L", color: "#9CFF19", left: "50%", top: "48%" },
  { letter: "I", color: "#19F7FF", left: "60%", top: "42%" },
  { letter: "S", color: "#1956FF", left: "70%", top: "46%" },
  { letter: "T", color: "#E419FF", left: "82%", top: "40%" },
];
// style={{ background: orb.color, left: orb.left, top: orb.top,
//          animationDelay: \`\${i * -1.4}s\` }}

.home-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(38px);
  animation: floatOrb 5s ease-in-out infinite, glowPulse 3.2s ease-in-out infinite;
}`
},
{
  t: "Hero parallax",
  where: "Home hero, the whole layer stack",
  rule: "Scroll only, never pointer, and vertical only. The hero writes a normalised -1 to 1 position into --py and each layer multiplies it by its own depth. The value is eased toward the target at five percent per frame, so the stack lags the scroll slightly instead of tracking it exactly.",
  timing: "requestAnimationFrame loop, lerp factor 0.05. Range clamped to -1 to 1 over 55 percent of the viewport height. Not started at all under calm mode or reduced motion.",
  demo: '<div class="plx"><i></i><i></i><i></i></div>',
  css: `/* The hero owns one variable; every layer reads it at its own depth. */
const readScroll = () => {
  const r = el.getBoundingClientRect(), vh = window.innerHeight || 1;
  return Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh * 0.55)));
};
const tick = () => {
  currentY += (targetY - currentY) * 0.05;   // lag, do not track exactly
  el.style.setProperty("--py", currentY.toFixed(4));
  raf = requestAnimationFrame(tick);
};
window.addEventListener("scroll", () => { targetY = readScroll(); }, { passive: true });

/* Never start the loop at all when motion is off. */
if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
if (document.documentElement.classList.contains("calm-mode")) return;

/* Layer depths, back to front. */
.home-hero__bg       { transform: translateY(calc(var(--py, 0) * 22px)); }
.home-hero__aurora   { transform: translateY(calc(var(--py, 0) * 14px)); }
.home-hero__wordmark { transform: translateY(calc(var(--py, 0) * 6px)); }`
},
{
  t: "Hero overlay videos",
  where: "Home hero and every PageHero photo panel",
  rule: "Looping CC-BY footage blended over the photo on black: light leaks, film grain, scanlines, confetti and rain. They are stacked by preset rather than chosen per page, and several run slowed down so nothing in the layer reads as a loop. Screen blend for anything that adds light, overlay for grain.",
  timing: "lightLeaks screen .308 at 0.5x speed · filmGrain overlay .202 at 0.85x · scanlines screen .09 · confetti screen .2 at 0.75x · rain screen .26. Presets: home = leaks + grain + confetti, panel and atmosphere = leaks + grain.",
  demo: '<div class="ovl"><i class="ovl--leak"></i><i class="ovl--grain"></i><span>photo</span></div>',
  css: `/* From client/src/lib/heroOverlays.ts. Opacities are deliberately odd
   numbers: they were tuned against the real footage, do not round them. */
export const HERO_OVERLAY_LAYERS = {
  lightLeaks: { src: "/overlays/light-leaks.webm", blendMode: "screen",  opacity: 0.308, playbackRate: 0.5  },
  filmGrain:  { src: "/overlays/scanlines.webm",   blendMode: "overlay", opacity: 0.202, playbackRate: 0.85 },
  scanlines:  { src: "/overlays/scanlines.webm",   blendMode: "screen",  opacity: 0.09  },
  confetti:   { src: "/overlays/confetti.webm",    blendMode: "screen",  opacity: 0.2,   playbackRate: 0.75 },
  rain:       { src: "/overlays/rain.webm",        blendMode: "screen",  opacity: 0.26  },
};
export const HERO_OVERLAY_PRESETS = {
  home:       ["lightLeaks", "filmGrain", "confetti"],
  panel:      ["lightLeaks", "filmGrain"],
  atmosphere: ["lightLeaks", "filmGrain"],
};

/* The stack order is fixed and never varies:
   bg photo -> overlay videos -> legibility scrim -> grain -> content. */
.hero__overlay {
  position: absolute; inset: 0; pointer-events: none;
  object-fit: cover; width: 100%; height: 100%;
}
/* muted, loop, playsInline, and drop to nothing under calm / reduced motion. */`
},
{
  t: "Parallax containers",
  where: "Board and Missed Connections photo heroes",
  rule: "The generic version of the hero effect. A container writes a pixel offset into --parallax-y and its layers translate by it, so a surface can opt into depth without owning a scroll listener of its own. The Missed Connections hero adds a ::before that drifts against the photo. Calm mode pins every layer at zero rather than removing the transform, so nothing reflows when you toggle it.",
  timing: "Driven by scroll position, not by a keyframe. Same lerp discipline as the home hero: ease toward the target, never track it exactly.",
  demo: '<div class="plx"><i></i><i></i><i></i></div>',
  css: `/* The contract is one variable. Layers opt in at their own depth. */
.parallax-container      { --parallax-y: 0px; }
.parallax-container__bg  { transform: translateY(var(--parallax-y, 0px)); }
.missed-connections-hero.parallax-container::before {
  transform: translateY(var(--parallax-y, 0px));
}

/* Calm pins the offset instead of dropping the transform, so nothing jumps. */
html.calm-mode .missed-connections-hero.parallax-container,
html.calm-mode .missed-connections-hero.parallax-container::before {
  --parallax-y: 0px;
}

/* Write the value from one scroll listener, never one per layer. */
el.style.setProperty("--parallax-y", offset.toFixed(1) + "px");`
}
];
