import { Share2 } from "lucide-react";
import { sharePageLink } from "@/lib/shareEvent";
import { useToast } from "@/hooks/use-toast";

export default function RailShareButton({ href, title }: { href: string; title: string }) {
  const { toast } = useToast();
  return <button type="button" className="rail-card-share" aria-label={`Share ${title}`} onClick={async () => {
    try {
      const result = await sharePageLink(href, title);
      if (result === "copied") toast({ title: "Link copied" });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast({ title: "Could not share. Please try again.", variant: "destructive" });
    }
  }}><Share2 size={16} aria-hidden="true" />Share</button>;
}
