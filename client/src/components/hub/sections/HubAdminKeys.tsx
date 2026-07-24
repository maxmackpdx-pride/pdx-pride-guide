import { Button } from "@/components/ds";
import { useInboxSheet } from "@/context/InboxSheetContext";
import "../hub-home.css";

type Props = {
  pendingCount: number;
  ownerCount?: number;
  isPrimaryOwner?: boolean;
  compact?: boolean;
};

export default function HubAdminKeys({
  pendingCount,
  ownerCount = 0,
  isPrimaryOwner = false,
  compact = false,
}: Props) {
  const { openSheet } = useInboxSheet();
  const hasAdminWork = pendingCount > 0;
  const hasOwnerWork = isPrimaryOwner && ownerCount > 0;

  if (compact) {
    return (
      <div
        className="hub-keys hub-keys--compact pdx-glass-rebind"
        style={{ padding: 16, ["--c" as string]: "var(--panel-magenta, #ff1fa0)" }}
      >
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-magenta)", marginBottom: 12 }}>
          Keyholder queues
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            className="ico"
            style={{ justifyContent: "space-between", width: "100%", color: "var(--panel-magenta)" }}
            onClick={() => openSheet({ view: "inbox", account: "admin" })}
          >
            <span>Shared admin queue</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
              {pendingCount > 0 ? pendingCount : "-"}
            </span>
          </button>
          {isPrimaryOwner && (
            <button
              type="button"
              className="ico"
              style={{ justifyContent: "space-between", width: "100%", color: "var(--panel-purple)" }}
              onClick={() => openSheet({ view: "inbox", account: "owner" })}
            >
              <span>Owner desk</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
                {ownerCount > 0 ? ownerCount : "-"}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section
      className="hub-keys pdx-glass-rebind"
      aria-label="Admin access"
      style={{ ["--c" as string]: "var(--panel-magenta, #ff1fa0)" }}
    >
      <div>
        <p className="hub-keys__kicker">You hold the keys</p>
        <p className="hub-keys__copy">
          <span className="hub-keys__n">{pendingCount}</span>
          {" "}in the shared review queue
          {isPrimaryOwner && (
            <>
              <span style={{ color: "#999" }}> · </span>
              <span className="hub-keys__n hub-keys__n--purple">{ownerCount}</span>
              {" "}on your owner desk
            </>
          )}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button
          accent="pink"
          variant="solid"
          size="sm"
          arrow
          onClick={() => openSheet({ view: "inbox", account: "admin" })}
        >
          {hasAdminWork ? `Admin queue (${pendingCount})` : "Admin queue"}
        </Button>
        {isPrimaryOwner && (
          <Button
            accent="purple"
            variant={hasOwnerWork ? "solid" : "ghost"}
            size="sm"
            arrow
            onClick={() => openSheet({ view: "inbox", account: "owner" })}
          >
            {hasOwnerWork ? `Owner desk (${ownerCount})` : "Owner desk"}
          </Button>
        )}
      </div>
    </section>
  );
}