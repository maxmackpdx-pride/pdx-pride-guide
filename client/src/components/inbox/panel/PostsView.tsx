import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { C, MONO, DISPLAY } from "./sheet";

type PostItem = { title: string; meta: string; actions: string[] };

function useMine<T>(url: string, map: (rows: T[]) => PostItem[]) {
  const { data = [] } = useQuery<T[]>({
    queryKey: [url],
    queryFn: () => fetch(url, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  });
  return map(data);
}

function Section({
  title,
  color,
  countLabel,
  items,
  hubHref,
  open,
  onToggle,
  onHub,
}: {
  title: string;
  color: string;
  countLabel: string;
  items: PostItem[];
  hubHref?: boolean;
  open: boolean;
  onToggle: () => void;
  onHub?: () => void;
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
            items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
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
                  {it.actions.map((a) => (
                    <span
                      key={a}
                      style={{
                        padding: "7px 13px",
                        borderRadius: 999,
                        border: `1.5px solid ${color}`,
                        color,
                        fontFamily: MONO,
                        fontSize: 9.5,
                        letterSpacing: ".07em",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PostsView() {
  const [open, setOpen] = useState<Record<string, boolean>>({ events: true });
  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const gigs = useMine<any>("/api/gigs/mine", (rows) =>
    rows.map((g) => ({
      title: g.title || "Gig post",
      meta: `Gig Board · ${g.replyCount ?? g.replies ?? 0} replies`,
      actions: ["EDIT"],
    })),
  );
  const gifting = useMine<any>("/api/gifting/mine", (rows) =>
    rows.map((g) => ({
      title: g.title || "Gifting post",
      meta: `Gifting · ${g.status || "Live"}`,
      actions: ["EDIT"],
    })),
  );
  const spotted = useMine<any>("/api/missed-connections/mine", (rows) =>
    rows.map((s) => ({
      title: s.title || s.body?.slice(0, 40) || "Spotted post",
      meta: s.status === "ACTIVE" ? "Spotted! · Live" : "Spotted! · Pending review",
      actions: ["EDIT"],
    })),
  );
  const claimed = useMine<any>("/api/events/mine/claimed", (rows) =>
    rows.map((e) => ({
      title: e.title || "Event",
      meta: `${e.dayOfWeek || ""}${e.venueName ? " · " + e.venueName : ""}`.trim() || "Claimed",
      actions: ["CLAIMED", "EDIT"],
    })),
  );
  const submitted = useMine<any>("/api/events/mine/submitted", (rows) =>
    rows.map((s) => ({
      title: s.title || "Event submission",
      meta: s.status ? `Submitted · ${s.status}` : "Submitted",
      actions: ["EDIT"],
    })),
  );
  const events = [...claimed, ...submitted];
  const checkins = useMine<any>("/api/events/mine/check-ins", (rows) =>
    rows.map((a) => ({
      title: a.eventTitle || a.title || "Check-in",
      meta: `${a.status || "Going"}${a.dayOfWeek ? " · " + a.dayOfWeek : ""}`,
      actions: ["VIEW"],
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
        />
        <Section
          title="GIG POSTS"
          color={C.orange}
          countLabel={`${gigs.length} POSTS`}
          items={gigs}
          open={!!open.gigs}
          onToggle={() => toggle("gigs")}
        />
        <Section
          title="SPOTTED"
          color={C.magenta}
          countLabel={`${spotted.length} POSTS`}
          items={spotted}
          open={!!open.spotted}
          onToggle={() => toggle("spotted")}
        />
        <Section
          title="GIFTING"
          color={C.blueCyan}
          countLabel={`${gifting.length} POSTS`}
          items={gifting}
          open={!!open.gifting}
          onToggle={() => toggle("gifting")}
        />
        <Section
          title="CHECK-INS"
          color={C.limeSoft}
          countLabel={`${checkins.length} ACTIVE`}
          items={checkins}
          open={!!open.checkins}
          onToggle={() => toggle("checkins")}
        />
      </div>
    </>
  );
}
