import { Button } from "@/components/ds";
import { Link } from "wouter";
import type { HubSection } from "../types";
import { hubSectionToAdminTab } from "../types";

type Props = {
  section: HubSection;
  title: string;
  lede: string;
  actionLabel: string;
};

const TABLE_META: Partial<
  Record<HubSection, { title: string; lede: string; actionLabel: string }>
> = {
  "tbl-events": {
    title: "All Events",
    lede: "Every event across the guide, live and pending.",
    actionLabel: "Open events admin",
  },
  "tbl-users": {
    title: "All Users",
    lede: "Members, promoters, and admins on the guide.",
    actionLabel: "Open users admin",
  },
  "tbl-werk": {
    title: "Pride Werk",
    lede: "The gig board: paid and volunteer work.",
    actionLabel: "Open Pride Werk admin",
  },
  "tbl-promoters": {
    title: "Promoters",
    lede: "Verified promoters and their submitted events.",
    actionLabel: "Open promoters admin",
  },
  "tbl-claims": {
    title: "Venue Claims",
    lede: "Businesses claiming their listing in the Queer Directory.",
    actionLabel: "Open venue claims",
  },
  "tbl-team": {
    title: "My Team",
    lede: "People with admin access.",
    actionLabel: "Open team admin",
  },
};

export function getAdminTableMeta(section: HubSection) {
  return TABLE_META[section];
}

/**
 * Hub admin table sections used to render hard-coded demo rows. Rail clicks
 * already route to /admin?tab=…; this is a fallback launchpad only.
 */
export default function HubAdminTable({ section, title, lede, actionLabel }: Props) {
  const adminTab = hubSectionToAdminTab(section);
  const href = adminTab ? `/admin?tab=${encodeURIComponent(adminTab)}` : "/admin";

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Admin · Manage
      </div>
      <h1 className="h1">{title}</h1>
      <p style={{ margin: "12px 0 20px", fontSize: 14, color: "var(--board-muted)", maxWidth: 480, lineHeight: 1.55 }}>
        {lede} Live data and actions live in the full admin panel. This hub view no longer shows demo rows.
      </p>
      <div className="card" style={{ padding: 22 }}>
        <Link href={href}>
          <Button variant="neon" accent="cyan" size="lg" arrow>
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
