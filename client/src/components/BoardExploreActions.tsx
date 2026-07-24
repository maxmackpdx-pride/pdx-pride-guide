import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ds";

type Props = {
  /** Page-specific CTA (e.g. Add a place) - rendered first when provided */
  primary?: ReactNode;
  /** Show Schedule link (Events only) */
  showSchedule?: boolean;
  /** Events uses solid Schedule as the lead CTA */
  scheduleLead?: boolean;
};

/**
 * Cross-page hero links - Promoters hub everywhere; Schedule on Events only.
 */
export default function BoardExploreActions({ primary, showSchedule = false, scheduleLead = false }: Props) {
  return (
    <>
      {primary}
      {showSchedule && (
        <Link href="/schedule">
          <Button
            as="span"
            variant={scheduleLead ? "solid" : "neon"}
            accent="cyan"
            size="lg"
            arrow={scheduleLead}
          >
            Schedule
          </Button>
        </Link>
      )}
      <Link href="/submit">
        <Button as="span" variant="neon" accent="lime" size="lg">
          Promoters
        </Button>
      </Link>
    </>
  );
}