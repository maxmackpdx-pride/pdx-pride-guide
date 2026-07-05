import { BOARD_REJECT_REASONS } from "@shared/boardModeration";

type Props = {
  reasonCode: string;
  note: string;
  onReasonChange: (code: string) => void;
  onNoteChange: (note: string) => void;
  onReject: () => void;
  pending?: boolean;
  compact?: boolean;
};

export default function AdminBoardReject({
  reasonCode,
  note,
  onReasonChange,
  onNoteChange,
  onReject,
  pending,
  compact,
}: Props) {
  return (
    <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-2 border border-white/10 bg-black/30 p-3"}>
      <label className="display text-[10px] text-white/40 tracking-wide">SEND BACK — REASON</label>
      <select
        value={reasonCode}
        onChange={e => onReasonChange(e.target.value)}
        className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-red-500"
      >
        {BOARD_REJECT_REASONS.map(r => (
          <option key={r.code} value={r.code}>{r.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={e => onNoteChange(e.target.value)}
        placeholder="Optional note to poster (inbox)"
        className="w-full px-3 py-2 text-white text-sm border border-white/10 bg-black/40 focus:outline-none focus:border-red-500"
      />
      <button
        type="button"
        disabled={pending || !reasonCode}
        onClick={onReject}
        className="display text-xs px-4 py-2 border transition-all disabled:opacity-50 self-start"
        style={{ borderColor: "#FF2400", color: "#FF2400", background: "transparent" }}
      >
        {pending ? "SENDING BACK…" : "SEND BACK"}
      </button>
    </div>
  );
}