import { useEffect, useState } from 'react';
import './mobile-glass-lite.css';

/** No scene copies, displacement textures, animation loops or canvas work. */
export function MobileGlassLite() {
  return <>
    <span className="z-mobile-glass-lite" aria-hidden="true" />
    <span className="z-glass__edge" aria-hidden="true" />
    <span className="z-glass__rainbow" aria-hidden="true" />
  </>;
}

export function useMobileGlassViewport() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:959px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width:959px)');
    const update = () => setMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}
