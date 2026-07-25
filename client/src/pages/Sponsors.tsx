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
    "Local businesses can help keep Zaylist free. Sponsorship is support, not pay-to-rank.",
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

      <div className="zine-content" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <ScrollReveal>
          <p className="board-copy">
            Here's the deal. You get a spot on the site and a thank you that means something, because people trust this list. You do not get to move your event up the list, bury somebody else's, or put a logo on the parade. Nobody can buy that. It isn't a pricing thing, it just isn't for sale.
          </p>
          <p className="board-copy">
            If your business belongs here, you probably already know it. Write to me and say what you had in mind.
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
