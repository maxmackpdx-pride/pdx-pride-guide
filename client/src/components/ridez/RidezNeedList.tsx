import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ridezNeedBloom, visibleRidezNeeds, type RidezNeed, type RidezNeedContext } from "@shared/ridezNeeds";
import RidezCircleToggle, { useRidezCircle } from "@/components/ridez/RidezCircleToggle";
import "./ridez.css";

/**
 * Shared NEEDS A RIDE list (wide-short cards) for the event card and drawers.
 * A divider sits between the heading / circle toggle and the cards.
 * Bloom flashes --yellow for the same Afterz and --neon-orange for the same
 * event, and stays static under reduced motion and Calm Mode.
 */
export default function RidezNeedList({
  needs: provided,
  eventId,
  afterzId,
  lat,
  lng,
  showToggle = true,
  heading = "Needs a ride",
}: {
  needs?: RidezNeed[];
  eventId?: number | null;
  afterzId?: string | null;
  lat?: number | null;
  lng?: number | null;
  showToggle?: boolean;
  heading?: string;
}) {
  "use memo";
  const [circle, setCircle] = useRidezCircle();
  const query = useQuery<RidezNeed[]>({
    queryKey: ["/api/ridez/needs", eventId, afterzId],
    queryFn: () => apiRequest("GET", "/api/ridez/needs").then(response => response.json()).catch(() => []),
    enabled: provided == null,
    staleTime: 15_000,
  });
  const context: RidezNeedContext = { eventId, afterzId, lat, lng };
  const rows = visibleRidezNeeds(provided ?? query.data ?? [], context);
  return (
    <section className="zridez-needs" data-testid="ridez-need-list" aria-label={heading}>
      <div className="zrc-head">
        <h3 className="zridez-needs__title">{heading}</h3>
        {showToggle ? <RidezCircleToggle value={circle} onChange={setCircle} /> : null}
      </div>
      <div className="zridez-rule" role="separator" />
      {rows.length === 0 ? (
        <p className="zridez-empty">No one nearby needs a ride right now.</p>
      ) : (
        <ul className="zridez-needs__list">
          {rows.map(need => {
            const bloom = ridezNeedBloom(need, context);
            return (
              <li key={need.id}>
                <article
                  className={`zridez-need${bloom ? ` is-${bloom}` : ""}`}
                  data-testid="ridez-need-card"
                  data-bloom={bloom || "none"}
                >
                  <p className="zridez-need__name">{need.name}</p>
                  <p className="zridez-need__meta">
                    {need.direction === "departing" ? "Departing" : "Arriving"}
                    {need.afterzTitle ? ` · ${need.afterzTitle}` : need.eventTitle ? ` · ${need.eventTitle}` : ""}
                    {need.neighborhood ? ` · ${need.neighborhood}` : ""}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
