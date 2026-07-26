import TipSupport from "@/components/TipSupport";
import "./support.css";

type Props = {
  className?: string;
};

/**
 * Keep-this-guide-alive panel - neutral deep-glass card + TipSupport CTAs.
 * Surface only; payment URLs / Stripe gating live in TipSupport + useTipLinks.
 */
export default function SupportPanel({ className = "" }: Props) {
  return (
    <div
      className={`support-keepalive about-v2-donate about-v2-donate--panel${className ? ` ${className}` : ""}`}
      data-testid="support-keepalive"
    >
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <div className="support-keepalive__copy about-v2-donate__copy">
        <h3 className="support-keepalive__title about-v2-donate__h3">
          Keep this guide <span className="support-keepalive__alive">alive</span>
        </h3>
        <p>
          Servers and domains cost money. Time costs the most. If this pointed you toward one good
          night, chip in so browsing can stay free for the next person. Venmo is one tap. Card and
          Apple Pay use a secure Stripe checkout when it is turned on. Local businesses can also
          sponsor — see Sponsors.
        </p>
      </div>
      <div className="support-keepalive__cta about-v2-donate__cta">
        <TipSupport variant="about" />
      </div>
    </div>
  );
}
