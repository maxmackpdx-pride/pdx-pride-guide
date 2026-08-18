import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import { SponsorsPanel } from "@/components/support";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";

export default function Sponsors() {
  const [pitchOpen, setPitchOpen] = useState(false);

  usePageSeo(
    "Sponsors | Zaylist",
    "Local businesses can help keep browsing free. Labeled support and ads  -  never pay-to-rank.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Sponsors"
        titleAccent="lime"
        kicker="Support Zaylist"
        lede="This site runs on one person's nights and weekends and a server bill that shows up whether Pride happened or not. Local businesses can help cover it."
      />

      <div className="zine-content">
        <ScrollReveal>
          <p className="board-copy">
            Here's the deal. Community listings stay free to browse. Support is{" "}
            <strong>labeled</strong>  -  featured posts, ads, and other partner spots as I grow them.
            What you cannot buy: the organic order of the list, burying someone else's night, or my
            silence about who paid. Ranking is not for sale. Trust is the product.
          </p>
          <p className="board-copy">
            Packages will get clearer over time. If your business belongs here, you probably already
            know it  -  write me and say what you had in mind.
          </p>

          <div style={{ marginTop: 28 }}>
            <SponsorsPanel
              card
              kicker="Who we work with"
              onPitch={() => setPitchOpen(true)}
              pitchNote="Goes straight to my Owner Desk on Zaylist, not a personal inbox. Sponsors are reviewed one at a time by a human. Slow, on purpose."
            />
          </div>
        </ScrollReveal>
      </div>

      {pitchOpen && (
        <PortfolioContactModal variant="sponsor" onClose={() => setPitchOpen(false)} />
      )}
    </div>
  );
}
