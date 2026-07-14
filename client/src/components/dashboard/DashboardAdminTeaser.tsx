import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function DashboardAdminTeaser({ enabled }: { enabled: boolean }) {
  const { data: pending = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0 },
      ),
    enabled,
    refetchInterval: 90_000,
  });

  if (!enabled) return null;

  const count = pending.count || 0;

  return (
    <section className="dash-admin-teaser" aria-label="Admin access">
      <div className="dash-admin-teaser__body">
        <p className="dash-admin-teaser__kicker">YOU HOLD THE KEYS</p>
        <p className="dash-admin-teaser__copy">
          <span className="dash-admin-teaser__count">{count}</span>
          {" "}
          in the shared review queue
        </p>
      </div>
      <Link href="/admin?tab=overview" className="dash-btn dash-btn-admin-cta">
        OPEN ADMIN →
      </Link>
    </section>
  );
}
