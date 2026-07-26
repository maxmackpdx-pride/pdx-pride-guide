import { useState } from "react";
import { Divider } from "@/components/ds";
import { useToast } from "@/hooks/use-toast";

export default function ProfileFooter({ username }: { username: string }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const reportProfile = async () => {
    if (sending) return;
    const reason = window.prompt(`Tell us what's wrong with @${username}'s profile (optional):`, "");
    if (reason === null) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "PROFILE_REPORT",
          severity: "HIGH",
          message: `Report on profile @${username}: ${reason.trim() || "No details provided."}`,
          pageUrl: window.location.href,
        }),
      });
      toast({ title: "Report sent", description: "Thanks for looking out for the community." });
    } catch {
      toast({ title: "Could not send report", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mp-footer">
      <Divider variant="rainbow" />
      <div className="mp-footer__row">
        <span className="mp-footer__tagline">
          <span className="mp-footer__tagline-accent">Take care of each other.</span>
        </span>
        <button type="button" className="mp-footer__report" onClick={() => void reportProfile()} disabled={sending}>
          Report this profile
        </button>
      </div>
    </div>
  );
}
