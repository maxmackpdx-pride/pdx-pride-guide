import type { NudeBeachTab } from "@shared/nudeBeaches";
import MissedConnectionsPanel from "@/components/MissedConnectionsPanel";

type Props = {
  beachId: NudeBeachTab;
};

export default function RiverBratsSpotted({ beachId }: Props) {
  return (
    <div className="rb-panel rb-panel--spotted">
      <p className="rb-panel__lede">
        Beach missed connections tie back to the main <a href="/spotted">Spotted</a> board. You stay anonymous until you both reveal in inbox.
      </p>
      <MissedConnectionsPanel mode="beach" beachId={beachId} compact makeover />
    </div>
  );
}