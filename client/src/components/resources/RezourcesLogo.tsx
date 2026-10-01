import { useId, useMemo, useRef, type CSSProperties } from 'react';
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
  { id: 'rent', path: 'M378 420L402 418L408 442L463 432L464 405L482 407L487 441L503 523L391 550L369 453L385 448Z', pivot: '433px 424px' },
  { id: 'apple', path: 'M29 620L101 601L149 619L183 641L207 684L211 752L186 785L129 797L70 775L49 706L31 682Z', pivot: '132px 623px' },
  { id: 'cabbage', path: 'M1583 606L1626 578L1665 605L1695 630L1748 673L1781 710L1774 807L1730 853L1640 860L1560 826L1521 782L1513 704L1544 650Z', pivot: '1631px 606px' },
  { id: 'scales', path: 'M897 219L920 219L927 271L1007 281L1039 385L1020 402L948 402L944 374L981 305L924 302L925 462L942 488L942 515L873 515L873 488L892 462L897 301L840 303L874 374L874 394L817 404L780 388L785 371L815 286L889 274Z', pivot: '909px 285px' },
];
const Z_SHAPE = 'M407 328H653L577 400H407Z M748 237L698 337L601 455L412 610L348 729L319 761L400 608L510 472L582 398L664 315Z M424 609H672L675 695H346Z';
const ART = '/brand/family/rezources.svg';
export function RezourcesLogo({ quietMotion = false }: { quietMotion?: boolean }) {
  const frame = useRef<HTMLHeadingElement>(null);
  const id = useId().replace(/:/g, '');
  const rhythms = useMemo(() => SKETCH_REGIONS.map(() => ({ duration: 13 + Math.random() * 9, delay: -Math.random() * 18 })), []);
  return (
    <h1 ref={frame} className="rg-board-logo-frame rg-z-logo" data-quiet-motion={quietMotion || undefined}
      onPointerMove={event => {
        if (quietMotion || event.pointerType !== 'mouse') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--logo-tilt-x', `${-((event.clientY - bounds.top) / bounds.height - .5) * 1.6}deg`);
        event.currentTarget.style.setProperty('--logo-tilt-y', `${((event.clientX - bounds.left) / bounds.width - .5) * 2}deg`);
        event.currentTarget.style.setProperty('--logo-color-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 20}px`);
        event.currentTarget.style.setProperty('--logo-color-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 12}px`);
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
            <path d={Z_SHAPE} fill="black" />
            {SKETCH_REGIONS.map((r, i) => <rect key={i} {...r} fill="black" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.path} fill="black" />)}
          </mask>
          {SKETCH_REGIONS.map((r, i) => <clipPath key={i} id={`${id}-ink-${i}`}><rect {...r} className="rg-logo-ink-reveal" style={{ animationDuration: `${rhythms[i].duration}s`, animationDelay: `${rhythms[i].delay}s` }} /></clipPath>)}
          {OBJECTS.map(o => <clipPath key={o.id} id={`${id}-${o.id}`}><path d={o.path} /></clipPath>)}
          <mask id={`${id}-letters`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            {rezourcesLetterPaths.map((d, i) => <path key={i} d={d} fill="white" fillRule="evenodd" stroke="black" strokeWidth="7" />)}
            {OBJECTS.map(o => <path key={o.id} d={o.path} fill="black" />)}
          </mask>
          <linearGradient id={`${id}-color`} x1="0" y1="0" x2="1" y2=".5">
            <stop offset="0" stopColor="var(--neon-orange)" />
            <stop offset=".3" stopColor="var(--neon-yellow)" />
            <stop offset=".5" stopColor="var(--neon-cyan)" />
            <stop offset=".7" stopColor="var(--neon-blue)" />
            <stop offset="1" stopColor="var(--neon-magenta)" />
          </linearGradient>
          <clipPath id={`${id}-z-shape`}><path d={Z_SHAPE} /></clipPath>
          <mask id={`${id}-z-erase`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            <rect width="1792" height="1008" fill="white" />
            <path className="rg-z-eraser" d="M438 353H625 M586 417H643 M371 659H635" fill="none" stroke="black" strokeWidth="16" pathLength="1" />
          </mask>
          <clipPath id={`${id}-z-slices`}>
            <path d="M440 349H621L610 362H440Z M580 414H640L631 426H570Z M386 653H617V663H380Z" />
          </clipPath>
        </defs>
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-still)`} />
        {SKETCH_REGIONS.map((_, i) => <image key={i} href={ART} width="1792" height="1008" clipPath={`url(#${id}-ink-${i})`} />)}
        <g mask={`url(#${id}-letters)`} className="rg-logo-color-window" aria-hidden="true">
          <rect x="90" y="370" width="1620" height="270" fill={`url(#${id}-color)`} className="rg-logo-color-depth" />
        </g>
        {OBJECTS.map(o => <g key={o.id} className="rg-logo-object" style={{ '--object-pivot': o.pivot } as CSSProperties}>
          <g className="rg-logo-object-swing">
            <image href={ART} width="1792" height="1008" clipPath={`url(#${id}-${o.id})`} />
          </g>
          <path d={o.path} fill="transparent" className="rg-logo-object-hit" />
        </g>)}
        <g className="rg-logo-z-depth">
          <g clipPath={`url(#${id}-z-shape)`} mask={`url(#${id}-z-erase)`}>
            <image href={ART} width="1792" height="1008" />
          </g>
        {!quietMotion && <g clipPath={`url(#${id}-z-slices)`} className="rg-logo-z-glitch">
          <image href={ART} width="1792" height="1008" />
        </g>}
        </g>
      </svg>
    </h1>
  );
}
