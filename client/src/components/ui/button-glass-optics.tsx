import { useContext, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { DockMaterialContext } from '@/lib/dockMaterial';
import { GlassInversionBands } from '@/components/ui/glass-inversion-bands';

/** Background-only refraction for a control. Existing borders, fills, labels,
 * icons and blooms remain separate foreground layers. */
export function ButtonGlassOptics() {
  const material = useContext(DockMaterialContext);
  const reduced = useReducedMotion();
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const update = () => setCalm(document.documentElement.matches('.calm-mode,[data-calm="true"]'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-calm'] });
    return () => observer.disconnect();
  }, []);
  return material === 'm3' ? <GlassInversionBands quiet={Boolean(reduced || calm)} variant="button" /> : null;
}

