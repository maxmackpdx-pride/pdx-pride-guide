import CountUpValue from "@/components/CountUpValue";

const RAINBOW_RING =
  "conic-gradient(from 0deg,#FF6600,#FFEE00,#39FF14,#00FFFF,#8800FF,#FF00CC,#FF6600)";

const GRAND_OPENING_COLOR = "#FFEE00";

/** Legible numerals on dark orbs (map pins keep canonical TYPE_COLORS). */
const ORB_NUM_COLORS: Partial<Record<string, string>> = {
  realestate: "#4488FF",
  healthcare: "#FF5FA8",
};

const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
  restaurant: { x: 29, y: 42 },
  service: { x: 61, y: 31 },
  bar: { x: 80, y: 60 },
  shop: { x: 15, y: 70 },
  cafe: { x: 44, y: 70 },
  venue: { x: 71, y: 80 },
  nonprofit: { x: 89, y: 28 },
  healthcare: { x: 41, y: 15 },
  hotel: { x: 90, y: 78 },
  realestate: { x: 17, y: 24 },
  grandopening: { x: 57, y: 90 },
};

const CATEGORY_ORDER = [
  "restaurant",
  "service",
  "bar",
  "shop",
  "cafe",
  "venue",
  "nonprofit",
  "healthcare",
  "hotel",
  "realestate",
] as const;

type CategoryKey = (typeof CATEGORY_ORDER)[number] | "grandopening";

type CategoryOrb = {
  key: CategoryKey;
  label: string;
  color: string;
  count: number;
  x: number;
  y: number;
  size: number;
  rainbow?: boolean;
  anim: string;
};

function orbNumColor(key: string, color: string): string {
  return ORB_NUM_COLORS[key] ?? color;
}

function buildOrbs(
  counts: Record<string, number>,
  grandOpeningCount: number,
  maxCount: number,
  typeLabels: Record<string, string>,
  typeColors: Record<string, string>,
): CategoryOrb[] {
  const typeOrbs: CategoryOrb[] = CATEGORY_ORDER.map(key => ({
    key,
    label: typeLabels[key],
    color: typeColors[key],
    count: counts[key] ?? 0,
    x: BASE_POSITIONS[key].x,
    y: BASE_POSITIONS[key].y,
    size: 0,
    rainbow: key === "nonprofit",
    anim: "",
  }))
    .filter(c => c.count > 0)
    .map((c, i) => {
      const dur = (6 + (i % 4) * 0.55).toFixed(2);
      const delay = (i * 0.35).toFixed(2);
      const anim =
        c.rainbow
          ? `floatOrb ${dur}s ease-in-out ${delay}s infinite, hueSpin 9s linear infinite`
          : `floatOrb ${dur}s ease-in-out ${delay}s infinite, glowPulse 5s ease-in-out ${delay}s infinite`;
      return {
        ...c,
        size: Math.round(66 + (c.count / maxCount) * 120),
        anim,
      };
    });

  if (grandOpeningCount <= 0) return typeOrbs;

  const i = typeOrbs.length;
  const dur = (6 + (i % 4) * 0.55).toFixed(2);
  const delay = (i * 0.35).toFixed(2);
  const pos = BASE_POSITIONS.grandopening;

  return [
    ...typeOrbs,
    {
      key: "grandopening" as const,
      label: "Grand Opening",
      color: GRAND_OPENING_COLOR,
      count: grandOpeningCount,
      x: pos.x,
      y: pos.y,
      size: Math.round(66 + (grandOpeningCount / maxCount) * 120),
      anim: `floatOrb ${dur}s ease-in-out ${delay}s infinite, glowPulse 5s ease-in-out ${delay}s infinite`,
    },
  ];
}

export default function CategoryConstellation({
  counts,
  grandOpeningCount,
  totalPlaces,
  typeLabels,
  typeColors,
  onSelectCategory,
  onSelectGrandOpening,
  onViewAll,
}: {
  counts: Record<string, number>;
  grandOpeningCount: number;
  totalPlaces: number;
  typeLabels: Record<string, string>;
  typeColors: Record<string, string>;
  onSelectCategory: (key: string) => void;
  onSelectGrandOpening: () => void;
  onViewAll: () => void;
}) {
  const allCounts = [
    ...Object.values(counts),
    ...(grandOpeningCount > 0 ? [grandOpeningCount] : []),
  ];
  const maxCount = Math.max(1, ...allCounts);
  const orbs = buildOrbs(counts, grandOpeningCount, maxCount, typeLabels, typeColors);

  return (
    <section className="category-constellation" aria-label="Browse places by category">
      <div className="category-constellation__header">
        <h2 className="display section-heading category-constellation__title">
          What do you need today?
        </h2>
        <span className="category-constellation__kicker">
          {orbs.length} categor{orbs.length === 1 ? "y" : "ies"} · tap to explore
        </span>
      </div>

      <div className="category-constellation__backdrop">
        <div className="category-constellation__field">
          {orbs.map(orb => {
            const numColor = orb.rainbow ? "#ffffff" : orbNumColor(orb.key, orb.color);
            const ringStyle = orb.rainbow
              ? { background: RAINBOW_RING }
              : { background: orb.color };
            const glowStyle = orb.rainbow
              ? {
                  boxShadow:
                    "0 0 30px rgba(0,255,255,.35),0 0 44px rgba(255,0,204,.3),4px 4px 0 rgba(0,0,0,.45)",
                }
              : {
                  boxShadow: `0 0 26px color-mix(in srgb, ${orb.color} 34%, transparent),4px 4px 0 rgba(0,0,0,.45)`,
                };
            const innerBg = orb.rainbow
              ? "radial-gradient(circle at 34% 28%,#ffffff22,transparent 42%),linear-gradient(135deg,#2a0d20 0%,#0c1622 45%,#111a0c 100%)"
              : `radial-gradient(circle at 34% 28%,#ffffff22,transparent 42%),color-mix(in srgb, ${orb.color} 15%, #0b0b0b)`;

            return (
              <button
                key={orb.key}
                type="button"
                className={`category-constellation__orb${orb.rainbow ? " category-constellation__orb--rainbow" : ""}`}
                style={{
                  left: `${orb.x}%`,
                  top: `${orb.y}%`,
                  width: orb.size,
                  height: orb.size,
                  animation: orb.anim,
                  ...ringStyle,
                  ...glowStyle,
                }}
                onClick={() =>
                  orb.key === "grandopening"
                    ? onSelectGrandOpening()
                    : onSelectCategory(orb.key)
                }
              >
                <span
                  className="category-constellation__orb-inner"
                  style={{ background: innerBg }}
                >
                  <span
                    className="category-constellation__orb-count"
                    style={{ color: numColor }}
                  >
                    <CountUpValue value={orb.count} duration={900} />
                  </span>
                  <span className="category-constellation__orb-label">{orb.label}</span>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="category-constellation__hub"
            onClick={onViewAll}
          >
            <span className="category-constellation__hub-inner">
              <span className="category-constellation__hub-label">View all</span>
              <span className="category-constellation__hub-count">
                <CountUpValue value={totalPlaces} duration={900} />
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}