export default function MissedConnectionsHero() {
  return (
    <section className="missed-connections-hero">
      <div className="missed-connections-hero-inner">
        <span className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC" }}>PRIVATE REPLIES ONLY</span>
        <h1 className="display page-hero-title" style={{ color: "#fff", marginTop: 12 }}>
          MISSED<br /><span style={{ color: "#FF00CC" }}>CONNECTIONS</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.72)", maxWidth: 640, lineHeight: 1.6, marginTop: 12 }}>
          Post a short note from Pride weekend. Replies never appear on the board; they open a private two-way inbox thread.
        </p>
      </div>
    </section>
  );
}