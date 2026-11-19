import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import PushComposer from "@/components/zaylist/PushComposer";
import GuestSpots from "@/components/zaylist/GuestSpots";
import HostCard, { type HostEvent } from "@/components/zaylist/HostCard";
import "@/components/zaylist/zaylist.css";

/**
 * The back-end hub. Everyone signed in gets the hub; what is inside it
 * follows their role. Personal is for everyone. Admin and Owner sections
 * do not exist for users without those roles, and no count shown here
 * ever includes work the signed-in user cannot see.
 */
export default function HostHub() {
  const { user, loading } = useAuth();

  const claimed = useQuery({
    queryKey: ["/api/events/mine/claimed"],
    queryFn: () => apiRequest("GET", "/api/events/mine/claimed").then((r) => r.json() as Promise<HostEvent[]>),
    enabled: !!user,
  });
  const metrics = useQuery({
    queryKey: ["/api/organizer/events/metrics"],
    queryFn: () =>
      apiRequest("GET", "/api/organizer/events/metrics").then(
        (r) => r.json() as Promise<{ events: { id: number; title: string; activeGoing: number }[] }>,
      ),
    enabled: !!user,
  });
  const isAdmin = !!(user?.isAdmin || user?.isSuperAdmin);
  const isOwner = !!user?.isPrimaryOwner;
  const pushStatus = useQuery({
    queryKey: ["/api/admin/push-status"],
    queryFn: () =>
      apiRequest("GET", "/api/admin/push-status").then(
        (r) =>
          r.json() as Promise<{
            configured: boolean;
            totalActiveSubscriptions: number;
            myDeviceSubscriptions: number;
          }>,
      ),
    enabled: isAdmin || isOwner,
  });

  if (loading) {
    return (
      <div className="zl-root">
        <div className="zl-wrap">
          <p className="zl-note">Loading your hub…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="zl-root">
        <div className="zl-wrap">
          <h1 className="zl-h1">Your hub</h1>
          <p className="zl-sub">Sign in to see your spots, your events, and your list.</p>
          <p>
            <a className="zl-btn zl-btn--primary" href="/events">
              Go to Events
            </a>
          </p>
        </div>
      </div>
    );
  }

  const goingById = new Map((metrics.data?.events ?? []).map((e) => [e.id, e.activeGoing]));
  const hostEvents = claimed.data ?? [];

  return (
    <div className="zl-root">
      <div className="zl-wrap">
        <header>
          <h1 className="zl-h1">Your hub</h1>
          <p className="zl-sub">{user.displayName || user.username}</p>
        </header>

        <PushComposer />

        <section className="zl-section" aria-label="Personal">
          <h2>Personal</h2>
          <h3>Your Zay'list spots</h3>
          <GuestSpots />
          <h3>Yours</h3>
          <div className="zl-row">
            <a className="zl-btn" href="/dashboard">My schedule and posts</a>
            <a className="zl-btn" href="/settings/notifications">Notification settings</a>
          </div>
        </section>

        {hostEvents.length ? (
          <section className="zl-section" aria-label="Hosting">
            <h2>Hosting</h2>
            <p className="zl-note">Your events. Press a card for the owner view.</p>
            <div className="zl-rail">
              {hostEvents.map((event) => (
                <HostCard key={event.id} event={event} going={goingById.get(event.id)} />
              ))}
            </div>
          </section>
        ) : null}

        {isAdmin ? (
          <section className="zl-section" aria-label="Admin">
            <h2>Admin</h2>
            {pushStatus.data ? (
              <p className="zl-note">
                Push is {pushStatus.data.configured ? "configured" : "not configured"} ·{" "}
                {pushStatus.data.totalActiveSubscriptions} subscribed devices across the site.
              </p>
            ) : (
              <p className="zl-note">Push status is unavailable.</p>
            )}
            <div className="zl-row">
              <a className="zl-btn" href="/admin">Open Admin</a>
            </div>
          </section>
        ) : null}

        {isOwner ? (
          <section className="zl-section" aria-label="Owner">
            <h2>Owner</h2>
            <p className="zl-note">
              The push composer at the top of this hub is yours without limit. Site controls live in Admin.
            </p>
            <div className="zl-row">
              <a className="zl-btn" href="/admin">Open Admin</a>
              <a className="zl-btn" href="/dashboard">Open the member hub</a>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
