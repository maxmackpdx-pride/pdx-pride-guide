import { useContext } from 'react';
import { DockMaterialContext } from '@/lib/dockMaterial';

/** Marks a control as a shape in the parent's shared refraction surface.
 * One scene copy per navigation bar keeps mobile memory bounded. */
export function ButtonGlassOptics() {
  const material = useContext(DockMaterialContext);
  return material === 'm3' ? <span className="z-button-optics" aria-hidden="true" /> : null;
}
