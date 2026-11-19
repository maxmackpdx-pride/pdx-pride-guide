import { useId, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { BrowseCardSize } from './CardBrowse';

const OPTIONS = [
  { id: 'small', label: 'Small cards' },
  { id: 'wide', label: 'Wide cards' },
] as const;

/**
 * The card-size control (Tucker, Nov 19 2026): the Wide/Small cards toggle
 * moved off the page surface into the drawer, rebuilt as a 2-option slider
 * in the PlacesPageSwitch style — transparent deep-glass thumb sliding over
 * the labels, 1px edge + bloom in the page accent, same spring. It drives
 * the same BrowseCardSize state the browse grid always used; the state now
 * lives on the page and is passed to both this slider and CardBrowse.
 */
export default function CardSizeSlider({
  value,
  onChange,
  accent,
}: {
  value: BrowseCardSize;
  onChange: (size: BrowseCardSize) => void;
  accent: string;
}) {
  const reduced = useReducedMotion();
  const thumbId = useId();
  return (
    <div
      className="pz-size-slider"
      role="group"
      aria-label="Card size"
      style={{ '--page-accent': accent } as CSSProperties}
    >
      {OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {value === option.id && (
            <motion.span
              className="pz-size-slider__thumb"
              layoutId={thumbId}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 36 }}
            />
          )}
          <span className="pz-size-slider__label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
