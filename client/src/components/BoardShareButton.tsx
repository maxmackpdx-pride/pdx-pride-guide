import { useState } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "./BoardShareButton.css";

export default function BoardShareButton({ title, path }: { title: string; path: string }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    setSharing(true);
    // Share the board itself, even while a post or filter is open.
    const url = new URL(path, window.location.origin).href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${title} | Zaylist`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Board link copied" });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        toast({ title: "Could not share board", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  };
  return <button type="button" className="board-share-button" aria-label={`Share ${title}`} disabled={sharing} onClick={() => void share()}><Share2 size={17} aria-hidden="true" /> Share</button>;
}
