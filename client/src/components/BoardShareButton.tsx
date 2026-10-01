import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyStateIcon } from "@/components/ui/animated-state-icons";
import { renderRoomShareCard, type RoomShareCard } from "@/lib/shareImage";
import "./BoardShareButton.css";

/** The native share call must happen directly from the click. Prepare the optional image ahead of time. */
async function prepareRoomCard(card: Omit<RoomShareCard, "accent" | "url">, accent: string, url: string): Promise<File | null> {
  const canvas = await renderRoomShareCard({ ...card, accent, url });
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  return blob ? new File([blob], `${card.room.toLowerCase().replace(/\W+/g, "-")}-zaylist.png`, { type: "image/png" }) : null;
}

async function copyLink(url: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return;
    } catch {
      // Clipboard permissions vary by browser; try the selection-based fallback.
    }
  }
  const input = document.createElement("textarea");
  input.value = url;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

export default function BoardShareButton({ title, path, card }: { title: string; path: string; card?: Omit<RoomShareCard, "accent" | "url"> }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => () => { if (resetTimer.current) window.clearTimeout(resetTimer.current); }, []);
  const preparedFile = useRef<File | null>(null);
  useEffect(() => {
    preparedFile.current = null;
    if (!card || typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return;
    const accent = button.current ? getComputedStyle(button.current).getPropertyValue("--c").trim() : "";
    if (!/^#[0-9a-f]{6}$/i.test(accent)) return;
    let active = true;
    const url = new URL(path, window.location.origin).href;
    void prepareRoomCard(card, accent, url).then(file => { if (active) preparedFile.current = file; }).catch(() => undefined);
    return () => { active = false; preparedFile.current = null; };
  }, [card?.room, card?.mark, card?.line, path]);
  const share = async () => {
    setSharing(true);
    // Share the board itself, even while a post or filter is open.
    const url = new URL(path, window.location.origin).href;
    try {
      if (typeof navigator.share === "function") {
        const file = preparedFile.current;
        const data = file && navigator.canShare?.({ files: [file] })
          ? { files: [file], title: `${title} | Zaylist`, text: url }
          : { title: `${title} | Zaylist`, url };
        try {
          await navigator.share(data);
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          // Some desktop browsers expose share but cannot open a share target.
        }
      }
      await copyLink(url);
      setCopied(true);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1600);
      toast({ title: "Link copied." });
    } catch (error) {
      toast({ title: "Could not share board", description: "Please try again.", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };
  return <button ref={button} type="button" className="board-share-button pdx-glass-rebind" aria-label={copied ? "Link copied" : `Share ${title}`} disabled={sharing} onClick={() => void share()}>
    {copied ? <CopyStateIcon copied size={17} /> : <Share2 size={17} aria-hidden="true" />} Share
  </button>;
}
