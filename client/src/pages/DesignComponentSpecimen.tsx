import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { DESIGN_COMPONENT_REGISTRY, findDesignComponent } from "@shared/designComponentRegistry";
import UserAvatar from "@/components/UserAvatar";
import ActionRow from "@/components/promoter/ActionRow";
import BoardzComponentSpecimen from "@/components/board/BoardzComponentSpecimen";
import TodayLocationCard from "@/components/home/TodayLocationCard";
import { AuthProvider } from "@/context/AuthContext";
import OutzSmallCard from "@/components/home/OutzSmallCard";
import PunkBoardCard from "@/components/board/punk/PunkBoardCard";
import { outzWallToBoardPost } from "@/lib/outzBoardPost";
import { OutzBlendArt } from "@/components/outz/OutzBlendArt";
import {
  Badge,
  Button,
  ChangeBadge,
  Countdown,
  Divider,
  FilterChip,
  HeroBanner,
  HouseholdStack,
  IconButton,
  Logo,
  MapLegend,
  MapPanel,
  Marquee,
  PlaceCard,
  PosterCard,
  SearchInput,
  SectionHeader,
  StatCard,
  StatPill,
  StickerBadge,
} from "@/components/ds";

import "@/components/ds/tokens/index.css";
import "@/components/ds/styles.css";
import "@/components/promoter/PromoterIntake.css";
import "./design-component-specimen.css";

const event = {
  title: "Connection Over Content",
  venue: "The Get Down",
  when: "Friday · 8:00 PM",
  day: "FRI",
  types: ["Dance", "21+"],
  admission: "TICKETED",
  going: 84,
};

function Specimen({ id }: { id: string }) {
  const [selected, setSelected] = useState(true);
  const [query, setQuery] = useState("Zaylist");
  const countdownTarget = useMemo(() => new Date(Date.now() + 5 * 86_400_000).toISOString(), []);

  switch (id) {
    case "component:data-display/BoardPostFace":
    case "component:forms/BoardComposerPreview":
    case "component:data-display/BoardPushPin":
    case "component:data-display/BoardCardMotif":
      return <BoardzComponentSpecimen componentId={id} />;
    case "component:data-display/TodayLocationCard":
      return (
        <AuthProvider><div className="zay-specimen__row">
          {[["bc-garibaldi", "Garibaldi Lake Trail", "Whistler & Sea-to-Sky · BC, Canada", "trail"], ["silver-falls", "Silver Falls State Park", "Campground · Trail of Ten Falls · Silverton, OR", "camp"], ["rooster-rock", "Rooster Rock", "Columbia River · Corbett, OR", "beach"]].map(([id, name, detail, kind]) => (
            <TodayLocationCard key={id} location={{ key: `outz:${id}`, name, room: "OutZide", detail, href: `/outzide?place=${id}`, kind }} />
          ))}
        </div></AuthProvider>
      );
    case "component:data-display/OutzSmallCard":
      return (
        <AuthProvider><div className="zay-specimen__row">
          {[["bc-garibaldi", "Garibaldi Lake Trail", "trail"], ["silver-falls", "Silver Falls State Park", "camp"], ["rooster-rock", "Rooster Rock", "beach"]].map(([id, name, kind]) => (
            <OutzSmallCard key={id} location={{ key: `outz:${id}`, name, room: "OutZide", detail: "", href: `/outzide?place=${id}`, kind }} />
          ))}
        </div></AuthProvider>
      );
    case "component:data-display/OutzBoardCard":
      return (
        <div className="zay-specimen__row">
          {([["HIKE_BUDDY", "Looking for a hike buddy", "Saturday sunrise, moderate pace.", "Garibaldi Lake Trail"], ["CARPOOL", "Carpool from the Eastside", "Leaving 7am, two seats open.", "Silver Falls State Park"]] as const).map(([kind, title, body, placeName], i) => (
            <div key={kind} className="boardz-production-card">
              <PunkBoardCard post={outzWallToBoardPost({ id: i + 1, postKind: kind, title, body, placeName })!} />
            </div>
          ))}
        </div>
      );
    case "component:data-display/OutzBlendArt":
      return (
        <div className="zay-specimen__row">
          {(["bc-garibaldi", "rooster-rock"] as const).map(id => (
            <div key={id} style={{ position: "relative", width: 540, aspectRatio: "1360 / 800", borderRadius: 17, overflow: "hidden", border: "2px solid var(--neon-orange)" }}>
              <OutzBlendArt placeId={id} variant="wide" />
            </div>
          ))}
        </div>
      );
    case "component:brand/Logo":
      return <Logo variant="lockup" size={76} href={undefined} />;
    case "component:brand/UserAvatar":
      return <UserAvatar displayName="Tucker" username="maxmackpdx" avatarChoice={4} avatarRing="rainbow" size={84} />;
    case "component:data-display/Badge":
      return <div className="zay-specimen__row"><Badge color="lime" glow>Live</Badge><Badge day="FRI" /><Badge category="party" /></div>;
    case "component:data-display/ChangeBadge":
      return <ChangeBadge label="Updated today" />;
    case "component:data-display/Countdown":
      return <Countdown target={countdownTarget} accent="rainbow" />;
    case "component:data-display/HouseholdStack":
      return <HouseholdStack people={[{ id: 1, name: "Tucker", username: "maxmackpdx", avatarChoice: 4, avatarRing: "rainbow", kind: "MEMBER", role: "LEAD" }, { id: 2, name: "Alex", avatarChoice: 2, kind: "OFFPLATFORM", role: "MEMBER" }]} pets={[{ id: 3, name: "Ziggy", species: "dog", kind: "PET", role: "MEMBER" }]} slots={1} />;
    case "component:data-display/PlaceCard":
      return <PlaceCard name="Portland Center Stage" category="arts" address="128 NW 11th Ave" hours="Open today until 10 PM" description="A connected production specimen using the actual directory card." events={[{ day: "FRI", date: "Sep 25", title: "Community Night" }]} />;
    case "component:data-display/PosterCard":
      return <div className="zay-specimen__poster"><PosterCard {...event} claimable /></div>;
    case "component:data-display/StatCard":
      return <StatCard value={58} label="Connected objects" action="Inspect" color="cyan" />;
    case "component:data-display/StatPill":
      return <StatPill count={23} color="lime" glow dot>React objects</StatPill>;
    case "component:data-display/StickerBadge":
      return <StickerBadge color="pink">Owner approved</StickerBadge>;
    case "component:forms/ActionRow":
      return <ActionRow number="01" title="Publish connected component" forWho="For Tucker" outcome="Review the exact source and release evidence." accent="#00ffff" badge={{ label: "Ready", variant: "solid", accent: "#ccff00" }} onClick={() => undefined} />;
    case "component:forms/Button":
      return <div className="zay-specimen__row"><Button accent="lime">Primary</Button><Button accent="cyan" variant="solid">Solid</Button><Button accent="pink" arrow>Continue</Button></div>;
    case "component:forms/FilterChip":
      return <FilterChip selected={selected} onToggle={() => setSelected(value => !value)} accent="cyan" count={12}>Events</FilterChip>;
    case "component:forms/IconButton":
      return <IconButton label="Add component" variant="solid"><span aria-hidden="true">+</span></IconButton>;
    case "component:forms/SearchInput":
      return <SearchInput label="Search the component" value={query} onChange={(e: { target: { value: string } }) => setQuery(e.target.value)} onClear={() => setQuery("")} />;
    case "component:layout/Divider":
      return <div className="zay-specimen__wide"><Divider variant="rainbow" label="Same source" /></div>;
    case "component:layout/HeroBanner":
      return <div className="zay-specimen__wide"><HeroBanner image={undefined} minHeight={280}><SectionHeader kicker="Canonical component" title="One object. Two surfaces." subtitle="Rendered by the production React source." accent="cyan" /></HeroBanner></div>;
    case "component:layout/Marquee":
      return <div className="zay-specimen__wide"><Marquee items={["You are not a product", "Connection over content", "Fuck Meta"]} color="rainbow" /></div>;
    case "component:layout/SectionHeader":
      return <SectionHeader kicker="Design API" title="Connected component" subtitle="The guide and product resolve the same object identity." accent="cyan" action={<Button size="sm">Inspect</Button>} />;
    case "component:map/MapLegend":
      return <MapLegend />;
    case "component:map/MapPanel":
      return <div className="zay-specimen__wide"><MapPanel height={360} onExpand={undefined} /></div>;
    default:
      return null;
  }
}

function SpecimenFrame({ children }: { children: ReactNode }) {
  return <div className="zay-specimen__stage">{children}</div>;
}

export default function DesignComponentSpecimen() {
  const id = new URLSearchParams(window.location.search).get("id");
  const component = findDesignComponent(id);

  if (!component) {
    return (
      <main className="zay-specimen zay-specimen--index">
        <p className="zay-specimen__kicker">Production component registry</p>
        <h1>Choose a canonical object</h1>
        <ul>
          {DESIGN_COMPONENT_REGISTRY.map(item => (
            <li key={item.id}><Link href={item.specimenUrl}>{item.name}<small>{item.id}</small></Link></li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className="zay-specimen" data-design-component-id={component.id} data-design-source-path={component.sourcePath}>
      <header className="zay-specimen__header">
        <div><p className="zay-specimen__kicker">Live production source</p><h1>{component.name}</h1></div>
        <code>{component.id}</code>
      </header>
      <SpecimenFrame><Specimen id={component.id} /></SpecimenFrame>
      <footer><span>{component.sourcePath}</span><span>Rendered by www.zaylist.com</span></footer>
    </main>
  );
}
