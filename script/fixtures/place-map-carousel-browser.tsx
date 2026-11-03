/** Instrument map lifetime before mounting the unmodified real Directory/mobile fixture. */
import L from 'leaflet';
const stats={created:0,removed:0,active:new Set<L.Map>()};(window as any).mapStats=stats;
L.Map.addInitHook(function(this:L.Map){stats.created++;stats.active.add(this);});
const remove=L.Map.prototype.remove;L.Map.prototype.remove=function(){if(stats.active.delete(this))stats.removed++;return remove.call(this);};
await import('./card-mobile-scroll-browser');
