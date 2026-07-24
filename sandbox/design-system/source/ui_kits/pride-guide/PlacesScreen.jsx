/* PlacesScreen, the venue directory: map, category filters, count, and a
   masonry-ish grid of PlaceCards. */
const {
  MapPanel: PlMap, FilterChip: PlChip, PlaceCard: PlCard, StatPill: PlStatPill,
} = window.ZaylistDesignSystem_b20420;

function PlacesScreen({ data }) {
  const [cat, setCat] = React.useState("all");
  const places = cat === "all" ? data.PLACES : data.PLACES.filter((p) => p.category === cat);
  const catColor = { all: "lime", bars: "pink", food: "orange", cafes: "green", venues: "cyan", services: "purple", shops: "amber", hotels: "cyan" };
  const pins = data.PLACES.map((p, i) => ({ x: 24 + ((i * 41) % 56), y: 22 + ((i * 47) % 56), day: ["SAT","SUN","THU","FRI"][i % 4] }));

  return (
    <div className="pg-places">
      <PlMap height={340} pins={pins} expandable onExpand={() => {}} />

      <div style={{ position: "sticky", top: 73, zIndex: 90, background: "rgba(6,6,9,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-default)" }}>
        <div className="pg-container" style={{ paddingBlock: 14 }}>
          <div className="pg-chiprow">
            {data.PLACE_CATEGORIES.map((c) => (
              <PlChip key={c.key} accent={catColor[c.key] || "lime"} selected={cat === c.key} onToggle={() => setCat(c.key)}>
                {c.label}
              </PlChip>
            ))}
          </div>
        </div>
      </div>

      <div className="pg-container pg-section--tight">
        <div className="pg-results">
          <PlStatPill count={places.length} color="lime" icon={<span aria-hidden="true">◎</span>}>Places</PlStatPill>
        </div>
        <div className="pg-place-grid">
          {places.map((p, i) => (
            <PlCard key={i} name={p.name} category={p.category} address={p.address}
              hours={p.hours} phone={p.phone} description={p.description}
              website={p.website} instagram={p.instagram} grandOpening={p.grandOpening}
              events={p.events} />
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PGPlacesScreen: PlacesScreen });
