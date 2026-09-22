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
    body: "Send the event link and let me know it needs to come down.",
  },
  {
    title: "Privacy or your account",
    body: "Tell me what you need help with or want removed. Please leave passwords and other sensitive details out of your message.",
  },
  {
    title: "You built something and want to help",
    body: "Find work or offer your skills through Gigz on Mapz. To help build Zaylist, message me here.",
  },
] as const;

export default function Contact() {
  const [contactOpen, setContactOpen] = useState(false);

  usePageSeo(
    "Contact | Zaylist",
    "Ask about a listing, your account, or helping with Zaylist. Messages go to Tucker.",
  );

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="About"
        title="Contact"
        titleAccent="cyan"
        kicker="Say something"
        lede="Send me a correction, a question, or an offer to help. I read every message."
      />

      <div className="zine-content">
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
              Message Tucker
            </Button>
            <p className="board-copy-sm" style={{ margin: 0, color: "var(--text-lo)" }}>
              Your message goes directly to me.
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