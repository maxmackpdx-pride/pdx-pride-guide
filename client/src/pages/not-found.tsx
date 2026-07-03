import { Link } from "wouter";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ds";

export default function NotFound() {
  return (
    <div className="zine-page board-page min-h-screen">
      <PageHero
        flipLightLeaks
        titleLine1="404"
        accent="magenta"
        lede="This page is not on the Pride Guide map. Head back to events, gifting, or Pride Werk."
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 45%"
        actions={(
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/"><Button as="span" variant="solid">HOME</Button></Link>
            <Link href="/events"><Button as="span" accent="cyan">EVENTS</Button></Link>
          </div>
        )}
      />
    </div>
  );
}