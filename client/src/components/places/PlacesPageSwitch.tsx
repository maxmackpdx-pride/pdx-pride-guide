import type { CSSProperties } from 'react';
import { useSegmentedControl } from './useSegmentedControl';
import { MapPin, Layers, Mountain } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion, useReducedMotion } from 'motion/react';
import './placesShared.css';
import { PLACES_NAV } from '@/lib/siteNav';
export type PlacesPageKey = 'placez' | 'scenez' | 'outzide';
const hrefFor = { placez: '/directory', scenez: '/scenez', outzide: '/outzide/places' } as const;
/** Each page's chrome color: the slider thumb's edge + bloom take it.
    Tucker, Nov 19 2026: SceneZ = token Red (#FF0000, --neon-red in code),
    Placez stays WHITE (--text-hi), Outzide keeps Safety Orange. */
const accentFor: Record<PlacesPageKey, string> = {
  placez: 'var(--text-hi)',
  scenez: 'var(--neon-red)',
  outzide: 'var(--neon-orange)',
};
const order: PlacesPageKey[] = ['scenez', 'placez', 'outzide'];
/**
 * The shared Placez-family slider (Tucker, Nov 19 2026): one geometry on all
 * three pages, taken from OutZide's compact switch — same outer width
 * (76%) and height everywhere. The active thumb is transparent deep glass
 * sliding over the labels; its edge and bloom carry the active page's
 * token color and cross-fade while the thumb travels. Tap a label, or
 * drag/swipe the track, to switch pages.
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
        {order.map((key, index) => {
          const page = PLACES_NAV.find(link => link.href === hrefFor[key])!;
          return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={hrefFor[active] === page.href ? 'page' : undefined}
            className={hrefFor[active] === page.href ? 'is-active' : ''}
          >
            {control.preview === index && (
              <motion.span
                className="places-page-switch__active"
                layoutId="places-active-page"
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 36 }}
              />
            )}
            <span>
              {page.href === hrefFor.placez ? <MapPin aria-hidden="true" /> : page.href === hrefFor.scenez ? <Layers aria-hidden="true" /> : <Mountain aria-hidden="true" />}
              {page.label}
            </span>
          </Link>
        ); })}
      </div>
    </nav>
  );
}
