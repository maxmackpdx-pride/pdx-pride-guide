import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ACCOUNT_MOD_DURATION_OPTIONS,
  ACCOUNT_MOD_REASONS,
  type AccountModAction,
} from "@shared/accountModeration";

type Props = {
  username: string;
  accountStatus?: string | null;
  shadowBanned?: boolean;
  /** Primary site owner only - full account delete. */
  canDeleteAccount?: boolean;
  onDone?: () => void;
};

export default function AdminProfileModeration({
  username,
  accountStatus,
  shadowBanned,
  canDeleteAccount = false,
  onDone,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AccountModAction>("suspend");
  const [reasonCode, setReasonCode] = useState<string>(ACCOUNT_MOD_REASONS[0].code);
  const [durationHours, setDurationHours] = useState<string>("");
  const [note, setNote] = useState("");

  const suspended = accountStatus === "suspended";
  const deleted = accountStatus === "deleted";

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { action, reasonCode, note };
      if (durationHours !== "") body.durationHours = Number(durationHours);
      const res = await apiRequest(
        "POST",
        `/api/admin/users/${encodeURIComponent(username)}/moderate`,
        body,
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title:
          action === "delete"
            ? "Account deleted"
            : action === "suspend"
              ? "Account suspended"
              : action === "unsuspend"
                ? "Suspension lifted"
                : action === "shadowban"
                  ? "Shadow ban applied"
                  : "Shadow ban lifted",
        duration: 2500,
      });
      setOpen(false);
      onDone?.();
    },
    onError: (err) => {
      toast({ title: parseApiError(err, "Could not moderate account"), variant: "destructive" });
    },
  });

  if (deleted) {
    return (
      <div className="pp-admin-mod">
        <span className="pp-admin-mod__badge is-deleted">DELETED</span>
      </div>
    );
  }

  return (
    <div className="pp-admin-mod">
      <button
        type="button"
        className="pp-admin-mod__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Close moderation" : "Moderate account ▾"}
      </button>
      {(suspended || shadowBanned) && (
        <div className="pp-admin-mod__flags">
          {suspended && <span className="pp-admin-mod__badge is-suspend">SUSPENDED</span>}
          {shadowBanned && <span className="pp-admin-mod__badge is-shadow">SHADOW BAN</span>}
        </div>
      )}
      {open && (
        <div className="pp-admin-mod__panel">
          <label className="pp-admin-mod__label">Action</label>
          <select
            className="pp-admin-mod__select"
            value={action}
            onChange={(e) => setAction(e.target.value as AccountModAction)}
          >
            <option value="suspend">Suspend</option>
            <option value="unsuspend" disabled={!suspended}>
              Lift suspension
            </option>
            <option value="shadowban">Shadow ban</option>
            <option value="unshadowban" disabled={!shadowBanned}>
              Lift shadow ban
            </option>
            {canDeleteAccount ? (
              <option value="delete">Delete account (owner only)</option>
            ) : null}
          </select>
          {!canDeleteAccount ? (
            <p className="pp-admin-mod__hint">
              Full account delete is owner-only. Suspensions notify the admin queue and the owner inbox.
            </p>
          ) : null}

          {(action === "suspend" || action === "shadowban" || action === "delete") && (
            <>
              <label className="pp-admin-mod__label">Reason (Community Standards)</label>
              <select
                className="pp-admin-mod__select"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
              >
                {ACCOUNT_MOD_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {(action === "suspend" || action === "shadowban") && (
            <>
              <label className="pp-admin-mod__label">Time limit (optional)</label>
              <select
                className="pp-admin-mod__select"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              >
                {ACCOUNT_MOD_DURATION_OPTIONS.map((d) => (
                  <option key={String(d.hours)} value={d.hours == null ? "" : String(d.hours)}>
                    {d.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="pp-admin-mod__label">Admin note (optional)</label>
          <input
            className="pp-admin-mod__input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note / detail for appeal review"
          />

          <button
            type="button"
            className={`pp-admin-mod__go${action === "delete" ? " is-danger" : ""}`}
            disabled={mutation.isPending}
            onClick={() => {
              if (action === "delete") {
                const ok = window.confirm(
                  `Delete @${username}? Their public profile will be removed. This soft-deletes the account.`,
                );
                if (!ok) return;
              }
              mutation.mutate();
            }}
          >
            {mutation.isPending ? "Working…" : `Confirm ${action}`}
          </button>
        </div>
      )}
      <style>{`
        .pp-admin-mod { margin-top: 10px; max-width: 320px; }
        .pp-admin-mod__toggle {
          width: 100%;
          padding: 8px 10px;
          background: #111;
          border: 1px solid #ff1fa088;
          color: #ff1fa0;
          font-family: var(--font-display, sans-serif);
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .pp-admin-mod__flags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .pp-admin-mod__badge {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.12em;
          padding: 2px 6px;
          border: 1px solid;
        }
        .pp-admin-mod__badge.is-suspend { color: #ff8c00; border-color: #ff8c00; }
        .pp-admin-mod__badge.is-shadow { color: #b06bff; border-color: #b06bff; }
        .pp-admin-mod__badge.is-deleted { color: #ff2400; border-color: #ff2400; }
        .pp-admin-mod__panel {
          margin-top: 8px;
          padding: 10px;
          background: #0a0a0f;
          border: 1px solid #333;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pp-admin-mod__label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
        }
        .pp-admin-mod__select, .pp-admin-mod__input {
          width: 100%;
          padding: 8px;
          background: #000;
          border: 1px solid #444;
          color: #fff;
          font-size: 12px;
        }
        .pp-admin-mod__go {
          margin-top: 6px;
          padding: 10px;
          background: #19e3ff;
          color: #000;
          border: none;
          font-family: var(--font-display, sans-serif);
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .pp-admin-mod__go.is-danger { background: #ff2400; color: #fff; }
        .pp-admin-mod__go:disabled { opacity: 0.6; cursor: wait; }
        .pp-admin-mod__hint {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: #888;
        }
      `}</style>
    </div>
  );
}
