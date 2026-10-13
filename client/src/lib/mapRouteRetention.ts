/** One retained map route, with explicit door/deep links taking precedence. */
export function isMapzRoute(path: string): boolean {
  return /^\/map(?:-demo)?\/?$/.test(path.split('?')[0]);
}

/** A plain Mapz return resumes filters/camera, without reopening a prior composer/card. */
export type RetainedCamera = {center:[number,number];zoom:number;pitch:number;bearing:number};
export function retainedMapSearch(current: string, previous: string, camera?:RetainedCamera|null): string {
  if (current.replace(/^\?/, '')) return current.replace(/^\?/, '');
  const params = new URLSearchParams(previous);
  for (const key of ['event', 'place', 'mizzed', 'spotted', 'gig', 'gift', 'sell', 'sellz', 'houz', 'compose', 'houzCompose']) params.delete(key);
  if(camera && [...camera.center,camera.zoom,camera.pitch,camera.bearing].every(Number.isFinite)) {
    for(const [key,value] of Object.entries({lat:camera.center[0],lng:camera.center[1],zoom:camera.zoom,pitch:camera.pitch,bearing:camera.bearing})) params.set(key,String(value));
  }
  return params.toString();
}

/** Preferences may survive an account change; private cards and account views may not. */
export function accountSafeMapSearch(search:string):string {
  const params=new URLSearchParams(retainedMapSearch('',search));
  params.delete('housingSaved');
  for(const key of ['gigz.view','giftz.view','sellz.view','mizzed.view']) params.delete(key);
  return params.toString();
}
