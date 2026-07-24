import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ds";
import "./ScheduleCard.css";

interface ScheduleCardProps {
  children: ReactNode;
  kicker?: string;
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

/**
 * "1A" framed dark-card chrome wrapping the all-week timeline
 * (`<Schedule embed />`) - ported from the design mock's `1a` variant.
 * Used for the Events page "Schedule" tab.
 */
export default function ScheduleCard({
  children,
  kicker = "All Week",
  title = "The Schedule",
  description = "The whole weekend on one clock. Every event placed by start time, the magenta line is now.",
  actionHref = "/schedule",
  actionLabel = "Full schedule",
}: ScheduleCardProps) {
  return (
    <div className="sc-card">
      <div className="sc-head">
        <div className="sc-head-text">
          <div className="sc-kicker">
            <span className="sc-kicker-bar" />
            {kicker}
          </div>
          <h2 className="sc-title">{title}</h2>
        </div>
        {actionHref && (
          <Link href={actionHref}>
            <Button as="span" accent="cyan" size="sm" arrow>
              {actionLabel}
            </Button>
          </Link>
        )}
      </div>
      {description && <p className="sc-desc">{description}</p>}
      <div className="sc-seam pdx-rainbow-rule" />
      <div className="sc-body">{children}</div>
    </div>
  );
}
