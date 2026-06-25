import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="zine-page" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", marginBottom: 20 }}>LOST IN THE CROWD</span>
        <h1 className="display page-hero-title" style={{ fontSize: "clamp(3rem, 12vw, 6rem)", lineHeight: 0.9, color: "#fff", margin: "16px 0" }}>
          404
        </h1>
        <p style={{ color: "#bdbab2", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: 28 }}>
          This page is not on the Pride Guide map. Head back to events, gifting, or Pride Work.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/"><button className="btn-neon solid">HOME</button></Link>
          <Link href="/events"><button className="btn-neon" style={{ color: "#00FFFF", borderColor: "#00FFFF" }}>EVENTS</button></Link>
        </div>
      </div>
    </div>
  );
}