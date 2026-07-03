import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { diffSubmissionMerge, type SubmissionMatchCandidate } from "@shared/submissionMatch";
import type { Event, Submission } from "@shared/schema";
import { formatPacificDateTime } from "@/lib/countdown";

type MatchWithEvent = SubmissionMatchCandidate & { event?: Event | null };

const CONFIDENCE_STYLE: Record<string, { color: string; border: string }> = {
  high: { color: "#FF6600", border: "#FF6600" },
  medium: { color: "#CCFF00", border: "#CCFF00" },
  low: { color: "#888888", border: "#555555" },
};

function formatWhen(dateStart: string) {
  return formatPacificDateTime(dateStart, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminSubmissionMerge({
  submission,
  matches,
  onMerge,
  pending,
}: {
  submission: Submission;
  matches: MatchWithEvent[];
  onMerge: (eventId: number) => void;
  pending?: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    matches[0]?.eventId ?? null,
  );

  const selectedMatch = matches.find(m => m.eventId === selectedEventId) ?? null;
  const selectedEvent = selectedMatch?.event ?? null;

  const localPreview = useMemo(() => {
    if (!selectedEvent) return [];
    return diffSubmissionMerge(selectedEvent, submission);
  }, [selectedEvent, submission]);

  const { data: remotePreview } = useQuery({
    queryKey: ["/api/admin/submissions", submission.id, "merge-preview", selectedEventId],
    enabled: Boolean(selectedEventId),
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/submissions/${submission.id}/merge-preview?eventId=${selectedEventId}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Could not load merge preview");
      return res.json() as Promise<{ fields: ReturnType<typeof diffSubmissionMerge> }>;
    },
  });

  const previewFields = remotePreview?.fields ?? localPreview;
  const changedFields = previewFields.filter(f => f.changed);

  if (matches.length === 0) return null;

  return (
    <div className="border p-4 space-y-4" style={{ background: "#0d0d00", borderColor: "#FF6600" }}>
      <div>
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "#FF6600" }}>
          Possible existing events
        </p>
        <p className="text-white/60 text-sm m-0">
          This submission may duplicate a listing already in the guide. Review matches and merge promoter updates into the existing event instead of publishing a second listing.
        </p>
      </div>

      <div className="space-y-2">
        {matches.map(match => {
          const style = CONFIDENCE_STYLE[match.confidence] || CONFIDENCE_STYLE.low;
          const active = selectedEventId === match.eventId;
          return (
            <button
              key={match.eventId}
              type="button"
              onClick={() => setSelectedEventId(match.eventId)}
              className="w-full text-left p-3 border transition-colors"
              style={{
                background: active ? "#1a1400" : "#111",
                borderColor: active ? style.border : "#333",
              }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="sticker text-xs" style={{ color: style.color, borderColor: style.border }}>
                  {match.confidence} match · {match.score}
                </span>
                {match.reasons.map(reason => (
                  <span key={reason} className="text-white/35 text-xs">{reason}</span>
                ))}
              </div>
              <p className="text-white text-sm font-medium m-0">{match.title}</p>
              <p className="text-white/45 text-xs mt-1 m-0">
                {match.venueName} · {formatWhen(match.dateStart)}
              </p>
            </button>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wide m-0">
            Merge preview — submission fields win when provided ({changedFields.length} change{changedFields.length === 1 ? "" : "s"})
          </p>
          <div className="max-h-56 overflow-y-auto border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/35 text-xs uppercase">
                  <th className="p-2">Field</th>
                  <th className="p-2">Current</th>
                  <th className="p-2">After merge</th>
                </tr>
              </thead>
              <tbody>
                {previewFields.map(field => (
                  <tr
                    key={field.key}
                    className="border-t border-white/5"
                    style={{ background: field.changed ? "rgba(255,102,0,0.08)" : "transparent" }}
                  >
                    <td className="p-2 text-white/50 align-top whitespace-nowrap">{field.label}</td>
                    <td className="p-2 text-white/70 align-top break-words">{field.before}</td>
                    <td className="p-2 text-white align-top break-words">{field.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => onMerge(selectedEvent.id)}
            className="sticker w-full py-3 text-sm"
            style={{ color: "#FF6600", borderColor: "#FF6600" }}
          >
            {pending ? "Merging…" : `Merge into #${selectedEvent.id} — ${selectedEvent.title}`}
          </button>
        </div>
      )}
    </div>
  );
}