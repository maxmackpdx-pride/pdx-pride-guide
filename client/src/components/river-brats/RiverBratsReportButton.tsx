import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RIVER_BRATS_REPORT_REASONS, type RiverBratsReportTarget } from "@shared/riverBrats";
import AuthModal from "@/components/AuthModal";

type Props = {
  targetType: RiverBratsReportTarget;
  targetId: number;
};

export default function RiverBratsReportButton({ targetType, targetId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(RIVER_BRATS_REPORT_REASONS[0]);
  const [showAuth, setShowAuth] = useState(false);

  const reportMutation = useMutation({
    mutationFn: () =>
      fetch("/api/river-brats/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetType, targetId, reason }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not report");
        return data;
      }),
    onSuccess: () => {
      setOpen(false);
      toast({ title: "Reported", description: "Thanks — we'll review it." });
    },
    onError: (err: Error) => toast({ title: "Could not report", description: err.message, variant: "destructive" }),
  });

  if (!open) {
    return (
      <button type="button" className="rb-report-link" onClick={() => (user ? setOpen(true) : setShowAuth(true))}>
        Report
      </button>
    );
  }

  return (
    <>
      <div className="rb-report-pop">
        <select className="rb-report-select" value={reason} onChange={e => setReason(e.target.value)}>
          {RIVER_BRATS_REPORT_REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="button" className="rb-report-submit" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
          Send
        </button>
        <button type="button" className="rb-report-cancel" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}