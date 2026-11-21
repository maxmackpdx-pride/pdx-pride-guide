import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EventListing } from "@shared/multiDayEvents";
import { EventCard } from "@/components/cards/EventCard";
import EventzExpanded from "@/components/events/EventzExpanded";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { apiRequest } from "@/lib/queryClient";
import "./CardSystemPreview.css";

export default function CardFrontPreview() {
  const [selected, setSelected] = useState<EventListing | null>(null);
  const saved = useSavedEvents();
  const catalog = useQuery<EventListing[]>({
    queryKey: ["/api/events", "public", "card-preview"],
    queryFn: () => apiRequest("GET", "/api/events?visibility=public").then(response => response.json()),
  });
  const event = catalog.data?.find(listing => listing.id === 2022) ??
    catalog.data?.find(listing => listing.posterImageUrl) ?? catalog.data?.[0];
  if (!event) return <p role="status">
    {catalog.isError ? "Events could not be loaded." : catalog.isPending ? "Loading the event…" : "No public events are available."}
    {catalog.isError && <button onClick={() => void catalog.refetch()}>Try again</button>}
  </p>;
  return <section className="card-front-preview" aria-label="Event card sizes">
    {(["wide","small","square","tall"] as const).map(size =>
      <EventCard key={size} size={size} listing={event} rsvped={saved.savedIds.has(event.id)}
        onToggleRsvp={saved.toggleSave} onOpen={setSelected}/>
    )}
    {selected && <EventzExpanded event={selected} onClose={() => setSelected(null)}/>}
  </section>;
}
