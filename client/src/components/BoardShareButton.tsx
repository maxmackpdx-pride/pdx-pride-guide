import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyStateIcon } from "@/components/ui/animated-state-icons";
import { renderRoomShareCard, type RoomShareCard } from "@/lib/shareImage";
import "./BoardShareButton.css";

/** Room plate share. Native share sheet first, clipboard second; the icon morphs to a check when copied. */
/** A phone share sheet that takes files gets the room card image; everything else gets the link. */
async function shareRoomCard(card: Omit<RoomShareCard, "accent" | "url">, accent: string, url: string, title: string): Promise<boolean> {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  const canvas = await renderRoomShareCard({ ...card, accent, url });
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) return false;
  const file = new File([blob], `${card.room.toLowerCase().replace(/\W+/g, "-")}-zaylist.png`, { type: "image/png" });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title, text: url });
  return true;
}

export default function BoardShareButton({ title, path, card }: { title: string; path: string; card?: Omit<RoomShareCard, "accent" | "url"> }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => () => { if (resetTimer.current) window.clearTimeout(resetTimer.current); }, []);
  const share = async () => {
    setSharing(true);
    // Share the board itself, even while a post or filter is open.
    const url = new URL(path, window.location.origin).href;
    try {
      const accent = button.current ? getComputedStyle(button.current).getPropertyValue("--c").trim() : "";
      if (card && /^#[0-9a-f]{6}$/i.test(accent) && await shareRoomCard(card, accent, url, `${title} | Zaylist`)) {
        // Shared with the room card.
      } else if (typeof navigator.share === "function") {
        await navigator.share({ title: `${title} | Zaylist`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        if (resetTimer.current) window.clearTimeout(resetTimer.current);
        resetTimer.current = window.setTimeout(() => setCopied(false), 1600);
        toast({ title: "Link copied." });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        toast({ title: "Could not share board", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  };
  return <button ref={button} type="button" className="board-share-button" aria-label={copied ? "Link copied" : `Share ${title}`} disabled={sharing} onClick={() => void share()}>
    {copied ? <CopyStateIcon copied size={17} /> : <Share2 size={17} aria-hidden="true" />} Share
  </button>;
}
