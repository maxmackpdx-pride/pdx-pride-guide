import HubReader from "../HubReader";

/** Compatibility for account routes; Hub is served by the shared panel reader. */
export default function HubFeed({ canPostToFeed = false }: { canPostToFeed?: boolean }) {
  return <HubReader canPostToFeed={canPostToFeed} />;
}
