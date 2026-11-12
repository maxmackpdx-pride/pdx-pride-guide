import { lazy, Suspense } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { NeedzRoom } from "@/components/needz/NeedzRoom";
import "@/components/ui/web-gl-shader.css";

const NeedzBackgroundShader = lazy(() => import("@/components/ui/web-gl-shader").then(({ WebGLShader }) => ({ default: WebGLShader })));

/** /needz route shell. The compiled Decks UI lives in components/needz. */
export default function Needz() {
  usePageSeo(
    "NEEDZ | Zaylist",
    "Food, care, housing help and more for queer and trans Oregon and SW Washington. Pick what you need and flip through real local options one card at a time.",
  );
  return <div className="eb-page eb-page--resources nd-page">
    <Suspense fallback={null}><NeedzBackgroundShader waveSpeed={0.7} lowPower /></Suspense>
    <NeedzRoom />
  </div>;
}
