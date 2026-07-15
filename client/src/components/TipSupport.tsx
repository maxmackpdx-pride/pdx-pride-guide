import { Button } from "@/components/ds";
import { useTipLinks } from "@/hooks/useTipLinks";
import "./TipSupport.css";

type Variant = "about" | "footer" | "compact";

type Props = {
  variant?: Variant;
  className?: string;
};

/**
 * Direct Venmo tip (pay composer) + optional Stripe (card / Apple Pay).
 * Venmo never needs Stripe or a special merchant setup.
 */
export default function TipSupport({ variant = "about", className = "" }: Props) {
  const { venmoUrl, venmoHandle, stripePaymentLink, applePayReady } = useTipLinks();

  if (variant === "footer") {
    return (
      <div className={`tip-support tip-support--footer${className ? ` ${className}` : ""}`}>
        <p className="site-footer__coffee-note tip-support__lede">
          Free forever, but not free to run.
        </p>
        <div className="tip-support__btns tip-support__btns--footer">
          <a
            href={venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__coffee-btn"
            data-testid="footer-buy-coffee-venmo"
            aria-label={`Buy me a coffee on Venmo @${venmoHandle}`}
          >
            Buy me a coffee
          </a>
          {applePayReady && stripePaymentLink ? (
            <a
              href={stripePaymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__coffee-btn tip-support__btn--stripe-footer"
              data-testid="footer-buy-coffee-stripe"
              aria-label="Tip with card or Apple Pay"
            >
              Card / Apple Pay
            </a>
          ) : null}
        </div>
        <p className="site-footer__coffee-handle">
          Opens Venmo · @{venmoHandle}
          {applePayReady ? " · or Apple Pay via Stripe" : ""}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`tip-support tip-support--compact${className ? ` ${className}` : ""}`}>
        <a
          href={venmoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buy me a coffee on Venmo @${venmoHandle}`}
        >
          <Button as="span" variant="solid" accent="lime" size="sm">
            Coffee · Venmo
          </Button>
        </a>
        {applePayReady && stripePaymentLink ? (
          <a href={stripePaymentLink} target="_blank" rel="noopener noreferrer">
            <Button as="span" variant="neon" accent="cyan" size="sm">
              Apple Pay
            </Button>
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`tip-support tip-support--about${className ? ` ${className}` : ""}`}>
      <div className="tip-support__btns">
        <a
          href={venmoUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-donate-venmo"
          aria-label={`Buy me a coffee on Venmo @${venmoHandle}`}
        >
          <Button as="span" variant="solid" accent="lime" size="lg">
            Buy me a coffee · Venmo
          </Button>
        </a>
        {applePayReady && stripePaymentLink ? (
          <a
            href={stripePaymentLink}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-donate-stripe"
          >
            <Button as="span" variant="neon" accent="cyan" size="lg">
              Card / Apple Pay
            </Button>
          </a>
        ) : null}
      </div>
      <p className="tip-support__note about-v2-donate__note">
        One tap opens Venmo to pay @{venmoHandle} (note: Pride Guide).
        {applePayReady
          ? " Card / Apple Pay uses Stripe when you prefer that."
          : " Apple Pay later = Stripe Payment Link (optional)."}
        {" "}
        Better yet, hire me.
      </p>
    </div>
  );
}
