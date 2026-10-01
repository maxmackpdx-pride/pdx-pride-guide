import { useEffect, useId, useMemo, useRef } from 'react';
import { useSpring } from 'framer-motion';
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
const OBJECTS = [
  { id: 'rent', path: 'M374 455L486 438L503 523L391 550Z', pivot: '430px 446.5px' },
  { id: 'apple', path: 'M29 620L101 601L149 619L183 641L207 684L211 752L186 785L129 797L70 775L49 706L31 682Z', pivot: '132px 623px' },
  { id: 'cabbage', path: 'M1583 606L1626 578L1665 605L1695 630L1748 673L1781 710L1774 807L1730 853L1640 860L1560 826L1521 782L1513 704L1544 650Z', pivot: '1631px 606px' },
  { id: 'scales-left', path: 'M824 302H834L863 370L872 374L871 391L844 402L811 400L782 387L783 374L792 370Z', pivot: '828px 302px' },
  { id: 'scales-right', path: 'M988 302H998L1027 369L1038 376L1033 392L1003 402L974 398L949 388L950 374L959 369Z', pivot: '993px 302px' },
];
const Z_SOURCE = 'M407 328H653L577 400H407Z M748 237L698 337L601 455L412 610L348 729L319 761L400 608L510 472L582 398L664 315Z M424 609H672L675 695H346Z';
// Prime Z's beveled upper-left and lower-right terminals, retaining the painted texture.
const Z_SHAPE = 'M407 328H653L577 400H461Z M748 237L698 337L601 455L412 610L348 729L319 761L400 608L510 472L582 398L664 315Z M424 609H672L610 695H346Z';
const BLUE_Z = 'M580 399L746 237L696 340L638 410Z M346 695L407 610H496L426 695L322 758Z';
const CROSS = 'M1226 458H1273V483H1298V531H1273V556H1226V531H1199V483H1226Z';
const FIXED_DETAILS = CROSS + ' M384 418H407V449H384Z M461 403H485V438H461Z M895 219H925V473H895Z M875 463H943V516H875Z M815 273H1008V301H815Z';
const ART = '/brand/family/rezources.svg';

function HangingObject({ object, id, quiet }: { object: typeof OBJECTS[number]; id: string; quiet: boolean }) {
  const weight = object.id.startsWith('scales-') ? 1.3 : object.id === 'rent' ? .7 : 1;
  const angle = useSpring(0, { stiffness: 32, damping: 5, mass: weight * 1.6 });
  const moving = useRef<SVGGElement>(null);
  useEffect(() => angle.on('change', value => {
    // Horizontal shear leaves every y-coordinate unchanged. For the sign,
    // use its sloped attachment line so both hook points remain stationary.
    const slope = object.id === 'rent' ? -17 / 112 : 0;
    const pivotY = Number.parseFloat(object.pivot.split(' ')[1]);
    const intercept = object.id === 'rent' ? 455 - slope * 374 : pivotY;
    const shear = Math.tan(value * Math.PI / 180);
    moving.current?.setAttribute('transform', `matrix(${1 - slope * shear} 0 ${shear} 1 ${-intercept * shear} 0)`);
  }), [angle, object.id, object.pivot]);
  const lastPointer = useRef<{ x: number; time: number } | null>(null);
  useEffect(() => { if (quiet) angle.jump(0); }, [quiet, angle]);
  return <g className="rg-logo-object"
    onPointerEnter={event => {
      if (quiet || event.pointerType !== 'mouse') return;
      lastPointer.current = { x: event.clientX, time: performance.now() };
      angle.set((Math.sign(event.movementX) || 1) * 1.32 / weight);
    }}
    onPointerMove={event => {
      if (quiet || event.pointerType !== 'mouse') return;
      const now = performance.now();
      if (lastPointer.current) {
        const velocity = (event.clientX - lastPointer.current.x) / Math.max(16, now - lastPointer.current.time);
        if (Math.abs(event.clientX - lastPointer.current.x) > .25)
          angle.set(Math.max(-1.43, Math.min(1.43, velocity * .88)) / weight);
      }
      lastPointer.current = { x: event.clientX, time: now };
    }}
    onPointerLeave={() => { lastPointer.current = null; angle.set(0); }}>
    <g ref={moving} className="rg-logo-object-swing">
      <image href={ART} width="1792" height="1008" clipPath={`url(#${id}-${object.id})`} />
    </g>
    <path d={object.path} fill="transparent" className="rg-logo-object-hit" />
  </g>;
}

export function RezourcesLogo({ quietMotion = false }: { quietMotion?: boolean }) {
  const frame = useRef<HTMLHeadingElement>(null);
  const id = useId().replace(/:/g, '');
  const rhythms = useMemo(() => SKETCH_REGIONS.map(() => ({ duration: 13 + Math.random() * 9, delay: -Math.random() * 18 })), []);
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
      <svg className="rg-board-logo rg-logo-motion" viewBox="0 0 1792 1008" role="img" aria-label="ReZources">
        <defs>
          <mask id={`${id}-still`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            <rect width="1792" height="1008" fill="white" />
            <path d={Z_SOURCE} fill="black" />
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="black" fillRule="evenodd" />)}
            {SKETCH_REGIONS.map((r, i) => <rect key={i} {...r} fill="black" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.path} fill="black" />)}
            <path d={FIXED_DETAILS} fill="white" />
          </mask>
          {SKETCH_REGIONS.map((r, i) => <clipPath key={i} id={`${id}-ink-${i}`}><rect {...r} className="rg-logo-ink-reveal" style={{ animationDuration: `${rhythms[i].duration}s`, animationDelay: `${rhythms[i].delay}s` }} /></clipPath>)}
          {OBJECTS.map(o => <clipPath key={o.id} id={`${id}-${o.id}`}><path d={o.path} /></clipPath>)}
          <clipPath id={`${id}-blue-z`}><path d={BLUE_Z} /></clipPath>
          <mask id={`${id}-moving-letters`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="white" fillRule="evenodd" />)}
            <path d={Z_SOURCE} fill="black" />
            {OBJECTS.map(o => <path key={o.id} d={o.path} fill="black" />)}
            <path d={FIXED_DETAILS} fill="black" />
          </mask>
          <mask id={`${id}-letters`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="white" fillRule="evenodd" stroke="black" strokeWidth="7" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.path} fill="black" />)}
            <path d={FIXED_DETAILS} fill="black" />
          </mask>
          <linearGradient id={`${id}-color`} x1="0" y1="0" x2="1" y2=".5">
            <stop offset="0" stopColor="var(--neon-orange)" />
            <stop offset=".3" stopColor="var(--neon-yellow)" />
            <stop offset=".5" stopColor="var(--neon-cyan)" />
            <stop offset=".7" stopColor="var(--neon-blue)" />
            <stop offset="1" stopColor="var(--neon-magenta)" />
          </linearGradient>
          <linearGradient id={`${id}-shimmer`}>
            <stop offset="0" stopColor="var(--text-heading)" stopOpacity="0" />
            <stop offset=".5" stopColor="var(--text-heading)" stopOpacity=".3" />
            <stop offset="1" stopColor="var(--text-heading)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-z-shape`}><path d={Z_SHAPE} /></clipPath>
        </defs>
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-still)`} />
        <g className="rg-logo-surface">
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-moving-letters)`} />

        <g mask={`url(#${id}-letters)`} className="rg-logo-color-window" aria-hidden="true">
          <rect x="90" y="370" width="1620" height="270" fill={`url(#${id}-color)`} className="rg-logo-color-depth" />
        </g>
        <g mask={`url(#${id}-letters)`} aria-hidden="true" className="rg-logo-shimmer-window">
          <rect className="rg-logo-letter-shimmer" x="-260" y="395" width="240" height="225" fill={`url(#${id}-shimmer)`} />
        </g>
        </g>
        {OBJECTS.map(o => <HangingObject key={o.id} object={o} id={id} quiet={quietMotion} />)}
        {SKETCH_REGIONS.map((_, i) => <image key={i} href={ART} width="1792" height="1008" clipPath={`url(#${id}-ink-${i})`} />)}
        <g className="rg-logo-z-depth" clipPath={`url(#${id}-z-shape)`}>
          <image href={ART} width="1792" height="1008" />
        </g>
        {!quietMotion && <g clipPath={`url(#${id}-blue-z)`} className="rg-blue-z-pixels" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => <rect key={i} x={330 + (i * 47) % 390} y={245 + (i * 61) % 490} width={24 + i % 3 * 12} height={8 + i % 2 * 8} fill={i % 3 === 0 ? 'var(--z-black)' : i % 2 ? 'var(--neon-cyan)' : 'var(--neon-blue)'} />)}
        </g>}
      </svg>
    </h1>
  );
}
