import {useState} from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import "../components/zaylist/zaylist.css";

export default function HubHelp() {
  const [shortOpen, setShortOpen] = useState(false);
  usePageSeo("How to use your Zay’list", "Find a guest pass, run your event list, check in guests and redeem drinks.");
  return <div className="zl-root"><article className="zl-wrap">
    <header className="zl-hub-head"><div><a className="zl-help-back" href="/hub">Your hub</a><h1>How to use your Zay’list</h1></div></header>
    <section className="zl-section" aria-label="Walkthrough">
      <video controls playsInline preload="none" width="960" height="720" style={{width:"100%",height:"auto",background:"var(--zg-12)",display:"block"}} aria-label="How to use your Zay’list" poster="/guides/zaylist-walkthrough-cover.webp">
        <source src="/guides/zaylist-walkthrough.mp4" type="video/mp4" />
        <track default kind="captions" srcLang="en" label="English" src="/guides/zaylist-walkthrough.vtt" />
      </video>
      <p className="zl-note">Recorded in the release app with local training accounts.</p>
      <div className="zl-row"><a href="/guides/zaylist-night-guide.pdf" className="zl-btn" download>Download the illustrated guide</a></div>
    </section>
    <section className="zl-section"><h2>Run your list</h2>
      <p>Open <strong>Working the night</strong> in your hub and select your event. <strong>View live card</strong> opens the public flyer. The card body opens your host tools.</p>
      <p>Expand <strong>Night in numbers</strong> for follows, RSVPs and door activity. Scroll to <strong>Zay’list</strong> to see pending, accepted and arrived guests. Your event role determines which list, team and message controls appear.</p>
    </section>
    <section className="zl-section"><h2>Use a guest spot</h2>
      <p>Open <strong>Guest spots &amp; passes</strong> in your hub. Accept to join the list and open your QR pass. Decline to return the spot, or choose <strong>Gift this spot</strong> to transfer it.</p>
      <p>Use <strong>View pass</strong> to open the QR again and <strong>Download PDF</strong> to carry a copy. Gifting or regenerating a pass replaces its code.</p>
    </section>
    <section className="zl-section"><h2>Work the door and bar</h2>
      <p>Open <strong>Event Mode</strong> for your event. In <strong>Door check-in</strong>, scan the pass or enter its code. The result confirms the guest’s arrival. A repeat scan shows the earlier check-in.</p>
      <p>Select <strong>Bar service</strong> and check the pass to see available offers. Tap the named drink or discount to redeem it. The confirmation shows how many uses remain.</p>
    </section>
    <details className="zl-section" onToggle={event => setShortOpen(event.currentTarget.open)}>
      <summary>Watch the Portland short · Where to tonight?</summary>
      {shortOpen && <video controls playsInline preload="none" width="576" height="1024"
        style={{ width: "min(100%, 24rem)", height: "auto", display: "block", margin: "1rem auto" }}
        poster="/guides/zaylist-portland-cover.jpg" aria-label="Where to tonight? A 32-second tour of Zaylist">
        <source src="/guides/zaylist-portland.mp4" type="video/mp4" />
        <track kind="captions" default srcLang="en" label="English" src="/guides/zaylist-portland.vtt" />
      </video>}
    </details>
    <a className="zl-btn zl-btn--primary" href="/hub">Open your hub</a>
  </article></div>;
}
