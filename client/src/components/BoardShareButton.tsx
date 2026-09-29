import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyStateIcon } from "@/components/ui/animated-state-icons";
import "./BoardShareButton.css";

/** Room plate share. Native share sheet first, clipboard second; the icon morphs to a check when copied. */
export default function BoardShareButton({ title, path }: { title: string; path: string }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  useEffect(() => () => { if (resetTimer.current) window.clearTimeout(resetTimer.current); }, []);
  const share = async () => {
    setSharing(true);
    // Share the board itself, even while a post or filter is open.
    const url = new URL(path, window.location.origin).href;
    try {
      if (typeof navigator.share === "function") {
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
  return <button type="button" className="board-share-button" aria-label={copied ? "Link copied" : `Share ${title}`} disabled={sharing} onClick={() => void share()}>
    {copied ? <CopyStateIcon copied size={17} /> : <Share2 size={17} aria-hidden="true" />} Share
  </button>;
}
