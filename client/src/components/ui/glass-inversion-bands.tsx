import { useEffect, useId, useRef } from 'react';
import { glassShapeSample, readGlassRadii } from '@/lib/glassShape';
import { ChromaticLensFilter } from '@/components/ui/chromatic-lens';

/** Shape-aware HTML-scene adapter. A normal CSS/SVG filter (not a
 * backdrop URL filter) refracts an inert, synchronized scene copy. The map
 * follows the host's measured radii and the local normal around its perimeter.
 * Canvas/video/iframes still require a shared scene renderer for production. */
export function GlassInversionBands({ quiet, variant = 'surface' }: { quiet: boolean; variant?: 'surface' | 'button' }) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const host = ref.current;
    const scene = document.querySelector<HTMLElement>('[data-glass-scene]');
    if (!host || !scene || quiet) return;
    const clips = [...host.querySelectorAll<HTMLElement>('[data-inversion-scene-window]')];
    const filter = host.querySelector('filter')!;
    const mapImage = host.querySelector('feImage')!;
    const displacements = host.querySelectorAll('feDisplacementMap');
    const surface = host.querySelector<HTMLElement>('[data-inversion-surface]')!;
    let geometryKey = '';
    let padding = 0;
    const copies: HTMLElement[] = [];
    let frame = 0, dirty = true, disposed = false;
    // A scene can now contain glass buttons. Never recursively clone their
    // optical copies, and never observe our own rendering as a source change.
    const cloneScene = (node: Node): Node | null => {
      if (node instanceof Element && node.matches('.z-glass-inversion')) return null;
      const copy = node.cloneNode(false);
      node.childNodes.forEach(child => { const next = cloneScene(child); if (next) copy.appendChild(next); });
      return copy;
    };
    const rebuild = () => {
      copies.length = 0;
      clips.forEach((clip, index) => {
        const copy = cloneScene(scene) as HTMLElement;
        copy.removeAttribute('data-glass-scene');
        copy.classList.add('z-inversion-scene');
        copy.setAttribute('inert', '');
        copy.setAttribute('aria-hidden', 'true');
        // Copies are pixels for the lens, not additional active glass scenes.
        // Nested backdrop filters would re-sample other copies and multiply GPU work.
        copy.querySelectorAll<HTMLElement>('*').forEach(node => {
          if (node.style) {
            node.style.setProperty('backdrop-filter', 'none', 'important');
            node.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
            node.style.setProperty('animation', 'none', 'important');
          }
        });
        // Preserve local SVG references while preventing duplicate document IDs.
        const ids = new Map<string, string>();
        copy.querySelectorAll('[id]').forEach(node => {
          const old = node.id, next = `inversion-${id}-${index}-${old}`;
          ids.set(old, next); node.id = next;
        });
        copy.querySelectorAll('*').forEach(node => {
          for (const attr of [...node.attributes]) {
            let value = attr.value;
            ids.forEach((next, old) => {
              value = value.replaceAll(`url(#${old})`, `url(#${next})`);
              if (value === `#${old}`) value = `#${next}`;
              if (['for', 'aria-controls', 'aria-labelledby', 'aria-describedby'].includes(attr.name))
                value = value.split(' ').map(token => token === old ? next : token).join(' ');
            });
            if (value !== attr.value) node.setAttribute(attr.name, value);
          }
        });
        // Keep form state visual only. Inert descendants cannot receive focus.
        const originals = [...scene.querySelectorAll<HTMLInputElement>('input')].filter(input => !input.closest('.z-glass-inversion'));
        copy.querySelectorAll<HTMLInputElement>('input').forEach((input, i) => {
          input.checked = originals[i].checked; input.value = originals[i].value;
          input.removeAttribute('name');
        });
        clip.replaceChildren(copy); copies.push(copy);
      });
      dirty = false;
    };
    const paint = () => {
      frame = 0;
      if (disposed) return;
      if (dirty) rebuild();
      const glass = host.getBoundingClientRect(), source = scene.getBoundingClientRect();
      if (!glass.width || !glass.height) return;
      const band = variant === 'button'
        ? Math.min(8, Math.min(glass.width, glass.height) * .14)
        : Math.min(18, Math.min(glass.width, glass.height) * .22);
      const radii = readGlassRadii(getComputedStyle(host), glass.width, glass.height);
      const key = [glass.width, glass.height, ...radii].map(v => v.toFixed(2)).join(',');
      if (key !== geometryKey) {
        geometryKey = key;
        // Overscan supplies the pixels outside the physical rim that the lens
        // samples. The outer surface then clips back to the actual host shape.
        padding = Math.ceil(2 * band + 2);
        const frameWidth = glass.width + padding * 2, frameHeight = glass.height + padding * 2;
        const scale = 2 * padding;
        const ratio = Math.min(1, 400 / frameWidth, window.devicePixelRatio || 1);
        const map = document.createElement('canvas');
        map.width = Math.ceil(frameWidth * ratio); map.height = Math.ceil(frameHeight * ratio);
        const context = map.getContext('2d')!;
        const pixels = context.createImageData(map.width, map.height);
        const mask = document.createElement('canvas');
        mask.width = Math.ceil(glass.width * ratio); mask.height = Math.ceil(glass.height * ratio);
        const maskContext = mask.getContext('2d')!;
        const alpha = maskContext.createImageData(mask.width, mask.height);
        for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
          const px = (x + .5) / map.width * frameWidth - padding - glass.width / 2;
          const py = (y + .5) / map.height * frameHeight - padding - glass.height / 2;
          const sample = glassShapeSample(px, py, glass.width, glass.height, radii, band);
          const offset = (y * map.width + x) * 4;
          pixels.data[offset] = (sample.dx / scale + .5) * 255;
          pixels.data[offset + 1] = (sample.dy / scale + .5) * 255;
          pixels.data[offset + 2] = 128; pixels.data[offset + 3] = 255;
        }
        for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) {
          const localY = (y + .5) / mask.height * glass.height - glass.height / 2;
          const sample = glassShapeSample((x + .5) / mask.width * glass.width - glass.width / 2,
            localY, glass.width, glass.height, radii, band);
          const offset = (y * mask.width + x) * 4;
          const magnitude = Math.hypot(sample.dx, sample.dy);
          const vertical = magnitude ? Math.abs(sample.dy) / magnitude : 0;
          const verticalT = Math.max(0, Math.min(1, (vertical - .35) / .5));
          const buttonEdge = verticalT * verticalT * (3 - 2 * verticalT);
          // The dock already supplies a strong upper fold. Reduce the button's
          // upper copy so the two layers do not form a detached blurred cap.
          const buttonSide = localY < 0 ? .3 : 1;
          alpha.data[offset] = alpha.data[offset + 1] = alpha.data[offset + 2] = 255;
          alpha.data[offset + 3] = sample.alpha * (variant === 'button' ? .42 * buttonEdge * buttonSide : 1) * 255;
        }
        context.putImageData(pixels, 0, 0); maskContext.putImageData(alpha, 0, 0);
        mapImage.setAttribute('href', map.toDataURL());
        // Preserve M3's subtle .4px channel separation, along the curved
        // displacement vector. The foreground brand colors are never sampled.
        displacements.forEach((node, index) => node.setAttribute('scale', String(scale + (index - 1) * .4)));
        filter.setAttribute('width', '100%'); filter.setAttribute('height', '100%');
        surface.style.maskImage = `url(${mask.toDataURL()})`;
        surface.style.webkitMaskImage = surface.style.maskImage;
        clips[0].style.inset = `${-padding}px`;
      }
      const copy = copies[0];
      copy.style.width = `${source.width}px`;
      copy.style.height = `${source.height}px`;
      copy.style.transform = `translate3d(${source.left - glass.left + padding}px,${source.top - glass.top + padding}px,0)`;
      host.dataset.ready = 'true';
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const refresh = () => { dirty = true; schedule(); };
    const mutations = new MutationObserver(records => {
      if (records.some(record => !(record.target instanceof Element ? record.target : record.target.parentElement)?.closest('.z-glass-inversion'))) refresh();
    });
    mutations.observe(scene, { subtree: true, childList: true, characterData: true, attributes: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(host); resize.observe(scene);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    scene.addEventListener('change', refresh);
    scene.addEventListener('load', refresh, true);
    document.fonts.ready.then(() => { if (!disposed) refresh(); });
    paint();
    return () => {
      disposed = true; cancelAnimationFrame(frame); mutations.disconnect(); resize.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      scene.removeEventListener('change', refresh); scene.removeEventListener('load', refresh, true);
      clips.forEach(clip => clip.replaceChildren()); delete host.dataset.ready;
    };
  }, [quiet, id, variant]);
  return <span ref={ref} className="z-glass-inversion" data-variant={variant} aria-hidden="true">
    <ChromaticLensFilter id={`shape-glass-${id}`} />
    <span data-inversion-surface>
      <span data-inversion-scene-window style={{ filter: `url(#shape-glass-${id}) blur(${variant === 'button' ? '.12px' : '.28px'})` }} />
    </span>
  </span>;
}

