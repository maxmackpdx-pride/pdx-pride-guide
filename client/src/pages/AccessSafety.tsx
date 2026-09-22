import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "wouter";

export default function AccessSafety() {
  const [reportOpen, setReportOpen] = useState(false);

  usePageSeo(
    "Access & Safety | Zaylist",
    "What Zaylist listings cover, what to check before you go, and how to take care of each other year-round.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Access & Safety"
        titleAccent="magenta"
        kicker="Before you go"
        lede="A good plan makes room for everyone. Check access, confirm the details, and look out for each other wherever Zaylist takes you."
      />

      <div className="zine-content">
        <ScrollReveal>
          <h2 className="display panel-heading" style={{ marginBottom: 10 }}>What's on each listing</h2>
          <p className="board-copy">
            Where we know it, listings say whether an event is all ages or 21+, free or ticketed, indoors or out. If an organizer told us about ASL interpretation, ADA seating, or accessible flooring, it's on the event page. If it isn't listed, we didn't get an answer, which is not the same as no. Ask the organizer directly.
          </p>

          <h2 className="display panel-heading" style={{ margin: "28px 0 10px" }}>What we can't promise</h2>
          <p className="board-copy">
            We didn't inspect these venues. We're not standing at the door. Times change, doors move, a room that fit last year sold out this year. Confirm anything that would ruin your night to get wrong.
          </p>

          <h2 className="display panel-heading" style={{ margin: "28px 0 10px" }}>Before you head out</h2>
          <p className="board-copy">
            Plan for the weather and the time you’ll be outside. Bring water, comfortable shoes, and the layers or sun protection you need.
          </p>
          <p className="board-copy">
            Check the organizer’s current health and mask guidance before you go.
          </p>
          <p className="board-copy">
            Plan your trip home before you head out, and check current transit schedules if you’re staying late.
          </p>

          <h2 className="display panel-heading" style={{ margin: "28px 0 10px" }}>Take care of each other</h2>
          <p className="board-copy">
            Check on the person sitting down. Walk somebody to their car. If a room turns bad, tell staff, tell the organizer, tell us. That's the whole ask.
          </p>

          <h2 id="community-rules" className="display panel-heading" style={{ margin: "28px 0 10px" }}>Community rules</h2>
          <p className="board-copy">
            Consent is required. Harassment, discrimination, impersonation, doxxing, prohibited items,
            payment scams, and pressure to disclose private information do not belong here. Board posts
            may be removed and accounts may be restricted while a report is reviewed.
          </p>

          <h2 id="block" className="display panel-heading" style={{ margin: "28px 0 10px" }}>Block and step away</h2>
          <p className="board-copy">
            You never owe anyone a reply. Use the Block action on the member or conversation when it is
            available, then report the account if there is harassment, coercion, impersonation, a scam,
            or an immediate safety concern. Blocking ends contact; reporting sends the issue for review.
          </p>
          <p className="board-copy">
            Housing never handles rent or deposits. GIFTZ stays free. GIGZ posters and workers agree on
            duties and compensation directly. MIZZED CONNECTION stays anonymous until both people choose
            otherwise. When something feels wrong, stop the conversation, block the account, and report it.
          </p>

          <div id="report" style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" className="btn-neon magenta pdx-glass-rebind" onClick={() => setReportOpen(true)}>
              Report a problem
            </button>
            <Link href="/contact" className="btn-neon pdx-glass-rebind">
              Contact
            </Link>
          </div>
        </ScrollReveal>
      </div>

      {reportOpen && <PortfolioContactModal onClose={() => setReportOpen(false)} />}
    </div>
  );
}
