import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import ScrollReveal from "@/components/ScrollReveal";
import "./About.css";

const IG_URL = "https://www.instagram.com/tucker_pdmax";
const PROFILE_URL = "/u/tucker_pdmax";
const DIGGN_URL = "https://open.spotify.com/search/Digg%27n%20For%20Bones";

const PRODUCTS = [
  { old: "Community calendar", now: "EVENTZ", href: "/events", text: "Queer Portland events on one map and one board." },
  { old: "Local services", now: "PLACEZ", href: "/directory", text: "Queer-owned and queer-safe places, with organic ranking that is not for sale." },
  { old: "Gigs", now: "GIGZ", href: "/pride-work", text: "Work posted by people in the scene, with a name and a face on it." },
  { old: "Free stuff", now: "GIFTZ", href: "/gifting", text: "Give it to someone who needs it instead of leaving it on the curb." },
  { old: "Rooms and shares", now: "THE HAÜZ", href: "/the-hauz", text: "Find a room, or find your people and build a household together." },
  { old: "Missed connections", now: "MIZZED CONNECTION", href: "/spotted", text: "You ask, they accept, then you talk. Nobody gets cold-DMed." },
  { old: "The outdoors", now: "OUTZ", href: "/z/out", text: "Local destinations, live conditions, and the information that helps us get there." },
] as const;

const VALUES = [
  { title: "Free to browse.", text: "No paywall on the list. Tips and labeled sponsors help keep it that way." },
  { title: "Organic ranking is not for sale.", text: "Paid placements are labeled, never disguised as community preference." },
  { title: "Post with a free account.", text: "That is how spam stays out and names stay on." },
  { title: "Your data is not for sale.", text: "Not now, not later, not for a nice offer." },
  { title: "Moderation comes with a reason.", text: "If something comes down, there is a person to talk to." },
  { title: "One person builds this.", text: "Good people help. It is still not a committee." },
] as const;

const FAQ = [
  { q: "Why does this feel like a classifieds board?", a: "Because that is part of what it is: housing, gigs, free stuff, missed connections, a directory, outdoor life, and a calendar on one locally built platform." },
  { q: "How is this different from other event apps?", a: "It is free to browse, run by a person, and built for this city. There is no paying to climb the organic list. Paid placement stays labeled." },
  { q: "How do I list my event?", a: "Make an account, then submit a new event or claim one that is already listed. Verified promoters can publish without waiting in the review line." },
  { q: "Can my business sponsor?", a: "If you are part of the community or already support it, yes. Message Tucker to talk about clearly labeled sponsorship and partner formats." },
] as const;

export default function About() {
  usePageSeo("Why Zaylist exists | About", "Our Portland, all in one place. Learn why Zaylist exists, explore what is built here, meet Tucker, and submit an idea for what comes next.");

  const [contactModal, setContactModal] = useState<"message" | "order" | null>(null);
  const [idea, setIdea] = useState({ name: "", email: "", message: "", website: "" });
  const [ideaStatus, setIdeaStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submitIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIdeaStatus("sending");
    if (idea.website) {
      setIdeaStatus("sent");
      return;
    }
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "IDEA",
          severity: "LOW",
          message: idea.message,
          steps: idea.name ? `Submitted by ${idea.name}` : "Submitted from the About page",
          email: idea.email,
          website: idea.website,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      if (!response.ok) throw new Error("Idea submission failed");
      setIdea({ name: "", email: "", message: "", website: "" });
      setIdeaStatus("sent");
    } catch {
      setIdeaStatus("error");
    }
  };

  return (
    <div className="about-v2 board-page--makeover">
      <section className="about-v2-hero" aria-labelledby="about-title">
        <div className="about-v2-hero__scrim" aria-hidden="true" />
        <div className="about-v2-hero__inner"><div>
          <div className="about-v2-hero__kicker"><span className="about-v2-hero__dot" aria-hidden="true" />About · Built in Portland · for Portland</div>
          <h1 id="about-title" className="about-v2-hero__h1"><span className="about-v2-hero__stat">Our Portland.</span><span className="about-v2-hero__lede">All in one place.</span></h1>
          <div className="about-v2-hero__actions">
            <Link href="/events"><Button as="span" variant="solid" accent="cyan" size="lg">Explore Zaylist</Button></Link>
            <a href="#submit-an-idea"><Button as="span" variant="neon" accent="pink" size="lg">Tell me what is missing</Button></a>
          </div>
        </div></div>
      </section>

      <section className="about-v2-manifesto" aria-labelledby="about-manifesto-title"><ScrollReveal><div className="about-v2__inner">
        <div className="about-v2__kicker about-v2__kicker--pink">What Zaylist is</div>
        <h2 id="about-manifesto-title" className="about-v2-manifesto__h2">Portland&apos;s queer life, <span className="about-v2-manifesto__h2-accent">together.</span></h2>
        <div className="about-v2-manifesto__copy">
          <p>Pride starts now, it ends never. Zaylist brings Portland&apos;s queer events, places, housing, work, free stuff, missed connections, and outdoor life into one community-built home.</p>
          <p>This is for people who want the whole city, not only the sanitized version that makes it through a corporate feed.</p>
        </div>
        <div className="about-v2-manifesto__shout">
          <p><span className="about-v2-manifesto__glitch">Fuck Meta.</span></p>
          <p>Stop censoring our community.<br />Stop pretending our nights only matter once they have been scrubbed clean.</p>
          <p>This app is really gay. This app really is <span className="about-v2-manifesto__glitch">ours.</span></p>
        </div>
      </div></ScrollReveal></section>

      <section className="about-v2-why" aria-labelledby="about-why-title"><ScrollReveal><div className="about-v2__inner">
        <div className="about-v2-why__intro">
          <div className="about-v2-why__heading"><div className="about-v2__kicker about-v2__kicker--lime">Why this exists</div><h2 id="about-why-title" className="about-v2-why__h2">The public square, <span className="about-v2-why__h2-accent">back on our ground.</span></h2></div>
          <div className="about-v2-why__copy">
            <p>Every city used to have one ugly, free page where everything got posted: a room, a gig, a couch to give away, or the guy you locked eyes with and never saw again. It was the closest thing we had to a public square.</p>
            <p>We rebuilt that square inside Facebook and Instagram. Then accounts were switched off, pages disappeared, and queer nights were labeled adult content. That is what happens when the room belongs to somebody else.</p>
            <p className="about-v2-why__turn">So the board is back. Same purpose. Different owner.</p>
          </div>
        </div>
        <div className="about-v2__kicker about-v2__kicker--cyan">What you can do here</div>
        <ul className="about-v2-why__rows">{PRODUCTS.map(product => <li key={product.now} className="about-v2-why__row"><span className="about-v2-why__old">{product.old}</span><span className="about-v2-why__arrow" aria-hidden="true">&rarr;</span><Link href={product.href} className="about-v2-why__now">{product.now}</Link><span className="about-v2-why__text">{product.text}</span></li>)}</ul>
        <div className="about-v2-why__close">
          <h3 className="about-v2-why__sub">Built with the people who use it</h3>
          <p>About once a month I sit down with everything people have sent in. The things that keep coming up get built into the fabric of the site. No algorithm deciding what counts, no score, no test group. A person reads it and then makes the thing.</p>
          <p>You need a name to post, so the spam stays out. Nothing organic is for sale. Your data is not either. If something comes down, you get a reason and a person to talk to.</p>
          <p className="about-v2-why__punch">The roadmap is whatever you keep asking for.</p>
        </div>
      </div></ScrollReveal></section>

      <section className="about-v2-creator" aria-labelledby="about-creator-title"><ScrollReveal delay={30}><div className="about-v2__inner">
        <div className="about-v2__kicker about-v2__kicker--lime">Who&apos;s behind it</div>
        <h2 id="about-creator-title" className="about-v2__title about-v2__title--xl">Built by <span className="hl">Tucker in Portland</span></h2>
        <div className="about-v2-creator__grid">
          <div className="about-v2-creator__photo-col"><div className="about-v2-creator__photo">
            <div className="about-v2-creator__photo-frame"><img src="/about/tucker-portrait.jpg" alt="Tucker in Portland" width={864} height={1152} decoding="async" /></div>
            <div className="about-v2-creator__stickers"><Link href={PROFILE_URL} className="about-v2-creator__pg-sticker">Follow Tucker on Zaylist</Link><a href={IG_URL} target="_blank" rel="noopener noreferrer" className="about-v2-creator__ig-sticker">Follow @tucker_pdmax</a></div>
          </div><div className="about-v2-creator__credits">Artist · Yes Coach · Brand promoter<br />Digg&apos;n For Bones · Former Oregon State Pet</div></div>
          <div className="about-v2-creator__body">
            <p>Hi, I&apos;m Tucker. I run Yes Coach, host LockerRoom at The Eagle, and build things for this scene when nobody else will. No engineering degree. Just every tool I could get my hands on and a stupid number of hours.</p>
            <blockquote className="about-v2-creator__pull"><p>This community keeps each other going. You showed up for me, and this is me doing something back.</p></blockquote>
            <p>I&apos;m between full-time gigs and pouring all of it into this. If you have a role or project that deserves that kind of energy, I&apos;m available.</p>
            <div className="about-v2-work__chips" aria-label="Tucker's work"><span className="about-v2-work__chip">Brand &amp; marketing</span><span className="about-v2-work__chip">Events &amp; community</span><span className="about-v2-work__chip">Platforms &amp; product</span></div>
            <div className="about-v2-creator__actions"><Link href="/resume"><Button as="span" variant="solid" accent="cyan" size="md" arrow>View resume</Button></Link><Button type="button" variant="neon" accent="cyan" size="md" onClick={() => setContactModal("message")}>Work with Tucker</Button></div>
          </div>
        </div>
        <div className="about-v2-projects__list about-v2-creator__projects">
          <a className="about-v2-project" href={DIGGN_URL} target="_blank" rel="noopener noreferrer"><img src="/about/diggn-for-bones.jpg" alt="" width={120} height={120} /><div><div className="about-v2-project__meta">Podcast · Season 3</div><h3 className="about-v2-project__title">Digg&apos;n For Bones</h3><p className="about-v2-project__desc">Produced by Tucker · new episodes on Spotify</p></div><span className="about-v2-project__go">Listen →</span></a>
          <button type="button" className="about-v2-project about-v2-project--button" onClick={() => setContactModal("order")}><img src="/about/disco/card-thumb.jpg" alt="Constrained and Sparkling Bro, shibari disco body sculptures" width={120} height={120} /><div><div className="about-v2-project__meta">Art · Made to order</div><h3 className="about-v2-project__title">Constrained and Sparkling Bro</h3><p className="about-v2-project__desc">Disco bodies in shibari · custom mirror mosaic · made in Portland</p></div><span className="about-v2-project__go">Order →</span></button>
        </div>
      </div></ScrollReveal></section>

      <section className="about-v2-values" aria-labelledby="about-values-title"><ScrollReveal><div className="about-v2__inner"><div className="about-v2__kicker about-v2__kicker--pink">Transparency</div><h2 id="about-values-title" className="about-v2__title" style={{ ["--_c" as string]: "var(--pink)" }}>Values &amp; the <span className="hl">rules</span></h2><div className="about-v2-values__grid">{VALUES.map(item => <div key={item.title} className="about-v2-values__item"><span className="mark" aria-hidden="true">✓</span><span><strong>{item.title}</strong> {item.text}</span></div>)}</div></div></ScrollReveal></section>

      <section className="about-v2-faq" aria-labelledby="about-faq-title"><ScrollReveal><div className="about-v2__inner"><div className="about-v2-faq__grid"><div className="about-v2-faq__heading"><div className="about-v2__kicker about-v2__kicker--cyan">FAQ</div><h2 id="about-faq-title" className="about-v2__title" style={{ ["--_c" as string]: "var(--cyan)" }}>Good questions</h2></div><div className="about-v2-faq__list">{FAQ.map(item => <details key={item.q} className="about-v2-faq__item"><summary>{item.q}<span className="ico" aria-hidden="true">+</span></summary><div className="answer">{item.a}</div></details>)}</div></div></div></ScrollReveal></section>

      <section id="submit-an-idea" className="about-v2-ideas" aria-labelledby="about-ideas-title"><ScrollReveal><div className="about-v2__inner about-v2-ideas__grid">
        <div className="about-v2-ideas__intro"><div className="about-v2__kicker about-v2__kicker--lime">Help shape Zaylist</div><h2 id="about-ideas-title" className="about-v2__title" style={{ ["--_c" as string]: "var(--lime)" }}>Tell me what&apos;s <span className="hl">missing.</span></h2><p>Need a feature, a board, a better flow, or something Portland does not have yet? Send the idea here. The requests that keep coming up shape what gets built next.</p><Link href="/events"><Button as="span" variant="solid" accent="lime" size="lg" arrow>Explore Zaylist</Button></Link></div>
        {ideaStatus === "sent" ? <div className="about-v2-ideas__sent" role="status"><strong>Idea received.</strong><span>Thank you for helping build what Portland needs next.</span><Button type="button" variant="neon" accent="lime" size="md" onClick={() => setIdeaStatus("idle")}>Send another idea</Button></div> :
          <form className="about-v2-ideas__form pdx-glass-rebind" onSubmit={submitIdea}>
            <label><span>Your name <small>optional</small></span><input value={idea.name} onChange={event => setIdea(current => ({ ...current, name: event.target.value }))} autoComplete="name" /></label>
            <label><span>Email <small>optional</small></span><input type="email" value={idea.email} onChange={event => setIdea(current => ({ ...current, email: event.target.value }))} autoComplete="email" /></label>
            <label className="about-v2-ideas__message"><span>What should Zaylist add or make better?</span><textarea required rows={5} value={idea.message} onChange={event => setIdea(current => ({ ...current, message: event.target.value }))} /></label>
            <label className="about-v2-ideas__trap" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={idea.website} onChange={event => setIdea(current => ({ ...current, website: event.target.value }))} /></label>
            <Button type="submit" variant="neon" accent="lime" size="md" disabled={ideaStatus === "sending"}>{ideaStatus === "sending" ? "Sending..." : "Submit idea"}</Button>
            {ideaStatus === "error" && <p className="about-v2-ideas__error" role="alert">That did not send. Please try again.</p>}
          </form>}
      </div></ScrollReveal></section>

      <hr className="pdx-rainbow-rule about-v2-seam" aria-hidden="true" />
      <section className="about-v2-close"><div className="about-v2-close__row"><span>Take care of each other.</span><span>zaylist.com</span></div></section>
      {contactModal && <PortfolioContactModal variant={contactModal} onClose={() => setContactModal(null)} />}
    </div>
  );
}
