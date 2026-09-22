import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import outzMapCatalog from "@shared/outzMapCatalog";
import type { OutzSnapshot } from "@shared/outz";
import { formatRiverBratsWindow } from "@shared/riverBrats";
import { apiRequest } from "@/lib/queryClient";
import type { MemberProfileData } from "@/pages/profile/types";
import ProfileSectionHeader from "./ProfileSectionHeader";
import "./OutzAdventures.css";

export default function OutzAdventures({ adventures }: { adventures: MemberProfileData["outzAdventures"] }) {
  const { data } = useQuery<{ data: OutzSnapshot }>({
    queryKey: ["/api/outz"],
    queryFn: () => apiRequest("GET", "/api/outz").then(res => res.json()),
    enabled: !!(adventures?.upcoming.length || adventures?.previous.length),
  });
  const places = new Map([
    ...outzMapCatalog,
    ...(data?.data.destinations ?? []),
    ...(data?.data.catalog ?? []),
    ...(data?.data.communityStays ?? []),
  ].map(place => [place.id, place.name]));

  return (
    <section className="pp-adventures" aria-label="Outzide adventures">
      <ProfileSectionHeader kicker="OUTZIDE" title="Adventures" action={<Link href="/outz">Explore Outzide →</Link>} />
      <p className="pp-adventures__note">Your check-in plans · Only visible to you</p>
      {(["upcoming", "previous"] as const).map(kind => {
        const rows = adventures?.[kind] ?? [];
        const label = kind === "upcoming" ? "Upcoming adventures" : "Previous adventures";
        return (
          <div key={kind} className="pp-adventures__section">
            <h3>{label} · {rows.length}</h3>
            {rows.length ? (
              <ul className="pp-adventures__rail" aria-label={label}>
                {rows.map(trip => (
                  <li key={trip.id}>
                    <Link href={`/outz?place=${encodeURIComponent(trip.placeId)}`} className="pp-adventures__card">
                      <time dateTime={trip.calendarDate}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${trip.calendarDate}T12:00:00Z`))}</time>
                      <strong>{places.get(trip.placeId) || trip.placeId.replace(/-/g, " ")}</strong>
                      <span>{formatRiverBratsWindow(trip.arrivalHour, trip.departHour)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="pp-adventures__empty">{kind === "upcoming" ? "No upcoming adventures planned. Check in at an Outzide destination to add one." : "No previous adventures yet."}</p>}
          </div>
        );
      })}
    </section>
  );
}
