import { Link, useLocation } from "wouter";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import { findZAddress } from "@shared/zNamespace";

/**
 * A `z/` address that is spoken for but has no board behind it yet.
 *
 * These are reserved, not wrong, so sending a person to the 404 page would be a
 * lie: the address is real and the board is coming. Same shell as not-found so
 * there is no second layout to maintain, different copy because it is a
 * different situation.
 */
export default function ZAddressPending() {
  const [location] = useLocation();
  const path = location.split("?")[0].replace(/^\/z\//, "");
  const address = findZAddress(path);
  const display = address?.display ?? `z/${path}`;
  const isSellz = address?.path === "sellz";

  usePageSeo(
    `${display} | Zaylist`,
    isSellz
      ? "SELLZ is live on Zaylist with real listings and demo posts ready to browse."
      : `${display} is a Zaylist address. The board behind it is not built yet.`,
  );

  /*
   * Say one thing: the board is not built. Nothing about the address being
   * reserved, held, claimed, or available. Zaylist does not sell z/ addresses
   * and has approved no model in which it would, so this copy must never imply
   * otherwise.
   */
  const lede = isSellz
    ? "SELLZ is built and live. Browse the board for real listings and demo posts ready to list here."
    : `${address?.board ? `${address.board} is not built yet` : "This board is not built yet"}, so there is nothing here to show you. ${display} will be its address when it is.`;
  const clubsLiveInDirectory = address?.path === "squadz";

  return (
    <div className="zine-page board-page">
      <PageHero
        flipLightLeaks
        titleLine1={isSellz ? "LIVE NOW" : "NOT BUILT YET"}
        accent="magenta"
        lede={lede}
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 45%"
        actions={(
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {isSellz ? (
              <Link href="/sellz"><Button as="span" variant="solid">OPEN SELLZ</Button></Link>
            ) : null}
            {clubsLiveInDirectory ? (
              <Link href="/z/squadz"><Button as="span" variant="solid">OPEN MY SQUADZ</Button></Link>
            ) : (
              isSellz ? null : <Link href="/"><Button as="span" variant="solid">HOME</Button></Link>
            )}
            <Link href="/z"><Button as="span" accent="cyan">ALL Z/ ADDRESSES</Button></Link>
          </div>
        )}
      />
      {isSellz ? (
        <section className="board-path-card" style={{ maxWidth: 780, margin: "32px auto", padding: 24 }}>
          <p className="board-path-card__kicker">REAL BOARD, RIGHT NOW</p>
          <h2>SELLZ lives at /sellz.</h2>
          <p>The marketplace is built, live, and ready for listings, demo posts, and member handoffs.</p>
        </section>
      ) : clubsLiveInDirectory ? (
        <section className="board-path-card" style={{ maxWidth: 780, margin: "32px auto", padding: 24 }}>
          <p className="board-path-card__kicker">REAL DATA, RIGHT NOW</p>
          <h2>MY SQUADZ lives at z/squadz.</h2>
          <p>The board uses the real group listings and detail pages from the Portland Directory, including persistent follow controls.</p>
        </section>
      ) : null}
    </div>
  );
}
