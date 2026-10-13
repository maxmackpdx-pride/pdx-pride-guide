import type { CSSProperties } from "react";
import type { AffiliateBrand } from "@/lib/affiliateCards";
import { templateDraft } from "@/lib/adTypes";
import PosterAdCard from "./ads/PosterAdCard";

/** Legacy placements and served ads share the same large-card renderer. */
export default function AffiliatePosterCard({ brand, className = "", style }: {
  brand: AffiliateBrand; className?: string; style?: CSSProperties;
}) {
  return <PosterAdCard ad={templateDraft(brand === "mrs" ? "mrs-poster" : "cockblock-poster")} brand={brand} className={className} style={style} />;
}
