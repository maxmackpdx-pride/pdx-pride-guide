# Blender E3 handoff

`e3-blender-morph.glb` is exported from Tucker's existing
`Mapz-Evolution-Transitions.blend`, also supplied in Desktop/E3-blender-handoff.
The adjacent JSON records source and export hashes. The Blender source is unchanged.
This asset contains actual meshes and shape keys, not rendered sprites.

The adapter is `../../e3-blender-model.js`. Add its custom layer to the existing
MapLibre map, then call `setVenues(rows)` with stable `key`, `coordinates`, `color`,
`stage`, optional `altitude`, `scaleMeters` and `phase`. Stages are mini, waypoint,
compressed, coin, vortex and stack. Numeric stages 0 through 5 interpolate the
same mesh; fractional values animate genuine shape changes. `setMotion` accepts
active elapsed seconds plus reduced/active flags. The host owns animation timing,
visibility and Calm Mode. The default budget is three visible models.

White icons are separate meshes. Rings have subtle translucent color; posters
retain dark translucent surfaces and UVs. Rings and posters hover independently;
particles rise through the three-dimensional cone. The layer shares the map's
canvas and WebGL context.

Claude owns production wiring: venue selection, same-day eligibility, supplied
venue tint (green for the same-day vortex), stage timing, event poster textures,
ring lettering/countdowns and layout. The adapter does not choose the unresolved
near-versus-far vortex policy. Production river-flight does not yet import it.
Poster textures and ring lettering are not implemented in this adapter.

Verification: actual local /map route, pitched Portland map, green single vortex,
magenta double stack and cyan coin as explicit QA placements. No browser errors;
one map canvas. This desktop preview does not establish iOS performance or parity.
The original Blender file remains the editable source for further visual changes.
