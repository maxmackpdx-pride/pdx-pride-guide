// The parent owns authentication; no session data is copied into the map iframe.
export function createWaypointAccess({requestSignup,onRevoke}){
 let allowed=false,pending=null;
 return {
  run(action,placeId){if(allowed){action();return true;}pending=action;requestSignup(placeId);return false;},
  update(value){allowed=value===true;if(allowed&&pending){const action=pending;pending=null;action();}else if(!allowed)onRevoke();},
  cancel(){pending=null;},
 };
}
export function installWaypointAccess(onRevoke){
 const embedded=parent!==window;
 const gate=createWaypointAccess({onRevoke,requestSignup:placeId=>{
  if(embedded)parent.postMessage({source:'outzide-map',type:'require-auth',placeId},location.origin);
  else {
   const target=new URL('/outzide',/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'https://www.zaylist.com':location.origin);
   target.searchParams.set('signup','1');if(placeId)target.searchParams.set('place',placeId);location.assign(target.href);
  }
 }});
 if(embedded){
  window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='outzide-host')return;
   if(event.data.type==='auth-state')gate.update(event.data.allowed);
   if(event.data.type==='auth-cancel')gate.cancel();
  });
  parent.postMessage({source:'outzide-map',type:'ready'},location.origin);
 }else {
  const ready=fetch('/api/auth/me',{credentials:'include'}).then(r=>r.ok?r.json():null).then(data=>gate.update(Boolean(data?.id))).catch(()=>gate.update(false));
  return {run(action,placeId){ready.then(()=>gate.run(action,placeId));return false;}};
 }
 return gate;
}
