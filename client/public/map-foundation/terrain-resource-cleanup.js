// Adapter for vendored MapLibre 5.6.2's missing Terrain resource destructor.
// Keep version-gated at installation; reassess when the vendor version changes.
const installed = new WeakSet();
const textureFields = ['_fboCoordsTexture', '_fboDepthTexture', '_coordsTexture', '_emptyDepthTexture', '_emptyDemTexture'];

export function releaseTerrainOwnedResources(terrain, contextLost = false) {
  if (!terrain) return;
  const gl = terrain.painter.context.gl;
  const lost = contextLost || gl.isContextLost();
  const textures = new Set(textureFields.map(key => terrain[key]).filter(Boolean));
  if (!lost) {
    // Framebuffer.destroy deletes its attached color texture. Detach it first,
    // then delete each owned Texture wrapper exactly once below. The framebuffer
    // still owns and deletes its depth renderbuffer.
    if (terrain._fbo) {
      terrain._fbo.colorAttachment.set(null);
      terrain._fbo.destroy();
    }
    for (const texture of textures) texture.destroy();
    for (const mesh of new Set(Object.values(terrain._meshCache || {}))) mesh.destroy();
  }
  // Lost-context GL handles are already invalid. Discard them without GL calls;
  // lazy getters can rebuild if the same Terrain survives style restoration.
  terrain._fbo = null;
  for (const key of textureFields) terrain[key] = null;
  terrain._meshCache = {};
  terrain._demMatrixCache = {};
  // Do not touch source tile DEM textures or the RenderToTexture pool here.
}

export function installTerrainResourceCleanup(map, version) {
  if (version !== '5.6.2' || installed.has(map)) return map;
  installed.add(map);
  const setTerrain = map.setTerrain;
  map.setTerrain = function(options) {
    const oldTerrain = this.terrain;
    const oldPoolOwner = this.painter.renderToTexture;
    try {
      return setTerrain.call(this, options);
    } finally {
      if (oldTerrain && this.terrain !== oldTerrain) {
        releaseTerrainOwnedResources(oldTerrain);
        // Vendor already destroys the pool on null. Direct replacement with a
        // non-null terrain instead overwrites it without destruction.
        if (options && oldTerrain.sourceCache.sourceCache !== this.terrain?.sourceCache.sourceCache) {
          // A replacement on a different source must release the old source's
          // terrain-only flags. Do not reset flags shared with the new Terrain.
          oldTerrain.sourceCache.destruct();
        }
        if (options && oldPoolOwner && this.painter.renderToTexture !== oldPoolOwner) {
          oldPoolOwner.destruct();
        }
      }
    }
  };
  const canvas = map.getCanvas();
  const lost = () => releaseTerrainOwnedResources(map.terrain, true);
  canvas.addEventListener('webglcontextlost', lost);
  const remove = map.remove;
  map.remove = function(...args) {
    // Free owned resources while context remains valid, before vendor removal
    // destroys the painter and loses the context.
    releaseTerrainOwnedResources(this.terrain);
    try { return remove.apply(this, args); }
    finally { canvas.removeEventListener('webglcontextlost', lost); }
  };
  return map;
}
