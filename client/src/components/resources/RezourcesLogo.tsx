import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { animate, useInView, useMotionValue } from 'framer-motion';
import { rezourcesLetterPaths } from './rezourcesLetterPaths';
import './RezourcesLogo.css';

// Isolate existing perimeter ink; no lettering or illustration is redrawn.
const SKETCH_REGIONS = [
  { x: 220, y: 230, width: 445, height: 32 },
  { x: 430, y: 780, width: 1030, height: 32 },
  { x: 1020, y: 285, width: 123, height: 31 },
  { x: 113, y: 312, width: 270, height: 22 },
  { x: 834, y: 678, width: 304, height: 32 },
  { x: 1340, y: 678, width: 115, height: 30 },
  { x: 665, y: 180, width: 14, height: 91 },
];
// Keep the full-sized source illustration hidden after shrinking the separate disco ball.
const DISCO_SOURCE_PATH = 'M1635 575C1699 576 1751 623 1777 680C1801 743 1775 820 1726 852C1681 884 1604 876 1553 839C1500 801 1485 736 1512 670C1532 620 1575 591 1635 575Z';
const RENT_SOURCE_PATH = 'M365 405L493 397L516 531L383 559L365 405Z';
const OBJECTS = [
  { id: 'rent', path: 'M408 422L541 422L559 545L415 548Z', pivot: '460px 358px' },
  { id: 'apple', path: 'M29 620L101 601L149 619L183 641L207 684L211 752L186 785L129 797L70 775L49 706L31 682Z', pivot: '132px 623px' },
  { id: 'disco-ball', path: 'M1601.4 545C1652.6 545.8 1694.2 583.4 1715 629C1734.2 679.4 1713.4 741 1674.2 766.6C1638.2 792.2 1576.6 785.8 1535.8 756.2C1493.4 725.8 1481.4 673.8 1503 621C1519 581 1553.4 557.8 1601.4 545Z', pivot: '1601px 547px' },
  { id: 'scales-left', path: 'M824 302H834L863 370L872 374L871 391L844 402L811 400L782 387L783 374L792 370Z', pivot: '828px 302px' },
  { id: 'scales-right', path: 'M988 302H998L1027 369L1038 376L1033 392L1003 402L974 398L949 388L950 374L959 369Z', pivot: '993px 302px' },
];
const Z_SOURCE = 'M407 328H653L577 400H407Z M748 237L698 337L601 455L412 610L348 729L319 761L400 608L510 472L582 398L664 315Z M424 609H672L675 695H346Z';
// Prime Z's beveled upper-left and lower-right terminals, retaining the painted texture.
const Z_SHAPE = 'M407 328H653L577 400H461Z M748 237L698 337L601 455L412 610L348 729L319 761L400 608L510 472L582 398L664 315Z M424 609H672L610 695H346Z';
const BLUE_Z = 'M580 399L746 237L696 340L638 410Z M346 695L407 610H496L426 695L322 758Z';
const CROSS = 'M1226 458H1273V483H1298V531H1273V556H1226V531H1199V483H1226Z';
const SCALE_BODY = 'M895 219H925V473H895Z M875 463H943V516H875Z M815 273H1008V301H815Z';
const SCALE_UPPER = 'M895 219H925V473H895Z M815 273H1008V301H815Z';
const SCALE_BASE = 'M875 463H943V516H875Z';
const SCALE_DROP = 90;
const SCALE_BASE_DROP = -25;
const FIXED_DETAILS = CROSS;
// Rasterize the detailed source once at its native size; animated clips reuse pixels.
const ART = '/brand/family/rezources.png';
const DISCO_ART = '/brand/family/rezources-disco-ball.png';
const LATE_RENT_ART = '/brand/family/rezources-late-rent.png';
const ROOSTER_ROCK_ART = '/brand/family/rezources-rooster-rock.png';
const EVICTION_ART = '/brand/family/rezources-eviction.png';

function HangingObject({ object, id, quiet, beePass }: { object: typeof OBJECTS[number]; id: string; quiet: boolean; beePass: number }) {
  const idleAmplitude = object.id.startsWith('scales-') ? 2 : object.id === 'rent' ? 1.4 : object.id === 'disco-ball' ? 1.1 : 1.6;
  const angle = useMotionValue(0);
  const swing = useRef<{ stop: () => void } | null>(null);
  const settling = useRef(false);
  const idleResumedAt = useRef(0);
  const moving = useRef<SVGGElement>(null);
  const strings = useRef<SVGPathElement>(null);
  const drop = object.id === 'rent' ? 0 : 10;
  const anchors = [object.pivot.split(' ').map(Number.parseFloat)];
  const stringPath = (dx: number) => anchors.map(([x, y]) => `M${x} ${y} L${x + dx} ${y + drop}`).join(' ');
  const rentWirePath = (degrees: number) => {
    const [x, y] = anchors[0];
    const radians = degrees * Math.PI / 180;
    const endpoints = [[435, 428], [534, 438]];
    return endpoints.map(([endX, endY]) => {
      const dx = endX - x;
      const dy = endY - y;
      return `M${x} ${y} L${x + dx * Math.cos(radians) - dy * Math.sin(radians)} ${y + dx * Math.sin(radians) + dy * Math.cos(radians)}`;
    }).join(' ');
  };
  useEffect(() => {
    const update = (value: number) => {
      const degrees = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : value;
      const radians = degrees * Math.PI / 180;
      if (object.id === 'rent') {
        // Two wires meet at a fixed nail on the Z; only the sign rocks below it.
        const [x, y] = anchors[0];
        moving.current?.setAttribute('transform', `rotate(${degrees} ${x} ${y})`);
        strings.current?.setAttribute('d', rentWirePath(degrees));
      } else {
        // A rigid pendulum: the pivot never translates or follows the logo tilt.
        const [x, y] = anchors[0];
        moving.current?.setAttribute('transform', `rotate(${degrees} ${x} ${y}) translate(0 ${drop})`);
        strings.current?.setAttribute('d', `M${x} ${y} L${x - Math.sin(radians) * drop} ${y + Math.cos(radians) * drop}`);
      }
    };
    update(angle.get());
    return angle.on('change', update);
  }, [angle, object.id, object.pivot]);
  const hovering = useRef(false);

  useEffect(() => {
    if (quiet) { swing.current?.stop(); settling.current = false; hovering.current = false; angle.set(0); return; }
    const index = OBJECTS.findIndex(item => item.id === object.id);
    const phase = index * Math.PI * 2 / OBJECTS.length + Math.PI / 4;
    const started = performance.now();
    const tick = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        swing.current?.stop(); settling.current = false; angle.set(0); return;
      }
      if (hovering.current || settling.current || document.hidden) return;
      const now = performance.now();
      const blend = Math.min(1, (now - idleResumedAt.current) / 3000);
      const period = 9000 + index * 900;
      angle.set(Math.sin((now - started) * Math.PI * 2 / period + phase) * idleAmplitude * blend);
    };
    tick();
    const timer = window.setInterval(tick, 150);
    return () => { window.clearInterval(timer); swing.current?.stop(); };
  }, [quiet, angle, object.id, idleAmplitude]);

  useEffect(() => {
    if (!beePass || quiet) return;
    // Alternate which hanging pieces respond so each pass feels incidental.
    const touched = beePass % 2 ? ['apple', 'scales-right'] : ['rent', 'scales-left', 'disco-ball'];
    if (!touched.includes(object.id)) return;
    const delay = ({ apple: 800, rent: 1700, 'scales-left': 3000, 'scales-right': 3550, 'disco-ball': 6100 } as Record<string, number>)[object.id];
    const timer = window.setTimeout(() => {
      if (hovering.current || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      swing.current?.stop();
      settling.current = true;
      const direction = object.id === 'scales-right' || object.id === 'disco-ball' ? -1 : 1;
      const amplitude = direction * idleAmplitude * 1.3;
      swing.current = animate(angle, [angle.get(), amplitude, -amplitude * .45, amplitude * .14, 0], {
        duration: 5.5, times: [0, .18, .48, .76, 1], ease: 'easeInOut',
        onComplete: () => { idleResumedAt.current = performance.now(); settling.current = false; },
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [beePass, quiet, object.id, angle, idleAmplitude]);
  return <g className="rg-logo-object"
    onPointerEnter={event => {
      if (quiet || event.pointerType !== 'mouse') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      hovering.current = true;
      settling.current = true;
      swing.current?.stop();
      // Bounded, progressively smaller arcs; pointer speed never adds energy.
      const direction = OBJECTS.findIndex(item => item.id === object.id) % 2 === 0 ? 1 : -1;
      const amplitude = direction * idleAmplitude * 1.15;
      swing.current = animate(angle, [angle.get(), amplitude, -amplitude * .5, amplitude * .18, 0], {
        duration: 18, times: [0, .22, .55, .82, 1], ease: 'easeInOut',
        onComplete: () => { idleResumedAt.current = performance.now(); settling.current = false; },
      });
    }}
    onPointerLeave={() => {
      hovering.current = false;
      swing.current?.stop();
      if (quiet || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        angle.set(0);
        settling.current = false;
        return;
      }
      const current = angle.get();
      settling.current = true;
      // Restart at zero velocity immediately, then settle through smaller arcs.
      swing.current = animate(angle, [current, -current * .5, current * .18, 0], {
        duration: 20, times: [0, .45, .78, 1], ease: 'easeInOut',
        onComplete: () => { idleResumedAt.current = performance.now(); settling.current = false; },
      });
    }}>
    {object.id !== 'disco-ball' && <path ref={strings} d={object.id === 'rent' ? rentWirePath(0) : stringPath(0)} className="rg-logo-hanging-strings" />}
    <g ref={moving} className="rg-logo-object-swing" style={{ "--logo-drop": `${drop}px` } as CSSProperties} transform={`translate(0 ${drop})`}>
      <path d={object.path} className="rg-logo-object-shadow" transform="translate(8 11)" filter={`url(#${id}-object-shadow)`} />
      {object.id === 'rent'
        ? <image href={LATE_RENT_ART} x="390" y="410" width="190" height="138" />
        : object.id === 'disco-ball'
        ? <image href={DISCO_ART} x="1492" y="548" width="229" height="233" clipPath={`url(#${id}-${object.id})`} />
        : <image href={ART} width="1792" height="1008" clipPath={`url(#${id}-${object.id})`} />}
    </g>
    <path d={object.path} fill="transparent" className="rg-logo-object-hit" />
  </g>;
}

function RezourcesLogoDesktop({ quietMotion: requestedQuietMotion = false }: { quietMotion?: boolean }) {
  const frame = useRef<HTMLHeadingElement>(null);
  const inView = useInView(frame);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const sync = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  const quietMotion = requestedQuietMotion || !inView || !documentVisible;
  const id = useId().replace(/:/g, '');
  const [beePass, setBeePass] = useState(0);
  useEffect(() => {
    if (quietMotion) { setBeePass(0); return; }
    const fly = () => {
      if (!document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setBeePass(pass => pass + 1);
      }
    };
    const first = window.setTimeout(fly, 8000);
    const repeat = window.setInterval(fly, 32000);
    return () => { window.clearTimeout(first); window.clearInterval(repeat); };
  }, [quietMotion]);
  // Uneven, repeatable offsets avoid synchronized redraws and rerender jumps.
  const rhythms = [
    { duration: 31, delay: -17 }, { duration: 43, delay: -29 },
    { duration: 37, delay: -9 }, { duration: 47, delay: -38 },
    { duration: 29, delay: -6 }, { duration: 41, delay: -22 },
    { duration: 35, delay: -31 },
  ];
  return (
    <h1 ref={frame} className="rg-board-logo-frame rg-z-logo" data-quiet-motion={quietMotion || undefined}
      onPointerMove={event => {
        if (quietMotion || event.pointerType !== 'mouse') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--logo-tilt-x', `${-((event.clientY - bounds.top) / bounds.height - .5) * .4}deg`);
        event.currentTarget.style.setProperty('--logo-tilt-y', `${((event.clientX - bounds.left) / bounds.width - .5) * .5}deg`);
        event.currentTarget.style.setProperty('--logo-color-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 8}px`);
        event.currentTarget.style.setProperty('--logo-color-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 5}px`);
      }}
      onPointerLeave={() => {
        frame.current?.style.setProperty('--logo-tilt-x', '0deg');
        frame.current?.style.setProperty('--logo-tilt-y', '0deg');
        frame.current?.style.setProperty('--logo-color-x', '0px');
        frame.current?.style.setProperty('--logo-color-y', '0px');
      }}>
      <svg className="rg-board-logo rg-logo-motion" viewBox="0 0 1792 1008" role="img" aria-label="ReZources trademark">
        <defs>
          <mask id={`${id}-still`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            <rect width="1792" height="1008" fill="white" />
            <path d={Z_SOURCE} fill="black" />
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="black" fillRule="evenodd" />)}
            {SKETCH_REGIONS.map((r, i) => <rect key={i} {...r} fill="black" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.id === 'disco-ball' ? DISCO_SOURCE_PATH : o.id === 'rent' ? RENT_SOURCE_PATH : o.path} fill="black" />)}
            <path d={SCALE_BODY} fill="black" />
            <path d={FIXED_DETAILS} fill="white" />
          </mask>
          {SKETCH_REGIONS.map((r, i) => <clipPath key={i} id={`${id}-ink-${i}`}><rect {...r} className="rg-logo-ink-reveal" style={{ animationDuration: `${rhythms[i].duration}s`, animationDelay: `${rhythms[i].delay}s`, transformOrigin: ['left center', 'right center', 'center', 'right center', 'left center', 'center', 'center bottom'][i] }} /></clipPath>)}
          {OBJECTS.map(o => <clipPath key={o.id} id={`${id}-${o.id}`}><path d={o.path} /></clipPath>)}
          <filter id={`${id}-object-shadow`} x="-30%" y="-30%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={`${id}-scale-body`}><path d={SCALE_BODY} /></clipPath>
          <clipPath id={`${id}-scale-upper`}><path d={SCALE_UPPER} /></clipPath>
          <clipPath id={`${id}-scale-base`}><path d={SCALE_BASE} /></clipPath>
          <clipPath id={`${id}-blue-smear-bands`}>
            <path d="M540 290H760V304H540Z M530 330H740V348H530Z M520 375H700V390H520Z M330 618H530V636H330Z M320 657H510V674H320Z M310 700H460V715H310Z" />
          </clipPath>
          <clipPath id={`${id}-blue-z`}><path d={BLUE_Z} /></clipPath>
          <mask id={`${id}-moving-letters`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="white" fillRule="evenodd" />)}
            <path d={Z_SOURCE} fill="black" />
            {OBJECTS.map(o => <path key={o.id} d={o.id === 'disco-ball' ? DISCO_SOURCE_PATH : o.id === 'rent' ? RENT_SOURCE_PATH : o.path} fill="black" />)}
            <path d={SCALE_BODY} fill="black" />
            <path d={FIXED_DETAILS} fill="black" />
          </mask>
          <mask id={`${id}-letters`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="white" fillRule="evenodd" stroke="black" strokeWidth="7" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.id === 'disco-ball' ? DISCO_SOURCE_PATH : o.id === 'rent' ? RENT_SOURCE_PATH : o.path} fill="black" />)}
            <path d={SCALE_BODY} fill="black" />
            <path d={FIXED_DETAILS} fill="black" />
          </mask>
          <linearGradient id={`${id}-e-repair`} gradientUnits="userSpaceOnUse" x1="309" y1="408" x2="446" y2="608">
            <stop stopColor="var(--neon-orange)" />
            <stop offset="1" stopColor="var(--neon-yellow)" />
          </linearGradient>
          <linearGradient id={`${id}-u-repair`} gradientUnits="userSpaceOnUse" x1="875" y1="408" x2="943" y2="573">
            <stop stopColor="#75cd79" />
            <stop offset="1" stopColor="#08ccc5" />
          </linearGradient>
          <linearGradient id={`${id}-color`} x1="0" y1="0" x2="1" y2=".5">
            <stop offset="0" stopColor="var(--neon-orange)" />
            <stop offset=".3" stopColor="var(--neon-yellow)" />
            <stop offset=".5" stopColor="var(--neon-cyan)" />
            <stop offset=".7" stopColor="var(--neon-blue)" />
            <stop offset="1" stopColor="var(--neon-magenta)" />
          </linearGradient>
          <linearGradient id={`${id}-shimmer`}>
            <stop offset="0" stopColor="var(--text-heading)" stopOpacity="0" />
            <stop offset=".5" stopColor="var(--text-heading)" stopOpacity=".7" />
            <stop offset="1" stopColor="var(--text-heading)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-z-shape`}><path d={Z_SHAPE} /></clipPath>
        </defs>
        <g className="rg-logo-blueprint" aria-hidden="true">
          <path pathLength="1" d="M250 193H721 M250 184V202 M721 184V202 M270 193L281 187 M270 193L281 199 M701 187L712 193L701 199" />
          <path pathLength="1" d="M770 246H1067 M770 235V258 M1067 235V258 M800 246L811 239 M800 246L811 253 M1026 239L1037 246L1026 253" />
          <path pathLength="1" d="M1285 744H1673 M1285 733V755 M1673 733V755 M1308 744L1319 738 M1308 744L1319 750 M1640 738L1651 744L1640 750" />
          <path pathLength="1" d="M1730 314V695 M1720 314H1740 M1720 695H1740 M1730 340L1724 351 M1730 340L1736 351 M1724 658L1730 669L1736 658" />
          <path pathLength="1" d="M395 835H1145 M395 825V845 M1145 825V845 M618 827V843 M857 827V843 M1052 827V843" />
        </g>
        <g className="rg-logo-underlay" aria-hidden="true">
          <g transform={`translate(0 ${SCALE_DROP})`}>
            <g clipPath={`url(#${id}-scale-upper)`}>
              <image href={ART} width="1792" height="1008" />
            </g>
            <g transform={`translate(0 ${SCALE_BASE_DROP})`} clipPath={`url(#${id}-scale-base)`}>
              <image href={ART} width="1792" height="1008" />
            </g>
          </g>
          <path d="M1605 412C1603 455 1600 507 1601 546" fill="none" stroke="var(--text-heading)" strokeWidth="2.6" opacity=".7" />
          <image href={ROOSTER_ROCK_ART} x="1300" y="270" width="300" height="220" transform="rotate(-11 1450 380)" />
        </g>
        {/* Restore the E beneath the relocated rent sign before layering the original texture. */}
        <path d={rezourcesLetterPaths[1]} fill={`url(#${id}-e-repair)`} />
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-still)`} />
        {/* Fill the U where the original scale post was removed. */}
        <g clipPath={`url(#${id}-scale-body)`}>
          <path d={rezourcesLetterPaths[3]} fill={`url(#${id}-u-repair)`} />
        </g>
        <g className="rg-logo-surface">
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-moving-letters)`} />

        <g mask={`url(#${id}-letters)`} className="rg-logo-color-window" aria-hidden="true">
          <rect x="90" y="370" width="1620" height="270" fill={`url(#${id}-color)`} className="rg-logo-color-depth" />
        </g>
        <g mask={`url(#${id}-letters)`} aria-hidden="true" className="rg-logo-shimmer-window">
          <rect className="rg-logo-letter-shimmer" x="-260" y="395" width="240" height="225" fill={`url(#${id}-shimmer)`} />
        </g>
        </g>
        {OBJECTS.filter(o => o.id !== 'rent').map(o => o.id.startsWith('scales-')
          ? <g key={o.id} transform={`translate(0 ${SCALE_DROP})`}><HangingObject object={o} id={id} quiet={quietMotion} beePass={beePass} /></g>
          : <HangingObject key={o.id} object={o} id={id} quiet={quietMotion} beePass={beePass} />)}
        {!quietMotion && beePass > 0 && <g key={beePass} className="rg-logo-bee-flight" aria-hidden="true">
          <g className="rg-logo-bee">
            <ellipse cx="-5" cy="-8" rx="8" ry="5" fill="var(--text-heading)" opacity=".72" />
            <ellipse cx="6" cy="-9" rx="8" ry="5" fill="var(--text-heading)" opacity=".72" />
            <ellipse rx="14" ry="9" fill="var(--neon-yellow)" stroke="var(--z-black)" strokeWidth="2" />
            <path d="M-4 -8v16 M5 -7v14" stroke="var(--z-black)" strokeWidth="3" />
            <circle cx="12" cy="-2" r="1.5" fill="var(--z-black)" />
          </g>
        </g>}
        {SKETCH_REGIONS.map((_, i) => <image key={i} href={ART} width="1792" height="1008" clipPath={`url(#${id}-ink-${i})`} />)}
        <g className="rg-logo-z-depth" clipPath={`url(#${id}-z-shape)`}>
          <image href={ART} width="1792" height="1008" />
        </g>
        {!quietMotion && <g clipPath={`url(#${id}-blue-z)`} aria-hidden="true">
          <g clipPath={`url(#${id}-blue-smear-bands)`}>
            <image className="rg-blue-z-smear" href={ART} width="1792" height="1008" />
          </g>
        </g>}
        {!quietMotion && <g clipPath={`url(#${id}-blue-z)`} className="rg-blue-z-pixels" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => <rect key={i} x={330 + (i * 47) % 390} y={245 + (i * 61) % 490} width={24 + i % 3 * 12} height={8 + i % 2 * 8} fill={i % 3 === 0 ? 'var(--z-black)' : i % 2 ? 'var(--neon-cyan)' : 'var(--neon-blue)'} />)}
        </g>}
        <g aria-hidden="true" className="rg-logo-rent-nail">
          <circle cx="460" cy="358" r="7" fill="var(--z-black)" stroke="var(--neon-orange)" strokeWidth="2" />
          <circle cx="460" cy="358" r="2" fill="var(--text-heading)" />
        </g>
        {OBJECTS.filter(o => o.id === 'rent').map(o => <HangingObject key={o.id} object={o} id={id} quiet={quietMotion} beePass={beePass} />)}
        <image href={EVICTION_ART} x="565" y="605" width="190" height="169" aria-hidden="true" />
        <text className="rg-logo-trademark" x="1700" y="416" aria-hidden="true">™</text>
      </svg>
    </h1>
  );
}

export function RezourcesLogo({ quietMotion = false }: { quietMotion?: boolean }) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (mobile) {
    return <h1 className="rg-board-logo-frame rg-z-logo rg-z-logo--mobile">
      <img
        className="rg-board-logo"
        src="/brand/family/rezources-mobile.webp"
        alt="ReZources"
        fetchPriority="high"
        decoding="async"
      />
    </h1>;
  }

  return <RezourcesLogoDesktop quietMotion={quietMotion} />;
}
