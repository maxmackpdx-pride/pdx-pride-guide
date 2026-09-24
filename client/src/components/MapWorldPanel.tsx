import BrowseToolbar from "./BrowseToolbar";
import BrowseStatus from "./BrowseStatus";
import BoardFollowButton from "./BoardFollowButton";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { mapCoordinates } from "@/lib/mapCoordinates";
import { WORLD_NAMES, inMapBounds, type MapWorld, type WorldRow, type MapBounds } from "@/lib/mapWorlds";

type Props = {world:MapWorld; rows:WorldRow[]; allRows:WorldRow[]; bounds:MapBounds|null; params:URLSearchParams; setParam:(key:string,value:string)=>void; onClearFilters:()=>void; onCreate:()=>void; onOpen:(row:WorldRow,target:Element)=>void; selectedId:number|null; loading:boolean; error:boolean; retry:()=>void; children?:ReactNode};
export default function MapWorldPanel({world,rows,allRows,bounds,params,setParam,onClearFilters,onCreate,onOpen,selectedId,loading,error,retry,children}:Props) {
  const [limit,setLimit]=useState(40);
  const [filtersOpen,setFiltersOpen]=useState(false);
  useEffect(()=>setLimit(40),[world,params.toString()]);
  const get=(key:string)=>params.get(`${world}.${key}`)||"";
  const set=(key:string,value:string)=>setParam(`${world}.${key}`,value);
  const name=WORLD_NAMES[world];
  const applied=[...params.entries()].filter(([key,value])=>key.startsWith(world+".")&&value);
  const select=(key:string,label:string,options:Array<[string,string]>)=><label>{label}<select value={get(key)} onChange={e=>set(key,e.target.value)}>{options.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>;
  const categories=Array.from(new Set([...allRows.map(row=>row.category),get("category")].filter(Boolean))).sort();
  const inView=rows.filter(row=>{const point=mapCoordinates(row.lat,row.lng);return Array.isArray(row._mapPoints) && row._mapPoints.length ? row._mapPoints.some((p:{lat:number;lng:number})=>inMapBounds(p,bounds)) : point && inMapBounds(point,bounds);});
  const unlocated=rows.filter(row=>!mapCoordinates(row.lat,row.lng));
  const renderRows=(items:WorldRow[])=>items.map(row=><button type="button" className="zaydar-layer-row" data-selected={Number(row.id)===selectedId} aria-pressed={Number(row.id)===selectedId} key={row.id} onClick={e=>onOpen(row,e.currentTarget)}>
    <span className="zaydar-layer-row__copy"><strong>{(world === "gigz" ? row.title || row.name : row.name || row.title) || String(row.body || "").slice(0,80)}</strong><small>{row.locationLabel || row.neighborhood || "Mapped location"}{world === "sellz" ? ` · $${(Number(row.priceCents)/100).toFixed(2)}` : ""}</small></span><ChevronRight size={18} aria-hidden="true" />
  </button>);
  return <section className="zaydar-layer-panel" aria-label={`${name} in this map`}>
    <div className="zaydar-layer-panel__heading"><small>In this view</small><h2>{name}</h2></div>
    {(world === "gigz" || world === "giftz" || world === "sellz") && <BoardFollowButton board={world} />}
    <button type="button" className="zaydar-houz-post" onClick={onCreate}><Plus size={16} aria-hidden="true"/> {world==="places"?"Add a place":`Post to ${name}`}</button>
    <BrowseToolbar label={`Search and filter ${name}`} className="zaydar-world-filters">
      <label>Search {name}<input type="search" value={get("q")} onChange={e=>set("q",e.target.value)} placeholder={`Search ${name}`} /></label>
      {world === "gigz" && <button type="button" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(value=>!value)}>{filtersOpen ? "Hide filters" : "More filters"}</button>}
      {(world !== "gigz" || filtersOpen) && <>
      <label>Neighborhood<input value={get("area")} onChange={e=>set("area",e.target.value)} placeholder="All neighborhoods" /></label>
      {world === "places" ? <label><input type="checkbox" checked={get("owned")==="1"} onChange={e=>set("owned",e.target.checked?"1":"")}/> Queer owned</label> : select("view","Show",[["","All posts"],["mine","My posts"],...(world==="sellz"?[["saved","Saved"] as [string,string]]:[])])}
      {world === "gigz" && <>{select("type","Post type",[["","Gigs and talent"],["POSTING_GIG","Hiring"],["LOOKING_FOR_WORK","Available talent"]])}<label><input type="checkbox" checked={get("remote")==="1"} onChange={e=>set("remote",e.target.checked?"1":"")}/> Remote friendly</label></>}
      {world === "mizzed" && select("type","Where",[["","Everywhere"],["EVENT","At an event"],["TOWN","Around town"],["ROOSTER","Rooster Rock"],["SAUVIE","Sauvie Island"]])}
      {world === "giftz" && select("type","Post type",[["","Gifts and requests"],["GIFT","Gift"],["ISO","In search of"],["GRAB","Open grab"]])}
      {(world === "giftz" || world === "sellz") && select("category","Category",[["","All categories"],...categories.map(value=>[value,value] as [string,string])])}
      {world === "sellz" && <>{select("condition","Condition",[["","Any condition"],...["New","Like new","Good","Fair","For parts"].map(value=>[value,value] as [string,string])])}{select("price","Price",[["","Any price"],["UNDER25","Under $25"],["25TO100","$25 to $100"],["OVER100","Over $100"]])}</>}
      {world !== "places" && select("sort","Sort",[["","Newest"],["oldest","Oldest"],...(world==="mizzed"?[["CLOSING","Closing soon"] as [string,string]]:[]),...(world==="sellz"?[["PRICE_LOW","Price: low to high"],["PRICE_HIGH","Price: high to low"]] as Array<[string,string]>:[])])}
      </>}
    </BrowseToolbar>
    {get("ids") && <p className="zaydar-layer-location-note">Showing this waypoint’s posts. <button onClick={()=>set("ids","")}>Show all in view</button></p>}
    {applied.length>0&&<div className="map-applied-filters" aria-label="Applied filters"><button type="button" onClick={onClearFilters}>Clear filters</button>{applied.map(([key,value])=><button key={key} type="button" onClick={()=>setParam(key,"")} aria-label={"Remove "+key.split(".")[1]+" filter"}>{key.endsWith(".ids")?"Selected waypoint":key.endsWith(".owned")?"Queer owned":key.endsWith(".remote")?"Remote friendly":value.replaceAll("_"," ")} ×</button>)}</div>}
    {children}
    {loading ? <p role="status">Loading {name}…</p> : error ? <BrowseStatus error title={`${name} couldn’t load`} description="Your map and filters are still here. Try loading the listings again." onAction={retry} /> : <>
      <p role="status" className="zaydar-layer-location-note">{inView.length} in view{!bounds ? " · waiting for map bounds" : ""}</p>
      <div className="zaydar-layer-list">{renderRows(inView.slice(0,limit))}</div>
      {inView.length>limit && <button onClick={()=>setLimit(n=>n+40)}>Show more ({inView.length-limit})</button>}
      {!inView.length && !unlocated.length && <BrowseStatus title={`No ${name} in this view`} description="Move the map or broaden your filters to see more listings." onAction={applied.length ? onClearFilters : undefined} actionLabel="Clear filters" />}
      {unlocated.length>0 && <details className="zaydar-world-unlocated" open={world === "gigz" ? true : undefined}><summary>{unlocated.length} remote or without a mapped location</summary><p className="zaydar-layer-location-note">These posts cannot be filtered by the map viewport.</p><div className="zaydar-layer-list">{renderRows(unlocated.slice(0,limit))}</div>{unlocated.length>limit && <button onClick={()=>setLimit(n=>n+40)}>Show more</button>}</details>}
    </>}
  </section>;
}
