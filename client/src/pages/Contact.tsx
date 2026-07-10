import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";

const TOPICS = [
  {
    title: "A listing is wrong",
    body: "Tell me which one and what's off. Wrong time and wrong door are the two that ruin somebody's night, so those jump the line.",
  },
  {
    title: "Take my event down",
    body: "Just ask. No form, no explanation needed.",
  },
  {
    title: "Privacy or your account",
    body: "Send a message and say what you want removed. It gets removed.",
  },
  {
    title: "You built something and want to help",
    body: "The gig board is right there, but you can also just say hi.",
  },
] as const;

export default function Contact() {
  const [contactOpen, setContactOpen] = useState(false);

  usePageSeo(
    "Contact — PDX Pride Guide",
    "Reach PDX Pride Guide about listings, privacy, or help. Messages go to the site owner inbox.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Contact"
        titleAccent="cyan"
        kicker="Say something"
        lede="One inbox, one guy, no ticketing system. I read everything. I answer most of it, eventually, usually at a bad hour."
      />

      <div className="zine-content" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <ScrollReveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {TOPICS.map(t => (
              <article key={t.title}>
                <h2 className="display panel-heading" style={{ marginBottom: 8 }}>{t.title}</h2>
                <p className="board-copy-sm" style={{ margin: 0 }}>{t.body}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <Button type="button" variant="neon" accent="pink" size="md" onClick={() => setContactOpen(true)}>
              Message me
            </Button>
            <p className="board-copy-sm" style={{ margin: 0, color: "var(--text-lo)" }}>
              Goes to my Owner Desk on the guide — not a personal email, not the shared admin queue.
            </p>
            <p className="board-copy-sm" style={{ margin: 0, color: "var(--text-lo)" }}>
              Or hit the feedback button at the bottom of any page to report a bug.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {contactOpen && <PortfolioContactModal onClose={() => setContactOpen(false)} />}
    </div>
  );
}