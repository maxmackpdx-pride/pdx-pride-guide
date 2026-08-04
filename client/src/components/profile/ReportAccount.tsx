import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ACCOUNT_MOD_REASONS } from "@shared/accountModeration";
import { trackProductEvent } from "@/lib/analytics";

type Props = {
  username: string;
};

/** Member-facing report control on public profiles → admin moderation queue. */
export default function ReportAccount({ username }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>(ACCOUNT_MOD_REASONS[0].code);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/users/${encodeURIComponent(username)}/report`,
        { reasonCode, note },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      trackProductEvent("report_completed", "profile");
      toast({
        title: "Report sent",
        description: "Admins will review this in the moderation queue.",
        duration: 3000,
      });
      setOpen(false);
      setNote("");
    },
    onError: (err) => {
      toast({ title: parseApiError(err, "Could not send report"), variant: "destructive" });
    },
  });

  return (
    <div className="pp-report-account">
      <button
        type="button"
        className="pp-report-account__toggle"
        onClick={() => setOpen((v) => {
          if (!v) trackProductEvent("report_opened", "profile");
          return !v;
        })}
        aria-expanded={open}
      >
        {open ? "Cancel report" : "Report this account"}
      </button>
      {open && (
        <div className="pp-report-account__panel">
          <p className="pp-report-account__lede">
            Reports go to the admin moderation queue. Use this for Community Standards or safety
            concerns, not for disagreements alone.
          </p>
          <label className="pp-report-account__label">Reason</label>
          <select
            className="pp-report-account__select"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
          >
            {ACCOUNT_MOD_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          <label className="pp-report-account__label">Details (optional)</label>
          <textarea
            className="pp-report-account__textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What happened? Links or context help."
            maxLength={1000}
          />
          <button
            type="button"
            className="pp-report-account__go"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Sending…" : "Submit report"}
          </button>
        </div>
      )}
      <style>{`
        .pp-report-account { margin-top: 10px; max-width: 320px; }
        .pp-report-account__toggle {
          background: none;
          border: none;
          padding: 0;
          color: #8a8a96;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
        }
        .pp-report-account__toggle:hover { color: #ff8c00; }
        .pp-report-account__panel {
          margin-top: 8px;
          padding: 12px;
          background: #0a0a0f;
          border: 1px solid #333;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pp-report-account__lede {
          margin: 0 0 4px;
          font-size: 12px;
          line-height: 1.4;
          color: #999;
        }
        .pp-report-account__label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
        }
        .pp-report-account__select,
        .pp-report-account__textarea {
          width: 100%;
          padding: 8px;
          background: #000;
          border: 1px solid #444;
          color: #fff;
          font-size: 12px;
          box-sizing: border-box;
        }
        .pp-report-account__go {
          margin-top: 4px;
          padding: 10px;
          background: #ff8c00;
          color: #000;
          border: none;
          font-family: var(--font-display, sans-serif);
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .pp-report-account__go:disabled { opacity: 0.6; cursor: wait; }
      `}</style>
    </div>
  );
}
