import ProductRoadmap from "@/components/ProductRoadmap";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function Next() {
  usePageSeo(
    "What's next | Zaylist",
    "The live Zaylist product and system roadmap: what shipped, what is being built now, the Z/ rebuild, and the path to a durable agent-ready platform.",
  );

  return <ProductRoadmap page />;
}
