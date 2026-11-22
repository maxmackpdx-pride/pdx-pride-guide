import { Map as NativeMap } from "maplibre-gl";

const active = new Set<NativeMap>();
const stats = { created: 0, removed: 0, active };
Object.assign(window, { mapStats: stats });

// Map.resize runs during construction, including a Strict Mode mount that
// unmounts before its style loads. Track the same instance through removal.
const resize = NativeMap.prototype.resize;
NativeMap.prototype.resize = function (...args) {
  if (!active.has(this)) {
    active.add(this);
    stats.created++;
    this.once("remove", () => {
      active.delete(this);
      stats.removed++;
    });
  }
  return resize.apply(this, args);
};
