import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdminMetrics {
  users: number;
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
  { key: "users", label: "Registered users", color: "#C8FA3C", tab: "users", alwaysClickable: true },
  { key: "activeSessions", label: "Active sessions", color: "#19E3FF" },
  { key: "liveEvents", label: "Live events (excl. placeholders)", color: "#FF8C00", tab: "events" },
  { key: "userSubmittedEvents", label: "Community-submitted events", color: "#00FFFF", tab: "events" },
  { key: "attendances", label: "Member check-ins", color: "#C8FA3C" },
  { key: "messages", label: "Active messages", color: "#19E3FF" },
  { key: "pendingSubmissions", label: "Pending review", color: "#FF1FA0", tab: "inbox" },
  { key: "gigPosts", label: "Live gig posts", color: "#FF8C00", tab: "gigs" },
  { key: "giftingPosts", label: "Active gifting posts", color: "#19E3FF", tab: "inbox" },
  { key: "missedConnections", label: "Active missed connections", color: "#FF1FA0" },
  { key: "openFeedback", label: "Open feedback", color: "#750787", tab: "inbox" },
];

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
          const clickable = !!metric.tab && !!onMetricClick
            && (metric.alwaysClickable || (data[metric.key] ?? 0) > 0);
          const Tag = clickable ? "button" : "div";
          return (
            <Tag
              key={metric.key}
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => onMetricClick!(metric.tab!, metric.key) : undefined}
              className={`dash-metric-card accent${clickable ? " dash-metric-card-clickable" : ""}`}
              style={{ ["--metric-color" as string]: metric.color }}
            >
              <div className="dash-metric-value">{data[metric.key] ?? 0}</div>
              <div className="dash-metric-label">{metric.label}</div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}