import type { CSSProperties } from 'react';
import { useSegmentedControl } from './useSegmentedControl';
import { Link, useLocation } from 'wouter';
import { motion, useReducedMotion } from 'motion/react';
import './placesShared.css';
export type PlacesPageKey = 'placez' | 'scenez' | 'outzide' | 'needz';
const hrefFor = { placez: '/directory', scenez: '/scenez', outzide: '/outzide/places', needz: '/needz' } as const;
/** Each page's chrome color: the slider thumb's edge + bloom take it, and
    each segment's dot carries its own page's color (Slider_Demo.html).
    Tucker, Nov 19 2026: SceneZ = token Red (#FF0000, --neon-red in code),
    Placez stays WHITE (--text-hi), Outzide keeps Safety Orange, Needz
    takes the Acid Green the site nav already assigns it (--green-acid). */
const accentFor: Record<PlacesPageKey, string> = {
  placez: 'var(--text-hi)',
  scenez: 'var(--neon-red)',
  outzide: 'var(--neon-orange)',
  needz: 'var(--green-acid)',
};
const labelFor: Record<PlacesPageKey, string> = {
  placez: 'Placez',
  scenez: 'SceneZ',
  outzide: 'Outzide',
  needz: 'Needz',
};
const order: PlacesPageKey[] = ['scenez', 'placez', 'outzide', 'needz'];
/**
 * The shared Placez-family slider (Tucker, Nov 19 2026): one geometry on
 * all four pages, per his Slider_Demo.html — the track spans the full
 * content column, segments are a colored dot + label, and the active
 * thumb is transparent deep glass sliding over the labels; its edge and
 * bloom carry the active page's token color and cross-fade while the
 * thumb travels. Tap a label, or drag/swipe the track, to switch pages.
 * Needz joined the slider Nov 19 (late) at Tucker's direction — its stop
 * goes to the live Needz page at /needz (the Resources surface).
 */
export default function PlacesPageSwitch({ active }: { active: PlacesPageKey; compact?: boolean }) {
  const reduced = useReducedMotion();
  const [, navigate] = useLocation();
  const control = useSegmentedControl(order.indexOf(active), order.length, i => {
    if (order[i] !== active) navigate(hrefFor[order[i]]);
  });
  return (
    <nav
      className="places-page-switch places-page-switch--compact"
      aria-label="Explore places"
      style={{ '--page-accent': accentFor[order[control.preview]] } as CSSProperties}
    >
      <div {...control.bindings}>
        {order.map((key, index) => (
          <Link
            key={key}
            href={hrefFor[key]}
            aria-current={key === active ? 'page' : undefined}
            className={key === active ? 'is-active' : ''}
          >
            {control.preview === index && (
              <motion.span
                className="places-page-switch__active"
                layoutId="places-active-page"
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 36 }}
              />
            )}
            <span>
              <span
                className="places-page-switch__dot"
                aria-hidden="true"
                style={{ '--seg-c': accentFor[key] } as CSSProperties}
              />
              {labelFor[key]}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
