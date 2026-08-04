import { Link } from "wouter";
import { Flag, LockKeyhole, ShieldCheck, UserRoundX } from "lucide-react";

export type SafetyContext = "housing" | "gifts" | "gigs" | "missed" | "profile" | "conversation";

const GUIDANCE: Record<SafetyContext, { title: string; body: string }> = {
  housing: {
    title: "Protect your address and your money",
    body: "Share an approximate area first. Verify the person and listing before meeting. Never send a deposit through Zaylist, and report pressure, discrimination, or suspicious payment requests.",
  },
  gifts: {
    title: "Keep the handoff free and safe",
    body: "Do not post an exact home address. Use a public meetup or share pickup details privately. Gifts stay free; report payment requests, prohibited items, or unsafe behavior.",
  },
  gigs: {
    title: "Confirm the work before you commit",
    body: "Agree on duties, date, location, compensation, and payment timing in writing. Zaylist does not hold money or verify every poster. Report unpaid work, impersonation, discrimination, or suspicious links.",
  },
  missed: {
    title: "Private by default, consent at every step",
    body: "Do not identify, track, or expose someone. Replies remain private and profiles stay hidden until each person chooses to reveal. Block or report unwanted contact immediately.",
  },
  profile: {
    title: "You control the interaction",
    body: "A public profile never creates an obligation to reply or share private information. Block unwanted contact and report impersonation, harassment, or unsafe content.",
  },
  conversation: {
    title: "Pause before moving off Zaylist",
    body: "Keep personal details private until trust is established. Be cautious with links, payment requests, and pressure to meet. Consent can be withdrawn at any time.",
  },
};

type Props = {
  context: SafetyContext;
  compact?: boolean;
  onReport?: () => void;
  onBlock?: () => void;
};

export default function SafetyGuide({ context, compact = false, onReport, onBlock }: Props) {
  const copy = GUIDANCE[context];
  return (
    <aside className={`safety-guide${compact ? " safety-guide--compact" : ""}`} aria-labelledby={`safety-${context}-title`}>
      <ShieldCheck className="safety-guide__icon" size={24} aria-hidden="true" />
      <div className="safety-guide__copy">
        <h2 id={`safety-${context}-title`}>{copy.title}</h2>
        <p>{copy.body}</p>
        <nav className="safety-guide__actions" aria-label="Safety actions">
          <Link href="/access"><LockKeyhole size={15} aria-hidden="true" /> Safety</Link>
          <Link href="/access#community-rules"><ShieldCheck size={15} aria-hidden="true" /> Rules</Link>
          {onReport
            ? <button type="button" onClick={onReport}><Flag size={15} aria-hidden="true" /> Report</button>
            : <Link href="/access#report"><Flag size={15} aria-hidden="true" /> Report</Link>}
          {onBlock
            ? <button type="button" onClick={onBlock}><UserRoundX size={15} aria-hidden="true" /> Block</button>
            : <Link href="/access#block"><UserRoundX size={15} aria-hidden="true" /> Block</Link>}
        </nav>
      </div>
    </aside>
  );
}
