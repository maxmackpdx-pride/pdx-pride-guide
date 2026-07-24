import "./support.css";

/** Exact affiliate destinations - do not alter path or query. */
export const AFFILIATE_PARTNER_URLS = {
  cockblock: "https://cockblocktoys.com/tucker060",
  mrs: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
} as const;

export const AFFILIATE_PROMO_CODE = "TUCKERMAX";

type Props = {
  className?: string;
};

/**
 * Partner brand affiliate tiles - cyan left accent + neutral glass glow.
 * Logos sit on #050506 wells. Promo sticker on CockBlock only.
 */
export default function AffiliatePartners({ className = "" }: Props) {
  return (
    <div
      className={`support-affiliate about-v2-partners${className ? ` ${className}` : ""}`}
      data-testid="support-affiliate"
    >
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <p className="support-affiliate__kicker about-v2-partners__kicker">
        <span className="support-affiliate__star about-v2-partners__star" aria-hidden="true">
          *
        </span>{" "}
        Or shop through these links at these partner brands
      </p>
      <div className="support-affiliate__tiles about-v2-partners__tiles">
        <a
          className="support-affiliate__tile support-affiliate__tile--cockblock about-v2-partners__tile about-v2-partners__tile--cockblock"
          href={AFFILIATE_PARTNER_URLS.cockblock}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="support-affiliate__badge about-v2-partners__badge">
            10% OFF CODE: {AFFILIATE_PROMO_CODE}
          </span>
          <img
            src="/about/cockblock.png"
            alt="CockBlock Toys"
            className="support-affiliate__logo support-affiliate__logo--cockblock about-v2-partners__logo about-v2-partners__logo--cockblock"
            width={276}
            height={77}
            decoding="async"
          />
        </a>
        <a
          className="support-affiliate__tile support-affiliate__tile--mrs about-v2-partners__tile about-v2-partners__tile--mrs"
          href={AFFILIATE_PARTNER_URLS.mrs}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/about/mr-s-leather.png"
            alt="Mr. S Leather"
            className="support-affiliate__logo support-affiliate__logo--mrs about-v2-partners__logo about-v2-partners__logo--mrs"
            width={300}
            height={72}
            decoding="async"
          />
        </a>
      </div>
      <p className="support-affiliate__note about-v2-partners__note">
        Affiliate links. You pay the same, shop through this link, the guide gets a small cut. CockBlock:
        10% off with code{" "}
        <span className="support-affiliate__code about-v2-partners__code">{AFFILIATE_PROMO_CODE}</span>.
      </p>
    </div>
  );
}
