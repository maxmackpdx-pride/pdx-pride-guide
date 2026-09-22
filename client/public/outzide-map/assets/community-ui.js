const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function faceStackHtml(people=[],total=people.length){
 if(!total)return '';
 return '<span class="face-stack" role="img" aria-label="'+total+' people planning a visit">'+people.slice(0,5).map(p=>{
  const name=p.masked?'Anonymous':p.displayName||p.username||'Visitor';let photo='';
  try{const u=new URL(p.photoUrl);if(!p.masked&&u.protocol==='https:')photo=u.href;}catch{}
  return '<span class="checkin-face" title="'+escape(name)+'"><span>'+escape(p.masked?'•':name.trim().charAt(0).toUpperCase())+'</span>'+(photo?'<img src="'+escape(photo)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'')+'</span>';
 }).join('')+(total>5?'<span class="checkin-face face-overflow">+'+(total-5)+'</span>':'')+'</span>';
}
export function enhanceActivitySelection(form,names){
 const grid=form.querySelector('.browse-activities'),labels=[...grid.children];
 const groups={ 'Explore':['trail','dayuse','atv'], 'On the water':['beach','spring','fishing','boating'], 'Stay outdoors':['camp','watercamp','coastcamp','stay'], 'Winter':['winter']};
 for(const [title,keys] of Object.entries(groups)){const group=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=title;group.append(legend);for(const label of labels){const input=label.querySelector('input');if(keys.includes(input.value)){input.disabled=label.querySelector('small').textContent==='0';group.append(label);}}grid.append(group);}
 const search=document.createElement('input');search.type='search';search.placeholder='Find an activity';search.setAttribute('aria-label','Find an activity');
 const summary=document.createElement('div');summary.className='activity-selection-summary';const count=document.createElement('p');count.setAttribute('aria-live','polite');const chips=document.createElement('div');chips.className='activity-selection-chips';summary.append(count,chips);form.prepend(search,summary);
 const update=()=>{const checked=[...form.querySelectorAll('input[type=checkbox]:checked')];count.textContent=checked.length+' activities selected';chips.replaceChildren();for(const input of checked){const b=document.createElement('button');b.type='button';b.textContent=names[input.value]+' ×';b.setAttribute('aria-label','Remove '+names[input.value]);b.onclick=()=>{input.checked=false;form.dispatchEvent(new Event('change'));input.focus()};chips.append(b);}if(checked.length){const clear=document.createElement('button');clear.type='button';clear.textContent='Clear all';clear.onclick=()=>{checked.forEach(i=>i.checked=false);form.dispatchEvent(new Event('change'));search.focus()};chips.append(clear);}};
 form.addEventListener('change',update);update();
 search.oninput=()=>{for(const label of labels)label.hidden=!label.textContent.toLowerCase().includes(search.value.toLowerCase());for(const group of grid.querySelectorAll('fieldset'))group.hidden=![...group.querySelectorAll('label')].some(l=>!l.hidden);};
 grid.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const inputs=labels.filter(l=>!l.hidden&&!l.querySelector('input').disabled).map(l=>l.querySelector('input'));if(!inputs.length)return;e.preventDefault();const i=inputs.indexOf(document.activeElement);inputs[e.key==='Home'?0:e.key==='End'?inputs.length-1:(i+(e.key==='ArrowDown'?1:-1)+inputs.length)%inputs.length].focus();});
}
export function installMobileDrawer(panel,dismiss,label){
 const mobile=()=>matchMedia('(max-width:760px)').matches;
 if(panel.querySelector('.drawer-handle'))return;
 const handle=document.createElement('button');handle.type='button';handle.className='drawer-handle';handle.setAttribute('aria-label','Close '+label);handle.innerHTML='<span></span>';panel.prepend(handle);
 const scrim=document.createElement('div');scrim.className='mobile-drawer-scrim';scrim.hidden=true;panel.before(scrim);scrim.onclick=()=>dismiss();
 let start=null,offset=0,previous=null,wasOpen=false,suppressClick=false;
 const isOpen=()=>panel.tagName==='DIALOG'?panel.open:!panel.hidden;
 const sync=()=>{const open=isOpen();if(panel.tagName!=='DIALOG'){panel.setAttribute('role',mobile()?'dialog':'region');if(mobile())panel.setAttribute('aria-modal','true');else panel.removeAttribute('aria-modal');}scrim.hidden=!(mobile()&&open);if(open&&!wasOpen){previous=document.activeElement;if(mobile())handle.focus({preventScroll:true});}if(!open&&wasOpen&&previous?.isConnected)previous.focus({preventScroll:true});wasOpen=open;};
 new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['open','hidden']});window.addEventListener('resize',sync);
 handle.onclick=()=>{if(!suppressClick)dismiss();suppressClick=false};
 handle.onpointerdown=e=>{if(!mobile()||e.button!==0)return;start=e.clientY;offset=0;handle.setPointerCapture(e.pointerId);panel.classList.add('drawer-dragging')};
 handle.onpointermove=e=>{if(start===null)return;offset=Math.max(0,e.clientY-start);panel.style.translate='0 '+offset+'px';};
 const finish=e=>{if(start===null)return;start=null;panel.classList.remove('drawer-dragging');panel.style.translate='';suppressClick=offset>8;if(offset>70&&e.type!=='pointercancel')dismiss();};handle.onpointerup=finish;handle.onpointercancel=finish;
 panel.addEventListener('keydown',e=>{if(!mobile()||!isOpen())return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();return;}if(e.key!=='Tab')return;const nodes=[...panel.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}});
 // Native page already locks document scrolling; only the panel body scrolls.
 panel.classList.add('mobile-drawer');sync();
}
