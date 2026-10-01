import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Drawer } from "vaul";
import {
  ArrowUpRight,
  ChevronDown,
  Check,
  LifeBuoy,
  BriefcaseBusiness,
  Heart,
  House,
  Brain,
  Palette,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Star,
  Users,
  X,
} from "lucide-react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { RESOURCE_CATEGORIES, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_PANTRIES, FOOD_RESOURCE } from "@/lib/foodPantries";
import DirectoryMap from "@/components/DirectoryMap";
import { placeGoogleMapsUrl } from "@/lib/placeLinks";
import { Badge } from "@/components/ds/Badge";
import { ResourceFilterButton } from "@/components/resources/ResourceFilterButton";
import { RezourcesLogo } from "@/components/resources/RezourcesLogo";
import BoardShareButton from "@/components/BoardShareButton";
import BoardFollowButton from "@/components/BoardFollowButton";
import { resourceLogoLayout } from "@/components/resources/resourceLogoLayout";
import { ResourceRail } from "@/components/resources/ResourceRail";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import { PlaceCard } from "@/components/ds/PlaceCard";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "./Resources.css";

const ICONS = [
  Heart,
  ShieldCheck,
  Scale,
  Star,
  Users,
  House,
  BriefcaseBusiness,
  Palette,
  Brain,
  LifeBuoy,
];
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
  const categoryTags = categoriesFor(row).map((tag) => ({ ...tag, color: tag.id === "safety" ? "var(--neon-orange)" : tag.color }));
  const specialtyTags = row.org.transSpecialist
    ? [{ id: "trans-friends", name: "TRANS FRIENDS", color: "var(--res-trans-blue)" }]
    : [];
  return [...categoryTags.slice(0, 1), ...specialtyTags, ...categoryTags.slice(1), ...(row.org.serviceTags || []).map((name) => ({ id: `service-${row.category.id}-${name}`, name, color: row.category.id === "safety" ? "var(--neon-orange)" : row.category.color }))];
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

function Mark({ org }: { org: ResourceOrg }) {
  const letters =
    org.mark ||
    org.name
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter(
        (w) => !["the", "and", "of", "for", "&"].includes(w.toLowerCase()),
      )
      .slice(0, 3)
      .map((w) => w[0])
      .join("");
  return org.logo ? (
    <img
      className={`rg-logo${org.logoSurface === "light" ? " rg-logo--light" : ""}`}
      src={org.logo}
      alt={`${org.name} logo`}
      loading="lazy"
    />
  ) : (
    <span className="rg-mark" aria-hidden="true">
      {letters}
    </span>
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
  { title: "Queer people to talk to", lines: [
    { name: "LGBT National Hotline", number: "888-843-4564", tel: "18888434564", note: "LGBTQ+ peer support, identity, relationships, and coming out.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/national-hotline/" },
    { name: "LGBT National Youth Talkline", number: "800-246-7743", tel: "18002467743", note: "Peer support for young people navigating identity, family, school, and relationships.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/youth-talkline/" },
    { name: "LGBT National Senior Hotline", number: "888-234-7243", tel: "18882347243", note: "Support around LGBTQ+ aging, relationships, family, and elder abuse.", hours: "Mon–Fri 11am–8pm · Sat 9am–2pm PT", source: "https://lgbthotline.org/senior-hotline/" },
    { name: "Trans Lifeline", number: "877-565-8860", tel: "18775658860", note: "Trans peer support for trans and questioning people. You don’t have to be in crisis.", hours: "Mon–Fri 10am–6pm PT · Check site for closures", source: "https://translifeline.org/hotline/" },
  ] },
  { title: "Crisis & safety support", lines: [
    { name: "The Trevor Project", number: "866-488-7386", tel: "18664887386", note: "Crisis counselors for LGBTQ+ young people. Text START to 678678 or use online chat.", hours: "24/7", source: "https://www.thetrevorproject.org/get-help/" },
    { name: "Suicide & Crisis Lifeline", number: "988", tel: "988", note: "Call or text for emotional distress or a mental health crisis.", hours: "24/7", source: "https://988lifeline.org/" },
    { name: "Call to Safety", number: "503-235-5333", tel: "15032355333", note: "Domestic and sexual violence support, including abuse by roommates. Safety planning and referrals.", hours: "24/7 · Free and confidential", source: "https://calltosafety.org/services/crisis-line/" },
  ] },
  { title: "OHP & local services", lines: [
    { name: "OHP member support", number: "800-273-0557", tel: "18002730557", note: "Oregon Health Plan member questions, concerns, and complaints. For plan-specific care, contact your CCO.", hours: "TTY 711 · See official site for availability", source: "https://www.oregon.gov/oha/OHP/Pages/Contact-Us.aspx" },
    { name: "Apply for OHP", number: "800-699-9075", tel: "18006999075", note: "Help applying for Oregon Health Plan coverage.", hours: "Mon–Fri 7am–6pm PT · TTY 711", source: "https://www.oregon.gov/oha/OHP/Pages/Contact-Us.aspx" },
    { name: "211info", number: "211", tel: "211", note: "Find local housing, food, health care, and other services.", hours: "Check official site for current hours", source: "https://www.211info.org/" },
  ] },
];

function TalkOptions() {
  return (
    <div className="rg-support rg-support-open rg-talk-options">
      <p className="rg-talk-intro">Choose who you’d like to talk to. Peer support, crisis care, and health coverage help are different services—each option below tells you what to expect.</p>
      {TALK_GROUPS.map((group) => (
        <section className="rg-talk-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          <div className="rg-support-numbers">
            {group.lines.map((line) => (
              <div className="rg-talk-option" id={`talk-${line.tel}`} tabIndex={-1} key={line.tel}>
                <SupportNumber name={line.name} number={line.number} tel={line.tel} />
                <p>{line.note}</p>
                <small>{line.hours}</small>
                <a className="rg-safety-source" href={line.source} target="_blank" rel="noopener noreferrer">Official service details <ArrowUpRight size={13} aria-hidden="true" /></a>
              </div>
            ))}
          </div>
        </section>
      ))}
      <small>Numbers and service pages checked September 30, 2026. Hours are Pacific time.</small>
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
        <DirectoryMap businesses={pins} height="100%" showKey={false} interactive={false} focusBusiness rasterBasemap accent={color} />
      </div>}
      {pins.length > 0 && <small className="rg-map-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> · © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a></small>}
      {locations.map((location) => <a key={location.address} className="pdx-glass-rebind pdxBtn" href={placeGoogleMapsUrl({ address: location.address, name: location.name })} target="_blank" rel="noopener noreferrer">{location.address} <ArrowUpRight size={16} /></a>)}
    </>}
  </section>;
}

// Keep service identifiers when the wordmark names only the parent organization.
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
      displayName={org.logo ? (RESOURCE_CARD_CAPTIONS[org.name] ?? null) : org.name}
      decoration={<><div className="rg-card-vignette" aria-hidden="true" /><div className="pdx-refract-seam rg-card-top-rule" aria-hidden="true" /><ResourceCardMotif name={org.name} category={category.id} /></>}
      data-optical-logo={org.name}
      style={resourceLogoLayout(org.name) as CSSProperties}
      categoryLabel={category.name}
      categoryTags={tagsFor(row).slice(0, 2)}
      accentColor={category.color}
      logoUrl={org.logo}
      logoFallback={<Mark org={{ ...org, logo: undefined }} />}
      description={org.desc}
      shareUrl={`https://www.zaylist.com/rezources?resource=${encodeURIComponent(org.name)}`}
      className={`rg-directory-card rg-category-${category.id} pdxPlace--clickable${org.logoSurface === "light" ? " rg-directory-card--light-logo" : ""}`}
      onClick={() => onOpen(row)}
      footer={
        <div className="rg-directory-footer" onClick={(event) => event.stopPropagation()}>
          <button className={`pdx-glass-rebind pdxBtn${["safety", "legal", "arts", "youth", "harm-reduction"].includes(category.id) ? " rg-contact-white" : ""}`} aria-label={`View details for ${org.name}`} onClick={() => onOpen(row)}>
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
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (location === "/resources") navigate(`/rezources${window.location.search}${window.location.hash}`, { replace: true });
  }, [location, navigate]);
  usePageSeo(
    "ReZources | Zaylist",
    "Art, community, opportunity, care, and support for queer and trans Oregon. Explore local organizations and food pantries to find your next connection.",
  );
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [intentChosen, setIntentChosen] = useState(false);
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => { window.history.scrollRestoration = previousRestoration; };
  }, []);

  const [directoryRevealed, setDirectoryRevealed] = useState(false);
  const [mode, setMode] = useState<"directory" | "talk">("directory");
  const [searchTarget, setSearchTarget] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [safetyAnswer, setSafetyAnswer] = useState<"yes" | "no" | null>(null);
  const supportTrigger = useRef<HTMLElement | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("resource");
    if (!requested) return;
    const row = ROWS.find(({ org }) => org.name === requested || org.aliases?.includes(requested));
    if (row) {
      setDetail(row);
      setDetailOpen(true);
    }
  }, []);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("find");
    if (!requested) return;
    const row = ROWS.find(({ org }) => org.name === requested || org.aliases?.includes(requested));
    if (!row) return;
    setIntentChosen(true);
    setDirectoryRevealed(true);
    setCategoryIds([row.category.id]);
    setMode("directory");
    setSearchTarget(row.org.name);
  }, [location]);

  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 600px)").matches,
  );
  const detailTrigger = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedCategories = RESOURCE_CATEGORIES.filter((c) => categoryIds.includes(c.id));
  const category = selectedCategories.length === 1 ? selectedCategories[0] : undefined;
  const rows = useMemo(
    () =>
      ROWS.filter((r) => categoriesFor(r).some((c) => categoryIds.includes(c.id))),
    [categoryIds],
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const showResults = intentChosen && (mode === "directory" ? directoryRevealed : safetyAnswer === "yes");
  function choose(id: string | null) {
    setDirectoryRevealed(true);
    setCategoryIds((ids) => id === null ? [] : ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
    setMode("directory");
  }
  const openDetail = useCallback((row: Row) => {
    detailTrigger.current = document.activeElement as HTMLElement;
    setDetail(row);
    setDetailOpen(true);
  }, []);
  useEffect(() => {
    if (!searchTarget || !showResults) return;
    let frame = 0;
    let settleTimer = 0;
    let tries = 0;
    const findCard = () => {
      const card = Array.from(document.querySelectorAll<HTMLElement>("[data-resource-search-card]"))
        .find((item) => item.dataset.resourceSearchCard === searchTarget);
      if (!card && tries++ < 90) { frame = requestAnimationFrame(findCard); return; }
      if (card) {
        // Let the survey reveal and dialog close finish before positioning the card.
        settleTimer = window.setTimeout(() => {
          card.scrollIntoView({ behavior: quietMotion ? "instant" : "smooth", block: "center", inline: "center" });
          card.focus({ preventScroll: true });
          card.classList.add("rg-search-hit");
          window.setTimeout(() => card.classList.remove("rg-search-hit"), 2200);
          setSearchTarget(null);
        }, quietMotion ? 0 : 420);
      } else {
        setSearchTarget(null);
      }
    };
    frame = requestAnimationFrame(findCard);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(settleTimer); };
  }, [searchTarget, showResults, quietMotion]);
  return (
    <div className="resources-page">
      <WebGLShader />
      <header className="rg-intro rg-wrap">
        <div className="rg-intro-top">
          <span className="rg-eyebrow">
            ReZources / All the ways we show up
          </span>

        </div>
        <RezourcesLogo quietMotion={Boolean(quietMotion)} />
          <div className="rg-intro-actions">
            <BoardShareButton title="ReZources" path="/rezources" card={{ room: "ReZources", mark: "/brand/family/rezources.svg", line: "All the ways we show up." }} />
            <BoardFollowButton board="rezources" />
          </div>

      </header>
      <section className="rg-layout rg-wrap">
        <aside className="rg-controls" data-mode={mode} aria-label="Choose ReZources">
          <div className="rg-step rg-step--intent">
            <div>
              <span className="rg-eyebrow"><span className="rg-step-number" aria-hidden="true">01</span>Start here</span>
              <h2>What do you need?</h2>
              <LayoutGroup id="rezources-mode">
              <div className="rg-mode rg-mode--animated pdx-glass-rebind">
                <button
                  aria-pressed={intentChosen && mode === "directory"}
                  onClick={() => { setIntentChosen(true); setMode("directory"); }}
                >
                  {intentChosen && mode === "directory" && <motion.span className="rg-mode-highlight" aria-hidden="true" layoutId={quietMotion ? undefined : "active-mode"} transition={{ type: "spring", bounce: 0, duration: 0.25 }} />}
                  <span className="rg-mode-label">Find a resource</span>
                </button>
                <button
                  aria-pressed={intentChosen && mode === "talk"}
                  aria-expanded={mode === "talk"}
                  aria-controls="resource-safety-check"
                  onClick={() => { setIntentChosen(true); setMode("talk"); setSafetyAnswer(null); }}
                >
                  {mode === "talk" && <motion.span className="rg-mode-highlight" aria-hidden="true" layoutId={quietMotion ? undefined : "active-mode"} transition={{ type: "spring", bounce: 0, duration: 0.25 }} />}
                  <span className="rg-mode-label">Talk to someone</span>
                </button>
              </div>
              </LayoutGroup>
              <AnimatePresence initial={false}>
              {mode === "talk" && (
                <motion.div key="safety-check" initial={quietMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: quietMotion ? 0 : 0.24, ease: "easeInOut" }} id="resource-safety-check" className="rg-safety-check" role="group" aria-labelledby="resource-safety-question">
                  <h3 id="resource-safety-question">Are you safe right now?</h3>
                  <p>Choose what you need. You can change your answer.</p>
                  <div>
                    <button className="pdx-glass-rebind pdxBtn" aria-pressed={safetyAnswer === "yes"} onClick={() => {
                      setSafetyAnswer("yes");
                      requestAnimationFrame(() => { resultsRef.current?.scrollIntoView({ behavior: "auto", block: "start" }); resultsRef.current?.focus({ preventScroll: true }); });
                    }}>Yes, I’m safe</button>
                    <button className="pdx-glass-rebind pdxBtn" aria-pressed={safetyAnswer === "no"} onClick={(event) => {
                      supportTrigger.current = event.currentTarget;
                      setSafetyAnswer("no");
                      setSupportOpen(true);
                    }}>No, I need help now</button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence initial={false}>
          {intentChosen && mode === "directory" && <motion.div key="categories" initial={quietMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: quietMotion ? 0 : 0.24, ease: "easeInOut" }} className="rg-step rg-step--categories">
            <div>
              <span className="rg-eyebrow rg-muted"><span className="rg-step-number" aria-hidden="true">02</span>Explore categories</span>
              <h2>I'm looking for…</h2>
              <p className="rg-multiselect-hint">Choose one or more categories.</p>
              <div
                className="rg-options"
                role="group"
                aria-label="Resource categories"
              >
                {RESOURCE_CATEGORIES.map((c, i) => {
                  const Icon = ICONS[i];
                  return (
                    <ResourceFilterButton
                      quietMotion={Boolean(quietMotion)}
                      key={c.id}
                      data-category-id={c.id}
                      className="pdx-glass-rebind"
                      aria-pressed={categoryIds.includes(c.id)}
                      style={{ "--res-accent": c.color } as CSSProperties}
                      onClick={() => choose(c.id)}
                    >
                      <Icon size={18} />
                      <span>{LABELS[i]}</span>
                      <i aria-hidden="true">{categoryIds.includes(c.id) && <Check size={14} />}</i>
                    </ResourceFilterButton>
                  );
                })}
              <div className="pdx-glass-rebind rg-all rg-selection-control" role="group" aria-label="Select resource categories">
                <label>
                  <input type="checkbox" checked={categoryIds.length === RESOURCE_CATEGORIES.length} onChange={() => { setDirectoryRevealed(true); setCategoryIds(RESOURCE_CATEGORIES.map((c) => c.id)); }} />
                  <span>SELECT ALL</span>
                </label>
                <label>
                  <input type="checkbox" checked={categoryIds.length === 0} onChange={() => { setDirectoryRevealed(true); setCategoryIds([]); }} />
                  <span>DESELECT ALL</span>
                </label>
              </div>
              </div>
            </div>
          </motion.div>}
          </AnimatePresence>
        </aside>
        {showResults && <motion.div
          initial={quietMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: quietMotion ? 0 : 0.4 }}
          className="rg-results"
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Resource results"
        >
          <div className="rg-results-head">
            <span className="rg-eyebrow">03 / Make a connection</span>
            <h2>
              {mode === "talk"
                ? "A person on the other end."
                : category
                  ? `${category.name}.`
                  : categoryIds.length === RESOURCE_CATEGORIES.length ? "All ReZources." : categoryIds.length > 1 ? `${categoryIds.length} categories selected.` : "Choose your ReZources."}
            </h2>
            <p>
              {mode === "talk"
                ? "Choose the support line that fits what you need."
                : category
                  ? category.forr
                  : categoryIds.length > 1 ? "Explore organizations, services, and people who can help." : "Art, community, opportunity, care, and support. Choose one or more categories to find your next connection."}
            </p>
          </div>
          {mode === "directory" && categoryIds.includes("safety") && (
            <SafetyNotice />
          )}



          <p className="rg-count" aria-live="polite">
            <span key={`${mode}-${rows.length}`} className={quietMotion ? undefined : "rg-count-change"}>
            {mode === "talk"
              ? "Support lines"
              : `${rows.length} resource cards${rows.some((row) => row.org === FOOD_RESOURCE) ? " · includes 8 food pantries" : ""}`}
            </span>
          </p>
          {mode === "talk" ? (
            <TalkOptions />
          ) : (
            <div className="rg-resource-rails">
              {rows.length === 0 && <p className="rg-empty">Choose a category above, or select all to see every resource.</p>}
              {selectedCategories.map((type) => {
                const group = rows.filter(row => categoriesFor(row).some(c => c.id === type.id));
                if (!group.length) return null;
                const railId = `resource-rail-${type.id}`;
                return <ResourceRail key={type.id} id={railId} title={type.name} color={type.color} count={group.length} quiet={Boolean(quietMotion)} focusIndex={searchTarget ? group.findIndex(row => row.org.name === searchTarget) : undefined}>
                  {group.map(row => <div className="rg-card-reveal" key={row.org.name} dir="ltr" tabIndex={-1} data-resource-search-card={row.org.name}>
                    <ResourceCard row={{ ...row, sectionCategory: type }} onOpen={openDetail} />
                  </div>)}
                </ResourceRail>;
              })}
            </div>
          )}
        </motion.div>}
      </section>
      {showResults && <footer className="rg-footer rg-wrap">
        <div>
          <span className="rg-eyebrow">
            Built by community. Kept by community.
          </span>
          <h2>Know someone we should know?</h2>
        </div>
        <Link className="pdx-glass-rebind pdxBtn" href="/contact">
          Suggest a resource <ArrowUpRight size={16} />
        </Link>
      </footer>}

      <div className="rg-reassurance rg-bottom-help rg-wrap">
        <p>Not sure? <a href="tel:211">Call 211info</a> for help finding a starting point.</p>
      </div>

      <Drawer.Root open={supportOpen} onOpenChange={setSupportOpen} direction={mobile ? "bottom" : "right"} shouldScaleBackground={false} dismissible closeThreshold={0.2}>
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

      <Drawer.Root
        open={detailOpen}
        onOpenChange={setDetailOpen}
        direction={mobile ? "bottom" : "right"}
        shouldScaleBackground={false}
        dismissible
        closeThreshold={0.2}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="rg-overlay-backdrop" />
          <Drawer.Content
            className={`pdx-glass-rebind rg-overlay rg-drawer rg-resource-detail rg-category-${(detail?.sectionCategory ?? detail?.category)?.id || "health"} ${mobile ? "rg-drawer-mobile" : "rg-drawer-desktop"}`}
            data-quiet-motion={quietMotion ? "true" : undefined}
            style={{
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
                  .querySelector<HTMLButtonElement>(".rg-mode button")
                  ?.focus();
            }}
          >
            {detail && <div className="rg-detail-art" aria-hidden="true">
              <ResourceCardMotif name={detail.org.name} category={(detail.sectionCategory ?? detail.category).id} />
              <div className="rg-category-wash" />
            </div>}
            <div className="rg-category-edge" aria-hidden="true" />
            {(
              <Drawer.Handle
                className="rg-drawer-handle"
                aria-label="Drag to close resource"
              />
            )}
            <Drawer.Close className="rg-close" aria-label="Close resource">
              <X size={20} />
            </Drawer.Close>
            {detail && (
              <div className="rg-drawer-body">
                <div className="rg-detail-primary">
                <div className="rg-detail-logo">
                  <Mark org={detail.org} />
                </div>
                <Drawer.Title>{detail.org.name}</Drawer.Title>
                <div className="rg-detail-tags">
                  {tagsFor(detail).map((category, index) => (
                    <span className="rg-category-tag" data-category-id={category.id} key={category.id}>
                      <Badge variant={index === 0 ? "solid" : "outline"} color={category.id === "safety" ? "var(--neon-orange)" : category.color} size="sm">{category.name}</Badge>
                    </span>
                  ))}
                </div>

                {detail.org.sub && <p>{detail.org.sub}</p>}
                <Drawer.Description>{detail.org.desc}</Drawer.Description>
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
                    <details className="rg-detail-disclosure"><summary>Food pantries<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-disclosure-content"><FoodPantryList /></div></details>
                  </>
                )}
                {detail.org.locations && detail.org !== FOOD_RESOURCE && (
                  <details className="rg-org-locations rg-detail-disclosure" aria-label="Locations">
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
                  <details className="rg-org-programs rg-detail-disclosure" aria-label="Programs and services">
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
                <details className="rg-detail-disclosure"><summary>Getting started & service details<ChevronDown size={20} aria-hidden="true" /></summary><div className="rg-detail-meta rg-disclosure-content">
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
                {detail.org.phone && <ResourcePhone org={detail.org} />}
                <ResourceLocationMap key={detail.org.name} org={detail.org} color={(detail.sectionCategory ?? detail.category).color} />
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
                <small>
                  Check the organization's website for current hours, services,
                  and eligibility.
                </small>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
