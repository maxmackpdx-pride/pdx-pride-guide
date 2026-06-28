import PageHero from "./PageHero";
import { spottedHeroProps } from "@/lib/spottedHero";

export default function MissedConnectionsHero() {
  return <PageHero {...spottedHeroProps()} />;
}