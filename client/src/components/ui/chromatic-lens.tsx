/** Adapted from the supplied ChromaticLensEffect's directional RGB sampling.
 * This React adapter filters a synchronized HTML scene instead of requiring
 * an image texture or Framer editor runtime. Geometry and falloff come from
 * glassShape.ts; no cursor lens, tint, swirl or wobble touches the controls.
 * Parent renderer updates the displacement texture and pixel-space scales.
 */
export function ChromaticLensFilter({ id }: { id: string }) {
  return <svg width="0" height="0" className="z-filter-defs" aria-hidden="true" focusable="false"><defs>
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="shape-map" />
      <feDisplacementMap in="SourceGraphic" in2="shape-map" xChannelSelector="R" yChannelSelector="G" scale="1" result="red-sample" />
      <feColorMatrix in="red-sample" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
      <feDisplacementMap in="SourceGraphic" in2="shape-map" xChannelSelector="R" yChannelSelector="G" scale="1" result="green-sample" />
      <feColorMatrix in="green-sample" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
      <feDisplacementMap in="SourceGraphic" in2="shape-map" xChannelSelector="R" yChannelSelector="G" scale="1" result="blue-sample" />
      <feColorMatrix in="blue-sample" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
      <feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="red-green" />
      <feComposite in="red-green" in2="blue" operator="arithmetic" k2="1" k3="1" />
    </filter>
  </defs></svg>;
}

