import { createContext, useCallback, Suspense, useContext, useLayoutEffect, useRef, useState } from 'react';
import { Router, useLocation, useSearch } from 'wouter';
import { navigate } from 'wouter/use-browser-location';
import { isMapzRoute, retainedMapSearch, accountSafeMapSearch, type RetainedCamera } from '@/lib/mapRouteRetention';
import { lazyWithReload } from '@/lib/lazyWithReload';
import MapBootLoader from './MapBootLoader';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '@/context/AuthContext';

const MapzPage = lazyWithReload(() => import('@/pages/MapzMapDemo'));
const Activity = createContext(true);
const CameraRecorder = createContext<(camera:RetainedCamera)=>void>(()=>{});
export const useMapzCameraRecorder = () => useContext(CameraRecorder);
const RouteSnapshot = createContext({ path: '/map', search: '' });
export const useMapzActive = () => useContext(Activity);
function useMapLocation(): [string, typeof navigate] { return [useContext(RouteSnapshot).path, navigate]; }
function useMapSearch() { return useContext(RouteSnapshot).search; }

/** Mount only after the first visit; keep one iframe and freeze its routing while away. */
export default function RetainedMapzRoute() {
  const {user,loading:authLoading}=useAuth();
  const [path] = useLocation();
  const search = useSearch();
  const active = isMapzRoute(path);
  const [visited, setVisited] = useState(active);
  const [generation,setGeneration]=useState(0);
  const identity=useRef<{known:boolean;id:number|null}>({known:!authLoading,id:user?.id??null});
  const camera = useRef<RetainedCamera|null>(null);
  const recordCamera = useCallback((view:RetainedCamera)=>{camera.current=view;},[]);
  const snapshot = useRef({ path: '/map', search: '' });
  if (active) snapshot.current = { path, search: retainedMapSearch(search, snapshot.current.search,camera.current) };
  const held = snapshot.current;
  useLayoutEffect(()=>{
    if(authLoading)return;
    const id=user?.id??null;
    if(!identity.current.known){identity.current={known:true,id};return;}
    if(identity.current.id===id)return;
    identity.current.id=id;
    snapshot.current={...snapshot.current,search:accountSafeMapSearch(snapshot.current.search)};
    if(!active)setVisited(false);
    setGeneration(value=>value+1);
    if(active)navigate(`${path}${snapshot.current.search ? '?'+snapshot.current.search : ''}`,{replace:true,state:window.history.state});
  },[authLoading,user?.id,active,path]);
  useLayoutEffect(() => {
    if (!active) return;
    setVisited(true);
    if (!search && held.search) navigate(`${path}?${held.search}`, { replace: true, state: window.history.state });
  }, [active, path, search, held.search]);
  if (!visited && !active) return null;
  return <Activity.Provider value={active}>
    <CameraRecorder.Provider value={recordCamera}><RouteSnapshot.Provider value={held}>
      <div hidden={!active} style={{display:active?undefined:"none"}} aria-hidden={!active || undefined} data-mapz-retained={active ? 'active' : 'paused'}>
        <Router hook={useMapLocation} searchHook={useMapSearch}>
          <ErrorBoundary><Suspense fallback={active ? <MapBootLoader map="mapz" /> : null}><MapzPage key={generation} /></Suspense></ErrorBoundary>
        </Router>
      </div>
    </RouteSnapshot.Provider></CameraRecorder.Provider>
  </Activity.Provider>;
}
