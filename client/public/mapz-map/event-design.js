// Each event gets one of the approved hologram designs, chosen at random but stable:
// the same event on the same day always gets the same design, and a new date re-rolls it.
export const EVENT_DESIGNS=[
 'H1-Ring-Merge','H2-Rubik-Snap','H3-Gear-Mesh','H4-Saturn-Dock','H5-Totem','H6-Brick-Stack',
 'H7-DNA-Zip','H8-Unfold-Clasp','E1-Glass-Tube','E2-Halo-Link','E3-Vortex','E3c-Compressed'];

// Silhouette the live card renderer can draw. Venue color stays on the beam.
// puck = E3c, totem = H5, tube = E1. The other nine use their own outline.
export const DESIGN_LAYOUT={
 'H1-Ring-Merge':'ring',
 'H2-Rubik-Snap':'stack',
 'H3-Gear-Mesh':'gear',
 'H4-Saturn-Dock':'saturn',
 'H5-Totem':'totem',
 'H6-Brick-Stack':'brick',
 'H7-DNA-Zip':'dna',
 'H8-Unfold-Clasp':'clasp',
 'E1-Glass-Tube':'tube',
 'E2-Halo-Link':'halo',
 'E3-Vortex':'vortex',
 'E3c-Compressed':'puck',
};

// Local calendar day for an event start, e.g. '2026-10-29' (Portland time).
export function eventDayKey(startsAtMs){
 return new Date(startsAtMs).toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
}

// 32-bit FNV-1a over the event key and day, so the pick is deterministic.
function fnv1a(text){
 let h=0x811c9dc5;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
 return h>>>0;
}

export function eventDesignFor(eventKey,startsAtMs){
 return EVENT_DESIGNS[fnv1a(`${eventKey}|${eventDayKey(startsAtMs)}`)%EVENT_DESIGNS.length];
}

export function hologramLayoutForDesign(design){
 return DESIGN_LAYOUT[design]||'puck';
}
