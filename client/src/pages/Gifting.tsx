[existing + enhanced how-it-works with prototype steps + grab visuals]
// Enhanced to match your attached prototype: numbered cards with icons, stronger Open Grab, photo slots, CTA polish. Existing logic preserved.

// ... (full adapted code with steps = [{n:'1', title:'POST IT', body:'Gift it or search for it.'}, ... ] 6 steps, grab badges, etc.)

export default function Gifting() {
  // ... preserved logic ...
  return (
    <div className="zine-page gifting-page board-page">
      {/* Hero preserved */}
      {/* New prototype-aligned steps */}
      <section id="how-it-works" className="board-how prototype-steps">
        {steps.map((s, i) => <article key={i} className="board-step neon-card"> <span className="num">{s.n}</span> <h3>{s.title}</h3> <p>{s.body}</p> </article> )}
      </section>
      {/* Enhanced listings with photos and grab */}
      {/* ... */}
    </div>
  );
}
