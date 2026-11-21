import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { ShareIcon } from "../icons/ShareIcon";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { shareEventLink } from "@/lib/shareEvent";

type Following = { people: Array<{username: string; displayName?: string}> };

export function EventShare({ eventId, title, href, accent }: { eventId: number; title: string; href: string; accent: string }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const { user } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const following = useQuery<Following>({
    queryKey: ["/api/users/me/people/following", user?.id],
    queryFn: () => apiRequest("GET", "/api/users/me/people/following").then(r => r.json()),
    enabled: open && Boolean(user),
  });
  const absolute = new URL(href, window.location.origin).href;
  const invite = useMutation({
    mutationFn: (username: string) => apiRequest("POST", `/api/users/${encodeURIComponent(username)}/message`, {
      eventId,
    }),
    onSuccess: (_, username) => { setStatus(`Invite sent to @${username}.`); setRecipient(""); },
    onError: error => setStatus(parseApiError(error, "Invite didn’t go through. Try again.")),
  });
  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, [open]);
  function share() {
    void shareEventLink(href, title).then(
      result => setStatus(result === "copied" ? "Link copied." : "Shared."),
      (error: Error) => { if (error.name !== "AbortError") setStatus("Copy the event link below."); }
    );
  }
  return <>
    <button type="button" className="evz-x__arw evz-share" aria-label={`Share ${title}`}
      onClick={() => { setStatus(""); setOpen(true); }}><ShareIcon size={18}/></button>
    {open && <dialog ref={dialog} data-glass-piece="overlay" className="evz-share-panel" style={{"--ac":accent} as CSSProperties}
      onCancel={e => { e.preventDefault(); setOpen(false); }} aria-label="Share this event">
      <header><h3>Share this night</h3><button type="button" aria-label="Close share" onClick={() => setOpen(false)}><X size={18}/></button></header>
      <p>{title}</p>
      {user && eventId > 0 && <form onSubmit={e => { e.preventDefault(); if (recipient && !invite.isPending) invite.mutate(recipient); }}>
        {following.isError ? <button type="button" onClick={() => void following.refetch()}>Reload friends</button> :
          following.data?.people.length ? <><label>Invite a friend<select value={recipient} onChange={e => setRecipient(e.target.value)}>
          <option value="">Choose a person</option>{following.data.people.map(person =>
            <option key={person.username} value={person.username}>{person.displayName || person.username}</option>)}
          </select></label><button disabled={!recipient || invite.isPending}>{invite.isPending ? "Sending…" : "Send invite"}</button></> : null}
      </form>}
      <button type="button" onClick={() => void share()}>Share link</button>
      <label>Event link<input readOnly value={absolute} onFocus={e => e.currentTarget.select()}/></label>
      <span role="status">{status}</span>
    </dialog>}
  </>;
}
