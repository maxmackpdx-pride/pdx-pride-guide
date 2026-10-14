export type OwnMapBoard = 'gigz'|'giftz'|'sellz'|'mizzed'|'houz';
export type BoardMapPlacementPoint = {board:string;postId:number;lat:number;lng:number;expiresAt:string;venueId:number|null};
const labels:Record<OwnMapBoard,string>={gigz:'Gigz',giftz:'Giftz',sellz:'Sellz',mizzed:'Mizzed',houz:'My Hoüz'};
/** Input rows come from authenticated owner endpoints, never discovery filters.
 * Public placements are the authority for visibility, including post status. */
export function ownPlacedMapRows<T extends {id?:number|string}>(sources:Array<{board:OwnMapBoard;rows:T[]}>,points:BoardMapPlacementPoint[],now=Date.now()) {
 const active=new Map(points.filter(point=>Date.parse(point.expiresAt)>now&&Number.isFinite(point.lat)&&Number.isFinite(point.lng)).map(point=>[`${point.board}:${point.postId}`,point]));
 return sources.flatMap(({board,rows})=>rows.flatMap(row=>{
  const mapPoint=active.get(`${board}:${row.id}`);
  return mapPoint?[{...row,isMine:true,_board:labels[board],mapPoint,lat:mapPoint.lat,lng:mapPoint.lng,locationLabel:'Placed by you'}]:[];
 }));
}
/** Never turn unavailable owner data into an authoritative empty state. */
export function ownMapPostingsStatus(queries:Array<{isPending:boolean;isError:boolean}>) {
 return queries.some(query=>query.isError)?'error':queries.some(query=>query.isPending)?'loading':'ready';
}

/** Identify the post rather than repeating its author on every owner row. */
export function ownMapPostingTitle(row:Record<string,unknown>) {
 return String(row.headline || row.title || row.displayName || row.name || "Board post");
}
