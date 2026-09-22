import {Redirect,useSearch} from "wouter";
import {legacyWorldMapHref,type MapWorld} from "@/lib/mapWorlds";
/** Server-rendered metadata remains at the old URL; interaction moves into Mapz. */
export default function MapWorldRedirect({world,recordId}:{world:MapWorld;recordId?:string}) {
  const search=useSearch();
  return <Redirect replace to={legacyWorldMapHref(world,search,recordId,window.location.pathname.endsWith("/new")?"compose":window.location.hash)}/>;
}
