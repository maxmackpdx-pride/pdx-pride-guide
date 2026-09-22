import { useLocation } from "wouter";
import PageRecovery from "@/components/PageRecovery";
import { usePageSeo } from "@/hooks/usePageSeo";

const ROOMS = [
  { paths: ["events", "schedule", "submit"], section: "Eventz", href: "/events", label: "Browse Eventz", description: "This event address is no longer available. Find upcoming parties, shows, and gatherings on Eventz." },
  { paths: ["outz", "outzide"], section: "Outzide", href: "/outzide", label: "Explore Outzide", description: "This outdoor destination isn't at this address. Explore the Northwest map to find your next spot." },
  { paths: ["z"], section: "Z/ List", href: "/z", label: "Find a community", description: "This community address isn't available. Find your people in Z/ List." },
  { paths: ["the-hauz", "hausing", "housing"], section: "The Haüz", href: "/the-hauz", label: "Browse housing", description: "This housing address isn't available. Browse current rooms, roommates, and households on The Haüz." },
  { paths: ["u", "dashboard", "inbox", "settings"], section: "Your Zaylist", href: "/dashboard", label: "Open your Hub", description: "This account or profile address isn't available. Your Hub is the place to return to your Zaylist." },
  { paths: ["map", "directory", "gifting", "sellz", "pride-work", "spotted"], section: "Mapz", href: "/map", label: "Explore Mapz", description: "This address isn't on the map. Explore places, posts, and people around Portland on Mapz." },
];

export default function NotFound() {
  const [location] = useLocation();
  const segment = location.split("?")[0].split("/")[1];
  const room = ROOMS.find(room => room.paths.includes(segment));
  usePageSeo("Page not found | Zaylist", "Find your way back to Zaylist's events, maps, and communities.");
  return <PageRecovery section={room?.section || "Zaylist · 404"} title="A wrong turn. Still among friends."
    description={room?.description || "This page may have moved, or the link may be incomplete. Start at home to find events, places, and your people."}
    href={room?.href || "/"} label={room?.label || "Explore Zaylist"} />;
}
