/**
 * The HAUSING post detail view. Four variants, one shell.
 *
 * A detail page is still an introduction, not a listing sheet. People first,
 * numbers stated plainly and kept separate, and one primary action at the bottom
 * that starts a conversation. Consent based: asking to chat or asking to join is
 * a request the other side accepts.
 *
 * Ported from docs/design-handoff-hausing/haus-detail.jsx and haus-workspace.jsx,
 * section order per docs/design-handoff-hausing/README.md section 3.
 *
 * Presentational only. The page fetches, this renders.
 *
 * Two rules run through the whole file:
 *  1. Every money value is display text that came from the poster. Nothing here
 *     computes, parses, or formats currency, and Zaylist never handles money.
 *  2. Managed property gets no community context and no chat. A whole unit from a
 *     landlord carries full Fair Housing scrutiny, so it stays a plain
 *     informational listing that links out. That omission is deliberate.
 */
import type { CSSProperties, ReactNode } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ds";
import {
  AFFORDABILITY_BADGE_LABEL,
  FORMING_FLAVOR_LABEL,
  HOUSING_TYPE_KICKER,
  OUTDOOR_LABEL,
  PARKING_LABEL,
  type FormingFlavor,
  type HousingInterestGroup,
  type HousingPerson,
  type HousingPostView,
  type HousingRequestKind,
  type HousingTrust,
} from "@shared/housing";
import { HousingWell } from "./HousingWell";
import { HousingCluster } from "./HousingCluster";
import { HousingIcon, type HousingIconName } from "./HousingIcon";
import {
  Btn,
  Chip,
  Mono,
  PropertyManagerBadge,
  Row,
  SectionTitle,
  Tile,
  Trust,
  TypeTitle,
  accentStyle,
} from "./HousingPrimitives";

export type HousingDetailHandlers = {
  onBack: () => void;
  onRequest: (kind: HousingRequestKind) => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
  /** Looking to Forming. Poster side only, same post and same replies. */
  onConvert?: () => void;
  /** Managed only. Starts a Forming post seeded from the listing. */
  onBuildHaus?: () => void;
  /** Navigate to another housing post, e.g. a HAUS organizing around this unit. */
  onOpenPost?: (postId: number) => void;
  onPerson?: (p: HousingPerson) => void;
};

/** How each flavor of a forming household actually works, in one line. */
const FLAVOR_NOTE: Record<FormingFlavor, string> = {
  PLACE_IN_MIND:
    "There is a place in mind already. The household is picking up the people it still needs to take it.",
  FIND_TOGETHER:
    "No place yet, on purpose. The people come together first, then the household goes looking as one.",
};

const barStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  width: "100%",
  alignItems: "center",
  flexWrap: "wrap",
};

const noteStyle: CSSProperties = {
  marginTop: 10,
  color: "var(--text-lo)",
  fontSize: "var(--meta)",
};

function splitPeople(post: HousingPostView) {
  const people = post.household.filter((p) => p.kind !== "PET");
  const pets = post.household.filter((p) => p.kind === "PET");
  return { people, pets };
}

function firstNameOf(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || name;
}

/** The one verification worth stating in the head chip row, if there is one. */
function verificationLabel(trust: HousingTrust): string | null {
  if (trust.propertyManagerVerified) return "Property manager verified";
  if (trust.leaseholderVerified) return "Leaseholder verified";
  return null;
}

/** The poster themself, as a person the cluster and the member rows can render. */
function selfPerson(post: HousingPostView): HousingPerson {
  return {
    id: -post.id,
    kind: "MEMBER",
    userId: post.author.userId,
    username: post.author.username,
    name: post.author.displayName,
    photoUrl: post.author.photoUrl,
    avatarChoice: post.author.avatarChoice,
    avatarRing: post.author.avatarRing,
    role: "MEMBER",
  };
}

function leadPerson(group: HousingInterestGroup): HousingPerson {
  return {
    id: group.postId,
    kind: "MEMBER",
    userId: group.lead.userId,
    username: group.lead.username,
    name: group.lead.displayName,
    photoUrl: group.lead.photoUrl,
    avatarChoice: group.lead.avatarChoice,
    avatarRing: group.lead.avatarRing,
    role: "LEAD",
  };
}

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="hz-back" onClick={onBack}>
      <Mono>&#8592; Back to HAÜSING</Mono>
    </button>
  );
}

/**
 * Btn renders a real <button>, and the manager's listing has to be a real link,
 * so this is the same design system button pointed at the surface accent and
 * rendered as an anchor.
 */
function BtnLink({
  href,
  children,
  kind = "solid",
}: {
  href: string;
  children: ReactNode;
  kind?: "neon" | "solid" | "outline";
}) {
  return (
    <Button
      as="a"
      variant={kind}
      size="md"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--_c": "var(--hz-accent)", "--c": "var(--hz-accent)" } as CSSProperties}
    >
      {children}
    </Button>
  );
}

/** One housemate, one row. Off platform housemates carry a badge, never a ring. */
function PersonRow({
  p,
  line,
  badge,
  onPerson,
}: {
  p: HousingPerson;
  line?: string | null;
  badge?: string | null;
  onPerson?: (p: HousingPerson) => void;
}) {
  return (
    <div className="hz-member">
      <UserAvatar
        photoUrl={p.photoUrl}
        avatarChoice={p.avatarChoice}
        displayName={p.name}
        username={p.username || undefined}
        avatarRing={p.kind === "MEMBER" ? p.avatarRing : "none"}
        size={64}
        title={p.kind === "OFFPLATFORM" ? `${p.name}, not on Zaylist yet` : p.name}
        onClick={onPerson ? () => onPerson(p) : undefined}
      />
      <div>
        <b>{p.name}</b>
        {badge ? (
          <div style={{ marginTop: 6 }}>
            <Chip tone="accent">{badge}</Chip>
          </div>
        ) : null}
        {line ? <p>{line}</p> : null}
      </div>
    </div>
  );
}

/** Pets get a profile too. It is a housing board for the whole household. */
function PetRow({ pet, onPerson }: { pet: HousingPerson; onPerson?: (p: HousingPerson) => void }) {
  return (
    <div className="hz-member">
      <button
        type="button"
        className="hz-pet hz-pet--lg"
        title={pet.species ? `${pet.name}, ${pet.species}` : pet.name}
        onClick={onPerson ? () => onPerson(pet) : undefined}
      >
        {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <span>{pet.name.charAt(0)}</span>}
      </button>
      <div>
        <b>{pet.name}</b>{" "}
        <span className="hz-vip">
          <HousingIcon name="paw" size={11} />
          Zay-VIP-List
        </span>
        {pet.species ? (
          <div>
            <Mono micro>{pet.species}</Mono>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Community context. Participation the community already generated, shown as
 * plain facts. Never a score, never a filter, never an input to ordering, and
 * never rendered on a managed listing.
 */
function Context({ trust }: { trust: HousingTrust }) {
  const tiles: Array<{ label: string; value: ReactNode }> = [];
  if (trust.mutualConnections) tiles.push({ label: "Mutual connections", value: trust.mutualConnections });
  if (trust.eventsTogether) tiles.push({ label: "Events you both went to", value: trust.eventsTogether });
  if (trust.memberSince) tiles.push({ label: "On Zaylist since", value: trust.memberSince });
  const verified = verificationLabel(trust);
  if (verified) tiles.push({ label: "Verified", value: verified.replace(" verified", "") });
  if (!tiles.length) return null;

  return (
    <div className="hz-sect">
      <SectionTitle kicker="Community context">Where you overlap</SectionTitle>
      <div className="hz-tiles">
        {tiles.map((t) => (
          <Tile key={t.label} label={t.label} value={t.value} />
        ))}
      </div>
      <p style={noteStyle}>
        Context, not a score. Zaylist does not rank people or decide who should live together.
      </p>
    </div>
  );
}

/** The standing money and safety note. Every detail view ends on it. */
function Safety({ h }: { h: HousingDetailHandlers }) {
  return (
    <div className="hz-sect">
      <div className="hz-note">
        <HousingIcon name="safety" size={15} />
        <div>
          Zaylist never handles rent, deposits, or fees. Anyone asking you to send money through this site
          is not from this site.
          <div style={{ marginTop: 8 }}>
            <Chip onClick={() => h.onReport()}>Report this post</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Monthly and move in, kept in two panels so nobody reads a deposit as rent.
 * Both values are the poster's own display text.
 */
function HonestNumbers({ post, paidTo }: { post: HousingPostView; paidTo: string }) {
  return (
    <div className="hz-sect">
      <SectionTitle kicker="Honest numbers">Monthly and move in, kept separate</SectionTitle>
      <div className="hz-money">
        <div className="hz-panel">
          <Mono accent>Every month</Mono>
          <div className="hz-rows" style={{ marginTop: 10 }}>
            <Row label="Rent" value={post.rent || "Ask"} />
            <Row label="Utilities" value={post.rentNote || "Ask"} />
          </div>
        </div>
        <div className="hz-panel">
          <Mono accent>To move in</Mono>
          <div className="hz-rows" style={{ marginTop: 10 }}>
            <Row label="Deposit" value={post.deposit || "Ask"} />
            <Row label="Paid to" value={paidTo} />
          </div>
        </div>
      </div>
      <p style={noteStyle}>Money is arranged directly, off Zaylist. Nothing is ever paid through this site.</p>
    </div>
  );
}

/** Access facts. Standard information about the place, never a filter on people. */
function Access({ access }: { access?: string[] }) {
  if (!access || !access.length) return null;
  return (
    <div className="hz-sect">
      <SectionTitle kicker="Access">Standard information, never a filter</SectionTitle>
      <div className="hz-rows">
        {access.map((a) => (
          <Row key={a} label={a} />
        ))}
      </div>
    </div>
  );
}

/** Approximate area only. The exact address is the poster's to share. */
function RoughlyHere({ area, note }: { area: string; note: string }) {
  return (
    <div className="hz-sect">
      <SectionTitle
        kicker="Roughly here"
        right={
          <Mono micro>
            <HousingIcon name="navigate" size={12} />
            {area}
          </Mono>
        }
      >
        {area}
      </SectionTitle>
      <div className="hz-map">
        <span className="hz-map__blob" />
      </div>
      <p style={noteStyle}>{note}</p>
    </div>
  );
}

/** Save on the left, primary on the right, sticky to the bottom of the view. */
function ActionBar({
  post,
  h,
  primary,
}: {
  post: HousingPostView;
  h: HousingDetailHandlers;
  primary: ReactNode;
}) {
  return (
    <div className="hz-actionbar">
      <div className="hz-wrap" style={barStyle}>
        <Btn onClick={h.onSave}>
          <HousingIcon name="favorite" />
          {post.saved ? "Saved" : "Save"}
        </Btn>
        <Btn onClick={h.onShare}>
          <HousingIcon name="share" />
          Share
        </Btn>
        <span style={{ marginLeft: "auto" }} />
        {primary}
      </div>
    </div>
  );
}

/**
 * The one primary action. Consent based, so it reads back the state of the ask:
 * pending is sent and disabled, accepted opens the conversation.
 */
function RequestButton({
  post,
  h,
  kind,
  label,
  icon,
}: {
  post: HousingPostView;
  h: HousingDetailHandlers;
  kind: HousingRequestKind;
  label: string;
  icon: HousingIconName;
}) {
  const status = post.myRequest?.status;
  if (status === "ACCEPTED") {
    return (
      <Btn kind="solid" onClick={() => h.onRequest("CHAT")}>
        <HousingIcon name="message" />
        Open the chat
      </Btn>
    );
  }
  const pending = status === "PENDING";
  return (
    <Btn kind="solid" disabled={pending} onClick={() => h.onRequest(kind)}>
      <HousingIcon name={icon} />
      {pending ? "Request sent" : label}
    </Btn>
  );
}

/* -------------------------------------------------------------------------- */
/* Looking for housing. Cyan. The person is the post.                          */
/* -------------------------------------------------------------------------- */

function LookingDetail({
  post,
  h,
  isOwner,
}: {
  post: HousingPostView;
  h: HousingDetailHandlers;
  isOwner: boolean;
}) {
  const { people, pets } = splitPeople(post);
  const self = selfPerson(post);
  const first = firstNameOf(post.author.displayName);
  const verified = verificationLabel(post.trust);

  return (
    <div className="pdx-glass-rebind" style={accentStyle(post.type)}>
      <div className="hz-pad">
        <div className="hz-wrap">
          <Back onBack={h.onBack} />

          <div className="hz-dhead">
            <HousingWell photos={post.photos} title={post.author.displayName} nameCap={0.35}>
              <HousingCluster
                people={[self, ...people]}
                pets={pets}
                size="md"
                scale={1.5}
                onSelect={h.onPerson}
              />
              <Mono micro>Meet {first}</Mono>
            </HousingWell>

            <div className="hz-chiprow" style={{ margin: "16px 0 12px" }}>
              <TypeTitle label={HOUSING_TYPE_KICKER.LOOKING} />
              {verified ? <Chip>{verified}</Chip> : null}
              {post.openToHaus ? <Chip tone="haus">Open to forming or joining a HAÜS</Chip> : null}
            </div>

            <h2 className="hz-title hz-dttl">{post.author.displayName}</h2>
            <div style={{ marginTop: 8 }}>
              <Mono micro>
                {post.author.pronouns ? `${post.author.pronouns} · ` : ""}posted {post.postedLabel}
              </Mono>
            </div>
            <p className="hz-prose" style={{ marginTop: 14 }}>
              {post.headline}
            </p>
            <Trust data={post.trust} />
          </div>

          <div className="hz-sect">
            <div className="hz-tiles">
              <Tile label="Budget" value={post.budget || "Open"} />
              <Tile label="Move timeline" value={post.moveTimeline || "Flexible"} />
              <Tile label="Neighborhoods" value={post.areas.join(", ") || "Anywhere"} />
            </div>
          </div>

          <div className="hz-sect">
            <SectionTitle kicker="Who they are">Meet {first}</SectionTitle>
            <div className="hz-members">
              <PersonRow p={self} line={post.headline} onPerson={h.onPerson} />
              {people.map((p) => (
                <PersonRow
                  key={p.id}
                  p={p}
                  badge={p.kind === "OFFPLATFORM" ? "Not on Zaylist" : null}
                  onPerson={h.onPerson}
                />
              ))}
              {pets.map((p) => (
                <PetRow key={p.id} pet={p} onPerson={h.onPerson} />
              ))}
            </div>
            {(post.livingStyle || []).length ? (
              <div className="hz-chiprow" style={{ marginTop: 14 }}>
                {(post.livingStyle || []).map((l) => (
                  <Chip key={l}>{l}</Chip>
                ))}
              </div>
            ) : null}
          </div>

          {/* The long own words. For a Looking post that text is the ask itself. */}
          {post.body ? (
            <div className="hz-sect">
              <SectionTitle kicker="Looking for">What would work</SectionTitle>
              <p className="hz-prose">{post.body}</p>
            </div>
          ) : null}

          <Context trust={post.trust} />

          {isOwner && post.openToHaus ? (
            <div className="hz-sect">
              <SectionTitle kicker="Poster view" right={<Mono micro>Only you see this</Mono>}>
                Turn this into a HAÜS
              </SectionTitle>
              <p className="hz-prose">
                You can turn this into a HAÜS without losing the post or the replies. Same post, same
                conversation, plus a shared workspace where the people who answer can pick places and dates
                together.
              </p>
              <div style={{ marginTop: 12 }}>
                <Btn kind="outline" onClick={() => h.onConvert?.()}>
                  <HousingIcon name="home" />
                  Turn this into a HAÜS
                </Btn>
              </div>
            </div>
          ) : null}

          <Safety h={h} />
        </div>
      </div>

      <ActionBar
        post={post}
        h={h}
        primary={
          <RequestButton post={post} h={h} kind="CHAT" icon="message" label={`Chat with ${first}`} />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Offering a room. Orange. The household is the post.                         */
/* -------------------------------------------------------------------------- */

function OfferingDetail({ post, h }: { post: HousingPostView; h: HousingDetailHandlers }) {
  const { people, pets } = splitPeople(post);
  const verified = verificationLabel(post.trust);
  const area = post.areas[0] || "Portland";

  return (
    <div className="pdx-glass-rebind" style={accentStyle(post.type)}>
      <div className="hz-pad">
        <div className="hz-wrap">
          <Back onBack={h.onBack} />

          <div className="hz-dhead">
            <HousingWell photos={post.photos} title={post.displayName} nameCap={0.35}>
              <HousingCluster
                people={people}
                pets={pets}
                size="md"
                scale={1.5}
                slots={post.openSlots}
                onSelect={h.onPerson}
              />
              <Mono micro>Meet the household</Mono>
            </HousingWell>

            <div className="hz-chiprow" style={{ margin: "16px 0 12px" }}>
              <TypeTitle label={HOUSING_TYPE_KICKER.OFFERING} />
              {verified ? <Chip>{verified}</Chip> : null}
            </div>

            <h2 className="hz-title hz-dttl">{post.displayName}</h2>
            <div style={{ marginTop: 8 }}>
              <Mono micro>
                {area} · posted {post.postedLabel}
              </Mono>
            </div>
            <p className="hz-prose" style={{ marginTop: 14 }}>
              {post.headline}
            </p>
            <Trust data={post.trust} />
          </div>

          <div className="hz-sect">
            <SectionTitle kicker="Who lives here">Meet the household</SectionTitle>
            <div className="hz-members">
              {people.map((p) => (
                <PersonRow
                  key={p.id}
                  p={p}
                  badge={p.kind === "OFFPLATFORM" ? "Not on Zaylist" : null}
                  onPerson={h.onPerson}
                />
              ))}
              {pets.map((p) => (
                <PetRow key={p.id} pet={p} onPerson={h.onPerson} />
              ))}
            </div>
            {post.body ? (
              <p className="hz-prose" style={{ marginTop: 14 }}>
                {post.body}
              </p>
            ) : null}
          </div>

          {(post.culture || []).length ? (
            <div className="hz-sect">
              <SectionTitle kicker="House culture">How the house runs</SectionTitle>
              <div className="hz-chiprow">
                {(post.culture || []).map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            </div>
          ) : null}

          <HonestNumbers post={post} paidTo="The household, off Zaylist" />

          <Access access={post.access} />

          <RoughlyHere
            area={area}
            note="Approximate. The exact address stays private until the household shares it."
          />

          <div className="hz-sect">
            <SectionTitle kicker="The room">{post.roomNote || "The open room"}</SectionTitle>
            <div className="hz-tiles">
              <Tile label="Available" value={post.moveIn || "Flexible"} />
              <Tile label="Rent" value={post.rent || "Ask"} />
              <Tile
                label="Household size"
                value={`${people.length} ${people.length === 1 ? "person" : "people"}`}
              />
            </div>
          </div>

          <Context trust={post.trust} />
          <Safety h={h} />
        </div>
      </div>

      <ActionBar
        post={post}
        h={h}
        primary={
          <RequestButton post={post} h={h} kind="CHAT" icon="message" label="Chat with the household" />
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Managed property. Purple. A plain informational listing that links out.     */
/* No household, no openness flag, no community context, no chat.              */
/* -------------------------------------------------------------------------- */

function ManagedDetail({ post, h }: { post: HousingPostView; h: HousingDetailHandlers }) {
  const groups = post.interestGroups || [];
  const area = post.areas[0] || "Portland";
  const managerName = post.manager?.company || post.manager?.name || "Verified manager";
  const verified = verificationLabel(post.trust);

  return (
    <div className="pdx-glass-rebind" style={accentStyle(post.type)}>
      <div className="hz-pad">
        <div className="hz-wrap">
          <Back onBack={h.onBack} />

          <div className="hz-dhead">
            <HousingWell photos={post.photos} title={post.displayName} nameCap={0.35}>
              <PropertyManagerBadge>
                <HousingIcon name="verified" size={14} />
                Property manager
              </PropertyManagerBadge>
              <Mono micro>{managerName}</Mono>
            </HousingWell>

            <div className="hz-chiprow" style={{ margin: "16px 0 12px" }}>
              <TypeTitle label={HOUSING_TYPE_KICKER.MANAGED} />
              {verified ? <Chip>{verified}</Chip> : null}
            </div>

            <h2 className="hz-title hz-dttl">{post.displayName}</h2>
            <div style={{ marginTop: 8 }}>
              <Mono micro>
                {area} · {post.lastSeenAt ? `updated ${post.postedLabel}` : `posted ${post.postedLabel}`}
              </Mono>
            </div>

            {post.gone ? (
              <div className="hz-around" style={{ marginTop: 12 }}>
                <HousingIcon name="verified" size={13} />
                <span>Off the market. The manager took this listing down.</span>
              </div>
            ) : null}

            {post.sourceDomain ? (
              <div className="hz-around" style={{ marginTop: 12 }}>
                <HousingIcon name="search" size={13} />
                {/* Only claim a scan when there actually was one. Hand posted
                    listings carry no lastSeenAt stamp. */}
                <span>
                  {post.lastSeenAt
                    ? `Pulled from ${post.sourceDomain}. Managed listings come in from the manager site scan, so availability stays current.`
                    : `Listed on ${post.sourceDomain}. Check there for the current availability.`}
                </span>
              </div>
            ) : null}

            <p className="hz-prose" style={{ marginTop: 14 }}>
              {post.headline}
            </p>
          </div>

          <div className="hz-sect">
            <SectionTitle kicker="The unit">What you get</SectionTitle>
            <div className="hz-tiles">
              <Tile label="Bedrooms" value={post.beds ?? "Ask"} />
              <Tile label="Bathrooms" value={post.baths ?? "Ask"} />
              <Tile label="Parking" value={post.parking ? PARKING_LABEL[post.parking] : "Ask"} />
              <Tile label="Outdoor" value={post.outdoor ? OUTDOOR_LABEL[post.outdoor] : "Ask"} />
            </div>
            {(post.badges || []).length ? (
              <div className="hz-chiprow" style={{ marginTop: 12 }}>
                {(post.badges || []).map((b) => (
                  <Chip key={b} tone="accent">
                    {AFFORDABILITY_BADGE_LABEL[b]}
                  </Chip>
                ))}
              </div>
            ) : null}
            {post.body ? (
              <p className="hz-prose" style={{ marginTop: 14 }}>
                {post.body}
              </p>
            ) : null}
          </div>

          <HonestNumbers post={post} paidTo="The manager, off Zaylist" />

          <Access access={post.access} />

          <RoughlyHere area={area} note="Approximate. The manager shares the address when you apply." />

          {/* Interest, never a claim. The listing stays live and several groups may form. */}
          <div className="hz-sect">
            <SectionTitle
              kicker="Renters organizing"
              right={<Mono micro>{groups.length ? `${groups.length} forming` : "None yet"}</Mono>}
            >
              Build a HAÜS around this place
            </SectionTitle>
            <p className="hz-prose">
              Nobody has to rent it alone. Start a HAÜS and the unit lands on your shortlist as the target,
              with the availability date already in your dates. This does not claim or reserve anything. The
              listing stays live and more than one group can form on it.
            </p>

            {groups.length ? (
              <div className="hz-groups">
                {groups.map((g) => (
                  <div className="hz-group" key={g.postId}>
                    <HousingCluster people={[leadPerson(g)]} size="md" slots={g.seeking} />
                    <div className="hz-group__txt">
                      <b>{g.name}</b>
                      <Mono micro>
                        {firstNameOf(g.lead.displayName)} leads · {g.memberCount}{" "}
                        {g.memberCount === 1 ? "member" : "members"}
                        {g.seeking > 0 ? ` · looking for ${g.seeking} more` : ""}
                      </Mono>
                    </div>
                    <Btn size="sm" kind="outline" onClick={() => h.onOpenPost?.(g.postId)}>
                      <HousingIcon name="home" />
                      Open
                    </Btn>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn kind="solid" onClick={() => h.onBuildHaus?.()}>
                <HousingIcon name="home" />
                Build a HAÜS around this place
              </Btn>
            </div>
          </div>

          <div className="hz-sect">
            <SectionTitle kicker="Who is renting it">{managerName}</SectionTitle>
            <p className="hz-prose">
              Listed by {managerName}
              {post.sourceDomain ? ` on ${post.sourceDomain}` : ""}. Verified as a property manager on
              Zaylist.
            </p>
            <p className="hz-prose" style={{ marginTop: 10, color: "var(--text-lo)" }}>
              The manager sees groups forming and can say hello, but is never asked to. No obligation, no
              hold on the unit.
            </p>
            {post.sourceUrl ? (
              <div style={{ marginTop: 12 }}>
                <BtnLink href={post.sourceUrl} kind="outline">
                  <HousingIcon name="share" />
                  View the listing{post.sourceDomain ? ` on ${post.sourceDomain}` : ""}
                </BtnLink>
                <p style={{ marginTop: 8, color: "var(--text-lo)", fontSize: "var(--meta-sm)" }}>
                  Applications and payments happen on the manager site. Zaylist never handles money.
                </p>
              </div>
            ) : null}
          </div>

          <Safety h={h} />
        </div>
      </div>

      {/* No chat on a managed listing. The manager's own site is the way in. */}
      <div className="hz-actionbar">
        <div className="hz-wrap" style={barStyle}>
          <Btn onClick={h.onSave}>
            <HousingIcon name="favorite" />
            {post.saved ? "Saved" : "Save"}
          </Btn>
          <Btn onClick={h.onShare}>
            <HousingIcon name="share" />
            Share
          </Btn>
          <span style={{ marginLeft: "auto" }} />
          {post.sourceDomain ? <Mono micro>{post.sourceDomain}</Mono> : null}
          <Btn kind="outline" onClick={() => h.onBuildHaus?.()}>
            <HousingIcon name="home" />
            Build a HAÜS
          </Btn>
          {post.sourceUrl ? <BtnLink href={post.sourceUrl}>View listing</BtnLink> : null}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Forming a HAÜS. Acid green. The household before the house.                 */
/* -------------------------------------------------------------------------- */

function FormingDetail({
  post,
  h,
  isOwner,
  workspace,
}: {
  post: HousingPostView;
  h: HousingDetailHandlers;
  isOwner: boolean;
  workspace?: ReactNode;
}) {
  const { people, pets } = splitPeople(post);
  const isFull = !!post.isFull;
  const seeking = post.seeking ?? 0;
  const lead = people.find((p) => p.role === "LEAD");
  const title = post.photos.length ? post.displayName : "Build a HAÜS";

  return (
    <div className="pdx-glass-rebind" style={accentStyle(post.type)}>
      <div className="hz-pad">
        <div className="hz-wrap">
          <Back onBack={h.onBack} />

          <div className="hz-dhead">
            <HousingWell photos={post.photos} title={title} nameCap={0.35}>
              <HousingCluster
                people={people}
                pets={pets}
                size="md"
                scale={1.5}
                slots={isFull ? 0 : seeking}
                onSelect={h.onPerson}
              />
              <Mono micro>{isFull ? "The household" : "What we are picturing"}</Mono>
            </HousingWell>

            <div className="hz-chiprow" style={{ margin: "16px 0 12px" }}>
              <TypeTitle label={HOUSING_TYPE_KICKER.FORMING} />
              {post.flavor ? <Chip>{FORMING_FLAVOR_LABEL[post.flavor]}</Chip> : null}
              {isFull ? (
                <Chip tone="full">We are full</Chip>
              ) : (
                <Chip tone="haus">Looking for {seeking} more</Chip>
              )}
            </div>

            <h2 className="hz-title hz-dttl">{post.displayName}</h2>
            <div style={{ marginTop: 8 }}>
              <Mono micro>
                {lead ? `led by ${lead.name} · ` : ""}posted {post.postedLabel}
              </Mono>
            </div>

            {post.around ? (
              <button
                type="button"
                className="hz-around hz-around--btn"
                onClick={() => h.onOpenPost?.(post.around?.postId ?? 0)}
              >
                <HousingIcon name="venue" size={13} />
                <span>
                  Forming around {post.around.propertyName} · managed by {post.around.managerName}
                </span>
                <Mono micro>Open the listing</Mono>
              </button>
            ) : null}

            <p className="hz-prose" style={{ marginTop: 14 }}>
              {post.headline}
            </p>
            <Trust data={post.trust} />

            <div className="hz-people" style={{ marginTop: 16 }}>
              <HousingCluster people={people} size="lg" slots={isFull ? 0 : seeking} onSelect={h.onPerson} />
              <Mono micro>
                {isFull ? "The household" : `${people.length} in, ${seeking} to go`}
              </Mono>
            </div>
          </div>

          {isFull ? (
            <div className="hz-sect">
              <div className="hz-note">
                <HousingIcon name="community" size={15} />
                <div>
                  This HAÜS is full. You can still join the waiting list, and the Lead reaches out if a spot
                  opens.
                </div>
              </div>
            </div>
          ) : null}

          {post.flavor ? (
            <div className="hz-sect">
              <SectionTitle kicker="How this HAÜS works">{FORMING_FLAVOR_LABEL[post.flavor]}</SectionTitle>
              <p className="hz-prose">{FLAVOR_NOTE[post.flavor]}</p>
            </div>
          ) : null}

          <div className="hz-sect">
            <div className="hz-tiles">
              <Tile label="Combined budget" value={post.rent || "Working it out"} />
              <Tile label="Target move in" value={post.moveIn || "Flexible"} />
              <Tile label="Looking in" value={post.areas.join(", ") || "Portland"} />
            </div>
          </div>

          {post.body || post.goals ? (
            <div className="hz-sect">
              <SectionTitle kicker="The plan">What this household wants</SectionTitle>
              {post.body ? <p className="hz-prose">{post.body}</p> : null}
              {post.goals ? (
                <p className="hz-prose" style={{ marginTop: 10 }}>
                  {post.goals}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="hz-sect">
            <SectionTitle
              kicker="Who is in"
              right={<Mono micro>{isFull ? "Full for now" : `${seeking} to go`}</Mono>}
            >
              The household so far
            </SectionTitle>
            <div className="hz-members">
              {people.map((p) => (
                <PersonRow
                  key={p.id}
                  p={p}
                  badge={
                    p.role === "LEAD" ? "Lead" : p.kind === "OFFPLATFORM" ? "Not on Zaylist" : null
                  }
                  onPerson={h.onPerson}
                />
              ))}
              {pets.map((p) => (
                <PetRow key={p.id} pet={p} onPerson={h.onPerson} />
              ))}
            </div>
          </div>

          <Context trust={post.trust} />

          {workspace ? (
            <div className="hz-sect">
              <SectionTitle
                kicker="Members only"
                right={<Mono micro>{isOwner ? "You are the Lead" : "You are in this HAÜS"}</Mono>}
              >
                The house hunt
              </SectionTitle>
              {workspace}
            </div>
          ) : null}

          <Safety h={h} />
        </div>
      </div>

      <ActionBar
        post={post}
        h={h}
        primary={
          isFull ? (
            <RequestButton
              post={post}
              h={h}
              kind="WAITLIST"
              icon="connection"
              label="Join the waiting list"
            />
          ) : (
            <RequestButton post={post} h={h} kind="JOIN" icon="connection" label="Ask to join and chat" />
          )
        }
      />
    </div>
  );
}

/** Dispatch to the right variant. Four types, four accents, one shell. */
export function HousingDetail({
  post,
  h,
  isOwner,
  workspace,
}: {
  post: HousingPostView;
  h: HousingDetailHandlers;
  isOwner: boolean;
  workspace?: ReactNode;
}) {
  if (post.type === "LOOKING") return <LookingDetail post={post} h={h} isOwner={isOwner} />;
  if (post.type === "OFFERING") return <OfferingDetail post={post} h={h} />;
  if (post.type === "MANAGED") return <ManagedDetail post={post} h={h} />;
  return <FormingDetail post={post} h={h} isOwner={isOwner} workspace={workspace} />;
}

export default HousingDetail;
