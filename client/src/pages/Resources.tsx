import { ServiceNameMark } from "@/components/ServiceNameMark";
import { serviceArtwork } from "@shared/serviceIdentity";
import { BrowseHeader, BrowseControls, BrowseLane, type BrowseView } from "@/components/discovery/EventzBrowse";
import { mapBrowseHref } from "@/lib/mapBrowseHref";
import BrowseStatus from "@/components/BrowseStatus";
import "@/components/discovery/DiscoveryFlow.css";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  ChevronDown,
  ShieldAlert,
  Map,
  Phone,
  X,
} from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { RESOURCE_CATEGORIES, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_PANTRIES, FOOD_RESOURCE } from "@/lib/foodPantries";
import { placeGoogleMapsUrl } from "@/lib/placeLinks";
import { Badge } from "@/components/ds/Badge";
import BoardShareButton from "@/components/BoardShareButton";
import BoardFollowButton from "@/components/BoardFollowButton";
import { resourceLogoLayout } from "@/components/resources/resourceLogoLayout";
import { PlaceCard } from "@/components/ds/PlaceCard";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import "@/components/ui/web-gl-shader.css";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "./Resources.css";
import "@/components/discovery/EventzDetail.css";

const ResourceDirectoryMap = lazy(() => import("@/components/DirectoryMap"));
const ResourceBackgroundShader = lazy(() => import("@/components/ui/web-gl-shader").then(({ WebGLShader }) => ({ default: WebGLShader })));

const LABELS = [
  "Health & care",
  "Safety & basic needs",
  "Rights & advocacy",
  "Youth support",
  "Community",
  "Family & elders",
  "Work & money",
  "Arts & spaces",
  "Mental health & peer support",
  "Harm reduction",
];
const ROWS = RESOURCE_CATEGORIES.flatMap((category) =>
  (category.id === "safety"
    ? [...category.orgs, FOOD_RESOURCE]
    : category.orgs
  ).map((org) => ({ org, category })),
);
type Row = (typeof ROWS)[number] & { sectionCategory?: (typeof RESOURCE_CATEGORIES)[number] };
function categoriesFor(row: Row) {
  return RESOURCE_CATEGORIES.filter((category) =>
    category.id === row.category.id || row.org.categoryIds?.includes(category.id),
  );
}
function tagsFor(row: Row) {
  const section = row.sectionCategory ?? row.category;
  const categoryTags = [section, ...categoriesFor(row).filter((tag) => tag.id !== section.id)];
  const specialtyTags = row.org.transSpecialist
    ? [{ id: "trans-friends", name: "TRANS FRIENDS", color: "var(--res-trans-blue)" }]
    : [];
  return [...categoryTags, ...specialtyTags, ...(row.org.serviceTags || []).map((name) => ({ id: `service-${section.id}-${name}`, name, color: section.color }))];
}

const HOTLINES = [
  {
    name: "988",
    description: "Suicide & Crisis Lifeline · call or text",
    tel: "988",
  },
  { name: "Call to Safety", description: "503-235-5333", tel: "5032355333" },
  {
    name: "The Trevor Project",
    description: "866-488-7386",
    tel: "18664887386",
  },
  { name: "Trans Lifeline", description: "877-565-8860", tel: "18775658860" },
];

function Mark({ org, allowArtwork = true }: { org: ResourceOrg; allowArtwork?: boolean }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const artwork = allowArtwork ? serviceArtwork(org, org.logo) : null;
  return artwork && failedLogo !== artwork ? (
    <img
      className={`rg-logo${org.logoSurface === "light" ? " rg-logo--light" : ""}`}
      src={artwork}
      onError={() => setFailedLogo(artwork)}
      alt={`${org.name} logo`}
      loading="lazy"
    />
  ) : (
    <ServiceNameMark source={org} />
  );
}

function SupportNumber({ name, number, tel }: { name: string; number: string; tel: string }) {
  return (
    <a className="pdx-glass-rebind pdxBtn rg-safety-crisis" href={`tel:${tel}`}>
      <Phone size={18} aria-hidden="true" />
      <span>{name}<strong>{number}</strong></span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}

function ResourcePhone({ org, href, label }: { org: ResourceOrg; href?: string; label?: string }) {
  const phone = href || org.phone;
  if (!phone) return null;
  const caption = label || org.phoneLabel || "";
  const matched = caption.match(/(?:\+?1[- .]?)?\(?\d{3}\)?[- .]\d{3}[- .]\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?/i);
  const digits = phone.replace(/^tel:/, "").replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const number = matched?.[0] || (national.length === 10 ? `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}` : phone.replace(/^tel:/, ""));
  const before = matched ? caption.slice(0, matched.index).replace(/[:\s·–-]+$/, "") : caption;
  const after = matched ? caption.slice((matched.index || 0) + matched[0].length).replace(/^[\s·–-]+/, "") : "";
  return <div className="rg-phone-block">
    <SupportNumber name={before || `Call ${org.name}`} number={number} tel={phone.replace(/^tel:/, "")} />
    {after && <p className="rg-phone-note">{after}</p>}
  </div>;
}

function SafetyNotice({ openCard = false }: { openCard?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  return (
    <aside className={openCard ? "rg-safety-prompt rg-safety-open" : "pdxPlace pdx-glass-rebind rg-safety-prompt rg-safety-summary"} style={{ "--c": "var(--neon-red)", "--_c": "var(--neon-red)" } as CSSProperties} aria-label="Urgent safety help">
      <div className={openCard ? "rg-safety-open-body" : "pdxPlace__body pdx-glass-card pdx-glass-rebind"}>
        {!openCard && <div className="pdxPlace__sheen pdx-glass-sheen--specular" aria-hidden="true" />}
        {!openCard && <div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true" />}
        {!openCard && <ResourceCardMotif name="Immediate danger safety support" category="safety" />}
        {!openCard && <div className="rg-card-vignette" aria-hidden="true" />}
        <div className="rg-safety-content">
      <div className="rg-safety-heading">
        {openCard && <ShieldAlert size={28} aria-hidden="true" />}
        <div>
          {openCard ? <span className="pdxPlace__cat pdx-glass-rebind"><Badge color="var(--neon-orange)" size="sm">Immediate safety</Badge></span> : <span className="rg-safety-kicker"><ShieldAlert size={24} aria-hidden="true" />Immediate safety</span>}
          <h3>In immediate danger?</h3>
        </div>
        {!openCard && <div className="rg-safety-motif" aria-hidden="true">
          <svg viewBox="0 0 180 180" className="rg-safety-draft" fill="none">
            <circle cx="90" cy="90" r="68" />
            <circle cx="90" cy="90" r="58" strokeDasharray="3 7" />
            <path d="M8 90h28m108 0h28M90 8v28m0 108v28M28 40V24h16m92 0h16v16M28 140v16h16m92 0h16v-16M18 168h144M18 162v12m144-12v12" />
          </svg>
          <ShieldAlert className="rg-safety-motif-mark" strokeWidth={1.25} />
        </div>}
      </div>
      <p className="rg-safety-lead">If you or someone else is in danger right now, call 911 if you can do so safely.</p>
      <a className="pdx-glass-rebind pdxBtn pdxBtn--solid rg-safety-emergency" href="tel:911"><Phone size={18} aria-hidden="true" /> Call 911</a>
      {!openCard && <button type="button" className="rg-safety-expand" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)}>
        <span className="rg-safety-expand-copy">
          <strong>{expanded ? "Hide safety & support options" : "Show safety & support options"}</strong>
          <small>Domestic violence guidance · confidential support · Call to Safety</small>
        </span>
        <span className="rg-safety-expand-indicator" aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>}
      <div id={detailsId} hidden={!openCard && !expanded}>
      {openCard && <div className="rg-support-numbers rg-emergency-numbers">
        {HOTLINES.map((h) => (
          <SupportNumber key={h.tel}
            name={h.tel === "988" ? "Suicide & Crisis Lifeline" : h.name}
            number={h.tel === "988" ? "988" : h.description}
            tel={h.tel} />
        ))}
      </div>}
      <details className="rg-safety-law">
        <summary>Domestic violence in Oregon — what counts?</summary>
        <div>
          <p><strong>Roommate abuse counts, too.</strong> Call to Safety explicitly includes roommates in its domestic violence guidance. Abuse can include threats, emotional abuse, financial control, isolation, physical harm, or sexual violence. You can reach out for safety planning, emotional support, and referrals.</p>
          <p><strong>Getting help and qualifying for a court order are different.</strong> You do not need a restraining order to contact Call to Safety. Specific services and legal protections have their own eligibility rules.</p>
          <p><strong>What Oregon law says:</strong> ORS 135.230 defines domestic violence as abuse between family or household members. Its definition of abuse includes:</p>
          <ul>
            <li>Hurting someone physically, or trying to.</li>
            <li>Making someone fear serious physical harm that is about to happen.</li>
            <li>Sexual abuse.</li>
          </ul>
          <p>The law includes requirements about intent or recklessness and the relationship between the people involved. The full rules are linked below.</p>
          <p><strong>Restraining orders:</strong> A FAPA order has specific family or intimate-relationship requirements; being roommates alone does not automatically qualify. Other protective orders or housing protections may apply. An advocate or legal aid provider can help you work out which options fit.</p>
          <p>You deserve support if someone is hurting, controlling, or threatening you. Don’t rule yourself out because they are “just a roommate.”</p>
          <div className="rg-safety-law-links">
            <a href="https://calltosafety.org/resources/quick-facts/" target="_blank" rel="noopener noreferrer">Call to Safety: domestic violence includes roommates ↗</a>
            <a href="https://calltosafety.org/services/crisis-line/" target="_blank" rel="noopener noreferrer">Support, safety planning & referrals ↗</a>
            <a href="https://oregonlawhelp.org/topics/housing/rental-housing/housing-protections-victims-domestic-violence-and-certain-other-crimes" target="_blank" rel="noopener noreferrer">Oregon housing protections for survivors ↗</a>
            <a href="https://oregonlawhelp.org/topics/safety/restraining-orders-oregon/oregons-five-restraining-orders/family-abuse-restraining-order-fapa" target="_blank" rel="noopener noreferrer">Who can get a family-abuse restraining order? ↗</a>
            <a href="https://www.oregonlegislature.gov/bills_laws/ors/ors135.html" target="_blank" rel="noopener noreferrer">Read ORS 135.230 ↗</a>
            <a href="https://www.oregonlegislature.gov/bills_laws/ors/ors107.html" target="_blank" rel="noopener noreferrer">Read ORS 107.705 ↗</a>
            <a href="https://www.courts.oregon.gov/programs/family/domestic-violence/Pages/restraining.aspx" target="_blank" rel="noopener noreferrer">Oregon Courts: restraining orders ↗</a>
          </div>
          <small>General legal information, not individual legal advice. Sources checked September 30, 2026.</small>
        </div>
      </details>
      <div className="rg-safety-support">
        <h4>You don’t have to figure this out alone.</h4>
        <p>For abuse by a partner, family member, roommate, or caregiver, talk with a Call to Safety advocate. Support is free, confidential, and available 24/7. You don’t need to know the legal label to call.</p>
        {!openCard && <SupportNumber name="Call to Safety" number="503-235-5333" tel="+15032355333" />}
        <a className="rg-safety-source" href="https://calltosafety.org/services/" target="_blank" rel="noopener noreferrer">Support options & service details <ArrowUpRight size={13} /></a>
      </div>
      </div>

        </div>
      </div>
    </aside>
  );
}

const TALK_GROUPS = [
  { title: "Crisis & safety support", lines: [
    { name: "Suicide & Crisis Lifeline", number: "988", tel: "988", note: "Call or text for emotional distress or a mental health crisis.", hours: "24/7", source: "https://988lifeline.org/" },
    { name: "The Trevor Project", number: "866-488-7386", tel: "18664887386", note: "Crisis counselors for LGBTQ+ young people. Text START to 678678 or use online chat.", hours: "24/7", source: "https://www.thetrevorproject.org/get-help/" },
    { name: "Call to Safety", number: "503-235-5333", tel: "15032355333", note: "Domestic and sexual violence support, including abuse by roommates. Safety planning and referrals.", hours: "24/7 · Free and confidential", source: "https://calltosafety.org/services/crisis-line/" },
  ] },
  { title: "Queer people to talk to", lines: [
    { name: "Trans Lifeline", number: "877-565-8860", tel: "18775658860", note: "Trans peer support for trans and questioning people. You don’t have to be in crisis.", hours: "Mon–Fri 10am–6pm PT · Check site for closures", source: "https://translifeline.org/hotline/" },
    { name: "LGBT National Hotline", number: "888-843-4564", tel: "18888434564", note: "LGBTQ+ peer support, identity, relationships, and coming out.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/national-hotline/" },
    { name: "LGBT National Youth Talkline", number: "800-246-7743", tel: "18002467743", note: "Peer support for young people navigating identity, family, school, and relationships.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/youth-talkline/" },
    { name: "LGBT National Senior Hotline", number: "888-234-7243", tel: "18882347243", note: "Support around LGBTQ+ aging, relationships, family, and elder abuse.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/senior-hotline/" },
  ] },
  { title: "OHP & local services", lines: [
    { name: "OHP member support", number: "800-273-0557", tel: "18002730557", note: "Oregon Health Plan member questions, concerns, and complaints. For plan-specific care, contact your CCO.", hours: "TTY 711 · See official site for availability", source: "https://www.oregon.gov/oha/OHP/Pages/Contact-Us.aspx" },
    { name: "Apply for OHP", number: "800-699-9075", tel: "18006999075", note: "Help applying for Oregon Health Plan coverage.", hours: "Mon–Fri 7am–6pm PT · TTY 711", source: "https://www.oregon.gov/oha/OHP/Pages/Contact-Us.aspx" },
    { name: "211info", number: "211", tel: "211", note: "Find local housing, food, health care, and other services.", hours: "Check official site for current hours", source: "https://www.211info.org/" },
  ] },
];

function talkLineStatus(name: string, hours: string, now: Date) {
  if (hours.startsWith("24/7")) return { label: "Open now", open: true };
  const schedule = name === "Trans Lifeline"
    ? { weekdays: [1, 2, 3, 4, 5], start: 10, end: 18, saturday: null }
    : name.startsWith("LGBT National")
      ? { weekdays: [1, 2, 3, 4, 5], start: 11, end: 20, saturday: { start: 9, end: 14 } }
      : name === "Apply for OHP"
        ? { weekdays: [1, 2, 3, 4, 5], start: 7, end: 18, saturday: null }
        : null;
  if (!schedule) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value || "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = dayNames.indexOf(value("weekday"));
  const time = Number(value("hour")) + Number(value("minute")) / 60;
  const today = day === 6 ? schedule.saturday : schedule.weekdays.includes(day) ? schedule : null;
  if (today && time >= today.start && time < today.end) return { label: "Open now", open: true };
  for (let offset = 0; offset < 7; offset += 1) {
    const nextDay = (day + offset) % 7;
    const next = nextDay === 6 ? schedule.saturday : schedule.weekdays.includes(nextDay) ? schedule : null;
    if (!next || (offset === 0 && time >= next.start)) continue;
    const hour = next.start > 12 ? `${next.start - 12}pm` : `${next.start}am`;
    return { label: `Opens ${offset === 0 ? "" : offset === 1 ? "tomorrow " : `${dayNames[nextDay]} `}${hour}`, open: false };
  }
  return null;
}

function TalkOptions() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="rg-support rg-support-open rg-talk-options">
      {TALK_GROUPS.map((group) => (
        <section className="rg-talk-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          <div className="rg-support-numbers">
            {group.lines.map((line) => {
              const status = talkLineStatus(line.name, line.hours, now);
              return (
              <div className="rg-talk-option" id={`talk-${line.tel}`} tabIndex={-1} key={line.tel}>
                <div className="rg-talk-option-main">
                  <div className="rg-talk-option-copy">
                    {status && <span className="rg-talk-status" data-open={status.open}>{status.label}</span>}
                    <h4>{line.name === "Suicide & Crisis Lifeline" ? "988 Suicide & Crisis Lifeline" : line.name}</h4>
                    <p>{line.note}</p>
                    <small>{line.number} · {line.hours}</small>
                  </div>
                  <div className="rg-talk-option-actions">
                    {(line.tel === "988" || line.name === "The Trevor Project") && <a className="rg-talk-text" href={line.tel === "988" ? "sms:988" : "sms:678678?body=START"}>Text</a>}
                    <a className="rg-talk-call" href={`tel:${line.tel}`}><Phone size={16} aria-hidden="true" /> Call</a>
                  </div>
                </div>
                <a className="rg-safety-source" href={line.source} target="_blank" rel="noopener noreferrer">Official service details <ArrowUpRight size={13} aria-hidden="true" /></a>
              </div>
            ); })}
          </div>
        </section>
      ))}
      <small>Numbers and service pages checked September 30, 2026. Status follows listed Pacific hours; check providers for closures.</small>
    </div>
  );
}

function Support({ showSafety = true, openCard = false }: { showSafety?: boolean; openCard?: boolean }) {
  return (
    <div className={openCard ? "rg-support rg-support-open" : "rg-support"}>
      {showSafety && <SafetyNotice openCard={openCard} />}
      {!openCard && <div className="rg-talk">
        <span className="rg-eyebrow">Find local services</span>
        <h3>Start with 211info.</h3>
        <p>
          A connection to housing, food, health care, and other services in
          Oregon and SW Washington.
        </p>
        <a className="pdx-glass-rebind pdxBtn pdxBtn--solid" href="tel:211">
          Call 211 <ArrowUpRight size={16} />
        </a>
      </div>}
      {!openCard && <div className="rg-support-numbers">
        {HOTLINES.filter((h) => !showSafety || h.name !== "Call to Safety").map((h) => (
          <SupportNumber
            key={h.tel}
            name={h.tel === "988" ? "Suicide & Crisis Lifeline" : h.name}
            number={h.tel === "988" ? "988" : h.description}
            tel={h.tel}
          />
        ))}
      </div>}
    </div>
  );
}

function FoodPantryList() {
  return (
    <div className="rg-food-list">
      <p className="rg-food-note">
        Hours checked September 30, 2026 · Portland time. Check the provider’s
        site for closures before visiting.
      </p>
      {FOOD_PANTRIES.map((pantry) => (
        <details key={pantry.name}>
          <summary>
            <strong>{pantry.name}</strong>
            <span>{pantry.hours}</span>
          </summary>
          <div className="rg-food-visit">
            <p>{pantry.address}</p>
            <p>{pantry.note}</p>
            <a href={pantry.url} target="_blank" rel="noopener noreferrer">
              Visit official site <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
      ))}
    </div>
  );
}

function ResourceLocationMap({ org, color, initiallyOpen = false }: { org: ResourceOrg; color: string; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const locations = org.locations || (org.addr ? [{ name: org.name, address: org.addr, lat: org.lat, lng: org.lng }] : []);
  if (!locations.length) return null;
  const pins = locations.flatMap((location, i) => location.lat != null && location.lng != null ? [{
    id: i + 1, name: location.name, type: "nonprofit", address: location.address,
    neighborhood: null, lat: location.lat, lng: location.lng,
  }] : []);
  return <section className="rg-resource-map" style={{ "--resource-accent": color } as CSSProperties} aria-label={`Locations for ${org.name}`} onClick={(event) => event.stopPropagation()}>
    <button className="pdx-glass-rebind pdxBtn rg-map-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide map & directions" : "Map & directions"}</button>
    {open && <>
      {pins.length > 0 && <div className="rg-resource-map-canvas" data-vaul-no-drag>
        <Suspense fallback={<span className="rg-map-loading" role="status">Loading map…</span>}>
          <ResourceDirectoryMap businesses={pins} height="100%" showKey={false} interactive={false} focusBusiness rasterBasemap accent={color} />
        </Suspense>
      </div>}
      {pins.length > 0 && <small className="rg-map-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> · © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a></small>}
      {locations.map((location) => <a key={location.address} className="pdx-glass-rebind pdxBtn" href={placeGoogleMapsUrl({ address: location.address, name: location.name })} target="_blank" rel="noopener noreferrer">{location.address} <ArrowUpRight size={16} /></a>)}
    </>}
  </section>;
}

// Preserve the original resource card artwork and optical logo treatment.
const RESOURCE_CARD_CAPTIONS: Record<string, string> = {
 "Family Peace Center of Washington County": "Family Peace Center",
 "Virginia Garcia · Beaverton Wellness Center": "Beaverton Wellness Center",
 "PFLAG Vancouver": "Vancouver, WA",
 "YWCA Clark County · SafeChoice": "SafeChoice",

 "Oregon Health Plan (OHP)": "Oregon Health Plan (OHP)",
 "Multnomah County · Free Outreach Testing": "Free Outreach Testing",
 "Oregon Free HIV & Syphilis Lab Testing": "Free HIV & Syphilis Testing",
 "CAP Northwest & Our House": "Our House",
 "OHSU Transgender Health Program": "Transgender Health Program",
 "Marsha's Folx | Bradley Angle": "Marsha’s Folx",
 "WERQ Together": "WERQ Together",
 "New Avenues for Youth / SMYRC": "SMYRC",
 "The Living Room": "The Living Room",
 "TransActive Gender Project": "TransActive Gender Project",
 "Pairs With Pride": "Pairs With Pride",
 "Oregon Department of Veterans' Affairs": "Oregon Veterans’ Affairs",
 "Northwest Gender Alliance": "Northwest Gender Alliance",
 "Portland Small Business Development Center": "Portland Small Business Development Center",
 "Independent Publishing Resource Center": "Independent Publishing Resource Center",
 "Multnomah County Harm Reduction": "Harm Reduction",
 "HIV Alliance · Syringe Services": "Syringe Services",
 "Just in Case Oregon · Free Naloxone": "Free Naloxone",
 "Food banks & pantries": "Food Banks & Pantries",
};

const ResourceCard = memo(function ResourceCard({
  row,
  onOpen,
}: {
  row: Row;
  onOpen: (row: Row) => void;
}) {
  const { org } = row;
  const category = row.sectionCategory ?? row.category;
  return (
    <PlaceCard
      name={org.name}
      displayName={RESOURCE_CARD_CAPTIONS[org.name] ?? org.name}
      decoration={<><div className="rg-card-vignette" aria-hidden="true" /><div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true" /><ResourceCardMotif name={org.name} category={category.id} /></>}
      data-optical-logo={org.name}
      style={resourceLogoLayout(org.name) as CSSProperties}
      categoryLabel={category.name}
      categoryTags={tagsFor(row).slice(0, 2)}
      accentColor={category.color}
      logoUrl={serviceArtwork(org, org.logo) || undefined}
      logoFallback={<Mark org={org} allowArtwork={false} />}
      description={org.desc}
      shareUrl={`https://www.zaylist.com/rezources?resource=${encodeURIComponent(org.name)}`}
      className={`rg-directory-card rg-category-${category.id} pdxPlace--clickable${org.logoSurface === "light" ? " rg-directory-card--light-logo" : ""}`}
      onClick={() => onOpen(row)}
      footer={
        <div className="rg-directory-footer">
          <button className={`pdx-glass-rebind pdxBtn${["safety", "legal", "arts", "youth", "harm-reduction"].includes(category.id) ? " rg-contact-white" : ""}`} aria-label={`View details for ${org.name}`} onClick={event => { event.stopPropagation(); onOpen(row); }}>
            View details <ArrowUpRight size={16} />
          </button>
        </div>
      }
    />
  );
});

export default function Resources() {
  const { calmMode } = useTheme();
  const reducedMotion = useReducedMotion();
  const quietMotion = calmMode || reducedMotion;
  const [lightweightBackground, setLightweightBackground] = useState(() =>
    window.matchMedia("(max-width: 719px), (pointer: coarse)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 719px), (pointer: coarse)");
    const sync = () => setLightweightBackground(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location === "/resources") navigate(`/rezources${window.location.search}${window.location.hash}`, { replace: true });
  }, [location, navigate]);
  usePageSeo(
    "ReZources | Zaylist",
    "Art, community, opportunity, care, and support for queer and trans Oregon. Explore local organizations and food pantries to find your next connection.",
  );
  const readBrowseState = () => {
    const params = new URLSearchParams(window.location.search);
    const ids = (params.get("cat") || "").split(",").filter(id => RESOURCE_CATEGORIES.some(c => c.id === id));
    return { ids: params.get("view") === "all" ? [] : ids, query: params.get("q") || "", layout: params.get("layout") === "grid" ? "grid" as const : "browse" as const, mode: params.get("door") === "talk" ? "talk" as const : "directory" as const };
  };
  const [initial] = useState(readBrowseState);
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.ids);
  const [searchQuery, setSearchQuery] = useState(initial.query);
  const [mode, setMode] = useState<"directory" | "talk">(initial.mode);
  const [browseView, setBrowseView] = useState<BrowseView>(initial.layout);
  const [supportOpen, setSupportOpen] = useState(false);
  const supportTrigger = useRef<HTMLElement | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 600px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const sync = () => setMobile(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const restore = () => {
      const state = readBrowseState();
      setCategoryIds(state.ids); setSearchQuery(state.query); setMode(state.mode); setBrowseView(state.layout);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("cat"); url.searchParams.delete("view"); url.searchParams.delete("q"); url.searchParams.delete("layout");
    url.searchParams.set("door", mode === "talk" ? "talk" : "find");
    if (categoryIds.length) url.searchParams.set("cat", categoryIds.join(","));
    if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
    if (browseView !== "browse") url.searchParams.set("layout", browseView);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [categoryIds, searchQuery, mode, browseView]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("resource") || params.get("find");
    const row = requested && ROWS.find(({ org }) => org.name === requested || org.aliases?.includes(requested));
    if (row) { setDetail(row); setDetailOpen(true); }
  }, [location]);
  const openDetail = useCallback((row: Row) => {
    detailTrigger.current = document.activeElement as HTMLElement;
    setDetail(row); setDetailOpen(true);
  }, []);
  const choose = (id: string) => {
    setMode("directory");
    setCategoryIds(ids => id === "ALL" ? [] : ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  };
  const clear = () => { setSearchQuery(""); setCategoryIds([]); };
  const rows = useMemo(() => ROWS.filter(row => {
    if (categoryIds.length && !categoriesFor(row).some(c => categoryIds.includes(c.id))) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || [row.org.name, row.org.desc, row.org.sub, row.org.scope, row.org.addr, ...(row.org.aliases || []), ...(row.org.serviceTags || []), ...categoriesFor(row).map(c => c.name)].filter(Boolean).join(" ").toLowerCase().includes(query);
  }), [categoryIds, searchQuery]);
  const selectedCategories = RESOURCE_CATEGORIES.filter(c => !categoryIds.length || categoryIds.includes(c.id));
  const renderCard = (row: Row) => <div key={row.org.name} className="placez-card-surface eb-original-card">
    <ResourceCard row={row} onOpen={openDetail} />
  </div>;
  return (
    <div className="eb-page eb-page--resources">
      {lightweightBackground
        ? <div className="rg-stream-background rg-stream-background--mobile-fallback" aria-hidden="true" />
        : <Suspense fallback={null}><ResourceBackgroundShader waveSpeed={0.7} lowPower /></Suspense>}
      <BrowseHeader title="ReZources" logo="/brand/family/rezources-mobile.webp" kicker="Oregon · All the ways we show up"
        description="Art, community, opportunity, care, and support for queer and trans Oregon. Find your next connection.">
        <BoardShareButton title="ReZources" path="/rezources" card={{ room: "ReZources", mark: "/brand/family/rezources-mobile.webp", line: "All the ways we show up." }} />
        <BoardFollowButton board="rezources" />
      </BrowseHeader>
      <div className="eb-frame">
        <BrowseControls title="ReZources" categories={[{id:"ALL",label:"All resources",color:"var(--neon-cyan)",count:ROWS.length}, ...RESOURCE_CATEGORIES.map((c, i) => ({id:c.id,label:LABELS[i],color:c.color,count:ROWS.filter(row => categoriesFor(row).some(category => category.id === c.id)).length}))]}
          selected={categoryIds.length ? categoryIds : ["ALL"]} onSelect={choose} query={searchQuery} onSearch={value => {setSearchQuery(value); setMode("directory");}} view={browseView} onView={value => {setBrowseView(value); setMode("directory");}}>
          <a className="eb-tool pdx-glass-rebind" href={mapBrowseHref("rezources")} aria-label="Explore resources on Mapz"><Map size={19} /><span>Map</span></a>
          <button type="button" className="eb-tool pdx-glass-rebind" aria-label="Talk to someone" aria-pressed={mode === "talk"} onClick={() => setMode(mode === "talk" ? "directory" : "talk")}><Phone size={18} /><span>Talk to someone</span></button>
          <button type="button" className="eb-tool pdx-glass-rebind" aria-label="Immediate safety and support" onClick={event => {supportTrigger.current = event.currentTarget; setSupportOpen(true);}}><ShieldAlert size={19} /></button>
        </BrowseControls>
        <div className="eb-body">
          <aside className="eb-side" aria-label="ReZources filters and support">
            <div className="eb-panel eb-desktop-panel"><h2>Categories</h2><div className="eb-side-categories" role="group" aria-label="Filter resources">
              <button type="button" aria-pressed={!categoryIds.length} onClick={() => choose("ALL")}>All resources</button>
              {RESOURCE_CATEGORIES.map((c, i) => <button type="button" key={c.id} aria-pressed={categoryIds.includes(c.id)} onClick={() => choose(c.id)}>{LABELS[i]}</button>)}
            </div></div>
            <div className="eb-panel eb-desktop-panel"><h3>A person on the other end.</h3><p>Choose the line that fits what you need.</p>
              <button type="button" className="eb-tool pdx-glass-rebind" onClick={() => setMode(mode === "talk" ? "directory" : "talk")}><Phone size={18} />{mode === "talk" ? "Back to resources" : "Talk to someone"}</button>
              <button type="button" className="eb-clear" onClick={event => {supportTrigger.current = event.currentTarget; setSupportOpen(true);}}>Immediate safety & support</button>
            </div>
            <div className="eb-panel eb-desktop-panel"><h3>Know someone we should know?</h3><Link className="eb-tool pdx-glass-rebind" href="/contact">Suggest a resource<ArrowUpRight size={16} /></Link></div>
          </aside>
          <section className="eb-results" aria-label="Resource results">
            {mode === "talk" ? <><div className="eb-result-head"><h2>A person on the other end.</h2><button type="button" className="eb-clear" onClick={() => setMode("directory")}>Back to resources</button></div><div id="resource-talk-results"><TalkOptions /></div></> : <>
              <div className="eb-result-head"><p role="status">{rows.length} resource{rows.length === 1 ? "" : "s"}</p>{(categoryIds.length > 0 || searchQuery) && <button type="button" className="eb-clear" onClick={clear}>Clear filters</button>}</div>
              {!rows.length ? <BrowseStatus title="No resources match your search" description="Try a broader search or another category." actionLabel="Clear filters" onAction={clear} /> : browseView === "browse" ?
                <div className="eb-lanes">{selectedCategories.map(category => {
                  const group = rows.filter(row => categoriesFor(row).some(c => c.id === category.id)).sort((a, b) => Number(b.category.id === category.id) - Number(a.category.id === category.id));
                  return group.length ? <BrowseLane key={category.id} title={category.name} color={category.color} count={group.length}>{group.map(row => renderCard({...row, sectionCategory:category}))}</BrowseLane> : null;
                })}</div> : <div className="eb-grid">{rows.map(renderCard)}</div>}
            </>}
          </section>
        </div>
        <footer className="eb-footer"><h2>Know someone we should know?</h2><Link className="eb-tool pdx-glass-rebind" href="/contact">Suggest a resource<ArrowUpRight size={16} /></Link></footer>
        <div className="rg-reassurance"><p>Not sure? <a href="tel:211">Call 211info</a> for help finding a starting point.</p></div>
      </div>

      <Drawer.Root autoFocus open={supportOpen} onOpenChange={setSupportOpen} direction={mobile ? "bottom" : "right"} shouldScaleBackground={false} dismissible closeThreshold={0.2}>
        <Drawer.Portal>
          <Drawer.Overlay className="rg-overlay-backdrop" />
          <Drawer.Content
            className={`pdx-glass-rebind rg-overlay rg-drawer rg-resource-detail rg-safety-drawer rg-category-safety ${mobile ? "rg-drawer-mobile" : "rg-drawer-desktop"}`}
            style={{ "--resource-accent": "var(--neon-red)" } as CSSProperties}
            onCloseAutoFocus={(event) => { if (supportTrigger.current?.isConnected) { event.preventDefault(); supportTrigger.current.focus(); } }}
          >
            <Drawer.Handle className="rg-drawer-handle" aria-label="Drag to close safety support" />
            <Drawer.Close className="rg-close" aria-label="Close safety support"><X size={20} /></Drawer.Close>
            <div className="rg-drawer-body">
              <Drawer.Title className="sr-only">Immediate safety and support</Drawer.Title>
              <Drawer.Description className="sr-only">Call 911 for immediate danger, or choose a crisis support line. Includes Oregon safety information.</Drawer.Description>
              <Support openCard />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Dialog.Root
        open={detailOpen}
        onOpenChange={setDetailOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="rg-overlay-backdrop eb-detail-backdrop" />
          <Dialog.Content
            className={`pdx-glass-rebind rg-overlay rg-drawer rg-resource-detail event-modal event-modal--approved event-modal--reference eb-detail eb-detail--resource rg-category-${(detail?.sectionCategory ?? detail?.category)?.id || "health"}`}
            data-quiet-motion={quietMotion ? "true" : undefined}
            style={{
              "--event-accent": (detail?.sectionCategory ?? detail?.category)?.color || "var(--neon-cyan)",
              "--resource-accent": (detail?.sectionCategory ?? detail?.category)?.color || "var(--neon-cyan)",
              "--c": (detail?.sectionCategory ?? detail?.category)?.color || "var(--neon-cyan)",
              "--rg-category-gradient": (detail?.sectionCategory ?? detail?.category)?.color || "var(--neon-cyan)",
            } as CSSProperties}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const target = detailTrigger.current;
              if (target?.isConnected) target.focus();
              else
                document
                  .querySelector<HTMLButtonElement>(".eb-category")
                  ?.focus();
            }}
          >
            <div className="event-modal__chrome">
              <div className="detail-actions">
                {detail && <BoardShareButton title={detail.org.name} path={`/rezources?resource=${encodeURIComponent(detail.org.name)}`} />}
                <Dialog.Close className="detail-actions__close" aria-label="Close resource"><X size={20} aria-hidden="true" /></Dialog.Close>
              </div>
            </div>
            {detail && (
              <div className="rg-drawer-body event-modal__scroll">
                <div className="rg-detail-primary">
                <div className="rg-detail-logo eb-detail__art">
                  <div className="rg-detail-art" aria-hidden="true">
                    <ResourceCardMotif name={detail.org.name} category={(detail.sectionCategory ?? detail.category).id} />
                    <div className="rg-category-wash" />
                  </div>
                  <Mark org={detail.org} />
                </div>
                <Dialog.Title className="event-modal__title">{detail.org.name}</Dialog.Title>
                <div className="rg-detail-tags">
                  {tagsFor(detail).map((category, index) => (
                    <span className="rg-category-tag" data-category-id={category.id} key={category.id}>
                      <Badge variant={index === 0 ? "solid" : "outline"} color={category.color} size="sm">{category.name}</Badge>
                    </span>
                  ))}
                </div>

                {detail.org.phone && <ResourcePhone org={detail.org} />}
                <div className="rg-detail-actions">
                  {detail.org.email && <a className="pdx-glass-rebind pdxBtn" href={`mailto:${detail.org.email}`}>Email {detail.org.email} <ArrowUpRight size={16} /></a>}
                  {detail.org.url && (
                    <a
                      className="pdx-glass-rebind pdxBtn pdxBtn--solid"
                      style={
                        {
                          "--action-accent": (detail.sectionCategory ?? detail.category).color,
                        } as CSSProperties
                      }
                      href={detail.org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {detail.org.cta || "Visit website"}
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                  {detail.org.alt?.startsWith("tel:") ? <ResourcePhone org={detail.org} href={detail.org.alt} label={detail.org.altLabel} /> : detail.org.alt && (
                    <a
                      className="pdx-glass-rebind pdxBtn"
                      href={detail.org.alt}
                      {...(detail.org.alt.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {detail.org.altLabel}
                    </a>
                  )}
                </div>
                {detail.org.sub && <p>{detail.org.sub}</p>}
                <Dialog.Description>{detail.org.desc}</Dialog.Description>
                {detail.org.sourceChecked && (
                  <a
                    className="rg-source-check"
                    href={detail.org.sourceUrl || detail.org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Service page checked {detail.org.sourceChecked}{" "}
                    <ArrowUpRight size={13} />
                  </a>
                )}
                {detail.org === FOOD_RESOURCE && (
                  <>
                    <a className="pdx-glass-rebind pdxBtn pdxBtn--solid rg-food-finder" href="https://foodfinder.oregonfoodbank.org/" target="_blank" rel="noopener noreferrer">
                      Find food near you <ArrowUpRight size={22} aria-hidden="true" />
                    </a>
                    <p className="rg-food-finder-caption">Oregon Food Bank’s Food Finder · Search by location, day, and food type.</p>
                    <details className="rg-detail-disclosure event-modal__disclosure"><summary>Food pantries<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-disclosure-content"><FoodPantryList /></div></details>
                  </>
                )}
                {detail.org.locations && detail.org !== FOOD_RESOURCE && (
                  <details className="rg-org-locations rg-detail-disclosure event-modal__disclosure" aria-label="Locations">
                    <summary>Locations<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-disclosure-content">
                    {detail.org.locations.map((location) => (
                      <div className="rg-org-section" key={location.address}>
                        <h4>{location.name}</h4>
                        <p>{location.address}</p>
                        {location.hours && <p>{location.hours}</p>}
                        {location.phone && <ResourcePhone org={detail.org} href={location.phone} label={location.name} />}
                        <a className="pdx-glass-rebind pdxBtn" href={placeGoogleMapsUrl({ address: location.address, name: location.name })} target="_blank" rel="noopener noreferrer">Directions <ArrowUpRight size={16} /></a>
                        {location.sourceUrl && <a className="rg-safety-source" href={location.sourceUrl} target="_blank" rel="noopener noreferrer">Official location details <ArrowUpRight size={13} /></a>}
                      </div>
                    ))}
                  </div></details>
                )}
                {detail.org.programs && (
                  <details className="rg-org-programs rg-detail-disclosure event-modal__disclosure" aria-label="Programs and services">
                    <summary>Programs & services<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-disclosure-content">
                    {detail.org.programs.map((program) => (
                      <div className="rg-org-section" key={program.name}>
                        <h4>{program.name}</h4>
                        <p>{program.desc}</p>
                        <p>{program.scope}</p>
                        {program.addr && <p>{program.addr}</p>}
                        {program.hours && <p>{program.hours}</p>}
                        {program.phone && <ResourcePhone org={program} />}
                        {program.addr && <a className="pdx-glass-rebind pdxBtn" href={placeGoogleMapsUrl({ address: program.addr, name: detail.org.name })} target="_blank" rel="noopener noreferrer">Directions <ArrowUpRight size={16} /></a>}
                        {program.url && <a className="pdx-glass-rebind pdxBtn" href={program.url} target="_blank" rel="noopener noreferrer">{program.cta || "Program details"} <ArrowUpRight size={16} /></a>}
                        {program.sourceChecked && <a className="rg-safety-source" href={program.sourceUrl || program.url} target="_blank" rel="noopener noreferrer">Service page checked {program.sourceChecked} <ArrowUpRight size={13} /></a>}
                      </div>
                    ))}
                  </div></details>
                )}
                </div>
                <div className="rg-detail-secondary">
                <details className="rg-detail-disclosure event-modal__disclosure"><summary>Getting started & service details<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-detail-meta rg-disclosure-content">
                  <span className="rg-eyebrow">How to start</span>
                  <p>{detail.org.howToStart || detail.category.use}</p>
                  {detail.org.hours && <>
                    <span className="rg-eyebrow">Hours</span>
                    <p>{detail.org.hours}</p>
                  </>}
                  {detail.org.contactSourceUrl && <a className="rg-source-check" href={detail.org.contactSourceUrl} target="_blank" rel="noopener noreferrer">Contact details checked {detail.org.contactChecked} <ArrowUpRight size={13} /></a>}
                  {detail.org.mailingAddress && <>
                    <span className="rg-eyebrow">Mailing address</span>
                    <p>{detail.org.mailingAddress}</p>
                  </>}
                  <span className="rg-eyebrow">Where they serve</span>
                  <p>{detail.org.scope}</p>
                  {detail.org.addr && !detail.org.locations && (
                    <>
                      <span className="rg-eyebrow">Location</span>
                      <p>{detail.org.addr}</p>
                    </>
                  )}
                </div></details>
                <ResourceLocationMap key={detail.org.name} org={detail.org} color={(detail.sectionCategory ?? detail.category).color} />
                <small>
                  Check the organization's website for current hours, services,
                  and eligibility.
                </small>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
