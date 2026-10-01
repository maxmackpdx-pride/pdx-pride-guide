import { useId, useMemo } from 'react';
import './RezourcesLogo.css';

// Isolate existing perimeter ink; no lettering or illustration is redrawn.
const SKETCH_REGIONS = [
  { x: 220, y: 230, width: 445, height: 32 },
  { x: 430, y: 780, width: 1030, height: 32 },
  { x: 1020, y: 285, width: 123, height: 31 },
];
const ART = '/brand/family/rezources.svg';
export function RezourcesLogo({ quietMotion = false }: { quietMotion?: boolean }) {
  const id = useId().replace(/:/g, '');
  const rhythms = useMemo(() => SKETCH_REGIONS.map(() => ({ duration: 13 + Math.random() * 9, delay: -Math.random() * 18 })), []);
  return (
    <h1 className="rg-board-logo-frame rg-z-logo" data-quiet-motion={quietMotion || undefined}>
      <svg className="rg-board-logo rg-logo-motion" viewBox="0 0 1792 1008" role="img" aria-label="ReZources">
        <defs>
          <mask id={`${id}-still`} maskUnits="userSpaceOnUse" x="0" y="0" width="1792" height="1008" style={{ maskType: 'luminance' }}>
            <rect width="1792" height="1008" fill="white" />
            {SKETCH_REGIONS.map((r, i) => <rect key={i} {...r} fill="black" />)}
          </mask>
          {SKETCH_REGIONS.map((r, i) => <clipPath key={i} id={`${id}-ink-${i}`}><rect {...r} className="rg-logo-ink-reveal" style={{ animationDuration: `${rhythms[i].duration}s`, animationDelay: `${rhythms[i].delay}s` }} /></clipPath>)}
          <clipPath id={`${id}-z-slices`}>
            <path d="M440 349H621L610 362H440Z M580 414H640L631 426H570Z M386 653H617V663H380Z" />
          </clipPath>
        </defs>
        <image href={ART} width="1792" height="1008" mask={`url(#${id}-still)`} />
        {SKETCH_REGIONS.map((_, i) => <image key={i} href={ART} width="1792" height="1008" clipPath={`url(#${id}-ink-${i})`} />)}
        {!quietMotion && <g clipPath={`url(#${id}-z-slices)`} className="rg-logo-z-glitch">
          <image href={ART} width="1792" height="1008" />
        </g>}
      </svg>
    </h1>
  );
}
