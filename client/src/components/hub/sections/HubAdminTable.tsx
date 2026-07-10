import { SearchInput, Button } from "@/components/ds";
import { Link } from "wouter";
import type { HubSection } from "../types";
import { hubSectionToAdminTab } from "../types";

export type AdminTableRow = {
  c0: string;
  c1: string;
  c2: string;
  dotCls?: string;
  statusColor?: string;
};

type Props = {
  section: HubSection;
  title: string;
  lede: string;
  actionLabel: string;
  columns: string[];
  rows: AdminTableRow[];
};

const TABLE_META: Partial<
  Record<
    HubSection,
    { title: string; lede: string; actionLabel: string; columns: string[]; rows: AdminTableRow[] }
  >
> = {
  "tbl-events": {
    title: "All Events",
    lede: "Every event across Pride Week, live and pending.",
    actionLabel: "New event",
    columns: ["Event", "When", "Status"],
    rows: [
      { c0: "Waterfront Festival", c1: "Sat, Jul 18 · 12:00 PM", c2: "Live", dotCls: "d-sat", statusColor: "var(--status-good)" },
      { c0: "Dyke March", c1: "Sat, Jul 18 · 5:00 PM", c2: "Live", dotCls: "d-sat", statusColor: "var(--status-good)" },
    ],
  },
  "tbl-users": {
    title: "All Users",
    lede: "Members, promoters, and admins on the guide.",
    actionLabel: "Invite",
    columns: ["Name", "Handle", "Role"],
    rows: [
      { c0: "Member", c1: "@member", c2: "Member", statusColor: "var(--status-good)" },
    ],
  },
  "tbl-werk": {
    title: "Pride Werk",
    lede: "The gig board: paid and volunteer work across the week.",
    actionLabel: "Post a gig",
    columns: ["Role", "Where", "Status"],
    rows: [
      { c0: "DJ, drag brunch", c1: "Stag PDX", c2: "Open", statusColor: "var(--status-good)" },
    ],
  },
  "tbl-promoters": {
    title: "Promoters",
    lede: "Verified promoters and their submitted events.",
    actionLabel: "Add promoter",
    columns: ["Promoter", "Events", "Status"],
    rows: [
      { c0: "PrideNW", c1: "14 events", c2: "Verified", statusColor: "var(--status-good)" },
    ],
  },
  "tbl-claims": {
    title: "Venue Claims",
    lede: "Businesses claiming their listing in the Queer Directory.",
    actionLabel: "Review all",
    columns: ["Venue", "Submitted", "Status"],
    rows: [
      { c0: "Camp Bar PDX", c1: "5h ago", c2: "Pending", statusColor: "var(--status-warn)" },
    ],
  },
  "tbl-team": {
    title: "My Team",
    lede: "The people with admin access. Answering to nobody, together.",
    actionLabel: "Add member",
    columns: ["Name", "Access", "Status"],
    rows: [
      { c0: "Owner", c1: "Owner", c2: "Active", statusColor: "var(--status-good)" },
    ],
  },
};

export function getAdminTableMeta(section: HubSection) {
  return TABLE_META[section];
}

export default function HubAdminTable({
  section,
  title,
  lede,
  actionLabel,
  columns,
  rows,
}: Props) {
  const adminTab = hubSectionToAdminTab(section);

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Admin · Manage
      </div>
      <h1 className="h1">{title}</h1>
      <p style={{ margin: "12px 0 20px", fontSize: 14, color: "var(--board-muted)", maxWidth: 480, lineHeight: 1.55 }}>
        {lede}
      </p>
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--panel-border)" }}>
          <div style={{ flex: 1, maxWidth: 280 }}>
            <SearchInput placeholder="Filter..." size="sm" />
          </div>
          <div style={{ flex: 1 }} />
          {adminTab ? (
            <Link href={`/admin?tab=${adminTab}`}>
              <Button variant="neon" accent="cyan" size="sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="neon" accent="cyan" size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} className="th">
                    {c}
                  </th>
                ))}
                <th className="th" style={{ textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="trow rowin">
                  <td style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#fff", textTransform: "uppercase" }}>
                    {r.c0}
                  </td>
                  <td className="kick" style={{ letterSpacing: ".05em" }}>
                    {r.c1}
                  </td>
                  <td>
                    {r.dotCls && <span className={`dot ${r.dotCls}`} style={{ marginRight: 8 }} />}
                    <span className="kick" style={{ letterSpacing: ".08em", color: r.statusColor }}>
                      {r.c2}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {adminTab ? (
                      <Link href={`/admin?tab=${adminTab}`} className="ico" style={{ justifyContent: "flex-end" }}>
                        Manage →
                      </Link>
                    ) : (
                      <span className="ico" style={{ justifyContent: "flex-end" }}>
                        Manage →
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adminTab && (
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--panel-border)" }}>
            <Link href={`/admin?tab=${adminTab}`} className="ico" style={{ color: "var(--panel-cyan)" }}>
              Open full {title.toLowerCase()} panel →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}