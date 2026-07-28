/**
 * The four HAUSING card variants. One shell, four accents.
 *
 * Cards are introductions, not advertisements. The goal is not the click, it is
 * letting someone think "I could see myself here" in about five seconds, which is
 * why the people show before the property does.
 *
 * Ported from docs/design-handoff-hausing/haus-feed.jsx.
 */
import type { ReactNode } from "react";
import {
  AFFORDABILITY_BADGE_LABEL,
  FORMING_FLAVOR_LABEL,
  HOUSING_TYPE_KICKER,
  OUTDOOR_LABEL,
  PARKING_LABEL,
  type HousingPerson,
  type HousingPostView,
} from "@shared/housing";
import { HousingCardTags } from "./HousingTags";
import { HousingWell } from "./HousingWell";
import { HousingCluster } from "./HousingCluster";
import { HousingIcon } from "./HousingIcon";
import {
  Btn,
  Chip,
  Fact,
  Mono,
  PropertyManagerBadge,
  Trust,
  TypeTitle,
  accentStyle,
} from "./HousingPrimitives";

export type HousingCardHandlers = {
  /** Tags the viewer is filtering by, so matches sort forward and read lit. */
  activeTags?: string[];
  onOpen: (post: HousingPostView) => void;
  onSave: (post: HousingPostView) => void;
  onShare: (post: HousingPostView) => void;
  onChat: (post: HousingPostView) => void;
  onJoin: (post: HousingPostView) => void;
  onWaitlist: (post: HousingPostView) => void;
  onBuildHaus: (post: HousingPostView) => void;
  onPerson?: (person: HousingPerson) => void;
};

/**
 * A household forming before it has a house has nothing to photograph, so the
 * cover falls back to the blueprint illustration rather than a bare gradient.
 * Swap the file at this path to change the artwork.
 */
export const FORMING_DEFAULT_COVER = "/hausing/forming-no-place.svg";

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

function splitPeople(post: HousingPostView) {
  const people = post.household.filter((p) => p.kind !== "PET");
  const pets = post.household.filter((p) => p.kind === "PET");
  return { people, pets };
}

function CardShell({
  post,
  wide,
  onOpen,
  children,
}: {
  post: HousingPostView;
  wide?: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`pdx-glass-card pdx-glass-rebind hz-card${wide ? " hz-card--wide" : ""}`}
      role="button"
      tabIndex={0}
      style={accentStyle(post.type)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="pdx-refract-seam" aria-hidden="true" />
      {post.author?.username === "hausing_demo" ? (
        <span className="hz-demo-sticker" aria-hidden="true">DEMO</span>
      ) : null}
      {children}
    </div>
  );
}

/** Save / Share / primary. The primary differs by type. */
function CardActions({ post, h }: { post: HousingPostView; h: HousingCardHandlers }) {
  const isFull = post.type === "FORMING" && !!post.isFull;
  const requested = post.myRequest?.status === "PENDING";
  const waitlisted = post.myRequest?.kind === "WAITLIST" && post.myRequest.status === "PENDING";

  return (
    <div className="hz-cardact">
      <Chip onClick={stop(() => h.onSave(post))}>
        <HousingIcon name="favorite" />
        {post.saved ? "Saved" : "Save"}
      </Chip>
      <Chip onClick={stop(() => h.onShare(post))}>
        <HousingIcon name="share" />
        Share
      </Chip>
      <span className="hz-spacer" />
      {post.type === "FORMING" ? (
        isFull ? (
          <Btn size="sm" kind="outline" onClick={stop(() => h.onWaitlist(post))}>
            {waitlisted ? "On the waiting list" : "Join the waiting list"}
          </Btn>
        ) : (
          <Btn size="sm" kind="solid" onClick={stop(() => h.onJoin(post))}>
            {requested ? "Request sent" : "Ask to join"}
          </Btn>
        )
      ) : (
        <Btn size="sm" kind="solid" onClick={stop(() => h.onChat(post))}>
          <HousingIcon name="message" />
          {requested ? "Request sent" : "Chat"}
        </Btn>
      )}
    </div>
  );
}

/** Looking for housing. The person is the listing, so their name is the motif. */
export function LookingCard({ post, h }: { post: HousingPostView; h: HousingCardHandlers }) {
  const { people, pets } = splitPeople(post);
  const firstName = post.author.displayName.split(" ")[0];
  const self: HousingPerson = {
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

  return (
    <CardShell post={post} onOpen={() => h.onOpen(post)}>
      <TypeTitle label={HOUSING_TYPE_KICKER.LOOKING} />
      <HousingWell photos={post.photos} title={post.author.displayName} nameCap={0.62}>
        <HousingCluster
          people={[self, ...people]}
          pets={pets}
          size="sm"
          scale={1.5}
          wrap3
          onSelect={h.onPerson}
        />
        <Mono micro>Meet {firstName}</Mono>
      </HousingWell>

      <div>
        <Mono micro>
          {post.author.pronouns ? `${post.author.pronouns} · ` : ""}posted {post.postedLabel}
        </Mono>
      </div>
      <p className="hz-line">{post.headline}</p>

      <div className="hz-facts">
        <Fact label="Budget" value={post.budget || "Open"} />
        <Fact label="Move" value={post.moveTimeline || "Flexible"} />
        <Fact label="Areas" value={post.areas.slice(0, 2).join(", ") || "Anywhere"} />
      </div>

      <div className="hz-chiprow">
        {post.openToHaus ? <Chip tone="haus">Open to a HAÜS</Chip> : null}
        {(post.livingStyle || []).slice(0, 3).map((l) => (
          <Chip key={l}>{l}</Chip>
        ))}
      </div>

      <HousingCardTags tags={post.tags} active={h.activeTags} onMore={stop(() => h.onOpen(post))} />

      <Trust data={post.trust} />
      <CardActions post={post} h={h} />
    </CardShell>
  );
}

/** Offering a room. The house name is the motif. No openness chip by design. */
export function OfferingCard({ post, h }: { post: HousingPostView; h: HousingCardHandlers }) {
  const { people, pets } = splitPeople(post);
  return (
    <CardShell post={post} onOpen={() => h.onOpen(post)}>
      <TypeTitle label={HOUSING_TYPE_KICKER.OFFERING} />
      <HousingWell photos={post.photos} title={post.displayName} nameCap={0.62}>
        <HousingCluster
          people={people}
          pets={pets}
          size="sm"
          scale={1.5}
          wrap3
          slots={post.openSlots}
          onSelect={h.onPerson}
        />
        <Mono micro>Meet the household</Mono>
      </HousingWell>

      <div>
        <Mono micro>posted {post.postedLabel}</Mono>
      </div>
      <p className="hz-line">{post.headline}</p>

      <div className="hz-facts">
        <Fact label="Rent" value={post.rent || "Ask"} />
        <Fact label="Move in" value={post.moveIn || "Flexible"} />
        <Fact label="Where" value={post.areas[0] || "Portland"} />
      </div>

      <div className="hz-chiprow">
        {(post.culture || []).slice(0, 3).map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </div>

      <HousingCardTags tags={post.tags} active={h.activeTags} onMore={stop(() => h.onOpen(post))} />

      <Trust data={post.trust} />
      <CardActions post={post} h={h} />
    </CardShell>
  );
}

/** Forming a HAUS. Full width, and the open spots show as empty slots. */
export function FormingCard({ post, h }: { post: HousingPostView; h: HousingCardHandlers }) {
  const { people, pets } = splitPeople(post);
  const isFull = !!post.isFull;
  const seeking = post.seeking ?? 0;

  return (
    <CardShell post={post} wide onOpen={() => h.onOpen(post)}>
      <TypeTitle label={HOUSING_TYPE_KICKER.FORMING} />
      <HousingWell
        photos={post.photos}
        // With no place picked yet there is nothing to name, so the card asks.
        title={post.photos.length ? post.displayName : "Build a HAÜS"}
        nameCap={0.8}
        fallbackPhoto={FORMING_DEFAULT_COVER}
      >
        <HousingCluster
          people={people}
          pets={pets}
          size="sm"
          scale={1.5}
          wrap3
          slots={isFull ? 0 : seeking}
          onSelect={h.onPerson}
        />
        <Mono micro>{isFull ? "The household" : `${people.length} in, ${seeking} to go`}</Mono>
      </HousingWell>

      <div>
        <Mono micro>posted {post.postedLabel}</Mono>
      </div>

      {post.around ? (
        <div className="hz-around">
          <HousingIcon name="venue" size={13} />
          <span>
            Forming around {post.around.propertyName} · managed by {post.around.managerName}
          </span>
        </div>
      ) : null}

      <p className="hz-line">{post.headline}</p>

      <div className="hz-facts">
        <Fact label="Combined budget" value={post.rent || "Working it out"} />
        <Fact label="Move in" value={post.moveIn || "Flexible"} />
        <Fact label="Looking in" value={post.areas.join(", ") || "Portland"} />
      </div>

      <div className="hz-chiprow">
        {isFull ? (
          <Chip tone="full">We are full</Chip>
        ) : (
          <Chip tone="haus">Looking for {seeking} more</Chip>
        )}
        {post.flavor ? <Chip>{FORMING_FLAVOR_LABEL[post.flavor]}</Chip> : null}
      </div>

      <HousingCardTags tags={post.tags} active={h.activeTags} onMore={stop(() => h.onOpen(post))} />

      <Trust data={post.trust} />
      <CardActions post={post} h={h} />
    </CardShell>
  );
}

/**
 * Managed property. Same shell, purple, a verified manager where the household
 * would be. No avatar stack, no open slots, no openness chip, no compatibility,
 * and no chat: a whole-unit landlord listing carries full Fair Housing scrutiny,
 * so it stays a plain informational listing that links out.
 */
export function ManagedCard({
  post,
  h,
  viewerLeadsGroup,
}: {
  post: HousingPostView;
  h: HousingCardHandlers;
  viewerLeadsGroup?: { postId: number } | null;
}) {
  const groups = post.interestGroups || [];
  const unitChips = [
    post.beds != null ? `${post.beds} bed` : null,
    post.baths != null ? `${post.baths} bath` : null,
    post.parking ? PARKING_LABEL[post.parking] : null,
    post.outdoor ? OUTDOOR_LABEL[post.outdoor] : null,
  ].filter(Boolean) as string[];

  return (
    <CardShell post={post} onOpen={() => h.onOpen(post)}>
      <TypeTitle label={HOUSING_TYPE_KICKER.MANAGED} />
      <HousingWell photos={post.photos} title={post.displayName} nameCap={0.62}>
        <PropertyManagerBadge>
          <HousingIcon name="verified" size={13} />
          Property manager
        </PropertyManagerBadge>
        <Mono micro>{post.manager?.company || post.manager?.name || "Verified manager"}</Mono>
      </HousingWell>

      <div>
        <Mono micro>{post.lastSeenAt ? `Updated ${post.postedLabel}` : `posted ${post.postedLabel}`}</Mono>
      </div>
      <p className="hz-line">{post.headline}</p>

      <div className="hz-facts">
        <Fact label="Rent" value={post.rent || "Ask"} />
        <Fact label="Available" value={post.moveIn || "Now"} />
        <Fact label="Where" value={post.areas[0] || "Portland"} />
      </div>

      <div className="hz-chiprow">
        {unitChips.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
        {(post.badges || []).map((b) => (
          <Chip key={b} tone="accent">
            {AFFORDABILITY_BADGE_LABEL[b]}
          </Chip>
        ))}
      </div>

      <HousingCardTags tags={post.tags} active={h.activeTags} onMore={stop(() => h.onOpen(post))} />

      {groups.length ? (
        <button
          type="button"
          className="hz-interest"
          onClick={stop(() => h.onOpen(post))}
          title="Renters organizing to secure this place"
        >
          <HousingCluster people={groups.map((g) => leadPerson(g.lead, g.postId))} size="sm" />
          <span>
            {groups.length === 1
              ? `${groups[0].lead.displayName.split(" ")[0]} is putting together roommates to secure this place`
              : `${groups.length} groups are putting together roommates for this place`}
          </span>
        </button>
      ) : null}

      <div className="hz-cardact">
        <Chip onClick={stop(() => h.onSave(post))}>
          <HousingIcon name="favorite" />
          {post.saved ? "Saved" : "Save"}
        </Chip>
        <span className="hz-spacer" />
        <Btn size="sm" kind="outline" onClick={stop(() => h.onBuildHaus(post))}>
          <HousingIcon name="home" />
          {viewerLeadsGroup ? "Open your HAÜS" : "Build a HAÜS"}
        </Btn>
        <Btn size="sm" kind="solid" onClick={stop(() => h.onOpen(post))}>
          <HousingIcon name="search" />
          Details
        </Btn>
      </div>
    </CardShell>
  );
}

function leadPerson(lead: HousingPostView["author"], groupId: number): HousingPerson {
  return {
    id: groupId,
    kind: "MEMBER",
    userId: lead.userId,
    username: lead.username,
    name: lead.displayName,
    photoUrl: lead.photoUrl,
    avatarChoice: lead.avatarChoice,
    avatarRing: lead.avatarRing,
    role: "LEAD",
  };
}

/** Dispatch to the right variant. */
export function HousingCard({
  post,
  h,
  viewerLeadsGroup,
}: {
  post: HousingPostView;
  h: HousingCardHandlers;
  viewerLeadsGroup?: { postId: number } | null;
}) {
  if (post.type === "LOOKING") return <LookingCard post={post} h={h} />;
  if (post.type === "OFFERING") return <OfferingCard post={post} h={h} />;
  if (post.type === "MANAGED") return <ManagedCard post={post} h={h} viewerLeadsGroup={viewerLeadsGroup} />;
  return <FormingCard post={post} h={h} />;
}
