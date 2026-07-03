import PageHeader from "./PageHeader";
import { spottedHeroContent } from "@/lib/spottedHero";

export default function MissedConnectionsHero() {
  return (
    <PageHeader
      section="Boards"
      title="Spotted!"
      titleAccent="magenta"
      kicker={spottedHeroContent.kicker}
      lede={spottedHeroContent.lede}
      tagline={spottedHeroContent.tagline}
    />
  );
}