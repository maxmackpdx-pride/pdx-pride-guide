import { useId } from "react";
import type { MotifAsset } from "@/lib/designMotifRecipes";

/** Preserve printed hero material; open wire images use luminance for transparent gaps. */
export function LibraryMotifImage({ asset, paint = "currentColor", x = 60, y = 110, width = 280, height = 280 }: {
  asset: MotifAsset;
  paint?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const maskId = `library-motif-${useId().replace(/:/g, "")}`;
  if (asset.kind === "category-hero" && paint === "currentColor") {
    return <g data-library-motif={asset.id}>
      <defs><filter id={maskId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feFlood floodColor="currentColor" result="paper-ink" />
        <feBlend in="SourceGraphic" in2="paper-ink" mode="multiply" />
        <feComposite in2="SourceAlpha" operator="in" />
      </filter></defs>
      <image href={asset.url} crossOrigin="anonymous" x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" filter={`url(#${maskId})`} />
    </g>;
  }
  if (asset.kind === "category-hero") {
    return <g data-library-motif={asset.id}>
      <defs><filter id={maskId} filterUnits="userSpaceOnUse" x={x} y={y} width={width} height={height} colorInterpolationFilters="sRGB">
        <feImage href={asset.url} crossOrigin="anonymous" x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" result="paper-source" />
        <feBlend in="SourceGraphic" in2="paper-source" mode="multiply" />
        <feComposite in2="paper-source" operator="in" />
      </filter></defs>
      <rect x={x} y={y} width={width} height={height} fill={paint} stroke="none" filter={`url(#${maskId})`} />
    </g>;
  }
  return <g data-library-motif={asset.id}>
    <defs><mask id={maskId} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height} style={{ maskType: "luminance" }}>
      <image href={asset.url} crossOrigin="anonymous" x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" />
    </mask></defs>
    <rect x={x} y={y} width={width} height={height} fill={paint} stroke="none" mask={`url(#${maskId})`} />
  </g>;
}
