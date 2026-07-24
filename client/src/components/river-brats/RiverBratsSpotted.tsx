import type { NudeBeachTab } from "@shared/nudeBeaches";
import MissedConnectionsPanel from "@/components/MissedConnectionsPanel";

type Props = {
  beachId: NudeBeachTab;
};

export default function RiverBratsSpotted({ beachId }: Props) {
  return (
    <div className="rb-panel rb-panel--spotted">
      <div className="rb-panel__intro">
        <h3 className="rb-panel__title">Missed Connections</h3>
        <p className="rb-panel__lede">
          Post who you spotted at the beach. You stay anonymous on the board - replies open a private
          inbox thread, and you only reveal when you&apos;re both ready. Notes also show on the main{" "}
          <a href="/spotted">Missed Connections</a> board.
        </p>
      </div>
      <MissedConnectionsPanel mode="beach" beachId={beachId} compact makeover />
    </div>
  );
}