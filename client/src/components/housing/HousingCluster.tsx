/**
 * The HAUSING avatar stack.
 *
 * "Meet the household", not "Hosted by Alex". The people are part of the visual
 * identity, so the stack carries real members, off-platform housemates (photo and
 * first name, no account), pets one size down, and dashed "Open" slots for the
 * spots still to fill. A full household shows no open slots.
 *
 * Ported from docs/design-handoff-hausing/haus-ui.jsx.
 */
import type { ReactNode } from "react";
import UserAvatar from "@/components/UserAvatar";
import type { HousingPerson } from "@shared/housing";

/** Avatar diameters by slot size, the design system's "standard" row. */
const SIZES = { sm: 42, md: 57, lg: 83, xl: 109 } as const;
export type ClusterSize = keyof typeof SIZES;

/** Rows past the third step down so a big household still reads at a glance. */
const ROW_STEP = 0.82;
/** Pets render slightly smaller than people: people first, pets alongside. */
const PET_RATIO = 0.72;

export type HousingClusterProps = {
  people: HousingPerson[];
  pets?: HousingPerson[];
  size?: ClusterSize;
  /** Dashed "Open" placeholders rendered after the filled avatars. */
  slots?: number;
  scale?: number;
  max?: number;
  /** Wrap into rows of three instead of one long overlapping line. */
  wrap3?: boolean;
  onSelect?: (person: HousingPerson) => void;
};

type ClusterSlot =
  | { kind: "person"; key: string; person: HousingPerson; index: number }
  | { kind: "extra"; key: string; extra: number }
  | { kind: "pet"; key: string; pet: HousingPerson }
  | { kind: "open"; key: string; index: number };

function chunk3<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
  return rows;
}

export function HousingCluster({
  people,
  pets = [],
  size = "md",
  slots = 0,
  scale = 1,
  max = 6,
  wrap3 = true,
  onSelect,
}: HousingClusterProps) {
  const base = Math.round(SIZES[size] * scale);
  const px = wrap3 && people.length > 3 ? Math.round(base * 0.74) : base;
  const petPx = Math.round(px * PET_RATIO);
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const openSlots = Math.max(0, slots);

  const sizeAt = (i: number) => {
    if (wrap3) {
      const row = Math.floor(i / 3);
      return Math.round(px * Math.pow(ROW_STEP, Math.max(0, row - 2)));
    }
    return i < 3 ? px : Math.round(px * Math.pow(ROW_STEP, i - 2));
  };

  const items: ClusterSlot[] = [
    ...shown.map((p, i) => ({
      kind: "person" as const,
      key: `person-${p.id}`,
      person: p,
      index: i,
    })),
    ...(extra > 0 ? [{ kind: "extra" as const, key: "extra", extra }] : []),
    ...pets.map((pet) => ({
      kind: "pet" as const,
      key: `pet-${pet.id}`,
      pet,
    })),
    ...Array.from({ length: openSlots }, (_, i) => ({
      kind: "open" as const,
      key: `open-${i}`,
      index: i,
    })),
  ];

  const renderSlot = (slot: ClusterSlot): ReactNode => {
    if (slot.kind === "person") {
      const p = slot.person;
      return (
        <UserAvatar
          key={slot.key}
          photoUrl={p.photoUrl}
          avatarChoice={p.avatarChoice}
          displayName={p.name}
          username={p.username || undefined}
          avatarRing={p.kind === "MEMBER" ? p.avatarRing : "none"}
          size={sizeAt(slot.index)}
          title={p.kind === "OFFPLATFORM" ? `${p.name}, not on Zaylist yet` : p.name}
          onClick={onSelect ? () => onSelect(p) : undefined}
        />
      );
    }
    if (slot.kind === "extra") {
      return (
        <span
          key={slot.key}
          className="hz-more"
          title={people.slice(max).map((p) => p.name).filter(Boolean).join(", ")}
          style={{ width: px, height: px, fontSize: Math.round(px * 0.34) }}
        >
          +{slot.extra}
        </span>
      );
    }
    if (slot.kind === "pet") {
      const pet = slot.pet;
      const initial = (pet.name || "?").trim().charAt(0) || "?";
      return (
        <button
          key={slot.key}
          type="button"
          className="hz-pet"
          title={pet.species ? `${pet.name}, ${pet.species}` : pet.name}
          style={{ width: petPx, height: petPx, fontSize: Math.round(petPx * 0.4) }}
          onClick={
            onSelect
              ? (e) => {
                  e.stopPropagation();
                  onSelect(pet);
                }
              : undefined
          }
        >
          {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name || "Pet"} /> : <span>{initial}</span>}
        </button>
      );
    }
    return (
      <span
        key={slot.key}
        className="hz-slot"
        title="Open spot"
        style={{ width: px, height: px, fontSize: px >= 56 ? 11 : 12 }}
      >
        {px >= 56 ? "Open" : "+"}
      </span>
    );
  };

  if (!wrap3) {
    return <div className="hz-cluster">{items.map(renderSlot)}</div>;
  }

  return (
    <div className="hz-cluster hz-cluster--wrap">
      {chunk3(items).map((row, ri) => (
        <div key={`row-${ri}`} className="hz-cluster__row">
          {row.map(renderSlot)}
        </div>
      ))}
    </div>
  );
}

export default HousingCluster;
