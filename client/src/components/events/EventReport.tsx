import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function EventReport({ title, href }: { title: string; href: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState("Report");
  const [sent, setSent] = useState(false);
  const report = useMutation({
    mutationFn: async (form: FormData) => {
      await apiRequest("POST", "/api/feedback", {
        category: kind === "Report" ? "EVENT_REPORT" : "EVENT_CHANGE",
        pageUrl: new URL(href, window.location.origin).href,
        message: [title, form.get("subject"), form.get("details")].join("\n"),
      });
    },
    onSuccess: () => { setSent(true); dialog.current?.close(); },
  });
  useEffect(() => { const node = dialog.current; return () => node?.close(); }, []);
  return <>
    <button type="button" className="evz-x__managebtn" onClick={() => {
      report.reset(); setSent(false); dialog.current?.showModal();
    }}>Report / request a change</button>
    {sent && <p role="status">Sent to the Zaylist team.</p>}
    <dialog ref={dialog} data-glass-piece="overlay" className="evz-report" aria-label="Report or request a change"
      onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
      <form onSubmit={e => { e.preventDefault(); if (!report.isPending) report.mutate(new FormData(e.currentTarget)); }}>
        <header><h3>About this listing</h3><button type="button" aria-label="Close report" onClick={() => dialog.current?.close()}><X size={18}/></button></header>
        <fieldset><legend>What do you need?</legend>{["Report", "Request a change"].map(label =>
          <label key={label}><input type="radio" name="kind" checked={kind === label} onChange={() => setKind(label)}/>{label}</label>
        )}</fieldset>
        <label>Subject<input name="subject" required maxLength={100}/></label>
        <label>Details<textarea name="details" required maxLength={1400} rows={3}/></label>
        {report.isError && <p role="alert">Couldn’t send. Your draft is here to try again.</p>}
        <button type="submit" disabled={report.isPending}>{report.isPending ? "Sending…" : "Send"}</button>
      </form>
    </dialog>
  </>;
}
