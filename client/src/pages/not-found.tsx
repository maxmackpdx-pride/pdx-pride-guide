import { Link } from "wouter";
import PageHero from "@/components/PageHero";

export default function NotFound() {
  return (
    <div className="zine-page board-page min-h-screen">
      <PageHero
        kicker="LOST IN THE CROWD"
        titleLine1="404"
        accent="magenta"
        lede="This page is not on the Pride Guide map. Head back to events, gifting, or Pride Work."
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 45%"
        actions={(
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/"><button className="btn-neon solid">HOME</button></Link>
            <Link href="/events"><button className="btn-neon" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>EVENTS</button></Link>
          </div>
        )}
      />
    </div>
  );
}