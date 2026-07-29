import HeroAurora from "@/components/HeroAurora";

type Props = {
  /** Optional override if a future caller needs to inject stats elsewhere. */
  placeCount?: number;
};

/**
 * Directory page hero (2026-07-28 redesign).
 * Aurora + H1 lockup + lede + mono mantra. Stats live in the page band below.
 */
export default function DirectoryHero(_props: Props) {
  return (
    <section className="directory-hero" aria-labelledby="directory-hero-title">
      <div className="directory-hero__aurora" aria-hidden="true">
        <HeroAurora />
      </div>
      <div className="directory-hero__inner">
        <h1 id="directory-hero-title" className="directory-hero__title">
          Do business with
          <br />
          those of us on
          <img
            className="directory-hero__wordmark"
            src="/brand/kit/wordmark/zaylist-wordmark-neon.png"
            alt="Zaylist"
            width={560}
            height={120}
            decoding="async"
          />
        </h1>
        <div className="directory-hero__row">
          <p className="directory-hero__lede">
            Bars, food, cafes, venues, shops, and adult entertainment that are ours, or truly for us. Tune the spectrum, read the city, then go spend money there.
          </p>
          <p className="directory-hero__mantra">Show up · spend queer · keep them alive</p>
        </div>
      </div>
    </section>
  );
}
