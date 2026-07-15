import { Button } from "@/components/ds";
import { useTipLinks } from "@/hooks/useTipLinks";
import "./TipSupport.css";

type Variant = "about" | "footer" | "compact";

type Props = {
  variant?: Variant;
  className?: string;
};

/**
 * Venmo + optional Stripe (card / Apple Pay / Google Pay) tip CTAs.
 * Stripe appears only when STRIPE_PAYMENT_LINK is set on the server.
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
            aria-label={`Tip on Venmo @${venmoHandle}`}
          >
            Venmo tip
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
          Venmo @{venmoHandle}
          {applePayReady ? " · Apple Pay & cards via Stripe" : ""}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`tip-support tip-support--compact${className ? ` ${className}` : ""}`}>
        <a href={venmoUrl} target="_blank" rel="noopener noreferrer">
          <Button as="span" variant="solid" accent="lime" size="sm">
            Venmo
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

  // about (default)
  return (
    <div className={`tip-support tip-support--about${className ? ` ${className}` : ""}`}>
      <div className="tip-support__btns">
        <a href={venmoUrl} target="_blank" rel="noopener noreferrer" data-testid="link-donate-venmo">
          <Button as="span" variant="solid" accent="lime" size="lg">
            Venmo · Buy me a coffee
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
        @{venmoHandle} on Venmo
        {applePayReady
          ? " · Card, Apple Pay, and Google Pay open in a secure Stripe checkout"
          : " · Card / Apple Pay link can be turned on with a Stripe Payment Link"}
        {" · "}
        better yet, hire me.
      </p>
    </div>
  );
}
