import { RIVER_BRATS_HOURS, formatRiverBratsHour } from "@shared/riverBrats";

type Props = {
  value: number | null;
  onChange: (hour: number) => void;
  accent: "cyan" | "orange";
};

export default function RiverBratsHourChips({ value, onChange, accent }: Props) {
  return (
    <div className={`rb-hour-chips rb-hour-chips--${accent}`} role="group" aria-label="Time">
      {RIVER_BRATS_HOURS.map(hour => (
        <button
          key={hour}
          type="button"
          className={`rb-hour-chip${value === hour ? " active" : ""}`}
          onClick={() => onChange(hour)}
        >
          {formatRiverBratsHour(hour)}
        </button>
      ))}
    </div>
  );
}