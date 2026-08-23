/**
 * Overlapping household / crew stack: people, off-platform housemates, pets
 * one size down, dashed "Open" slots, and a +N overflow pill.
 *
 * Promoted from housing/HousingCluster. Rows of three; later rows step down.
 */
import UserAvatar from "@/components/UserAvatar";
import type { HousingPerson } from "@shared/housing";
import "./HouseholdStack.css";

/** Avatar diameters by slot size, the design system's "standard" row. */
const SIZES = { sm: 42, md: 57, lg: 83, xl: 109 } as const;
export type HouseholdStackSize = keyof typeof SIZES;
/** @deprecated Use HouseholdStackSize */
export type ClusterSize = HouseholdStackSize;

/** Rows past the third step down so a big household still reads at a glance. */
const ROW_STEP = 0.82;
/** Pets render slightly smaller than people: people first, pets alongside. */
const PET_RATIO = 0.72;

export type HouseholdStackProps = {
  people: HousingPerson[];
  pets?: HousingPerson[];
  size?: HouseholdStackSize;
  /** Dashed "Open" placeholders rendered after the filled avatars. */
  slots?: number;
  scale?: number;
  max?: number;
  /** Wrap into rows of three instead of one long overlapping line. */
  wrap3?: boolean;
  onSelect?: (person: HousingPerson) => void;
};

/** @deprecated Use HouseholdStackProps */
export type HousingClusterProps = HouseholdStackProps;

export function HouseholdStack({
  people,
  pets = [],
  size = "md",
  slots = 0,
  scale = 1,
  max = 6,
  wrap3 = true,
  onSelect,
}: HouseholdStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const openSlots = Math.max(0, slots);
  const filled = shown.length + (extra > 0 ? 1 : 0) + pets.length + openSlots;
  const base = Math.round(SIZES[size] * scale);
  const px = wrap3 && filled > 3 ? Math.round(base * 0.74) : base;
  const petPx = Math.round(px * PET_RATIO);

  const sizeAt = (i: number) => {
    if (wrap3) {
      const row = Math.floor(i / 3);
      return Math.round(px * Math.pow(ROW_STEP, Math.max(0, row - 2)));
    }
    return i < 3 ? px : Math.round(px * Math.pow(ROW_STEP, i - 2));
  };

  return (
    <div className={wrap3 ? "pdx-household-stack pdx-household-stack--wrap" : "pdx-household-stack"}>
      {shown.map((p, i) => (
        <UserAvatar
          key={p.id}
          photoUrl={p.photoUrl}
          avatarChoice={p.avatarChoice}
          displayName={p.name}
          username={p.username || undefined}
          // Off-platform housemates have no account, so no flag ring.
          avatarRing={p.kind === "MEMBER" ? p.avatarRing : "none"}
          size={sizeAt(i)}
          title={p.kind === "OFFPLATFORM" ? `${p.name}, not on Zaylist yet` : p.name}
          onClick={onSelect ? () => onSelect(p) : undefined}
        />
      ))}

      {extra > 0 ? (
        <span
          className="pdx-household-stack__more"
          title={people.slice(max).map((p) => p.name).join(", ")}
          style={{ width: px, height: px, fontSize: Math.round(px * 0.34) }}
        >
          +{extra}
        </span>
      ) : null}

      {pets.map((pet) => (
        <button
          key={pet.id}
          type="button"
          className="pdx-household-stack__pet"
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
          {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <span>{pet.name.charAt(0)}</span>}
        </button>
      ))}

      {Array.from({ length: openSlots }).map((_, i) => (
        <span
          key={`open-${i}`}
          className="pdx-household-stack__slot"
          title="Open spot"
          style={{ width: px, height: px, marginLeft: -8, fontSize: px >= 56 ? 11 : 12 }}
        >
          {px >= 56 ? "Open" : "+"}
        </span>
      ))}
    </div>
  );
}

/** @deprecated Use HouseholdStack */
export const HousingCluster = HouseholdStack;

export default HouseholdStack;
