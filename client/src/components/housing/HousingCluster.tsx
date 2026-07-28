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

export function HousingCluster({
  people,
  pets = [],
  size = "md",
  slots = 0,
  scale = 1,
  max = 6,
  wrap3 = false,
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

  return (
    <div className={wrap3 ? "hz-cluster hz-cluster--wrap" : "hz-cluster"}>
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
          className="hz-more"
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
          {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <span>{pet.name.charAt(0)}</span>}
        </button>
      ))}

      {Array.from({ length: openSlots }).map((_, i) => (
        <span
          key={`open-${i}`}
          className="hz-slot"
          title="Open spot"
          style={{ width: px, height: px, marginLeft: -8, fontSize: px >= 56 ? 11 : 12 }}
        >
          {px >= 56 ? "Open" : "+"}
        </span>
      ))}
    </div>
  );
}

export default HousingCluster;
