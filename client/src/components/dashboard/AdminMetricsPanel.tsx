import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/ds";

interface AdminMetrics {
  users: number;
  newUsersToday: number;
  activeSessions: number;
  liveEvents: number;
  userSubmittedEvents: number;
  messages: number;
  attendances: number;
  pendingSubmissions: number;
  gigPosts: number;
  giftingPosts: number;
  missedConnections: number;
  openFeedback: number;
  generatedAt?: string;
}

const METRICS: { key: keyof AdminMetrics; label: string; color: string; tab?: string; alwaysClickable?: boolean }[] = [
  { key: "users",              label: "Registered users",               color: "#C8FA3C", tab: "users",    alwaysClickable: true },
  { key: "newUsersToday",      label: "New users today",                color: "#C8FA3C", tab: "users",    alwaysClickable: true },
  { key: "activeSessions",     label: "Active sessions",                color: "#19E3FF" },
  { key: "liveEvents",         label: "Live events (excl. placeholders)", color: "#FF8C00", tab: "events", alwaysClickable: true },
  { key: "userSubmittedEvents",label: "Community-submitted events",     color: "#00FFFF", tab: "events" },
  { key: "attendances",        label: "Member check-ins",               color: "#C8FA3C", tab: "events",  alwaysClickable: true },
  { key: "messages",           label: "Active messages",                color: "#19E3FF", tab: "inbox",   alwaysClickable: true },
  { key: "pendingSubmissions", label: "Pending review",                 color: "#FF1FA0", tab: "inbox" },
  { key: "gigPosts",           label: "Live Gigz posts",                 color: "#FF8C00", tab: "gigs",    alwaysClickable: true },
  { key: "giftingPosts",       label: "Active GiftZ posts",           color: "#19E3FF", tab: "inbox",   alwaysClickable: true },
  { key: "missedConnections",  label: "Active Mizzed Connection posts",      color: "#FF1FA0", tab: "inbox",   alwaysClickable: true },

];

type StatCardColor = "lime" | "cyan" | "orange" | "pink" | "purple";

const METRIC_COLOR_MAP: Record<string, StatCardColor> = {
  "#C8FA3C": "lime",
  "#19E3FF": "cyan",
  "#FF8C00": "orange",
  "#00FFFF": "cyan",
  "#FF1FA0": "pink",
  "#750787": "purple",
};

function metricColor(hex: string): StatCardColor {
  return METRIC_COLOR_MAP[hex.toUpperCase()] ?? "lime";
}

export default function AdminMetricsPanel({
  enabled,
  onMetricClick,
}: {
  enabled: boolean;
  onMetricClick?: (tab: string, metricKey: keyof AdminMetrics) => void;
}) {
  const { data, isFetching, refetch, dataUpdatedAt } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics").then(r => r.json()),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const updatedLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : new Date(dataUpdatedAt).toLocaleString();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <p className="dash-mono" style={{ fontSize: 10, color: "var(--dash-muted)", margin: 0, textTransform: "none", letterSpacing: "0.04em" }}>
          Stats as of {updatedLabel}
        </p>
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={() => refetch()}
          disabled={isFetching}
          style={{ fontSize: 11, padding: "6px 12px" }}
        >
          <RefreshCw size={12} style={{ marginRight: 6, opacity: isFetching ? 0.5 : 1 }} />
          {isFetching ? "Refreshing…" : "Refresh stats"}
        </button>
      </div>
      <div className="dash-admin-metrics">
        {METRICS.map(metric => {
          const raw = data[metric.key];
          const count = typeof raw === "number" ? raw : Number(raw) || 0;
          const clickable = !!metric.tab && !!onMetricClick
            && (metric.alwaysClickable || count > 0);
          return (
            <StatCard
              key={metric.key}
              size="sm"
              value={count}
              label={metric.label}
              color={metricColor(metric.color)}
              action={clickable ? "View" : undefined}
              href={undefined}
              onClick={clickable ? () => onMetricClick!(metric.tab!, metric.key) : undefined}
              className={clickable ? "dash-metric-card-clickable" : ""}
              animateCount
            />
          );
        })}
      </div>
    </div>
  );
}
