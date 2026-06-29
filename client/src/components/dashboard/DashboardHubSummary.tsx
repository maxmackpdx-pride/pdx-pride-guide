import { Link } from "wouter";

export interface HubSummaryCounts {
  unread: number;
  pendingSubmissions: number;
  gigCount: number;
  giftingCount: number;
  spottedCount: number;
  checkInCount: number;
  eventCount: number;
}

type SummaryChip = {
  key: string;
  label: string;
  count: number;
  href: string;
  color: string;
  highlight?: boolean;
};

export default function DashboardHubSummary({ counts }: { counts: HubSummaryCounts }) {
  const chips: SummaryChip[] = [
    {
      key: "unread",
      label: "unread",
      count: counts.unread,
      href: "/inbox",
      color: "var(--dash-magenta)",
      highlight: counts.unread > 0,
    },
    {
      key: "pending",
      label: "pending",
      count: counts.pendingSubmissions,
      href: "#events",
      color: "var(--dash-magenta)",
      highlight: counts.pendingSubmissions > 0,
    },
    {
      key: "events",
      label: "events",
      count: counts.eventCount,
      href: "#events",
      color: "var(--dash-cyan)",
    },
    {
      key: "gigs",
      label: "gigs",
      count: counts.gigCount,
      href: "#gigs",
      color: "var(--dash-orange)",
    },
    {
      key: "gifting",
      label: "gifting",
      count: counts.giftingCount,
      href: "#gifting",
      color: "var(--dash-cyan)",
    },
    {
      key: "spotted",
      label: "spotted",
      count: counts.spottedCount,
      href: "#spotted",
      color: "var(--dash-magenta)",
    },
    {
      key: "checkins",
      label: "check-ins",
      count: counts.checkInCount,
      href: "#checkins",
      color: "var(--dash-lime)",
    },
  ].filter(chip => chip.highlight || chip.count > 0);

  if (chips.length === 0) {
    return (
      <section className="dash-hub-summary dash-hub-summary--empty" aria-label="Hub summary">
        <p className="dash-hub-summary__lede">
          Nothing on your boards yet — submit an event, post on Pride Werk, or reply on Spotted to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="dash-hub-summary" aria-label="Hub summary">
      <div className="dash-hub-summary__chips">
        {chips.map(chip => (
          <Link
            key={chip.key}
            href={chip.href}
            className={`dash-hub-chip${chip.highlight ? " dash-hub-chip--highlight" : ""}`}
            style={{ ["--chip-color" as string]: chip.color }}
          >
            <span className="dash-hub-chip__value">{chip.count}</span>
            <span className="dash-hub-chip__label">{chip.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}