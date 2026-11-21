import { useEffect, useState } from "react";
import { ArrowUpRight, LockKeyhole, Pencil } from "lucide-react";
import { getMissedConnectionWindow } from "@shared/missedConnections";
import { formatCardCountdown } from "@shared/drawerTop";
import { canSharePublicEvent } from "@shared/publicEventVisibility";
import type { Event } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useMizzedEventPosting } from "@/lib/mizzedPosting";
import "./EventMizzedBlock.css";

export default function EventMizzedBlock({ event, hasNotes, onOpen }: {
  event: Event; hasNotes: boolean; onOpen: () => void;
}) {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now);
  const window = getMissedConnectionWindow(event.dateStart, event.dateEnd, now);
  const upcoming = !!window && now < window.opensAt;
  const deadline = window && (upcoming ? window.opensAt : window.closesAt);
  const publishable = canSharePublicEvent(event);
  const posting = useMizzedEventPosting(user?.id, event.id, publishable && window?.canPost === true);
  useEffect(() => {
    if (!user || !deadline || deadline <= now) return;
    const refresh = () => setNow(Date.now());
    const until = deadline - now;
    const timer = globalThis.setTimeout(refresh, until % 60_000 || 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [deadline, now, user]);

  if (!user || user.accountStatus === "suspended" || user.accountStatus === "deleted") return null;
  if ((!window || !publishable) && !hasNotes) return null;
  const countdown = deadline && deadline > now ? formatCardCountdown(deadline - now) : "";
  const timing = upcoming ? "Opens in " + countdown : window?.canPost ? "Closes in " + countdown : "Posting closed";
  const canPost = publishable && window?.canPost && posting.data === true;
  const canRead = hasNotes && (!publishable || !upcoming);
  if (window?.canPost && !canPost && !canRead) return null;
  return <section className="evz-mizzed-block" aria-label="Mizzed Connection">
    <header><h3>Mizzed <span>Connection</span></h3>{publishable && window && <small>{timing}</small>}</header>
    {canPost || canRead ? <button type="button" className="evz-mizzed-block__panel" onClick={onOpen}>
      {canPost ? <Pencil aria-hidden="true"/> : <ArrowUpRight aria-hidden="true"/>}
      {canPost ? "Post a Mizzed Connection" : "Read Mizzed Connections"}
    </button> : <div className="evz-mizzed-block__panel">
      <LockKeyhole aria-hidden="true"/>
      {timing}
    </div>}
  </section>;
}
