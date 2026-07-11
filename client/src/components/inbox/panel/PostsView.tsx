import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { C, MONO, DISPLAY } from "./sheet";

type PostAction = { label: string; href?: string };

type PostItem = {
  key: string;
  title: string;
  meta: string;
  actions: PostAction[];
};

function useMine<T>(url: string, map: (rows: T[]) => PostItem[]) {
  const { data = [] } = useQuery<T[]>({
    queryKey: [url],
    queryFn: () => fetch(url, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  });
  return map(data);
}

const actionBadgeStyle = (color: string, clickable: boolean) => ({
  padding: "7px 13px",
  borderRadius: 999,
  border: `1.5px solid ${color}`,
  color,
  fontFamily: MONO,
  fontSize: 9.5,
  letterSpacing: ".07em",
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
  ...(clickable
    ? {
        background: "transparent",
        cursor: "pointer",
      }
    : {}),
});

function Section({
  title,
  color,
  countLabel,
  items,
  hubHref,
  open,
  onToggle,
  onHub,
  onNavigate,
}: {
  title: string;
  color: string;
  countLabel: string;
  items: PostItem[];
  hubHref?: boolean;
  open: boolean;
  onToggle: () => void;
  onHub?: () => void;
  onNavigate?: (href: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: C.nav,
        transition: ".15s",
        border: open ? `1px solid ${color}` : `1px solid ${C.border}`,
        boxShadow: open ? `0 0 22px ${color}22` : undefined,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "15px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: ".01em",
              lineHeight: 1,
              color,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: ".06em",
              fontWeight: 700,
              color: "#06060a",
              background: color,
              padding: "3px 9px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {countLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          {!open && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", fontWeight: 700, color }}>
              VIEW ALL →
            </span>
          )}
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: `1.5px solid ${color}`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform .15s",
              transform: `rotate(${open ? 180 : 0}deg)`,
            }}
          >
            <ChevronDown size={12} strokeWidth={2.6} />
          </span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.borderFaint}`, padding: "6px 16px 14px" }}>
          {items.length === 0 ? (
            <div style={{ padding: "12px 0", color: C.meta, fontSize: 12.5 }}>
              {hubHref ? "Manage these in the Hub." : "Nothing here yet."}
              {hubHref && onHub && (
                <button
                  onClick={onHub}
                  style={{
                    marginLeft: 8,
                    background: "none",
                    border: `1.5px solid ${color}`,
                    color,
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: ".07em",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  OPEN HUB →
                </button>
              )}
            </div>
          ) : (
            items.map((it) => (
              <div key={it.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <span
                  style={{
                    width: 3,
                    alignSelf: "stretch",
                    minHeight: 34,
                    borderRadius: 999,
                    background: color,
                    flex: "none",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: C.heading,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {it.title}
                  </div>
                  <div style={{ fontSize: 12, color: C.meta, marginTop: 3 }}>{it.meta}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flex: "none" }}>
                  {it.actions.map((a) => {
                    const clickable = Boolean(a.href && onNavigate);
                    if (clickable) {
                      return (
                        <button
                          key={a.label}
                          type="button"
                          onClick={() => onNavigate!(a.href!)}
                          style={actionBadgeStyle(color, true)}
                        >
                          {a.label}
                        </button>
                      );
                    }
                    return (
                      <span key={a.label} style={actionBadgeStyle(color, false)}>
                        {a.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PostsView({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ events: true });
  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const gigs = useMine<any>("/api/gigs/mine", (rows) =>
    rows.map((g) => ({
      key: `gig-${g.id}`,
      title: g.title || "Gig post",
      meta: `Gig Board · ${g.replyCount ?? g.replies ?? 0} replies`,
      actions: [{ label: "EDIT", href: `/dashboard?view=posts&editGig=${g.id}` }],
    })),
  );
  const gifting = useMine<any>("/api/gifting/mine", (rows) =>
    rows.map((g) => ({
      key: `gifting-${g.id}`,
      title: g.title || "Gifting post",
      meta: `Gifting · ${g.status || "Live"}`,
      actions: [{ label: "EDIT", href: "/gifting" }],
    })),
  );
  const spotted = useMine<any>("/api/missed-connections/mine", (rows) =>
    rows.map((s) => ({
      key: `spotted-${s.id}`,
      title: s.title || s.body?.slice(0, 40) || "Missed connection post",
      meta: s.status === "ACTIVE" ? "Missed Connections · Live" : "Missed Connections · Pending review",
      actions: [{ label: "EDIT", href: "/spotted" }],
    })),
  );
  const claimed = useMine<any>("/api/events/mine/claimed", (rows) =>
    rows.map((e) => ({
      key: `claimed-${e.id}`,
      title: e.title || "Event",
      meta: `${e.dayOfWeek || ""}${e.venueName ? " · " + e.venueName : ""}`.trim() || "Claimed",
      actions: [
        { label: "CLAIMED" },
        { label: "EDIT", href: `/dashboard?view=posts&editEvent=${e.id}` },
      ],
    })),
  );
  const submitted = useMine<any>("/api/events/mine/submitted", (rows) =>
    rows.map((s) => ({
      key: `submitted-${s.id}`,
      title: s.title || "Event submission",
      meta: s.status ? `Submitted · ${s.status}` : "Submitted",
      actions: [{ label: "EDIT", href: "/dashboard?view=posts&section=events" }],
    })),
  );
  const events = [...claimed, ...submitted];
  const checkins = useMine<any>("/api/events/mine/check-ins", (rows) =>
    rows.map((a) => ({
      key: `checkin-${a.id}`,
      title: a.eventTitle || a.title || "Check-in",
      meta: `${a.status || "Going"}${a.dayOfWeek ? " · " + a.dayOfWeek : ""}`,
      actions: [{ label: "VIEW", href: "/dashboard?view=posts&section=checkins" }],
    })),
  );

  return (
    <>
      <p style={{ margin: "0 2px 14px", color: C.meta, fontSize: 13, lineHeight: 1.4 }}>
        Everything you've submitted, claimed, or posted to the boards.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Section
          title="MY EVENTS"
          color={C.cyan}
          countLabel={`${events.length} TOTAL`}
          items={events}
          open={!!open.events}
          onToggle={() => toggle("events")}
          onNavigate={onNavigate}
        />
        <Section
          title="GIG POSTS"
          color={C.orange}
          countLabel={`${gigs.length} POSTS`}
          items={gigs}
          open={!!open.gigs}
          onToggle={() => toggle("gigs")}
          onNavigate={onNavigate}
        />
        <Section
          title="MISSED CONNECTIONS"
          color={C.magenta}
          countLabel={`${spotted.length} POSTS`}
          items={spotted}
          open={!!open.spotted}
          onToggle={() => toggle("spotted")}
          onNavigate={onNavigate}
        />
        <Section
          title="GIFTING"
          color={C.blueCyan}
          countLabel={`${gifting.length} POSTS`}
          items={gifting}
          open={!!open.gifting}
          onToggle={() => toggle("gifting")}
          onNavigate={onNavigate}
        />
        <Section
          title="CHECK-INS"
          color={C.limeSoft}
          countLabel={`${checkins.length} ACTIVE`}
          items={checkins}
          open={!!open.checkins}
          onToggle={() => toggle("checkins")}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}