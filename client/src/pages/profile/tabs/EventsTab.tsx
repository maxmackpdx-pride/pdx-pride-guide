import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { EventCard, PosterCard } from "@/components/ds";
import { eventPath } from "@shared/eventSlug";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import { fmtEventWhen } from "../helpers";
import type { MemberProfileData, ProfileEvent } from "../types";

function SegmentToggle({
  value,
  onChange,
}: {
  value: "upcoming" | "past";
  onChange: (v: "upcoming" | "past") => void;
}) {
  return (
    <div className="mp-segment">
      <button type="button" className={`mp-segment__btn${value === "upcoming" ? " mp-segment__btn--on" : ""}`} onClick={() => onChange("upcoming")}>
        Upcoming
      </button>
      <button type="button" className={`mp-segment__btn${value === "past" ? " mp-segment__btn--on" : ""}`} onClick={() => onChange("past")}>
        Past
      </button>
    </div>
  );
}

function eventRowProps(evt: ProfileEvent, going?: number) {
  return {
    title: evt.title,
    venue: evt.venueName || undefined,
    when: fmtEventWhen(evt.dateStart),
    day: evt.dayOfWeek || undefined,
    admission: evt.admission || undefined,
    href: eventPath(evt.id, evt.title, evt.dayOfWeek),
    ticketHref: evt.ticketUrl || undefined,
    going,
  };
}

export default function EventsTab({ data }: { data: MemberProfileData }) {
  const isPromoter = !!data.showPromoterVariant;
  const [hostFilter, setHostFilter] = useState<"upcoming" | "past">("upcoming");
  const [memFilter, setMemFilter] = useState<"upcoming" | "past">("upcoming");
  const [pastExpanded, setPastExpanded] = useState(false);

  const { toggleRsvp } = useEventRsvp();
  const { data: attendanceSummaries = {} } = useQuery<Record<string, AttendanceSummary>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
  });
  const goingCount = (id: number) => attendanceSummaries[id]?.count ?? attendanceSummaries[String(id)]?.count;

  const activity = data.activity ?? {};
  const hostedUpcoming = activity.hostedEvents ?? [];
  const hostedPastAll = activity.hostedEventsPast ?? [];
  const hostedPast = pastExpanded ? hostedPastAll : hostedPastAll.slice(0, 2);
  const goingTo = activity.goingTo ?? [];
  const attendedPast = activity.attendedPast ?? [];
  const memberEvents = memFilter === "past" ? attendedPast : goingTo;

  if (isPromoter) {
    return (
      <div>
        <div className="mp-tab-head">
          <div>
            <div className="mp-section-kicker">{data.displayName || data.username} presents</div>
            <h2 className="display mp-section-title">Hosting</h2>
          </div>
          <SegmentToggle value={hostFilter} onChange={setHostFilter} />
        </div>

        {hostFilter === "upcoming" ? (
          hostedUpcoming.length > 0 ? (
            <div className="mp-poster-grid">
              {hostedUpcoming.map(evt => (
                <PosterCard
                  key={evt.id}
                  title={evt.title}
                  venue={evt.venueName || undefined}
                  when={fmtEventWhen(evt.dateStart)}
                  day={evt.dayOfWeek || "FRI"}
                  admission={evt.admission || undefined}
                  href={eventPath(evt.id, evt.title, evt.dayOfWeek)}
                  going={goingCount(evt.id)}
                  onRsvp={() => toggleRsvp(evt.id)}
                  showLink={false}
                />
              ))}
            </div>
          ) : (
            <div className="mp-empty"><p>No upcoming shows on the books.</p></div>
          )
        ) : (
          <>
            {hostedPastAll.length > 0 ? (
              <div className="mp-event-rows">
                {hostedPast.map(evt => <EventCard key={evt.id} {...eventRowProps(evt, goingCount(evt.id))} />)}
              </div>
            ) : (
              <div className="mp-empty"><p>No past shows yet.</p></div>
            )}
            {hostedPastAll.length > 2 && (
              <button type="button" className="mp-showall-btn" onClick={() => setPastExpanded(v => !v)}>
                {pastExpanded ? "Show less" : `Show all ${hostedPastAll.length} past shows`}
              </button>
            )}
          </>
        )}

        <div className="mp-tab-head" style={{ marginTop: 32 }}>
          <div>
            <div className="mp-section-kicker" style={{ color: "var(--neon-cyan)" }}>Out on the town</div>
            <h2 className="display mp-section-title">Going to</h2>
          </div>
        </div>
        {goingTo.length > 0 ? (
          <div className="mp-event-rows">
            {goingTo.map(evt => <EventCard key={evt.id} {...eventRowProps(evt, goingCount(evt.id))} />)}
          </div>
        ) : (
          <div className="mp-empty">
            <p>{data.isOwner ? <>No RSVPs yet, browse the <Link href="/events">events board</Link>.</> : "Nothing shared here yet."}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mp-tab-head">
        <div>
          <div className="mp-section-kicker" style={{ color: "var(--neon-cyan)" }}>On the calendar</div>
          <h2 className="display mp-section-title">Events</h2>
        </div>
        <SegmentToggle value={memFilter} onChange={setMemFilter} />
      </div>
      {memberEvents.length > 0 ? (
        <div className="mp-event-rows">
          {memberEvents.map(evt => <EventCard key={evt.id} {...eventRowProps(evt, goingCount(evt.id))} />)}
        </div>
      ) : (
        <div className="mp-empty">
          <p>
            {memFilter === "upcoming"
              ? (data.isOwner ? <>No RSVPs yet, browse the <Link href="/events">events board</Link>.</> : "Nothing shared here yet.")
              : "No past events yet."}
          </p>
        </div>
      )}
    </div>
  );
}
