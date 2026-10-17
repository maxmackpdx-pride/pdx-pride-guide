import {useLayoutEffect} from 'react';

// Center the visible paper strips between the post type and the fixed logo.
export function useHouzTitleSpacing(cardRef,enabled,text){
  useLayoutEffect(()=>{
    const card=cardRef.current;
    if(!enabled||!card)return;
    const title=card.querySelector('.body h2');
    const kicker=card.querySelector('.kicker');
    const logo=card.querySelector('.board-logo');
    const body=card.querySelector('.body'),price=card.querySelector('.price-copy');
    const neighborhood=card.querySelector('.detail');
    let active=true,frame;
    const measure=()=>{
      if(!active)return;
      const lines=Array.from(title.querySelectorAll('.cut-line'),line=>line.getBoundingClientRect());
      if(!lines.length)return;
      const first=Math.min(...lines.map(line=>line.top));
      const last=Math.max(...lines.map(line=>line.bottom));
      const upper=first-kicker.getBoundingClientRect().bottom;
      const logoBox=logo.getBoundingClientRect();
      const logoHeight=Math.min(logoBox.height,logoBox.width/(logo.naturalWidth/logo.naturalHeight||2));
      // The approved SVG's ink starts at y=100 in its 500-unit viewBox.
      const logoInkTop=logoBox.bottom-logoHeight*.8;
      const lower=logoInkTop-last;
      const scale=card.getBoundingClientRect().height/card.offsetHeight;
      const offset=parseFloat(title.style.getPropertyValue('--houz-title-offset'))||0;
      const next=Math.max(0,offset+(lower-upper)/(2*scale));
      if(Math.abs(next-offset)>.05)title.style.setProperty('--houz-title-offset',`${next}px`);
      // Align the neighborhood's paper top (2px above its text box) with the price paper.
      const neighborhoodTop=(price.getBoundingClientRect().top-body.getBoundingClientRect().top)/scale+2;
      neighborhood.style.setProperty('--neighborhood-top',`${neighborhoodTop}px`);
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)};
    const resize=new ResizeObserver(schedule);
    [title,kicker,logo,price].forEach(node=>resize.observe(node));
    const changes=new MutationObserver(schedule);
    changes.observe(title,{childList:true,subtree:true,characterData:true});
    document.fonts.ready.then(schedule);schedule();
    return()=>{active=false;cancelAnimationFrame(frame);resize.disconnect();changes.disconnect()};
  },[cardRef,enabled,text]);
}
