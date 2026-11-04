import { useLayoutEffect, useRef, type ButtonHTMLAttributes, type Ref } from 'react';
import { Heart } from 'lucide-react';
import './HeartButton.css';
import './CardHeartButton.css';

/** Shared visual control only. Categories retain their own follow/save behavior. */
export function CardHeartButton({ active, className = '', ref, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; ref?: Ref<HTMLButtonElement> }) {
  const local = useRef<HTMLButtonElement>(null);
  const setRef = (node: HTMLButtonElement | null) => {
    local.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  useLayoutEffect(() => {
    const button=local.current;
    const card=button?.closest<HTMLElement>('[data-card-size="small"]');
    if(!button || !card)return;
    const align=()=>{
      const parent=button.offsetParent as HTMLElement|null;
      if(!parent)return;
      const face=card.getBoundingClientRect(),container=parent.getBoundingClientRect();
      const borderRight=parseFloat(getComputedStyle(parent).borderRightWidth)||0;
      // Absolute positioning begins at the containing block's inner border.
      // Category borders differ; the shared control always sits 6px inside the
      // actual card's OUTER edge, not 6px plus that category's border thickness.
      button.style.setProperty('--card-heart-top',`${face.top+6-container.top-parent.clientTop}px`);
      button.style.setProperty('--card-heart-right',`${container.right-borderRight-face.right+6}px`);
    };
    align();
    const observer=new ResizeObserver(align);observer.observe(card);
    if(button.offsetParent instanceof HTMLElement && button.offsetParent!==card)observer.observe(button.offsetParent);
    return()=>observer.disconnect();
  },[]);
  return <button {...props} ref={setRef} type="button" data-card-heart="true" aria-pressed={active}
    className={`zheart-btn${active ? ' is-hearted' : ''} ${className}`.trim()}>
    <Heart size={18} aria-hidden="true" fill={active ? 'currentColor' : 'none'} />
  </button>;
}
