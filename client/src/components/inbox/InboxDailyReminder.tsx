import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import "./inbox-daily-reminder.css";

type Reminder = { show: boolean; adminCount: number; ownerCount: number; adminFolder?: "active" | "inbox" };

// Header dropdowns stay mounted while closed, so only visible dialogs block a reminder.
function hasVisibleDialog() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')).some(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
}

export function InboxDailyReminder() {
  const { user } = useAuth();
  const { open: inboxOpen, openSheet } = useInboxSheet();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const busy = useRef(false);
  const pending = useRef<Reminder | null>(null);
  const inboxVisible = useRef(inboxOpen);
  inboxVisible.current = inboxOpen;
  const openingInbox = useRef(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const admin = Boolean(user?.isAdmin || user?.isSuperAdmin);
  useEffect(() => {
    setReminder(null);
    pending.current = null;
    if (!admin || !user) return;
    let disposed = false;
    const check = async () => {
      if (disposed || busy.current || inboxVisible.current || document.visibilityState !== "visible" || hasVisibleDialog()) return;
      if (pending.current) {
        busy.current = true;
        try {
          const response = await fetch("/api/admin/pending-count", { credentials: "include" });
          if (!response.ok || disposed) return;
          const counts = await response.json();
          const latest: Reminder = { show: true, adminCount: counts.adminBadge ?? 0, ownerCount: counts.ownerCount ?? 0, adminFolder: counts.queueCount > 0 ? "active" : "inbox" };
          pending.current = latest.adminCount + latest.ownerCount > 0 ? latest : null;
          if (pending.current && !inboxVisible.current && document.visibilityState === "visible" && !hasVisibleDialog()) {
            setReminder(pending.current); pending.current = null;
          }
        } catch { /* Keep it pending until fresh counts are available. */ }
        finally { busy.current = false; }
        return;
      }
      busy.current = true;
      try {
        const response = await fetch("/api/admin/inbox-daily-reminder", { method: "POST", credentials: "include" });
        if (!response.ok) return;
        const data: Reminder = await response.json();
        if (!disposed && data.show && data.adminCount + data.ownerCount > 0) {
          // Keep the claimed reminder until other dialogs/inbox activity finish.
          if (inboxVisible.current || document.visibilityState !== "visible" || hasVisibleDialog()) pending.current = data;
          else setReminder(data);
        }
      } catch { /* A background reminder must never block the product. Retry next minute. */ }
      finally { busy.current = false; }
    };
    // Let sign-in/onboarding dialogs take priority before claiming today's reminder.
    const first = window.setTimeout(check, 5000);
    const interval = window.setInterval(check, 60_000);
    const onFocus = () => { void check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { disposed = true; clearTimeout(first); clearInterval(interval); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [user?.id, admin]);
  const go = (account: "admin" | "owner") => {
    openingInbox.current = true;
    setReminder(null);
    openSheet({ view: "inbox", account, queueFolder: account === "admin" ? reminder?.adminFolder : "active" }, document.querySelector<HTMLElement>('[data-inbox-open-trigger="header"]') ?? undefined);
  };
  if (!admin || !reminder) return null;
  const ownerCount = user?.isPrimaryOwner ? reminder.ownerCount : 0;
  if (reminder.adminCount + ownerCount === 0) return null;
  const countLine = (n: number, name: string) => `${n} ${n === 1 ? "item" : "items"} in your ${name} inbox`;
  return <Dialog open onOpenChange={(open) => { if (!open) setReminder(null); }}>
    <DialogContent className="inbox-daily-reminder" onOpenAutoFocus={() => { previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={(event) => {
      event.preventDefault();
      if (!openingInbox.current && previousFocus.current?.isConnected) previousFocus.current.focus();
      openingInbox.current = false;
    }}>
      <DialogTitle>Your inbox needs you</DialogTitle>
      <DialogDescription>Today's reminder</DialogDescription>
      {reminder.adminCount > 0 && <div className="inbox-daily-reminder__row"><p>{countLine(reminder.adminCount, "admin")}</p><Button onClick={() => go("admin")}>Open admin inbox</Button></div>}
      {ownerCount > 0 && <div className="inbox-daily-reminder__row"><p>{countLine(ownerCount, "owner")}</p><Button variant={reminder.adminCount > 0 ? "outline" : "default"} onClick={() => go("owner")}>Open owner inbox</Button></div>}
      <Button variant="ghost" onClick={() => setReminder(null)}>Later</Button>
    </DialogContent>
  </Dialog>;
}
