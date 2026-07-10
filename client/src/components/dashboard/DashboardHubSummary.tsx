import { type MouseEvent } from "react";
import { StatPill } from "@/components/ds";
import { dashVarToDsAccent } from "@/lib/dsColors";

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
  section: string;
  color: string;
};

export default function DashboardHubSummary({
  counts,
  onSelectSection,
}: {
  counts: HubSummaryCounts;
  onSelectSection?: (section: string) => void;
}) {
  const chips: SummaryChip[] = [
    {
      key: "events",
      label: "Events",
      count: counts.eventCount,
      section: "events",
      color: "var(--dash-cyan)",
    },
    {
      key: "gigs",
      label: "Gigs",
      count: counts.gigCount,
      section: "gigs",
      color: "var(--dash-orange)",
    },
    {
      key: "gifting",
      label: "Gifting",
      count: counts.giftingCount,
      section: "gifting",
      color: "var(--dash-lime)",
    },
    {
      key: "spotted",
      label: "Spotted",
      count: counts.spottedCount,
      section: "spotted",
      color: "var(--dash-magenta)",
    },
    {
      key: "checkins",
      label: "Check-ins",
      count: counts.checkInCount,
      section: "checkins",
      color: "var(--dash-lime)",
    },
  ];

  const handleChipClick = (e: MouseEvent, section: string) => {
    e.preventDefault();
    if (onSelectSection) {
      onSelectSection(section);
      return;
    }
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const total =
    counts.eventCount +
    counts.gigCount +
    counts.giftingCount +
    counts.spottedCount +
    counts.checkInCount;

  return (
    <section className="dash-hub-summary" aria-label="Hub summary">
      {total === 0 && (
        <p className="dash-hub-summary__lede">
          Nothing on your boards yet. Submit an event, post on Pride Werk, or reply on Spotted to get started.
        </p>
      )}
      <div className="dash-hub-summary__chips">
        {chips.map(chip => (
          <a
            key={chip.key}
            href={`#${chip.section}`}
            className="dash-hub-chip-link"
            onClick={e => handleChipClick(e, chip.section)}
          >
            <StatPill
              count={chip.count}
              color={dashVarToDsAccent(chip.color)}
              variant="outline"
              animateCount
              size="md"
            >
              {chip.label}
            </StatPill>
          </a>
        ))}
      </div>
    </section>
  );
}
