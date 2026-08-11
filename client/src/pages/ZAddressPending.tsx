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

  usePageSeo(
    `${display} | Zaylist`,
    `${display} is a Zaylist address. The board behind it is not built yet.`,
  );

  return (
    <div className="zine-page board-page min-h-screen">
      <PageHero
        flipLightLeaks
        titleLine1="NOT BUILT YET"
        accent="magenta"
        lede={`${display} is a real Zaylist address${address?.board ? ` for ${address.board}` : ""}. There is no board behind it yet, so there is nothing here to show you. It is held so nobody else takes it.`}
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 45%"
        actions={(
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/"><Button as="span" variant="solid">HOME</Button></Link>
            <Link href="/events"><Button as="span" accent="cyan">EVENTS</Button></Link>
          </div>
        )}
      />
    </div>
  );
}
