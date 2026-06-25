import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminMetrics {
  users: number;
  activeSessions: number;
  liveEvents: number;
  messages: number;
  attendances: number;
  pendingSubmissions: number;
  gigPosts: number;
  giftingPosts: number;
  missedConnections: number;
  openFeedback: number;
}

const METRICS: { key: keyof AdminMetrics; label: string; color: string }[] = [
  { key: "users", label: "Registered users", color: "#C8FA3C" },
  { key: "activeSessions", label: "Active sessions", color: "#19E3FF" },
  { key: "liveEvents", label: "Live events", color: "#FF8C00" },
  { key: "attendances", label: "Check-ins", color: "#C8FA3C" },
  { key: "messages", label: "Messages", color: "#19E3FF" },
  { key: "pendingSubmissions", label: "Pending review", color: "#FF1FA0" },
  { key: "gigPosts", label: "Gig posts", color: "#FF8C00" },
  { key: "giftingPosts", label: "Gifting posts", color: "#19E3FF" },
  { key: "missedConnections", label: "Missed connections", color: "#FF1FA0" },
  { key: "openFeedback", label: "Open feedback", color: "#750787" },
];

export default function AdminMetricsPanel({ enabled }: { enabled: boolean }) {
  const { data } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics").then(r => r.json()),
    enabled,
    refetchInterval: 60_000,
  });

  if (!data) return null;

  return (
    <div className="dash-admin-metrics">
      {METRICS.map(metric => (
        <div
          key={metric.key}
          className="dash-metric-card accent"
          style={{ ["--metric-color" as string]: metric.color }}
        >
          <div className="dash-metric-value">{data[metric.key] ?? 0}</div>
          <div className="dash-metric-label">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}