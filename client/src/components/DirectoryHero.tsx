import HeroAurora from "@/components/HeroAurora";

type Props = {
  /** Optional override if a future caller needs to inject stats elsewhere. */
  placeCount?: number;
  /** The group-filtered directory is publicly branded as MY SQUADZ. */
  squadz?: boolean;
};

/**
 * Directory page hero (2026-07-28 redesign).
 * Aurora + H1 lockup + lede + mono mantra. Stats live in the page band below.
 */
export default function DirectoryHero({ squadz = false }: Props) {
  const brand = squadz ? "MY SQUADZ" : "OUR PLACEZ";
  const logo = squadz
    ? "/brand/family/my-squadz.svg"
    : "/brand/family/our-placez.svg";

  return (
    <section className="directory-hero" aria-labelledby="directory-hero-title">
      <div className="directory-hero__aurora" aria-hidden="true">
        <HeroAurora />
      </div>
      <div className="directory-hero__inner">
        <h1 id="directory-hero-title" className="directory-hero__title">
          <img
            className="directory-hero__wordmark"
            src={logo}
            alt={brand}
            decoding="async"
          />
        </h1>
        <div className="directory-hero__row">
          <p className="directory-hero__lede">
            {squadz
              ? "Clubs, crews, nonprofits, and community groups building queer Portland. Find your people, follow their work, and show up for what they make possible."
              : "Bars, food, cafes, venues, shops, and adult entertainment that are ours, or truly for us. Tune the spectrum, read the city, then go spend money there."}
          </p>
          <p className="directory-hero__mantra">
            {squadz ? "Find your people · follow their work · show up" : "Show up · spend queer · keep them alive"}
          </p>
        </div>
      </div>
    </section>
  );
}
