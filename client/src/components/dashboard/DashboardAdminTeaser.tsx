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

  const count = pending.count || 0;
  if (!enabled || count === 0) return null;

  return (
    <section className="dash-admin-teaser" aria-label="Admin queue">
      <div>
        <p className="dash-mono dash-admin-teaser__kicker">Site admin</p>
        <p className="dash-admin-teaser__copy">
          <span className="dash-admin-teaser__count">{count}</span> item{count === 1 ? "" : "s"} waiting in the review queue.
        </p>
      </div>
      <Link href="/admin?tab=queue" className="dash-pill-btn dash-admin-teaser__cta">
        Open admin →
      </Link>
    </section>
  );
}