import './CardArtworkGlass.css';
import { useEffect, useRef } from 'react';

/** Artwork-only glass, below authored media, names and controls. */
export function CardArtworkGlass() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const film = ref.current;
    const card = film?.closest('.rg-directory-card,.tonight-card,.event-rail-card,.pdxBoard--event-grid');
    const seam = card?.querySelector('.rg-directory-footer,.tonight-card__footer,.event-rail-card__title,.pdxBoard__actions');
    const caption = card?.querySelector('.pdxPlace__name');
    if (!film || !seam) return;
    const sync = () => {
      const bounds = film.getBoundingClientRect();
      let edge = seam.getBoundingClientRect();
      // Compact cards use a full-card invisible action target, rather than a
      // footer seam. Their visible caption marks the start of the reading area.
      if (caption && (!edge.height || (edge.top <= bounds.top + 2 && edge.bottom >= bounds.bottom - 2))) edge = caption.getBoundingClientRect();
      const depth = bounds.bottom - edge.top + 2;
      if (depth > 0) film.style.setProperty('--artwork-glass-action-depth', `${depth}px`);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(film); observer.observe(seam);
    if (caption) observer.observe(caption);
    sync();
    return () => observer.disconnect();
  }, []);
  return <span ref={ref} className="card-artwork-glass" aria-hidden="true" />;
}
