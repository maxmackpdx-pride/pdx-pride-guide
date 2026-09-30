import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, MapPin, Plus, Search } from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { RESOURCE_CATEGORIES, type ResourceCategory, type ResourceOrg } from "@/lib/resourcesData";
import "./Resources.css";

const TOTAL = RESOURCE_CATEGORIES.reduce((n, c) => n + c.orgs.length, 0);

/** Monogram fallback until a real logo file is added: an acronym in the name, else initials. */
function initials(name: string) {
  const paren = name.match(/\(([A-Z][A-Z&:]{1,6})\)/);
  if (paren) return paren[1];
  const first = name.split(/[\s/|]+/)[0].replace(/[^A-Za-z:]/g, "");
  if (first.length >= 2 && first.length <= 6 && first === first.toUpperCase()) return first;
  const skip = new Set(["the", "of", "for", "and", "&", "a"]);
  return name
    .replace(/\(.*?\)/g, "")
    .split(/[\s/|,-]+/)
    .filter(w => w && !skip.has(w.toLowerCase()))
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase())
    .join("");
}

function matches(org: ResourceOrg, cat: ResourceCategory, words: string[]) {
  if (!words.length) return true;
  const hay = [org.name, org.sub, org.desc, org.scope, cat.name].join(" ").toLowerCase();
  return words.every(w => hay.includes(w));
}

const HOTLINES = [
  { num: "988", who: "Suicide & Crisis Lifeline", note: "Call or text, day or night.", tel: "988", c: "#FF2400" },
  { num: "503-235-5333", who: "Call to Safety", note: "24/7 domestic and sexual violence line, Portland metro.", tel: "5032355333", c: "#FF2400" },
  { num: "866-488-7386", who: "The Trevor Project", note: "24/7 for LGBTQ+ young people under 25.", tel: "18664887386", c: "#FF6600" },
  { num: "877-565-8860", who: "Trans Lifeline", note: "Peer support by and for trans people.", tel: "18775658860", c: "#FF00CC" },
];

function OrgCard({ org, color }: { org: ResourceOrg; color: string }) {
  return (
    <article className="res-card" role="listitem" style={{ "--c": color } as React.CSSProperties}>
      <div className="res-card__top">
        {org.logo
          ? <img className="res-card__logo" src={org.logo} alt={`${org.name} logo`} loading="lazy" decoding="async" />
          : <span className="res-card__mark" aria-hidden="true">{org.mark || initials(org.name)}</span>}
        <span className="res-mono res-card__scope">{org.scope}</span>
      </div>
      <h3 className="res-card__name">{org.name}</h3>
      {org.sub && <p className="res-card__sub">{org.sub}</p>}
      <p className="res-card__desc">{org.desc}</p>
      {org.addr && <p className="res-card__addr"><MapPin size={13} aria-hidden="true" />{org.addr}</p>}
      <div className="res-card__acts">
        {org.url && <a className="res-btn" href={org.url} target="_blank" rel="noopener noreferrer">{org.cta || "Visit site"}</a>}
        {org.alt && <a className="res-btn res-btn--quiet" href={org.alt} {...(org.alt.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{org.altLabel}</a>}
      </div>
    </article>
  );
}

function CategorySection({ cat, index, orgs, filtered }: { cat: ResourceCategory; index: number; orgs: ResourceOrg[]; filtered: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <section className="res-sec" id={cat.id} style={{ "--c": cat.color } as React.CSSProperties} aria-labelledby={`${cat.id}-title`}>
      <div className="res-sec__head">
        <div>
          <span className="res-mono res-sec__eyebrow">
            {String(index + 1).padStart(2, "0")} / {orgs.length} {orgs.length === 1 ? "organization" : "organizations"}{filtered ? " matching" : ""}
          </span>
          <h2 className="res-sec__title" id={`${cat.id}-title`}><span className="res-sec__dot" aria-hidden="true" />{cat.name}</h2>
          <p className="res-sec__for">{cat.forr}</p>
        </div>
        <div className="res-sec__nav">
          <button type="button" className="res-arrow" aria-label={`Scroll ${cat.name} back`} onClick={() => scroll(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
          <button type="button" className="res-arrow" aria-label={`Scroll ${cat.name} forward`} onClick={() => scroll(1)}><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="res-rail" ref={railRef} role="list" aria-label={cat.name}>
        {orgs.map(org => <OrgCard key={org.name} org={org} color={cat.color} />)}
      </div>
      <details className="res-more">
        <summary className="res-mono"><Plus size={14} aria-hidden="true" />What these are and how to use them</summary>
        <dl className="res-more__grid">
          <div><dt className="res-mono">What they are</dt><dd>{cat.what}</dd></div>
          <div><dt className="res-mono">How they help</dt><dd>{cat.help}</dd></div>
          <div><dt className="res-mono">What they're for</dt><dd>{cat.forr}</dd></div>
          <div><dt className="res-mono">How to use them</dt><dd>{cat.use}</dd></div>
        </dl>
      </details>
    </section>
  );
}

export default function Resources() {
  usePageSeo(
    "Resources | Zaylist",
    "Nonprofits, hotlines, and LGBTQ+ groups for queer and trans Oregon: health care, safety, legal help, youth, community, funding, and more.",
  );
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const words = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const groups = useMemo(() => RESOURCE_CATEGORIES
    .map((c, i) => ({ c, i, orgs: c.orgs.filter(o => matches(o, c, words)) }))
    .filter(g => (cat === "all" || g.c.id === cat) && g.orgs.length > 0), [words, cat]);
  const shown = groups.reduce((n, g) => n + g.orgs.length, 0);
  const tabs = [{ id: "all", name: "All", color: "#19e3ff", n: TOTAL }, ...RESOURCE_CATEGORIES.map(c => ({ id: c.id, name: c.name, color: c.color, n: c.orgs.length }))];

  return (
    <div className="resources-page">
      <header className="res-hdr">
        <div className="res-aur" aria-hidden="true">
          <span className="res-orb res-orb--mon" /><span className="res-orb res-orb--wed" /><span className="res-orb res-orb--thu" />
          <span className="res-orb res-orb--fri" /><span className="res-orb res-orb--sat" /><span className="res-orb res-orb--sun" />
        </div>
        <span className="res-mono res-hdr__eyebrow">Zaylist / Resources</span>
        <h1 className="res-hdr__title">Resources</h1>
        <div className="res-hdr__row">
          <p className="res-hdr__lede">Nonprofits, hotlines, and LGBTQ+ groups for queer and trans Oregon, with Portland first. Find care, get safe, get legal help, get funded, find your people, or give back.</p>
          <p className="res-mono res-hdr__mantra">Reach out · show up · keep each other alive</p>
        </div>
        <p className="res-hdr__places">Looking for bars, food, shops, or venues? <Link href="/directory">Our Placez</Link></p>
      </header>

      <section className="res-help" aria-labelledby="res-help-title">
        <div className="res-help__head">
          <h2 className="res-help__title" id="res-help-title">Need help now?</h2>
          <span className="res-mono res-help__tag">Free · confidential</span>
        </div>
        <div className="res-help__grid">
          <div className="res-hl res-hl--211">
            <span className="res-mono res-hl__kick">Not sure who to call · Oregon &amp; SW Washington</span>
            <span className="res-hl__num">211info</span>
            <p>Free connection to 7,000+ health and social service programs, in 150+ languages. Housing, food, utilities, and more. Text your zip to 898211.</p>
            <div className="res-card__acts">
              <a className="res-btn" href="tel:211" style={{ "--c": "#00FFFF" } as React.CSSProperties}>Call 211</a>
              <a className="res-btn res-btn--quiet" href="https://www.211info.org" target="_blank" rel="noopener noreferrer">Search</a>
            </div>
          </div>
          {HOTLINES.map(h => (
            <a key={h.tel} className="res-hl" href={`tel:${h.tel}`} style={{ "--c": h.c } as React.CSSProperties}>
              <span className="res-hl__num">{h.num}</span>
              <span className="res-hl__who">{h.who}</span>
              <p>{h.note}</p>
            </a>
          ))}
        </div>
        <p className="res-mono res-help__911">In immediate danger? Call 911.</p>
      </section>

      <div className="res-browse">
        <label className="res-search">
          <Search size={20} aria-hidden="true" />
          <span className="sr-only">Search resources</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search: HIV testing, legal, Eugene, youth…" />
          {q && <button type="button" className="res-clear" onClick={() => setQ("")}>Clear</button>}
        </label>
        <div className="res-chips" role="tablist" aria-label="Filter by category">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={cat === t.id}
              className={`res-chip${cat === t.id ? " res-chip--on" : ""}`}
              style={{ "--_c": t.color } as React.CSSProperties}
              onClick={() => setCat(t.id)}
            >
              {t.name}<strong>{t.n}</strong>
            </button>
          ))}
        </div>
        <div className="res-browse__meta">
          <span className="res-mono res-browse__count" aria-live="polite">{shown} of {TOTAL} organizations</span>
          <span className="res-mono res-browse__hint">Swipe each row</span>
        </div>
      </div>

      {groups.map(g => <CategorySection key={g.c.id} cat={g.c} index={g.i} orgs={g.orgs} filtered={words.length > 0} />)}

      {groups.length === 0 && (
        <section className="res-empty">
          <h2 className="res-foot__title">Nothing matches that yet</h2>
          <p>Try a broader word, pick All, or call 211 and they'll point you to the right place.</p>
          <button type="button" className="res-clear" onClick={() => { setQ(""); setCat("all"); }}>Show everything</button>
        </section>
      )}

      <footer className="res-foot">
        <div>
          <div className="res-foot__title">Know a group that belongs here?</div>
          <p>Send us the name and website and we'll take a look.</p>
        </div>
        <Link className="res-cta" href="/contact">Suggest a resource<Plus size={18} aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}
