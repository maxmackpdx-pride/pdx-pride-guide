import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { C, MONO } from "./sheet";

type Row = {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  meta: string;
  claim: string;
  fields: Array<[string, string]>;
  note: string;
  approveId?: number;
};

const TYPE_TAG: Record<string, { label: string; color: string }> = {
  NEW_EVENT: { label: "EVENT", color: C.cyan },
  SUGGEST: { label: "EVENT", color: C.cyan },
  CLAIM: { label: "PROMOTER", color: C.purple },
  PROMOTER: { label: "PROMOTER", color: C.purple },
  PLACE: { label: "PLACE", color: C.orange },
  BUSINESS: { label: "PLACE", color: C.orange },
};

function ts(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function mapSubmission(s: any): Row {
  const t = TYPE_TAG[s.type] || { label: String(s.type || "ITEM"), color: C.cyan };
  const fields: Array<[string, string]> = [];
  if (s.venueName) fields.push(["Where", s.venueName + (s.address ? ` · ${s.address}` : "")]);
  if (s.dateStart) fields.push(["When", ts(s.dateStart)]);
  if (s.admission) fields.push(["Cost", String(s.admission)]);
  if (s.dayOfWeek) fields.push(["Day", String(s.dayOfWeek)]);
  if (s.submitterEmail) fields.push(["From", String(s.submitterEmail)]);
  return {
    id: `sub-${s.id}`,
    tag: t.label,
    tagColor: t.color,
    title: s.title || s.name || "Untitled submission",
    meta: `Submitted by ${s.submittedBy || s.submitterEmail || "someone"}${s.createdAt ? " · " + ts(s.createdAt) : ""}`,
    claim: "UNCLAIMED",
    fields,
    note: s.note || s.description || "",
    approveId: s.id,
  };
}

function mapReport(r: any): Row {
  return {
    id: `fb-${r.id}`,
    tag: "REPORT",
    tagColor: C.red,
    title: r.subject || r.reason || "Flagged content",
    meta: `${r.count ? r.count + " reports" : "Reported"}${r.createdAt ? " · " + ts(r.createdAt) : ""}`,
    claim: "",
    fields: [
      ["Reason", String(r.reason || r.message || "—")],
      ["Target", String(r.targetType || r.context || "—")],
    ],
    note: r.message || "",
  };
}

export default function QueueView({ mode }: { mode: "admin" | "owner" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const accent = mode === "admin" ? C.magenta : C.purple;

  const { data: subs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/submissions"],
    queryFn: () => fetch("/api/admin/submissions", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    enabled: mode === "admin",
  });
  const { data: reports = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: () => fetch("/api/admin/feedback", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    enabled: mode === "owner",
  });

  const approve = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminName: user?.displayName || user?.username || "admin" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/pending-count"] });
    },
  });
  const decline = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/pending-count"] });
    },
  });

  const rows: Row[] = mode === "admin" ? subs.map(mapSubmission) : reports.map(mapReport);
  const kicker = mode === "admin" ? "SHARED QUEUE · WORKED BY THE WHOLE TEAM" : "OWNER DESK · JUST YOU";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "0 2px 12px",
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: ".14em",
          fontWeight: 600,
          color: accent,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 8px ${accent}`, flex: "none" }} />
        {kicker}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "44px 20px", color: C.faint2, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em" }}>
          {mode === "admin" ? "QUEUE IS CLEAR" : "OWNER DESK IS CLEAR"}
        </div>
      ) : (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 22, overflow: "hidden", background: C.list }}>
          {rows.map((q, i) => {
            const isOpen = !!open[q.id];
            return (
              <div key={q.id} style={{ borderTop: i > 0 ? `1px solid ${C.border2}` : undefined, background: isOpen ? "#101014" : undefined }}>
                <div
                  onClick={() => setOpen((p) => ({ ...p, [q.id]: !p[q.id] }))}
                  style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          letterSpacing: ".08em",
                          fontWeight: 700,
                          color: "#06060a",
                          background: q.tagColor,
                          padding: "2.5px 7px",
                          borderRadius: 6,
                          flex: "none",
                        }}
                      >
                        {q.tag}
                      </span>
                      {q.claim && (
                        <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".08em", fontWeight: 600, color: accent }}>
                          {q.claim}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: C.heading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: 12, color: C.meta, marginTop: 3 }}>{q.meta}</div>
                  </div>
                  <span style={{ color: accent, flex: "none", display: "flex", transition: "transform .15s", transform: `rotate(${isOpen ? 180 : 0}deg)` }}>
                    <ChevronDown size={20} strokeWidth={2.4} />
                  </span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px" }}>
                    {q.fields.length > 0 && (
                      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border2}` }}>
                        {q.fields.map(([label, value], fi) => (
                          <div key={fi} style={{ display: "flex", gap: 10, padding: "9px 12px", background: C.inset2, borderTop: fi > 0 ? `1px solid ${C.divider}` : undefined }}>
                            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.faint, width: 66, flex: "none", textTransform: "uppercase", paddingTop: 1 }}>
                              {label}
                            </span>
                            <span style={{ fontSize: 13, color: C.body, flex: 1, lineHeight: 1.4 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.note && (
                      <div style={{ marginTop: 10, background: C.inset, borderRadius: 12, padding: "11px 13px", fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>
                        {q.note}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      {mode === "admin" && q.approveId != null ? (
                        <>
                          <button
                            onClick={() => approve.mutate(q.approveId!)}
                            style={{
                              flex: 1,
                              padding: "8px 14px",
                              borderRadius: 999,
                              border: "none",
                              background: C.green,
                              color: "#06060a",
                              fontFamily: MONO,
                              fontSize: 9.5,
                              letterSpacing: ".07em",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => decline.mutate(q.approveId!)}
                            style={{
                              flex: 1,
                              padding: "8px 14px",
                              borderRadius: 999,
                              border: `1.5px solid ${C.red}`,
                              background: "none",
                              color: C.red,
                              fontFamily: MONO,
                              fontSize: 9.5,
                              letterSpacing: ".07em",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            DECLINE
                          </button>
                        </>
                      ) : (
                        <button
                          style={{
                            flex: 1,
                            padding: "8px 16px",
                            borderRadius: 999,
                            border: `1.5px solid ${accent}`,
                            background: "none",
                            color: accent,
                            fontFamily: MONO,
                            fontSize: 9.5,
                            letterSpacing: ".07em",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          REVIEW
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === "owner" && (
        <p style={{ margin: "14px 2px 4px", fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
          Sponsorship &amp; press messages from the contact form will appear here once that feed is wired to the desk.
        </p>
      )}
    </>
  );
}
