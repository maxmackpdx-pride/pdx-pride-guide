import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import PortfolioContactModal from "@/components/PortfolioContactModal";
import "./Resume.css";

const MARQUEE = [
  "Open for business",
  "Collaborative projects",
  "12+ Years in Sales",
  "Top 10 Nationwide",
  "Event Producer",
  "Portland, OR",
  "Let's Talk",
] as const;

const WINS = [
  {
    num: "Top 10",
    label: "Sales advisor nationwide, multiple consecutive quarters",
    accent: "lime",
  },
  {
    num: "Top 10%",
    label: "Sales advisors nationwide",
    accent: "cyan",
  },
  {
    num: "2",
    label: "B2B sales teams led across Oregon & Alaska",
    accent: "magenta",
  },
  {
    num: "230%",
    label: "Event revenue growth, 2023 to 2024",
    accent: "orange",
  },
  {
    num: "8,000",
    label: "Visitors in 30 days to a platform I built",
    accent: "green",
  },
  {
    num: "$32K",
    label: "Netted on a private destination event",
    accent: "violet",
  },
] as const;

type TapeTone = "lime" | "cyan" | "magenta" | "red" | "blue" | "violet" | "green" | "orange";

type Experience = {
  tape: string;
  tone: TapeTone;
  title: string;
  dates: string;
  role: string;
  bullets: string[];
};

const EXPERIENCE: Experience[] = [
  {
    tape: "Independent Event Producer",
    tone: "lime",
    title: "Founder & Contractor",
    dates: "08/2022 to Present",
    role: "Portland, OR",
    bullets: [
      "Produce recurring live events and brand activations for a Portland venue partner: talent booking, staffing, vendors, budgeting, ticketing, and on-site operations.",
      "Grew annual event revenue 230% by increasing repeat attendance, improving digital promotion, and tightening event operations.",
      "Founded and operate a self-serve local event discovery platform (submission, moderation, and map-based discovery) that drew 8,000 visitors in 30 days for a single weekend event.",
      "Produced a private destination event in Puerto Vallarta for 13 guests: budgeting, travel logistics, vendor coordination, and on-site guest experience. Netted $32K.",
    ],
  },
  {
    tape: "A Tech Start Up",
    tone: "cyan",
    title: "Field Sales Advisor",
    dates: "03/2024 to 11/2025",
    role: "Portland, OR",
    bullets: [
      "Ranked among the top 10 sales advisors nationwide for multiple consecutive quarters at a high-volume Service & Sales location, with one of the strongest close rates in the region.",
      "Led daily floor execution in an appointment-driven environment: customer flow, time pressure, and service quality during peak demand.",
      "Built and managed pipelines through consultations, demos, and relationship-based follow-up to convert leads into orders.",
      "Coached peers nationwide on closing approach and floor presence; supported new store openings with training and process implementation.",
    ],
  },
  {
    tape: "A Tech Start Up",
    tone: "cyan",
    title: "Senior Field Specialist, Delivery",
    dates: "01/2022 to 03/2024",
    role: "Portland, OR",
    bullets: [
      "Launched the Portland market as part of the original team, adapting across delivery, operations, and customer-facing roles.",
      "Delivered the flagship truck and SUV with full DOT compliance and white-glove service; supported service center opening, logistics, and peer training.",
    ],
  },
  {
    tape: "A Large Tech Company",
    tone: "magenta",
    title: "Business Area Manager & Sales Expert",
    dates: "10/2019 to 09/2021",
    role: "Portland, OR",
    bullets: [
      "Oversaw two B2B sales teams across Oregon and Alaska during the pandemic, exceeding sales goals while balancing remote and in-store leadership.",
      "Expanded footprint with small and mid-market clients through tailored technology solutions.",
      "Designed and delivered virtual and in-person training for business clients and internal teams.",
    ],
  },
  {
    tape: "A Very Successful Tech Start Up",
    tone: "red",
    title: "Lead Sales Advisor",
    dates: "11/2017 to 10/2019",
    role: "Portland, OR",
    bullets: [
      "Ranked in the top 10% of sales advisors nationwide by consistently exceeding targets.",
      "Closed high-value deals through consultations and demos; mentored new advisors and improved showroom performance.",
    ],
  },
  {
    tape: "A Car Vending Machine Startup",
    tone: "blue",
    title: "Field Operations Manager",
    dates: "09/2021 to 01/2022",
    role: "Portland, OR",
    bullets: [
      "Directed daily operations for a 10-person field team managing fleet logistics and vehicle delivery.",
      "Trained and onboarded staff to strengthen safety and quality control; streamlined workflows to cut delays while maintaining compliance.",
    ],
  },
];

const EARLIER = [
  {
    tape: "Tech Company Retail",
    tone: "orange" as TapeTone,
    title: "General Manager",
    dates: "05/2015 to 04/2017",
    body: "Ran a high-volume authorized-reseller store: hiring, coaching, inventory, and repair operations while exceeding revenue targets.",
  },
  {
    tape: "A Very Successful Tech Start Up",
    tone: "red" as TapeTone,
    title: "Customer Experience Specialist",
    dates: "06/2017 to 11/2017",
    body: "Supported launch of a new Scottsdale location; generated leads through showroom events and managed pipelines in Salesforce.",
  },
  {
    tape: "A Large Tech Company",
    tone: "magenta" as TapeTone,
    title: "Retail & Business Sales Specialist",
    dates: "08/2010 to 05/2015",
    body: "Advanced from retail to B2B sales, opened a new store, and ranked among top performers for revenue and service.",
  },
  {
    tape: "Popular Brand",
    tone: "violet" as TapeTone,
    title: "Organizational Leadership Intern",
    dates: "01/2010",
    body: "Completed the Popular Brand College Program combining leadership training with hospitality and service operations.",
  },
] as const;

const SKILLS = [
  "Sales Leadership",
  "Coaching",
  "Retail Operations",
  "Pipeline Management",
  "Market Launches",
  "Brand Activation",
  "Vendor Management",
] as const;

const TOOLS = [
  "Salesforce",
  "Google Workspace",
  "Workday",
  "Slack",
  "Meta Business Suite",
  "Adobe Express",
  "Squarespace",
  "AI Tools",
] as const;

function Tape({
  children,
  tone,
  className = "",
}: {
  children: ReactNode;
  tone: TapeTone;
  className?: string;
}) {
  return (
    <span className={`resume-tape resume-tape--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}

export default function Resume() {
  usePageSeo(
    "Tucker Max Resume | Zaylist",
    "Sales and operations leader with 12+ years in big tech and EV brands, now producing live events and building community platforms in Portland.",
  );

  const [showContact, setShowContact] = useState(false);
  const marqueeItems = [...MARQUEE, ...MARQUEE];

  return (
    <div className="resume-page">
      <header className="resume-hero">
        <div className="resume-seam" aria-hidden="true" />
        <div className="resume-hero__inner">
          <div className="resume-hero__copy">
            <div className="resume-kicker">Sales & Ops · Live Events · Portland</div>
            <h1 className="resume-hero__name">Tucker Max</h1>
            <p className="resume-hero__lede">
              Sales and operations leader with 12+ years moving product for big tech and EV brands,
              now producing live events and building community platforms across Portland.
            </p>
            <div className="resume-hero__actions">
              <Button
                type="button"
                variant="solid"
                accent="pink"
                size="lg"
                onClick={() => setShowContact(true)}
              >
                Message Me For Complete Resume
              </Button>
              <span className="resume-open-badge">
                <span className="resume-open-badge__dot" aria-hidden="true" />
                Open for business
              </span>
            </div>
          </div>
          <div className="resume-hero__mark" aria-hidden="true">
            <div className="resume-tm">TM</div>
            <span className="resume-hire-sticker">Let&apos;s collab</span>
          </div>
        </div>
      </header>

      <div className="resume-marquee" aria-hidden="true">
        <div className="resume-marquee__track">
          {marqueeItems.map((item, i) => (
            <span key={`${item}-${i}`} className="resume-marquee__item">
              {item}
              <span className="resume-marquee__star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <main className="resume-main">
        <section className="resume-wins" aria-labelledby="resume-wins-title">
          <div className="resume-kicker resume-kicker--lime">The numbers</div>
          <h2 id="resume-wins-title" className="resume-h2">
            Selected wins
          </h2>
          <div className="resume-wins__grid">
            {WINS.map(win => (
              <div key={win.num + win.label} className={`resume-stat resume-stat--${win.accent}`}>
                <div className="resume-stat__num">{win.num}</div>
                <div className="resume-stat__label">{win.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="resume-seam resume-seam--block" aria-hidden="true" />

        <section className="resume-xp" aria-labelledby="resume-xp-title">
          <div className="resume-kicker resume-kicker--cyan">Where I&apos;ve sold and shipped</div>
          <h2 id="resume-xp-title" className="resume-h2">
            Experience
          </h2>
          <div className="resume-xp__list">
            {EXPERIENCE.map((job, i) => (
              <article key={`${job.tape}-${job.dates}-${i}`} className={`resume-xp__card resume-xp__card--${job.tone}`}>
                <div className="resume-xp__head">
                  <Tape tone={job.tone}>{job.tape}</Tape>
                  <span className="resume-xp__dates">{job.dates}</span>
                </div>
                <div className="resume-xp__role">
                  {job.title} · {job.role}
                </div>
                <ul className="resume-xp__bullets">
                  {job.bullets.map(b => (
                    <li key={b.slice(0, 48)}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="resume-seam resume-seam--block" aria-hidden="true" />

        <section className="resume-earlier" aria-labelledby="resume-earlier-title">
          <div className="resume-kicker resume-kicker--orange">Before all that</div>
          <h2 id="resume-earlier-title" className="resume-h2">
            Earlier experience
          </h2>
          <div className="resume-earlier__list">
            {EARLIER.map(row => (
              <p key={row.tape + row.dates} className="resume-earlier__row">
                <Tape tone={row.tone} className="resume-tape--inline">
                  {row.tape}
                </Tape>{" "}
                <strong>{row.title}</strong>{" "}
                <span className="resume-earlier__dates">({row.dates}).</span> {row.body}
              </p>
            ))}
          </div>
        </section>

        <div className="resume-seam resume-seam--block" aria-hidden="true" />

        <section className="resume-bottom-grid">
          <div>
            <div className="resume-kicker resume-kicker--violet">Credentials</div>
            <h2 className="resume-h2">Education</h2>
            <p className="resume-edu">
              <strong>Leadership and Marketing Certification</strong>
              <Tape tone="violet" className="resume-tape--inline">
                Popular Brand
              </Tape>
            </p>
            <p className="resume-edu">
              <strong>Retail Management Coursework</strong>
              <Tape tone="green" className="resume-tape--inline">
                Community College
              </Tape>
            </p>
          </div>
          <div>
            <div className="resume-kicker resume-kicker--green">What I bring</div>
            <h2 className="resume-h2">Skills & tools</h2>
            <div className="resume-chips">
              {SKILLS.map(s => (
                <span key={s} className="resume-chip resume-chip--lime">
                  {s}
                </span>
              ))}
            </div>
            <div className="resume-chips resume-chips--tools">
              {TOOLS.map(t => (
                <span key={t} className="resume-chip resume-chip--cyan">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="resume-close">
        <div className="resume-seam" aria-hidden="true" />
        <div className="resume-close__inner">
          <div>
            <h2 className="resume-h2 resume-h2--close">Let&apos;s build something</h2>
            <p className="resume-close__note">
              Pride is a protest. Take care of each other.
              <span className="resume-close__star" aria-hidden="true">
                ✦
              </span>
              <Link href="/">zaylist.com</Link>
            </p>
          </div>
          <Button
            type="button"
            variant="solid"
            accent="pink"
            size="lg"
            onClick={() => setShowContact(true)}
          >
            Message Me For Complete Resume
          </Button>
        </div>
      </section>

      {showContact && (
        <PortfolioContactModal onClose={() => setShowContact(false)} variant="message" />
      )}
    </div>
  );
}
