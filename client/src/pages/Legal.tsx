import { useState } from "react";
import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import ScrollReveal from "@/components/ScrollReveal";
import { Shield, FileText, Lock, Users } from "lucide-react";
import {
  COMMUNITY_STANDARDS_BLOCKS,
  COMMUNITY_STANDARDS_VERSION,
  LEGAL_SUMMARY_BLOCKS,
} from "@shared/communityStandards";

export default function Legal() {
  const [contactOpen, setContactOpen] = useState(false);

  usePageSeo(
    "Legal | Zaylist",
    "Terms of use, privacy policy, and Community Standards for Zaylist.",
  );

  return (
    <div className="zine-page about-page board-page">
      <PageHero
        flush
        kicker="Legal"
        titleLine1="TERMS &"
        titleLine2="STANDARDS"
        accent="cyan"
        lede="How Zaylist works, what we collect, and the Community Standards everyone agrees to."
        bgImage="/motifs/hero-about.png"
        bgPosition="40% center"
        actions={
          <>
            <Link href="/about">
              <Button as="span" variant="solid">
                About the guide
              </Button>
            </Link>
            <Button type="button" accent="cyan" onClick={() => setContactOpen(true)}>
              Contact
            </Button>
          </>
        }
      />

      <ScrollReveal>
        <section className="about-mission board-how diag" style={{ paddingTop: 48 }}>
          <span className="board-sticker board-sticker--cyan">
            Community Standards v{COMMUNITY_STANDARDS_VERSION}
          </span>
          <h2 className="display section-heading">LEGAL & COMMUNITY</h2>
          <p className="board-copy">
            Plain-language policies for a community-run Pride directory. Not legal advice. Just how we
            operate. Everyone who uses the site is asked to agree to these standards.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="board-how" style={{ paddingTop: 8, paddingBottom: 24 }}>
          <h2 className="display section-heading" style={{ fontSize: "1.5rem" }}>
            COMMUNITY STANDARDS
          </h2>
          <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 28 }}>
            {COMMUNITY_STANDARDS_BLOCKS.map((block) => (
              <article
                key={block.heading}
                className="about-mission-card about-mission-card--magenta"
                style={{ padding: "20px 22px" }}
              >
                <div className="about-mission-card__icon" aria-hidden="true">
                  <Users size={18} />
                </div>
                <h3 className="display panel-heading">{block.heading}</h3>
                {block.paragraphs?.map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="board-copy"
                    style={{ marginBottom: 10, fontSize: "0.95rem" }}
                  >
                    {p}
                  </p>
                ))}
                {block.bullets && block.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: "var(--text-meta)",
                      fontSize: "0.92rem",
                      lineHeight: 1.65,
                    }}
                  >
                    {block.bullets.map((item) => (
                      <li key={item} style={{ marginBottom: 8 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="about-mission board-how" style={{ paddingTop: 8, paddingBottom: 48 }}>
          <h2 className="display section-heading" style={{ fontSize: "1.5rem" }}>
            TERMS & PRIVACY
          </h2>
          <div className="about-mission-grid">
            {LEGAL_SUMMARY_BLOCKS.map((section) => (
              <article
                key={section.heading}
                className={`about-mission-card about-mission-card--${
                  section.heading.startsWith("Privacy") ? "lime" : "cyan"
                }`}
              >
                <div className="about-mission-card__icon" aria-hidden="true">
                  {section.heading.startsWith("Privacy") ? <Lock size={18} /> : <FileText size={18} />}
                </div>
                <h3 className="display panel-heading">{section.heading}</h3>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    color: "var(--text-meta)",
                    fontSize: "0.92rem",
                    lineHeight: 1.65,
                  }}
                >
                  {section.bullets?.map((item) => (
                    <li key={item} style={{ marginBottom: 8 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            <article className="about-mission-card about-mission-card--orange">
              <div className="about-mission-card__icon" aria-hidden="true">
                <Shield size={18} />
              </div>
              <h3 className="display panel-heading">Disclaimer</h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "var(--text-meta)",
                  fontSize: "0.92rem",
                  lineHeight: 1.65,
                }}
              >
                <li style={{ marginBottom: 8 }}>
                  Zaylist is independently run and is not affiliated with Pride Northwest unless a
                  listing says otherwise.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Event times, prices, and policies can change. Always confirm with the organizer.
                </li>
                <li style={{ marginBottom: 8 }}>
                  This site is provided as-is without warranties; use at your own discretion.
                </li>
              </ul>
            </article>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="board-how" style={{ paddingBottom: 64 }}>
          <p className="board-copy" style={{ maxWidth: 640 }}>
            Questions about a listing, your account, or a report?{" "}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              style={{
                color: "var(--neon-cyan)",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Use the contact form
            </button>{" "}
            or hit the feedback button in the site footer.
          </p>
        </section>
      </ScrollReveal>

      {contactOpen && <PortfolioContactModal onClose={() => setContactOpen(false)} />}
    </div>
  );
}
