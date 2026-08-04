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
    "What Zaylist listings cover, what we can't promise, and how to take care of each other during Pride week.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Access & Safety"
        titleAccent="magenta"
        kicker="Before you go"
        lede="Six blocks of people, noise, and heat. Plan for access, water, and each other."
      />

      <div className="zine-content" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <ScrollReveal>
          <h2 className="display panel-heading" style={{ marginBottom: 10 }}>What's on each listing</h2>
          <p className="board-copy">
            Where we know it, listings say whether an event is all ages or 21+, free or ticketed, indoors or out. If an organizer told us about ASL interpretation, ADA seating, or accessible flooring, it's on the event page. If it isn't listed, we didn't get an answer, which is not the same as no. Ask the organizer directly.
          </p>

          <h2 className="display panel-heading" style={{ margin: "28px 0 10px" }}>What we can't promise</h2>
          <p className="board-copy">
            We didn't inspect these venues. We're not standing at the door. Times change, doors move, a room that fit last year sold out this year. Confirm anything that would ruin your night to get wrong.
          </p>

          <h2 className="display panel-heading" style={{ margin: "28px 0 10px" }}>Getting through the week</h2>
          <p className="board-copy">
            Water is not a personality trait but it is a strategy. July in Portland gets hot and the pavement downtown gets hotter. Sunscreen, a hat, shoes you can stand in for six hours.
          </p>
          <p className="board-copy">
            Masks are welcome at every event on this site, and some organizers ask for them. Nobody here will look at you funny.
          </p>
          <p className="board-copy">
            Know how you're getting home before you need to know. MAX runs late but not all night.
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
            Housing never handles rent or deposits. GifZ stays free. Gigz posters and workers agree on
            duties and compensation directly. Mizzed Connection stays anonymous until both people choose
            otherwise. When something feels wrong, stop the conversation, block the account, and report it.
          </p>

          <div id="report" style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" className="btn-neon magenta" onClick={() => setReportOpen(true)}>
              Report a problem
            </button>
            <Link href="/contact" className="btn-neon">
              Contact
            </Link>
          </div>
        </ScrollReveal>
      </div>

      {reportOpen && <PortfolioContactModal onClose={() => setReportOpen(false)} />}
    </div>
  );
}
