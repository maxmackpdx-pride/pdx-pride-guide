import { useEffect, useMemo, useRef, useState } from 'react';
import { serviceIdentity, type ServiceIdentitySource } from '@shared/serviceIdentity';
import { clearDynamicTextCache, rowGapAbove, solveDynamicText } from '@/lib/dynamicText';
import { CompanyNameMark } from './CompanyNameMark';
import './ServiceNameMark.css';

/** One service-family icon, beside an undistorted, fitted provider name. */
export function ServiceNameMark({ source, iconOnly = false }: { source: ServiceIdentitySource; iconOnly?: boolean }) {
  const identity = serviceIdentity(source);
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fontReady, setFontReady] = useState(false);
  useEffect(() => {
    if (iconOnly) return;
    let active = true;
    document.fonts.load('900 32px "Barlow Condensed"').then(() => document.fonts.ready).then(() => {
      if (active) { clearDynamicTextCache(); setFontReady(true); }
    });
    return () => { active = false; };
  }, [iconOnly]);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [identity?.kind, iconOnly]);
  const layout = useMemo(() => {
    if (iconOnly || !fontReady || !size.width || !size.height) return null;
    // Keep the solver's row-selection floor from collapsing narrow service
    // wells into a tiny single line. Solve a proportionate frame, then apply
    // the same proportion to every font size; glyphs are never stretched.
    const proportion = Math.max(1, 180 / size.width);
    let result = solveDynamicText(source.name, size.width * proportion, size.height * proportion, true, true);
    const words = source.name.trim().split(/\s+/);
    // On small two-column cards, three short whole-word rows can be more
    // readable than a tiny first row. Keep this choice local to service marks.
    if (words.length === 3 && Math.min(...result.sizes) / proportion < 16) {
      const threeRows = solveDynamicText(words.join("\n"), size.width * proportion, size.height * proportion, true);
      if (Math.min(...threeRows.sizes) > Math.min(...result.sizes)) result = threeRows;
    }
    return { ...result, sizes: result.sizes.map(value => value / proportion) };
  }, [source.name, size.width, size.height, fontReady, iconOnly]);
  if (!identity) return <CompanyNameMark name={source.name} />;
  if (iconOnly) return <div className="service-name-mark service-name-mark--icon-only" role="img" aria-label={identity.label}>
    <img className="service-name-mark__icon" src={identity.icon} alt="" aria-hidden="true" />
  </div>;
  return <div className="service-name-mark" role="img" aria-label={`${source.name} — ${identity.label}`}>
    <img className="service-name-mark__icon" src={identity.icon} alt="" aria-hidden="true" />
    <div className="service-name-mark__frame" ref={frame} aria-hidden="true">
      <div className="service-name-mark__lines">
        {layout ? layout.lines.map((line, index) => <span key={index} style={{ fontSize: layout.sizes[index], marginTop: index ? rowGapAbove(line, layout.sizes[index]) : undefined }}>{line}</span>) : <span className="service-name-mark__loading">{source.name}</span>}
      </div>
    </div>
  </div>;
}
