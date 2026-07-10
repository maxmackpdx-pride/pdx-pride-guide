import PageHeader from "@/components/PageHeader";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";

const CONTACT_EMAIL = "hello.tuckercasey@gmail.com";

export default function Sponsors() {
  usePageSeo(
    "Sponsors | PDX Pride Guide",
    "Local businesses can help keep PDX Pride Guide free. Sponsorship is support, not pay-to-rank.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Sponsors"
        titleAccent="lime"
        kicker="Support the guide"
        lede="This site runs on one person's nights and weekends and a server bill that shows up whether Pride happened or not. Local businesses can help cover it."
      />

      <div className="zine-content" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <ScrollReveal>
          <p className="board-copy">
            Here's the deal. You get a spot on the site and a thank you that means something, because people trust this guide. You do not get to move your event up the list, bury somebody else's, or put a logo on the parade. Nobody can buy that. It isn't a pricing thing, it just isn't for sale.
          </p>
          <p className="board-copy">
            If your business belongs here, you probably already know it. Write to me and say what you had in mind.
          </p>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <a className="btn-neon solid" href={`mailto:${CONTACT_EMAIL}?subject=Sponsor%20PDX%20Pride%20Guide`}>
              Email about sponsoring
            </a>
            <p className="board-copy-sm" style={{ margin: 0 }}>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--lime)" }}>{CONTACT_EMAIL}</a>
            </p>
            <p className="board-copy-sm" style={{ margin: 0, color: "var(--text-lo)" }}>
              Sponsors are reviewed one at a time by a human. Slow, on purpose.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
