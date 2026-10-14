import { useState } from "react";
import BoardMapPicker, {type BoardMapPoint, type BoardMapVenue} from "./board/BoardMapPicker";
export type { BoardMapPoint } from "./board/BoardMapPicker";
/** Location is a per-post choice; never request device location on mount. */
export default function BoardMapLocationSetting({value,onChange,venue,housing=false}: {housing?:boolean;value:BoardMapPoint|null;onChange:(p:BoardMapPoint|null)=>void;venue?:BoardMapVenue|null}) {
 const [open,setOpen]=useState(false);
 return <fieldset className="span board-map-setting"><legend>On Mapz (optional)</legend>
  <p>{value?`Pin selected${value.venueId && venue?` beside ${venue.name}`:""} for ${value.days || 7} days. It appears when you publish.`:"Add a public pin when you publish this post. A nearby corner works well."}</p>
  <button type="button" onClick={()=>setOpen(true)}>{value?"Edit placement":"Place a pin"}</button>
  {value && <button type="button" onClick={()=>onChange(null)}>Remove pin</button>}
  {open && <BoardMapPicker confirmLabel="Use this spot" housing={housing} value={value} venue={venue} onCancel={()=>setOpen(false)} onConfirm={p=>{onChange(p);setOpen(false);}}/>}
 </fieldset>;
}
