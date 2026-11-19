import {useCallback,useLayoutEffect,useRef,useSyncExternalStore,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {CardDetails} from '../cards/CardAPI';
import {closeOpenCard} from '../cards/react19CardModel';
import {useModalA11y} from '@/hooks/useModalA11y';
import '../places/InlinePlacesDetails.css';
import './FullscreenPlacezDetails.css';

const PHONE_FRAME = '(max-width: 959px)';
const CHROME = '.site-header, .z-mobile-dock';
const matchesPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE_FRAME).matches;
const serverPhone = () => false;
const observePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_FRAME);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
export const usesMobilePlacezFrame = matchesPhone;

function visibleMidpoint(selector: string, top: number, bottom: number) {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.visibility !== 'hidden' && Number(style.opacity) > 0 &&
        rect.height > 0 && rect.width > 0 && rect.bottom > top && rect.top < bottom) {
      return Math.max(top, Math.min(bottom, rect.top + rect.height / 2));
    }
  }
}

const quiet = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.classList.contains('calm-mode') ||
  document.documentElement.dataset.calm === 'true';
const OPEN = 'translateY(0) perspective(1100px) rotateY(0deg) rotateX(0deg) scale(1)';
const EDGE = 'translateY(46px) perspective(1100px) rotateY(-86deg) rotateX(5deg) scale(.94)';
const FLIP = {duration: 550, easing: 'cubic-bezier(.32,1.24,.36,1)'};

/** Keep desktop anchored in the list; only the directory's phone card covers the chrome. */
export default function FullscreenPlacezDetails({children,label,onClose,mobileFrame = false}:{
  children:(requestClose?: () => void) => ReactNode; label:string; onClose:()=>void; mobileFrame?:boolean;
}) {
  const phone = useSyncExternalStore(observePhone, matchesPhone, serverPhone);
  if (!mobileFrame || !phone) return <CardDetails navigationWidth onClose={() => closeOpenCard(onClose)}>{children()}</CardDetails>;
  return <MobilePlacezFrame label={label} onClose={onClose}>{children}</MobilePlacezFrame>;
}

function MobilePlacezFrame({children,label,onClose}:{
  children:(requestClose: () => void) => ReactNode; label:string; onClose:()=>void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const closing = useRef(false);
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  const cancel = useCallback(() => {
    for (const animation of animations.current) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations.current = [];
  }, []);
  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const node = frame.current;
    if (!node || quiet() || typeof node.animate !== 'function') { latestClose.current(); return; }
    const {transform, opacity} = getComputedStyle(node);
    cancel();
    node.style.pointerEvents = 'none';
    const flip = node.animate([{transform}, {transform: EDGE}], {...FLIP, fill:'forwards'});
    animations.current = [flip, node.animate([{opacity}, {opacity:0}], {duration:300,fill:'forwards'})];
    flip.onfinish = () => latestClose.current();
  }, [cancel]);
  const dialog = useModalA11y({onClose:requestClose});

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    const viewport = window.visualViewport;
    const measure = () => {
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const nav = visibleMidpoint('.site-header', top, bottom) ?? top + 30;
      const dock = visibleMidpoint('.z-mobile-dock', top, bottom) ?? bottom - 38;
      node.style.setProperty('--placez-top', `${Math.max(top, nav)}px`);
      node.style.setProperty('--placez-height', `${Math.max(1, dock - nav)}px`);
    };
    let next = 0;
    const schedule = () => {
      cancelAnimationFrame(next);
      next = requestAnimationFrame(measure);
    };
    measure();
    const chrome = document.querySelectorAll<HTMLElement>(CHROME);
    const resize = new ResizeObserver(schedule);
    const mutation = new MutationObserver(schedule);
    for (const el of chrome) {
      resize.observe(el);
      mutation.observe(el, {attributes:true,attributeFilter:['class','style','data-collapsed']});
      el.addEventListener('transitionend',schedule);
    }
    window.addEventListener('resize',schedule);
    viewport?.addEventListener('resize',schedule);
    viewport?.addEventListener('scroll',schedule);

    if (!quiet() && typeof node.animate === 'function') {
      const flip = node.animate([{transform: EDGE},{transform: OPEN}], FLIP);
      animations.current = [flip, node.animate([{opacity:0},{opacity:1}],{duration:300})];
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const quietChange = () => {
      if (!quiet()) return;
      cancel();
      if (closing.current) latestClose.current();
    };
    preference.addEventListener('change', quietChange);
    const calm = new MutationObserver(quietChange);
    calm.observe(document.documentElement, {attributes:true,attributeFilter:['class','data-calm']});
    return () => {
      cancelAnimationFrame(next);
      cancel();
      closing.current = false;
      resize.disconnect();
      mutation.disconnect();
      calm.disconnect();
      preference.removeEventListener('change',quietChange);
      window.removeEventListener('resize',schedule);
      viewport?.removeEventListener('resize',schedule);
      viewport?.removeEventListener('scroll',schedule);
      for (const el of chrome) el.removeEventListener('transitionend',schedule);
    };
  }, [cancel]);

  return createPortal(<div className="placez-mobile-scrim" onClick={event => {
    if (event.target === event.currentTarget) requestClose();
  }}>
    <div ref={frame} className="placez-mobile-frame">
      <div ref={dialog} className="placez-mobile-dialog" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children(requestClose)}
      </div>
    </div>
  </div>, document.body);
}
