import { useState } from "react";
import { Link } from "wouter";
import { PlaceCard } from "@/components/ds";
import { TYPE_LABELS, TYPE_TO_DS_CATEGORY } from "@/pages/Directory";
import PackPupCard from "../PackPupCard";
import { parseSocialLinks, socialCardsFor } from "../helpers";
import type { MemberProfileData } from "../types";

const BIO_PREVIEW_LEN = 220;

function ListEditPopover({
  title,
  label,
  value,
  cap,
  itemMax,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  value: string[];
  cap: number;
  itemMax: number;
  onClose: () => void;
  onSave: (items: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));
  const commit = () => {
    const items = text.split(",").map(x => x.trim().slice(0, itemMax)).filter(Boolean).slice(0, cap);
    onSave(items);
  };
  return (
    <div className="mp-popover mp-popover--list">
      <div className="mp-popover__head">
        <span className="mp-popover__title">{title}</span>
        <button type="button" className="mp-popover__done" onClick={onClose}>Done</button>
      </div>
      <label className="mp-popover__label" htmlFor="mp-list-edit">{label}</label>
      <input
        id="mp-list-edit"
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        className="mp-popover__input"
      />
    </div>
  );
}

function ChipRow({ items, color }: { items: string[]; color?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mp-chip-row">
      {items.map(item => (
        <span key={item} className="mp-chip" style={color ? { borderColor: color, color } : undefined}>{item}</span>
      ))}
    </div>
  );
}

export default function AboutTab({
  data,
  onSavePatch,
  onOpenMessage,
  onAddLink,
  onRemoveLink,
}: {
  data: MemberProfileData;
  onSavePatch: (patch: Record<string, unknown>) => Promise<boolean>;
  onOpenMessage: () => void;
  onAddLink: (relation: "packmate" | "handler") => void;
  onRemoveLink: (relation: "packmate" | "handler", userId: number) => void;
}) {
  const [bioOpen, setBioOpen] = useState(false);
  const [editingTalents, setEditingTalents] = useState(false);
  const [editingStandFor, setEditingStandFor] = useState(false);

  const isOwner = !!data.isOwner;
  const isPromoter = !!data.showPromoterVariant;
  const bio = data.bio || "";
  const bioIsLong = bio.length > BIO_PREVIEW_LEN;
  const bioShown = bioOpen || !bioIsLong ? bio : `${bio.slice(0, BIO_PREVIEW_LEN).trimEnd()}…`;
  const talents = data.talents ?? [];
  const standFor = data.standFor ?? [];
  const socialLinks = parseSocialLinks(data.socialLinks);
  const socialCards = socialCardsFor(socialLinks);
  const bookingCard = socialCards.find(c => c.platform.key === "bookingEmail");
  const findCards = socialCards.filter(c => c.platform.key !== "bookingEmail");
  const business = data.ownedBusiness;
  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;
  const roles = data.roles ?? [];

  const handleBookUs = () => {
    if (bookingCard) {
      window.location.href = bookingCard.href;
    } else {
      onOpenMessage();
    }
  };

  return (
    <div className="mp-about">
      <section className="mp-about__section">
        <div className="mp-section-kicker">About</div>
        {bio ? (
          <p className="mp-about__bio">
            {bioShown}{" "}
            {bioIsLong && (
              <button type="button" className="mp-about__bio-toggle" onClick={() => setBioOpen(v => !v)}>
                {bioOpen ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        ) : (
          <p className="mp-about__bio mp-about__bio--empty">{isOwner ? "Add a bio from your dashboard." : "No bio yet."}</p>
        )}
      </section>

      <section className="mp-about__section">
        <div className="mp-about__row-head">
          <div className="mp-section-kicker">Talents</div>
          {isOwner && (
            <button type="button" className="mp-about__edit-btn" onClick={() => setEditingTalents(true)}>Edit</button>
          )}
        </div>
        {editingTalents ? (
          <ListEditPopover
            title="Edit talents"
            label="Talents (comma separated)"
            value={talents}
            cap={12}
            itemMax={40}
            onClose={() => setEditingTalents(false)}
            onSave={items => onSavePatch({ talents: items })}
          />
        ) : talents.length > 0 ? (
          <ChipRow items={talents} />
        ) : (
          <p className="mp-about__empty-line">{isOwner ? "Add what you're known for." : "No talents listed yet."}</p>
        )}
      </section>

      {isPromoter ? (
        <>
          <section className="mp-about__section">
            <div className="mp-about__row-head">
              <div className="mp-section-kicker">What we stand for</div>
              {isOwner && (
                <button type="button" className="mp-about__edit-btn" onClick={() => setEditingStandFor(true)}>Edit</button>
              )}
            </div>
            {editingStandFor ? (
              <ListEditPopover
                title="Edit stand for"
                label="Values (comma separated)"
                value={standFor}
                cap={12}
                itemMax={60}
                onClose={() => setEditingStandFor(false)}
                onSave={items => onSavePatch({ standFor: items })}
              />
            ) : standFor.length > 0 ? (
              <ul className="mp-standfor-list">
                {standFor.map(item => (
                  <li key={item} className="mp-standfor-item">
                    <span className="mp-standfor-check" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mp-about__empty-line">{isOwner ? "Add the values that guide your shows." : ""}</p>
            )}
          </section>

          {business && (
            <section className="mp-about__section">
              <div className="mp-section-kicker">Our place</div>
              <PlaceCard
                name={business.name}
                category={TYPE_TO_DS_CATEGORY[business.type] || "venues"}
                categoryLabel={TYPE_LABELS[business.type] || business.type}
                isNonprofit={business.type === "nonprofit"}
                logoUrl={business.imageUrl || undefined}
                donateUrl={business.donateUrl || undefined}
                address={[business.address, business.neighborhood].filter(Boolean).join(" · ") || undefined}
                hours={business.hours || undefined}
                phone={business.phone || undefined}
                description={business.description || undefined}
                website={business.website || undefined}
                instagram={business.instagram || undefined}
              />
              <Link href={`/directory?q=${encodeURIComponent(business.name)}`} className="mp-about__directory-link">
                See in Places directory →
              </Link>
            </section>
          )}

          <section className="mp-about__section">
            <div className="mp-section-kicker">Find us</div>
            {findCards.length > 0 ? (
              <div className="mp-find-list">
                {findCards.map(c => (
                  <a key={c.platform.key} href={c.href} target="_blank" rel="noopener noreferrer" className="mp-find-row">
                    <span className="mp-find-chip" style={{ background: c.platform.color, color: c.platform.whiteText ? "#fff" : "#000" }}>{c.platform.chip}</span>
                    <span className="mp-find-label">{c.platform.label}</span>
                    <span className="mp-find-handle">{c.handle}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mp-about__empty-line">{isOwner ? "Add links from your dashboard." : ""}</p>
            )}
          </section>

          <section className="mp-about__section mp-about__book-cta">
            <div className="display mp-about__book-title">Book {data.displayName || data.username} for your room</div>
            <p className="mp-about__book-copy">Reach out about dates, sets, and rates.</p>
            {!isOwner && (
              <button type="button" className="mp-about__book-btn" onClick={handleBookUs}>Get in touch</button>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mp-about__section">
            <div className="mp-section-kicker">Identity</div>
            <div className="mp-facts-grid">
              {data.pronouns && <div><div className="mp-facts-grid__label">Pronouns</div><div className="mp-facts-grid__value">{data.pronouns}</div></div>}
              {data.location && <div><div className="mp-facts-grid__label">Neighborhood</div><div className="mp-facts-grid__value">{data.location}</div></div>}
              {memberYear && <div><div className="mp-facts-grid__label">Member since</div><div className="mp-facts-grid__value">{memberYear}</div></div>}
            </div>
          </section>

          <section className="mp-about__section">
            <div className="mp-section-kicker">Find me</div>
            {findCards.length > 0 ? (
              <div className="mp-find-list">
                {findCards.map(c => (
                  <a key={c.platform.key} href={c.href} target="_blank" rel="noopener noreferrer" className="mp-find-row">
                    <span className="mp-find-chip" style={{ background: c.platform.color, color: c.platform.whiteText ? "#fff" : "#000" }}>{c.platform.chip}</span>
                    <span className="mp-find-label">{c.platform.label}</span>
                    <span className="mp-find-handle">{c.handle}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mp-about__empty-line">{isOwner ? "Add links from your dashboard." : ""}</p>
            )}
          </section>

          {roles.length > 0 && (
            <section className="mp-about__section">
              <div className="mp-section-kicker">Badges</div>
              <ChipRow items={roles} color="var(--neon-cyan)" />
            </section>
          )}

          <PackPupCard data={data} onAddLink={onAddLink} onRemoveLink={onRemoveLink} />
        </>
      )}
    </div>
  );
}
