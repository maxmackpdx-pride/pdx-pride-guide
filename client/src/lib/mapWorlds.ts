import { mapCoordinates } from "./mapCoordinates";
import { normalizeDirectoryName } from "./directoryLogos";

export type MapWorld = "places" | "mizzed" | "gigz" | "giftz" | "sellz";
export type WorldRow = Record<string, any> & { id: number | string };
export type MapBounds = { south: number; north: number; west: number; east: number };
export const WORLD_NAMES: Record<MapWorld, string> = {places:"Placez",mizzed:"Mizzed",gigz:"Gigz",giftz:"Giftz",sellz:"Sellz"};
export const WORLD_DETAIL_KEYS: Record<MapWorld, string> = {places:"place",mizzed:"mizzed",gigz:"gig",giftz:"gift",sellz:"sell"};
export const WORLD_COLORS: Record<MapWorld, string> = {places:"#00FFFF",mizzed:"#FF00CC",gigz:"#8800FF",giftz:"#CCFF00",sellz:"#39FF14"};

export function inMapBounds(point: {lat:number;lng:number}, bounds: MapBounds | null): boolean {
  if (!bounds) return true;
  const longitude = bounds.west <= bounds.east ? point.lng >= bounds.west && point.lng <= bounds.east : point.lng >= bounds.west || point.lng <= bounds.east;
  return longitude && point.lat >= bounds.south && point.lat <= bounds.north;
}
const areaName = (value: unknown) => {
  const name = String(value || "").trim().toLowerCase();
  return ({se:"southeast",ne:"northeast",sw:"southwest",nw:"northwest",n:"north",pearl:"pearl district","old town chinatown":"old town"} as Record<string,string>)[name] || name;
};

/** Public venue coordinates are exact; neighborhood-only posts use a shared,
 * explicitly approximate area marker. Never geocode a private handoff address. */
export function locateWorldRow(row: WorldRow, world: MapWorld, places: WorldRow[], events: WorldRow[]): WorldRow {
  if (world === "gigz" && row.isRemote) return {...row, lat:null, lng:null, locationLabel:"Remote"};
  const point = mapCoordinates(row.lat, row.lng);
  if (point) return {...row, ...point, locationLabel: row.locationLabel || "Mapped location"};
  if (world === "mizzed" || world === "gigz") {
    const event = world === "mizzed" ? events.find(event => event.id === row.eventId) : undefined;
    const eventPoint = mapCoordinates(row.eventLat ?? event?.lat, row.eventLng ?? event?.lng);
    if (eventPoint) return {...row, ...eventPoint, locationLabel: row.eventVenue || event?.venueName || "Event venue"};
    const name = normalizeDirectoryName(String(row.eventVenue || row.venueHint || row.location || ""));
    const place = places.find(place => (row.businessId && Number(place.id) === Number(row.businessId)) || (name && normalizeDirectoryName(place.name) === name));
    const venuePoint = place && mapCoordinates(place.lat,place.lng);
    if (venuePoint) return {...row, ...venuePoint, locationLabel:place.name};
  }
  const area = areaName(row.neighborhood || (world === "gigz" ? row.location : world === "mizzed" ? row.venueHint : ""));
  const candidates = area ? places.filter(place => areaName(place.neighborhood) === area).flatMap(place => {
    const point=mapCoordinates(place.lat,place.lng); return point ? [point] : [];
  }) : [];
  if (candidates.length) {
    const lat=(Math.min(...candidates.map(p=>p.lat))+Math.max(...candidates.map(p=>p.lat)))/2;
    const lng=(Math.min(...candidates.map(p=>p.lng))+Math.max(...candidates.map(p=>p.lng)))/2;
    return {...row,lat,lng,approximate:true,locationLabel:`${row.neighborhood || row.location || row.venueHint} area · approximate`};
  }
  return {...row,lat:null,lng:null,locationLabel:"No mapped location"};
}

export function filterWorldRows(rows: WorldRow[], world: MapWorld, params: URLSearchParams, saved: Set<number> = new Set()): WorldRow[] {
  const get = (key:string) => params.get(`${world}.${key}`) || "";
  const query = get("q").trim().toLowerCase(), type=get("type"), category=get("category"), area=get("area").trim().toLowerCase(), view=get("view");
  const ids=get("ids").split(",").filter(Boolean);
  return rows.filter(row=>{
    if(ids.length && !ids.includes(String(row.id)))return false;
    if (query && ![row.title,row.name,row.description,row.body,row.skills,row.compensation,row.address,row.location,row.neighborhood,row.venueHint,row.eventVenue,row.category,row.type].some(value=>String(value||"").toLowerCase().includes(query))) return false;
    if (area && !String(row.neighborhood || row.location || row.venueHint || "").toLowerCase().includes(area)) return false;
    if (view === "mine" && !row.isMine) return false;
    if (view === "saved" && !saved.has(Number(row.id))) return false;
    if (category && row.category !== category) return false;
    if (world === "places" && get("owned") === "1" && !row.queerOwned) return false;
    if (world === "gigz" && ((type && row.postType !== type) || (get("remote") === "1" && !row.isRemote))) return false;
    if (world === "giftz") {
      const grab = row.postType === "GIFT" && String(row.pickupPreference).toLowerCase().replace(/[ -]/g,"") === "opengrab";
      if (type === "GRAB" ? !grab : type && row.postType !== type) return false;
    }
    if (world === "mizzed") {
      if (type === "EVENT" && !row.eventId || type === "TOWN" && (row.eventId || row.beachId) || type === "ROOSTER" && row.beachId !== "rooster-rock" || type === "SAUVIE" && row.beachId !== "sauvie-island") return false;
    }
    if (world === "sellz") {
      if (get("condition") && row.condition !== get("condition")) return false;
      const price=get("price"), cents=Number(row.priceCents);
      if (price === "UNDER25" && cents >= 2500 || price === "25TO100" && (cents < 2500 || cents > 10000) || price === "OVER100" && cents <= 10000) return false;
    }
    return true;
  }).sort((a,b)=> {
    const sort=get("sort");
    if (sort === "PRICE_LOW") return Number(a.priceCents)-Number(b.priceCents);
    if (sort === "PRICE_HIGH") return Number(b.priceCents)-Number(a.priceCents);
    if (sort === "CLOSING") return (Date.parse(a.closesAt)||Infinity)-(Date.parse(b.closesAt)||Infinity);
    if (world === "places") return Number(Boolean(b.queerOwned))-Number(Boolean(a.queerOwned)) || String(a.name).localeCompare(String(b.name));
    const diff=(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0);
    return sort === "oldest" ? -diff : diff;
  });
}

/** Preserve incoming world bookmarks while making the map their product surface. */
export function legacyWorldMapHref(world:MapWorld, search:string, recordId?:string, hash=""):string {
  const old=new URLSearchParams(search),next=new URLSearchParams();next.set("layer",world);
  const id=recordId||old.get("post")||old.get("id")||old.get("place");
  if(id && /^[1-9]\d*$/.test(id))next.set(WORLD_DETAIL_KEYS[world],id);
  const keys:Record<string,string>={q:"q",type:"type",category:"category",neighborhood:"area",remote:"remote",sort:"sort",condition:"condition",price:"price",view:"view"};
  for(const [key,target] of Object.entries(keys)) {
    const value=old.get(key);if(!value || value==="ALL")continue;
    if(world==="places"&&key==="type")next.set("placeTypes",value);
    else next.set(`${world}.${target}`,key==="view"?value.toLowerCase():value);
  }
  if(old.get("mine")==="1")next.set(`${world}.view`,"mine");
  if(old.has("new")||old.get("compose")==="1"||old.get("add")==="1"||/form|compose/.test(hash))next.set("compose",world);
  return `/map?${next}`;
}

export function readMapCamera(params:URLSearchParams):{center:[number,number];zoom:number;bounds:MapBounds}|null {
  const lat=params.get("lat"),lng=params.get("lng"),z=params.get("zoom");
  if(lat===null||lng===null||z===null)return null;
  const point=mapCoordinates(lat,lng),zoom=Number(z);
  if(!point||!Number.isFinite(zoom)||zoom<10||zoom>17.75)return null;
  return {center:[point.lat,point.lng],zoom,bounds:{south:point.lat,north:point.lat,west:point.lng,east:point.lng}};
}
